import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { asSettings } from '../types/settings';
import { escapeHtml, sendMail } from '../services/mailer';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Calendar day in India time, e.g. "2026-11-08". */
export function istDay(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** A streak is at risk when the learner last practised yesterday (IST) and not yet today. */
export function isStreakAtRisk(lastActiveAt: Date, streak: number, now = new Date()): boolean {
  if (streak < 1) return false;
  const yesterday = istDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  return istDay(lastActiveAt) === yesterday;
}

/**
 * Emails learners whose streak will break tonight. Respects the Notifications
 * setting, skips deleted accounts, and sends at most one reminder per day.
 * Returns how many emails were sent.
 */
export async function sendStreakReminders(now = new Date()): Promise<number> {
  const today = istDay(now);
  const since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const candidates = await prisma.user.findMany({
    where: { deletedAt: null, streak: { gte: 1 }, lastActiveAt: { gte: since } },
    select: { id: true, email: true, displayName: true, streak: true, lastActiveAt: true, settings: true },
  });

  let sent = 0;
  for (const u of candidates) {
    const settings = asSettings(u.settings) as ReturnType<typeof asSettings> & { streakReminderSentOn?: string };
    if (!settings.notifications || settings.streakReminderSentOn === today) continue;
    if (!isStreakAtRisk(u.lastActiveAt, u.streak, now)) continue;

    const link = `${env.WEB_URL}/dashboard`;
    const ok = await sendMail({
      to: u.email,
      subject: `🔥 ${u.streak} din ki streak bachao!`,
      text: `Namaste ${u.displayName}!\n\nAapki ${u.streak} din ki streak aaj raat khatam ho jayegi. Sirf 5 minute practice karo aur streak bachao:\n${link}\n\nReminders band karne ke liye: Settings → Notifications.\n\n— Kiki, KijiTalk`,
      html: `<p>Namaste ${escapeHtml(u.displayName)}!</p><p>Aapki <b>${u.streak} din</b> ki streak aaj raat khatam ho jayegi. Sirf 5 minute practice karo aur streak bachao 🔥</p><p><a href="${link}">Abhi practice karo</a></p><p style="color:#64748b;font-size:12px">Reminders band karne ke liye: Settings → Notifications.</p>`,
    });
    // Mark as handled even when SMTP is unset, so a misconfigured server can't
    // repeat the same reminder every few minutes once mail starts working.
    await prisma.user.update({
      where: { id: u.id },
      data: { settings: { ...settings, streakReminderSentOn: today } },
    });
    if (ok) sent += 1;
  }
  logger.info(`Streak reminders: ${sent} sent, ${candidates.length} checked`);
  return sent;
}

// Postgres advisory lock id: only one API instance runs a job at a time.
const LOCK_ID = 774_201;

/** Runs `job` only if no other instance is running it right now. */
export async function withJobLock<T>(job: () => Promise<T>): Promise<T | null> {
  const [row] = await prisma.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_lock(${LOCK_ID}) AS locked`;
  if (!row?.locked) return null;
  try {
    return await job();
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${LOCK_ID})`;
  }
}

/** In-process daily scheduler: sends reminders once a day after 7 pm IST. */
export function startScheduler(): void {
  let lastRunDay = '';
  const tick = async () => {
    const now = new Date();
    const istHour = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
    const day = istDay(now);
    if (istHour < 19 || lastRunDay === day) return;
    lastRunDay = day;
    await withJobLock(() => sendStreakReminders(now)).catch((error) => logger.error('Streak reminder job failed', error));
  };
  setInterval(() => void tick(), 10 * 60 * 1000).unref();
  logger.info('⏰ Scheduler on: streak reminders daily after 7 pm IST');
}

import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { toPublicUser } from '../utils/publicUser';
import { logger } from '../utils/logger';

/**
 * Everything the Node API stores about a learner, as one JSON document
 * (DPDP Act 2023 — right to access). Embedding vectors are left out: they are
 * derived numbers, not information about the learner.
 */
export async function exportLearnerData(user: User) {
  const [progress, chatSessions, mistakes, payments, subscriptions, invoices] = await Promise.all([
    prisma.progress.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        activityType: true,
        minutesSpent: true,
        score: true,
        pronunciationScore: true,
        lessonId: true,
        metadata: true,
      },
    }),
    prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        title: true,
        type: true,
        roleplayId: true,
        createdAt: true,
        messages: {
          orderBy: { timestamp: 'asc' },
          select: { role: true, content: true, corrections: true, timestamp: true },
        },
      },
    }),
    prisma.mistakeLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { original: true, corrected: true, topic: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      select: { amountInr: true, status: true, razorpayPaymentId: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      select: { status: true, currentStart: true, currentEnd: true, cancelAtPeriodEnd: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      select: { number: true, issuedAt: true, description: true, totalPaise: true },
    }),
  ]);

  const { aiMessagesToday, aiUsageResetAt, ...profile } = toPublicUser(user);
  return {
    profile,
    usage: { aiMessagesToday, aiUsageResetAt },
    progress,
    chatSessions,
    mistakes,
    payments,
    subscriptions,
    invoices,
  };
}

/**
 * Erases a learner's personal data (DPDP Act 2023 — right to erasure).
 *
 * Practice history, chats and mistakes are deleted outright. The users row is
 * kept but anonymised, because payments and GST invoices must be retained for
 * tax law and need an owner; those invoice records keep the buyer details they
 * were issued with, which the Privacy Policy explains.
 */
export async function eraseLearner(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return false;

  await prisma.$transaction([
    prisma.progress.deleteMany({ where: { userId: user.id } }),
    prisma.chatSession.deleteMany({ where: { userId: user.id } }), // messages cascade
    prisma.mistakeLog.deleteMany({ where: { userId: user.id } }),
    prisma.aiUsageLog.updateMany({ where: { userId: user.id }, data: { userId: null } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: `deleted+${user.id}@deleted.kijitalk.invalid`,
        displayName: 'Deleted learner',
        avatarUrl: null,
        passwordHash: null,
        googleId: null,
        firebaseUid: null,
        grade: null,
        board: null,
        state: null,
        learningGoal: null,
        onboardingCompleted: false,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        streak: 0,
        totalMinutes: 0,
        lessonsCompleted: 0,
        xp: 0,
        coins: 0,
        level: 1,
        badges: [],
        settings: {},
        deletedAt: new Date(),
      },
    }),
  ]);

  logger.info(`Learner profile ${user.id} erased on request`);
  return true;
}

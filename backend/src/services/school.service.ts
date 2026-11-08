import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// No 0/O/1/I, so codes are easy to read out in a classroom.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeJoinCode(): string {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export async function uniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = makeJoinCode();
    if (!(await prisma.classroom.findUnique({ where: { joinCode: code } }))) return code;
  }
  throw new Error('Could not generate a unique class code');
}

/** Distinct students enrolled across a school's classes (each takes one seat). */
export async function seatsUsed(schoolId: string): Promise<number> {
  const rows = await prisma.classMember.findMany({
    where: { classroom: { schoolId } },
    distinct: ['userId'],
    select: { userId: true },
  });
  return rows.length;
}

/** Recomputes the Premium-through-school date for one learner. */
export async function refreshSchoolLicense(userId: string): Promise<void> {
  const memberships = await prisma.classMember.findMany({
    where: { userId },
    select: { classroom: { select: { school: { select: { licenseExpiresAt: true } } } } },
  });
  const best = memberships
    .map((m) => m.classroom.school.licenseExpiresAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  await prisma.user.update({ where: { id: userId }, data: { schoolLicenseUntil: best ?? null } });
}

export async function refreshSchoolLicenses(schoolId: string): Promise<void> {
  const members = await prisma.classMember.findMany({
    where: { classroom: { schoolId } },
    distinct: ['userId'],
    select: { userId: true },
  });
  for (const m of members) await refreshSchoolLicense(m.userId);
}

/** True when the user is staff (owner/teacher) of the school that runs this class. */
export async function canManageClass(userId: string, classroomId: string): Promise<boolean> {
  const cls = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { schoolId: true } });
  if (!cls) return false;
  return !!(await prisma.schoolStaff.findUnique({ where: { schoolId_userId: { schoolId: cls.schoolId, userId } } }));
}

export interface InviteInput {
  name: string;
  email: string;
  isMinor?: boolean;
  parentEmail?: string;
}

/**
 * Creates a login for a student the school added (auth-service emails them a
 * link to set their password) and a learner profile, ready to enrol. Existing
 * accounts are reused. Terms and parental consent are still collected from the
 * student/parent on first sign-in.
 */
export async function inviteStudent(input: InviteInput): Promise<{ userId: string; createdLogin: boolean }> {
  const email = input.email.trim().toLowerCase();
  let createdLogin = false;
  if (env.INTERNAL_API_KEY) {
    const res = await fetch(`${env.AUTH_SERVICE_URL}/internal/accounts/invite/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': env.INTERNAL_API_KEY },
      body: JSON.stringify({ email, display_name: input.name }),
    });
    if (!res.ok) throw new Error(`auth-service invite failed (${res.status})`);
    createdLogin = ((await res.json()) as { created?: boolean }).created === true;
  } else {
    logger.warn('INTERNAL_API_KEY unset — invited student gets a profile but no login email');
  }
  const profile = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: input.name.trim() || 'Learner' },
    select: { id: true },
  });
  return { userId: profile.id, createdLogin };
}

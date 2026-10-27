import type { User } from '@prisma/client';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function updateStreak(user: User): void {
  const today = startOfDay(new Date());
  const lastActive = startOfDay(user.lastActiveAt ?? new Date(0));
  const diffDays = Math.round((today.getTime() - lastActive.getTime()) / 86400000);

  if (diffDays === 0) {
    // Already practiced today — keep streak
  } else if (diffDays === 1) {
    user.streak = Math.max(1, user.streak + 1);
  } else {
    user.streak = 1;
  }

  user.lastActiveAt = new Date();
}

export function recordUserActivity(user: User, minutesSpent: number): void {
  updateStreak(user);
  user.totalMinutes += minutesSpent;
}

export function getTodayMinutes(
  records: Array<{ date: Date; minutesSpent: number }>
): number {
  const today = startOfDay(new Date());
  return records
    .filter((r) => startOfDay(r.date).getTime() === today.getTime())
    .reduce((sum, r) => sum + r.minutesSpent, 0);
}

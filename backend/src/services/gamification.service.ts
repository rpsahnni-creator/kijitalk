import type { User } from '@prisma/client';

const XP_PER_LEVEL = 500;

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function awardActivity(
  user: User,
  activity: 'lesson' | 'chat' | 'roleplay' | 'voice' | 'call' | 'debate',
  score = 80
): { xpEarned: number; coinsEarned: number; leveledUp: boolean; newBadges: string[] } {
  const xpMap: Record<string, number> = {
    lesson: 100,
    chat: 15,
    roleplay: 40,
    voice: 30,
    call: 25,
    debate: 50,
  };

  const xpEarned = Math.round((xpMap[activity] ?? 10) * (score / 100));
  const coinsEarned = Math.max(1, Math.round(xpEarned / 10));

  user.xp += xpEarned;
  user.coins += coinsEarned;

  const newBadges: string[] = [];
  if (user.xp >= 100 && !user.badges.includes('first_100_xp')) {
    user.badges.push('first_100_xp');
    newBadges.push('first_100_xp');
  }
  if (user.streak >= 7 && !user.badges.includes('week_streak')) {
    user.badges.push('week_streak');
    newBadges.push('week_streak');
  }
  if (user.lessonsCompleted >= 10 && !user.badges.includes('ten_lessons')) {
    user.badges.push('ten_lessons');
    newBadges.push('ten_lessons');
  }

  let leveledUp = false;
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level += 1;
    leveledUp = true;
  }

  return { xpEarned, coinsEarned, leveledUp, newBadges };
}

export function useStreakFreeze(user: User): boolean {
  if (user.streakFreezes <= 0) return false;
  user.streakFreezes -= 1;
  return true;
}

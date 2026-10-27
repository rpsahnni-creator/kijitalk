export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'first_100_xp', label: 'Century', description: '100 XP earn kiya', emoji: '🌟' },
  { id: 'week_streak', label: 'Week Warrior', description: '7 din lagatar practice', emoji: '🔥' },
  { id: 'ten_lessons', label: 'Lesson Master', description: '10 lessons complete kiye', emoji: '📚' },
  { id: 'avatar_gold', label: 'Gold Avatar', description: 'Shop se gold ring kharida', emoji: '🥇' },
  { id: 'theme_ocean', label: 'Ocean Theme', description: 'Ocean theme unlock kiya', emoji: '🌊' },
];

export function getBadge(id: string): BadgeDef {
  return BADGES.find((b) => b.id === id) ?? { id, label: id, description: '', emoji: '🏅' };
}

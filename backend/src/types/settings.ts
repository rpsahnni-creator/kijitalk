export interface UserSettings {
  [key: string]: unknown;
  darkMode: boolean;
  notifications: boolean;
  dailyGoalMinutes: number;
  hindiLabels: boolean;
  voiceSpeed: number;
  accent: 'indian' | 'british' | 'american';
}

export const DEFAULT_SETTINGS: UserSettings = {
  darkMode: false,
  notifications: true,
  dailyGoalMinutes: 15,
  hindiLabels: true,
  voiceSpeed: 0.9,
  accent: 'indian',
};

export function asSettings(json: unknown): UserSettings {
  return { ...DEFAULT_SETTINGS, ...((json as Partial<UserSettings>) ?? {}) };
}

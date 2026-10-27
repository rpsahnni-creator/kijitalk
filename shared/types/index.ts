/** Shared types — web, mobile, backend */

export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';
export type Accent = 'indian' | 'british' | 'american';
export type ActivityType = 'lesson' | 'chat' | 'roleplay' | 'voice' | 'call' | 'debate';
export type LearningMode =
  | 'chat'
  | 'call'
  | 'voice'
  | 'roleplay'
  | 'lesson'
  | 'debate'
  | 'course'
  | 'progress';

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  dailyGoalMinutes: number;
  hindiLabels?: boolean;
  voiceSpeed: number;
  accent: Accent;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  nativeLanguage: string;
  targetLevel: EnglishLevel;
  grade?: string;
  board?: string;
  state?: string;
  learningGoal?: string;
  onboardingCompleted: boolean;
  streak: number;
  streakFreezes: number;
  totalMinutes: number;
  lessonsCompleted: number;
  xp: number;
  coins: number;
  level: number;
  badges: string[];
  settings: UserSettings;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  corrections?: string[];
  translation?: string;
  wasHindi?: boolean;
  timestamp?: string;
}

export interface LessonExercise {
  type: 'repeat' | 'fill-blank' | 'translate';
  prompt: string;
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  durationMinutes: number;
  tags?: string[];
  gradeBand?: string;
  content: {
    vocabulary: string[];
    phrases: string[];
    exercises: LessonExercise[];
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  lessonCount: number;
  progressPercent: number;
  lessonIds: string[];
}

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  openingLine: string;
  goals: string[];
  estimatedMinutes: number;
}

export interface DashboardStats {
  streak: number;
  totalMinutes: number;
  todayMinutes: number;
  lessonsCompleted: number;
  avgScore: number;
  dailyGoal: number;
  xp: number;
  coins: number;
  level: number;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  xp: number;
  streak: number;
}

export interface DebateTopic {
  id: string;
  topic: string;
  forMotion: string;
  againstMotion: string;
  level: EnglishLevel;
}

export interface ApiError {
  error: string;
  code?: string;
}

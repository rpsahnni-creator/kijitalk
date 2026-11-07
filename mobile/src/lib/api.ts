import type { Exercise } from './exercise';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4001';
/** auth-service (Django): sign-in, sessions, passwords, email verification. */
export const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:8100';

export interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public limitReached = false,
    public usage?: UsageStatus
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Registered by the auth store: on a 401 the request gets a new access token
// and is retried once.
let accessTokenRefresher: (() => Promise<string | null>) | null = null;
export function setAccessTokenRefresher(fn: (() => Promise<string | null>) | null) {
  accessTokenRefresher = fn;
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({ error: res.statusText }));
  return new ApiError(res.status, body.error ?? 'Request failed', body.limitReached === true, body.usage);
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null, retried = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401 && token && !retried && accessTokenRefresher) {
    const fresh = await accessTokenRefresher();
    if (fresh) return request<T>(path, options, fresh, true);
  }
  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, {}, token),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
};

/** Calls auth-service as a mobile client: no cookies, refresh token in the body. */
export async function authRequest<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-KT-Client': 'mobile' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${AUTH_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}

export interface AuthAccount {
  id: number;
  email: string;
  displayName: string;
  emailVerified: boolean;
  hasPassword: boolean;
}

export interface AuthSession {
  access: string;
  refresh: string;
  user: AuthAccount;
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  nativeLanguage?: string;
  targetLevel?: string;
  grade?: string;
  board?: string;
  state?: string;
  learningGoal?: string;
  onboardingCompleted?: boolean;
  streak: number;
  totalMinutes: number;
  lessonsCompleted: number;
  xp?: number;
  coins?: number;
  level?: number;
  badges?: string[];
  streakFreezes?: number;
  settings: {
    darkMode: boolean;
    notifications: boolean;
    dailyGoalMinutes: number;
    hindiLabels?: boolean;
    voiceSpeed?: number;
    accent?: 'indian' | 'british' | 'american';
  };
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  durationMinutes: number;
  tags?: string[];
  gradeBand?: string;
  recommended?: boolean;
  vocabulary: string[];
  phrases: string[];
  exercises: Exercise[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  lessonCount: number;
  progressPercent: number;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  imageUrl: string;
  openingLine: string;
  goals: string[];
  estimatedMinutes: number;
}

export interface DebateTopic {
  id: string;
  topic: string;
  level: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  corrections?: string[];
  translation?: string;
  wasHindi?: boolean;
  teachingTip?: string | null;
  timestamp?: string;
}

export type TutorEngine = 'gemini' | 'claude';

export interface TutorEngines {
  gemini: boolean;
  claude: boolean;
}

export interface DashboardData {
  stats: {
    streak: number;
    totalMinutes: number;
    todayMinutes: number;
    lessonsCompleted: number;
    avgScore: number;
    dailyGoal: number;
    xp?: number;
    coins?: number;
    level?: number;
    badges?: string[];
    streakFreezes?: number;
  };
  dailyPhrase?: {
    english: string;
    hindi: string;
    category: string;
    tip: string;
  };
  dailyStats: Array<{ date: string; minutes: number; avgScore: number }>;
  activityBreakdown: Array<{ type: string; count: number }>;
  recentActivity: Array<{
    id: string;
    activityType: string;
    score: number;
    minutesSpent: number;
    pronunciationScore?: number | null;
    date: string;
    lessonId?: string | null;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  xp: number;
  streak: number;
}

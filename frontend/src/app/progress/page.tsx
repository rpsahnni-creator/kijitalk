'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BookOpen, MessageCircle, Mic, Phone, Swords, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore } from '@/stores/useStore';
import { api, DashboardData } from '@/lib/api';
import { t } from '@/lib/i18n';
import { BADGES } from '@/lib/badges';

const PIE_COLORS = ['#157a37', '#fdc403', '#46c727', '#b88e00', '#0b4620', '#ffe58a'];
const ACTIVITY_LABELS: Record<string, string> = {
  chat: 'Kiki Chat',
  lesson: 'Lessons',
  roleplay: 'Roleplay',
  voice: 'Voice',
  call: 'Call',
  debate: 'Debate',
};
const ACTIVITY_ICONS: Record<string, typeof MessageCircle> = {
  chat: MessageCircle,
  lesson: BookOpen,
  roleplay: Users,
  voice: Mic,
  call: Phone,
  debate: Swords,
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86400000
  );
  if (diffDays === 0) return 'Aaj · ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Kal';
  if (diffDays < 7) return `${diffDays} din pehle`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ProgressPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; displayName: string; xp: number; streak: number }>>([]);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (!token) return;
    api.get<DashboardData>('/api/progress/dashboard', token).then(setData).catch(console.error);
    api.get<{ leaderboard: typeof leaderboard }>('/api/gamification/leaderboard', token).then((d) => setLeaderboard(d.leaderboard)).catch(console.error);
  }, [token]);

  if (!initialized || !user) return <LoadingScreen />;

  const todayMinutes = data?.stats.todayMinutes ?? 0;
  const dailyGoal = data?.stats.dailyGoal ?? 15;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">{t('progress')}</h1>
          <p className="text-slate-500">Pichle 30 din ki learning journey</p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Streak', value: `${data?.stats.streak ?? 0} din` },
            { label: 'Aaj', value: `${todayMinutes} min` },
            { label: 'Total', value: `${data?.stats.totalMinutes ?? 0} min` },
            { label: 'Avg Score', value: `${data?.stats.avgScore ?? 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-3xl font-bold text-brand-600">{value}</p>
            </div>
          ))}
        </div>

        <div className="card mb-8">
          <h2 className="mb-4 font-semibold">🏅 Badges</h2>
          <div className="flex flex-wrap gap-3">
            {BADGES.map((badge) => {
              const earned = (data?.stats.badges ?? []).includes(badge.id);
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                    earned
                      ? 'border-accent-200 bg-accent-50 dark:border-accent-800 dark:bg-accent-900/20'
                      : 'border-slate-200 bg-slate-50 opacity-50 grayscale dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{badge.emoji}</span>
                  <span className="font-medium">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 font-semibold">Roz ka practice (minutes)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.dailyStats ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#157a37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">Kya practice kiya?</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.activityBreakdown ?? []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ type, count }) => `${ACTIVITY_LABELS[type] ?? type}: ${count}`}
                >
                  {(data?.activityBreakdown ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <div className="space-y-2">
            {(data?.recentActivity ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Abhi tak koi activity nahi — pehla lesson shuru karo!</p>
            )}
            {(data?.recentActivity ?? []).map((item) => {
              const Icon = ACTIVITY_ICONS[item.activityType] ?? MessageCircle;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-700"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ACTIVITY_LABELS[item.activityType] ?? item.activityType}</p>
                    <p className="text-xs text-slate-500">{formatRelativeDate(item.date)} · {item.minutesSpent} min</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.score >= 80
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : item.score >= 50
                        ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="mb-4 font-semibold">🏆 Weekly Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.length === 0 && <p className="text-sm text-slate-500">No activity this week yet.</p>}
            {leaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-700">
                <span className="font-medium">#{entry.rank} {entry.displayName}</span>
                <span className="text-sm text-brand-600">{entry.xp} XP · {entry.streak}🔥</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">{t('practiceGoal')}</h2>
          <div className="mb-2 flex justify-between text-sm">
            <span>Aaj {todayMinutes} min practice</span>
            <span>Goal: {dailyGoal} min</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full gradient-hero transition-all"
              style={{
                width: `${Math.min(100, (todayMinutes / dailyGoal) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

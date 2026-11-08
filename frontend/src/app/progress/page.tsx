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
import { BarChart3, BookOpen, MessageCircle, Mic, Phone, Swords, Users, Activity, PieChart as PieIcon, Trophy } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { FeatureIcon } from '@/components/FeatureIcon';
import { api, DashboardData } from '@/lib/api';
import { t } from '@/lib/i18n';
import { BADGES } from '@/lib/badges';

const PIE_COLORS = ['#dc143c', '#006400', '#e5e500', '#fb5274', '#45bd49', '#82112d'];
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
  const darkMode = useSettingsStore((s) => s.darkMode);
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
  const dailyGoal = Math.max(1, data?.stats.dailyGoal ?? 15);
  const dailyStats = data?.dailyStats ?? [];
  const hasDailyMinutes = dailyStats.some((d) => d.minutes > 0);
  const breakdown = (data?.activityBreakdown ?? []).filter((a) => a.count > 0);
  const axisColor = darkMode ? '#64748b' : '#94a3b8';
  const gridColor = darkMode ? '#1e293b' : '#f1f5f9';
  const tooltipStyle = {
    borderRadius: 12,
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    background: darkMode ? '#0f172a' : '#ffffff',
    color: darkMode ? '#f1f5f9' : '#0f172a',
    fontSize: 12,
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader feature="progress" title={t('progress')} subtitle="Pichle 30 din ki learning journey" />

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Streak', value: `${data?.stats.streak ?? 0} din` },
            { label: 'Aaj', value: `${todayMinutes} min` },
            { label: 'Total', value: `${data?.stats.totalMinutes ?? 0} min` },
            { label: 'Avg Score', value: `${data?.stats.avgScore ?? 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
              {data ? (
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{value}</p>
              ) : (
                <Skeleton className="mt-2 h-8 w-20" />
              )}
            </div>
          ))}
        </div>

        <div id="badges" className="card mb-8 scroll-mt-20">
          <h2 className="section-title flex items-center gap-2"><FeatureIcon name="badges" size={28} /> Badges</h2>
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
            <h2 className="section-title">Roz ka practice (minutes)</h2>
            {!data ? (
              <Skeleton className="h-[250px]" />
            ) : !hasDailyMinutes ? (
              <EmptyState compact icon={Activity} title="Abhi koi practice record nahi" description="Ek lesson ya chat karo — yahan roz ka graph banega." />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyStats} margin={{ left: -20, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }} />
                  <Bar dataKey="minutes" name="Minutes" fill="#dc143c" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">Kya practice kiya?</h2>
            {!data ? (
              <Skeleton className="h-[250px]" />
            ) : breakdown.length === 0 ? (
              <EmptyState compact icon={PieIcon} title="Abhi tak kuch nahi" description="Chat, voice, roleplay — jo bhi karoge, yahan dikhega." />
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={breakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
                      {breakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [v, ACTIVITY_LABELS[n] ?? n]} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="w-full space-y-2 sm:w-48">
                  {breakdown.map((a, i) => (
                    <li key={a.type} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {ACTIVITY_LABELS[a.type] ?? a.type}
                      </span>
                      <span className="font-semibold tabular-nums">{a.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="section-title">Recent activity</h2>
          <div className="space-y-2">
            {(data?.recentActivity ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Abhi tak koi activity nahi — pehla lesson shuru karo!</p>
            )}
            {(data?.recentActivity ?? []).map((item) => {
              const Icon = ACTIVITY_ICONS[item.activityType] ?? MessageCircle;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/60"
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
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
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

        <div id="leaderboard" className="card mb-8 scroll-mt-20">
          <h2 className="section-title flex items-center gap-2"><FeatureIcon name="leaderboard" size={28} /> Weekly leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.length === 0 && <p className="text-sm text-slate-500">Is hafte abhi tak koi activity nahi.</p>}
            {leaderboard.map((entry) => {
              const isMe = entry.displayName === user.displayName;
              const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${
                    isMe ? 'bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-950/50 dark:ring-brand-900' : 'bg-slate-50 dark:bg-slate-800/60'
                  }`}
                >
                  <span className="w-7 text-center text-sm font-bold text-slate-400">{medal ?? `#${entry.rank}`}</span>
                  <span className="flex-1 truncate font-medium">
                    {entry.displayName}
                    {isMe && <span className="ml-2 text-xs font-semibold text-brand-600 dark:text-brand-300">You</span>}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">{entry.xp} XP</span>
                  <span className="text-sm tabular-nums text-slate-400">{entry.streak}🔥</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">{t('practiceGoal')}</h2>
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

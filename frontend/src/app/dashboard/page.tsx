'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Coins,
  Flame,
  MessageCircle,
  Mic,
  Phone,
  Sparkles,
  Star,
  Trophy,
  Users,
  Volume2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson, DashboardData } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { t } from '@/lib/i18n';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function GoalRing({ percent, minutes, goal }: { percent: number; minutes: number; goal: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" stroke="rgba(255,255,255,0.18)" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="#fdc403"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-2xl font-bold leading-none">{minutes}</span>
        <span className="mt-0.5 text-[11px] text-brand-100">of {goal} min</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token, profile, initialized } = useAuthStore();
  const router = useRouter();
  const [dailyLesson, setDailyLesson] = useState<Lesson | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (initialized && user && profile && !profile.onboardingCompleted) {
      router.replace('/onboarding/profile');
    }
  }, [user, initialized, profile, router]);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      api.get<{ lesson: Lesson }>('/api/lessons/daily', token).then((d) => setDailyLesson(d.lesson)),
      api.get<DashboardData>('/api/progress/dashboard', token).then(setDashboard),
    ]).finally(() => setLoaded(true));
  }, [token]);

  if (!initialized || !user) return <LoadingScreen />;

  const stats = dashboard?.stats;
  const todayMinutes = stats?.todayMinutes ?? 0;
  const dailyGoal = Math.max(1, stats?.dailyGoal ?? profile?.settings?.dailyGoalMinutes ?? 15);
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));
  const streak = stats?.streak ?? profile?.streak ?? 0;
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Student';

  const quickActions = [
    { href: '/chat', icon: MessageCircle, label: 'Kiki se baat', sub: 'Hindi → English chat', tint: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' },
    { href: '/call', icon: Phone, label: 'Call Kiki', sub: 'Voice conversation', tint: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300' },
    { href: '/voice', icon: Mic, label: 'Bol kar seekho', sub: 'Pronunciation score', tint: 'bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300' },
    { href: '/roleplay', icon: Users, label: 'Roleplay', sub: 'Real situations', tint: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  ];

  const statTiles = [
    { icon: Flame, label: 'Streak', value: `${streak}`, unit: streak === 1 ? 'din' : 'din', tint: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' },
    { icon: Star, label: 'XP', value: `${stats?.xp ?? 0}`, unit: `Lv.${stats?.level ?? 1}`, tint: 'text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-300' },
    { icon: BookOpen, label: 'Lessons', value: `${stats?.lessonsCompleted ?? profile?.lessonsCompleted ?? 0}`, unit: 'done', tint: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40' },
    { icon: Coins, label: 'Coins', value: `${stats?.coins ?? 0}`, unit: '', tint: 'text-accent-700 bg-accent-50 dark:bg-accent-950/40 dark:text-accent-300' },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-3xl gradient-hero p-6 text-white shadow-lg shadow-brand-900/20 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-accent-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-100">
                {greeting()} · {profile?.grade ? (profile.grade === 'college' ? 'College' : `Class ${profile.grade}`) : 'Student'}
                {profile?.state ? ` · ${profile.state}` : ''}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Namaste, {firstName} 👋</h1>
              <p className="mt-2 max-w-md text-brand-100">
                {goalPercent >= 100
                  ? 'Shabash! Aaj ka goal complete ho gaya 🎉'
                  : `Aaj ${Math.max(0, dailyGoal - todayMinutes)} min aur practice karo — goal poora karo!`}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={dailyLesson ? `/lessons/${dailyLesson.id}` : '/lessons'}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
                >
                  Practice shuru karo <ArrowRight size={16} />
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-semibold backdrop-blur">
                  <Flame size={16} className="text-accent-300" /> {streak} din streak
                </span>
              </div>
            </div>
            <GoalRing percent={goalPercent} minutes={todayMinutes} goal={dailyGoal} />
          </div>
        </section>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statTiles.map(({ icon: Icon, label, value, unit, tint }) => (
            <div key={label} className="card flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                {loaded ? (
                  <p className="truncate text-lg font-bold leading-tight">
                    {value} {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
                  </p>
                ) : (
                  <Skeleton className="mt-1 h-5 w-12" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-5">
          {/* Today's lesson */}
          <div className="lg:col-span-3">
            <h2 className="section-title">Aaj ka lesson</h2>
            {dailyLesson ? (
              <Link href={`/lessons/${dailyLesson.id}`} className="card card-interactive group flex h-[calc(100%-2.5rem)] flex-col">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">{dailyLesson.category}</span>
                  <span className="chip bg-slate-100 capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{dailyLesson.level}</span>
                  <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Clock size={11} /> {dailyLesson.durationMinutes} min
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{dailyLesson.title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-500">{dailyLesson.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
                  {t('startLesson')} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ) : loaded ? (
              <Link href="/lessons" className="card card-interactive flex h-[calc(100%-2.5rem)] items-center justify-between">
                <div>
                  <p className="font-semibold">Lessons browse karo</p>
                  <p className="text-sm text-slate-500">500+ lessons — school, exams, daily life</p>
                </div>
                <ArrowRight className="text-brand-600" size={18} />
              </Link>
            ) : (
              <Skeleton className="h-44 rounded-2xl" />
            )}
          </div>

          {/* Daily phrase */}
          <div className="lg:col-span-2">
            <h2 className="section-title">{t('dailyPhrase')}</h2>
            {dashboard?.dailyPhrase ? (
              <div className="card flex h-[calc(100%-2.5rem)] flex-col border-accent-200 bg-gradient-to-br from-accent-50 to-white dark:border-accent-900/40 dark:from-accent-950/30 dark:to-slate-900">
                <div className="mb-3 flex items-center gap-2 text-accent-700 dark:text-accent-300">
                  <Sparkles size={16} />
                  <span className="chip bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
                    {dashboard.dailyPhrase.category}
                  </span>
                </div>
                <p className="font-display text-lg font-semibold leading-snug">{dashboard.dailyPhrase.english}</p>
                <p className="mt-1 text-sm text-slate-500">{dashboard.dailyPhrase.hindi}</p>
                <p className="mt-3 flex-1 text-xs text-slate-500">💡 {dashboard.dailyPhrase.tip}</p>
                <button
                  type="button"
                  onClick={() => speechService.speak(dashboard.dailyPhrase!.english)}
                  className="btn-secondary mt-4 py-2"
                >
                  <Volume2 size={16} /> Suno aur repeat karo
                </button>
              </div>
            ) : (
              <Skeleton className="h-44 rounded-2xl" />
            )}
          </div>
        </div>

        {/* Quick actions */}
        <h2 className="section-title">{t('quickActions')}</h2>
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map(({ href, icon: Icon, label, sub, tint }) => (
            <Link key={href} href={href} className="card card-interactive group flex flex-col gap-3 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Kiki CTA */}
        <Link
          href="/chat"
          className="card card-interactive flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <KikiAvatar size="lg" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-700 dark:text-accent-300">AI Tutor · Free</p>
            <h2 className="font-display text-lg font-bold">Kiki se baat karo</h2>
            <p className="text-sm text-slate-500">Hindi mein likho ya bolo — Kiki English sikhayegi, galti bhi sudharegi.</p>
          </div>
          <span className="btn-primary py-2.5">
            Chat shuru karo <ArrowRight size={16} />
          </span>
        </Link>

        <Link href="/progress" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
          <Trophy size={16} /> Leaderboard aur badges dekho →
        </Link>
      </div>
    </AppShell>
  );
}

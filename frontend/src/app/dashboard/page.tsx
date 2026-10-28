'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Clock, BookOpen, Target, MessageCircle, Mic, Users, Volume2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson, DashboardData } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { t } from '@/lib/i18n';

export default function DashboardPage() {
  const { user, token, profile, initialized } = useAuthStore();
  const router = useRouter();
  const [dailyLesson, setDailyLesson] = useState<Lesson | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

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
    api.get<{ lesson: Lesson }>('/api/lessons/daily', token).then((d) => setDailyLesson(d.lesson)).catch(console.error);
    api.get<DashboardData>('/api/progress/dashboard', token).then(setDashboard).catch(console.error);
  }, [token]);

  if (!initialized || !user) return <LoadingScreen />;

  const todayMinutes = dashboard?.stats.todayMinutes ?? 0;
  const dailyGoal = dashboard?.stats.dailyGoal ?? profile?.settings.dailyGoalMinutes ?? 15;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const quickActions = [
    { href: '/chat', icon: MessageCircle, label: 'Kiki se baat', sub: 'Hindi → English', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' },
    { href: '/voice', icon: Mic, label: 'Bol kar seekho', sub: 'Pronunciation', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' },
    { href: '/roleplay', icon: Users, label: 'Roleplay', sub: 'Real situations', color: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' },
    { href: '/lessons', icon: BookOpen, label: 'Lessons', sub: 'School & daily life', color: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8">
          <p className="text-sm font-medium text-brand-600">{t('freeForStudents')}</p>
          <h1 className="text-2xl font-bold">
            Namaste, {profile?.displayName ?? 'Student'} 👋
          </h1>
          <p className="text-slate-500">
            {profile?.grade ? `Class ${profile.grade}` : 'Student'}
            {profile?.state ? ` · ${profile.state}` : ''} — {t('dashboardGreeting')}
          </p>
        </header>

        <div className="card mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">{t('practiceGoal')}</p>
            <span className="text-sm text-slate-500">{todayMinutes}/{dailyGoal} min</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-full rounded-full gradient-hero transition-all" style={{ width: `${goalPercent}%` }} />
          </div>
          {goalPercent >= 100 && (
            <p className="mt-2 text-sm text-brand-600">Shabash! Aaj ka goal complete! 🎉</p>
          )}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Flame, label: 'Streak', value: `${dashboard?.stats.streak ?? profile?.streak ?? 0} din`, color: 'text-accent-500' },
            { icon: Clock, label: 'Aaj', value: `${todayMinutes} min`, color: 'text-brand-500' },
            { icon: BookOpen, label: 'Lessons', value: dashboard?.stats.lessonsCompleted ?? profile?.lessonsCompleted ?? 0, color: 'text-brand-500' },
            { icon: Target, label: 'Level', value: `Lv.${dashboard?.stats.level ?? 1}`, color: 'text-accent-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`rounded-2xl bg-slate-100 p-3 dark:bg-slate-700 ${color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {(dashboard?.stats.xp !== undefined || dashboard?.stats.coins !== undefined) && (
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-brand-900/30">
              ⭐ {dashboard?.stats.xp ?? 0} XP
            </span>
            <span className="rounded-full bg-accent-100 px-4 py-2 text-sm font-semibold text-accent-700 dark:bg-accent-900/30">
              🪙 {dashboard?.stats.coins ?? 0} Coins
            </span>
            <Link href="/progress" className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
              🏆 Leaderboard →
            </Link>
          </div>
        )}

        {dashboard?.dailyPhrase && (
          <div className="card mb-6 border-accent-100 bg-gradient-to-r from-accent-50 to-brand-50 dark:from-accent-950/30 dark:to-brand-950/30">
            <div className="mb-2 flex items-center gap-2 text-accent-600">
              <Sparkles size={16} />
              <span className="text-sm font-semibold">{t('dailyPhrase')}</span>
              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs dark:bg-accent-900/40">
                {dashboard.dailyPhrase.category}
              </span>
            </div>
            <p className="text-lg font-semibold">{dashboard.dailyPhrase.english}</p>
            <p className="text-sm text-slate-500">{dashboard.dailyPhrase.hindi}</p>
            <p className="mt-2 text-xs text-accent-600">{dashboard.dailyPhrase.tip}</p>
            <button
              onClick={() => speechService.speak(dashboard.dailyPhrase!.english)}
              className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              <Volume2 size={14} /> Suno aur repeat karo
            </button>
          </div>
        )}

        <Link
          href="/chat"
          className="card mb-8 flex items-center gap-4 transition hover:scale-[1.01] hover:shadow-lg"
        >
          <KikiAvatar size="lg" />
          <div className="flex-1">
            <p className="text-sm font-medium text-accent-600 dark:text-accent-300">AI Tutor · Free</p>
            <h2 className="text-lg font-bold">Kiki se baat karo</h2>
            <p className="text-sm text-slate-500">Hindi mein likho ya bolo — English seekho!</p>
          </div>
          <span className="rounded-2xl bg-accent-100 px-4 py-2 text-sm font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
            Chat →
          </span>
        </Link>

        {dailyLesson && (
          <div className="card mb-8 gradient-hero text-white">
            <p className="mb-1 text-sm text-accent-200">Aaj ka Lesson</p>
            <h2 className="mb-2 text-xl font-bold">{dailyLesson.title}</h2>
            <p className="mb-4 text-accent-100">{dailyLesson.description}</p>
            <Link href={`/lessons/${dailyLesson.id}`} className="inline-flex rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700">
              {t('startLesson')} · {dailyLesson.durationMinutes} min
            </Link>
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ href, icon: Icon, label, sub, color }) => (
            <Link key={href} href={href} className="card flex flex-col items-center gap-2 py-6 transition hover:scale-[1.02]">
              <div className={`rounded-2xl p-4 ${color}`}>
                <Icon size={28} />
              </div>
              <span className="font-medium">{label}</span>
              <span className="text-xs text-slate-400">{sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Clock, Coins, Flame, Star, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { FeatureTile, SectionTitle, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson, DashboardData } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { t } from '@/lib/i18n';

interface Tile {
  href: string;
  icon: FeatureIconName;
  label: string;
  badge?: number | string | null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
  const earnedBadges = stats?.badges?.length ?? 0;

  const sections: Array<{ title: string; tiles: Tile[] }> = [
    {
      title: 'Practice · प्रैक्टिस',
      tiles: [
        { href: '/chat', icon: 'chat', label: 'Kiki Chat' },
        { href: '/call', icon: 'call', label: 'Call Kiki' },
        { href: '/voice', icon: 'voice', label: 'Voice' },
        { href: '/roleplay', icon: 'roleplay', label: 'Roleplay' },
        { href: '/debate', icon: 'debate', label: 'Debate' },
      ],
    },
    {
      title: 'Learn · सीखो',
      tiles: [
        { href: dailyLesson ? `/lessons/${dailyLesson.id}` : '/lessons', icon: 'calendar', label: 'Aaj ka Lesson', badge: dailyLesson ? 'New' : null },
        { href: '/lessons', icon: 'lessons', label: 'Lessons' },
        { href: '/courses', icon: 'courses', label: 'Courses' },
        { href: '#phrase', icon: 'idea', label: 'Daily Phrase' },
      ],
    },
    {
      title: 'My Progress · प्रगति',
      tiles: [
        { href: '/progress', icon: 'progress', label: 'Progress' },
        { href: '/progress#leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
        { href: '/progress#badges', icon: 'badges', label: 'Badges', badge: earnedBadges || null },
        { href: '/progress', icon: 'streak', label: 'Streak', badge: streak || null },
      ],
    },
    {
      title: 'Account · अकाउंट',
      tiles: [
        { href: '/settings', icon: 'profile', label: 'Profile' },
        { href: '/pricing', icon: 'premium', label: 'Premium' },
        { href: '/settings', icon: 'settings', label: 'Settings' },
        { href: '/chat', icon: 'help', label: 'Need Help' },
      ],
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:py-8">
        {/* Welcome card */}
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-lg shadow-brand-900/25 sm:p-7">
          <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute right-8 top-6 h-4 w-4 rounded-full bg-accent-400" />
          <span className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-leaf-700" />
          <div className="relative flex items-center gap-4">
            <div className="rounded-full bg-white p-1 shadow-lg">
              <KikiAvatar size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-brand-100">
                {greeting()} · {profile?.grade ? (profile.grade === 'college' ? 'College' : `Class ${profile.grade}`) : 'Student'}
                {profile?.state ? ` · ${profile.state}` : ''}
              </p>
              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
                Namaste, <span className="text-accent-300">{firstName}</span> 👋
              </h1>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold">{t('practiceGoal')}</span>
              <span className="text-brand-100">
                {todayMinutes}/{dailyGoal} min
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-accent-400 transition-all duration-700" style={{ width: `${goalPercent}%` }} />
            </div>
            <p className="mt-2 text-sm text-brand-50">
              {goalPercent >= 100
                ? 'Shabash! Aaj ka goal complete ho gaya 🎉'
                : `Aaj ${Math.max(0, dailyGoal - todayMinutes)} min aur practice karo — goal poora karo!`}
            </p>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
              <Flame size={15} className="text-accent-300" /> {streak} din
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
              <Star size={15} className="text-accent-300" /> {stats?.xp ?? 0} XP · Lv.{stats?.level ?? 1}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
              <Coins size={15} className="text-accent-300" /> {stats?.coins ?? 0}
            </span>
            <Link
              href={dailyLesson ? `/lessons/${dailyLesson.id}` : '/lessons'}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-accent-400 px-4 py-2 text-sm font-bold text-brand-900 shadow-sm transition hover:bg-accent-300"
            >
              Practice shuru karo <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Icon grid sections */}
        {sections.map((section) => (
          <section key={section.title} className="mb-6">
            <SectionTitle>{section.title}</SectionTitle>
            <div className="grid grid-cols-4 gap-x-1 gap-y-2 sm:grid-cols-5 lg:grid-cols-6">
              {section.tiles.map((tile) => (
                <FeatureTile key={tile.label} {...tile} />
              ))}
            </div>
          </section>
        ))}

        {/* Today */}
        <section className="mb-4 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionTitle>Aaj ka Lesson</SectionTitle>
            {dailyLesson ? (
              <Link href={`/lessons/${dailyLesson.id}`} className="card card-interactive group flex items-start gap-4">
                <FeatureIcon name="lessons" size={56} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">{dailyLesson.category}</span>
                    <span className="chip bg-leaf-50 capitalize text-leaf-700 dark:bg-leaf-950/50 dark:text-leaf-300">{dailyLesson.level}</span>
                    <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Clock size={11} /> {dailyLesson.durationMinutes} min
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold group-hover:text-brand-700 dark:group-hover:text-brand-300">{dailyLesson.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{dailyLesson.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    {t('startLesson')} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ) : loaded ? (
              <Link href="/lessons" className="card card-interactive flex items-center gap-4">
                <FeatureIcon name="lessons" size={48} />
                <div className="flex-1">
                  <p className="font-semibold">Lessons browse karo</p>
                  <p className="text-sm text-slate-500">500+ lessons — school, exams, daily life</p>
                </div>
                <ArrowRight className="text-brand-600" size={18} />
              </Link>
            ) : (
              <Skeleton className="h-36 rounded-2xl" />
            )}
          </div>

          <div id="phrase" className="scroll-mt-20 lg:col-span-2">
            <SectionTitle>{t('dailyPhrase')}</SectionTitle>
            {dashboard?.dailyPhrase ? (
              <div className="card border-accent-300 bg-gradient-to-br from-accent-50 to-white dark:border-accent-900/50 dark:from-accent-950/30 dark:to-slate-900">
                <div className="mb-2 flex items-center gap-2">
                  <FeatureIcon name="idea" size={32} />
                  <span className="chip bg-leaf-700 text-white">{dashboard.dailyPhrase.category}</span>
                </div>
                <p className="font-display text-lg font-semibold leading-snug">{dashboard.dailyPhrase.english}</p>
                <p className="mt-1 text-sm text-slate-500">{dashboard.dailyPhrase.hindi}</p>
                <p className="mt-2 text-xs text-slate-500">💡 {dashboard.dailyPhrase.tip}</p>
                <button
                  type="button"
                  onClick={() => speechService.speak(dashboard.dailyPhrase!.english)}
                  className="btn-primary mt-4 w-full py-2"
                >
                  <Volume2 size={16} /> Suno aur repeat karo
                </button>
              </div>
            ) : (
              <Skeleton className="h-36 rounded-2xl" />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Clock, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, RoleplayScenario } from '@/lib/api';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  intermediate: 'bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
  advanced: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
};

const CATEGORY_STYLE: Record<string, { emoji: string; bg: string }> = {
  'Daily Life': { emoji: '☕', bg: 'from-amber-100 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20' },
  Professional: { emoji: '💼', bg: 'from-slate-200 to-slate-50 dark:from-slate-800 dark:to-slate-900' },
  Travel: { emoji: '✈️', bg: 'from-sky-100 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/20' },
  Health: { emoji: '🏥', bg: 'from-emerald-100 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20' },
  School: { emoji: '🏫', bg: 'from-brand-100 to-brand-50 dark:from-brand-950/60 dark:to-brand-950/20' },
  College: { emoji: '🎓', bg: 'from-violet-100 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/20' },
};

export default function RoleplayPage() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<RoleplayScenario[] | null>(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const load = useCallback(() => {
    setError(false);
    api
      .get<{ scenarios: RoleplayScenario[] }>('/api/roleplay')
      .then((d) => setScenarios(d.scenarios))
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  if (!initialized || !user) return <LoadingScreen />;

  const categories = ['All', ...Array.from(new Set((scenarios ?? []).map((s) => s.category)))];
  const filtered = category === 'All' ? scenarios ?? [] : (scenarios ?? []).filter((s) => s.category === category);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader icon={Users} title="Roleplay · अभिनय" subtitle="Real situations — school, chai tapri, auto, interview" />

        {error ? (
          <ErrorState message="Scenarios load nahi ho paye." onRetry={load} />
        ) : (
          <>
            <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`pill-tab ${category === cat ? 'pill-tab-active' : 'pill-tab-idle'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scenarios === null &&
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
              {filtered.map((scenario) => {
                const style = CATEGORY_STYLE[scenario.category] ?? { emoji: '🎭', bg: 'from-brand-100 to-accent-50' };
                return (
                  <Link
                    key={scenario.id}
                    href={`/roleplay/${scenario.id}`}
                    className="card card-interactive group flex flex-col overflow-hidden p-0"
                  >
                    <div className={`flex h-28 items-center justify-center bg-gradient-to-br text-5xl ${style.bg}`}>
                      <span className="transition duration-300 group-hover:scale-110">{style.emoji}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`chip capitalize ${LEVEL_COLORS[scenario.level] ?? ''}`}>{scenario.level}</span>
                        <span className="text-xs text-slate-400">{scenario.category}</span>
                      </div>
                      <h2 className="mb-1 font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                        {scenario.title}
                      </h2>
                      <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500">{scenario.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Clock size={14} /> {scenario.estimatedMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-300">
                          Start <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

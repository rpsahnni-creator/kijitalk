'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore } from '@/stores/useStore';
import { api, RoleplayScenario } from '@/lib/api';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CATEGORY_EMOJI: Record<string, string> = {
  'Daily Life': '☕',
  Professional: '💼',
  Travel: '✈️',
  Health: '🏥',
  School: '🏫',
  College: '🎓',
};

const CATEGORIES = ['All', 'School', 'Daily Life', 'College', 'Travel', 'Professional'];

export default function RoleplayPage() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    api.get<{ scenarios: RoleplayScenario[] }>('/api/roleplay').then((d) => setScenarios(d.scenarios)).catch(console.error);
  }, []);

  if (!initialized || !user) return <LoadingScreen />;

  const filtered = category === 'All' ? scenarios : scenarios.filter((s) => s.category === category);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Roleplay · अभिनय</h1>
          <p className="text-slate-500">Real situations — school, chai tapri, auto, interview</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === cat ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/roleplay/${scenario.id}`}
              className="card group transition hover:scale-[1.01] hover:shadow-lg"
            >
              <div className="mb-4 flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-indigo-100 text-5xl dark:from-brand-900/30 dark:to-indigo-900/30">
                {CATEGORY_EMOJI[scenario.category] ?? '🎭'}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${LEVEL_COLORS[scenario.level]}`}>
                  {scenario.level}
                </span>
                <span className="text-xs text-slate-400">{scenario.category}</span>
              </div>
              <h2 className="mb-1 text-lg font-semibold group-hover:text-brand-600">{scenario.title}</h2>
              <p className="mb-4 text-sm text-slate-500">{scenario.description}</p>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {scenario.estimatedMinutes} min
                </span>
                <ChevronRight size={18} className="text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

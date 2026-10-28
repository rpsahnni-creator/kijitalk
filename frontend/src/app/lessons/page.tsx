'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, ChevronRight, Search, Star } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson } from '@/lib/api';
import { t } from '@/lib/i18n';

const CATEGORIES = ['All', 'School', 'Daily Life', 'Travel', 'Exams', 'Conversation', 'Career'];

export default function LessonsPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lesson[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    api
      .get<{ lessons: Lesson[] }>('/api/lessons', token)
      .then((d) => setLessons(d.lessons))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      api
        .get<{ lessons: Lesson[] }>(`/api/lessons/search?q=${encodeURIComponent(trimmed)}`)
        .then((d) => setSearchResults(d.lessons))
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!initialized || !user) return <LoadingScreen />;

  const filtered = category === 'All' ? lessons : lessons.filter((l) => l.category === category);
  const recommended = filtered.filter((l) => l.recommended);
  const rest = filtered.filter((l) => !l.recommended);

  const renderLesson = (lesson: Lesson, index: number) => (
    <Link
      key={lesson.id}
      href={`/lessons/${lesson.id}`}
      className="card flex items-center gap-4 transition hover:scale-[1.01]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{lesson.title}</h2>
          {lesson.recommended && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700">
              <Star size={10} /> Recommended
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize dark:bg-slate-700">
            {lesson.level}
          </span>
        </div>
        <p className="text-sm text-slate-500">{lesson.description}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Clock size={12} /> {lesson.durationMinutes} min · {lesson.category}
          {lesson.gradeBand ? ` · Class ${lesson.gradeBand}` : ''}
        </p>
      </div>
      <ChevronRight className="text-brand-600" size={20} />
    </Link>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{t('allLessons')}</h1>
          <p className="text-slate-500">School, exams, daily life — Bharat ke students ke liye</p>
        </header>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kya seekhna hai? Jaise 'phone pe baat karna'..."
            className="input-field pl-11"
          />
        </div>

        {searchResults !== null ? (
          <div className="space-y-4">
            {searching && <p className="text-sm text-slate-400">Dhundh rahe hain...</p>}
            {!searching && searchResults.length === 0 && (
              <p className="text-sm text-slate-400">Koi lesson nahi mila. Kuch aur try karo.</p>
            )}
            {searchResults.map((l, i) => renderLesson(l, i))}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    category === cat
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {recommended.length > 0 && category === 'All' && (
              <section className="mb-8">
                <h2 className="mb-4 font-semibold text-accent-600">{t('recommended')}</h2>
                <div className="space-y-4">{recommended.map((l, i) => renderLesson(l, i))}</div>
              </section>
            )}

            <div className="space-y-4">
              {(category === 'All' ? rest : filtered).map((l, i) => renderLesson(l, i))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

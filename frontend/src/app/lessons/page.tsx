'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ChevronRight, Clock, Search, SearchX, Sparkles, X } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState, ErrorState, PageHeader, SkeletonList } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson } from '@/lib/api';
import { t } from '@/lib/i18n';

const CATEGORY_EMOJI: Record<string, string> = {
  School: '🏫',
  'Daily Life': '☕',
  Travel: '🚆',
  Exams: '📝',
  Conversation: '💬',
  Career: '💼',
  Grammar: '✍️',
  Pronunciation: '🗣️',
  Basics: '🌱',
  Professional: '👔',
  Vocabulary: '🔤',
  'Idioms & Everyday English': '💡',
};

const LEVEL_STYLE: Record<string, string> = {
  beginner: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  intermediate: 'bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
  advanced: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
};

const PAGE_SIZE = 30;

const mainCategory = (category: string) => category.split(' · ')[0];

function LessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="card card-interactive group flex items-center gap-4 p-4 sm:p-5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">
        {CATEGORY_EMOJI[mainCategory(lesson.category)] ?? '📘'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            {lesson.title}
          </h2>
          {lesson.recommended && (
            <span className="chip bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
              <Sparkles size={10} /> For you
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-sm text-slate-500">{lesson.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className={`chip capitalize ${LEVEL_STYLE[lesson.level] ?? 'bg-slate-100 dark:bg-slate-800'}`}>{lesson.level}</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {lesson.durationMinutes} min
          </span>
          <span>· {lesson.category}</span>
          {lesson.gradeBand && <span>· Class {lesson.gradeBand}</span>}
        </div>
      </div>
      <ChevronRight className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" size={20} />
    </Link>
  );
}

export default function LessonsPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lesson[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const load = useCallback(() => {
    setError(false);
    api
      .get<{ lessons: Lesson[] }>('/api/lessons', token)
      .then((d) => setLessons(d.lessons))
      .catch(() => setError(true));
  }, [token]);

  useEffect(load, [load]);

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
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => setVisible(PAGE_SIZE), [category]);

  if (!initialized || !user) return <LoadingScreen />;

  const all = lessons ?? [];
  // Categories like "Vocabulary · Family" are grouped under their main topic.
  const counts = new Map<string, number>();
  all.forEach((l) => counts.set(mainCategory(l.category), (counts.get(mainCategory(l.category)) ?? 0) + 1));
  const categories = ['All', ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c)];
  const filtered = category === 'All' ? all : all.filter((l) => mainCategory(l.category) === category);
  const recommended = category === 'All' ? filtered.filter((l) => l.recommended) : [];
  const rest = category === 'All' ? filtered.filter((l) => !l.recommended) : filtered;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader
          icon={BookOpen}
          title={t('allLessons')}
          subtitle={
            lessons
              ? `${lessons.length} lessons — school, exams, daily life`
              : 'School, exams, daily life — Bharat ke students ke liye'
          }
        />

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kya seekhna hai? Jaise 'phone pe baat karna'..."
            className="input-field pl-11 pr-10"
            aria-label="Search lessons"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {error ? (
          <ErrorState message="Lessons load nahi ho paye." onRetry={load} />
        ) : searchResults !== null || searching ? (
          <div className="space-y-3">
            {searching && <SkeletonList rows={3} />}
            {!searching && searchResults?.length === 0 && (
              <EmptyState icon={SearchX} title="Koi lesson nahi mila" description="Kuch aur words try karo — jaise 'interview' ya 'shopping'." />
            )}
            {!searching && searchResults?.map((l) => <LessonRow key={l.id} lesson={l} />)}
          </div>
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

            {lessons === null ? (
              <SkeletonList rows={5} />
            ) : (
              <>
                {category !== 'All' && (
                  <p className="mb-4 text-sm text-slate-500">
                    {filtered.length} {filtered.length === 1 ? 'lesson' : 'lessons'} in {category}
                  </p>
                )}
                {recommended.length > 0 && (
                  <section className="mb-8">
                    <h2 className="section-title flex items-center gap-2">
                      <Sparkles size={16} className="text-accent-500" /> {t('recommended')}
                    </h2>
                    <div className="space-y-3">
                      {recommended.map((l) => (
                        <LessonRow key={l.id} lesson={l} />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  {recommended.length > 0 && <h2 className="section-title">Saare lessons</h2>}
                  <div className="space-y-3">
                    {rest.slice(0, visible).map((l) => (
                      <LessonRow key={l.id} lesson={l} />
                    ))}
                  </div>
                  {rest.length > visible && (
                    <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary mt-4 w-full">
                      Aur dikhao ({rest.length - visible} baaki)
                    </button>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

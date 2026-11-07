'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  lessonCount: number;
  progressPercent: number;
}

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];
const LEVEL_META: Record<string, { label: string; hint: string; chip: string }> = {
  beginner: { label: 'Beginner', hint: 'Shuruaat yahan se', chip: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300' },
  intermediate: { label: 'Intermediate', hint: 'Thoda aage badho', chip: 'bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300' },
  advanced: { label: 'Advanced', hint: 'Fluency ki taraf', chip: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' },
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function CoursesPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const load = useCallback(() => {
    if (!token) return;
    setError(false);
    api
      .get<{ courses: Course[] }>('/api/courses', token)
      .then((d) => setCourses(d.courses))
      .catch(() => setError(true));
  }, [token]);

  useEffect(load, [load]);

  if (!initialized || !user) return <LoadingScreen />;

  const levels = [
    ...LEVEL_ORDER,
    ...Array.from(new Set((courses ?? []).map((c) => c.level))).filter((l) => !LEVEL_ORDER.includes(l)),
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader icon={GraduationCap} title="Courses · कोर्स" subtitle="Level-wise structured learning paths" />

        {error && <ErrorState message="Courses load nahi ho paye." onRetry={load} />}

        {!error && courses === null && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {courses &&
          levels.map((level) => {
            const list = courses.filter((c) => c.level === level);
            if (list.length === 0) return null;
            const meta = LEVEL_META[level] ?? { label: level, hint: '', chip: 'bg-slate-100 dark:bg-slate-800' };
            return (
              <section key={level} className="mb-10">
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="font-display text-lg font-bold capitalize">{meta.label}</h2>
                  {meta.hint && <span className="text-sm text-slate-400">{meta.hint}</span>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${encodeURIComponent(course.id)}`}
                      className="card card-interactive group flex flex-col p-5"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                          {course.category}
                        </h3>
                        <span className={`chip shrink-0 ${meta.chip}`}>{plural(course.lessonCount, 'lesson')}</span>
                      </div>
                      <p className="mb-5 flex-1 text-sm text-slate-500">
                        {plural(course.lessonCount, 'lesson')} — {course.category.toLowerCase()} practice, {meta.label.toLowerCase()} level
                      </p>
                      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                          style={{ width: `${Math.min(100, Math.max(0, course.progressPercent))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{course.progressPercent}% complete</span>
                        <ChevronRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" size={16} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </AppShell>
  );
}

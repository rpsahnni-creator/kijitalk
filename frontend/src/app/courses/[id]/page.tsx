'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson } from '@/lib/api';

interface CourseInfo {
  title: string;
  description: string;
  lessonCount: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const load = useCallback(() => {
    if (!token || !id) return;
    setError(false);
    api
      .get<{ course: CourseInfo; lessons: Lesson[] }>(`/api/courses/${encodeURIComponent(id)}`, token)
      .then((d) => {
        setCourse(d.course);
        setLessons(d.lessons);
      })
      .catch(() => setError(true));
  }, [token, id]);

  useEffect(load, [load]);

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <ErrorState message="Yeh course load nahi ho paya." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!initialized || !user || !course) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
        <Link href="/courses" className="btn-ghost -ml-3 mb-4">
          <ArrowLeft size={16} /> Courses
        </Link>
        <div className="card mb-6 overflow-hidden p-0">
          <div className="gradient-hero px-6 py-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold capitalize sm:text-3xl">{course.title}</h1>
          </div>
        </div>

        <ol className="relative space-y-3">
          {lessons.map((lesson, i) => (
            <li key={lesson.id}>
              <Link href={`/lessons/${lesson.id}`} className="card card-interactive group flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50 text-sm font-bold text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium group-hover:text-brand-700 dark:group-hover:text-brand-300">{lesson.title}</h2>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> {lesson.durationMinutes} min
                  </p>
                </div>
                <ChevronRight className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" size={18} />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}

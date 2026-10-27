'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore } from '@/stores/useStore';
import { api, Lesson } from '@/lib/api';

export default function CourseDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [course, setCourse] = useState<{ title: string; description: string; lessonCount: number } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (!token || !id) return;
    api.get<{ course: typeof course; lessons: Lesson[] }>(`/api/courses/${encodeURIComponent(id)}`, token)
      .then((d) => { setCourse(d.course); setLessons(d.lessons); })
      .catch(console.error);
  }, [token, id]);

  if (!initialized || !user || !course) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-slate-500">{course.description}</p>
        </header>

        <div className="space-y-3">
          {lessons.map((lesson, i) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="card flex items-center gap-4 transition hover:scale-[1.01]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 font-bold text-brand-700">{i + 1}</span>
              <div className="flex-1">
                <h2 className="font-medium">{lesson.title}</h2>
                <p className="flex items-center gap-1 text-xs text-slate-400"><Clock size={12} /> {lesson.durationMinutes} min</p>
              </div>
              <ChevronRight className="text-brand-600" size={18} />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

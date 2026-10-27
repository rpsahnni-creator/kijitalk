'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
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

export default function CoursesPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (!token) return;
    api.get<{ courses: Course[] }>('/api/courses', token).then((d) => setCourses(d.courses)).catch(console.error);
  }, [token]);

  if (!initialized || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Courses · कोर्स</h1>
          <p className="text-slate-500">Level-wise structured learning paths</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${encodeURIComponent(course.id)}`} className="card group transition hover:scale-[1.01]">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-900/30">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="font-semibold group-hover:text-brand-600">{course.title}</h2>
                  <p className="text-xs capitalize text-slate-400">{course.level} · {course.lessonCount} lessons</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-slate-500">{course.description}</p>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-full rounded-full gradient-hero" style={{ width: `${course.progressPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{course.progressPercent}% complete</span>
                <ChevronRight className="text-brand-600" size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

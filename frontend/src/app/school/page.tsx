'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Loader2, Plus, School, Users } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState, PageHeader } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError } from '@/lib/api';

interface SchoolSummary {
  id: string;
  name: string;
  role: string;
  seats: number;
  seatsUsed: number;
  licenseExpiresAt: string | null;
  classes: Array<{ id: string; name: string; grade: string | null; joinCode: string; students: number; assignments: number }>;
}

interface ClassDetail {
  class: { id: string; name: string; grade: string | null; joinCode: string; school: string };
  students: Array<{ id: string; name: string; email: string; streak: number; lessonsCompleted: number; lastActiveAt: string; minutes7d: number; avgScore7d: number | null }>;
  assignments: Array<{ id: string; title: string; note: string | null; dueAt: string | null; completed: number; total: number }>;
}

const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');

function ClassView({ token, id, onBack }: { token: string; id: string; onBack: () => void }) {
  const [data, setData] = useState<ClassDetail | null>(null);
  const [lessonQuery, setLessonQuery] = useState('');
  const [lessonOptions, setLessonOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [lessonId, setLessonId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [csv, setCsv] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void api.get<ClassDetail>(`/api/school/classes/${id}`, token).then(setData);
  }, [id, token]);
  useEffect(load, [load]);

  useEffect(() => {
    const q = lessonQuery.trim();
    if (q.length < 2) return setLessonOptions([]);
    const t = setTimeout(() => {
      void api.get<{ lessons: Array<{ id: string; title: string }> }>(`/api/lessons/search?q=${encodeURIComponent(q)}`).then((d) => setLessonOptions(d.lessons.slice(0, 8)));
    }, 250);
    return () => clearTimeout(t);
  }, [lessonQuery]);

  const assign = async () => {
    if (!lessonId) return;
    setBusy(true);
    try {
      await api.post(`/api/school/classes/${id}/assignments`, { lessonId, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined }, token);
      setLessonId('');
      setLessonQuery('');
      setDueAt('');
      load();
    } finally {
      setBusy(false);
    }
  };

  const addStudents = async () => {
    // One student per line: "Name, email"
    const students = csv
      .split('\n')
      .map((line) => line.split(',').map((x) => x.trim()))
      .filter(([name, email]) => name && email?.includes('@'))
      .map(([name, email]) => ({ name, email }));
    if (students.length === 0) return setNote('Har line mein "Naam, email" likho.');
    setBusy(true);
    setNote('');
    try {
      const r = await api.post<{ results: Array<{ status: string }>; seatsUsed: number; seats: number }>(`/api/school/classes/${id}/students`, { students }, token);
      const count = (s: string) => r.results.filter((x) => x.status === s).length;
      setNote(`${count('added')} jode gaye · ${count('already')} pehle se the · ${count('no_seat')} seat nahi · ${count('failed')} fail. Seats: ${r.seatsUsed}/${r.seats}. Naye students ko password set karne ka email gaya hai.`);
      setCsv('');
      load();
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : 'Students nahi jud paye.');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Loader2 className="mx-auto animate-spin text-brand-600" />;

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="btn-ghost -ml-3"><ArrowLeft size={16} /> Classes</button>
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xl font-bold">{data.class.name}</p>
          <p className="text-sm text-slate-500">{data.class.school}{data.class.grade ? ` · ${data.class.grade}` : ''} · {data.students.length} students</p>
        </div>
        <button type="button" onClick={() => void navigator.clipboard.writeText(data.class.joinCode)} className="rounded-xl bg-accent-200 px-4 py-2 font-mono text-lg font-bold tracking-widest text-slate-900" title="Copy join code">
          {data.class.joinCode} <Copy size={14} className="ml-1 inline" />
        </button>
      </div>

      <section className="card p-0">
        <h3 className="section-title px-5 pt-5">Students — pichle 7 din</h3>
        {data.students.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">Abhi koi student nahi. Join code share karo ya neeche se jodo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/60">
                <tr>{['Student', 'Minutes', 'Avg score', 'Lessons', 'Streak', 'Last active'].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.students.map((s) => (
                  <tr key={s.id} className={s.minutes7d === 0 ? 'bg-red-50/40 dark:bg-red-950/10' : ''}>
                    <td className="px-4 py-2"><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                    <td className="px-4 py-2">{s.minutes7d}</td>
                    <td className="px-4 py-2">{s.avgScore7d ?? '—'}{s.avgScore7d !== null && '%'}</td>
                    <td className="px-4 py-2">{s.lessonsCompleted}</td>
                    <td className="px-4 py-2">{s.streak}🔥</td>
                    <td className="px-4 py-2 text-slate-500">{shortDate(s.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Homework do</h3>
        <input className="input-field" placeholder="Lesson dhundho (jaise 'introduction')" value={lessonQuery} onChange={(e) => { setLessonQuery(e.target.value); setLessonId(''); }} />
        {lessonOptions.length > 0 && !lessonId && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700">
            {lessonOptions.map((l) => (
              <button key={l.id} type="button" onClick={() => { setLessonId(l.id); setLessonQuery(l.title); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                {l.title}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="date" className="input-field" value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-label="Due date" />
          <button type="button" disabled={!lessonId || busy} onClick={assign} className="btn-primary shrink-0">Assign</button>
        </div>
        {data.assignments.length > 0 && (
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {data.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>{a.title}{a.dueAt && <span className="ml-2 text-xs text-slate-500">due {shortDate(a.dueAt)}</span>}</span>
                <span className="chip bg-leaf-100 text-leaf-800">{a.completed}/{a.total} done</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h3 className="section-title">Students jodo (bulk)</h3>
        <p className="text-xs text-slate-500">Har line mein: <code>Naam, email</code> — spreadsheet se copy-paste kar sakte ho. Har naye student ko password set karne ka email jayega.</p>
        <textarea className="input-field font-mono text-xs" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'Ravi Kumar, ravi@example.com\nPriya Singh, priya@example.com'} />
        <button type="button" disabled={busy || !csv.trim()} onClick={addStudents} className="btn-primary">
          {busy && <Loader2 size={16} className="animate-spin" />} <Users size={16} /> Students jodo
        </button>
        {note && <p className="text-sm text-slate-600 dark:text-slate-300">{note}</p>}
      </section>
    </div>
  );
}

export default function SchoolPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolSummary[] | null>(null);
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [newClass, setNewClass] = useState<{ schoolId: string; name: string; grade: string } | null>(null);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [initialized, user, router]);

  const load = useCallback(() => {
    if (!token) return;
    void api.get<{ schools: SchoolSummary[] }>('/api/school/me', token).then((d) => setSchools(d.schools));
  }, [token]);
  useEffect(load, [load]);

  if (!initialized || !user) return <LoadingScreen />;

  const create = async () => {
    if (!newClass?.name.trim()) return;
    await api.post('/api/school/classes', { schoolId: newClass.schoolId, name: newClass.name, grade: newClass.grade || undefined }, token);
    setNewClass(null);
    load();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader icon={School} title="Teacher dashboard" subtitle="Classes, homework aur har student ki progress" />
        {!schools && <Loader2 className="mx-auto animate-spin text-brand-600" />}
        {schools?.length === 0 && (
          <EmptyState icon={School} title="Aap abhi kisi school ke teacher nahi ho" description="Apne school ke liye KijiTalk licence ke baare mein humse baat karo — support email Privacy Policy mein hai." />
        )}
        {token && openClass && <ClassView token={token} id={openClass} onBack={() => { setOpenClass(null); load(); }} />}
        {!openClass &&
          schools?.map((s) => (
            <section key={s.id} className="mb-8">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-leaf-700">{s.name}</h2>
                  <p className="text-sm text-slate-500">
                    Seats {s.seatsUsed}/{s.seats} · Licence {s.licenseExpiresAt ? `till ${shortDate(s.licenseExpiresAt)}` : 'not active'}
                  </p>
                </div>
                <button type="button" onClick={() => setNewClass({ schoolId: s.id, name: '', grade: '' })} className="btn-primary py-2">
                  <Plus size={16} /> Nayi class
                </button>
              </div>
              {newClass?.schoolId === s.id && (
                <div className="card mb-3 flex flex-wrap gap-2">
                  <input className="input-field flex-1" placeholder="Class ka naam (jaise 8-B English)" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} />
                  <input className="input-field w-32" placeholder="Class 8" value={newClass.grade} onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })} />
                  <button type="button" onClick={create} className="btn-primary">Banao</button>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.classes.map((c) => (
                  <button key={c.id} type="button" onClick={() => setOpenClass(c.id)} className="card card-interactive text-left">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.students} students · {c.assignments} homework</p>
                    <p className="mt-2 font-mono text-sm font-bold tracking-widest text-brand-600">{c.joinCode}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>
    </AppShell>
  );
}

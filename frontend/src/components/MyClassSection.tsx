'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError } from '@/lib/api';
import { SectionTitle } from './ui';

interface MyClass {
  id: string;
  name: string;
  school: string;
  homework: Array<{ id: string; lessonId: string; title: string; minutes: number | null; dueAt: string | null; done: boolean }>;
}

/** Student view of school classes: homework, or a box to join with a class code. */
export function MyClassSection() {
  const token = useAuthStore((s) => s.token);
  const syncProfile = useAuthStore((s) => s.syncProfile);
  const [classes, setClasses] = useState<MyClass[] | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    void api.get<{ classes: MyClass[] }>('/api/school/my', token).then((d) => setClasses(d.classes)).catch(() => setClasses([]));
  }, [token]);
  useEffect(load, [load]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setNote('');
    try {
      const { class: c } = await api.post<{ class: { name: string; school: string } }>('/api/school/join', { code }, token);
      setNote(`${c.school} · ${c.name} join ho gaya! 🎉`);
      setCode('');
      load();
      await syncProfile(); // school licence may have unlocked Premium
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : 'Join nahi ho paya.');
    } finally {
      setBusy(false);
    }
  };

  if (classes === null) return null;

  return (
    <section className="mb-6">
      <SectionTitle>Meri class · Homework</SectionTitle>
      {classes.map((c) => (
        <div key={c.id} className="card mb-3 p-4">
          <p className="text-sm font-semibold">{c.school} · {c.name}</p>
          {c.homework.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">Abhi koi homework nahi.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {c.homework.map((h) => (
                <li key={h.id}>
                  <Link href={`/lessons/${h.lessonId}`} className="flex items-center gap-3 py-2 text-sm">
                    {h.done ? <CheckCircle2 size={18} className="text-leaf-700" /> : <Circle size={18} className="text-slate-300" />}
                    <span className={`flex-1 ${h.done ? 'text-slate-400 line-through' : 'font-medium'}`}>{h.title}</span>
                    {h.dueAt && !h.done && (
                      <span className="text-xs text-brand-600">due {new Date(h.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <form onSubmit={join} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={classes.length ? 'Aur class join karo — code' : 'Teacher ne class code diya? Yahan likho'}
          className="input-field font-mono uppercase tracking-widest"
          maxLength={6}
          aria-label="Class code"
        />
        <button type="submit" disabled={busy || code.trim().length < 6} className="btn-primary shrink-0">
          {busy && <Loader2 size={16} className="animate-spin" />} Join
        </button>
      </form>
      {note && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{note}</p>}
    </section>
  );
}

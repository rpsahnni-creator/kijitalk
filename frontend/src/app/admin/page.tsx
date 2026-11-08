'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Search, Shield } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState, PageHeader } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError } from '@/lib/api';

type Tab = 'overview' | 'users' | 'lessons' | 'schools' | 'revenue' | 'ai';

interface Overview {
  users: { total: number; new7d: number; active7d: number; active1d: number; premium: number };
  revenue: { mrrInr: number; activeSubscriptions: number; thisMonthInr: number; allTimeInr: number };
  conversionPercent: number;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function OverviewTab({ token }: { token: string }) {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    void api.get<Overview>('/api/admin/overview', token).then(setData);
  }, [token]);
  if (!data) return <Loader2 className="mx-auto animate-spin text-brand-600" />;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Total learners" value={data.users.total} hint={`+${data.users.new7d} is hafte`} />
      <Stat label="Active (7 din)" value={data.users.active7d} hint={`${data.users.active1d} aaj`} />
      <Stat label="Premium" value={data.users.premium} hint={`${data.conversionPercent}% conversion`} />
      <Stat label="MRR" value={inr(data.revenue.mrrInr)} hint={`${data.revenue.activeSubscriptions} renewing`} />
      <Stat label="Is mahine" value={inr(data.revenue.thisMonthInr)} />
      <Stat label="All-time revenue" value={inr(data.revenue.allTimeInr)} />
    </div>
  );
}

interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  grade: string | null;
  state: string | null;
  subscriptionTier: string;
  streak: number;
  xp: number;
  lessonsCompleted: number;
  createdAt: string;
  lastActiveAt: string;
}

function UsersTab({ token }: { token: string }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; pageSize: number; users: AdminUser[] } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      void api
        .get<{ total: number; pageSize: number; users: AdminUser[] }>(
          `/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`,
          token
        )
        .then(setData);
    }, 250);
    return () => clearTimeout(t);
  }, [q, page, token]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Naam ya email se dhundho"
          className="input-field pl-9"
        />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/60">
            <tr>
              {['Learner', 'Class / State', 'Plan', 'Streak', 'Lessons', 'Joined', 'Last active'].map((h) => (
                <th key={h} className="px-4 py-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2">
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                  {u.grade ?? '—'} · {u.state ?? '—'}
                </td>
                <td className="px-4 py-2">
                  <span className={`chip ${u.subscriptionTier === 'premium' ? 'bg-accent-200 text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {u.subscriptionTier}
                  </span>
                </td>
                <td className="px-4 py-2">{u.streak}🔥</td>
                <td className="px-4 py-2">{u.lessonsCompleted}</td>
                <td className="px-4 py-2 text-slate-500">{date(u.createdAt)}</td>
                <td className="px-4 py-2 text-slate-500">{date(u.lastActiveAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data && <Loader2 className="mx-auto my-6 animate-spin text-brand-600" />}
      </div>
      {data && data.total > data.pageSize && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <button type="button" className="btn-secondary py-1.5" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Pichla
          </button>
          <span className="text-slate-500">
            Page {page} / {Math.ceil(data.total / data.pageSize)} · {data.total} learners
          </span>
          <button
            type="button"
            className="btn-secondary py-1.5"
            disabled={page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Agla
          </button>
        </div>
      )}
    </div>
  );
}

interface LessonRow {
  id: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  isActive: boolean;
}

interface LessonForm {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  durationMinutes: number;
  vocabulary: string;
  phrases: string;
  exercises: string;
  gradeBand: string;
  isActive: boolean;
}

const EMPTY_LESSON: LessonForm = {
  title: '',
  description: '',
  level: 'beginner',
  category: 'Daily Life',
  durationMinutes: 10,
  vocabulary: '',
  phrases: '',
  exercises: '[\n  { "type": "repeat", "prompt": "Repeat after me:", "answer": "Good morning!" }\n]',
  gradeBand: '',
  isActive: true,
};

function LessonEditor({ token, id, onDone }: { token: string; id: string | null; onDone: () => void }) {
  const [form, setForm] = useState<LessonForm | null>(id ? null : EMPTY_LESSON);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void api
      .get<{ lesson: Omit<LessonForm, 'vocabulary' | 'phrases' | 'exercises' | 'gradeBand'> & { vocabulary: string[]; phrases: string[]; exercises: unknown; gradeBand: string | null } }>(
        `/api/admin/lessons/${id}`,
        token
      )
      .then(({ lesson }) =>
        setForm({
          title: lesson.title,
          description: lesson.description,
          level: lesson.level,
          category: lesson.category,
          durationMinutes: lesson.durationMinutes,
          vocabulary: lesson.vocabulary.join(', '),
          phrases: lesson.phrases.join('\n'),
          exercises: JSON.stringify(lesson.exercises, null, 2),
          gradeBand: lesson.gradeBand ?? '',
          isActive: lesson.isActive,
        })
      );
  }, [id, token]);

  if (!form) return <Loader2 className="mx-auto animate-spin text-brand-600" />;
  const set = <K extends keyof LessonForm>(k: K, v: LessonForm[K]) => setForm({ ...form, [k]: v });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let exercises: unknown;
    try {
      exercises = JSON.parse(form.exercises);
    } catch {
      setError('Exercises valid JSON nahi hai.');
      return;
    }
    const body = {
      title: form.title,
      description: form.description,
      level: form.level,
      category: form.category,
      durationMinutes: Number(form.durationMinutes),
      vocabulary: form.vocabulary.split(',').map((s) => s.trim()).filter(Boolean),
      phrases: form.phrases.split('\n').map((s) => s.trim()).filter(Boolean),
      exercises,
      gradeBand: form.gradeBand.trim() || null,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (id) await api.patch(`/api/admin/lessons/${id}`, body, token);
      else await api.post('/api/admin/lessons', body, token);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message}${err.fields ? ` — ${Object.keys(err.fields).join(', ')}` : ''}` : 'Save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card space-y-3">
      <h3 className="font-display text-lg font-bold">{id ? 'Lesson edit karo' : 'Naya lesson'}</h3>
      <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
      <textarea className="input-field" rows={2} placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} required />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select className="input-field" value={form.level} onChange={(e) => set('level', e.target.value as LessonForm['level'])}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <input className="input-field" placeholder="Category" value={form.category} onChange={(e) => set('category', e.target.value)} required />
        <input className="input-field" type="number" min={1} max={120} value={form.durationMinutes} onChange={(e) => set('durationMinutes', Number(e.target.value))} aria-label="Minutes" />
        <input className="input-field" placeholder="Class band, e.g. 6-8" value={form.gradeBand} onChange={(e) => set('gradeBand', e.target.value)} />
      </div>
      <input className="input-field" placeholder="Vocabulary (comma se alag)" value={form.vocabulary} onChange={(e) => set('vocabulary', e.target.value)} />
      <textarea className="input-field" rows={3} placeholder="Phrases (har line mein ek)" value={form.phrases} onChange={(e) => set('phrases', e.target.value)} />
      <label className="label">Exercises (JSON)</label>
      <textarea className="input-field font-mono text-xs" rows={8} value={form.exercises} onChange={(e) => set('exercises', e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-brand-600" />
        Learners ko dikhao (active)
      </label>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Loader2 size={16} className="animate-spin" />} Save
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

function LessonsTab({ token }: { token: string }) {
  const [q, setQ] = useState('');
  const [lessons, setLessons] = useState<LessonRow[] | null>(null);
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const load = useCallback(() => {
    void api.get<{ lessons: LessonRow[] }>(`/api/admin/lessons?q=${encodeURIComponent(q)}`, token).then((d) => setLessons(d.lessons));
  }, [q, token]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  if (editing) {
    return (
      <LessonEditor
        token={token}
        id={editing === 'new' ? null : editing}
        onDone={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title ya category" className="input-field pl-9" />
        </div>
        <button type="button" onClick={() => setEditing('new')} className="btn-primary">
          <Plus size={16} /> Naya lesson
        </button>
      </div>
      <div className="card divide-y divide-slate-100 p-0 dark:divide-slate-800">
        {lessons?.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setEditing(l.id)}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span>
              <span className="font-medium">{l.title}</span>
              <span className="ml-2 text-xs text-slate-500">
                {l.category} · {l.level} · {l.durationMinutes} min
              </span>
            </span>
            {!l.isActive && <span className="chip bg-slate-200 text-slate-600">hidden</span>}
          </button>
        ))}
        {!lessons && <Loader2 className="mx-auto my-6 animate-spin text-brand-600" />}
      </div>
    </div>
  );
}

function RevenueTab({ token }: { token: string }) {
  const [data, setData] = useState<{
    monthly: Array<{ month: string; inr: number }>;
    invoices: Array<{ id: string; number: string; issuedAt: string; buyerName: string; totalPaise: number; placeOfSupply: string }>;
  } | null>(null);
  useEffect(() => {
    void api.get<NonNullable<typeof data>>('/api/admin/revenue', token).then(setData);
  }, [token]);
  if (!data) return <Loader2 className="mx-auto animate-spin text-brand-600" />;
  const max = Math.max(1, ...data.monthly.map((m) => m.inr));
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="section-title">Mahine ke hisaab se revenue</h3>
        <div className="flex h-40 items-end gap-2">
          {data.monthly.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1" title={`${m.month}: ${inr(m.inr)}`}>
              <div className="w-full rounded-t bg-brand-600" style={{ height: `${(m.inr / max) * 100}%`, minHeight: m.inr ? 4 : 1 }} />
              <span className="text-[10px] text-slate-500">{m.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-0">
        <h3 className="section-title px-5 pt-5">Recent invoices</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.invoices.length === 0 && <p className="px-5 pb-5 text-sm text-slate-500">Abhi koi invoice nahi.</p>}
          {data.invoices.map((i) => (
            <div key={i.id} className="flex justify-between px-5 py-2.5 text-sm">
              <span>
                <span className="font-medium">{i.number}</span>
                <span className="ml-2 text-slate-500">{i.buyerName} · {i.placeOfSupply}</span>
              </span>
              <span>{inr(i.totalPaise / 100)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProviderHealth {
  configured: boolean;
  paused: boolean;
  lastError: string | null;
  lastSuccessAt: string | null;
}
interface AiStats {
  providers: Record<string, { ok: number; failed: number; avgLatencyMs: number | null }>;
  byFeature: Record<string, number>;
  fallbackReplies: number;
  activeUsers: number;
  topErrors: Array<{ provider: string; error: string | null; count: number }>;
}

function AiTab({ token }: { token: string }) {
  const [data, setData] = useState<{ health: Record<'gemini' | 'claude', ProviderHealth>; last24h: AiStats; last7d: AiStats } | null>(null);
  useEffect(() => {
    void api.get<NonNullable<typeof data>>('/api/admin/ai', token).then(setData);
  }, [token]);
  if (!data) return <Loader2 className="mx-auto animate-spin text-brand-600" />;
  const status = (h: ProviderHealth) =>
    !h.configured ? ['Key nahi hai', 'bg-slate-200 text-slate-700'] : h.paused ? ['Paused', 'bg-red-100 text-red-700'] : ['OK', 'bg-leaf-100 text-leaf-800'];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {(['gemini', 'claude'] as const).map((p) => {
          const [label, cls] = status(data.health[p]);
          return (
            <div key={p} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold capitalize">{p}</p>
                <span className={`chip ${cls}`}>{label}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Last error: {data.health[p].lastError ?? '—'}</p>
              <p className="text-sm text-slate-500">Last success: {date(data.health[p].lastSuccessAt)}</p>
            </div>
          );
        })}
      </div>
      {(['last24h', 'last7d'] as const).map((w) => (
        <div key={w} className="card">
          <h3 className="section-title">{w === 'last24h' ? 'Pichle 24 ghante' : 'Pichle 7 din'}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {Object.entries(data[w].providers).map(([p, s]) => (
              <div key={p} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="font-semibold capitalize">{p}</p>
                <p className="text-leaf-700">{s.ok} ok</p>
                <p className="text-red-600">{s.failed} failed</p>
                {s.avgLatencyMs !== null && <p className="text-slate-500">{s.avgLatencyMs} ms avg</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Fallback replies: {data[w].fallbackReplies} · Active users: {data[w].activeUsers} · By feature:{' '}
            {Object.entries(data[w].byFeature).map(([f, n]) => `${f} ${n}`).join(', ') || '—'}
          </p>
          {data[w].topErrors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-red-700">
              {data[w].topErrors.map((e, i) => (
                <li key={i}>
                  {e.provider}: {e.error ?? 'no reply'} × {e.count}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

interface AdminSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  seats: number;
  seatsUsed: number;
  licenseExpiresAt: string | null;
  classes: number;
  staff: Array<{ email: string; role: string }>;
}

function SchoolsTab({ token }: { token: string }) {
  const [schools, setSchools] = useState<AdminSchool[] | null>(null);
  const [form, setForm] = useState({ name: '', city: '', state: '', seats: 50, licenseUntil: '', ownerEmail: '' });
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    void api.get<{ schools: AdminSchool[] }>('/api/admin/schools', token).then((d) => setSchools(d.schools));
  }, [token]);
  useEffect(load, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote('');
    try {
      await api.post(
        '/api/admin/schools',
        {
          name: form.name,
          city: form.city || undefined,
          state: form.state || undefined,
          seats: Number(form.seats),
          licenseExpiresAt: form.licenseUntil ? new Date(form.licenseUntil).toISOString() : null,
          ownerEmail: form.ownerEmail,
        },
        token
      );
      setForm({ name: '', city: '', state: '', seats: 50, licenseUntil: '', ownerEmail: '' });
      load();
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : 'School nahi bana');
    }
  };

  const update = async (id: string, seats: number, licenseUntil: string) => {
    await api.patch(`/api/admin/schools/${id}`, { seats, licenseExpiresAt: licenseUntil ? new Date(licenseUntil).toISOString() : null }, token);
    load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card grid gap-2 sm:grid-cols-3">
        <h3 className="section-title sm:col-span-3">Naya school licence</h3>
        <input className="input-field" placeholder="School ka naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="input-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        <input className="input-field" type="number" min={0} placeholder="Seats" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} aria-label="Seats" />
        <input className="input-field" type="date" value={form.licenseUntil} onChange={(e) => setForm({ ...form, licenseUntil: e.target.value })} aria-label="Licence valid until" />
        <input className="input-field" type="email" placeholder="Owner teacher ka email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} required />
        {note && <p className="text-sm text-red-600 sm:col-span-3">{note}</p>}
        <button type="submit" className="btn-primary sm:col-span-3"><Plus size={16} /> School banao</button>
      </form>
      <div className="space-y-3">
        {schools?.map((sc) => (
          <SchoolRow key={sc.id} school={sc} onSave={update} />
        ))}
        {schools?.length === 0 && <p className="text-sm text-slate-500">Abhi koi school nahi.</p>}
      </div>
    </div>
  );
}

function SchoolRow({ school, onSave }: { school: AdminSchool; onSave: (id: string, seats: number, until: string) => Promise<void> }) {
  const [seats, setSeats] = useState(school.seats);
  const [until, setUntil] = useState(school.licenseExpiresAt ? school.licenseExpiresAt.slice(0, 10) : '');
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{school.name}</p>
        <p className="text-xs text-slate-500">
          {[school.city, school.state].filter(Boolean).join(', ') || '—'} · {school.classes} classes · {school.seatsUsed}/{school.seats} seats ·{' '}
          {school.staff.map((st) => `${st.email} (${st.role})`).join(', ')}
        </p>
      </div>
      <input className="input-field w-24 py-2" type="number" min={0} value={seats} onChange={(e) => setSeats(Number(e.target.value))} aria-label="Seats" />
      <input className="input-field w-40 py-2" type="date" value={until} onChange={(e) => setUntil(e.target.value)} aria-label="Licence until" />
      <button type="button" className="btn-secondary py-2" onClick={() => void onSave(school.id, seats, until)}>Save</button>
    </div>
  );
}

const TABS: Array<[Tab, string]> = [
  ['overview', 'Overview'],
  ['users', 'Users'],
  ['lessons', 'Lessons'],
  ['schools', 'Schools'],
  ['revenue', 'Revenue'],
  ['ai', 'AI'],
];

export default function AdminPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [initialized, user, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get('/api/admin/me', token)
      .then(() => setAllowed(true))
      .catch(() => setAllowed(false));
  }, [token]);

  if (!initialized || !user || allowed === null) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader icon={Shield} title="Admin" subtitle="Learners, lessons, revenue aur AI health" />
        {!allowed ? (
          <ErrorState message="Yeh page sirf admins ke liye hai. (backend/.env mein ADMIN_EMAILS)" />
        ) : (
          <>
            <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
              {TABS.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`pill-tab ${tab === id ? 'pill-tab-active' : 'pill-tab-idle'}`}>
                  {label}
                </button>
              ))}
            </div>
            {token && tab === 'overview' && <OverviewTab token={token} />}
            {token && tab === 'users' && <UsersTab token={token} />}
            {token && tab === 'lessons' && <LessonsTab token={token} />}
            {token && tab === 'schools' && <SchoolsTab token={token} />}
            {token && tab === 'revenue' && <RevenueTab token={token} />}
            {token && tab === 'ai' && <AiTab token={token} />}
          </>
        )}
      </div>
    </AppShell>
  );
}

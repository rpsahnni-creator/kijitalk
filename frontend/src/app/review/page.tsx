'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState, ErrorState, PageHeader } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';

interface Card {
  id: string;
  original: string;
  box: number;
}
interface Stats {
  due: number;
  total: number;
  mastered: number;
}
interface Result {
  correct: boolean;
  expected: string;
  mastered: boolean;
}

const BOX_LABELS = ['Naya', '1 din', '3 din', '1 hafta', '2 hafte', 'Mastered'];

export default function ReviewPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [initialized, user, router]);

  const load = useCallback(() => {
    if (!token) return;
    setError(false);
    api
      .get<{ cards: Card[]; stats: Stats }>('/api/review', token)
      .then((d) => {
        setCards(d.cards);
        setStats(d.stats);
        setIndex(0);
        setScore(0);
        setResult(null);
        setAnswer('');
      })
      .catch(() => setError(true));
  }, [token]);

  useEffect(load, [load]);

  if (!initialized || !user) return <LoadingScreen />;

  const card = cards?.[index];
  const finished = cards !== null && cards.length > 0 && index >= cards.length;

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !answer.trim() || checking) return;
    setChecking(true);
    try {
      const r = await api.post<Result>(`/api/review/${card.id}`, { answer }, token);
      setResult(r);
      if (r.correct) setScore((s) => s + 1);
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    setResult(null);
    setAnswer('');
    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (cards && nextIndex >= cards.length) track('review_session_done', { cards: cards.length });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader
          feature="idea"
          title="Revision · दोहराओ"
          subtitle="Aapki purani galtiyan — sahi karke yaad pakki karo"
        />

        {stats && (
          <div className="mb-6 grid grid-cols-3 gap-3 text-center">
            <div className="card p-4"><p className="text-2xl font-bold text-brand-600">{stats.due}</p><p className="text-xs text-slate-500">Aaj ke liye</p></div>
            <div className="card p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-slate-500">Total</p></div>
            <div className="card p-4"><p className="text-2xl font-bold text-leaf-700">{stats.mastered}</p><p className="text-xs text-slate-500">Mastered</p></div>
          </div>
        )}

        {error && <ErrorState message="Revision load nahi ho paya." onRetry={load} />}
        {!error && cards === null && <Loader2 className="mx-auto animate-spin text-brand-600" />}

        {cards?.length === 0 && (
          <EmptyState
            title="Aaj ke liye kuch nahi 🎉"
            description="Kiki ke saath chat karo — jo galtiyan hongi, wo yahan revision ke liye aa jayengi."
            action={<Link href="/chat" className="btn-primary">Kiki se baat karo</Link>}
          />
        )}

        {card && (
          <form onSubmit={check} className="card animate-fade-up" key={card.id}>
            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Card {index + 1}/{cards!.length}</span>
              <span className="chip bg-slate-100 dark:bg-slate-800">{BOX_LABELS[card.box] ?? ''}</span>
            </div>
            <p className="text-sm text-slate-500">Aapne pehle yeh likha tha — ise sahi English mein likho:</p>
            <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-800 line-through decoration-red-300 dark:bg-red-950/30 dark:text-red-200">
              {card.original}
            </p>
            <input
              value={answer}
              autoFocus
              disabled={!!result}
              onChange={(e) => setAnswer(e.target.value)}
              className="input-field mt-4"
              placeholder="Sahi sentence…"
              aria-label="Corrected sentence"
            />
            {!result ? (
              <button type="submit" disabled={!answer.trim() || checking} className="btn-primary mt-4 w-full">
                {checking && <Loader2 size={16} className="animate-spin" />} Check
              </button>
            ) : (
              <>
                <div
                  aria-live="polite"
                  className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                    result.correct ? 'bg-leaf-50 text-leaf-800 dark:bg-leaf-950/40 dark:text-leaf-200' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200'
                  }`}
                >
                  {result.correct ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
                  <span>
                    {result.correct ? (result.mastered ? 'Mastered! Yeh ab pakka yaad hai 🏆' : 'Sahi! Agli baar thode din baad aayega.') : 'Abhi nahi — kal phir aayega.'}{' '}
                    {!result.correct && <>Sahi jawab: <strong>{result.expected}</strong></>}
                  </span>
                </div>
                <button type="button" onClick={next} className="btn-primary mt-4 w-full">Agla card</button>
              </>
            )}
          </form>
        )}

        {finished && (
          <div className="card text-center">
            <p className="font-display text-xl font-bold">Revision complete!</p>
            <p className="mt-1 text-slate-500">{score}/{cards!.length} sahi</p>
            <button type="button" onClick={load} className="btn-secondary mt-4">
              <RotateCcw size={16} /> Aur cards dekho
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

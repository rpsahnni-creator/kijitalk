'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, Mic, Square, Trophy } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorState, PageHeader } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { speechErrorMessage, speechService } from '@/lib/speech';
import { track } from '@/lib/analytics';

interface Test {
  mcq: Array<{ id: string; prompt: string; promptHindi?: string; options: string[] }>;
  speaking: Array<{ id: string; sentence: string }>;
}
interface Result {
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  correct: number;
  total: number;
  path: Array<{ id: string; title: string; category: string; durationMinutes: number }>;
}

const LEVEL_TEXT: Record<Result['level'], string> = {
  beginner: 'Beginner — shuruaat se, aaram se',
  intermediate: 'Intermediate — aap achha kar rahe ho!',
  advanced: 'Advanced — wah! Fluency ki taraf',
};

/** ~5-minute level test: 10 graded questions + 3 sentences read aloud. */
export default function PlacementPage() {
  const { user, token, initialized, syncProfile } = useAuthStore();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const [mcq, setMcq] = useState<Record<string, number>>({});
  const [speaking, setSpeaking] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [initialized, user, router]);

  useEffect(() => {
    if (!token) return;
    api.get<Test>('/api/placement', token).then(setTest).catch(() => setError(true));
  }, [token]);

  useEffect(() => () => speechService.stopListening(), []);

  if (!initialized || !user) return <LoadingScreen />;

  const total = test ? test.mcq.length + test.speaking.length : 0;
  const inMcq = test && step < test.mcq.length;
  const q = test && inMcq ? test.mcq[step] : null;
  const s = test && !inMcq ? test.speaking[step - test.mcq.length] : null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await api.post<Result>('/api/placement', { mcq, speaking }, token);
      setResult(r);
      track('placement_done', { level: r.level, score: r.score });
      await syncProfile();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step + 1 >= total) void submit();
    else setStep(step + 1);
    setMicNote('');
  };

  const record = () => {
    if (!s) return;
    if (listening) {
      speechService.stopListening();
      setListening(false);
      return;
    }
    setMicNote('');
    setListening(true);
    speechService.startListening(
      (text) => {
        setSpeaking((prev) => ({ ...prev, [s.id]: text }));
        setListening(false);
      },
      (code) => {
        setListening(false);
        setMicNote(speechErrorMessage(code));
      }
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader feature="courses" title="Level test" subtitle="5 minute — aapke liye sahi lessons chunne ke liye" />

        {error && <ErrorState message="Test load ya save nahi ho paya." onRetry={() => window.location.reload()} />}
        {!error && !test && <Loader2 className="mx-auto animate-spin text-brand-600" />}

        {result && (
          <div className="card animate-fade-up text-center">
            <Trophy className="mx-auto mb-3 text-accent-600" size={44} />
            <p className="font-display text-2xl font-bold capitalize">{result.level}</p>
            <p className="text-slate-500">{LEVEL_TEXT[result.level]}</p>
            <p className="mt-2 text-sm text-slate-500">
              Score {result.score}/100 · {result.correct}/{result.total} sawal sahi
            </p>
            {result.path.length > 0 && (
              <div className="mt-6 text-left">
                <p className="section-title">Aapka lesson path</p>
                <ol className="space-y-2">
                  {result.path.map((l, i) => (
                    <li key={l.id}>
                      <Link href={`/lessons/${l.id}`} className="card card-interactive flex items-center gap-3 p-3 text-sm">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                        <span className="flex-1 font-medium">{l.title}</span>
                        <span className="text-xs text-slate-500">{l.durationMinutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <Link href="/dashboard" className="btn-primary mt-6 w-full">
              Dashboard par jao <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {test && !result && (
          <div className="card animate-fade-up" key={step}>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(step / total) * 100}%` }} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {inMcq ? `Sawal ${step + 1}/${test.mcq.length}` : `Bolo ${step - test.mcq.length + 1}/${test.speaking.length}`}
            </p>

            {q && (
              <>
                <p className="text-lg font-semibold">{q.prompt}</p>
                {q.promptHindi && <p className="mb-3 text-sm text-slate-500">{q.promptHindi}</p>}
                <div className="mt-3 grid gap-2">
                  {q.options.map((o, i) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setMcq({ ...mcq, [q.id]: i })}
                      aria-pressed={mcq[q.id] === i}
                      className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                        mcq[q.id] === i ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </>
            )}

            {s && (
              <>
                <p className="text-sm text-slate-500">Yeh sentence zor se padho:</p>
                <p className="mt-2 font-display text-xl font-semibold">&ldquo;{s.sentence}&rdquo;</p>
                <button
                  type="button"
                  onClick={record}
                  className={`mt-5 flex h-16 w-16 items-center justify-center rounded-full text-white ${listening ? 'bg-red-500' : 'gradient-hero'}`}
                  aria-label={listening ? 'Stop' : 'Record'}
                >
                  {listening ? <Square size={22} fill="currentColor" /> : <Mic size={26} />}
                </button>
                {speaking[s.id] && <p className="mt-3 text-sm">Aapne bola: <em>{speaking[s.id]}</em></p>}
                {micNote && <p className="mt-2 text-xs text-red-600">{micNote}</p>}
                <input
                  className="input-field mt-3"
                  placeholder="Mic nahi chal raha? Yahan type karo"
                  value={speaking[s.id] ?? ''}
                  onChange={(e) => setSpeaking({ ...speaking, [s.id]: e.target.value })}
                  aria-label="Typed answer"
                />
              </>
            )}

            <div className="mt-6 flex justify-between gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="btn-secondary">
                Pichla
              </button>
              <button type="button" disabled={submitting || (!!q && mcq[q.id] === undefined)} onClick={next} className="btn-primary">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {step + 1 >= total ? 'Result dekho' : s ? (speaking[s.id] ? 'Agla' : 'Skip') : 'Agla'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

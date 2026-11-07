'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, Mic, Square, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageHeader } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError } from '@/lib/api';
import { speechErrorMessage, speechService } from '@/lib/speech';

const PRACTICE_PHRASES = [
  'The weather is beautiful today.',
  'I would like to order a coffee, please.',
  'Could you tell me where the nearest station is?',
  'I have been learning English for six months.',
  'Practice makes perfect when learning a new language.',
];

function scoreTone(score: number) {
  if (score >= 80) return { ring: '#2fa233', text: 'text-success-600', chip: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300', label: 'Excellent!' };
  if (score >= 60) return { ring: '#e0ad00', text: 'text-accent-600', chip: 'bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300', label: 'Good — thoda aur!' };
  return { ring: '#ef4444', text: 'text-red-500', chip: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Keep practicing' };
}

function ScoreRing({ score }: { score: number }) {
  const tone = scoreTone(score);
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke={tone.ring}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${tone.text}`}>{score}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">score</span>
      </div>
    </div>
  );
}

export default function VoicePage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [wordScores, setWordScores] = useState<Array<{ word: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  const phrase = PRACTICE_PHRASES[phraseIndex];

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    setSupported(speechService.isSupported());
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const analyzePronunciation = async (spoken: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await api.post<{
        score: number;
        feedback: string;
        wordScores: Array<{ word: string; score: number }>;
      }>('/api/voice/pronunciation', { expected: phrase, spoken }, token);
      setScore(Math.round(result.score));
      setFeedback(result.feedback);
      setWordScores(result.wordScores ?? []);
    } catch (err) {
      setError(
        err instanceof ApiError && err.limitReached
          ? err.message
          : 'Pronunciation check nahi ho paya. Dobara try karo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    setTranscript('');
    setScore(null);
    setFeedback('');
    setError('');
    setWordScores([]);
    setListening(true);
    speechService.startListening(
      (text) => {
        setTranscript(text);
        setListening(false);
        void analyzePronunciation(text);
      },
      (code) => {
        setListening(false);
        setError(speechErrorMessage(code));
      }
    );
  };

  const stopListening = () => {
    speechService.stopListening();
    setListening(false);
  };

  const goTo = (index: number) => {
    stopListening();
    setPhraseIndex((index + PRACTICE_PHRASES.length) % PRACTICE_PHRASES.length);
    setTranscript('');
    setScore(null);
    setFeedback('');
    setError('');
    setWordScores([]);
  };

  if (!initialized || !user) return <LoadingScreen />;

  const tone = score !== null ? scoreTone(score) : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader icon={Mic} title="Voice Practice" subtitle="Phrase bolo aur turant pronunciation feedback pao" />

        <div className="card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Phrase {phraseIndex + 1} of {PRACTICE_PHRASES.length}
            </span>
            <div className="flex gap-1">
              {PRACTICE_PHRASES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === phraseIndex ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-center font-display text-2xl font-semibold leading-snug">&ldquo;{phrase}&rdquo;</p>
          <div className="mt-5 flex items-center justify-between">
            <button type="button" onClick={() => goTo(phraseIndex - 1)} className="btn-ghost" aria-label="Previous phrase">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => speechService.speak(phrase)} className="btn-secondary py-2">
              <Volume2 size={16} /> Suno
            </button>
            <button type="button" onClick={() => goTo(phraseIndex + 1)} className="btn-ghost" aria-label="Next phrase">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="mb-3 flex justify-center">
          <div className="relative">
            {listening && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-500/40" />}
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={loading || !supported}
              aria-label={listening ? 'Stop recording' : 'Start recording'}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-xl transition disabled:opacity-50 ${
                listening ? 'bg-red-500 shadow-red-500/30' : 'gradient-hero shadow-brand-700/30 hover:scale-105'
              }`}
            >
              {listening ? <Square size={30} fill="currentColor" /> : <Mic size={36} />}
            </button>
          </div>
        </div>

        <p className="mb-6 text-center text-sm text-slate-500" aria-live="polite">
          {!supported
            ? 'Yeh browser voice input support nahi karta — Chrome ya Edge use karo.'
            : listening
            ? 'Sun rahe hain… ab boliye'
            : loading
            ? 'Pronunciation check ho raha hai…'
            : 'Mic dabao aur phrase bolo'}
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {transcript && (
          <div className="card mb-4 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Aapne bola</p>
            <p className="font-medium">{transcript}</p>
          </div>
        )}

        {score !== null && tone && (
          <div className="card animate-fade-up text-center">
            <ScoreRing score={score} />
            <p className={`mt-3 text-sm font-semibold ${tone.text}`}>{tone.label}</p>
            {feedback && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{feedback}</p>}
            {wordScores.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {wordScores.map(({ word, score: ws }, i) => (
                  <span key={`${word}-${i}`} className={`chip px-3 py-1 text-sm ${scoreTone(ws).chip}`}>
                    {word} <span className="opacity-70">{Math.round(ws)}</span>
                  </span>
                ))}
              </div>
            )}
            <button type="button" onClick={() => goTo(phraseIndex + 1)} className="btn-primary mt-6 w-full">
              Agla phrase <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

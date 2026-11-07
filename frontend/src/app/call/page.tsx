'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Languages, Lightbulb, Phone, PhoneOff } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { SegmentedEngine } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { useTutorStore } from '@/stores/useTutorStore';
import { api, ApiError, TutorEngines } from '@/lib/api';
import { speechErrorMessage, speechService } from '@/lib/speech';

type CallStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

const STATUS_TEXT: Record<CallStatus, string> = {
  idle: 'Voice call mode — Kiki sunegi aur jawab degi',
  listening: 'Sun rahi hoon… boliye',
  thinking: 'Soch rahi hoon…',
  speaking: 'Kiki bol rahi hai…',
};

const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'unsupported']);
const MAX_SILENT_RETRIES = 2;

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function CallModePage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [teachingTip, setTeachingTip] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const activeRef = useRef(false);
  const silentRetries = useRef(0);
  const { engine, claudeAvailable, recognitionLang, setEngine, setClaudeAvailable, setRecognitionLang } =
    useTutorStore();

  // Latest values for the async listen/reply loop, so it never acts on stale state.
  const latest = useRef({ token, engine, recognitionLang });
  latest.current = { token, engine, recognitionLang };

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    api
      .get<TutorEngines>('/api/chat/engines')
      .then((d) => setClaudeAvailable(d.claude))
      .catch(() => setClaudeAvailable(false));
  }, [setClaudeAvailable]);

  // Leaving the page must hang up — otherwise Kiki keeps listening and talking.
  useEffect(
    () => () => {
      activeRef.current = false;
      speechService.stopListening();
      speechService.stopSpeaking();
    },
    []
  );

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const endCall = () => {
    activeRef.current = false;
    setActive(false);
    setStatus('idle');
    speechService.stopListening();
    speechService.stopSpeaking();
  };

  const listen = () => {
    if (!activeRef.current) return;
    setStatus('listening');
    speechService.startListening(
      (text) => {
        silentRetries.current = 0;
        setTranscript(text);
        void reply(text);
      },
      (code) => {
        if (!activeRef.current) return;
        if (FATAL_ERRORS.has(code)) {
          setError(speechErrorMessage(code));
          endCall();
          return;
        }
        if (silentRetries.current < MAX_SILENT_RETRIES) {
          silentRetries.current += 1;
          listen();
          return;
        }
        silentRetries.current = 0;
        setStatus('idle');
        setError('Kuch sunai nahi diya. "Phir se suno" dabao aur boliye.');
      },
      latest.current.recognitionLang
    );
  };

  const reply = async (text: string) => {
    const { token: tk, engine: eng } = latest.current;
    if (!tk || !text.trim()) return;
    setStatus('thinking');
    try {
      const res = await api.post<{
        reply: string;
        teachingTip?: string | null;
        session: { id: string };
      }>('/api/chat/message', { sessionId: sessionIdRef.current, message: text, engine: eng }, tk);
      if (!activeRef.current) return;

      sessionIdRef.current = res.session.id;
      setLastReply(res.reply);
      setTeachingTip(res.teachingTip ?? null);
      setStatus('speaking');
      speechService.speak(res.reply, () => {
        if (activeRef.current) listen();
      });
    } catch (err) {
      if (!activeRef.current) return;
      if (err instanceof ApiError && err.limitReached) {
        setLastReply(err.message);
        setStatus('speaking');
        speechService.speak(err.message, () => endCall());
        return;
      }
      setError('Kiki tak message nahi pahuncha — dobara boliye.');
      listen();
    }
  };

  const startCall = () => {
    setError('');
    if (!speechService.isSupported()) {
      setError(speechErrorMessage('unsupported'));
      return;
    }
    activeRef.current = true;
    silentRetries.current = 0;
    setSeconds(0);
    setTranscript('');
    setTeachingTip(null);
    setActive(true);
    setStatus('speaking');
    setLastReply("Hi! I'm Kiki. Boliye — Hindi ya English, main sun rahi hoon!");
    speechService.speak("Hi! I'm Kiki. You can speak in Hindi or English. I'm listening!", () => listen());
  };

  if (!initialized || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100dvh-9.5rem)] max-w-lg flex-col items-center justify-center px-6 py-8 lg:min-h-screen">
        <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
          {status === 'listening' && (
            <>
              <span className="absolute inset-4 animate-pulse-ring rounded-full bg-brand-500/30" />
              <span className="absolute inset-4 animate-pulse-ring rounded-full bg-brand-500/20 [animation-delay:0.8s]" />
            </>
          )}
          {status === 'speaking' && <span className="absolute inset-2 animate-pulse rounded-full bg-accent-400/30 blur-xl" />}
          <div className="relative rounded-full bg-white p-2 shadow-xl dark:bg-slate-900">
            <KikiAvatar size="xl" animated={status === 'thinking'} />
          </div>
        </div>

        <h1 className="mb-1 font-display text-2xl font-bold">Call with Kiki</h1>
        <p className="mb-1 text-sm text-slate-500" aria-live="polite">{STATUS_TEXT[status]}</p>
        {active && <p className="mb-4 font-mono text-sm tabular-nums text-slate-400">{formatDuration(seconds)}</p>}
        {!active && <div className="mb-4" />}

        {!active && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setRecognitionLang(recognitionLang === 'hi-IN' ? 'en-US' : 'hi-IN')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Languages size={14} />
              {recognitionLang === 'hi-IN' ? 'Main Hindi/Hinglish bolunga' : 'I will speak English'}
            </button>
            {claudeAvailable && <SegmentedEngine engine={engine} onChange={setEngine} />}
          </div>
        )}

        {error && (
          <div className="mb-4 flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {lastReply && (
          <div className="card mb-6 w-full p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Kiki</p>
            <p className="text-slate-800 dark:text-slate-100">{lastReply}</p>
            {transcript && (
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">You:</span> {transcript}
              </p>
            )}
            {teachingTip && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent-50 px-3 py-2 text-left text-xs text-accent-800 dark:bg-accent-900/30 dark:text-accent-200">
                <Lightbulb size={14} className="mt-0.5 shrink-0" />
                <p>{teachingTip}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          {active && status === 'idle' && (
            <button type="button" onClick={() => { setError(''); listen(); }} className="btn-secondary">
              Phir se suno
            </button>
          )}
          {!active ? (
            <button
              type="button"
              onClick={startCall}
              aria-label="Start call"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-success-500 text-white shadow-xl shadow-success-500/30 transition hover:scale-105"
            >
              <Phone size={32} />
            </button>
          ) : (
            <button
              type="button"
              onClick={endCall}
              aria-label="End call"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-xl shadow-red-500/30 transition hover:scale-105"
            >
              <PhoneOff size={32} />
            </button>
          )}
        </div>
        {!active && <p className="mt-3 text-xs text-slate-400">Call shuru karne ke liye dabao</p>}
      </div>
    </AppShell>
  );
}

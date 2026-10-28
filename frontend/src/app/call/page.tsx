'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Lightbulb, Phone, PhoneOff } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { useAuthStore } from '@/stores/useStore';
import { useTutorStore } from '@/stores/useTutorStore';
import { api, TutorEngines } from '@/lib/api';
import { speechService } from '@/lib/speech';

export default function CallModePage() {
  const { user, token, initialized, profile } = useAuthStore();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [teachingTip, setTeachingTip] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const activeRef = useRef(false);
  const { engine, claudeAvailable, recognitionLang, setEngine, setClaudeAvailable, setRecognitionLang } =
    useTutorStore();

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    api
      .get<TutorEngines>('/api/chat/engines')
      .then((d) => setClaudeAvailable(d.claude))
      .catch(() => setClaudeAvailable(false));
  }, [setClaudeAvailable]);

  const listen = useCallback(() => {
    if (!activeRef.current) return;
    setStatus('listening');
    setTranscript('');
    speechService.startListening(
      (text) => {
        setTranscript(text);
        void sendMessage(text);
      },
      () => {
        if (activeRef.current) setStatus('idle');
      },
      recognitionLang
    );
  }, [recognitionLang]);

  const sendMessage = async (text: string) => {
    if (!token || !text.trim()) return;
    setStatus('thinking');
    try {
      const res = await api.post<{
        reply: string;
        teachingTip?: string | null;
        session: { id: string };
      }>('/api/chat/message', { sessionId: sessionIdRef.current, message: text, engine }, token);

      sessionIdRef.current = res.session.id;
      setLastReply(res.reply);
      setTeachingTip(res.teachingTip ?? null);
      setStatus('speaking');

      void (profile?.settings?.voiceSpeed ?? 0.9);
      speechService.speak(res.reply, () => {
        if (activeRef.current) listen();
      });
    } catch {
      setStatus('idle');
      if (activeRef.current) listen();
    }
  };

  const startCall = () => {
    activeRef.current = true;
    setActive(true);
    setLastReply("Hi! I'm Kiki. Boliye — Hindi ya English, main sun rahi hoon!");
    speechService.speak("Hi! I'm Kiki. You can speak in Hindi or English. I'm listening!", () => listen());
  };

  const endCall = () => {
    activeRef.current = false;
    setActive(false);
    setStatus('idle');
    speechService.stopListening();
    speechService.stopSpeaking();
  };

  if (!initialized || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col items-center justify-center p-6">
        <div className="relative mb-8">
          <div
            className={`absolute inset-0 rounded-full bg-accent-400/30 blur-2xl transition ${
              status === 'listening' ? 'scale-150 animate-pulse' : status === 'speaking' ? 'scale-125' : 'scale-100'
            }`}
          />
          <KikiAvatar size="xl" animated={status === 'thinking'} />
        </div>

        <h1 className="mb-1 text-2xl font-bold">Call with Kiki</h1>
        <p className="mb-4 text-slate-500">
          {status === 'listening' && 'Sun rahi hoon... boliye'}
          {status === 'thinking' && 'Soch rahi hoon...'}
          {status === 'speaking' && 'Kiki bol rahi hai...'}
          {status === 'idle' && 'Voice call mode — auto listen & reply'}
        </p>

        {!active && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setRecognitionLang(recognitionLang === 'hi-IN' ? 'en-US' : 'hi-IN')}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              <Languages size={14} />
              {recognitionLang === 'hi-IN' ? 'Main Hindi/Hinglish bolunga' : 'I will speak English'}
            </button>
            {claudeAvailable && (
              <div className="flex rounded-full bg-slate-100 p-1 text-xs dark:bg-slate-700">
                <button
                  type="button"
                  onClick={() => setEngine('gemini')}
                  className={`rounded-full px-3 py-1.5 font-medium transition ${
                    engine === 'gemini' ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500'
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setEngine('claude')}
                  className={`rounded-full px-3 py-1.5 font-medium transition ${
                    engine === 'claude' ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500'
                  }`}
                >
                  ✨ Premium
                </button>
              </div>
            )}
          </div>
        )}

        {lastReply && (
          <div className="card mb-6 w-full text-center">
            <p className="text-sm text-slate-500">Kiki</p>
            <p>{lastReply}</p>
            {transcript && <p className="mt-2 text-sm text-accent-600">You: {transcript}</p>}
            {teachingTip && (
              <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-accent-50 px-3 py-2 text-left text-xs text-accent-800 dark:bg-accent-900/30 dark:text-accent-200">
                <Lightbulb size={14} className="mt-0.5 shrink-0" />
                <p>{teachingTip}</p>
              </div>
            )}
          </div>
        )}

        {!active ? (
          <button type="button" onClick={startCall} className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30">
            <Phone size={36} />
          </button>
        ) : (
          <button type="button" onClick={endCall} className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30">
            <PhoneOff size={36} />
          </button>
        )}
      </div>
    </AppShell>
  );
}

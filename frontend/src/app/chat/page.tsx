'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Languages, Lightbulb, Mic, Square, Volume2, RotateCcw, PenLine } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { SegmentedEngine } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { useTutorStore } from '@/stores/useTutorStore';
import { api, ApiError, ChatMessage, TutorEngines } from '@/lib/api';
import { speechErrorMessage, speechService } from '@/lib/speech';

const SUGGESTIONS = ['Mera naam Rahul hai', 'Aaj school mein kya hua?', 'How do I introduce myself?', 'Mujhe interview ki taiyari karni hai'];

export default function ChatPage() {
  const { user, token, initialized, profile } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { engine, claudeAvailable, setEngine, setClaudeAvailable } = useTutorStore();

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    api
      .get<TutorEngines>('/api/chat/engines')
      .then((d) => setClaudeAvailable(d.claude))
      .catch(() => setClaudeAvailable(false));
  }, [setClaudeAvailable]);

  useEffect(
    () => () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    },
    []
  );

  const sendMessage = async (text = input) => {
    const userMsg = text.trim();
    if (!userMsg || !token || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post<{
        reply: string;
        corrections: string[];
        translation?: string | null;
        wasHindi?: boolean;
        teachingTip?: string | null;
        session: { id: string };
      }>('/api/chat/message', { sessionId, message: userMsg, engine }, token);

      setSessionId(res.session.id);

      setMessages((prev) => {
        const updated = [...prev];
        const lastUser = updated.length - 1;
        if (res.wasHindi && res.translation && lastUser >= 0 && updated[lastUser].role === 'user') {
          updated[lastUser] = { ...updated[lastUser], translation: res.translation, wasHindi: true };
        }
        return [
          ...updated,
          { role: 'assistant', content: res.reply, corrections: res.corrections, teachingTip: res.teachingTip },
        ];
      });
    } catch (err) {
      const content =
        err instanceof ApiError && err.limitReached
          ? err.message
          : 'Sorry, Kiki abhi jawab nahi de paayi. Dobara try karo! 🙏';
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleVoiceInput = () => {
    setMicError('');
    if (listening) {
      speechService.stopListening();
      setListening(false);
      return;
    }
    setListening(true);
    speechService.startListening(
      (text) => {
        setInput(text);
        setListening(false);
        inputRef.current?.focus();
      },
      (code) => {
        setListening(false);
        setMicError(speechErrorMessage(code));
      },
      'hi-IN'
    );
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  if (!initialized || !user) return <LoadingScreen />;

  const firstName = profile?.displayName?.split(' ')[0];

  return (
    <AppShell footer={false}>
      <div className="mx-auto flex h-[calc(100dvh-8.25rem-env(safe-area-inset-bottom))] max-w-3xl flex-col px-3 py-4 sm:px-6 lg:h-[calc(100dvh-3.75rem)] lg:py-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <KikiAvatar size="md" />
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold sm:text-xl">Kiki</h1>
              <p className="truncate text-xs text-success-600 sm:text-sm">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success-500 align-middle" />
                Online · Hindi ya English mein baat karo
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {claudeAvailable && <SegmentedEngine engine={engine} onChange={setEngine} />}
            {messages.length > 0 && (
              <button type="button" onClick={newChat} className="btn-ghost h-9 w-9 p-0" aria-label="New chat" title="New chat">
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <KikiAvatar size="xl" className="mb-5" />
              <p className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
                Namaste{firstName ? `, ${firstName}` : ''}! Main Kiki hoon 👋
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Hindi mein likho — main English mein translate karke sikhaungi. Ya seedha English mein practice karo.
              </p>
              <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex animate-fade-up gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && <KikiAvatar size="sm" online={false} className="mt-0.5" />}
              <div className={`flex max-w-[85%] flex-col gap-1.5 sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-md bg-brand-600 text-white'
                      : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.translation && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm">
                      <Languages size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">In English</p>
                        <p>{msg.translation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {msg.corrections && msg.corrections.length > 0 && (
                  <div className="w-full rounded-xl border border-accent-200 bg-accent-50/70 px-3 py-2 dark:border-accent-900/50 dark:bg-accent-950/20">
                    <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                      <PenLine size={12} /> Correction
                    </p>
                    {msg.corrections.map((c, j) => (
                      <p key={j} className="text-sm text-slate-700 dark:text-slate-300">{c}</p>
                    ))}
                  </div>
                )}
                {msg.teachingTip && (
                  <div className="flex w-full items-start gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
                    <Lightbulb size={14} className="mt-0.5 shrink-0" />
                    <p>{msg.teachingTip}</p>
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => speechService.speak(msg.content)}
                    className="inline-flex items-center gap-1 px-1 text-xs text-slate-400 transition hover:text-brand-600"
                  >
                    <Volume2 size={12} /> Suno
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <KikiAvatar size="sm" online={false} />
              <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {micError && <p className="mt-2 px-1 text-xs text-red-500">{micError}</p>}

        <form
          className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
              listening ? 'animate-pulse bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label={listening ? 'Stop voice input' : 'Speak in Hindi'}
            title="Hindi mein bolo"
          >
            {listening ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Don't submit while a Hindi/Indic keyboard is still composing a word.
              if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
            }}
            placeholder={listening ? 'Sun rahi hoon…' : 'Hindi ya English mein likho…'}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-slate-400"
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </AppShell>
  );
}

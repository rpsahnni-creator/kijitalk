'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Swords, Timer, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { ErrorState } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { useTutorStore } from '@/stores/useTutorStore';
import { api, ApiError } from '@/lib/api';

interface DebateTopic {
  id: string;
  topic: string;
  level: string;
}

type Msg = { role: 'user' | 'assistant'; content: string };

export default function DebatePage() {
  const { user, token, initialized } = useAuthStore();
  const engine = useTutorStore((s) => s.engine);
  const router = useRouter();
  const [topics, setTopics] = useState<DebateTopic[] | null>(null);
  const [topicsError, setTopicsError] = useState(false);
  const [topicId, setTopicId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const loadTopics = useCallback(() => {
    setTopicsError(false);
    api
      .get<{ topics: DebateTopic[] }>('/api/debate/topics')
      .then((d) => {
        setTopics(d.topics);
        setTopicId((cur) => cur || d.topics[0]?.id || '');
      })
      .catch(() => setTopicsError(true));
  }, []);

  useEffect(loadTopics, [loadTopics]);

  // The timer measures your speaking time: it starts with your first argument.
  const started = messages.length > 0;
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const reset = (nextTopic = topicId) => {
    setTopicId(nextTopic);
    setMessages([]);
    setSeconds(0);
    setInput('');
  };

  const send = async () => {
    if (!input.trim() || !token || !topicId || loading) return;
    const userMsg = input.trim();
    setInput('');
    const history = messages;
    setMessages([...history, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string }>(
        '/api/debate/message',
        { topicId, message: userMsg, history, engine },
        token
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      const content =
        err instanceof ApiError && err.limitReached ? err.message : 'Try again — apna point English mein bolo.';
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !user) return <LoadingScreen />;

  const topic = topics?.find((t) => t.id === topicId);

  return (
    <AppShell footer={false}>
      <div className="mx-auto flex h-[calc(100dvh-8.25rem-env(safe-area-inset-bottom))] max-w-3xl flex-col px-3 py-4 sm:px-6 lg:h-[calc(100dvh-3.75rem)] lg:py-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900">
              <Swords size={20} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold sm:text-xl">Debate Mode</h1>
              <p className="text-xs text-slate-500 sm:text-sm">Apna point rakho — Kiki counter karegi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-sm tabular-nums shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <Timer size={14} className={started ? 'text-brand-600' : 'text-slate-400'} />
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </span>
            {started && (
              <button type="button" onClick={() => reset()} className="btn-ghost h-9 w-9 p-0" aria-label="Restart debate" title="Restart">
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </header>

        {topicsError ? (
          <ErrorState message="Debate topics load nahi ho paye." onRetry={loadTopics} />
        ) : (
          <>
            <label className="sr-only" htmlFor="debate-topic">Topic</label>
            <select
              id="debate-topic"
              value={topicId}
              onChange={(e) => reset(e.target.value)}
              className="input-field mb-4 font-medium"
              disabled={!topics}
            >
              {!topics && <option>Loading topics…</option>}
              {topics?.map((t) => (
                <option key={t.id} value={t.id}>{t.topic}</option>
              ))}
            </select>

            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <KikiAvatar size="lg" className="mb-4" />
                  {topic && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Aaj ka topic · <span className="capitalize">{topic.level}</span>
                      </p>
                      <p className="mt-2 max-w-md font-display text-xl font-semibold">&ldquo;{topic.topic}&rdquo;</p>
                    </>
                  )}
                  <p className="mt-3 max-w-sm text-sm text-slate-500">
                    Pehle apni side chuno — &quot;I agree because…&quot; ya &quot;I disagree because…&quot; se shuru karo.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex animate-fade-up gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' && <KikiAvatar size="sm" online={false} className="mt-0.5" />}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[75%] ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <KikiAvatar size="sm" online={false} />
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
                }}
                placeholder="Apna argument English mein likho…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-slate-400"
                aria-label="Your argument"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !topicId}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Target, Languages, PenLine } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { ErrorState } from '@/components/ui';
import { useAuthStore } from '@/stores/useStore';
import { api, ApiError, RoleplayScenario, ChatMessage } from '@/lib/api';

export default function RoleplayChatPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  const start = useCallback(() => {
    if (!token || !id) return;
    setLoadError(false);
    api
      .post<{ session: { id: string }; scenario: RoleplayScenario }>(`/api/roleplay/${id}/start`, {}, token)
      .then((d) => {
        setScenario(d.scenario);
        setSessionId(d.session.id);
        setMessages([{ role: 'assistant', content: d.scenario.openingLine }]);
      })
      .catch(() => setLoadError(true));
  }, [token, id]);

  useEffect(start, [start]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || !token || !sessionId || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post<{
        reply: string;
        corrections: string[];
        translation?: string | null;
        wasHindi?: boolean;
      }>(`/api/roleplay/${id}/message`, { sessionId, message: userMsg }, token);

      setMessages((prev) => {
        const updated = [...prev];
        const lastUser = updated.length - 1;
        if (res.wasHindi && res.translation && lastUser >= 0 && updated[lastUser].role === 'user') {
          updated[lastUser] = { ...updated[lastUser], translation: res.translation, wasHindi: true };
        }
        return [...updated, { role: 'assistant', content: res.reply, corrections: res.corrections }];
      });
    } catch (err) {
      const content =
        err instanceof ApiError && err.limitReached ? err.message : 'Sorry, kuch gadbad ho gayi. Dobara try karo.';
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (loadError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <ErrorState message="Yeh roleplay shuru nahi ho paya." onRetry={start} />
        </div>
      </AppShell>
    );
  }

  if (!initialized || !user || !scenario) return <LoadingScreen label="Scene set ho raha hai..." />;

  return (
    <AppShell footer={false}>
      <div className="mx-auto flex h-[calc(100dvh-8.25rem-env(safe-area-inset-bottom))] max-w-3xl flex-col px-3 py-4 sm:px-6 lg:h-[calc(100dvh-3.75rem)] lg:py-6">
        <header className="mb-4">
          <div className="flex items-center gap-2">
            <Link href="/roleplay" className="btn-ghost h-9 w-9 shrink-0 p-0" aria-label="Back to roleplays">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold sm:text-xl">{scenario.title}</h1>
              <p className="truncate text-xs text-slate-500">{scenario.description}</p>
            </div>
          </div>
          {scenario.goals.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {scenario.goals.map((goal) => (
                <span
                  key={goal}
                  className="chip shrink-0 border border-brand-100 bg-brand-50 py-1 text-brand-700 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300"
                >
                  <Target size={12} /> {goal}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-5">
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
            void sendMessage();
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
            }}
            placeholder="Hindi ya English mein jawab do…"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-slate-400"
            aria-label="Your reply"
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

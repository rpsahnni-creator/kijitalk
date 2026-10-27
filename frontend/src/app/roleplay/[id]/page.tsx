'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, User, Target, Languages } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { useAuthStore } from '@/stores/useStore';
import { api, RoleplayScenario, ChatMessage } from '@/lib/api';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (!token || !id) return;
    api.get<{ scenario: RoleplayScenario }>(`/api/roleplay/${id}`).then((d) => setScenario(d.scenario));
    api.post<{ session: { id: string }; scenario: RoleplayScenario }>(
      `/api/roleplay/${id}/start`,
      {},
      token
    ).then((d) => {
      setSessionId(d.session.id);
      setMessages([{ role: 'assistant', content: d.scenario.openingLine }]);
    }).catch(console.error);
  }, [token, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      }>(
        `/api/roleplay/${id}/message`,
        { sessionId, message: userMsg },
        token
      );

      if (res.wasHindi && res.translation) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastUser = updated.length - 1;
          if (lastUser >= 0 && updated[lastUser].role === 'user') {
            updated[lastUser] = {
              ...updated[lastUser],
              translation: res.translation ?? undefined,
              wasHindi: true,
            };
          }
          return updated;
        });
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply, corrections: res.corrections },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !user || !scenario) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-3xl flex-col p-4 lg:h-screen">
        <header className="mb-4">
          <h1 className="text-xl font-bold">{scenario.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {scenario.goals.map((goal) => (
              <span key={goal} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                <Target size={12} /> {goal}
              </span>
            ))}
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-brand-100 text-brand-700' : ''}`}>
                {msg.role === 'user' ? <User size={16} /> : <KikiAvatar size="sm" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <p>{msg.content}</p>
                {msg.translation && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm">
                    <Languages size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold opacity-80">English translation</p>
                      <p>{msg.translation}</p>
                    </div>
                  </div>
                )}
                {msg.corrections && msg.corrections.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-600">
                    {msg.corrections.map((c, j) => (
                      <p key={j} className="text-xs text-amber-600">{c}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <KikiAvatar size="sm" animated />
              <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-700">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Hindi ya English mein jawab do..."
            className="input-field flex-1"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-primary px-4">
            <Send size={20} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Languages, Lightbulb, Mic, MicOff, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { useAuthStore } from '@/stores/useStore';
import { useTutorStore } from '@/stores/useTutorStore';
import { api, ChatMessage, TutorEngines } from '@/lib/api';
import { speechService } from '@/lib/speech';

export default function ChatPage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { engine, claudeAvailable, setEngine, setClaudeAvailable } = useTutorStore();

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    api
      .get<TutorEngines>('/api/chat/engines')
      .then((d) => setClaudeAvailable(d.claude))
      .catch(() => setClaudeAvailable(false));
  }, [setClaudeAvailable]);

  const sendMessage = async () => {
    if (!input.trim() || !token || loading) return;
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
        teachingTip?: string | null;
        session: { id: string };
      }>('/api/chat/message', { sessionId, message: userMsg, engine }, token);

      setSessionId(res.session.id);

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
        { role: 'assistant', content: res.reply, corrections: res.corrections, teachingTip: res.teachingTip },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry Kiki had trouble responding. Please try again! 🙏',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
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
      },
      () => setListening(false),
      'hi-IN'
    );
  };

  if (!initialized || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-3xl flex-col p-4 lg:h-screen">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KikiAvatar size="md" />
            <div>
              <h1 className="text-xl font-bold">Chat with Kiki</h1>
              <p className="text-sm text-slate-500">
                Hindi ya English mein baat karo — Kiki translate karke sikhayegi
              </p>
            </div>
          </div>
          {claudeAvailable && (
            <div className="flex shrink-0 rounded-full bg-slate-100 p-1 text-xs dark:bg-slate-700">
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
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <KikiAvatar size="xl" className="mb-4 opacity-90" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Namaste! Main Kiki hoon 👋</p>
              <p className="mt-2 max-w-sm text-sm">
                Hindi mein likho: &quot;Mera naam Rahul hai&quot; — main English mein translate karungi!
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'user' ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <User size={16} />
                </div>
              ) : (
                <KikiAvatar size="sm" />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p>{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => speechService.speak(msg.content)}
                      className="shrink-0 text-slate-400 hover:text-brand-600"
                      title="Suno"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                </div>
                {msg.translation && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm dark:bg-black/20">
                    <Languages size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold opacity-80">English translation</p>
                      <p>{msg.translation}</p>
                    </div>
                  </div>
                )}
                {msg.corrections && msg.corrections.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-600">
                    <p className="text-xs font-semibold text-amber-600">Corrections:</p>
                    {msg.corrections.map((c, j) => (
                      <p key={j} className="text-xs text-slate-500">
                        {c}
                      </p>
                    ))}
                  </div>
                )}
                {msg.teachingTip && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    <Lightbulb size={14} className="mt-0.5 shrink-0" />
                    <p>{msg.teachingTip}</p>
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
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
              listening
                ? 'bg-red-500 text-white animate-pulse'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            }`}
            title="Hindi mein bolo"
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Hindi ya English mein likho..."
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

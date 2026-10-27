'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Timer } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { KikiAvatar } from '@/components/KikiAvatar';
import { useAuthStore } from '@/stores/useStore';
import { api } from '@/lib/api';

interface DebateTopic {
  id: string;
  topic: string;
  level: string;
}

export default function DebatePage() {
  const { user, token, initialized } = useAuthStore();
  const router = useRouter();
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    api.get<{ topics: DebateTopic[] }>('/api/debate/topics').then((d) => {
      setTopics(d.topics);
      if (d.topics[0]) setTopicId(d.topics[0].id);
    });
  }, []);

  useEffect(() => {
    if (!topicId) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [topicId]);

  const send = async () => {
    if (!input.trim() || !token || !topicId || loading) return;
    const userMsg = input.trim();
    setInput('');
    const history = [...messages, { role: 'user', content: userMsg }];
    setMessages(history);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string }>(
        '/api/debate/message',
        { topicId, message: userMsg, history: messages },
        token
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Try again — apna point English mein bolo.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !user) return <LoadingScreen />;

  const topic = topics.find((t) => t.id === topicId);

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-3xl flex-col p-4">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KikiAvatar size="md" />
            <div>
              <h1 className="text-xl font-bold">Debate Mode</h1>
              <p className="text-sm text-slate-500">English debate practice</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">
            <Timer size={14} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </span>
        </header>

        <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setMessages([]); setSeconds(0); }} className="input-field mb-4">
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.topic}</option>
          ))}
        </select>

        {topic && (
          <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Topic: {topic.topic} · Level: {topic.level}
          </p>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
          {messages.map((m, i) => (
            <div key={i} className={`rounded-2xl px-4 py-3 ${m.role === 'user' ? 'ml-8 bg-brand-600 text-white' : 'mr-8 bg-slate-100 dark:bg-slate-700'}`}>
              {m.content}
            </div>
          ))}
          {loading && <KikiAvatar size="sm" animated />}
        </div>

        <div className="mt-4 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Apna argument English mein likho..." className="input-field flex-1" />
          <button type="button" onClick={send} disabled={loading} className="btn-primary px-4"><Send size={20} /></button>
        </div>
      </div>
    </AppShell>
  );
}

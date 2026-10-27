import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

interface DebateTopic {
  id: string;
  topic: string;
  level: string;
}

export default function DebateScreen() {
  const { token } = useAuthStore();
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ topics: DebateTopic[] }>('/api/debate/topics').then((d) => {
      setTopics(d.topics);
      if (d.topics[0]) setTopicId(d.topics[0].id);
    });
  }, []);

  const send = async () => {
    if (!input.trim() || !token || !topicId || loading) return;
    const msg = input.trim();
    setInput('');
    const history = messages;
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string }>('/api/debate/message', { topicId, message: msg, history }, token);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Try again — apna point English mein bolo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const topic = topics.find((t) => t.id === topicId);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-4" contentContainerStyle={{ gap: 8 }}>
        {topics.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => { setTopicId(t.id); setMessages([]); }}
            className={`rounded-full px-4 py-2 ${topicId === t.id ? 'bg-brand-600' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            <Text className={topicId === t.id ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-600 dark:text-slate-300'}>
              {t.topic}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {topic && (
        <Text className="mx-4 mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Topic: {topic.topic} · Level: {topic.level}
        </Text>
      )}

      <ScrollView className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 16 }}>
        {messages.map((m, i) => (
          <View key={i} className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'ml-auto bg-brand-600' : 'bg-white dark:bg-slate-800'}`}>
            <Text className={m.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          placeholder="Apna argument English mein likho..."
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white"
        />
        <TouchableOpacity onPress={send} disabled={loading} className="justify-center rounded-2xl bg-brand-600 px-5">
          <Text className="font-semibold text-white">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

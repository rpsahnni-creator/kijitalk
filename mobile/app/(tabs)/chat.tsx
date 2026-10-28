import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTutorStore } from '@/stores/tutorStore';
import { api, ChatMessage, TutorEngines } from '@/lib/api';
import { speechService } from '@/lib/speech';

export default function ChatScreen() {
  const { token } = useAuthStore();
  const { engine, claudeAvailable, setEngine, setClaudeAvailable } = useTutorStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api
      .get<TutorEngines>('/api/chat/engines')
      .then((d) => setClaudeAvailable(d.claude))
      .catch(() => setClaudeAvailable(false));
  }, [setClaudeAvailable]);

  const send = async () => {
    if (!input.trim() || !token || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await api.post<{
        reply: string;
        corrections: string[];
        teachingTip?: string | null;
        session: { id: string };
      }>('/api/chat/message', { sessionId, message: msg, engine }, token);
      setSessionId(res.session.id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply, corrections: res.corrections, teachingTip: res.teachingTip },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd(), 100);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="flex-row items-center justify-between px-6 pt-14 pb-2">
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Chat with Kiki</Text>
        {claudeAvailable && (
          <View className="flex-row rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            <TouchableOpacity
              onPress={() => setEngine('gemini')}
              className={`rounded-full px-3 py-1.5 ${engine === 'gemini' ? 'bg-white' : ''}`}
            >
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEngine('claude')}
              className={`rounded-full px-3 py-1.5 ${engine === 'claude' ? 'bg-white' : ''}`}
            >
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">✨ Premium</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView ref={scrollRef} className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 16 }}>
        {messages.length === 0 && (
          <Text className="mt-20 text-center text-slate-400">
            Hindi mein likho: &quot;Mera naam Rahul hai&quot; — Kiki translate karke sikhayegi!
          </Text>
        )}
        {messages.map((m, i) => (
          <View key={i} className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'ml-auto bg-brand-600' : 'bg-white dark:bg-slate-800'}`}>
            <View className="flex-row items-start justify-between gap-2">
              <Text className={`flex-1 ${m.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{m.content}</Text>
              {m.role === 'assistant' && (
                <TouchableOpacity onPress={() => speechService.speak(m.content)}>
                  <Ionicons name="volume-medium" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
            {m.corrections && m.corrections.length > 0 && (
              <Text className="mt-1 text-xs text-accent-600">{m.corrections.join(', ')}</Text>
            )}
            {m.teachingTip && (
              <View className="mt-2 flex-row items-start gap-1.5 rounded-xl bg-accent-50 px-3 py-2">
                <Ionicons name="bulb" size={14} color="#8f6e00" />
                <Text className="flex-1 text-xs text-accent-800">{m.teachingTip}</Text>
              </View>
            )}
          </View>
        ))}
        {loading && <Text className="text-slate-400">Kiki is typing...</Text>}
      </ScrollView>

      <View className="flex-row gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <TextInput
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white"
          placeholder="Hindi ya English mein likho..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} disabled={loading || !input.trim()} className="justify-center rounded-2xl bg-brand-600 px-5">
          <Text className="font-semibold text-white">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

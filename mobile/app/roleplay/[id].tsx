import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { api, ApiError, ChatMessage } from '@/lib/api';

export default function RoleplayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!token || !id) return;
    api
      .post<{ session: { id: string }; scenario: { title: string; openingLine: string } }>(`/api/roleplay/${id}/start`, {}, token)
      .then((d) => {
        setSessionId(d.session.id);
        setMessages([{ role: 'assistant', content: d.scenario.openingLine }]);
      })
      .catch(console.error);
  }, [token, id]);

  const send = async () => {
    if (!input.trim() || !token || !sessionId || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string; corrections: string[] }>(`/api/roleplay/${id}/message`, { sessionId, message: msg }, token);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, corrections: res.corrections }]);
    } catch (err) {
      const content =
        err instanceof ApiError && err.limitReached ? err.message : 'Sorry, please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd(), 100);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView ref={scrollRef} className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 16 }}>
        {messages.map((m, i) => (
          <View key={i} className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'ml-auto bg-brand-600' : 'bg-white dark:bg-slate-800'}`}>
            <Text className={m.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <TextInput className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white" placeholder="Respond..." value={input} onChangeText={setInput} onSubmitEditing={send} />
        <TouchableOpacity onPress={send} className="justify-center rounded-2xl bg-brand-600 px-5">
          <Text className="font-semibold text-white">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

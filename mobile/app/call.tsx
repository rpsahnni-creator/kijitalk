import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTutorStore } from '@/stores/tutorStore';
import { api, TutorEngines } from '@/lib/api';
import { speechService } from '@/lib/speech';

// Expo managed workflow has no built-in speech-to-text (expo-speech is
// TTS-only). Rather than fake "listening", this screen is a typed
// conversation where Kiki's replies are spoken aloud automatically —
// real voice output, honest text input. A native dev client with
// @react-native-voice/voice or expo-speech-recognition would be needed
// for actual voice input, which this environment can't build/test.
export default function CallScreen() {
  const { token } = useAuthStore();
  const { engine, claudeAvailable, setEngine, setClaudeAvailable } = useTutorStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api
      .get<TutorEngines>('/api/chat/engines')
      .then((d) => setClaudeAvailable(d.claude))
      .catch(() => setClaudeAvailable(false));
    speechService.speak("Hi! I'm Kiki. Type in Hindi or English and I'll speak my reply back to you.");
  }, [setClaudeAvailable]);

  const send = async () => {
    if (!input.trim() || !token || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string; session: { id: string } }>(
        '/api/chat/message',
        { sessionId: sessionIdRef.current, message: msg, engine },
        token
      );
      sessionIdRef.current = res.session.id;
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      speechService.speak(res.reply);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd(), 100);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-slate-50 dark:bg-slate-900">
      {claudeAvailable && (
        <View className="flex-row justify-end px-4 pt-3">
          <View className="flex-row rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            <TouchableOpacity onPress={() => setEngine('gemini')} className={`rounded-full px-3 py-1.5 ${engine === 'gemini' ? 'bg-white' : ''}`}>
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">Free</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEngine('claude')} className={`rounded-full px-3 py-1.5 ${engine === 'claude' ? 'bg-white' : ''}`}>
              <Text className="text-xs font-medium text-slate-600 dark:text-slate-300">✨ Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView ref={scrollRef} className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 16 }}>
        {messages.length === 0 && (
          <View className="mt-16 items-center">
            <Ionicons name="mic-circle" size={64} color="#7c3aed" />
            <Text className="mt-4 text-center text-slate-500">
              Type Hindi ya English mein — Kiki apni reply bolkar sunayegi!
            </Text>
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'ml-auto bg-brand-600' : 'bg-white dark:bg-slate-800'}`}>
            <View className="flex-row items-center gap-2">
              <Text className={`flex-1 ${m.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{m.content}</Text>
              {m.role === 'assistant' && (
                <TouchableOpacity onPress={() => speechService.speak(m.content)}>
                  <Ionicons name="volume-medium" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          placeholder="Hindi ya English mein likho..."
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-600 dark:text-white"
        />
        <TouchableOpacity onPress={send} disabled={loading || !input.trim()} className="justify-center rounded-2xl bg-brand-600 px-5">
          <Text className="font-semibold text-white">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

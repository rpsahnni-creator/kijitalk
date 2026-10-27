import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

const PHRASES = [
  'The weather is beautiful today.',
  'I would like to order a coffee, please.',
  'Could you tell me where the nearest station is?',
];

export default function VoiceScreen() {
  const { token } = useAuthStore();
  const [index, setIndex] = useState(0);
  const [spoken, setSpoken] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const phrase = PHRASES[index];

  const speak = () => Speech.speak(phrase, { language: 'en-US' });

  const analyze = async () => {
    if (!token || !spoken.trim()) return;
    try {
      const res = await api.post<{ score: number; feedback: string }>(
        '/api/voice/pronunciation',
        { expected: phrase, spoken: spoken.trim() },
        token
      );
      setScore(res.score);
      setFeedback(res.feedback);
    } catch {
      setFeedback('Could not analyze pronunciation. Try again.');
    }
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-14 dark:bg-slate-900">
      <Text className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Voice Practice</Text>
      <Text className="mb-8 text-slate-500">Speak the phrase, then type what you said</Text>

      <View className="mb-6 rounded-3xl bg-white p-6 dark:bg-slate-800">
        <Text className="text-center text-xl font-semibold text-slate-900 dark:text-white">{phrase}</Text>
        <TouchableOpacity onPress={speak} className="mt-4">
          <Text className="text-center text-brand-600">🔊 Listen</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        placeholder="Type what you spoke..."
        value={spoken}
        onChangeText={setSpoken}
      />

      <TouchableOpacity onPress={analyze} className="mb-6 rounded-2xl bg-brand-600 py-4">
        <Text className="text-center font-semibold text-white">Check Pronunciation</Text>
      </TouchableOpacity>

      {score !== null && (
        <View className="rounded-3xl bg-white p-6 dark:bg-slate-800">
          <Text className="mb-2 text-center text-4xl font-bold text-brand-600">{score}%</Text>
          <Text className="text-center text-slate-600 dark:text-slate-300">{feedback}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => { setIndex((i) => (i + 1) % PHRASES.length); setSpoken(''); setScore(null); setFeedback(''); }}
        className="mt-6 rounded-2xl border border-slate-200 py-4 dark:border-slate-700"
      >
        <Text className="text-center font-semibold text-slate-700 dark:text-slate-200">Next Phrase</Text>
      </TouchableOpacity>
    </View>
  );
}

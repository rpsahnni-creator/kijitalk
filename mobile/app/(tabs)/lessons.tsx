import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, Lesson } from '@/lib/api';

const CATEGORIES = ['All', 'School', 'Daily Life', 'Travel', 'Exams', 'Conversation', 'Career'];

export default function LessonsScreen() {
  const { token } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api.get<{ lessons: Lesson[] }>('/api/lessons', token).then((d) => setLessons(d.lessons)).catch(console.error);
  }, [token]);

  const filtered = category === 'All' ? lessons : lessons.filter((l) => l.category === category);

  return (
    <View className="flex-1 bg-slate-50 pt-14 dark:bg-slate-900">
      <View className="px-6 pb-2">
        <Text className="text-xl font-bold text-slate-900 dark:text-white">All Lessons</Text>
        <Text className="text-slate-500">School, exams, daily life — Bharat ke students ke liye</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 px-6" contentContainerStyle={{ gap: 8 }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 ${category === cat ? 'bg-brand-600' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            <Text className={category === cat ? 'text-sm font-medium text-white' : 'text-sm font-medium text-slate-600 dark:text-slate-300'}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        {filtered.map((lesson, i) => (
          <Link key={lesson.id} href={`/lessons/${lesson.id}`} asChild>
            <TouchableOpacity className="mb-3 flex-row items-center gap-4 rounded-2xl bg-white p-4 dark:bg-slate-800">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30">
                <Text className="font-bold text-brand-700">{i + 1}</Text>
              </View>
              <View className="flex-1">
                <View className="mb-1 flex-row flex-wrap items-center gap-2">
                  <Text className="font-semibold text-slate-900 dark:text-white">{lesson.title}</Text>
                  {lesson.recommended && (
                    <View className="rounded-full bg-amber-100 px-2 py-0.5">
                      <Text className="text-xs text-amber-700">★ Recommended</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-slate-500">{lesson.description}</Text>
                <Text className="mt-1 text-xs text-slate-400">
                  {lesson.durationMinutes} min · {lesson.category}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4f46e5" />
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

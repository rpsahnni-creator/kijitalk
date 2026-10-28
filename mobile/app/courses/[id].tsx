import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, Lesson } from '@/lib/api';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    api
      .get<{ course: { title: string }; lessons: Lesson[] }>(`/api/courses/${id}`, token)
      .then((d) => {
        setTitle(d.course.title);
        setLessons(d.lessons);
      })
      .catch(console.error);
  }, [token, id]);

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-4 dark:bg-slate-900">
      <Text className="mb-4 text-xl font-bold text-slate-900 dark:text-white">{title}</Text>
      {lessons.map((lesson, i) => (
        <Link key={lesson.id} href={`/lessons/${lesson.id}`} asChild>
          <TouchableOpacity className="mb-3 flex-row items-center gap-4 rounded-2xl bg-white p-4 dark:bg-slate-800">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30">
              <Text className="font-bold text-brand-700">{i + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-900 dark:text-white">{lesson.title}</Text>
              <Text className="text-sm text-slate-500">{lesson.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#952248" />
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}

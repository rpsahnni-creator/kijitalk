import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, Course } from '@/lib/api';

export default function CoursesScreen() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get<{ courses: Course[] }>('/api/courses', token).then((d) => setCourses(d.courses)).catch(console.error);
  }, [token]);

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-4 dark:bg-slate-900">
      <Text className="mb-6 text-slate-500">Level-wise structured learning paths</Text>

      {courses.map((course) => (
        <Link key={course.id} href={`/courses/${encodeURIComponent(course.id)}`} asChild>
          <TouchableOpacity className="mb-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
            <View className="mb-3 flex-row items-center gap-3">
              <View className="rounded-2xl bg-brand-100 p-3 dark:bg-brand-900/30">
                <Ionicons name="school" size={22} color="#4338ca" />
              </View>
              <View>
                <Text className="font-semibold text-slate-900 dark:text-white">{course.title}</Text>
                <Text className="text-xs capitalize text-slate-400">{course.level} · {course.lessonCount} lessons</Text>
              </View>
            </View>
            <Text className="mb-3 text-sm text-slate-500">{course.description}</Text>
            <View className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <View className="h-full rounded-full bg-brand-600" style={{ width: `${course.progressPercent}%` }} />
            </View>
            <Text className="text-sm text-slate-400">{course.progressPercent}% complete</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}

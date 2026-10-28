import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, Lesson, DashboardData } from '@/lib/api';

const QUICK_ACTIONS = [
  { href: '/(tabs)/chat', icon: 'chatbubbles' as const, label: 'Kiki se baat', sub: 'Hindi → English' },
  { href: '/call', icon: 'call' as const, label: 'Call Kiki', sub: 'Voice practice' },
  { href: '/voice', icon: 'mic' as const, label: 'Bol kar seekho', sub: 'Pronunciation' },
  { href: '/roleplay', icon: 'people' as const, label: 'Roleplay', sub: 'Real situations' },
  { href: '/courses', icon: 'school' as const, label: 'Courses', sub: 'Structured paths' },
  { href: '/debate', icon: 'flash' as const, label: 'Debate', sub: 'Practice arguing' },
];

export default function DashboardScreen() {
  const { profile, token } = useAuthStore();
  const [dailyLesson, setDailyLesson] = useState<Lesson | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<{ lesson: Lesson }>('/api/lessons/daily', token).then((d) => setDailyLesson(d.lesson)).catch(console.error);
    api.get<DashboardData>('/api/progress/dashboard', token).then(setDashboard).catch(console.error);
  }, [token]);

  const todayMinutes = dashboard?.stats.todayMinutes ?? 0;
  const dailyGoal = dashboard?.stats.dailyGoal ?? profile?.settings?.dailyGoalMinutes ?? 15;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-14 dark:bg-slate-900" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text className="text-xs font-medium text-brand-600">Free for every Indian student</Text>
      <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
        Namaste, {profile?.displayName ?? 'Student'} 👋
      </Text>
      <Text className="mb-6 text-slate-500">
        {profile?.grade ? `Class ${profile.grade}` : 'Student'}
        {profile?.state ? ` · ${profile.state}` : ''} — Ready to practice?
      </Text>

      <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-semibold text-slate-900 dark:text-white">Today&apos;s Goal</Text>
          <Text className="text-sm text-slate-500">{todayMinutes}/{dailyGoal} min</Text>
        </View>
        <View className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <View className="h-full rounded-full bg-brand-600" style={{ width: `${goalPercent}%` }} />
        </View>
      </View>

      <View className="mb-6 flex-row flex-wrap gap-3">
        {[
          { label: 'Streak', value: `${dashboard?.stats.streak ?? profile?.streak ?? 0}d` },
          { label: 'Aaj', value: `${todayMinutes}m` },
          { label: 'Lessons', value: dashboard?.stats.lessonsCompleted ?? profile?.lessonsCompleted ?? 0 },
          { label: 'Level', value: `Lv.${dashboard?.stats.level ?? 1}` },
        ].map(({ label, value }) => (
          <View key={label} className="min-w-[30%] flex-1 rounded-2xl bg-white p-4 dark:bg-slate-800">
            <Text className="text-xs text-slate-500">{label}</Text>
            <Text className="text-xl font-bold text-brand-600">{value}</Text>
          </View>
        ))}
      </View>

      <View className="mb-6 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-brand-100 px-4 py-2">
          <Text className="text-sm font-semibold text-brand-700">⭐ {dashboard?.stats.xp ?? 0} XP</Text>
        </View>
        <View className="rounded-full bg-accent-100 px-4 py-2">
          <Text className="text-sm font-semibold text-accent-700">🪙 {dashboard?.stats.coins ?? 0} Coins</Text>
        </View>
      </View>

      {dashboard?.dailyPhrase && (
        <View className="mb-6 rounded-3xl bg-accent-50 p-5 dark:bg-accent-900/20">
          <Text className="mb-1 text-xs font-semibold text-accent-800 dark:text-accent-300">Today&apos;s Phrase · {dashboard.dailyPhrase.category}</Text>
          <Text className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">{dashboard.dailyPhrase.english}</Text>
          <Text className="text-sm text-slate-500">{dashboard.dailyPhrase.hindi}</Text>
        </View>
      )}

      <Link href="/(tabs)/chat" asChild>
        <TouchableOpacity className="mb-6 flex-row items-center gap-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-100">
            <Ionicons name="sparkles" size={22} color="#b88e00" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium text-accent-800">AI Tutor · Free</Text>
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Kiki se baat karo</Text>
            <Text className="text-sm text-slate-500">Hindi mein likho ya bolo — English seekho!</Text>
          </View>
        </TouchableOpacity>
      </Link>

      {dailyLesson && (
        <Link href={`/lessons/${dailyLesson.id}`} asChild>
          <TouchableOpacity className="mb-6 rounded-3xl bg-brand-600 p-6">
            <Text className="text-sm text-accent-200">Aaj ka Lesson</Text>
            <Text className="mb-1 text-xl font-bold text-white">{dailyLesson.title}</Text>
            <Text className="mb-4 text-brand-50">{dailyLesson.description}</Text>
            <View className="self-start rounded-2xl bg-white px-5 py-2.5">
              <Text className="font-semibold text-brand-700">Start · {dailyLesson.durationMinutes} min</Text>
            </View>
          </TouchableOpacity>
        </Link>
      )}

      <Text className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</Text>
      <View className="flex-row flex-wrap gap-3">
        {QUICK_ACTIONS.map(({ href, icon, label, sub }) => (
          <Link key={href} href={href as '/call'} asChild>
            <TouchableOpacity className="min-w-[30%] flex-1 items-center gap-2 rounded-2xl bg-white py-5 dark:bg-slate-800">
              <View className="rounded-2xl bg-brand-50 p-3 dark:bg-brand-900/30">
                <Ionicons name={icon} size={24} color="#952248" />
              </View>
              <Text className="text-center text-sm font-medium text-slate-900 dark:text-white">{label}</Text>
              <Text className="text-center text-xs text-slate-400">{sub}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

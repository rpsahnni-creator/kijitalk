import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, Lesson, DashboardData } from '@/lib/api';
import { speechService } from '@/lib/speech';
import { KikiFace } from '@/components/KikiFace';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { AppHeader, BrandFooter, FeatureTile, SectionTitle, BRAND } from '@/components/ui';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3100';

interface Tile {
  icon: FeatureIconName;
  label: string;
  href?: Href;
  onPress?: () => void;
  badge?: number | string | null;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { profile, token } = useAuthStore();
  const [dailyLesson, setDailyLesson] = useState<Lesson | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<{ lesson: Lesson }>('/api/lessons/daily', token).then((d) => setDailyLesson(d.lesson)).catch(() => {});
    api.get<DashboardData>('/api/progress/dashboard', token).then(setDashboard).catch(() => {});
  }, [token]);

  const stats = dashboard?.stats;
  const todayMinutes = stats?.todayMinutes ?? 0;
  const dailyGoal = Math.max(1, stats?.dailyGoal ?? profile?.settings?.dailyGoalMinutes ?? 15);
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));
  const streak = stats?.streak ?? profile?.streak ?? 0;
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Student';
  const lessonHref: Href = dailyLesson ? (`/lessons/${dailyLesson.id}` as Href) : '/(tabs)/lessons';

  const sections: Array<{ title: string; tiles: Tile[] }> = [
    {
      title: 'Practice · प्रैक्टिस',
      tiles: [
        { icon: 'chat', label: 'Kiki Chat', href: '/(tabs)/chat' },
        { icon: 'call', label: 'Call Kiki', href: '/call' },
        { icon: 'voice', label: 'Voice', href: '/voice' },
        { icon: 'roleplay', label: 'Roleplay', href: '/roleplay' },
        { icon: 'debate', label: 'Debate', href: '/debate' },
      ],
    },
    {
      title: 'Learn · सीखो',
      tiles: [
        { icon: 'calendar', label: 'Aaj ka Lesson', href: lessonHref, badge: dailyLesson ? 'New' : null },
        { icon: 'lessons', label: 'Lessons', href: '/(tabs)/lessons' },
        { icon: 'courses', label: 'Courses', href: '/courses' },
        {
          icon: 'idea',
          label: 'Daily Phrase',
          onPress: () => dashboard?.dailyPhrase && speechService.speak(dashboard.dailyPhrase.english),
        },
      ],
    },
    {
      title: 'My Progress · प्रगति',
      tiles: [
        { icon: 'progress', label: 'Progress', href: '/(tabs)/progress' },
        { icon: 'leaderboard', label: 'Leaderboard', href: '/(tabs)/progress' },
        { icon: 'badges', label: 'Badges', href: '/(tabs)/progress', badge: stats?.badges?.length || null },
        { icon: 'streak', label: 'Streak', href: '/(tabs)/progress', badge: streak || null },
      ],
    },
    {
      title: 'Account · अकाउंट',
      tiles: [
        { icon: 'profile', label: 'Profile', href: '/(tabs)/settings' },
        { icon: 'premium', label: 'Premium', onPress: () => Linking.openURL(`${WEB_URL}/pricing`) },
        { icon: 'settings', label: 'Settings', href: '/(tabs)/settings' },
        { icon: 'help', label: 'Need Help', href: '/(tabs)/chat' },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-4 pt-4">
          {/* Welcome card */}
          <View className="relative mb-6 overflow-hidden rounded-3xl bg-brand-600 p-5">
            <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
            <View className="absolute right-6 top-5 h-4 w-4 rounded-full" style={{ backgroundColor: BRAND.yellow }} />
            <View className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full" style={{ backgroundColor: BRAND.green }} />
            <View className="flex-row items-center gap-3">
              <View className="rounded-full bg-white p-1">
                <KikiFace size={56} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-brand-100">
                  {greeting()} · {profile?.grade ? (profile.grade === 'college' ? 'College' : `Class ${profile.grade}`) : 'Student'}
                  {profile?.state ? ` · ${profile.state}` : ''}
                </Text>
                <Text className="text-2xl font-extrabold text-white" numberOfLines={1}>
                  Namaste, <Text style={{ color: BRAND.yellowSoft }}>{firstName}</Text> 👋
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <View className="mb-1.5 flex-row justify-between">
                <Text className="text-sm font-semibold text-white">Aaj ka Goal</Text>
                <Text className="text-sm text-brand-100">
                  {todayMinutes}/{dailyGoal} min
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-white/25">
                <View className="h-full rounded-full" style={{ width: `${goalPercent}%`, backgroundColor: BRAND.yellow }} />
              </View>
              <Text className="mt-2 text-xs text-brand-50">
                {goalPercent >= 100
                  ? 'Shabash! Aaj ka goal complete ho gaya 🎉'
                  : `Aaj ${Math.max(0, dailyGoal - todayMinutes)} min aur practice karo!`}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5">
                <Ionicons name="flame" size={14} color={BRAND.yellow} />
                <Text className="text-xs font-semibold text-white">{streak} din</Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5">
                <Ionicons name="star" size={14} color={BRAND.yellow} />
                <Text className="text-xs font-semibold text-white">
                  {stats?.xp ?? 0} XP · Lv.{stats?.level ?? 1}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5">
                <Ionicons name="wallet" size={14} color={BRAND.yellow} />
                <Text className="text-xs font-semibold text-white">{stats?.coins ?? 0}</Text>
              </View>
            </View>

            <Link href={lessonHref} asChild>
              <TouchableOpacity className="mt-4 flex-row items-center justify-center gap-1.5 rounded-xl py-3" style={{ backgroundColor: BRAND.yellow }}>
                <Text className="font-bold text-brand-900">Practice shuru karo</Text>
                <Ionicons name="arrow-forward" size={16} color="#82112d" />
              </TouchableOpacity>
            </Link>
          </View>

          {/* Icon grid sections */}
          {sections.map((section) => (
            <View key={section.title} className="mb-5">
              <SectionTitle>{section.title}</SectionTitle>
              <View className="flex-row flex-wrap">
                {section.tiles.map((tile) => (
                  <FeatureTile key={tile.label} {...tile} />
                ))}
              </View>
            </View>
          ))}

          {/* Today's lesson */}
          {dailyLesson && (
            <View className="mb-5">
              <SectionTitle>Aaj ka Lesson</SectionTitle>
              <Link href={lessonHref} asChild>
                <TouchableOpacity className="flex-row items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <FeatureIcon name="lessons" size={48} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-brand-600">
                      {dailyLesson.category} · {dailyLesson.durationMinutes} min
                    </Text>
                    <Text className="text-base font-bold text-slate-900 dark:text-white">{dailyLesson.title}</Text>
                    <Text className="mt-0.5 text-sm text-slate-500" numberOfLines={2}>
                      {dailyLesson.description}
                    </Text>
                    <Text className="mt-2 text-sm font-semibold text-brand-600">Start Lesson →</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {/* Daily phrase */}
          {dashboard?.dailyPhrase && (
            <View className="mb-6">
              <SectionTitle>Today&apos;s Phrase · आज का वाक्य</SectionTitle>
              <View className="rounded-2xl border border-accent-300 bg-accent-50 p-4 dark:bg-slate-900">
                <View className="mb-2 flex-row items-center gap-2">
                  <FeatureIcon name="idea" size={30} />
                  <View className="rounded-full bg-leaf-700 px-2.5 py-0.5">
                    <Text className="text-xs font-semibold text-white">{dashboard.dailyPhrase.category}</Text>
                  </View>
                </View>
                <Text className="text-lg font-semibold text-slate-900 dark:text-white">{dashboard.dailyPhrase.english}</Text>
                <Text className="mt-1 text-sm text-slate-500">{dashboard.dailyPhrase.hindi}</Text>
                <Text className="mt-2 text-xs text-slate-500">💡 {dashboard.dailyPhrase.tip}</Text>
                <TouchableOpacity
                  onPress={() => speechService.speak(dashboard.dailyPhrase!.english)}
                  className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5"
                >
                  <Ionicons name="volume-high" size={16} color="#fff" />
                  <Text className="font-semibold text-white">Suno aur repeat karo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View className="flex-1" />
        <BrandFooter />
      </ScrollView>
    </View>
  );
}

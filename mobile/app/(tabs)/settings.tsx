import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3100';

export default function SettingsScreen() {
  const { profile, token, signOut, syncProfile } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState(profile?.settings?.notifications ?? true);
  const [tier, setTier] = useState<'free' | 'premium'>('free');

  useEffect(() => {
    if (!token) return;
    api
      .get<{ tier: 'free' | 'premium' }>('/api/subscription/status', token)
      .then((d) => setTier(d.tier))
      .catch(() => {});
  }, [token]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifications(value);
    if (!token) return;
    await api.patch('/api/settings', { notifications: value }, token);
    await syncProfile();
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-14 dark:bg-slate-900">
      <Text className="mb-8 text-xl font-bold text-slate-900 dark:text-white">Settings</Text>

      <View className="mb-6 flex-row items-center gap-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-600">
          <Text className="text-2xl font-bold text-white">{profile?.displayName?.[0] ?? 'K'}</Text>
        </View>
        <View>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">{profile?.displayName ?? 'Learner'}</Text>
          <Text className="text-sm text-slate-500">{profile?.email}</Text>
          <Text className="text-xs capitalize text-brand-600">{profile?.targetLevel ?? 'beginner'} level</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => Linking.openURL(`${WEB_URL}/pricing`)}
        className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-slate-800"
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name="star" size={20} color={tier === 'premium' ? '#e0ad00' : '#94a3b8'} />
          <View>
            <Text className="font-medium text-slate-900 dark:text-white">{tier === 'premium' ? 'Premium Plan' : 'Free Plan'}</Text>
            <Text className="text-xs text-slate-500">{tier === 'premium' ? 'Unlimited AI practice active' : 'Upgrade karo unlimited practice ke liye'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-slate-800">
        <Text className="font-medium text-slate-900 dark:text-white">Notifications</Text>
        <Switch value={notifications} onValueChange={toggleNotifications} />
      </View>

      <View className="mb-6 rounded-2xl bg-white p-4 dark:bg-slate-800">
        <Text className="text-slate-600 dark:text-slate-300">Daily Goal: {profile?.settings?.dailyGoalMinutes ?? 15} min</Text>
        <Text className="mt-1 text-slate-600 dark:text-slate-300">Streak: {profile?.streak ?? 0} days</Text>
        <Text className="mt-1 text-slate-600 dark:text-slate-300">Lessons completed: {profile?.lessonsCompleted ?? 0}</Text>
      </View>

      <TouchableOpacity onPress={handleSignOut} className="rounded-2xl border border-red-200 py-4">
        <Text className="text-center font-semibold text-red-600">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

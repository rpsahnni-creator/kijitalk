import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { api, DashboardData, LeaderboardEntry } from '@/lib/api';
import { BADGES } from '@/lib/badges';

const ACTIVITY_LABELS: Record<string, string> = {
  chat: 'Kiki Chat',
  lesson: 'Lessons',
  roleplay: 'Roleplay',
  voice: 'Voice',
  call: 'Call',
  debate: 'Debate',
};
const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  chat: 'chatbubbles',
  lesson: 'book',
  roleplay: 'people',
  voice: 'mic',
  call: 'call',
  debate: 'flash',
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86400000
  );
  if (diffDays === 0) return 'Aaj';
  if (diffDays === 1) return 'Kal';
  if (diffDays < 7) return `${diffDays} din pehle`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ProgressScreen() {
  const { token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get<DashboardData>('/api/progress/dashboard', token).then(setData).catch(console.error);
    api.get<{ leaderboard: LeaderboardEntry[] }>('/api/gamification/leaderboard', token).then((d) => setLeaderboard(d.leaderboard)).catch(console.error);
  }, [token]);

  const todayMinutes = data?.stats.todayMinutes ?? 0;
  const dailyGoal = data?.stats.dailyGoal ?? 15;
  const dailyStats = data?.dailyStats ?? [];
  const maxMinutes = Math.max(1, ...dailyStats.map((d) => d.minutes));
  const activityBreakdown = data?.activityBreakdown ?? [];
  const totalActivities = Math.max(1, activityBreakdown.reduce((s, a) => s + a.count, 0));

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-14 dark:bg-slate-900" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Progress</Text>
      <Text className="mb-6 text-slate-500">Pichle 30 din ki learning journey</Text>

      <View className="mb-6 flex-row flex-wrap gap-3">
        {[
          { label: 'Streak', value: `${data?.stats.streak ?? 0}d` },
          { label: 'Aaj', value: `${todayMinutes}m` },
          { label: 'Total', value: `${data?.stats.totalMinutes ?? 0}m` },
          { label: 'Avg Score', value: `${data?.stats.avgScore ?? 0}%` },
        ].map(({ label, value }) => (
          <View key={label} className="min-w-[45%] flex-1 items-center rounded-2xl bg-white p-4 dark:bg-slate-800">
            <Text className="text-xs text-slate-500">{label}</Text>
            <Text className="text-2xl font-bold text-brand-600">{value}</Text>
          </View>
        ))}
      </View>

      <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-3 font-semibold text-slate-900 dark:text-white">🏅 Badges</Text>
        <View className="flex-row flex-wrap gap-2">
          {BADGES.map((badge) => {
            const earned = (data?.stats.badges ?? []).includes(badge.id);
            return (
              <View key={badge.id} className={`flex-row items-center gap-1.5 rounded-2xl border px-3 py-2 ${earned ? 'border-accent-200 bg-accent-50' : 'border-slate-200 bg-slate-50 opacity-50 dark:border-slate-700 dark:bg-slate-900'}`}>
                <Text>{badge.emoji}</Text>
                <Text className="text-sm font-medium text-slate-900 dark:text-white">{badge.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-3 font-semibold text-slate-900 dark:text-white">Roz ka practice (minutes)</Text>
        <View className="flex-row items-end gap-2" style={{ height: 120 }}>
          {dailyStats.length === 0 && <Text className="text-sm text-slate-400">Koi data nahi abhi tak</Text>}
          {dailyStats.map((d) => (
            <View key={d.date} className="flex-1 items-center gap-1">
              <View className="w-full rounded-t-md bg-brand-500" style={{ height: Math.max(4, (d.minutes / maxMinutes) * 100) }} />
              <Text className="text-[9px] text-slate-400">{d.date.slice(5)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-3 font-semibold text-slate-900 dark:text-white">Kya practice kiya?</Text>
        {activityBreakdown.map((a) => (
          <View key={a.type} className="mb-2">
            <View className="mb-1 flex-row justify-between">
              <Text className="text-sm text-slate-600 dark:text-slate-300">{ACTIVITY_LABELS[a.type] ?? a.type}</Text>
              <Text className="text-sm text-slate-400">{a.count}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <View className="h-full rounded-full bg-brand-500" style={{ width: `${(a.count / totalActivities) * 100}%` }} />
            </View>
          </View>
        ))}
      </View>

      <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-3 font-semibold text-slate-900 dark:text-white">Recent Activity</Text>
        {(data?.recentActivity ?? []).length === 0 && (
          <Text className="text-sm text-slate-500">Abhi tak koi activity nahi — pehla lesson shuru karo!</Text>
        )}
        {(data?.recentActivity ?? []).map((item) => (
          <View key={item.id} className="mb-2 flex-row items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-700">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
              <Ionicons name={ACTIVITY_ICONS[item.activityType] ?? 'chatbubbles'} size={16} color="#0f5c2a" />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-slate-900 dark:text-white">{ACTIVITY_LABELS[item.activityType] ?? item.activityType}</Text>
              <Text className="text-xs text-slate-500">{formatRelativeDate(item.date)} · {item.minutesSpent} min</Text>
            </View>
            <View className={`rounded-full px-2.5 py-1 ${item.score >= 80 ? 'bg-brand-100' : item.score >= 50 ? 'bg-accent-100' : 'bg-slate-200'}`}>
              <Text className={`text-xs font-semibold ${item.score >= 80 ? 'text-brand-700' : item.score >= 50 ? 'text-accent-700' : 'text-slate-600'}`}>{item.score}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-3 font-semibold text-slate-900 dark:text-white">🏆 Weekly Leaderboard</Text>
        {leaderboard.length === 0 && <Text className="text-sm text-slate-500">No activity this week yet.</Text>}
        {leaderboard.map((entry) => (
          <View key={entry.rank} className="mb-2 flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-700">
            <Text className="font-medium text-slate-900 dark:text-white">#{entry.rank} {entry.displayName}</Text>
            <Text className="text-sm text-brand-600">{entry.xp} XP · {entry.streak}🔥</Text>
          </View>
        ))}
      </View>

      <View className="rounded-3xl bg-white p-5 dark:bg-slate-800">
        <Text className="mb-3 font-semibold text-slate-900 dark:text-white">Today&apos;s Goal</Text>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-sm text-slate-600 dark:text-slate-300">Aaj {todayMinutes} min practice</Text>
          <Text className="text-sm text-slate-400">Goal: {dailyGoal} min</Text>
        </View>
        <View className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <View className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (todayMinutes / dailyGoal) * 100)}%` }} />
        </View>
      </View>
    </ScrollView>
  );
}

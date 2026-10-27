import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { api, RoleplayScenario } from '@/lib/api';

export default function RoleplayScreen() {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);

  useEffect(() => {
    api.get<{ scenarios: RoleplayScenario[] }>('/api/roleplay').then((d) => setScenarios(d.scenarios)).catch(console.error);
  }, []);

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-4 dark:bg-slate-900">
      <Text className="mb-6 text-slate-500">Practice real-world conversations</Text>

      {scenarios.map((s) => (
        <Link key={s.id} href={`/roleplay/${s.id}`} asChild>
          <TouchableOpacity className="mb-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
            <View className="mb-2 flex-row items-center gap-2">
              <Text className="rounded-full bg-brand-100 px-2 py-0.5 text-xs capitalize text-brand-700">{s.level}</Text>
              <Text className="text-xs text-slate-400">{s.category}</Text>
            </View>
            <Text className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">{s.title}</Text>
            <Text className="text-sm text-slate-500">{s.description}</Text>
            <Text className="mt-2 text-xs text-slate-400">{s.estimatedMinutes} min</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}

import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { BRAND } from '@/components/ui';

function TabIcon({ name, focused }: { name: FeatureIconName; focused: boolean }) {
  return (
    <View style={{ opacity: focused ? 1 : 0.65, transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <FeatureIcon name={name} size={28} />
    </View>
  );
}

const TABS: Array<{ name: string; title: string; icon: FeatureIconName }> = [
  { name: 'dashboard', title: 'Home', icon: 'home' },
  { name: 'chat', title: 'Kiki', icon: 'chat' },
  { name: 'lessons', title: 'Lessons', icon: 'lessons' },
  { name: 'progress', title: 'Progress', icon: 'progress' },
  { name: 'settings', title: 'Settings', icon: 'settings' },
];

export default function TabLayout() {
  const { user, initialized } = useAuthStore();

  if (initialized && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND.crimson,
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { paddingBottom: 6, paddingTop: 4, height: 64, borderTopWidth: 3, borderTopColor: BRAND.yellow },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused }) => <TabIcon name={t.icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}

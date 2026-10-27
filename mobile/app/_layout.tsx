import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    const unsub = initAuth();
    return unsub;
  }, [initAuth]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="roleplay/index" options={{ headerShown: true, title: 'Roleplay' }} />
      <Stack.Screen name="roleplay/[id]" options={{ headerShown: true, title: 'Roleplay' }} />
      <Stack.Screen name="lessons/[id]" options={{ headerShown: true, title: 'Lesson' }} />
      <Stack.Screen name="courses/index" options={{ headerShown: true, title: 'Courses' }} />
      <Stack.Screen name="courses/[id]" options={{ headerShown: true, title: 'Course' }} />
      <Stack.Screen name="debate" options={{ headerShown: true, title: 'Debate' }} />
      <Stack.Screen name="call" options={{ headerShown: true, title: 'Call with Kiki' }} />
      <Stack.Screen name="voice" options={{ headerShown: true, title: 'Voice Practice' }} />
    </Stack>
  );
}

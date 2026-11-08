import '../global.css';
import { Stack, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AccountGate } from '@/components/AccountGate';

/**
 * Blocks every signed-in screen (tabs, lessons, voice, call, debate, …) until
 * the account gate is "ok" — finish setup or wait for parental consent. The
 * API enforces the same rule; this keeps the UI from showing broken screens.
 * The Stack stays mounted underneath so navigation state survives.
 */
function GateOverlay() {
  const segments = useSegments() as string[];
  const gate = useAuthStore((s) => s.account?.gate);
  const isPublic = segments.length === 0 || segments[0] === '(auth)' || segments[0] === 'index';
  if (isPublic || !gate || gate === 'ok') return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      <AccountGate>{null}</AccountGate>
    </View>
  );
}

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    const unsub = initAuth();
    return unsub;
  }, [initAuth]);

  return (
    <>
    <Stack
      screenOptions={{
        headerShown: false,
        // Crimson header with a yellow title for every inner screen.
        headerStyle: { backgroundColor: '#dc143c' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { color: '#ffff33', fontWeight: '800' },
        headerShadowVisible: false,
      }}
    >
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
    <GateOverlay />
    </>
  );
}

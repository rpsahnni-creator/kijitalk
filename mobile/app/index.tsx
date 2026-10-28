import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, profile, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized || !user) return;
    if (profile && !profile.onboardingCompleted) {
      router.replace('/onboarding/profile');
    } else if (profile) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, profile, initialized, router]);

  return (
    <View className="flex-1 bg-brand-600 px-6 pt-16">
      <View className="mb-8 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20 p-1.5">
          <Image source={require('../assets/logo.png')} className="h-full w-full" resizeMode="contain" />
        </View>
        <Text className="text-2xl font-bold text-white">KijiTalk</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="mb-4 text-center text-4xl font-extrabold text-white">
          Speak English{'\n'}Confidently
        </Text>
        <Text className="mb-10 text-center text-lg text-accent-200">
          AI-powered English practice — free forever
        </Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity className="mb-4 w-full rounded-2xl bg-white py-4">
            <Text className="text-center text-lg font-semibold text-brand-700">Get Started Free</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="w-full rounded-2xl border-2 border-white/40 py-4">
            <Text className="text-center text-lg font-semibold text-white">Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

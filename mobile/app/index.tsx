import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { FeatureIcon, type FeatureIconName } from '@/components/FeatureIcon';
import { KikiFace } from '@/components/KikiFace';
import { BrandFooter, BRAND } from '@/components/ui';

const HIGHLIGHTS: Array<{ icon: FeatureIconName; label: string }> = [
  { icon: 'chat', label: 'Chat' },
  { icon: 'voice', label: 'Voice' },
  { icon: 'roleplay', label: 'Roleplay' },
  { icon: 'lessons', label: 'Lessons' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-brand-600">
      <View className="absolute -right-16 top-24 h-56 w-56 rounded-full bg-white/10" />
      <View className="absolute right-10 top-32 h-6 w-6 rounded-full" style={{ backgroundColor: BRAND.yellow }} />
      <View className="absolute -left-10 bottom-52 h-24 w-24 rounded-full" style={{ backgroundColor: BRAND.green }} />

      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 20 }}>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20 p-1.5">
            <Image source={require('../assets/logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
          <Text className="text-2xl font-bold text-white">KijiTalk</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <View className="mb-6 rounded-full bg-white p-1.5">
            <KikiFace size={88} />
          </View>
          <Text className="mb-1 text-center text-3xl font-extrabold text-white">Bharat ke har student ke liye</Text>
          <Text className="mb-4 text-center text-3xl font-extrabold" style={{ color: BRAND.yellowSoft }}>
            English Practice
          </Text>
          <Text className="mb-8 text-center text-base text-brand-50">
            Class 6 se college tak — Kiki se Hindi mein baat karo, English seekho. Bilkul free!
          </Text>

          <View className="mb-8 w-full flex-row justify-between rounded-3xl bg-white px-2 py-4">
            {HIGHLIGHTS.map((h) => (
              <View key={h.label} className="flex-1 items-center">
                <FeatureIcon name={h.icon} size={44} />
                <Text className="mt-1 text-xs font-semibold text-slate-700">{h.label}</Text>
              </View>
            ))}
          </View>

          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity className="mb-3 w-full rounded-2xl py-4" style={{ backgroundColor: BRAND.yellow }}>
              <Text className="text-center text-lg font-bold text-brand-900">Get Started Free</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="w-full rounded-2xl border-2 border-white/50 py-4">
              <Text className="text-center text-lg font-semibold text-white">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={{ paddingBottom: insets.bottom }} className="bg-brand-700">
        <BrandFooter />
      </View>
    </View>
  );
}

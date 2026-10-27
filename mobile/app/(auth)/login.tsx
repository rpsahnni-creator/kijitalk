import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      const { profile } = useAuthStore.getState();
      router.replace(profile?.onboardingCompleted ? '/(tabs)/dashboard' : '/onboarding/profile');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Invalid email or password');
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6 dark:bg-slate-900">
      <Text className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Welcome back</Text>
      <Text className="mb-8 text-slate-500">Sign in to continue learning</Text>

      <TextInput
        className="mb-4 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:text-white"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="mb-6 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:text-white"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="rounded-2xl bg-brand-600 py-4"
      >
        <Text className="text-center font-semibold text-white">
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')} className="mt-4">
        <Text className="text-center text-brand-600">Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}

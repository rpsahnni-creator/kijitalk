import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, loading } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      await signUp(email, password, name);
      router.replace('/onboarding/profile');
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof ApiError ? err.message : 'Could not create account'
      );
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6 dark:bg-slate-900">
      <Text className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Create account</Text>
      <Text className="mb-8 text-slate-500">Start speaking English today</Text>

      <TextInput className="mb-4 rounded-2xl border border-slate-200 px-4 py-3 dark:text-white" placeholder="Name" value={name} onChangeText={setName} />
      <TextInput className="mb-4 rounded-2xl border border-slate-200 px-4 py-3 dark:text-white" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput className="mb-6 rounded-2xl border border-slate-200 px-4 py-3 dark:text-white" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity onPress={handleSignup} disabled={loading} className="rounded-2xl bg-brand-600 py-4">
        <Text className="text-center font-semibold text-white">{loading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-4">
        <Text className="text-center text-brand-600">Already have an account?</Text>
      </TouchableOpacity>
    </View>
  );
}

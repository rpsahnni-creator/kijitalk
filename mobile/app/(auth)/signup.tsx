import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api';
import { AgeTermsFields, EMPTY_AGE_TERMS, validateAgeTerms, type AgeTermsValue } from '@/components/AgeTermsFields';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageTerms, setAgeTerms] = useState<AgeTermsValue>(EMPTY_AGE_TERMS);
  const [error, setError] = useState('');

  // Alert is a no-op on Expo web, so problems are also shown under the form.
  const fail = (text: string) => {
    setError(text);
    Alert.alert('Error', text);
  };
  const { signUp, loading } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) return fail('Apna naam likho');
    if (password.length < 8) return fail('Password kam se kam 8 characters ka hona chahiye');
    const problem = validateAgeTerms(ageTerms);
    if (problem) return fail(problem);
    try {
      await signUp(email.trim(), password, name.trim(), {
        isMinor: ageTerms.isMinor === true,
        parentEmail: ageTerms.parentEmail.trim(),
      });
      router.replace('/onboarding/profile');
    } catch (err) {
      fail(err instanceof ApiError ? err.message : 'Account nahi ban paya');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
      <Text className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Free account banao</Text>
      <Text className="mb-8 text-slate-500">Aaj se English bolna shuru karo</Text>

      <TextInput className="mb-4 rounded-2xl border border-slate-200 px-4 py-3 dark:text-white" placeholder="Naam" value={name} onChangeText={setName} />
      <TextInput className="mb-4 rounded-2xl border border-slate-200 px-4 py-3 dark:text-white" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput className="mb-6 rounded-2xl border border-slate-200 px-4 py-3 dark:text-white" placeholder="Password (min. 8)" value={password} onChangeText={setPassword} secureTextEntry />

      <AgeTermsFields value={ageTerms} onChange={setAgeTerms} />

      {!!error && (
        <Text accessibilityRole="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </Text>
      )}
      <TouchableOpacity onPress={handleSignup} disabled={loading} className="rounded-2xl bg-brand-600 py-4">
        <Text className="text-center font-semibold text-white">{loading ? 'Account ban raha hai…' : 'Create Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-4">
        <Text className="text-center text-brand-600">Pehle se account hai? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

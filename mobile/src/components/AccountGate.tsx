import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api';
import { AgeTermsFields, EMPTY_AGE_TERMS, validateAgeTerms, type AgeTermsValue } from './AgeTermsFields';
import { FeatureIcon } from './FeatureIcon';
import { AppHeader } from './ui';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3100';

function message(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function SignOutButton() {
  const signOut = useAuthStore((s) => s.signOut);
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={async () => {
        await signOut();
        router.replace('/');
      }}
      className="mt-4 py-2"
    >
      <Text className="text-center text-sm font-medium text-slate-500">Sign out</Text>
    </TouchableOpacity>
  );
}

function Setup() {
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const [value, setValue] = useState<AgeTermsValue>(EMPTY_AGE_TERMS);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const problem = validateAgeTerms(value);
    if (problem) return Alert.alert('Error', problem);
    setBusy(true);
    try {
      await completeSetup({ isMinor: value.isMinor === true, parentEmail: value.parentEmail.trim() });
    } catch (err) {
      Alert.alert('Error', message(err, 'Save nahi ho paya.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View className="mb-5 flex-row items-center gap-3">
        <FeatureIcon name="profile" size={48} />
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">Ek chhota sa step</Text>
          <Text className="text-sm text-slate-500">Aage badhne se pehle yeh batao — sirf ek baar.</Text>
        </View>
      </View>
      <AgeTermsFields value={value} onChange={setValue} />
      <TouchableOpacity onPress={submit} disabled={busy} className="rounded-2xl bg-brand-600 py-4">
        <Text className="text-center font-semibold text-white">{busy ? 'Save ho raha hai…' : 'Aage badho'}</Text>
      </TouchableOpacity>
    </>
  );
}

function ParentPending() {
  const { account, resendParentConsent, refreshSession, syncProfile } = useAuthStore();
  const [changing, setChanging] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      Alert.alert('KijiTalk', await resendParentConsent(changing ? email.trim() : undefined));
      setChanging(false);
    } catch (err) {
      Alert.alert('Error', message(err, 'Email nahi bhej paye.'));
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (await refreshSession()) await syncProfile();
  };

  return (
    <View className="items-center">
      <FeatureIcon name="help" size={64} />
      <Text className="mt-4 text-center text-xl font-bold text-slate-900 dark:text-white">Parent ki permission ka intezaar</Text>
      <Text className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
        Humne {account?.parentEmail} pe email bheja hai. Jaise hi aapke parent permission denge, KijiTalk khul jayega.
      </Text>
      {changing && (
        <TextInput
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 dark:text-white"
          placeholder="Parent ka sahi email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      )}
      <TouchableOpacity onPress={send} disabled={busy} className="mt-5 w-full rounded-2xl bg-brand-600 py-4">
        <Text className="text-center font-semibold text-white">{changing ? 'Naye email pe bhejo' : 'Email dobara bhejo'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setChanging((v) => !v)} className="mt-3 w-full rounded-2xl border border-slate-200 py-3">
        <Text className="text-center font-medium text-slate-700 dark:text-slate-200">{changing ? 'Cancel' : 'Email badlo'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={check} className="mt-3 py-2">
        <Text className="text-center text-sm font-semibold text-brand-600">Permission mil gayi? Check karo</Text>
      </TouchableOpacity>
    </View>
  );
}

function ParentDenied() {
  return (
    <View className="items-center">
      <FeatureIcon name="help" size={64} />
      <Text className="mt-4 text-center text-xl font-bold text-slate-900 dark:text-white">Parent ne permission nahi di</Text>
      <Text className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
        Isliye yeh account KijiTalk use nahi kar sakta. Apna data download ya account delete karne ke liye web app ki Settings kholo.
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/settings`)} className="mt-5 w-full rounded-2xl border border-slate-200 py-3">
        <Text className="text-center font-medium text-slate-700 dark:text-slate-200">Web Settings kholo</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Shown instead of the app until the account may use it (Terms + parental consent). */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const gate = useAuthStore((s) => s.account?.gate);
  if (!gate || gate === 'ok') return <>{children}</>;
  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="rounded-3xl bg-white p-6 dark:bg-slate-900">
          {gate === 'setup' && <Setup />}
          {gate === 'parent_pending' && <ParentPending />}
          {gate === 'parent_denied' && <ParentDenied />}
          <SignOutButton />
        </View>
      </ScrollView>
    </View>
  );
}

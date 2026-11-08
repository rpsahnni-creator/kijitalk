import { View, Text, TextInput, TouchableOpacity, Switch, Linking } from 'react-native';
import { BRAND } from './ui';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3100';

export interface AgeTermsValue {
  isMinor: boolean | null;
  parentEmail: string;
  accepted: boolean;
}

export const EMPTY_AGE_TERMS: AgeTermsValue = { isMinor: null, parentEmail: '', accepted: false };

/** Returns a Hinglish error message, or null when the answers are complete. */
export function validateAgeTerms(v: AgeTermsValue): string | null {
  if (v.isMinor === null) return 'Apni umar ka group chuno.';
  if (v.isMinor && !v.parentEmail.trim()) return '18 se kam ho to parent ya guardian ka email likho.';
  if (!v.accepted) return 'Terms aur Privacy Policy accept karo.';
  return null;
}

/** Age group, parent email (under 18) and Terms acceptance — DPDP Act 2023. */
export function AgeTermsFields({ value, onChange }: { value: AgeTermsValue; onChange: (v: AgeTermsValue) => void }) {
  const choice = (isMinor: boolean, label: string) => {
    const selected = value.isMinor === isMinor;
    return (
      <TouchableOpacity
        onPress={() => onChange({ ...value, isMinor })}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        className={`flex-1 rounded-xl border-2 py-3 ${selected ? 'border-brand-600 bg-brand-50' : 'border-slate-200 dark:border-slate-700'}`}
      >
        <Text className={`text-center text-sm font-semibold ${selected ? 'text-brand-700' : 'text-slate-700 dark:text-slate-200'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Aapki umar</Text>
      <View className="mb-4 flex-row gap-2">
        {choice(false, '18 ya usse zyada')}
        {choice(true, '18 se kam')}
      </View>

      {value.isMinor && (
        <View className="mb-4 rounded-xl bg-accent-50 p-3">
          <TextInput
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            placeholder="Parent / guardian ka email"
            value={value.parentEmail}
            onChangeText={(parentEmail) => onChange({ ...value, parentEmail })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text className="mt-2 text-xs text-slate-600">
            Unhe ek email jayega. Unki permission ke baad hi account chalega (DPDP Act 2023).
          </Text>
        </View>
      )}

      <View className="mb-4 flex-row items-center gap-3">
        <Switch
          value={value.accepted}
          onValueChange={(accepted) => onChange({ ...value, accepted })}
          trackColor={{ true: BRAND.crimson }}
          accessibilityLabel="Accept Terms and Privacy Policy"
        />
        <Text className="flex-1 text-sm text-slate-600 dark:text-slate-300">
          Main{' '}
          <Text className="font-semibold text-brand-600 underline" onPress={() => Linking.openURL(`${WEB_URL}/terms`)}>
            Terms
          </Text>{' '}
          aur{' '}
          <Text className="font-semibold text-brand-600 underline" onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}>
            Privacy Policy
          </Text>{' '}
          accept karta/karti hoon.
        </Text>
      </View>
    </View>
  );
}

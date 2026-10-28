import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

const GRADES = ['6', '7', '8', '9', '10', '11', '12', 'college', 'other'];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];
const LEARNING_GOALS = [
  { value: 'school', label: 'School English', desc: 'Class aur exam ke liye' },
  { value: 'spoken', label: 'Spoken English', desc: 'Confidently baat karna' },
  { value: 'exam', label: 'Competitive Exams', desc: 'Interview, SSC, Banking' },
  { value: 'career', label: 'Career Growth', desc: 'Job aur professional life' },
];
const LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Abhi shuru kar rahe hain' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Thoda English aata hai' },
  { value: 'advanced', label: 'Advanced', desc: 'Fluent hone ke paas' },
];

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          className={`rounded-2xl border px-4 py-2.5 ${
            selected === opt ? 'border-brand-500 bg-brand-50' : 'border-slate-200 dark:border-slate-600'
          }`}
        >
          <Text className={selected === opt ? 'font-medium text-brand-700' : 'text-slate-700 dark:text-slate-200'}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function OnboardingProfileScreen() {
  const { token, syncProfile } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    grade: '',
    board: 'CBSE',
    state: '',
    learningGoal: 'school',
    targetLevel: 'beginner',
  });

  const saveProfile = async () => {
    if (!token || !form.grade || !form.state) return;
    setLoading(true);
    try {
      await api.patch('/api/auth/me', { ...form, nativeLanguage: 'hi', onboardingCompleted: true }, token);
      await syncProfile();
      router.replace('/(tabs)/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 px-6 pt-16 dark:bg-slate-900">
      <View className="mb-6 items-center">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 p-2">
          <Image source={require('../../assets/logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Apna profile set karo</Text>
        <Text className="text-slate-500">Bharat ke har student ke liye — bilkul free</Text>
      </View>

      <View className="mb-4 flex-row justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <View key={i} className={`h-2 rounded-full ${i === step ? 'w-8 bg-brand-600' : 'w-2 bg-slate-300'}`} />
        ))}
      </View>

      {step === 0 && (
        <View className="gap-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
          <Text className="font-semibold text-slate-900 dark:text-white">Kaunsi class mein ho?</Text>
          <ChipRow
            options={GRADES}
            selected={form.grade}
            onSelect={(grade) => setForm({ ...form, grade })}
          />
          <Text className="font-semibold text-slate-900 dark:text-white">Board</Text>
          <ChipRow options={BOARDS} selected={form.board} onSelect={(board) => setForm({ ...form, board })} />
        </View>
      )}

      {step === 1 && (
        <View className="gap-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
          <Text className="font-semibold text-slate-900 dark:text-white">Aap kahan se ho?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ChipRow options={INDIAN_STATES} selected={form.state} onSelect={(state) => setForm({ ...form, state })} />
          </ScrollView>
          <Text className="font-semibold text-slate-900 dark:text-white">English kyun seekhna hai?</Text>
          {LEARNING_GOALS.map(({ value, label, desc }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setForm({ ...form, learningGoal: value })}
              className={`rounded-2xl border px-4 py-3 ${
                form.learningGoal === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <Text className="font-medium text-slate-900 dark:text-white">{label}</Text>
              <Text className="text-sm text-slate-500">{desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 2 && (
        <View className="gap-4 rounded-3xl bg-white p-5 dark:bg-slate-800">
          <Text className="font-semibold text-slate-900 dark:text-white">Aapka English level?</Text>
          {LEVELS.map(({ value, label, desc }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setForm({ ...form, targetLevel: value })}
              className={`rounded-2xl border px-4 py-3 ${
                form.targetLevel === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <Text className="font-medium text-slate-900 dark:text-white">{label}</Text>
              <Text className="text-sm text-slate-500">{desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View className="my-6 flex-row gap-3">
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} className="flex-1 rounded-2xl border border-slate-200 py-4 dark:border-slate-600">
            <Text className="text-center font-semibold text-slate-700 dark:text-slate-200">Back</Text>
          </TouchableOpacity>
        )}
        {step < 2 ? (
          <TouchableOpacity
            disabled={(step === 0 && !form.grade) || (step === 1 && !form.state)}
            onPress={() => setStep(step + 1)}
            className="flex-1 rounded-2xl bg-brand-600 py-4"
          >
            <Text className="text-center font-semibold text-white">Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity disabled={loading} onPress={saveProfile} className="flex-1 rounded-2xl bg-brand-600 py-4">
            <Text className="text-center font-semibold text-white">{loading ? 'Saving...' : 'Shuru karo!'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

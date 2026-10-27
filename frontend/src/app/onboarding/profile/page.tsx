'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useStore';
import { api } from '@/lib/api';
import { BOARDS, GRADES, INDIAN_STATES, LEARNING_GOALS, LEVELS } from '@/lib/i18n';

export default function ProfileOnboardingPage() {
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
      await api.patch(
        '/api/auth/me',
        {
          ...form,
          nativeLanguage: 'hi',
          onboardingCompleted: true,
        },
        token
      );
      await syncProfile();
      router.replace('/dashboard');
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-lg flex-1 p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero text-2xl font-bold text-white">
            K
          </div>
          <h1 className="text-2xl font-bold">Apna profile set karo</h1>
          <p className="text-slate-500">Bharat ke har student ke liye — bilkul free</p>
        </div>

        <div className="mb-4 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-brand-600' : 'w-2 bg-slate-300'}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Kaunsi class mein ho?</h2>
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, grade: value })}
                  className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    form.grade === value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Board</label>
              <select
                value={form.board}
                onChange={(e) => setForm({ ...form, board: e.target.value })}
                className="input-field"
              >
                {BOARDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Aap kahan se ho?</h2>
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="input-field"
            >
              <option value="">State chuniye</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <h2 className="font-semibold">English kyun seekhna hai?</h2>
            <div className="space-y-2">
              {LEARNING_GOALS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, learningGoal: value })}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    form.learningGoal === value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-slate-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-4">
            <h2 className="font-semibold">Aapka English level?</h2>
            <div className="space-y-2">
              {LEVELS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, targetLevel: value })}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    form.targetLevel === value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-slate-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary flex-1">
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              disabled={(step === 0 && !form.grade) || (step === 1 && !form.state)}
              onClick={() => setStep(step + 1)}
              className="btn-primary flex-1"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={saveProfile} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Shuru karo!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

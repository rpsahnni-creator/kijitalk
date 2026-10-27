'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Bell, LogOut, User, Target } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, token, profile, signOut, initialized } = useAuthStore();
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const [accent, setAccent] = useState<'indian' | 'british' | 'american'>('indian');

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (profile?.settings) {
      setNotifications(profile.settings.notifications);
      setDailyGoal(profile.settings.dailyGoalMinutes);
      if (profile.settings.voiceSpeed) setVoiceSpeed(profile.settings.voiceSpeed);
      if (profile.settings.accent) setAccent(profile.settings.accent);
      if (profile.settings.darkMode !== darkMode) {
        useSettingsStore.getState().setDarkMode(profile.settings.darkMode);
      }
    }
  }, [profile, darkMode]);

  const saveSettings = async () => {
    if (!token) return;
    await api.patch('/api/settings', {
      darkMode,
      notifications,
      dailyGoalMinutes: dailyGoal,
      voiceSpeed,
      accent,
    }, token);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!initialized || !user) return <LoadingScreen />;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
        </header>

        <div className="card mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-hero text-2xl font-bold text-white">
            {profile?.displayName?.[0]?.toUpperCase() ?? <User size={28} />}
          </div>
          <div>
            <p className="text-lg font-semibold">{profile?.displayName ?? 'Learner'}</p>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <p className="text-xs capitalize text-brand-600">{profile?.targetLevel ?? 'beginner'} level</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span className="font-medium">Dark Mode</span>
            </div>
            <button
              onClick={() => { toggleDarkMode(); saveSettings(); }}
              className={`relative h-7 w-12 rounded-full transition ${darkMode ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${darkMode ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={20} />
              <span className="font-medium">Notifications</span>
            </div>
            <button
              onClick={() => { setNotifications(!notifications); saveSettings(); }}
              className={`relative h-7 w-12 rounded-full transition ${notifications ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${notifications ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center gap-3">
              <Target size={20} />
              <span className="font-medium">Daily Goal (minutes)</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              onMouseUp={saveSettings}
              className="w-full accent-brand-600"
            />
            <p className="mt-1 text-center text-sm text-slate-500">{dailyGoal} minutes/day</p>
          </div>

          <div className="card">
            <p className="mb-2 font-medium">Voice Speed</p>
            <input type="range" min={0.5} max={1.5} step={0.1} value={voiceSpeed} onChange={(e) => setVoiceSpeed(Number(e.target.value))} onMouseUp={saveSettings} className="w-full accent-brand-600" />
            <p className="mt-1 text-center text-sm text-slate-500">{voiceSpeed}x</p>
          </div>

          <div className="card">
            <p className="mb-2 font-medium">Accent</p>
            <select value={accent} onChange={(e) => { setAccent(e.target.value as typeof accent); saveSettings(); }} className="input-field">
              <option value="indian">Indian English</option>
              <option value="british">British English</option>
              <option value="american">American English</option>
            </select>
          </div>
        </div>

        <button onClick={handleSignOut} className="btn-secondary mt-8 w-full text-red-600">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </AppShell>
  );
}

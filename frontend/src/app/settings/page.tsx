'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Moon,
  Bell,
  LogOut,
  Target,
  Crown,
  ChevronRight,
  Gauge,
  Globe2,
  Languages,
  Volume2,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageHeader, Toggle } from '@/components/ui';
import { SecuritySection } from '@/components/SecuritySection';
import { MyDataSection } from '@/components/MyDataSection';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';
import { api, UserProfile } from '@/lib/api';
import { speechService } from '@/lib/speech';

type Settings = UserProfile['settings'];

function Row({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Moon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, token, profile, signOut, initialized, updateSettings } = useAuthStore();
  const { darkMode, setDarkMode } = useSettingsStore();
  const router = useRouter();
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dailyGoal, setDailyGoal] = useState(15);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedFor = useRef<string | null>(null);

  const signingOut = useRef(false);

  useEffect(() => {
    if (initialized && !user && !signingOut.current) router.replace('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ tier: 'free' | 'premium' }>('/api/subscription/status', token)
      .then((d) => setTier(d.tier))
      .catch(() => {});
  }, [token]);

  // Seed slider values once per profile — never overwrite what the user is dragging.
  useEffect(() => {
    if (!profile?.settings || loadedFor.current === profile.id) return;
    loadedFor.current = profile.id;
    setDailyGoal(profile.settings.dailyGoalMinutes ?? 15);
    setVoiceSpeed(profile.settings.voiceSpeed ?? 0.9);
  }, [profile]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    []
  );

  const save = async (patch: Partial<Settings>) => {
    setSaveState('saving');
    try {
      await updateSettings(patch);
      setSaveState('saved');
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState('idle'), 1800);
    } catch {
      setSaveState('error');
    }
  };

  const saveDebounced = (patch: Partial<Settings>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void save(patch), 450);
  };

  const handleSignOut = () => {
    signingOut.current = true;
    signOut();
    router.push('/');
  };

  if (!initialized || !user) return <LoadingScreen />;

  const settings = profile?.settings;
  const notifications = settings?.notifications ?? true;
  const hindiLabels = settings?.hindiLabels !== false;
  const accent = settings?.accent ?? 'indian';

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
        <PageHeader
          feature="settings"
          title="Settings"
          subtitle="Apne hisaab se KijiTalk set karo"
          actions={
            <span
              aria-live="polite"
              className={`text-xs font-medium transition ${
                saveState === 'error' ? 'text-red-500' : 'text-slate-400'
              } ${saveState === 'idle' ? 'opacity-0' : 'opacity-100'}`}
            >
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && (
                <span className="inline-flex items-center gap-1 text-success-600">
                  <Check size={14} /> Saved
                </span>
              )}
              {saveState === 'error' && 'Save nahi hua — dobara try karo'}
            </span>
          }
        />

        <div className="card mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full gradient-hero text-xl font-bold text-white shadow-sm">
            {profile?.displayName?.trim()?.[0]?.toUpperCase() ?? 'K'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{profile?.displayName ?? 'Learner'}</p>
            <p className="truncate text-sm text-slate-500">{profile?.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="chip bg-brand-50 capitalize text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {profile?.targetLevel ?? 'beginner'}
              </span>
              {profile?.grade && (
                <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {profile.grade === 'college' ? 'College' : `Class ${profile.grade}`}
                </span>
              )}
              {profile?.state && (
                <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{profile.state}</span>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/pricing"
          className={`card card-interactive mb-6 flex items-center justify-between ${
            tier === 'premium' ? '' : 'border-accent-200 bg-gradient-to-r from-accent-50 to-white dark:border-accent-900/50 dark:from-accent-950/30 dark:to-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
              <Crown size={20} />
            </div>
            <div>
              <p className="font-semibold">{tier === 'premium' ? 'Premium Plan' : 'Free Plan'}</p>
              <p className="text-sm text-slate-500">
                {tier === 'premium' ? 'Unlimited AI practice active' : 'Upgrade karo unlimited practice ke liye'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>

        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">App</h2>
        <div className="card mb-6 divide-y divide-slate-100 p-0 dark:divide-slate-800">
          <Row icon={Moon} title="Dark Mode" description="Raat mein aankhon ko aaram">
            <Toggle
              label="Dark mode"
              checked={darkMode}
              onChange={(next) => {
                setDarkMode(next);
                void save({ darkMode: next });
              }}
            />
          </Row>
          <Row icon={Bell} title="Notifications" description="Daily practice reminders">
            <Toggle label="Notifications" checked={notifications} onChange={(next) => void save({ notifications: next })} />
          </Row>
          <Row icon={Languages} title="Hindi labels" description="Menu mein Hindi naam dikhao">
            <Toggle label="Hindi labels" checked={hindiLabels} onChange={(next) => void save({ hindiLabels: next })} />
          </Row>
        </div>

        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Practice</h2>
        <div className="card mb-6 divide-y divide-slate-100 p-0 dark:divide-slate-800">
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Target size={18} />
                </div>
                <p className="text-sm font-medium">Daily goal</p>
              </div>
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">{dailyGoal} min/day</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={dailyGoal}
              aria-label="Daily goal in minutes"
              onChange={(e) => {
                const v = Number(e.target.value);
                setDailyGoal(v);
                saveDebounced({ dailyGoalMinutes: v });
              }}
              className="w-full accent-brand-600"
            />
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Gauge size={18} />
                </div>
                <p className="text-sm font-medium">Kiki ki voice speed</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">{voiceSpeed.toFixed(1)}x</span>
                <button
                  type="button"
                  onClick={() => {
                    speechService.configure({ rate: voiceSpeed, accent });
                    speechService.speak('Hello! This is how Kiki will sound.');
                  }}
                  className="btn-ghost h-8 w-8 p-0"
                  aria-label="Preview voice"
                  title="Preview"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={voiceSpeed}
              aria-label="Voice speed"
              onChange={(e) => {
                const v = Math.round(Number(e.target.value) * 10) / 10;
                setVoiceSpeed(v);
                saveDebounced({ voiceSpeed: v });
              }}
              className="w-full accent-brand-600"
            />
          </div>

          <Row icon={Globe2} title="Accent" description="Kiki kis accent mein bole">
            <select
              value={accent}
              aria-label="Accent"
              onChange={(e) => void save({ accent: e.target.value as Settings['accent'] })}
              className="input-field w-auto py-2"
            >
              <option value="indian">Indian</option>
              <option value="british">British</option>
              <option value="american">American</option>
            </select>
          </Row>
        </div>

        <SecuritySection />
        <MyDataSection />

        <button type="button" onClick={handleSignOut} className="btn-secondary w-full text-red-600 dark:text-red-400">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { startAnalytics, trackPageview } from '@/lib/analytics';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';
import { speechService } from '@/lib/speech';

export function Providers({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const profile = useAuthStore((s) => s.profile);
  const account = useAuthStore((s) => s.account);
  const pathname = usePathname();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const appliedProfileId = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // When a user's profile first loads (sign-in, or a new device), adopt the theme
  // saved on their account. After that the local toggle is the source of truth.
  useEffect(() => {
    if (!profile?.id || appliedProfileId.current === profile.id) return;
    appliedProfileId.current = profile.id;
    if (typeof profile.settings?.darkMode === 'boolean') {
      useSettingsStore.getState().setDarkMode(profile.settings.darkMode);
    }
  }, [profile?.id, profile?.settings?.darkMode]);

  // Voice speed and accent from Settings apply to everything Kiki speaks.
  useEffect(() => {
    speechService.configure({
      rate: profile?.settings?.voiceSpeed,
      accent: profile?.settings?.accent,
    });
  }, [profile?.settings?.voiceSpeed, profile?.settings?.accent]);

  // Analytics only for consenting adults (see lib/analytics.ts).
  useEffect(() => {
    startAnalytics(account);
  }, [account]);

  useEffect(() => {
    if (pathname) trackPageview(pathname);
  }, [pathname, account]);

  return <>{children}</>;
}

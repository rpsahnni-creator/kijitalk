'use client';

import { useEffect } from 'react';
import { useAuthStore, useSettingsStore } from '@/stores/useStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleOnline = () => {
      console.info('Back online — syncing pending actions');
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return <>{children}</>;
}

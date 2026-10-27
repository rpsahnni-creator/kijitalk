'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiError, UserProfile } from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => void;
  syncProfile: () => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      loading: false,
      initialized: false,

      signIn: async (email, password) => {
        set({ loading: true });
        try {
          const { user, token } = await api.post<{ user: UserProfile; token: string }>(
            '/api/auth/login',
            { email, password }
          );
          set({ user, profile: user, token });
        } finally {
          set({ loading: false });
        }
      },

      signUp: async (email, password, displayName) => {
        set({ loading: true });
        try {
          const { user, token } = await api.post<{ user: UserProfile; token: string }>(
            '/api/auth/register',
            { email, password, displayName, nativeLanguage: 'hi' }
          );
          set({ user, profile: user, token });
        } finally {
          set({ loading: false });
        }
      },

      signInWithGoogle: async (idToken) => {
        set({ loading: true });
        try {
          const { user, token } = await api.post<{ user: UserProfile; token: string }>(
            '/api/auth/google',
            { idToken }
          );
          set({ user, profile: user, token });
        } finally {
          set({ loading: false });
        }
      },

      signOut: () => {
        set({ user: null, profile: null, token: null });
      },

      syncProfile: async () => {
        const { token } = get();
        if (!token) {
          set({ initialized: true });
          return;
        }
        try {
          const { user } = await api.get<{ user: UserProfile }>('/api/auth/me', token);
          set({ user, profile: user, initialized: true });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            set({ user: null, profile: null, token: null });
          }
          set({ initialized: true });
        }
      },

      initAuth: () => {
        void get().syncProfile();
        return () => {};
      },
    }),
    {
      name: 'kijitalk-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

interface SettingsState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle('dark', next);
      },
      setDarkMode: (value) => {
        set({ darkMode: value });
        document.documentElement.classList.toggle('dark', value);
      },
    }),
    { name: 'kijitalk-settings' }
  )
);

interface OfflineState {
  pendingActions: Array<{ type: string; payload: unknown; timestamp: number }>;
  addPending: (type: string, payload: unknown) => void;
  clearPending: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      addPending: (type, payload) => {
        set({ pendingActions: [...get().pendingActions, { type, payload, timestamp: Date.now() }] });
      },
      clearPending: () => set({ pendingActions: [] }),
    }),
    { name: 'kijitalk-offline' }
  )
);

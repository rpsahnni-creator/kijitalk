import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError, UserProfile } from '../lib/api';

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

      // Not wired to a UI button yet — Expo's managed workflow (no native dev client
      // available in this project) has no reliable Google OAuth flow left since Google
      // deprecated the old proxy-based AuthSession approach. Kept so a native build can
      // wire a real Google button later by just calling this with the obtained idToken.
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

      // Rehydration from AsyncStorage is async (unlike web's synchronous localStorage),
      // so the initial profile sync happens in onRehydrateStorage below, once the
      // persisted token has actually loaded — not here, which would race ahead of it.
      initAuth: () => {
        return () => {};
      },
    }),
    {
      name: 'kijitalk-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        // Persisted token restored (or there wasn't one) — now fetch the profile.
        void state?.syncProfile();
      },
    }
  )
);

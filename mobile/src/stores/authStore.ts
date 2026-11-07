import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api,
  ApiError,
  authRequest,
  setAccessTokenRefresher,
  type AuthAccount,
  type AuthSession,
  type UserProfile,
} from '../lib/api';
import { refreshTokenStore } from '../lib/secureStorage';

interface AuthState {
  user: UserProfile | null;
  profile: UserProfile | null;
  account: AuthAccount | null;
  /** Short-lived access token, memory only. The refresh token sits in secure storage. */
  token: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  syncProfile: () => Promise<void>;
  initAuth: () => () => void;
}

let refreshInFlight: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => {
  const applySession = async (session: AuthSession) => {
    await refreshTokenStore.set(session.refresh);
    set({ token: session.access, account: session.user });
  };

  const clearSession = async () => {
    await refreshTokenStore.clear();
    set({ user: null, profile: null, account: null, token: null });
  };

  const signInWith = async (path: string, body: unknown) => {
    set({ loading: true });
    try {
      await applySession(await authRequest<AuthSession>(path, body));
      await get().syncProfile();
    } finally {
      set({ loading: false });
    }
  };

  return {
    user: null,
    profile: null,
    account: null,
    token: null,
    loading: false,
    initialized: false,

    signIn: (email, password) => signInWith('/api/auth/login/', { email, password }),

    signUp: (email, password, displayName) =>
      signInWith('/api/auth/register/', { email, password, display_name: displayName }),

    // Not wired to a UI button yet — Expo's managed workflow (no native dev client
    // in this project) has no reliable Google OAuth flow. A native build can call
    // this with the idToken it obtains.
    signInWithGoogle: (idToken) => signInWith('/api/auth/google/', { id_token: idToken }),

    signOut: async () => {
      const refresh = await refreshTokenStore.get();
      await clearSession();
      if (refresh) {
        try {
          await authRequest('/api/auth/logout/', { refresh });
        } catch {
          // Already revoked or expired — signed out either way.
        }
      }
    },

    refreshSession: () => {
      // The refresh token rotates on use, so never send it twice in parallel.
      if (refreshInFlight) return refreshInFlight;
      refreshInFlight = (async () => {
        const refresh = await refreshTokenStore.get();
        if (!refresh) return null;
        try {
          const session = await authRequest<AuthSession>('/api/auth/token/refresh/', { refresh });
          await applySession(session);
          return session.access;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) await clearSession();
          return null;
        }
      })().finally(() => {
        refreshInFlight = null;
      });
      return refreshInFlight;
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
        if (error instanceof ApiError && error.status === 401) await clearSession();
        set({ initialized: true });
      }
    },

    initAuth: () => {
      setAccessTokenRefresher(() => get().refreshSession());
      void (async () => {
        // Old builds kept a 30-day token here; it no longer works anywhere.
        await AsyncStorage.removeItem('kijitalk-auth').catch(() => {});
        const access = await get().refreshSession();
        if (access) await get().syncProfile();
        set({ initialized: true });
      })();
      return () => setAccessTokenRefresher(null);
    },
  };
});

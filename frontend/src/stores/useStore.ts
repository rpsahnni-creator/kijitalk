'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  api,
  ApiError,
  authRequest,
  setAccessTokenRefresher,
  type AuthAccount,
  type AuthSession,
  type UserProfile,
} from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  profile: UserProfile | null;
  /** Login account from auth-service (email verification, password status). */
  account: AuthAccount | null;
  /** Short-lived access token — kept in memory only, never in localStorage. */
  token: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  syncProfile: () => Promise<void>;
  updateSettings: (patch: Partial<UserProfile['settings']>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<string>;
  resendVerification: () => Promise<string>;
  initAuth: () => () => void;
}

/** Seconds until a JWT expires (0 if unreadable). */
function secondsLeft(jwt: string): number {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Math.max(0, payload.exp - Date.now() / 1000);
  } catch {
    return 0;
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAuthStore = create<AuthState>()((set, get) => {
  /** Store a new session and schedule the next silent refresh. */
  const applySession = (session: AuthSession) => {
    set({ token: session.access, account: session.user });
    if (refreshTimer) clearTimeout(refreshTimer);
    const delay = Math.max(15, secondsLeft(session.access) - 60) * 1000;
    refreshTimer = setTimeout(() => void get().refreshSession(), delay);
  };

  const clearSession = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;
    set({ user: null, profile: null, account: null, token: null });
  };

  const signInWith = async (path: string, body: unknown) => {
    set({ loading: true });
    try {
      applySession(await authRequest<AuthSession>(path, body));
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

    signInWithGoogle: (idToken) => signInWith('/api/auth/google/', { id_token: idToken }),

    signOut: async () => {
      clearSession();
      try {
        await authRequest('/api/auth/logout/', {});
      } catch {
        // Already signed out on the server — nothing else to do.
      }
    },

    refreshSession: () => {
      // One refresh at a time: the refresh token rotates, so a second parallel
      // call with the same cookie would be rejected.
      if (refreshInFlight) return refreshInFlight;
      refreshInFlight = (async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const session = await authRequest<AuthSession>('/api/auth/token/refresh/', {});
            applySession(session);
            return session.access;
          } catch (error) {
            const expired = error instanceof ApiError && error.status === 401;
            // Another tab may have just rotated the cookie; give it a moment once.
            if (expired && attempt === 0) {
              await sleep(800);
              continue;
            }
            if (expired) clearSession();
            return null;
          }
        }
        return null;
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
        const { user } = await api.get<{ user: UserProfile }>('/api/auth/me', get().token);
        set({ user, profile: user, initialized: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearSession();
        set({ initialized: true });
      }
    },

    updateSettings: async (patch) => {
      const { token, profile } = get();
      if (!token || !profile) return;
      // Optimistic: reflect the change immediately, then confirm with the server.
      const optimistic = { ...profile, settings: { ...profile.settings, ...patch } };
      set({ profile: optimistic, user: optimistic });
      const { settings } = await api.patch<{ settings: UserProfile['settings'] }>('/api/settings', patch, token);
      const current = get().profile;
      if (current) {
        // Local values win: they already include this patch and any newer ones made meanwhile.
        const confirmed = { ...current, settings: { ...settings, ...current.settings } };
        set({ profile: confirmed, user: confirmed });
      }
    },

    changePassword: async (oldPassword, newPassword) => {
      const session = await authRequest<AuthSession>(
        '/api/auth/change-password/',
        { old_password: oldPassword, new_password: newPassword },
        get().token
      );
      applySession(session);
      return session.message ?? 'Password badal gaya.';
    },

    resendVerification: async () => {
      const { message } = await authRequest<{ message: string }>('/api/auth/email/resend/', {}, get().token);
      return message;
    },

    initAuth: () => {
      setAccessTokenRefresher(() => get().refreshSession());
      try {
        // Tokens used to be stored here; they no longer are.
        localStorage.removeItem('kijitalk-auth');
      } catch {
        /* storage blocked — nothing to clean */
      }
      void (async () => {
        const access = await get().refreshSession();
        if (access) await get().syncProfile();
        set({ initialized: true });
      })();
      return () => setAccessTokenRefresher(null);
    },
  };
});

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

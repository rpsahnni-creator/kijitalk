'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  api,
  ApiError,
  authRequest,
  setAccessTokenRefresher,
  setSuspendedHandler,
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
  signUp: (
    email: string,
    password: string,
    displayName: string,
    age: { isMinor: boolean; parentEmail?: string }
  ) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  syncProfile: () => Promise<void>;
  updateSettings: (patch: Partial<UserProfile['settings']>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<string>;
  resendVerification: () => Promise<string>;
  completeSetup: (input: { isMinor: boolean; parentEmail?: string }) => Promise<void>;
  resendParentConsent: (parentEmail?: string) => Promise<string>;
  exportMyData: () => Promise<Blob>;
  deleteAccount: (password: string) => Promise<string>;
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
// Bumped on every explicit sign-in / sign-out. A refresh that started before
// one of those must not overwrite it (e.g. a failed refresh from page load
// signing out a learner who logged in a moment later).
let sessionEpoch = 0;
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
      const session = await authRequest<AuthSession>(path, body);
      sessionEpoch += 1;
      applySession(session);
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

    signUp: (email, password, displayName, age) =>
      signInWith('/api/auth/register/', {
        email,
        password,
        display_name: displayName,
        accept_terms: true,
        is_minor: age.isMinor,
        parent_email: age.parentEmail ?? '',
      }),

    signInWithGoogle: (idToken) => signInWith('/api/auth/google/', { id_token: idToken }),

    signOut: async () => {
      sessionEpoch += 1;
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
      const startedAt = sessionEpoch;
      refreshInFlight = (async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const session = await authRequest<AuthSession>('/api/auth/token/refresh/', {});
            // Signed out meanwhile: don't bring the session back.
            if (sessionEpoch !== startedAt && !get().token) return null;
            applySession(session);
            return session.access;
          } catch (error) {
            // Signed in/out meanwhile: that newer session wins.
            if (sessionEpoch !== startedAt) return get().token;
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

    completeSetup: async ({ isMinor, parentEmail }) => {
      applySession(
        await authRequest<AuthSession>(
          '/api/auth/account/setup/',
          { accept_terms: true, is_minor: isMinor, parent_email: parentEmail ?? '' },
          get().token
        )
      );
      await get().syncProfile();
    },

    resendParentConsent: async (parentEmail) => {
      const res = await authRequest<AuthSession & { message: string }>(
        '/api/auth/parent-consent/resend/',
        parentEmail ? { parent_email: parentEmail } : {},
        get().token
      );
      if (res.access) applySession(res);
      return res.message;
    },

    exportMyData: async () => {
      const token = get().token;
      const [account, learning] = await Promise.all([
        authRequest<{ account: unknown }>('/api/auth/account/export/', undefined, token),
        api.get<Record<string, unknown>>('/api/account/export', token),
      ]);
      const file = { service: 'KijiTalk', ...learning, account: account.account };
      return new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    },

    deleteAccount: async (password) => {
      const { message } = await authRequest<{ message: string }>(
        '/api/auth/account/delete/',
        { password, confirm: 'DELETE' },
        get().token
      );
      sessionEpoch += 1;
      clearSession();
      return message;
    },

    initAuth: () => {
      setAccessTokenRefresher(() => get().refreshSession());
      setSuspendedHandler(() => {
        void get().signOut();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login?suspended=1');
        }
      });
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
      return () => {
        setAccessTokenRefresher(null);
        setSuspendedHandler(null);
      };
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

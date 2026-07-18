import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IUser, STORAGE_KEYS, UserRole } from '@cp/shared';

import { IMPERSONATION_FLAG, isImpersonationTab } from '../lib/impersonation';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: IUser | null;
  /** True once Zustand has finished hydrating from storage. */
  isHydrated: boolean;
  /** True in a tab that is impersonating a student (drives the banner). */
  isImpersonating: boolean;

  setSession: (accessToken: string, refreshToken: string, user: IUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  startImpersonation: (accessToken: string, user: IUser) => void;
  updateUser: (patch: Partial<IUser>) => void;
  clear: () => void;
  hasRole: (role: UserRole) => boolean;
  setHydrated: () => void;
}

/**
 * A normal tab persists to localStorage. An impersonation tab (the /impersonate
 * handoff route, or any tab already carrying the cp.impersonating flag) persists
 * to sessionStorage instead — isolated per tab — so it never overwrites the
 * admin's own session in the original tab.
 */
const impersonationTab =
  typeof window !== 'undefined' &&
  isImpersonationTab(window.location.pathname, window.sessionStorage);

// Banner state keys off the persisted flag (set by startImpersonation), not the
// pathname — so the /impersonate handoff document (pathname matches but no
// session yet) doesn't flash the "session expired" banner before the token arrives.
const impersonationActive =
  typeof window !== 'undefined' &&
  window.sessionStorage.getItem(IMPERSONATION_FLAG) === '1';

const authStorage: Storage =
  typeof window === 'undefined'
    ? localStorage
    : impersonationTab
      ? window.sessionStorage
      : window.localStorage;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
      isImpersonating: impersonationActive,

      setSession: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      startImpersonation: (accessToken, user) => {
        window.sessionStorage.setItem(IMPERSONATION_FLAG, '1');
        set({ accessToken, refreshToken: null, user, isImpersonating: true });
      },
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      hasRole: (role) => get().user?.role === role,
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: STORAGE_KEYS.authStore,
      storage: createJSONStorage(() => authStorage),
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

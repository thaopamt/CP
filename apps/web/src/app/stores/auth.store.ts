import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IUser, STORAGE_KEYS, UserRole } from '@cp/shared';

interface AuthState {
  accessToken: string | null;
  user: IUser | null;
  /** True once Zustand has finished hydrating from localStorage. */
  isHydrated: boolean;

  setSession: (accessToken: string, user: IUser) => void;
  clear: () => void;
  hasRole: (role: UserRole) => boolean;
  setHydrated: () => void;
}

/**
 * Auth state, persisted to localStorage so a hard refresh keeps the user
 * logged in. The `isHydrated` flag is read by RoleGuard — without it, the
 * first render on `/admin` (before persist runs) would redirect to /login.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isHydrated: false,

      setSession: (accessToken, user) => set({ accessToken, user }),
      clear: () => set({ accessToken: null, user: null }),
      hasRole: (role) => get().user?.role === role,
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: STORAGE_KEYS.authStore,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

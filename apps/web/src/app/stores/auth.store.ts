import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IUser, STORAGE_KEYS, UserRole } from '@cp/shared';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: IUser | null;
  /** True once Zustand has finished hydrating from localStorage. */
  isHydrated: boolean;

  setSession: (accessToken: string, refreshToken: string, user: IUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (patch: Partial<IUser>) => void;
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
      refreshToken: null,
      user: null,
      isHydrated: false,

      setSession: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
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
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

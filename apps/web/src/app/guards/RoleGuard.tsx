import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROLE_HOME_PATH, UserRole } from '@cp/shared';

import { useAuthStore } from '../stores/auth.store';

interface RoleGuardProps {
  /** Roles permitted to view children. Empty array = any authenticated user. */
  allow: UserRole[];
  children: ReactNode;
}

/**
 * ────────────────────────────────────────────────────────────────────────
 *  RoleGuard — deliverable #3
 * ────────────────────────────────────────────────────────────────────────
 * Three-step decision:
 *
 *   1. Wait for the auth store to finish hydrating from localStorage.
 *      Without this, a hard-refresh on /admin briefly shows "no token"
 *      and bounces to /login before persist completes — visible flash.
 *
 *   2. Unauthenticated → /login (preserves the intended path in
 *      `location.state.from` so the login page can return the user).
 *
 *   3. Wrong role → user's own portal home (ROLE_HOME_PATH map from
 *      @cp/shared, the same map used by NestJS RolesGuard semantics).
 *
 * Pass `allow={[]}` for an authenticated-only check (no specific role).
 *
 * Usage:
 *   <RoleGuard allow={[UserRole.ADMIN]}>
 *     <AdminLayout />
 *   </RoleGuard>
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // 1. Don't make routing decisions before persist hydrates
  if (!isHydrated) return null;

  // 2. Not logged in
  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 3. Wrong role for this portal
  if (allow.length > 0 && !allow.includes(user.role)) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <>{children}</>;
}

/**
 * Sends an authenticated user to their own portal home — used for `/`
 * so we don't double-redirect through one portal layout into another.
 */
export function RoleHomeRedirect() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) return null;
  if (!accessToken || !user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
}

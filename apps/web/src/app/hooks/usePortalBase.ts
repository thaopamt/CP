import { useLocation } from 'react-router-dom';

/**
 * Returns the base path of the portal the user is currently in
 * ('/admin' | '/teacher' | '/student').
 *
 * Shared page components (e.g. the management screens under pages/admin)
 * are mounted under both the Admin and Teacher portals. They must build
 * navigation links relative to the active portal so a teacher stays in
 * `/teacher/*` instead of being bounced into `/admin/*` (and blocked by the
 * RoleGuard). Use this instead of hardcoding `/admin` in `navigate()`/`<Link>`.
 */
export function usePortalBase(): '/admin' | '/teacher' | '/student' {
  const { pathname } = useLocation();
  if (pathname.startsWith('/teacher')) return '/teacher';
  if (pathname.startsWith('/student')) return '/student';
  return '/admin';
}

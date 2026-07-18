import { STORAGE_KEYS } from '@cp/shared';

import { useAuthStore } from '../stores/auth.store';
import { exitImpersonation } from '../lib/impersonation';

/**
 * Shown only in an impersonation tab. Makes it unmistakable that the admin is
 * acting as a student, and offers a one-click exit (clears this tab's session
 * and closes it — the admin's own tab is untouched).
 */
export function ImpersonationBanner() {
  const isImpersonating = useAuthStore((s) => s.isImpersonating);
  const user = useAuthStore((s) => s.user);

  if (!isImpersonating) return null;

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[100] flex h-10 items-center justify-center gap-3 bg-amber-500 px-4 text-sm font-medium text-black shadow">
        <span className="material-symbols-outlined text-[18px]">switch_account</span>
        <span>
          {user ? (
            <>Đang xem với tư cách <strong>{name || 'học sinh'}</strong></>
          ) : (
            <>Phiên mạo danh đã hết hạn</>
          )}
        </span>
        <button
          type="button"
          onClick={() => exitImpersonation(window, STORAGE_KEYS.authStore)}
          className="rounded bg-black/80 px-2 py-0.5 text-white hover:bg-black"
        >
          Thoát
        </button>
      </div>
      {/* Spacer so the fixed bar does not overlap the portal header. */}
      <div className="h-10" aria-hidden />
    </>
  );
}

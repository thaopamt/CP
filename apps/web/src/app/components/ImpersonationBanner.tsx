import { useState } from 'react';
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
  const clear = useAuthStore((s) => s.clear);
  const [exited, setExited] = useState(false);

  if (!isImpersonating) return null;

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  function handleExit() {
    // Clears this tab's sessionStorage session + flag and attempts window.close().
    exitImpersonation(window, STORAGE_KEYS.authStore);
    // Wipe the in-memory session too, so the UI reflects logout even if the
    // browser refuses to close the tab (e.g. it was reloaded and is no longer
    // script-closable).
    clear();
    setExited(true);
  }

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[100] flex h-10 items-center justify-center gap-3 bg-amber-500 px-4 text-sm font-medium text-black shadow">
        <span className="material-symbols-outlined text-[18px]">switch_account</span>
        {exited ? (
          <span>Đã thoát mạo danh — bạn có thể đóng tab này.</span>
        ) : (
          <>
            <span>
              {user ? (
                <>Đang xem với tư cách <strong>{name || 'học sinh'}</strong></>
              ) : (
                <>Phiên mạo danh đã hết hạn</>
              )}
            </span>
            <button
              type="button"
              onClick={handleExit}
              className="rounded bg-black/80 px-2 py-0.5 text-white hover:bg-black"
            >
              Thoát
            </button>
          </>
        )}
      </div>
      {/* Spacer so the fixed bar does not overlap the portal header. */}
      <div className="h-10" aria-hidden />
    </>
  );
}

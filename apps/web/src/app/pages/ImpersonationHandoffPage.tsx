import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../stores/auth.store';
import { READY_TYPE, isValidHandoffMessage } from '../lib/impersonation';

/**
 * Runs in the tab opened by the admin. Announces readiness to window.opener,
 * waits for the { accessToken, user } handoff, writes it to this tab's
 * (sessionStorage-backed) auth store, then redirects into the student portal.
 */
export default function ImpersonationHandoffPage() {
  const navigate = useNavigate();
  const startImpersonation = useAuthStore((s) => s.startImpersonation);
  const [status, setStatus] = useState<'waiting' | 'error'>('waiting');

  useEffect(() => {
    const opener = window.opener as Window | null;
    if (!opener) {
      setStatus('error');
      return;
    }
    const origin = window.location.origin;

    const onMessage = (e: MessageEvent) => {
      if (!isValidHandoffMessage(e, origin, opener)) return;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      const { accessToken, user } = e.data as { accessToken: string; user: Parameters<typeof startImpersonation>[1] };
      startImpersonation(accessToken, user);
      navigate('/student', { replace: true });
    };

    window.addEventListener('message', onMessage);
    opener.postMessage({ type: READY_TYPE }, origin);
    const timer = setTimeout(() => setStatus('error'), 10_000);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, [navigate, startImpersonation]);

  return (
    <div className="grid h-screen place-items-center text-on-surface-variant">
      {status === 'waiting' ? (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          Đang mở phiên học sinh…
        </span>
      ) : (
        <div className="text-center">
          <p>Không nhận được phiên mạo danh.</p>
          <button type="button" className="mt-2 underline" onClick={() => window.close()}>
            Đóng tab
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

import { studentsApi } from '../api/students.api';
import { HANDOFF_TYPE, READY_TYPE, isReadyMessage } from '../lib/impersonation';

/**
 * Drives the admin→student handoff:
 *  1. Open /impersonate in a new tab *synchronously* (so the browser does not
 *     block the popup — it must happen inside the click handler, before await).
 *  2. Request an impersonation token from the API (admin's own session).
 *  3. Wait for the new tab to announce it is ready (READY_TYPE).
 *  4. postMessage the { accessToken, user } to it (HANDOFF_TYPE).
 * The token is never placed on the URL.
 */
export function useImpersonateStudent() {
  const [isPending, setIsPending] = useState(false);

  async function start(profileId: string): Promise<{ ok: boolean; error?: 'popup' | 'failed' }> {
    const origin = window.location.origin;
    const child = window.open('/impersonate', '_blank');
    if (!child) return { ok: false, error: 'popup' };

    let onReady: (e: MessageEvent) => void = () => undefined;
    const childReady = new Promise<void>((resolve) => {
      onReady = (e: MessageEvent) => {
        if (!isReadyMessage(e, origin, child)) return;
        window.removeEventListener('message', onReady);
        resolve();
      };
      window.addEventListener('message', onReady);
    });

    setIsPending(true);
    try {
      const { accessToken, user } = await studentsApi.impersonate(profileId);
      await childReady;
      child.postMessage({ type: HANDOFF_TYPE, accessToken, user }, origin);
      return { ok: true };
    } catch {
      window.removeEventListener('message', onReady);
      child.close();
      return { ok: false, error: 'failed' };
    } finally {
      setIsPending(false);
    }
  }

  return { start, isPending };
}

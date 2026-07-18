import { useState } from 'react';

import { studentsApi } from '../api/students.api';
import { HANDOFF_TYPE, isReadyMessage } from '../lib/impersonation';

/**
 * Drives the admin→student handoff:
 *  1. Open /impersonate in a new tab *synchronously* (so the browser does not
 *     block the popup — it must happen inside the click handler, before await).
 *  2. Request an impersonation token from the API (admin's own session).
 *  3. Wait for the new tab to announce it is ready.
 *  4. postMessage the { accessToken, user } to it (HANDOFF_TYPE).
 * The token is never placed on the URL. If the tab never announces readiness
 * (crash, blocked, or the user closes it), we time out / detect the close so
 * isPending is always released and the message listener never leaks.
 */
export function useImpersonateStudent() {
  const [isPending, setIsPending] = useState(false);

  async function start(profileId: string): Promise<{ ok: boolean; error?: 'popup' | 'failed' }> {
    const origin = window.location.origin;
    const child = window.open('/impersonate', '_blank');
    if (!child) return { ok: false, error: 'popup' };

    let onReady: (e: MessageEvent) => void = () => undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;

    const childReady = new Promise<void>((resolve, reject) => {
      onReady = (e: MessageEvent) => {
        if (!isReadyMessage(e, origin, child)) return;
        resolve();
      };
      window.addEventListener('message', onReady);
      // Give up if the tab never announces readiness (crashed, blocked, or closed).
      timer = setTimeout(() => reject(new Error('impersonation handoff timed out')), 15000);
      poll = setInterval(() => {
        if (child.closed) reject(new Error('impersonation tab closed'));
      }, 500);
    });

    const cleanup = () => {
      window.removeEventListener('message', onReady);
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
    };

    setIsPending(true);
    try {
      const { accessToken, user } = await studentsApi.impersonate(profileId);
      await childReady;
      cleanup();
      child.postMessage({ type: HANDOFF_TYPE, accessToken, user }, origin);
      return { ok: true };
    } catch {
      cleanup();
      child.close();
      return { ok: false, error: 'failed' };
    } finally {
      setIsPending(false);
    }
  }

  return { start, isPending };
}

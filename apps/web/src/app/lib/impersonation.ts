/**
 * Pure helpers for admin→student impersonation.
 *
 * The impersonation tab keeps its session in sessionStorage (per-tab) so it
 * never overwrites the admin's localStorage session. The access token is
 * handed from the admin tab to the /impersonate tab via postMessage — never
 * on the URL — so both ends validate origin, source, and message type.
 */

export const IMPERSONATION_FLAG = 'cp.impersonating';
export const READY_TYPE = 'cp-impersonation-ready';
export const HANDOFF_TYPE = 'cp-impersonation';

/** True if this browser tab is (or is becoming) an impersonation tab. */
export function isImpersonationTab(
  pathname: string,
  storage: Pick<Storage, 'getItem'>,
): boolean {
  return pathname.startsWith('/impersonate') || storage.getItem(IMPERSONATION_FLAG) === '1';
}

interface IncomingMessage {
  origin: string;
  source: unknown;
  data: unknown;
}

function messageType(data: unknown): string | undefined {
  return typeof data === 'object' && data !== null
    ? (data as { type?: string }).type
    : undefined;
}

/** The handoff tab announced it is mounted and listening. */
export function isReadyMessage(e: IncomingMessage, expectedOrigin: string, expectedSource: unknown): boolean {
  return e.origin === expectedOrigin && e.source === expectedSource && messageType(e.data) === READY_TYPE;
}

/** The opener delivered the impersonation session. */
export function isValidHandoffMessage(e: IncomingMessage, expectedOrigin: string, expectedSource: unknown): boolean {
  return e.origin === expectedOrigin && e.source === expectedSource && messageType(e.data) === HANDOFF_TYPE;
}

/** Tear down the impersonation session and close the tab. */
export function exitImpersonation(win: Window, authStoreKey: string): void {
  win.sessionStorage.removeItem(IMPERSONATION_FLAG);
  win.sessionStorage.removeItem(authStoreKey);
  win.close();
}

import { describe, expect, it, vi } from 'vitest';

import {
  IMPERSONATION_FLAG,
  READY_TYPE,
  HANDOFF_TYPE,
  isImpersonationTab,
  isReadyMessage,
  isValidHandoffMessage,
  exitImpersonation,
} from './impersonation';

const store = (v: Record<string, string> = {}) => ({ getItem: (k: string) => v[k] ?? null });

describe('isImpersonationTab', () => {
  it('is true on the /impersonate handoff route', () => {
    expect(isImpersonationTab('/impersonate', store())).toBe(true);
  });
  it('is true once the flag is set (e.g. after redirect to /student)', () => {
    expect(isImpersonationTab('/student', store({ [IMPERSONATION_FLAG]: '1' }))).toBe(true);
  });
  it('is false for a normal admin tab', () => {
    expect(isImpersonationTab('/admin/students', store())).toBe(false);
  });
});

describe('message validation', () => {
  const opener = {} as unknown;
  it('accepts a well-formed ready message from the expected source', () => {
    expect(isReadyMessage({ origin: 'https://a', source: opener, data: { type: READY_TYPE } }, 'https://a', opener)).toBe(true);
  });
  it('rejects a ready message from a wrong origin', () => {
    expect(isReadyMessage({ origin: 'https://evil', source: opener, data: { type: READY_TYPE } }, 'https://a', opener)).toBe(false);
  });
  it('accepts a well-formed handoff message', () => {
    expect(isValidHandoffMessage({ origin: 'https://a', source: opener, data: { type: HANDOFF_TYPE, accessToken: 't' } }, 'https://a', opener)).toBe(true);
  });
  it('rejects a handoff message from a wrong source', () => {
    expect(isValidHandoffMessage({ origin: 'https://a', source: {}, data: { type: HANDOFF_TYPE } }, 'https://a', opener)).toBe(false);
  });
  it('rejects a message with the wrong type', () => {
    expect(isValidHandoffMessage({ origin: 'https://a', source: opener, data: { type: 'nope' } }, 'https://a', opener)).toBe(false);
  });
  it('rejects a ready message from a wrong source', () => {
    expect(isReadyMessage({ origin: 'https://a', source: {}, data: { type: READY_TYPE } }, 'https://a', opener)).toBe(false);
  });
  it('rejects a ready message with the wrong type', () => {
    expect(isReadyMessage({ origin: 'https://a', source: opener, data: { type: 'nope' } }, 'https://a', opener)).toBe(false);
  });
  it('rejects a handoff message from a wrong origin', () => {
    expect(isValidHandoffMessage({ origin: 'https://evil', source: opener, data: { type: HANDOFF_TYPE } }, 'https://a', opener)).toBe(false);
  });
});

describe('exitImpersonation', () => {
  it('clears the flag and the auth store key, then closes the window', () => {
    const removed: string[] = [];
    const closeFn = vi.fn();
    const win = {
      sessionStorage: { removeItem: (k: string) => removed.push(k) },
      close: closeFn,
    } as unknown as Window;

    exitImpersonation(win, 'cp.auth');

    expect(removed).toContain(IMPERSONATION_FLAG);
    expect(removed).toContain('cp.auth');
    expect(closeFn).toHaveBeenCalled();
  });
});

/**
 * Cross-cutting constants shared between web and api.
 * Keep this file dependency-free — it must compile in both browser and Node.
 */
export const API_PREFIX = '/api';

export const API_PATHS = {
  authLogin: '/auth/login',
  authMe: '/auth/me',
  users: '/users',
} as const;

export const STORAGE_KEYS = {
  authStore: 'cp.auth',
} as const;

/** Pagination defaults — also configured in the @dataui/crud global config. */
export const PAGINATION = {
  defaultLimit: 25,
  maxLimit: 100,
} as const;

import axios from 'axios';

/**
 * Single shared axios instance. The Bearer-token interceptor is wired up
 * in <AuthProvider> on mount so the token always reflects the latest
 * value from the Zustand store (subscribed at request time).
 *
 * In dev, baseURL is `/api` and Vite proxies it to :3000 — keeps origin
 * matched and sidesteps CORS preflight for the Authorization header.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: false,
});

import { ReactNode, useEffect } from 'react';

import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../stores/auth.store';

/**
 * Mounts axios interceptors that:
 *  1. Attach `Authorization: Bearer <token>` to every outgoing request,
 *     reading the token freshly from the store at request time.
 *  2. Auto-clear the session on a 401 response (e.g. expired JWT).
 *
 * Interceptors are registered once (mount) and torn down on unmount,
 * so they don't stack across hot-reloads.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    const reqId = apiClient.interceptors.request.use((cfg) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    const resId = apiClient.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401) clear();
        return Promise.reject(err);
      },
    );

    return () => {
      apiClient.interceptors.request.eject(reqId);
      apiClient.interceptors.response.eject(resId);
    };
  }, [clear]);

  return <>{children}</>;
}

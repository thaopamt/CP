import axios from 'axios';
import { ReactNode, useEffect } from 'react';
import { LoginResponse } from '@cp/shared';

import { apiClient } from '../lib/api-client';
import { removeWorkspaceDrafts } from '../lib/learning-reset-storage';
import { useAuthStore } from '../stores/auth.store';

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const isBlockedResponse = (err: any) => (
  err?.response?.status === 403 &&
  err?.response?.data?.code === 'USER_BLOCKED'
);

function removeDraftsBeforeLogout() {
  try {
    removeWorkspaceDrafts(window.localStorage);
  } catch {
    // Storage cleanup must not prevent auth cleanup.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const clear = useAuthStore((s) => s.clear);
  const setTokens = useAuthStore((s) => s.setTokens);

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
      async (err) => {
        const originalRequest = err.config;

        if (isBlockedResponse(err)) {
          processQueue(err, null);
          removeDraftsBeforeLogout();
          clear();
          return Promise.reject(err);
        }

        if (err?.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
            clear();
            return Promise.reject(err);
          }

          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = 'Bearer ' + token;
                return apiClient(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) {
            isRefreshing = false;
            clear();
            return Promise.reject(err);
          }

          try {
            // Use plain axios to avoid triggering the interceptor loop
            const { data } = await axios.post<LoginResponse>(
              (apiClient.defaults.baseURL || '') + '/auth/refresh',
              { refreshToken }
            );

            setTokens(data.accessToken, data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            
            processQueue(null, data.accessToken);
            return apiClient(originalRequest);
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            if (isBlockedResponse(refreshErr)) {
              removeDraftsBeforeLogout();
            }
            clear();
            return Promise.reject(refreshErr);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(err);
      },
    );

    return () => {
      apiClient.interceptors.request.eject(reqId);
      apiClient.interceptors.response.eject(resId);
    };
  }, [clear, setTokens]);

  return <>{children}</>;
}

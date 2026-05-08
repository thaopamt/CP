import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginResponse, ROLE_HOME_PATH } from '@cp/shared';

import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth.store';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const location = useLocation();
  const fromPath = (location.state as LocationState | null)?.from;

  const { user, accessToken, setSession, isHydrated } = useAuthStore();
  const [email, setEmail] = useState('admin@cp.local');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in → straight to your portal
  if (isHydrated && accessToken && user) {
    return <Navigate to={fromPath ?? ROLE_HOME_PATH[user.role]} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
      setSession(data.accessToken, data.user);
      // Don't navigate manually — the early-return above will fire on next render
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-primary-container via-surface-tint to-secondary px-md">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-xl shadow-elev-3 flex flex-col gap-md"
      >
        <div>
          <h1 className="font-manrope text-headline-lg text-primary">Welcome back</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Sign in to continue to your portal.
          </p>
        </div>

        <label className="flex flex-col gap-xs">
          <span className="text-label-sm text-on-surface-variant">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </label>

        <label className="flex flex-col gap-xs">
          <span className="text-label-sm text-on-surface-variant">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </label>

        {error && (
          <div className="bg-error-container text-on-error-container text-label-sm rounded-md px-md py-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary text-on-primary px-lg py-sm rounded-lg hover:brightness-95 disabled:opacity-60 transition-all text-label-sm font-bold mt-sm"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-[12px] text-on-surface-variant text-center">
          Try: <code>admin@cp.local</code> / <code>teacher@cp.local</code> /{' '}
          <code>student@cp.local</code> · password <code>password123</code>
        </p>
      </form>
    </div>
  );
}

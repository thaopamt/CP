import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { LoginResponse, ROLE_HOME_PATH } from '@cp/shared';

import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth.store';

interface LocationState {
  from?: string;
}

const BLOCKED_NOTICE_KEY = 'cp_blocked_account_notice';

export default function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const fromPath = (location.state as LocationState | null)?.from;

  const { user, accessToken, setSession, isHydrated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    try {
      if (window.sessionStorage.getItem(BLOCKED_NOTICE_KEY) === '1') {
        window.sessionStorage.removeItem(BLOCKED_NOTICE_KEY);
        return t(
          'auth.blockedAccount',
          'Tài khoản này đã bị block. Vui lòng liên hệ quản trị viên.',
        );
      }
    } catch {
      return null;
    }
    return null;
  });

  if (isHydrated && accessToken && user) {
    return <Navigate to={fromPath ?? ROLE_HOME_PATH[user.role]} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
      setSession(data.accessToken, data.refreshToken, data.user);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('auth.invalidLogin');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-primary-container via-surface-tint to-secondary px-md">
      <div className="w-full max-w-md flex flex-col gap-md">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <form
          onSubmit={onSubmit}
          className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-xl shadow-elev-3 flex flex-col gap-md"
        >
          <div className="flex flex-col items-center gap-sm">
            <img src="/logo.png" alt="Zenith" className="w-16 h-16 object-contain" />
            <h1 className="font-manrope text-headline-lg text-primary">{t('auth.welcomeTitle')}</h1>
            <p className="text-body-md text-on-surface-variant">
              {t('auth.welcomeSubtitle')}
            </p>
          </div>

          <label className="flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant">{t('auth.emailLabel')} / Username</span>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant">{t('auth.passwordLabel')}</span>
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
            {submitting ? t('common.signingIn') : t('common.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}

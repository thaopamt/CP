import { useTranslation } from 'react-i18next';
import { fullName, IUser } from '@cp/shared';
import { useAuthStore } from '../stores/auth.store';

/**
 * Initials avatar shared by all three portal top bars.
 */
export function UserAvatar({ user, size = 'md' }: { user: IUser | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-[12px]' : 'w-10 h-10 text-label-sm';
  if (!user) return <div className={`${dim} rounded-full bg-surface-container-high`} />;
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  return (
    <div
      className={`${dim} rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold border border-outline-variant/40`}
      title={fullName(user)}
    >
      {initials || '·'}
    </div>
  );
}

export function LogoutButton() {
  const { t } = useTranslation();
  const clear = useAuthStore((s) => s.clear);
  return (
    <button
      type="button"
      onClick={() => {
        clear();
        window.location.assign('/login');
      }}
      className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors text-label-sm"
    >
      <span className="material-symbols-outlined text-[20px]">logout</span>
      {t('common.signOut')}
    </button>
  );
}

import { useThemeStore } from '../stores/theme.store';

export function ThemeToggle() {
  const { isDark, toggleDark } = useThemeStore();
  
  return (
    <button
      onClick={toggleDark}
      className="p-2 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}

import { useTranslation } from 'react-i18next';
import { fullName, IUser } from '@cp/shared';
import { useGlobalChatSocket } from '../hooks/useGlobalChatSocket';
import { useAuthStore } from '../stores/auth.store';
import { useGlobalChatStore } from '../stores/globalChat.store';
import { useUIStore } from '../stores/ui.store';

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
  const { isSidebarCollapsed } = useUIStore();
  
  return (
    <button
      type="button"
      onClick={() => {
        clear();
        window.location.assign('/login');
      }}
      className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-sm px-md'} py-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors text-label-sm overflow-hidden`}
      title={isSidebarCollapsed ? t('common.signOut') : undefined}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
      {!isSidebarCollapsed && <span className="truncate">{t('common.signOut')}</span>}
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

export function GlobalChatRealtimeBridge() {
  useGlobalChatSocket();
  return null;
}

export function GlobalChatUnreadBadge({ compact = false }: { compact?: boolean }) {
  const unreadCount = useGlobalChatStore((s) => s.unreadCount);
  if (unreadCount <= 0) return null;

  const label = unreadCount > 99 ? '99+' : String(unreadCount);
  return (
    <span
      className={
        compact
          ? 'absolute -right-1 -top-1 min-w-5 rounded-full bg-error px-1 text-center text-[10px] font-bold leading-5 text-on-error'
          : 'ml-auto min-w-6 rounded-full bg-error px-2 text-center text-[11px] font-bold leading-5 text-on-error'
      }
      aria-label={`${label} unread chat messages`}
    >
      {label}
    </span>
  );
}

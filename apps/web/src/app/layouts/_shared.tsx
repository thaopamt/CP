import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fullName, IUser } from '@cp/shared';
import { useGlobalChatSocket } from '../hooks/useGlobalChatSocket';
import { useAuthStore } from '../stores/auth.store';
import { useGlobalChatStore } from '../stores/globalChat.store';
import { useUIStore } from '../stores/ui.store';
import { ICharacterEquip } from '@cp/shared';
import { AvatarFrame } from '../lib/cosmetics';
import { CharacterAvatar, hasCharacter } from '../lib/character';

/**
 * Initials avatar shared by all three portal top bars. Optional gem-shop
 * cosmetics: `frame` draws a colored ring, `nameColor` tints the initials.
 */
export function UserAvatar({
  user,
  size = 'md',
  frame,
  nameColor,
  character,
}: {
  user: IUser | null;
  size?: 'sm' | 'md';
  frame?: string | null;
  nameColor?: string | null;
  character?: ICharacterEquip | null;
}) {
  const dim = size === 'sm' ? 'w-8 h-8 text-[12px]' : 'w-10 h-10 text-label-sm';
  const px = size === 'sm' ? 32 : 40;
  if (!user) return <div className={`${dim} rounded-full bg-surface-container-high`} />;
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  return (
    <AvatarFrame frameKey={frame}>
      {hasCharacter(character) ? (
        <CharacterAvatar character={character} size={px} />
      ) : (
        <div
          className={`${dim} rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold border border-outline-variant/40`}
          title={fullName(user)}
          style={nameColor ? { color: nameColor } : undefined}
        >
          {initials || '·'}
        </div>
      )}
    </AvatarFrame>
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

/**
 * Avatar button in the top bar that opens a dropdown with the user's identity,
 * a link to their profile page, theme + language switches, and sign out.
 * Closes on outside click or Escape.
 */
export function UserMenu({
  user,
  frame,
  nameColor,
  title,
  character,
  profilePath = '/student/me',
}: {
  user: IUser | null;
  frame?: string | null;
  nameColor?: string | null;
  title?: string | null;
  character?: ICharacterEquip | null;
  profilePath?: string;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const { isDark, toggleDark } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemCls =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-label-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:opacity-90"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.student.me')}
      >
        <UserAvatar user={user} size="sm" frame={frame} nameColor={nameColor} character={character} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-outline-variant bg-surface-container-low p-2 shadow-elev-3 z-50"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 px-2 py-2">
            <UserAvatar user={user} size="md" frame={frame} nameColor={nameColor} character={character} />
            <div className="min-w-0">
              <p
                className="text-label-sm font-bold text-on-surface truncate"
                style={nameColor ? { color: nameColor } : undefined}
              >
                {user ? fullName(user) : '—'}
              </p>
              {title && (
                <p className="text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-300 truncate">{title}</p>
              )}
              <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
            </div>
          </div>

          <div className="my-1 h-px bg-outline-variant" />

          <button
            type="button"
            role="menuitem"
            className={itemCls}
            onClick={() => {
              setOpen(false);
              navigate(profilePath);
            }}
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span className="truncate">{t('nav.student.me')}</span>
          </button>

          <button type="button" role="menuitem" className={itemCls} onClick={toggleDark}>
            <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
            <span className="truncate">
              {isDark
                ? i18n.language === 'vi'
                  ? 'Giao diện sáng'
                  : 'Light mode'
                : i18n.language === 'vi'
                  ? 'Giao diện tối'
                  : 'Dark mode'}
            </span>
          </button>

          {/* Language toggle */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">language</span>
            <div className="flex gap-1">
              {(['vi', 'en'] as const).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => void i18n.changeLanguage(lng)}
                  className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                    i18n.language === lng
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-outline-variant" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-label-sm text-error hover:bg-error/10 transition-colors"
            onClick={() => {
              clear();
              window.location.assign('/login');
            }}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="truncate">{t('common.signOut')}</span>
          </button>
        </div>
      )}
    </div>
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

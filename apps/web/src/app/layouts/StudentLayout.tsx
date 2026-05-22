import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { useStudentLivePresence } from '../hooks/useStudentLivePresence';
import { GlobalChatRealtimeBridge, GlobalChatUnreadBadge, LogoutButton, UserAvatar, ThemeToggle } from './_shared';

const NAV: { to: string; icon: string; key: string; end?: boolean }[] = [
  { to: '/student', icon: 'home', key: 'nav.student.home', end: true },
  { to: '/student/classes', icon: 'school', key: 'nav.student.classes' },
  { to: '/student/assignments', icon: 'assignment', key: 'nav.student.assignments' },
  { to: '/student/quests', icon: 'rocket_launch', key: 'nav.student.quests' },
  { to: '/student/chat', icon: 'forum', key: 'nav.student.globalChat' },
  { to: '/student/me', icon: 'person', key: 'nav.student.me' },
];

/**
 * Student Portal — vibrant/playful, relaxed density.
 * 240px sidebar on desktop; mobile uses bottom-anchored island nav with
 * glassmorphism effect.
 *
 * Structural parity with Admin/Teacher:
 *   - sidebar (full height) = brand block + nav + LogoutButton
 *   - top bar (right of sidebar on desktop, full-width on mobile)
 *     = optional search · notifications · LanguageSwitcher · avatar
 */
export default function StudentLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  useStudentLivePresence(location.pathname);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">
      <GlobalChatRealtimeBridge />
      {/* Sidebar — full height on desktop */}
      <nav className="hidden md:flex flex-col w-[240px] lg:w-[280px] fixed top-0 bottom-0 left-0 p-md gap-sm bg-surface-container-lowest border-r border-outline-variant z-50">
        {/* Brand block — parity with Admin/Teacher */}
        <div className="flex items-center gap-md px-sm py-lg">
          <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary grid place-items-center font-manrope font-extrabold">
            EN
          </div>
          <div>
            <h1 className="text-label-sm font-extrabold text-primary leading-tight">
              {t('brand.studentPortal')}
            </h1>
            <p className="text-[12px] text-on-surface-variant opacity-80">
              {t('brand.portalSubtitleStudent')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-xs flex-1 mt-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-md px-md py-sm rounded-2xl transition-all text-label-sm',
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                ].join(' ')
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="truncate">{t(item.key)}</span>
              {item.to.endsWith('/chat') && <GlobalChatUnreadBadge />}
            </NavLink>
          ))}
        </div>

        <LogoutButton />
      </nav>

      {/* Mobile top bar — full width */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-md z-40">
        <h1 className="font-manrope font-extrabold text-headline-md text-primary">
          {t('brand.studentPortal')}
        </h1>
        <div className="flex items-center gap-sm">
          <button className="p-2 rounded-full hover:bg-surface-container-high" aria-label={t('topBar.notifications')}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <ThemeToggle />
          <LanguageSwitcher />
          <UserAvatar user={user} size="sm" />
        </div>
      </header>

      {/* Desktop top bar — sticky to the right of the sidebar */}
      <header className="hidden md:flex md:ml-[240px] lg:ml-[280px] sticky top-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant items-center justify-between gap-sm px-lg z-40">
        <div className="flex relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder={t('topBar.searchQuest')}
            className="pl-10 pr-4 py-2 bg-surface-container-highest rounded-full text-label-sm focus:ring-2 focus:ring-primary w-[240px] outline-none border-none"
          />
        </div>
        <div className="flex items-center gap-sm md:gap-md">
          <button className="p-2 rounded-full hover:bg-surface-container-high" aria-label={t('topBar.notifications')}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <ThemeToggle />
          <LanguageSwitcher />
          <UserAvatar user={user} size="sm" />
        </div>
      </header>

      <main className="pt-16 md:pt-0 md:ml-[240px] lg:ml-[280px] px-md md:px-lg lg:px-xl pb-24 md:pb-lg">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-md left-1/2 -translate-x-1/2 z-50 flex items-center gap-xs bg-surface-container-low/90 backdrop-blur-md rounded-full border border-outline-variant px-sm py-sm shadow-elev-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={t(item.key)}
            className={({ isActive }) =>
              [
                'min-h-[48px] min-w-[48px] grid place-items-center rounded-full transition-all',
                isActive
                  ? 'bg-tertiary-container text-on-tertiary-container scale-110'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
              ].join(' ')
            }
          >
            <span className="relative">
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.to.endsWith('/chat') && <GlobalChatUnreadBadge compact />}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

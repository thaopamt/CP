import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { useUIStore } from '../stores/ui.store';
import { useStudentLivePresence } from '../hooks/useStudentLivePresence';
import { GlobalChatRealtimeBridge, GlobalChatUnreadBadge, LogoutButton, UserAvatar, ThemeToggle } from './_shared';

const NAV: { to: string; icon: string; key: string; end?: boolean }[] = [
  { to: '/student', icon: 'home', key: 'nav.student.home', end: true },
  { to: '/student/classes', icon: 'school', key: 'nav.student.classes' },
  { to: '/student/assignments', icon: 'assignment', key: 'nav.student.assignments' },
  { to: '/student/maze', icon: 'extension', key: 'nav.student.maze' },
  { to: '/student/submissions', icon: 'history', key: 'nav.student.submissions' },
  { to: '/student/quests', icon: 'rocket_launch', key: 'nav.student.quests' },
  { to: '/student/chat', icon: 'forum', key: 'nav.student.globalChat' },
  { to: '/student/me', icon: 'person', key: 'nav.student.me' },
];

/** Only show 5 most important items in the mobile floating nav to prevent overflow */
const MOBILE_NAV = [
  NAV[0], // home
  NAV[1], // classes
  NAV[2], // assignments
  NAV[5], // quests
  NAV[7], // me
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
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  const sidebarWidth = isSidebarCollapsed ? 'w-[80px]' : 'w-[240px] lg:w-[280px]';
  const marginLeft = isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[240px] lg:ml-[280px]';

  useStudentLivePresence(location.pathname);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">
      <GlobalChatRealtimeBridge />
      {/* Sidebar — full height on desktop */}
      <nav className={`hidden md:flex flex-col ${sidebarWidth} fixed top-0 bottom-0 left-0 p-md gap-sm bg-surface-container-lowest border-r border-outline-variant z-50 transition-all duration-300`}>
        {/* Collapse toggle button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-surface-container-high border border-outline-variant rounded-full grid place-items-center text-on-surface-variant hover:text-primary hover:bg-surface-container-highest z-50 transition-colors shadow-sm"
          aria-label="Toggle Sidebar"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        {/* Brand block — parity with Admin/Teacher */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-md px-sm'} py-lg relative`}>
          <img src="/logo.png" alt="Zenith" className="w-10 h-10 rounded-2xl object-contain shrink-0" />
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-label-sm font-extrabold text-primary leading-tight truncate">
                {t('brand.studentPortal')}
              </h1>
              <p className="text-[12px] text-on-surface-variant opacity-80 truncate">
                {t('brand.portalSubtitleStudent')}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-xs flex-1 mt-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isSidebarCollapsed ? t(item.key) : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center py-sm rounded-2xl transition-all text-label-sm overflow-hidden',
                  isSidebarCollapsed ? 'justify-center px-0' : 'gap-md px-md',
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                ].join(' ')
              }
            >
              <span className="relative flex items-center justify-center">
                <span className="material-symbols-outlined shrink-0">{item.icon}</span>
                {item.to.endsWith('/chat') && isSidebarCollapsed && <GlobalChatUnreadBadge compact />}
              </span>
              {!isSidebarCollapsed && <span className="truncate">{t(item.key)}</span>}
              {!isSidebarCollapsed && item.to.endsWith('/chat') && <GlobalChatUnreadBadge />}
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
      <header className={`hidden md:flex ${marginLeft} sticky top-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant items-center justify-between gap-sm px-lg z-40 transition-all duration-300`}>
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

      <main className={`pt-16 md:pt-0 ${marginLeft} px-md md:px-lg lg:px-xl pb-24 md:pb-lg transition-all duration-300`}>
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-md left-1/2 -translate-x-1/2 z-50 flex items-center gap-xs bg-surface-container-low/90 backdrop-blur-md rounded-full border border-outline-variant px-sm py-sm shadow-elev-3 max-w-[calc(100vw-2rem)] overflow-x-auto">
        {MOBILE_NAV.map((item) => (
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

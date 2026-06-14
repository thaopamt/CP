import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { useUIStore } from '../stores/ui.store';
import { LogoutButton, UserAvatar, ThemeToggle } from './_shared';

// Mirrors the Admin sidebar minus the Dashboard, Users and
// Quest-analytics tabs. Finance has its own read-only teacher page.
const NAV: { to: string; icon: string; key: string; end?: boolean }[] = [
  { to: '/teacher/students', icon: 'groups', key: 'nav.teacher.students' },
  { to: '/teacher/classes', icon: 'class', key: 'nav.teacher.classes' },
  { to: '/teacher/courses', icon: 'menu_book', key: 'nav.teacher.courses' },
  { to: '/teacher/blog', icon: 'article', key: 'nav.teacher.blog' },
  { to: '/teacher/quests', icon: 'swords', key: 'nav.teacher.quests' },
  { to: '/teacher/badges', icon: 'workspace_premium', key: 'nav.teacher.badges' },
  { to: '/teacher/assignments', icon: 'assignment', key: 'nav.teacher.assignments' },
  { to: '/teacher/maze', icon: 'extension', key: 'nav.teacher.maze' },
  { to: '/teacher/schedule', icon: 'calendar_month', key: 'nav.teacher.schedule' },
  { to: '/teacher/finance', icon: 'account_balance', key: 'nav.teacher.finance' },
  { to: '/teacher/monitor', icon: 'screen_share', key: 'nav.teacher.monitor' },

  { to: '/teacher/submissions', icon: 'history', key: 'nav.teacher.submissions' },
  { to: '/teacher/me', icon: 'account_circle', key: 'nav.teacher.me' },
];

const MOBILE_NAV = NAV.slice(0, 4);

/**
 * Teacher Portal — warm/modern, standard density.
 * 280px sidebar on desktop; mobile uses top app bar + bottom-nav.
 *
 * Top-bar utility cluster (notifications · language · avatar) is
 * mirrored across all 3 portals; sign-out lives in the sidebar bottom.
 */
export default function TeacherLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  const sidebarWidth = isSidebarCollapsed ? 'w-[80px]' : 'w-[280px]';
  const marginLeft = isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[280px]';

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">

      <nav className={`hidden md:flex flex-col ${sidebarWidth} h-screen fixed top-0 left-0 p-md gap-sm bg-surface-container-low border-r border-outline-variant z-50 transition-all duration-300`}>
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

        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-md px-sm'} py-lg relative`}>
          <img src="/logo.png" alt="Zenith" className="w-10 h-10 rounded-lg object-contain shrink-0" />
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-label-sm font-extrabold text-primary leading-tight truncate">
                {t('brand.teacherPortal')}
              </h1>
              <p className="text-[12px] text-on-surface-variant opacity-80 truncate">
                {t('brand.portalSubtitleTeacher')}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-xs mt-sm flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isSidebarCollapsed ? t(item.key) : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center py-sm rounded-lg transition-all text-label-sm overflow-hidden',
                  isSidebarCollapsed ? 'justify-center px-0' : 'gap-md px-md',
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                ].join(' ')
              }
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              {!isSidebarCollapsed && <span className="truncate">{t(item.key)}</span>}
            </NavLink>
          ))}
        </div>
        <LogoutButton />
      </nav>

      {/* Mobile top bar — same utility cluster as Admin/Student top bars */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-md z-40">
        <h1 className="font-manrope font-extrabold text-headline-md text-primary">
          {t('brand.teacherPortal')}
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

      {/* Desktop top bar — utility cluster only (sidebar already shows portal identity) */}
      <header className={`hidden md:flex ${marginLeft} sticky top-0 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant items-center justify-end gap-sm px-lg z-40 transition-all duration-300`}>
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high relative" aria-label={t('topBar.notifications')}>
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>
        <ThemeToggle />
        <LanguageSwitcher />
        <UserAvatar user={user} size="sm" />
      </header>

      <div className={`${marginLeft} pt-16 md:pt-0 pb-24 md:pb-0 transition-all duration-300`}>
        <main className="px-md md:px-lg lg:px-xl py-lg">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 h-20 bg-surface-container-low border-t border-outline-variant rounded-t-xl backdrop-blur-md flex items-center justify-around z-50 pb-safe">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-xs text-[12px]',
                isActive ? 'text-primary' : 'text-on-surface-variant',
              ].join(' ')
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {t(item.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

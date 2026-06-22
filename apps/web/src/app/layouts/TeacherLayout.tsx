import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { UserMenu, ThemeToggle } from './_shared';
import { SidebarNav, type SidebarNavEntry, type SidebarNavItem } from './SidebarNav';

// Mirrors the Admin sidebar minus the Dashboard, Users and
// Quest-analytics tabs. Finance has its own read-only teacher page.
const MOBILE_NAV: SidebarNavItem[] = [
  { to: '/teacher/students', icon: 'groups', key: 'nav.teacher.students' },
  { to: '/teacher/classes', icon: 'class', key: 'nav.teacher.classes' },
  { to: '/teacher/courses', icon: 'menu_book', key: 'nav.teacher.courses' },
  { to: '/teacher/blog', icon: 'article', key: 'nav.teacher.blog' },
];

const NAV: SidebarNavEntry[] = [
  {
    icon: 'school',
    key: 'nav.groups.classroom',
    items: [
      MOBILE_NAV[0],
      MOBILE_NAV[1],
      MOBILE_NAV[2],
      { to: '/teacher/schedule', icon: 'calendar_month', key: 'nav.teacher.schedule' },
    ],
  },
  {
    icon: 'assignment',
    key: 'nav.groups.coursework',
    items: [
      { to: '/teacher/assignments', icon: 'assignment', key: 'nav.teacher.assignments' },
      { to: '/teacher/exams', icon: 'emoji_events', key: 'nav.teacher.exams' },
      { to: '/teacher/submissions', icon: 'history', key: 'nav.teacher.submissions' },
      { to: '/teacher/maze', icon: 'extension', key: 'nav.teacher.maze' },
    ],
  },
  {
    icon: 'social_leaderboard',
    key: 'nav.groups.gamification',
    items: [
      MOBILE_NAV[3],
      { to: '/teacher/quests', icon: 'swords', key: 'nav.teacher.quests' },
      { to: '/teacher/badges', icon: 'workspace_premium', key: 'nav.teacher.badges' },
    ],
  },
  {
    icon: 'admin_panel_settings',
    key: 'nav.groups.operations',
    items: [
      { to: '/teacher/finance', icon: 'account_balance', key: 'nav.teacher.finance' },
      { to: '/teacher/monitor', icon: 'screen_share', key: 'nav.teacher.monitor' },
      { to: '/teacher/me', icon: 'account_circle', key: 'nav.teacher.me' },
    ],
  },
];

/**
 * Teacher Portal — warm/modern, standard density.
 * 280px sidebar on desktop; mobile uses top app bar + bottom-nav.
 *
 * Top-bar utility cluster (notifications · language · avatar) is
 * mirrored across all 3 portals; sign-out lives in the avatar menu.
 */
export default function TeacherLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const marginLeft = 'md:ml-[200px]';

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">

      <nav className="hidden md:flex flex-col w-[200px] h-screen fixed top-0 left-0 p-sm gap-xs bg-surface-container-low border-r border-outline-variant z-50 transition-all duration-300">
        <div className="flex flex-col items-center gap-xs px-xs py-md text-center relative">
          <img src="/logo.png" alt="Zenith" className="w-9 h-9 rounded-lg object-contain shrink-0" />
          <h1 className="text-[11px] font-extrabold text-primary leading-tight truncate max-w-full">
            {t('brand.teacherPortal')}
          </h1>
        </div>

        <SidebarNav
          entries={NAV}
          compact
          className="flex flex-col gap-xs mt-xs flex-1 overflow-y-auto"
        />
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
          <UserMenu user={user} profilePath="/teacher/me" profileLabelKey="nav.teacher.me" showPreferences={false} />
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
        <UserMenu user={user} profilePath="/teacher/me" profileLabelKey="nav.teacher.me" showPreferences={false} />
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

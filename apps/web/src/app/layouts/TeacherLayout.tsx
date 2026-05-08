import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { LogoutButton, UserAvatar } from './_shared';

const NAV: { to: string; icon: string; key: string; end?: boolean }[] = [
  { to: '/teacher', icon: 'dashboard', key: 'nav.teacher.dashboard', end: true },
  { to: '/teacher/attendance', icon: 'how_to_reg', key: 'nav.teacher.attendance' },
  { to: '/teacher/monitoring', icon: 'visibility', key: 'nav.teacher.liveClassroom' },
  { to: '/teacher/challenges', icon: 'code', key: 'nav.teacher.challenges' },
  { to: '/teacher/classes', icon: 'school', key: 'nav.teacher.myClasses' },
  { to: '/teacher/gradebook', icon: 'grading', key: 'nav.teacher.gradebook' },
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

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">
      <nav className="hidden md:flex flex-col w-[280px] h-screen fixed top-0 left-0 p-md gap-sm bg-surface-container-low border-r border-outline-variant z-50">
        <div className="flex items-center gap-md px-sm py-lg">
          <div className="w-10 h-10 rounded-lg bg-primary text-on-primary grid place-items-center font-manrope font-extrabold">
            EN
          </div>
          <div>
            <h1 className="text-label-sm font-extrabold text-primary leading-tight">
              {t('brand.teacherPortal')}
            </h1>
            <p className="text-[12px] text-on-surface-variant opacity-80">
              {t('brand.portalSubtitleTeacher')}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-xs mt-sm flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-md px-md py-sm rounded-lg transition-all text-label-sm',
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                ].join(' ')
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {t(item.key)}
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
          <LanguageSwitcher />
          <UserAvatar user={user} size="sm" />
        </div>
      </header>

      {/* Desktop top bar — utility cluster only (sidebar already shows portal identity) */}
      <header className="hidden md:flex md:ml-[280px] sticky top-0 h-16 bg-surface/90 backdrop-blur-md border-b border-outline-variant items-center justify-end gap-sm px-lg z-40">
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high relative" aria-label={t('topBar.notifications')}>
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>
        <LanguageSwitcher />
        <UserAvatar user={user} size="sm" />
      </header>

      <div className="md:ml-[280px] pt-16 md:pt-0 pb-24 md:pb-0">
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

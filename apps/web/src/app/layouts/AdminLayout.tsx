import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { LogoutButton, UserAvatar, ThemeToggle } from './_shared';
import GlobalChatWidget from '../components/GlobalChatWidget';

const NAV: { to: string; icon: string; key: string; end?: boolean }[] = [
  { to: '/admin', icon: 'dashboard', key: 'nav.admin.dashboard', end: true },
  { to: '/admin/students', icon: 'groups', key: 'nav.admin.students' },
  { to: '/admin/classes', icon: 'class', key: 'nav.admin.classes' },
  { to: '/admin/courses', icon: 'menu_book', key: 'nav.admin.courses' },
  { to: '/admin/quests', icon: 'swords', key: 'nav.admin.quests' },
  { to: '/admin/assignments', icon: 'assignment', key: 'nav.admin.assignments' },
  { to: '/admin/schedule', icon: 'calendar_month', key: 'nav.admin.schedule' },
  { to: '/admin/finance', icon: 'payments', key: 'nav.admin.finance' },
  { to: '/admin/users', icon: 'group', key: 'nav.admin.users' },
  { to: '/admin/monitor', icon: 'screen_share', key: 'nav.admin.monitor' },
  { to: '/admin/settings', icon: 'settings', key: 'nav.admin.settings' },
];

/**
 * Admin Portal layout — minimalist/corporate.
 * 280px fixed sidebar + thin top app bar, compact density.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const current =
    NAV.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  const currentLabel = current ? t(current.key) : t('nav.admin.dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface font-inter">
      <nav className="hidden lg:flex flex-col w-[280px] h-screen p-md gap-sm bg-surface-container-low border-r border-outline-variant shrink-0 z-20">
        <div className="flex items-center gap-md px-sm py-lg">
          <div className="w-10 h-10 rounded-lg bg-primary text-on-primary grid place-items-center font-manrope font-extrabold">
            EN
          </div>
          <div>
            <h1 className="text-label-sm font-extrabold text-primary leading-tight">
              {t('brand.adminPortal')}
            </h1>
            <p className="text-[12px] text-on-surface-variant opacity-80">
              {t('brand.portalSubtitleAdmin')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-xs mt-sm flex-1 overflow-y-auto">
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
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:translate-x-1 duration-200',
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

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex justify-between items-center px-md md:px-lg h-16 bg-surface border-b border-outline-variant shrink-0 z-30">
          <div className="flex items-center gap-md">
            <button
              className="lg:hidden p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label={t('common.more')}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden sm:flex items-center gap-sm text-label-sm text-on-surface-variant">
              <span>{t('topBar.breadcrumbAdmin')}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-on-surface font-semibold">{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-sm md:gap-md">
            <div className="hidden md:flex relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder={t('topBar.searchPortal')}
                className="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-full text-label-sm focus:ring-2 focus:ring-primary w-[240px] lg:w-[320px] outline-none"
              />
            </div>
            <button
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high relative"
              aria-label={t('topBar.notifications')}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            <UserAvatar user={user} size="sm" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-md md:p-lg lg:p-xl bg-background">
          <Outlet />
        </main>
      </div>
      <GlobalChatWidget />
    </div>
  );
}

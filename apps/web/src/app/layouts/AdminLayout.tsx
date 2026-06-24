import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { LanguageSwitcher } from '@cp/ui';
import { useAuthStore } from '../stores/auth.store';
import { UserMenu, ThemeToggle } from './_shared';
import { SidebarNav, getActiveNavItem, flattenNavEntries, type SidebarNavEntry } from './SidebarNav';

const NAV: SidebarNavEntry[] = [
  { to: '/admin', icon: 'dashboard', key: 'nav.admin.dashboard', end: true },
  {
    icon: 'school',
    key: 'nav.groups.learningManagement',
    items: [
      { to: '/admin/students', icon: 'groups', key: 'nav.admin.students' },
      { to: '/admin/classes', icon: 'class', key: 'nav.admin.classes' },
      { to: '/admin/courses', icon: 'menu_book', key: 'nav.admin.courses' },
      { to: '/admin/schedule', icon: 'calendar_month', key: 'nav.admin.schedule' },
    ],
  },
  {
    icon: 'assignment',
    key: 'nav.groups.coursework',
    items: [
      { to: '/admin/assignments', icon: 'assignment', key: 'nav.admin.assignments' },
      { to: '/admin/exams', icon: 'emoji_events', key: 'nav.admin.exams' },
      { to: '/admin/submissions', icon: 'history', key: 'nav.admin.submissions' },
      { to: '/admin/maze', icon: 'extension', key: 'nav.admin.maze' },
      { to: '/admin/blog', icon: 'article', key: 'nav.admin.blog' },
    ],
  },
  {
    icon: 'social_leaderboard',
    key: 'nav.groups.gamification',
    items: [
      { to: '/admin/quests', icon: 'swords', key: 'nav.admin.quests' },
      { to: '/admin/quests/analytics', icon: 'insights', key: 'nav.admin.questAnalytics' },
    ],
  },
  {
    icon: 'admin_panel_settings',
    key: 'nav.groups.operations',
    items: [
      { to: '/admin/finance', icon: 'payments', key: 'nav.admin.finance' },
      { to: '/admin/users', icon: 'group', key: 'nav.admin.users' },
      { to: '/admin/monitor', icon: 'screen_share', key: 'nav.admin.monitor' },
      { to: '/admin/me', icon: 'account_circle', key: 'nav.admin.me' },
    ],
  },
];
const NAV_ITEMS = flattenNavEntries(NAV);

/**
 * Admin Portal layout — minimalist/corporate.
 * 280px fixed sidebar + thin top app bar, compact density.
 * Mobile: hamburger menu opens a drawer overlay.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTo = useMemo(() => {
    const activeItem = getActiveNavItem(NAV, pathname);
    if (activeItem) return activeItem.to;
    if (pathname.startsWith('/admin/settings')) return '/admin/me';
    return null;
  }, [pathname]);
  const current = NAV_ITEMS.find((item) => item.to === activeTo);
  const currentLabel = current ? t(current.key) : t('nav.admin.dashboard');

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface font-inter">


      {/* ── Mobile Drawer Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <nav
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-[280px] max-w-[80vw] flex flex-col p-md gap-sm bg-surface-container-low border-r border-outline-variant z-[70] transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between py-lg px-sm">
          <div className="flex items-center gap-md">
            <img src="/logo.png" alt="Zenith" className="w-10 h-10 rounded-lg object-contain shrink-0" />
            <div className="overflow-hidden">
              <h1 className="text-label-sm font-extrabold text-primary leading-tight truncate">
                {t('brand.adminPortal')}
              </h1>
              <p className="text-[12px] text-on-surface-variant opacity-80 truncate">
                {t('brand.portalSubtitleAdmin')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label={t('common.close')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <SidebarNav
          entries={NAV}
          activeTo={activeTo}
          className="flex flex-col gap-xs mt-sm flex-1 overflow-y-auto"
        />
      </nav>

      {/* ── Desktop Sidebar ── */}
      <nav className="hidden lg:flex flex-col w-[200px] h-screen p-sm gap-xs bg-surface-container-low border-r border-outline-variant shrink-0 z-50 transition-all duration-300 relative">
        <div className="flex flex-col items-center gap-xs px-xs py-md text-center relative">
          <img src="/logo.png" alt="Zenith" className="w-9 h-9 rounded-lg object-contain shrink-0" />
          <h1 className="text-[11px] font-extrabold text-primary leading-tight truncate max-w-full">
            {t('brand.adminPortal')}
          </h1>
        </div>

        <SidebarNav
          entries={NAV}
          activeTo={activeTo}
          compact
          className="flex flex-col gap-xs mt-xs flex-1 overflow-y-auto"
          inactiveClassName="text-on-surface-variant hover:bg-surface-container-highest"
        />
      </nav>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex justify-between items-center px-md md:px-lg h-16 bg-surface border-b border-outline-variant shrink-0 z-30">
          <div className="flex items-center gap-md">
            <button
              className="lg:hidden p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors min-w-[44px] min-h-[44px] grid place-items-center"
              aria-label={t('common.more')}
              onClick={() => setMobileMenuOpen(true)}
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
                className="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-full text-label-sm focus:ring-2 focus:ring-primary w-[200px] lg:w-[320px] outline-none"
              />
            </div>
            <button
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high relative min-w-[40px] min-h-[40px] grid place-items-center"
              aria-label={t('topBar.notifications')}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            <UserMenu user={user} profilePath="/admin/me" profileLabelKey="nav.admin.me" shopPath="/admin/shop" shopLabelKey="nav.admin.shop" badgesPath="/admin/badges" badgesLabelKey="nav.admin.badges" showPreferences={false} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-md md:p-lg lg:p-xl bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

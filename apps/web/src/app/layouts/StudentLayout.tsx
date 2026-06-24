import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';
import { useStudentLivePresence } from '../hooks/useStudentLivePresence';
import { useStudentDashboard } from '../api/student.queries';
import { useUnreadBlogCount } from '../api/blog.queries';
import { GamificationCelebration } from '../components/GamificationCelebration';
import { UserMenu } from './_shared';
import { SidebarNav, type SidebarNavEntry, type SidebarNavItem } from './SidebarNav';

const STUDENT_HOME: SidebarNavItem = { to: '/student', icon: 'home', key: 'nav.student.home', end: true };
const STUDENT_CLASSES: SidebarNavItem = { to: '/student/classes', icon: 'school', key: 'nav.student.classes' };
const STUDENT_ASSIGNMENTS: SidebarNavItem = {
  to: '/student/assignments',
  icon: 'assignment',
  key: 'nav.student.assignments',
};
const STUDENT_BLOG: SidebarNavItem = { to: '/student/blog', icon: 'article', key: 'nav.student.blog' };
const STUDENT_QUESTS: SidebarNavItem = {
  to: '/student/quests',
  icon: 'rocket_launch',
  key: 'nav.student.quests',
};
const STUDENT_LEADERBOARD: SidebarNavItem = {
  to: '/student/leaderboard',
  icon: 'leaderboard',
  key: 'nav.student.leaderboard',
};
const STUDENT_BADGES: SidebarNavItem = {
  to: '/student/badges',
  icon: 'workspace_premium',
  key: 'nav.student.badges',
};

const NAV: SidebarNavEntry[] = [
  STUDENT_HOME,
  STUDENT_QUESTS,
  STUDENT_LEADERBOARD,
  {
    icon: 'school',
    key: 'nav.groups.learning',
    items: [
      STUDENT_CLASSES,
      STUDENT_ASSIGNMENTS,
      { to: '/student/exams', icon: 'emoji_events', key: 'nav.student.exams' },
      { to: '/student/submissions', icon: 'history', key: 'nav.student.submissions' },
      STUDENT_BLOG,
    ],
  },
  {
    icon: 'social_leaderboard',
    key: 'nav.groups.challenges',
    items: [
      { to: '/student/maze', icon: 'extension', key: 'nav.student.maze' },
    ],
  },
];

/** Only show 5 most important items in the mobile floating nav to prevent overflow.
 *  Profile ("Me") now lives in the avatar dropdown in the top bar. */
const MOBILE_NAV = [
  STUDENT_HOME,
  STUDENT_ASSIGNMENTS,
  STUDENT_BLOG,
  STUDENT_QUESTS,
  STUDENT_LEADERBOARD,
];

/**
 * Student Portal — vibrant/playful, relaxed density.
 * 240px sidebar on desktop; mobile uses bottom-anchored island nav with
 * glassmorphism effect.
 *
 * Structural parity with Admin/Teacher:
 *   - sidebar (full height) = brand block + nav
 *   - top bar (right of sidebar on desktop, full-width on mobile)
 *     = optional search · notifications · LanguageSwitcher · avatar
 */
export default function StudentLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const { data: dashboard } = useStudentDashboard();
  const { data: unreadBlog } = useUnreadBlogCount();
  const blogUnread = unreadBlog?.count ?? 0;

  const isMazePlayRoute = matchPath('/student/maze/:id', location.pathname);

  const sidebarWidth = 'w-[200px]';
  const marginLeft = isMazePlayRoute ? 'md:ml-0' : 'md:ml-[200px]';

  useStudentLivePresence(location.pathname);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">

      <GamificationCelebration />
      {/* Sidebar — full height on desktop */}
      {!isMazePlayRoute && (
        <nav className={`hidden md:flex flex-col ${sidebarWidth} fixed top-0 bottom-0 left-0 p-sm gap-xs bg-surface-container-lowest border-r border-outline-variant z-50 transition-all duration-300`}>
          {/* Brand block — parity with Admin/Teacher */}
          <div className="flex flex-col items-center gap-xs px-xs py-md text-center relative">
            <img src="/logo.png" alt="Zenith" className="w-9 h-9 rounded-2xl object-contain shrink-0" />
            <h1 className="text-[11px] font-extrabold text-primary leading-tight truncate max-w-full">
              {t('brand.studentPortal')}
            </h1>
          </div>

          <SidebarNav
            entries={NAV}
            compact
            roundedClassName="rounded-2xl"
            className="flex flex-col gap-xs flex-1 mt-xs overflow-y-auto"
            renderBadge={(item, { collapsed }) => {
              if (item.to !== '/student/blog' || blogUnread <= 0) return null;

              return collapsed ? (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-error" />
              ) : (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-error text-white text-[11px] font-bold shrink-0">
                  {blogUnread > 99 ? '99+' : blogUnread}
                </span>
              );
            }}
          />
        </nav>
      )}

      {/* Mobile top bar — full width */}
      {!isMazePlayRoute && (
        <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-md z-40">
          <h1 className="font-manrope font-extrabold text-headline-md text-primary">
            {t('brand.studentPortal')}
          </h1>
          <div className="flex items-center gap-sm">
            <button className="p-2 rounded-full hover:bg-surface-container-high" aria-label={t('topBar.notifications')}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <UserMenu
              user={user}
              nameColor={dashboard?.nameColor}
              title={dashboard?.equippedTitle}
              profilePath="/student/me"
              shopPath="/student/shop"
              badgesPath="/student/badges"
            />
          </div>
        </header>
      )}

      {/* Desktop top bar — sticky to the right of the sidebar */}
      {!isMazePlayRoute && (
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
            <UserMenu
              user={user}
              nameColor={dashboard?.nameColor}
              title={dashboard?.equippedTitle}
              profilePath="/student/me"
              shopPath="/student/shop"
              badgesPath="/student/badges"
            />
          </div>
        </header>
      )}

      <main className={`${isMazePlayRoute ? 'p-0 w-full h-screen overflow-hidden' : `pt-16 md:pt-0 ${marginLeft} px-md md:px-lg lg:px-xl pb-24 md:pb-lg`} transition-all duration-300`}>
        <Outlet />
      </main>

      {!isMazePlayRoute && (
        <nav className="md:hidden fixed bottom-md left-1/2 -translate-x-1/2 z-50 flex items-center gap-xs bg-surface-container-low/90 backdrop-blur-md rounded-full border border-outline-variant px-sm py-sm shadow-elev-3 max-w-[calc(100vw-2rem)] overflow-x-auto">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={t(item.key)}
              className={({ isActive }) =>
                [
                  'relative min-h-[48px] min-w-[48px] grid place-items-center rounded-full transition-all',
                  isActive
                    ? 'bg-tertiary-container text-on-tertiary-container scale-110'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                ].join(' ')
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.to === '/student/blog' && blogUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-surface-container-low" />
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

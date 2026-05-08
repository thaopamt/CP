import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { UserAvatar } from './_shared';

const NAV = [
  { to: '/student', icon: 'home', label: 'Home', end: true },
  { to: '/student/quests', icon: 'rocket_launch', label: 'Quests' },
  { to: '/student/progress', icon: 'leaderboard', label: 'Progress' },
  { to: '/student/inbox', icon: 'mail', label: 'Inbox' },
  { to: '/student/me', icon: 'person', label: 'Me' },
];

/**
 * Student Portal — vibrant/playful, relaxed density.
 * 240px sidebar on desktop; mobile uses bottom-anchored island nav with
 * glassmorphism effect.
 */
export default function StudentLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">
      {/* Top bar (all viewports) */}
      <header className="fixed top-0 inset-x-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-md md:px-lg z-40">
        <h1 className="font-manrope font-extrabold text-headline-md text-primary">EduPulse</h1>
        <div className="flex items-center gap-sm md:gap-md">
          <div className="hidden md:flex relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Find a quest…"
              className="pl-10 pr-4 py-2 bg-surface-container-highest rounded-full text-label-sm focus:ring-2 focus:ring-primary w-[240px] outline-none border-none"
            />
          </div>
          <button className="p-2 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <UserAvatar user={user} size="sm" />
        </div>
      </header>

      {/* Desktop side nav */}
      <nav className="hidden md:flex flex-col w-[240px] lg:w-[280px] fixed top-16 bottom-0 left-0 p-md gap-xs bg-surface-container-lowest border-r border-outline-variant z-30">
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
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main */}
      <main className="pt-16 md:ml-[240px] lg:ml-[280px] px-md md:px-lg lg:px-xl pb-24 md:pb-lg">
        <Outlet />
      </main>

      {/* Mobile bottom-nav island */}
      <nav className="md:hidden fixed bottom-md left-1/2 -translate-x-1/2 z-50 flex items-center gap-xs bg-surface-container-low/90 backdrop-blur-md rounded-full border border-outline-variant px-sm py-sm shadow-elev-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'min-h-[48px] min-w-[48px] grid place-items-center rounded-full transition-all',
                isActive
                  ? 'bg-tertiary-container text-on-tertiary-container scale-110'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
              ].join(' ')
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

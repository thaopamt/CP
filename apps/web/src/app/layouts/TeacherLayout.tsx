import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { LogoutButton, UserAvatar } from './_shared';

const NAV = [
  { to: '/teacher', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/teacher/schedule', icon: 'event', label: 'Schedule' },
  { to: '/teacher/classes', icon: 'school', label: 'My Classes' },
  { to: '/teacher/assignments', icon: 'assignment', label: 'Assignments' },
  { to: '/teacher/gradebook', icon: 'grading', label: 'Gradebook' },
];

const MOBILE_NAV = NAV.slice(0, 4);

/**
 * Teacher Portal — warm/modern, standard density.
 * 280px sidebar on desktop; mobile uses top app bar + bottom-nav.
 */
export default function TeacherLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-inter">
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-[280px] h-screen fixed top-0 left-0 p-md gap-sm bg-surface-container-low border-r border-outline-variant z-50">
        <div className="flex items-center gap-md px-sm py-lg">
          <div className="w-10 h-10 rounded-lg bg-primary text-on-primary grid place-items-center font-manrope font-extrabold">
            EP
          </div>
          <div>
            <h1 className="text-label-sm font-extrabold text-primary leading-tight">Teacher Portal</h1>
            <p className="text-[12px] text-on-surface-variant opacity-80">Classroom Management</p>
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
              {item.label}
            </NavLink>
          ))}
        </div>
        <LogoutButton />
      </nav>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-md z-40">
        <h1 className="font-manrope font-extrabold text-headline-md text-primary">EduPulse</h1>
        <div className="flex items-center gap-sm">
          <button className="p-2 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <UserAvatar user={user} size="sm" />
        </div>
      </header>

      {/* Main */}
      <div className="md:ml-[280px] pt-16 md:pt-0 pb-24 md:pb-0">
        <main className="px-md md:px-lg lg:px-xl py-lg">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

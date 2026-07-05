import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

const THEMES = [
  'galaxy', 'hacker', 'ocean', 'forest', 'snow',
  'sakura', 'volcano', 'party', 'cyberpunk', 'aurora', 'sunset'
];

const THEME_COLORS: Record<string, string> = {
  galaxy: 'from-purple-900 to-black text-white border-purple-800',
  hacker: 'from-green-950 to-black text-green-400 border-green-800',
  ocean: 'from-blue-900 to-cyan-950 text-cyan-200 border-blue-800',
  forest: 'from-emerald-950 to-green-950 text-emerald-300 border-emerald-900',
  snow: 'from-sky-100 to-sky-300 text-sky-900 border-sky-200',
  sakura: 'from-pink-100 via-pink-200 to-rose-200 text-rose-900 border-pink-200',
  volcano: 'from-red-950 to-orange-950 text-red-400 border-red-900',
  party: 'from-indigo-950 via-purple-950 to-pink-950 text-pink-300 border-purple-900',
  cyberpunk: 'from-fuchsia-950 to-cyan-950 text-fuchsia-300 border-fuchsia-800',
  aurora: 'from-violet-955 via-emerald-955 to-blue-955 text-emerald-300 border-emerald-900',
  sunset: 'from-amber-955 to-orange-955 text-amber-400 border-amber-900',
};

export function DevThemeSwitcher() {
  const { activeTheme, isOverride, setThemeOverride } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col items-start font-sans">
      {isOpen ? (
        <div className="bg-slate-950/95 text-white rounded-2xl p-4 shadow-2xl border border-slate-800/80 backdrop-blur-md w-72 max-h-[400px] overflow-y-auto flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-sm text-slate-300 flex items-center gap-1">
              🛠️ Dev Theme Switcher
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            >
              Minimize
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {THEMES.map((theme) => {
              const isActive = activeTheme === theme;
              const colorClass = THEME_COLORS[theme] || 'from-slate-700 to-slate-800';
              return (
                <button
                  key={theme}
                  onClick={() => setThemeOverride(theme)}
                  className={`relative p-2 rounded-lg bg-gradient-to-br ${colorClass} font-medium border text-left cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md ${isActive
                      ? 'border-white ring-2 ring-white/30 scale-[1.02]'
                      : 'border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <span className="capitalize">{theme}</span>
                  {isActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setThemeOverride(null)}
            disabled={!isOverride}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${isOverride
                ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            Reset to Student Theme
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.6)] hover:shadow-[0_0_25px_rgba(139,92,246,0.9)] hover:scale-110 active:scale-95 transition-all duration-300 relative group"
          title="Open Dev Theme Switcher"
        >
          <span className="material-symbols-outlined text-2xl group-hover:rotate-45 transition-transform duration-300">palette</span>
        </button>
      )}
    </div>
  );
}

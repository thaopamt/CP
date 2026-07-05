# Enhanced Themes and Dev Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance all 11 system themes with richer particle animations and custom CSS palettes, and implement a floating Dev Theme Switcher to easily swap and test them locally in development.

**Architecture:** Create a React Context (`ThemeContext`) in `ThemeProvider` to store the active theme (with localStorage override for dev mode). Render a floating widget (`DevThemeSwitcher`) in dev mode to select overrides. Update particle configs in `ThemeEffects` and style variables in `styles.css` to align with the new aesthetics.

**Tech Stack:** React, @tsparticles/react, TailwindCSS, CSS Custom Variables, LocalStorage.

## Global Constraints
- Target workspace: `/Users/thaopamt/Desktop/Personal/CP_System/apps/web`
- Only show Dev Theme Switcher when `import.meta.env.DEV` is `true`.
- Persist the selected dev override in `localStorage` under key `dev-theme-override`.
- Fix the existing tsParticles typescript type error for `character` shape inside `ThemeEffects.tsx`.

---

### Task 1: Save and Commit the Approved Design Document

**Files:**
- Create: `docs/superpowers/specs/2026-07-04-enhanced-themes-and-dev-switcher-design.md`

**Interfaces:**
- Consumes: Approved design document content from previous step.
- Produces: Persistent specification file.

- [ ] **Step 1: Create specification folder and file**
  Copy the approved design doc into the codebase's documentation directory.
- [ ] **Step 2: Commit the design spec**
  Run:
  ```bash
  git add docs/superpowers/specs/2026-07-04-enhanced-themes-and-dev-switcher-design.md
  git commit -m "docs: add design spec for enhanced themes and dev switcher"
  ```

---

### Task 2: Implement ThemeContext in ThemeProvider

**Files:**
- Modify: `apps/web/src/app/providers/ThemeProvider.tsx`

**Interfaces:**
- Consumes: `student?.equippedTheme` from `useCurrentStudent()`.
- Produces: `ThemeContext` and hook `useTheme()` to retrieve `{ activeTheme, isOverride, setThemeOverride }`.

- [ ] **Step 1: Modify ThemeProvider.tsx to define and export ThemeContext**
  Replace content of `apps/web/src/app/providers/ThemeProvider.tsx` to set up state override, localstorage persistence in development, context provider, and the `useTheme` hook.
  Show code to implement:
  ```typescript
  import { createContext, useContext, useState, useEffect } from 'react';
  import { useCurrentStudent } from '../api/student.queries';
  import { DevThemeSwitcher } from '../components/DevThemeSwitcher';

  export interface ThemeContextType {
    activeTheme: string | null | undefined;
    isOverride: boolean;
    setThemeOverride: (theme: string | null) => void;
  }

  export const ThemeContext = createContext<ThemeContextType>({
    activeTheme: undefined,
    isOverride: false,
    setThemeOverride: () => {},
  });

  export function useTheme() {
    return useContext(ThemeContext);
  }

  export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: student } = useCurrentStudent();
    const [themeOverride, setThemeOverrideState] = useState<string | null>(() => {
      if (typeof window !== 'undefined' && import.meta.env.DEV) {
        return localStorage.getItem('dev-theme-override');
      }
      return null;
    });

    const setThemeOverride = (theme: string | null) => {
      setThemeOverrideState(theme);
      if (import.meta.env.DEV) {
        if (theme) {
          localStorage.setItem('dev-theme-override', theme);
        } else {
          localStorage.removeItem('dev-theme-override');
        }
      }
    };

    const activeTheme = themeOverride || student?.equippedTheme;

    useEffect(() => {
      const root = document.documentElement;
      const classesToRemove = Array.from(root.classList).filter((cls) => cls.startsWith('theme-'));
      classesToRemove.forEach((cls) => root.classList.remove(cls));

      if (activeTheme) {
        root.classList.add(`theme-${activeTheme}`);
      }
    }, [activeTheme]);

    return (
      <ThemeContext.Provider value={{ activeTheme, isOverride: !!themeOverride, setThemeOverride }}>
        {children}
        {import.meta.env.DEV && <DevThemeSwitcher />}
      </ThemeContext.Provider>
    );
  }
  ```
- [ ] **Step 2: Commit the changes**
  Run:
  ```bash
  git add apps/web/src/app/providers/ThemeProvider.tsx
  git commit -m "feat(theme): implement ThemeContext and Dev override in ThemeProvider"
  ```

---

### Task 3: Create DevThemeSwitcher Component

**Files:**
- Create: `apps/web/src/app/components/DevThemeSwitcher.tsx`

**Interfaces:**
- Consumes: `useTheme` hook from `ThemeProvider.tsx`.
- Produces: Floating dropdown/panel that updates the theme override state.

- [ ] **Step 1: Write DevThemeSwitcher.tsx**
  Implement the floating UI with Tailwind CSS. It must support expanding/collapsing, render buttons with colors representing the 11 themes, and a "Reset to Student Theme" button.
  Code implementation:
  ```tsx
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
    aurora: 'from-violet-950 via-emerald-950 to-blue-950 text-emerald-300 border-emerald-900',
    sunset: 'from-amber-950 to-orange-950 text-amber-400 border-amber-900',
  };

  export function DevThemeSwitcher() {
    const { activeTheme, isOverride, setThemeOverride } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end font-sans">
        {isOpen ? (
          <div className="bg-slate-955/95 text-white rounded-2xl p-4 shadow-2xl border border-slate-800/80 backdrop-blur-md w-72 max-h-[400px] overflow-y-auto flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
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
                    className={`relative p-2 rounded-lg bg-gradient-to-br ${colorClass} font-medium border text-left cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md ${
                      isActive 
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
              className={`w-full py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                isOverride 
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
            className="w-12 h-12 rounded-full bg-slate-950/95 text-white border border-slate-800/80 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
            title="Open Dev Theme Switcher"
          >
            <span className="material-symbols-outlined text-xl">palette</span>
          </button>
        )}
      </div>
    );
  }
  ```
- [ ] **Step 2: Commit the new component**
  Run:
  ```bash
  git add apps/web/src/app/components/DevThemeSwitcher.tsx
  git commit -m "feat(theme): add DevThemeSwitcher component"
  ```

---

### Task 4: Upgrade Particles Configuration in ThemeEffects

**Files:**
- Modify: `apps/web/src/app/components/ThemeEffects.tsx`

**Interfaces:**
- Consumes: `useTheme` hook instead of local query hook `useCurrentStudent()`.
- Produces: Beautiful, enhanced particle configs for each of the 11 themes.

- [ ] **Step 1: Rewrite ThemeEffects.tsx**
  Implement upgraded `themeConfigs` to resolve the `character` shape compile error and apply highly polished particle designs for all 11 themes.
  Show updated configs in code:
  ```typescript
  import { useEffect, useState } from 'react';
  import Particles, { initParticlesEngine } from '@tsparticles/react';
  import { loadFull } from 'tsparticles';
  import type { ISourceOptions } from '@tsparticles/engine';
  import { useTheme } from '../providers/ThemeProvider';

  const themeConfigs: Record<string, ISourceOptions> = {
    galaxy: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 180, density: { enable: true } },
        color: { value: ['#ffffff', '#c084fc', '#60a5fa'] },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.1, max: 0.9 },
          animation: { enable: true, speed: 1.2, sync: false },
        },
        size: { value: { min: 0.8, max: 3.2 } },
        move: { enable: true, speed: 0.15, direction: 'none', outModes: 'out', random: true },
      },
    },
    hacker: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 75, density: { enable: true } },
        color: { value: '#22c55e' },
        shape: { 
          type: 'char', 
          options: {
            char: {
              value: ['0', '1', 'A', 'Z', '$', '{', '}'],
              font: 'monospace',
              weight: 'bold'
            }
          }
        },
        opacity: { 
          value: { min: 0.2, max: 0.85 },
          animation: { enable: true, speed: 1.5, sync: false }
        },
        size: { value: 15 },
        move: { enable: true, speed: 3.5, direction: 'bottom', outModes: 'out', straight: true },
      },
    },
    ocean: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 60 },
        color: { value: ['#7dd3fc', '#e0f2fe', '#ffffff'] },
        shape: { type: 'circle' },
        opacity: { 
          value: { min: 0.2, max: 0.7 },
          animation: { enable: true, speed: 0.8, sync: false }
        },
        size: { value: { min: 3, max: 9 } },
        move: { enable: true, speed: 1.5, direction: 'top', outModes: 'out', straight: false },
        wobble: { enable: true, distance: 8, speed: 5 }
      },
    },
    forest: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 70 },
        color: { value: ['#a3e635', '#34d399', '#facc15'] },
        shape: { type: 'circle' },
        opacity: { 
          value: { min: 0.1, max: 0.85 }, 
          animation: { enable: true, speed: 1.6, sync: false } 
        },
        size: { value: { min: 1.8, max: 4.5 } },
        move: { enable: true, speed: 0.7, direction: 'none', random: true, outModes: 'out' },
      },
    },
    snow: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 120 },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { 
          value: { min: 0.3, max: 0.8 },
          animation: { enable: true, speed: 0.6 }
        },
        size: { value: { min: 1.5, max: 4.5 } },
        move: { enable: true, speed: 1.8, direction: 'bottom', straight: false, outModes: 'out' },
        wobble: { enable: true, distance: 10, speed: 4 }
      },
    },
    sakura: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 60 },
        color: { value: ['#fbcfe8', '#f472b6', '#fda4af'] },
        shape: { type: 'polygon' },
        opacity: { 
          value: { min: 0.4, max: 0.85 },
          animation: { enable: true, speed: 0.5 }
        },
        size: { value: { min: 4, max: 9 } },
        move: { enable: true, speed: 1.5, direction: 'bottom-right', outModes: 'out' },
        rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 4 } },
        wobble: { enable: true, distance: 12, speed: 4 }
      },
    },
    volcano: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 90 },
        color: { value: ['#ef4444', '#f97316', '#fbbf24'] },
        shape: { type: 'circle' },
        opacity: { 
          value: { min: 0.4, max: 1 }, 
          animation: { enable: true, speed: 2.2, sync: false } 
        },
        size: { value: { min: 1.5, max: 4.2 } },
        move: { enable: true, speed: 3.2, direction: 'top', random: true, outModes: 'out' },
      },
    },
    party: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 95 },
        color: { value: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] },
        shape: { type: ['square', 'circle', 'polygon'] },
        opacity: { value: 0.95 },
        size: { value: { min: 5, max: 11 } },
        move: { enable: true, speed: 4, direction: 'bottom', outModes: 'out', random: true },
        rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 18 } },
        wobble: { enable: true, distance: 18, speed: 10 }
      },
    },
    cyberpunk: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 50 },
        color: { value: ['#f472b6', '#22d3ee', '#fde047'] },
        shape: { type: ['triangle', 'polygon'] },
        opacity: { 
          value: { min: 0.4, max: 0.8 },
          animation: { enable: true, speed: 1 }
        },
        size: { value: { min: 8, max: 15 } },
        move: { enable: true, speed: 3.2, direction: 'top-right', outModes: 'out' },
      },
    },
    aurora: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 18 },
        color: { value: ['#c084fc', '#60a5fa', '#34d399'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.25, max: 0.55 } },
        size: { value: { min: 140, max: 280 } },
        move: { enable: true, speed: 0.8, direction: 'none', random: true, outModes: 'out' },
      },
    },
    sunset: {
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 45 },
        color: { value: ['#fbbf24', '#f87171', '#f472b6'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.25, max: 0.75 } },
        size: { value: { min: 4, max: 10 } },
        move: { enable: true, speed: 1.2, direction: 'top-right', outModes: 'out' },
      },
    }
  };

  export function ThemeEffects() {
    const [init, setInit] = useState(false);
    const { activeTheme: theme } = useTheme();

    useEffect(() => {
      initParticlesEngine(async (engine) => {
        await loadFull(engine);
      }).then(() => setInit(true));
    }, []);

    if (!init || !theme || !themeConfigs[theme]) return null;

    return (
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none" 
        style={{ filter: theme === 'aurora' ? 'blur(80px)' : 'none' }}
      >
        <Particles 
          id="tsparticles-theme" 
          options={{
            ...themeConfigs[theme],
            fullScreen: { enable: false },
          }} 
          className="w-full h-full" 
        />
      </div>
    );
  }
  ```
- [ ] **Step 2: Commit the changes**
  Run:
  ```bash
  git add apps/web/src/app/components/ThemeEffects.tsx
  git commit -m "feat(theme): upgrade particle effects in ThemeEffects"
  ```

---

### Task 5: Enhance Styles for Themes in CSS

**Files:**
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Consumes: CSS custom variable system.
- Produces: Vibrant colors, outline glows, and custom gradients matching each theme class.

- [ ] **Step 1: Edit styles.css**
  Modify CSS variables of the theme classes starting from line 187 (`.theme-aurora`) down to line 365 (`.theme-galaxy.dark`). Make sure each theme has its custom container variables, and primary glows look vibrant.
- [ ] **Step 2: Commit the CSS updates**
  Run:
  ```bash
  git add apps/web/src/styles.css
  git commit -m "style(theme): enhance theme colors and variables in styles.css"
  ```

---

### Task 6: Verify Compiling and Run Type Checking

**Files:**
- None

**Interfaces:**
- Consumes: All files modified.
- Produces: Successful compilation validation.

- [ ] **Step 1: Run type checking command**
  Run: `npx nx run web:typecheck`
  Verify that the `ThemeEffects.tsx` compilation error is gone.
- [ ] **Step 2: Verify Vite building**
  Run: `pnpm --filter web build`
  Verify the build finishes successfully with zero bundler errors.

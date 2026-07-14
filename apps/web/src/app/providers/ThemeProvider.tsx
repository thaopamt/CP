import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  setThemeOverride: () => { },
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: student } = useCurrentStudent();
  const [themeOverride, setThemeOverrideState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dev-theme-override');
    }
    return null;
  });

  const setThemeOverride = (theme: string | null) => {
    setThemeOverrideState(theme);
    if (theme) {
      localStorage.setItem('dev-theme-override', theme);
    } else {
      localStorage.removeItem('dev-theme-override');
    }
  };

  const activeTheme = themeOverride || student?.equippedTheme;

  useEffect(() => {
    const root = document.documentElement;
    // Remove any previously applied theme classes safely
    const classesToRemove = Array.from(root.classList).filter((cls) => cls.startsWith('theme-'));
    classesToRemove.forEach((cls) => root.classList.remove(cls));

    // Apply new theme if exists
    if (activeTheme) {
      root.classList.add(`theme-${activeTheme}`);
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, isOverride: !!themeOverride, setThemeOverride }}>
      {children}
      {/* <DevThemeSwitcher /> */}
    </ThemeContext.Provider>
  );
}

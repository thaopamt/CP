import { useEffect } from 'react';
import { useCurrentStudent } from '../api/student.queries';
import { useAuthStore } from '../stores/auth.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  
  // We call useCurrentStudent. Since queries are enabled by default, 
  // it might fire even if user is not a student, but the backend may handle it 
  // or it will fail gracefully. However, `studentQueryKeys.me()` is standard.
  const { data: student } = useCurrentStudent();

  useEffect(() => {
    const root = document.documentElement;
    // We get the equipped theme. If the user is an admin or teacher, they might not have this,
    // so we just get undefined.
    const currentTheme = student?.equippedTheme;

    // Remove any previously applied theme classes
    root.classList.forEach((cls) => {
      if (cls.startsWith('theme-')) {
        root.classList.remove(cls);
      }
    });

    // Apply new theme if exists
    if (currentTheme) {
      // Ensure the theme key matches the CSS class, e.g. themeKey "ocean" -> "theme-ocean"
      root.classList.add(`theme-${currentTheme}`);
    }
  }, [student?.equippedTheme]);

  return <>{children}</>;
}

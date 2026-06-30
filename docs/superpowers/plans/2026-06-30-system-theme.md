# System-wide Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a system-wide theme based on user's purchased & equipped `PROFILE_THEME` items by mapping `equippedTheme` to CSS classes.

**Architecture:** A new `ThemeProvider` will read the user's `equippedTheme` from the API and apply the corresponding CSS class to the HTML root element. Custom themes are defined in `styles.css`.

**Tech Stack:** React (Vite), React Query, TailwindCSS, CSS Variables.

## Global Constraints

- Must use TailwindCSS classes and standard CSS variable overrides.
- Do not remove the `dark` mode compatibility.
- Ensure the React Query invalidation for `students/me` triggers a re-render.

---

### Task 1: Add Custom Themes to Stylesheet

**Files:**
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Consumes: N/A
- Produces: CSS classes `.theme-ocean` and `.theme-hacker`

- [ ] **Step 1: Add CSS overrides**
Add the following blocks to `apps/web/src/styles.css` inside the `@layer base` block (or after the `.dark` class block):

```css
  .theme-ocean {
    --color-background: #e0f2fe;
    --color-surface: #f0f9ff;
    --color-surface-container-lowest: #ffffff;
    --color-surface-container-low: #f0f9ff;
    --color-surface-container: #e0f2fe;
    --color-primary: #0284c7;
    --color-on-primary: #ffffff;
    --color-primary-container: #bae6fd;
    --color-on-primary-container: #0369a1;
  }
  .theme-ocean.dark {
    --color-background: #082f49;
    --color-surface: #0c4a6e;
    --color-surface-container-lowest: #082f49;
    --color-surface-container-low: #0c4a6e;
    --color-surface-container: #075985;
    --color-primary: #38bdf8;
    --color-on-primary: #082f49;
    --color-primary-container: #0369a1;
    --color-on-primary-container: #e0f2fe;
  }

  .theme-hacker {
    --color-background: #000000;
    --color-surface: #050505;
    --color-surface-container-lowest: #000000;
    --color-surface-container-low: #050505;
    --color-surface-container: #0a0a0a;
    --color-primary: #22c55e;
    --color-on-primary: #000000;
    --color-primary-container: #14532d;
    --color-on-primary-container: #86efac;
    --color-on-surface: #4ade80;
    --color-on-background: #22c55e;
  }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "feat: Add ocean and hacker system themes"
```

---

### Task 2: Create Theme Provider

**Files:**
- Create: `apps/web/src/app/providers/ThemeProvider.tsx`

**Interfaces:**
- Consumes: `useCurrentStudent` from `apps/web/src/app/api/student.queries.ts`
- Produces: `<ThemeProvider>` wrapper component

- [ ] **Step 1: Write ThemeProvider component**
Create `apps/web/src/app/providers/ThemeProvider.tsx`:

```tsx
import { useEffect } from 'react';
import { useCurrentStudent } from '../api/student.queries';
import { useAuthStore } from '../stores/auth.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  // Only fetch student data if the user is a student (or let the query handle it gracefully)
  const { data: student } = useCurrentStudent();

  useEffect(() => {
    const root = document.documentElement;
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/providers/ThemeProvider.tsx
git commit -m "feat: Create ThemeProvider to handle dynamic CSS themes"
```

---

### Task 3: Wrap App with ThemeProvider and Update React Query Invalidation

**Files:**
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/app/api/shop.queries.ts`

**Interfaces:**
- Consumes: `<ThemeProvider>`

- [ ] **Step 1: Update invalidateShop in shop.queries.ts**
Modify `apps/web/src/app/api/shop.queries.ts`:
Change `invalidateShop` to include invalidating the `students/me` query so `useCurrentStudent()` gets updated when a theme is equipped.

```ts
function invalidateShop(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: shopQueryKeys.all });
  void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
  void qc.invalidateQueries({ queryKey: ['leaderboard'] });
  void qc.invalidateQueries({ queryKey: ['student-badges'] });
  void qc.invalidateQueries({ queryKey: ['students', 'me'] });
}
```

- [ ] **Step 2: Wrap Application in App.tsx**
Modify `apps/web/src/app/App.tsx`:
Add `import { ThemeProvider } from './providers/ThemeProvider';`
Wrap `<BrowserRouter>` inside `<ThemeProvider>` (which itself is inside `<AuthProvider>`).

```tsx
// Find this section:
      <AuthProvider>
        <ConfirmProvider>
          <BrowserRouter>

// Change to:
      <AuthProvider>
        <ThemeProvider>
          <ConfirmProvider>
            <BrowserRouter>

// And close it correctly at the bottom:
            </BrowserRouter>
          </ConfirmProvider>
        </ThemeProvider>
      </AuthProvider>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/App.tsx apps/web/src/app/api/shop.queries.ts
git commit -m "feat: Wrap app in ThemeProvider and update query invalidation"
```

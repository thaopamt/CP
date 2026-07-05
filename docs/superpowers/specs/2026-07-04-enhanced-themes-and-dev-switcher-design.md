# Design Spec: Enhanced Themes and Dev Theme Switcher

## Goal
Improve the visual aesthetics of all 11 themes in the application by upgrading their particle effects (`ThemeEffects.tsx`) and matching CSS variables (`styles.css`). Introduce a floating, collapsible **Dev Theme Switcher** widget that is only visible in development mode (`import.meta.env.DEV`), allowing developers to test any theme instantly and persist the selected theme via `localStorage`.

---

## Proposed Architecture

### 1. Theme State Management via `ThemeContext`
We will introduce a React Context in [ThemeProvider.tsx](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/web/src/app/providers/ThemeProvider.tsx) to coordinate theme state between the provider (which sets the CSS classes on the HTML element) and the particles component (which renders background effects).

```typescript
export interface ThemeContextType {
  activeTheme: string | null | undefined;
  isOverride: boolean;
  setThemeOverride: (theme: string | null) => void;
}
```

* **Production Behavior**: The `activeTheme` defaults to the student's equipped theme (`student?.equippedTheme`).
* **Development Behavior**: If a theme key is stored in `localStorage` under `dev-theme-override`, it overrides the student's equipped theme. `activeTheme` will reflect this override.

### 2. Floating Dev Theme Switcher Widget
A new helper component `DevThemeSwitcher` will be rendered inside `ThemeProvider` only when `import.meta.env.DEV` is true.

* **UI/UX design**:
  * Floating trigger button with a glassmorphic look in the bottom-right corner.
  * Clicking it toggles a panel showing a grid of all 11 themes.
  * Selecting a theme sets `localStorage.setItem('dev-theme-override', themeKey)` and updates the React state.
  * A "Reset" button clears the override.
  * Active theme is highlighted with a glow/ring matching the theme's identity.

### 3. Visual Specifications for the 11 Themes

#### `galaxy`
* **Particles**: Opacity animated twinkling stars of varying sizes (1px - 3.5px) drifting slowly in random directions, with a mix of pure white and subtle soft-blue/violet hues.
* **CSS Variables**: Deep space gradient background from `#030712` to `#000000`, purple outline, glowing shadows.

#### `hacker`
* **Particles**: Matrix-style digital code rain (0, 1, A, Z, $, {, }) falling downwards with varying speeds, opacity fading trails, and soft green neon drop-shadows.
* **CSS Variables**: Pitch black background (`#000000`), toxic/neon green primary color (`#22c55e`), glowing borders.

#### `ocean`
* **Particles**: Bubble-like translucent orbs floating upwards with a horizontal swaying wobble effect and minor size pulsations.
* **CSS Variables**: Ocean depth gradient from deep blue-black (`#0b1329`) to ocean blue (`#1e3a8a`), light cyan outlines.

#### `forest`
* **Particles**: Fireflies-style glowing orbs (colors: lime/emerald green) pulsing in opacity and moving in random organic Brownian motion paths.
* **CSS Variables**: Moss/forest green gradient (`#022c22` to `#064e3b`), natural earth outlines.

#### `snow`
* **Particles**: Floating white snowflakes falling down with a gentle wind drift (tilted path) and wobble animation.
* **CSS Variables**: Light modes use icy blue-white (`#f0f9ff`), dark modes use frosted night sky (`#0c4a6e`).

#### `sakura`
* **Particles**: Pink cherry blossom petals falling diagonally with individual spin/rotation and swaying motion.
* **CSS Variables**: Delicate pink gradient background (`#fff1f2` / `#fce7f3`), deep plum/cherry text (`#4c1d95`).

#### `volcano`
* **Particles**: Energetic embers/ashes in fiery red, orange, and yellow rising upwards rapidly with high speed variation and flickering opacity.
* **CSS Variables**: Obsidian dark-red (`#1a0504` to `#2d0a08`), burning orange outlines (`#ea580c`).

#### `party`
* **Particles**: Multi-colored square, circle, and polygon confetti shapes falling down, rotating rapidly on all 3D axes, and fluttering.
* **CSS Variables**: Midnight festival indigo (`#170f2e`), vibrant violet/pink accents.

#### `cyberpunk`
* **Particles**: Sharp polygons (triangles/squares) in hot pink, neon cyan, and neon yellow drifting dynamically across the screen.
* **CSS Variables**: Dark slate base (`#020617`), neon pink outlines (`#f43f5e`), neon cyan highlights (`#06b6d4`).

#### `aurora`
* **Particles**: Giant glowing gas orbs (size 150px - 300px) in violet, neon blue, and emerald green moving extremely slowly under an intense blur filter (`blur(80px)`).
* **CSS Variables**: Mystic night sky base (`#090d16`), soft aurora light colors.

#### `sunset`
* **Particles**: Golden dust/sparks rising slowly and drifting rightward as if blown by a warm evening breeze.
* **CSS Variables**: Deep terracotta/orange sunset gradient (`#431407` to `#7c2d12`).

---

## Verification Plan

### Manual Verification
1. Run `pnpm serve:all` or `pnpm --filter web dev` to start the frontend application.
2. Verify that the Floating Dev Theme Switcher is visible in the bottom-right corner.
3. Click through all 11 themes in the grid.
4. Verify that:
   - The selected theme name is saved to `localStorage` (check Application tab in DevTools).
   - The CSS class on `document.documentElement` updates instantly (e.g. `theme-cyberpunk`, `theme-ocean`).
   - The `@tsparticles` rendering updates instantly with the new particle configuration.
   - The theme background/outline/text variables match the theme's identity.
5. Click "Reset" and verify the theme reverts back to the student's equipped theme.
6. Build the web app (`pnpm --filter web build`) to ensure the code compiling succeeds and has no tree-shaking/bundling errors.

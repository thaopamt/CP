import { ReactNode } from 'react';

/**
 * Maps gem-shop cosmetic codes (the `frameKey` / `themeKey` stored on the
 * student profile) to Tailwind classes. Keep these keys in sync with
 * apps/api/src/database/seeds/seed-shop.ts.
 */

/** Tinted gradient used as a profile-header background for each theme. */
export const THEME_GRADIENT: Record<string, string> = {
  sunset: 'bg-gradient-to-r from-orange-400/20 via-pink-500/10 to-purple-500/20',
  aurora: 'bg-gradient-to-r from-emerald-400/20 via-cyan-400/10 to-violet-500/20',
  galaxy: 'bg-gradient-to-r from-indigo-500/25 via-purple-600/15 to-fuchsia-500/25',
};

export function themeGradientClass(themeKey?: string | null): string | null {
  if (!themeKey) return null;
  return THEME_GRADIENT[themeKey] ?? null;
}


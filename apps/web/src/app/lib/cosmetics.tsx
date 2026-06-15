import { ReactNode } from 'react';

/**
 * Maps gem-shop cosmetic codes (the `frameKey` / `themeKey` stored on the
 * student profile) to Tailwind classes. Keep these keys in sync with
 * apps/api/src/database/seeds/seed-shop.ts.
 */

/** Gradient used as the ring around an avatar for each frame. */
const FRAME_GRADIENT: Record<string, string> = {
  bronze: 'bg-gradient-to-br from-amber-600 to-orange-800',
  silver: 'bg-gradient-to-br from-slate-300 to-slate-500',
  gold: 'bg-gradient-to-br from-amber-300 to-yellow-500',
  neon: 'bg-gradient-to-br from-fuchsia-500 via-cyan-400 to-violet-500',
  emerald: 'bg-gradient-to-br from-emerald-400 to-teal-600',
  sapphire: 'bg-gradient-to-br from-sky-400 to-blue-700',
  ruby: 'bg-gradient-to-br from-rose-500 to-red-700',
  amethyst: 'bg-gradient-to-br from-purple-400 to-fuchsia-700',
  ember: 'bg-gradient-to-br from-orange-500 to-red-600',
  frost: 'bg-gradient-to-br from-cyan-200 to-sky-500',
  rose: 'bg-gradient-to-br from-pink-300 to-rose-500',
  toxic: 'bg-gradient-to-br from-lime-400 to-green-600',
  obsidian: 'bg-gradient-to-br from-gray-600 to-gray-900',
  royal: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-400',
  diamond: 'bg-gradient-to-br from-cyan-100 via-sky-200 to-blue-400',
  rainbow: 'bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500',
};

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

/**
 * Wraps an avatar in a cosmetic frame ring. When `frameKey` is null/unknown the
 * children render unchanged (no wrapper), so it's safe to always use.
 */
export function AvatarFrame({
  frameKey,
  children,
  className = '',
  shape = 'circle',
}: {
  frameKey?: string | null;
  children: ReactNode;
  className?: string;
  /** Match the wrapped avatar's shape: 'circle' (default) or 'rounded' square. */
  shape?: 'circle' | 'rounded';
}) {
  // Character avatars (rounded) are shown directly — no frame ring/wrapper.
  if (shape === 'rounded') return <>{children}</>;
  const gradient = frameKey ? FRAME_GRADIENT[frameKey] : undefined;
  if (!gradient) return <>{children}</>;
  return (
    <span className={`inline-grid place-items-center rounded-full p-[2px] ${gradient} ${className}`}>
      {children}
    </span>
  );
}

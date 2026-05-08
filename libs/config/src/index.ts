/**
 * Re-export design tokens as TypeScript constants for runtime access
 * (e.g. for inline styles, CSS-in-JS, or chart libraries that need hex values).
 * Tailwind's preset (../tailwind.preset.cjs) remains the canonical source.
 */
export const COLORS = {
  primary: '#4f378a',
  primaryContainer: '#6750a4',
  onPrimary: '#ffffff',
  secondary: '#63597c',
  tertiary: '#765b00',
  tertiaryContainer: '#c9a74d',
  error: '#ba1a1a',
  surface: '#fdf7ff',
  onSurface: '#1d1b20',
  outlineVariant: '#cbc4d2',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const PORTAL_THEME = {
  admin: { primary: COLORS.primary, density: 'compact' as const },
  teacher: { primary: COLORS.primary, density: 'standard' as const },
  student: { primary: COLORS.primaryContainer, density: 'relaxed' as const },
} as const;

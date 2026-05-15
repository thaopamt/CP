/**
 * Shared Tailwind preset — single source of truth for design tokens.
 * Values are copied verbatim from
 *   /design/01_stitch_edunexus_ui_foundation/education_management_system/DESIGN.md
 * Both apps/web/tailwind.config.ts and libs/ui/tailwind.config.ts extend
 * this preset via `presets: [require('.../tailwind.preset.cjs')]`.
 */
module.exports = {
  darkMode: 'class',
  content: [], // each consumer sets its own content globs
  theme: {
    extend: {
      colors: {
        // ── Surface layer ──────────────────────────────────────────────────
        surface: 'var(--color-surface)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-variant': 'var(--color-surface-variant)',
        'surface-tint': 'var(--color-surface-tint)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',

        // ── Primary (Admin/Violet) ─────────────────────────────────────────
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',
        'inverse-primary': 'var(--color-inverse-primary)',
        'primary-fixed': 'var(--color-primary-fixed)',
        'primary-fixed-dim': 'var(--color-primary-fixed-dim)',
        'on-primary-fixed': 'var(--color-on-primary-fixed)',
        'on-primary-fixed-variant': 'var(--color-on-primary-fixed-variant)',

        // ── Secondary ──────────────────────────────────────────────────────
        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',
        'secondary-fixed': 'var(--color-secondary-fixed)',
        'secondary-fixed-dim': 'var(--color-secondary-fixed-dim)',
        'on-secondary-fixed': 'var(--color-on-secondary-fixed)',
        'on-secondary-fixed-variant': 'var(--color-on-secondary-fixed-variant)',

        // ── Tertiary (Achievement/Orange) ──────────────────────────────────
        tertiary: 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',
        'tertiary-fixed': 'var(--color-tertiary-fixed)',
        'tertiary-fixed-dim': 'var(--color-tertiary-fixed-dim)',
        'on-tertiary-fixed': 'var(--color-on-tertiary-fixed)',
        'on-tertiary-fixed-variant': 'var(--color-on-tertiary-fixed-variant)',

        // ── Error ──────────────────────────────────────────────────────────
        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',
      },
      fontFamily: {
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        lexend: ['Lexend', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': [
          '48px',
          { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' },
        ],
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-sm': [
          '14px',
          { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' },
        ],
        'student-card-title': ['20px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        full: '9999px',
      },
      boxShadow: {
        // Tonal/ambient shadows tuned for Material 3 surfaces
        'elev-1': '0 1px 2px rgba(29, 27, 32, 0.04), 0 1px 1px rgba(29, 27, 32, 0.02)',
        'elev-2': '0 4px 12px rgba(29, 27, 32, 0.04)',
        'elev-3': '0 8px 24px rgba(29, 27, 32, 0.08)',
        // Skeuomorphic 3D button (student portal)
        'btn-3d': '0 4px 0 rgb(34, 0, 93)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};

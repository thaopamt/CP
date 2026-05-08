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
        surface: '#fdf7ff',
        'surface-dim': '#ded8e0',
        'surface-bright': '#fdf7ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f8f2fa',
        'surface-container': '#f2ecf4',
        'surface-container-high': '#ece6ee',
        'surface-container-highest': '#e6e0e9',
        'surface-variant': '#e6e0e9',
        'surface-tint': '#6750a4',
        'on-surface': '#1d1b20',
        'on-surface-variant': '#494551',
        'inverse-surface': '#322f35',
        'inverse-on-surface': '#f5eff7',
        outline: '#7a7582',
        'outline-variant': '#cbc4d2',
        background: '#fdf7ff',
        'on-background': '#1d1b20',

        // ── Primary (Admin/Violet) ─────────────────────────────────────────
        primary: '#4f378a',
        'on-primary': '#ffffff',
        'primary-container': '#6750a4',
        'on-primary-container': '#e0d2ff',
        'inverse-primary': '#cfbcff',
        'primary-fixed': '#e9ddff',
        'primary-fixed-dim': '#cfbcff',
        'on-primary-fixed': '#22005d',
        'on-primary-fixed-variant': '#4f378a',

        // ── Secondary ──────────────────────────────────────────────────────
        secondary: '#63597c',
        'on-secondary': '#ffffff',
        'secondary-container': '#e1d4fd',
        'on-secondary-container': '#645a7d',
        'secondary-fixed': '#e9ddff',
        'secondary-fixed-dim': '#cdc0e9',
        'on-secondary-fixed': '#1f1635',
        'on-secondary-fixed-variant': '#4b4263',

        // ── Tertiary (Achievement/Orange) ──────────────────────────────────
        tertiary: '#765b00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#c9a74d',
        'on-tertiary-container': '#503d00',
        'tertiary-fixed': '#ffdf93',
        'tertiary-fixed-dim': '#e7c365',
        'on-tertiary-fixed': '#241a00',
        'on-tertiary-fixed-variant': '#594400',

        // ── Error ──────────────────────────────────────────────────────────
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
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

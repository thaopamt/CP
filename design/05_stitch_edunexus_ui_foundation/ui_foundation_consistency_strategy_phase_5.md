# UI & Design System Documentation: Phase 5 Refinement

## 1. Visual Foundation
- **Typography**: Manrope (Primary). Fluid scale: Headlines (700-800 weight), Body (400-500), Labels (600).
- **Color System**: 
  - Admin: Deep Purple (#6750A4) - Professional/Enterprise.
  - Teacher: Indigo/Slate - Productivity/Focus.
  - Student: Vibrant Violet/Gold - Gamified/Engaging.
- **Elevation**: Unified shadow system (Subtle sm, md, lg) with consistent light source (top-down).
- **Rounding**: Standardized `rounded-lg` (8px) for containers, `rounded-xl` (12px) for cards, `rounded-full` for status pills.

## 2. Component Architecture
- **Data Tables**: Sticky headers, row hover states (`bg-surface-container-low`), consistent pagination UI.
- **KPI Cards**: Standardized padding (`p-6`), font weight for metrics (Bold), and trend indicators.
- **Form Layouts**: Floating labels or high-contrast top labels, 2px focus rings (`ring-primary/20`).

## 3. Motion & Interaction (Framer Motion)
- **Transitions**: `duration: 0.2`, `ease: [0.32, 0.72, 0, 1]` for ultra-smooth snaps.
- **Hover**: Scale `1.02` for interactive cards, subtle shift for buttons.
- **Loading**: Pulse shimmer effects with `staggerChildren: 0.1`.

## 4. Responsive Strategy
- **Mobile**: Collapsible sidebars convert to bottom sheets or drawer menus. High-density grids collapse to single columns.
- **Tablet**: Adaptive sidebars (icons-only) to maximize canvas area.

## 5. Accessibility & UX
- **Contrast**: WCAG AAA for body text, AA for headings.
- **Touch Targets**: Minimum 44x44px for mobile interactions.
- **Empty States**: High-quality illustrations with actionable 'Quick Start' CTAs.

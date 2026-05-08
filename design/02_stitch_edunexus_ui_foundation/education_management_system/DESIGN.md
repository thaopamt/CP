---
name: Education Management System
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded8e0'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2fa'
  surface-container: '#f2ecf4'
  surface-container-high: '#ece6ee'
  surface-container-highest: '#e6e0e9'
  on-surface: '#1d1b20'
  on-surface-variant: '#494551'
  inverse-surface: '#322f35'
  inverse-on-surface: '#f5eff7'
  outline: '#7a7582'
  outline-variant: '#cbc4d2'
  surface-tint: '#6750a4'
  primary: '#4f378a'
  on-primary: '#ffffff'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#cfbcff'
  secondary: '#63597c'
  on-secondary: '#ffffff'
  secondary-container: '#e1d4fd'
  on-secondary-container: '#645a7d'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fdf7ff'
  on-background: '#1d1b20'
  surface-variant: '#e6e0e9'
typography:
  display-xl:
    fontFamily: manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: lexend
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  student-card-title:
    fontFamily: lexend
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
---

## Brand & Style
This design system establishes a cohesive framework for a multi-faceted educational ecosystem, tailoring the emotional response to three distinct user archetypes while maintaining a unified DNA of premium, modern SaaS aesthetics.

- **Admin Portal:** Evokes a sense of authority, precision, and institutional reliability. The style is **Minimalist / Corporate**, prioritizing data density and clarity.
- **Teacher Portal:** Designed for high-frequency utility. It balances professional efficiency with a **Warm / Modern** touch to reduce cognitive fatigue during long grading sessions or lesson planning.
- **Student Portal:** Adopts a **Vibrant / Playful** approach. It utilizes elements of **Glassmorphism** and soft tactile surfaces to encourage engagement, exploration, and a sense of progress through gamification.

The overall design language utilizes "soft corners" (radius-lg) to bridge the gap between institutional software and modern consumer apps, ensuring the platform feels approachable yet powerful.

## Colors
The color strategy employs a "Role-Based Palette" system. While the structural neutrals (backgrounds, borders) remain consistent across the platform to ensure a shared codebase, the primary and accent tokens shift based on the portal context.

- **Admin (Indigo/Slate):** Uses deep indigos for primary actions and slate for secondary navigation. This creates a high-contrast, "Enterprise" feel that aids in long-term focus for data management.
- **Teacher (Teal/Gray):** Teal is chosen for its calming yet focused psychological properties. It stands out against neutral grays without being visually aggressive.
- **Student (Violet/Orange/Blue):** A triadic scheme designed for hierarchy. Violet for primary navigation, Orange for "achievements" and urgent notifications, and Blue for learning content.

**Dark Mode:** All themes map to a shared semantic dark palette (Slate-950 background) where primary colors shift to 400-500 weight tints for optimal AAA accessibility and reduced glare.

## Typography
This design system uses a strategic trio of fonts to balance functionality and personality.

1. **Manrope (Headlines):** Used across all portals for a balanced, modern, and professional look. Its geometric nature scales perfectly from large dashboards to mobile headers.
2. **Inter (Body):** The workhorse for the Admin and Teacher portals. Its exceptional legibility and neutral tone make it ideal for dense data and long-form feedback.
3. **Lexend (Labels & Student Content):** Specifically chosen for its roots in reading proficiency. It is used for all UI labels (buttons, tags) and serves as the primary typeface for the Student Portal to enhance accessibility and provide a friendly, athletic energy.

Responsive typography follows a 1.25x scale factor on desktop, moving to a 1.2x scale on mobile devices to preserve screen real estate.

## Layout & Spacing
The system utilizes a **Fluid Grid** approach with strict adherence to an 8px spacing rhythm. 

- **Admin Portal:** Uses a "Compact" density model. Gutters are reduced in data tables to 12px to maximize information density.
- **Teacher Portal:** Uses "Standard" density. Generous 24px vertical spacing between modules to keep the interface feeling organized and breathable.
- **Student Portal:** Uses "Relaxed" density. Increased padding within cards and larger touch targets (minimum 48px height) to accommodate tablets and younger users.

All portals share a 12-column grid. Sidebars are fixed-width (280px for Admin, 240px for Teacher, and a bottom navigation bar or floating dock for Students on mobile).

## Elevation & Depth
Depth is used to signify the importance of interactions and the relationship between parent-child containers.

- **Admin/Teacher Elevation:** Uses **Tonal Layers**. Elements sit on a background (Slate-50), with cards using a white fill and a very subtle 1px border (Slate-200). Shadows are used sparingly—only for "floating" elements like dropdowns and modals—using a soft, low-opacity (4%) neutral tint.
- **Student Elevation:** Uses **Ambient Shadows** and **Glassmorphism**. Cards have a higher blur radius and a subtle drop shadow that matches the card's accent color (e.g., a soft violet shadow under a violet card) to create a "glowing" effect. Translucent backdrops (Blur-md) are used for mobile navigation and overlay panels to maintain context of the vibrant background.

## Shapes
The shape language is consistently rounded to maintain a "Premium SaaS" feel, but the execution varies by context.

- **Admin/Teacher:** Predominantly use `radius-md` for input fields and `radius-lg` for primary containers. This creates a professional, structural look.
- **Student:** Leverages `radius-xl` for cards and navigation elements. The "Pill-shaped" (rounded-full) style is reserved for buttons and progress indicators to lean into the gamified aesthetic.

Interactive components like checkboxes use `radius-sm` in Admin/Teacher views, while they are replaced by larger, `radius-md` circular toggles in the Student view for easier interaction.

## Components
Components are built upon **Shadcn/UI** primitives, enhanced with **Framer Motion** for state transitions.

- **Buttons:** 
  - *Admin/Teacher:* Flat, solid fills with subtle hover states (brightness-95).
  - *Student:* Slight 3D effect using a bottom border-width of 2px (Skeuomorphic touch).
- **Cards:** 
  - *Admin:* Header-less cards with 1px borders for data grouping.
  - *Teacher:* Cards with clear headers and "Quick Action" buttons in the top right.
  - *Student:* Visual-heavy cards with large icons or progress rings.
- **Inputs:** 
  - Use high-contrast focus rings (2px) using the portal’s primary theme color.
- **Progress Indicators (Speciality):** 
  - For students, use thick, rounded progress bars with "Shimmer" animations from Framer Motion when an assignment is completed.
- **Navigation:** 
  - *Admin:* Collapsible side rail with tooltips.
  - *Teacher:* Top navigation with contextual "Classroom" selector.
  - *Student:* Bottom-anchored "Island" navigation for easy thumb access on mobile devices.
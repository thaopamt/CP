# Student Hover Card Design

## 1. Overview
We will implement a social-media style Hover Card for the Student site. When a user hovers over another student's name or avatar (e.g., in the Leaderboard or Class detail page), a card will appear displaying their basic profile info (Avatar, Name, Title, Level, Badges).

## 2. Architecture & Approach
- **Component**: Create a reusable `StudentHoverCard` component in the frontend (`apps/web/src/app/components/` or `@cp/ui`).
- **Triggering**: The component will accept `children` (the avatar or name) and wrap them with `onMouseEnter` and `onMouseLeave` handlers. We will add a 300ms delay before showing the card to avoid flashing when the user quickly moves the mouse across the screen.
- **Animation**: Use `framer-motion` for smooth enter/exit animations (e.g., fade in and slight scale/translate).
- **Data Fetching**: 
  - The component takes basic props like `userId`, `name`, `avatarUrl`.
  - When hovered, if we don't already have the full details, we use React Query (`useQuery`) to fetch the student's gamification profile.
  - Endpoint: We will need a way to get a student's level and badges. We can reuse or create an endpoint like `GET /api/students/:id/profile` or use gamification data.

## 3. UI/UX Details
- **Avatar**: Prominent at the top or left.
- **Name & Title**: Bold name, with their title underneath (e.g., "Beginner", "Master").
- **Stats**: Level and Total Badges displayed clearly.
- **Loading State**: While fetching the detailed data, show a skeleton loader for the stats.

## 4. Components to Modify
- `StudentHoverCard.tsx`: [NEW]
- `LeaderboardPage.tsx`: Wrap `RankRow` avatars/names with `StudentHoverCard`.
- Any other pages displaying student avatars (e.g., `ClassDetailPage.tsx`).

## 5. Open Questions / Ambiguities
- We need to verify if an existing API endpoint returns a student's gamification stats (level, title, badges) by ID. If not, we will add a minimal endpoint in `students.controller.ts` or `gamification.controller.ts`.

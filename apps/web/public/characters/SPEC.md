# Character art spec (chibi 3D, Gunny-style)

All character layers are **full-canvas PNGs** that stack perfectly with zero
positioning code. Drop files here; they're served at `/characters/...`.

## Canvas
- **768×768 px**, PNG, **transparent background** (except backgrounds).
- Character standing front view, neutral pose, arms slightly apart.
- Head center ≈ **22% from top**, feet ≈ **92%**. Body height ≈ 70% of canvas,
  width ≈ 45%, horizontally centered.
- Draw each item **in its final position** on this canvas; everything else
  transparent. Then layers just overlay (`inset-0`).

## Layer order (back → front)
1. `bg/<code>.png` — full-bleed scene (NOT transparent), `object-cover`
2. `wings/<code>.png` — behind shoulders
3. `base/male.png` · `base/female.png` — gendered body (always shown)
4. `outfit/<code>.png` — clothing over the body
5. `pet/<code>.png` — small, bottom-left
6. `hat/<code>.png` — head area (12–30% height)
7. `weapon/<code>.png` — right-hand area

## File naming
`<slot>/<item_code lowercased>.png`, e.g. shop item `HAT_CROWN` →
`hat/hat_crown.png`. Base bodies: `base/male.png`, `base/female.png`.

## Wiring
Add `imageUrl` to the item's `payload` in
`apps/api/src/database/seeds/seed-shop.ts`, keeping `emoji` as fallback:
```ts
payload: { emoji: '👑', imageUrl: '/characters/hat/hat_crown.png' }
```
Re-run `pnpm seed:shop`. Missing images hide gracefully (emoji/nothing).

## Generation prompts
See the approved plan file for the full Midjourney/DALL·E/SDXL prompt set
(style prefix + per-slot templates). Generate the base bodies first, then draw
each item aligned to that pose.

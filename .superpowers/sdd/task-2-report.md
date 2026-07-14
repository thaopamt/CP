### Task 2 Implementer Report

**Status:** Completed

**Changes Implemented:**
1. Modified `apps/api/src/database/seeds/seed-shop.ts` to:
   - Add `isActive` option to `ShopSeed` interface.
   - Seed weekly reward avatars `CHAR_WEEKLY_CHAMPION`, `CHAR_WEEKLY_ELITE`, and `CHAR_WEEKLY_CHALLENGER` with a price of `999999` and relevant details.
   - Fixed the seed script to respect `isActive: it.isActive ?? true` rather than hardcoding `isActive: true`.
2. Modified `apps/api/src/modules/shop/shop.service.ts` to:
   - Filter out items whose codes start with `CHAR_WEEKLY_` from the general catalog returned by `ShopService.getCatalog`.
   - Block direct purchases of weekly avatars in `ShopService.purchase` by throwing a `BadRequestException` if the item code starts with `CHAR_WEEKLY_`.

**Database Seeding Command & Output:**
Command: `tsx --tsconfig tsconfig.base.json apps/api/src/database/seeds/seed-shop.ts`
Result: Successfully executed, creating/updating 3 new weekly reward avatar shop items in `shop_items` table.
Output excerpt:
```
🛒 Seeding gem-shop items…
📂 Database connected.
  🛍️  Shop item created: CHAR_WEEKLY_CHAMPION
  🛍️  Shop item created: CHAR_WEEKLY_ELITE
  🛍️  Shop item created: CHAR_WEEKLY_CHALLENGER
✅ Seeded 67 shop items (3 new).
```

**Build Verification:**
Command: `pnpm nx build api --skip-nx-cache`
Result: Build succeeded with exit code 0.

**Commits Created:**
- Hash: `66040e9`
- Message: `feat: seed weekly avatars and hide them from gem shop catalog`
- Hash: `7153c8b`
- Message: `fix: block direct purchase of weekly avatars and respect seed isActive`

**Test Summary:**
- Build is fully successful. Existing tests in the main branch have unrelated failures on the master branch. No new regressions were introduced.

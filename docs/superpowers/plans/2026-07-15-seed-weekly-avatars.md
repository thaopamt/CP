# Seeding Weekly Avatar Rewards & Filtering Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed three weekly reward avatars in the database and hide them from the general shop catalog in the API.

**Architecture:** Add seed objects into `seed-shop.ts` array `ITEMS` (extending `ShopSeed` interface to allow optional `isActive`). In `ShopService.getCatalog`, filter out catalog items whose `code` starts with `CHAR_WEEKLY_`.

**Tech Stack:** NestJS, TypeScript, TypeORM, tsx

## Global Constraints

- Run all commands from workspace root
- Maintain documentation integrity

---

### Task 1: Modify seed-shop.ts and seed weekly reward avatars

**Files:**
- Modify: `apps/api/src/database/seeds/seed-shop.ts`

**Interfaces:**
- Produces: 3 weekly reward avatar entries in the `ITEMS` array and optional `isActive` in `ShopSeed` interface.

- [ ] **Step 1: Edit `apps/api/src/database/seeds/seed-shop.ts` to add `isActive?: boolean` to `ShopSeed` and add the three objects to `ITEMS`.**
- [ ] **Step 2: Run the seed command to verify it runs successfully.**
  Run: `npx tsx --tsconfig tsconfig.base.json apps/api/src/database/seeds/seed-shop.ts`
  Expected: Command succeeds, database seeds the items.

### Task 2: Hide weekly avatars from shop catalog

**Files:**
- Modify: `apps/api/src/modules/shop/shop.service.ts`

- [ ] **Step 1: Filter out items starting with `CHAR_WEEKLY_` in `ShopService.getCatalog`.**
- [ ] **Step 2: Run build to verify types and compilation.**
  Run: `pnpm nx build api --skip-nx-cache`
  Expected: Build succeeds with code 0.

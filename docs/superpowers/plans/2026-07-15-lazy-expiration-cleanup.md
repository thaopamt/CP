# Lazy Expiration Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement lazy expiration cleanup logic for student inventory items when catalog, inventory, or profile is retrieved.

**Architecture:** 
1. Implement a database transaction-backed cleanup helper in `ShopService` that deletes expired student inventory items and dynamically clears related cosmetics from `StudentProfile` and `User.avatarUrl` if they were equipped.
2. Call this helper in `ShopService` before catalog and inventory are queried.
3. Re-use or replicate the same logic inside `StudentsService` to clean up expired items when a student's profile is loaded.
4. Ensure caching tags are invalidated correctly to reflect the changes immediately.

**Tech Stack:** NestJS, TypeORM, PostgreSQL

## Global Constraints
- Clean up expired items where `expiresAt < new Date()`.
- Unequip and remove cosmetic values (theme, nameColor, title) from `StudentProfile` if equipped item expired.
- Reset `User.avatarUrl = null` if equipped character expired.
- Delete expired inventory rows from DB.
- Invalid caches (`student:${userId}:profile`, `student:${userId}:shop`, etc.).

---

### Task 1: Add StudentInventory to StudentsModule and Inject into StudentsService

**Files:**
- Modify: [students.module.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/students/students.module.ts)
- Modify: [students.service.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/students/students.service.ts)
- Modify: [students.service.spec.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/students/students.service.spec.ts)

**Interfaces:**
- Consumes: `StudentInventory` entity.
- Produces: Injectable `inventory` repository in `StudentsService`.

- [x] **Step 1: Import StudentInventory and add to TypeOrmModule.forFeature in students.module.ts**
- [x] **Step 2: Inject Repository<StudentInventory> into StudentsService constructor**
- [x] **Step 3: Update students.service.spec.ts makeService factory to supply mock inventory repository to the constructor**
- [x] **Step 4: Run tests to verify the constructor changes didn't break existing tests**

### Task 2: Implement cleanupExpiredInventory in ShopService and Hook Into Catalog/Inventory APIs

**Files:**
- Modify: [shop.service.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/shop/shop.service.ts)

**Interfaces:**
- Produces: `cleanupExpiredInventory(userId: string): Promise<void>` in `ShopService`

- [x] **Step 1: Import LessThan in shop.service.ts**
- [x] **Step 2: Add cleanupExpiredInventory(userId: string): Promise<void> helper method to ShopService**
- [x] **Step 3: Call cleanupExpiredInventory at start of getCatalog(userId)**
- [x] **Step 4: Call cleanupExpiredInventory at start of getInventory(userId)**

### Task 3: Implement cleanupExpiredInventory in StudentsService and Hook Into getStudentByUserId

**Files:**
- Modify: [students.service.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/students/students.service.ts)

**Interfaces:**
- Produces: `cleanupExpiredInventory(userId: string): Promise<void>` in `StudentsService`

- [x] **Step 1: Import LessThan and ShopItemCategory in students.service.ts**
- [x] **Step 2: Add cleanupExpiredInventory(userId: string): Promise<void> helper method to StudentsService**
- [x] **Step 3: Call cleanupExpiredInventory at start of getStudentByUserId(userId)**

### Task 4: Fix Existing Broken Tests and Add Tests for Lazy Expiration Cleanup

**Files:**
- Modify: [students.service.spec.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/students/students.service.spec.ts)
- Modify: [students.controller.spec.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/students/students.controller.spec.ts)
- Modify: [auth.service.spec.ts](file:///Users/thaopamt/Desktop/Personal/CP_System/apps/api/src/modules/auth/auth.service.spec.ts)

- [x] **Step 1: Fix expectations in blockStudent and unblockStudent tests in students.service.spec.ts**
- [x] **Step 2: Fix expect message in auth.service.spec.ts**
- [x] **Step 3: Fix mock expectations in students.controller.spec.ts**
- [x] **Step 4: Add tests for cleanupExpiredInventory inside students.service.spec.ts**
- [x] **Step 5: Run all tests to verify everything passes**

### Task 5: Build Verification and Commits

- [x] **Step 1: Build project with `pnpm nx build api`**
- [x] **Step 2: Commit changes to Git**
- [x] **Step 3: Save implementer report to `task-3-report.md`**

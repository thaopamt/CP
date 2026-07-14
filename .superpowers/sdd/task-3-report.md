# Task 3 Implementer Report: Lazy Expiration Cleanup

## Summary of Changes
Centralized lazy expiration cleanup logic inside `ShopService` to resolve concurrency risks and code duplication.

1. **Centralized Cleanup in `ShopService` (`apps/api/src/modules/shop/shop.service.ts`)**:
   - Centralized all lazy expiration cleanup logic inside `ShopService.cleanupExpiredInventory(userId)`.
   - Modified `cleanupExpiredInventory` to run the database query *inside* the transaction block with a `pessimistic_write` lock to prevent concurrent delete races and serialise concurrent executions.
   - Cleans up expired items, unequips them, resets the profile appearance fields if the expired item is equipped, and invalidates caches with tag-based invalidation.

2. **Deduplication in `StudentsModule` & `StudentsService`**:
   - Imported `ShopModule` in `apps/api/src/modules/students/students.module.ts` and removed `StudentInventory` from `TypeOrmModule.forFeature` in `StudentsModule`.
   - Removed the injected `StudentInventory` repository in `StudentsService` constructor and injected `ShopService` instead.
   - Removed `StudentsService.cleanupExpiredInventory` entirely.
   - Updated `StudentsService.getStudentByUserId` to delegate to `await this.shopService.cleanupExpiredInventory(userId)`.

3. **Unit Tests**:
   - Created a new test suite in `apps/api/src/modules/shop/shop.service.spec.ts` that thoroughly tests `ShopService.cleanupExpiredInventory` for database cleanup, unequip behavior, cache invalidation, and `pessimistic_write` query lock execution.
   - Cleaned up the mocks and tests in `students.service.spec.ts`, replacing direct `StudentInventory` mock setup with a mock of `ShopService`. Verified that `getStudentByUserId` correctly triggers `shopService.cleanupExpiredInventory(userId)`.

## Verification Evidence
- **Build**: Successfully executed `pnpm nx build api` (exit code 0).
- **Tests**: Ran all 17 test suites via `pnpm nx test api` and all 112 tests passed successfully.

## Commits Created
- `acafa36`: `feat: implement lazy expiration cleanup for reward items`
- *Latest refactor*: `refactor: centralize lazy expiration cleanup in ShopService and remove code duplication`

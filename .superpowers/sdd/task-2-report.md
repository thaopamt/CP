# Task 2 Report: Quest Assignment Reset and Already-Solved Safeguards

## Status
- Completed

## TDD Evidence

### RED
- Command:
  - `pnpm nx test api --testFile=apps/api/src/modules/quests/quests.service.spec.ts`
- First output summary:
  - Failed at compile time with `TS2307: Cannot find module '@nestjs/testing'`.
  - Mechanical adjustment made per brief allowance: replaced the `@nestjs/testing` module bootstrap in the new spec with direct `new QuestsService(...)` construction so the test could exercise behavior instead of missing test-harness dependencies.
- Second output summary:
  - Failed for the expected product reason.
  - `creates a new BIWEEKLY quest row for the current global two-week period and expires the stale row` expected `periodKey: "2026-B15"` but received `periodKey: "static"`.
  - The two `alreadySolved: true` safeguard tests passed in RED, confirming that existing no-op behavior was already present and preserved.

### GREEN
- Command:
  - `pnpm nx test api --testFile=apps/api/src/modules/quests/quests.service.spec.ts`
- Output summary:
  - PASS
  - Test Suites: `1 passed`
  - Tests: `3 passed`

## Files Changed
- `apps/api/src/modules/quests/quests.service.spec.ts`
- `apps/api/src/modules/quests/quests.service.ts`

## Implementation Summary
- Added focused `QuestsService` tests for:
  - BIWEEKLY assignment using the current global two-week period key.
  - Expiring stale recurring rows by each quest's current recurrence period.
  - Preserving `alreadySolved: true` no-op behavior for coding and maze acceptance.
- Updated `QuestsService` to:
  - Use Task 1 centralized helpers via `questPeriodKey(recurrence, now)`.
  - Use shared `dayKey(...)` in streak updates.
  - Expire stale recurring rows by comparing each row against that quest's current period key instead of only daily/weekly global checks.

## Commit Created
- `0709c36` - `fix: reset quest rows by recurrence period`

## Self-Review
- Scope stayed within the two owned quest files for production/test code.
- The service change is minimal and aligned with the brief: no seed, UI, or unrelated quest behavior was touched.
- The new stale-expiry logic now supports any recurrence covered by `questPeriodKey`, including Task 1's `BIWEEKLY`.
- The spec intentionally uses direct service construction because this repo's current API test environment does not resolve `@nestjs/testing`.

## Concerns
- None.

## Review Follow-up

### RED
- Added assertions to the existing duplicate-solve tests that `alreadySolved: true` must not call:
  - `badges.evaluateAndAward`
  - `cache.bumpTags`
  - `studentQuestRepo.save`
  - `profileRepo.save`
- First targeted run failed as expected because `badges.evaluateAndAward` was still invoked once for each already-solved event.

### GREEN
- Added a minimal early return at the top of `QuestsService.handleEvent()` for `event.alreadySolved`.
- Re-ran:
  - `pnpm nx test api --testFile=apps/api/src/modules/quests/quests.service.spec.ts`
- Result:
  - PASS
  - Test Suites: `1 passed`
  - Tests: `3 passed`

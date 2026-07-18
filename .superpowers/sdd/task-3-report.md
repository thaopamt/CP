# Task 3 Report: Web — Pure Impersonation Helpers

## TDD Evidence

### RED (Tests Fail)
Command:
```bash
pnpm vitest run apps/web/src/app/lib/impersonation.spec.ts
```

Output:
```
❯ apps/web/src/app/lib/impersonation.spec.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯

FAIL  apps/web/src/app/lib/impersonation.spec.ts
Error: Failed to load url ./impersonation (resolved id: ./impersonation) in 
/Users/thaopamt/Desktop/Personal/CP_System/apps/web/src/app/lib/impersonation.spec.ts. 
Does the file exist?
```

### GREEN (Tests Pass)
Command:
```bash
pnpm vitest run apps/web/src/app/lib/impersonation.spec.ts
```

Output:
```
✓ apps/web/src/app/lib/impersonation.spec.ts (9 tests) 2ms

Test Files  1 passed (1)
     Tests  9 passed (9)
  Start at  09:50:50
  Duration  214ms (transform 23ms, setup 22ms, collect 22ms, tests 2ms)
```

Test summary:
- ✓ isImpersonationTab: 3 tests (route detection, flag detection, normal admin tab)
- ✓ message validation: 5 tests (ready & handoff message origin/source/type checks)
- ✓ exitImpersonation: 1 test (cleanup and close)

## Files Changed

Created (2 new files):
- `apps/web/src/app/lib/impersonation.ts` — Pure helpers module (48 lines)
- `apps/web/src/app/lib/impersonation.spec.ts` — Unit tests (71 lines)

## Implementation Details

### Exports

1. **Constants:**
   - `IMPERSONATION_FLAG = 'cp.impersonating'` — sessionStorage key to mark impersonation tabs
   - `READY_TYPE = 'cp-impersonation-ready'` — handoff tab's initial announcement message type
   - `HANDOFF_TYPE = 'cp-impersonation'` — admin tab's auth session handoff message type

2. **Functions:**
   - `isImpersonationTab(pathname, storage)` — Detects if a tab is in impersonation mode via pathname `/impersonate` or flag in storage
   - `isReadyMessage(e, expectedOrigin, expectedSource)` — Validates that a postMessage event is from the expected origin/source with READY_TYPE
   - `isValidHandoffMessage(e, expectedOrigin, expectedSource)` — Validates handoff messages with origin/source/type guards
   - `exitImpersonation(win, authStoreKey)` — Clears both IMPERSONATION_FLAG and auth keys from sessionStorage, then closes the window

### Design Rationale

- **Pure functions:** All helpers are stateless and accept parameters (no window globals), making them fully testable without jsdom or fixtures
- **Message validation:** Both origin and source checks prevent message injection attacks; type checks prevent message confusion
- **SessionStorage isolation:** Impersonation sessions use `sessionStorage` (per-tab) instead of `localStorage` to prevent overwriting the admin's session
- **Early exits:** The `isImpersonationTab` check on `/impersonate` route allows the handoff tab to announce readiness immediately
- **Minimal interface:** `Pick<Storage, 'getItem'>` and `IncomingMessage` types are minimal to allow testing with mock objects

## Self-Review

### YAGNI (You Aren't Gonna Need It)
- No over-engineered error handling; validators return booleans, not exceptions
- No unused exports or helper functions
- No logging or side effects in pure functions
- No React-specific code (pure TS only)

### Names & Clarity
- Constant names are descriptive (e.g., `IMPERSONATION_FLAG`, `READY_TYPE`)
- Function names are action-oriented (`isXxx` for booleans, `exitXxx` for actions)
- `messageType()` is a private helper to avoid duplication in validation functions
- Comments explain the broader context (postMessage security, sessionStorage choice)

### Test Hygiene
- All 9 test cases pass, covering happy paths and rejection cases
- Tests are isolated (no shared mocks between suites)
- Mock objects in tests are minimal (only what's needed)
- Test messages are descriptive (e.g., "rejects a ready message from a wrong origin")
- Vitest conventions followed (import from 'vitest', use vi.fn())

## Commit

Commit SHA: `c44972c`
Message: `feat(web): add pure impersonation helpers (tab detection, message guards)`

## Fix: per-function guard negative tests

**Issue:** Review finding — message validation block had collective coverage only across two functions; missing per-function negative-path tests.

**Fix:** Added three `it(...)` blocks to `describe('message validation', ...)` in `impersonation.spec.ts`:
- `isReadyMessage` rejects wrong source
- `isReadyMessage` rejects wrong type
- `isValidHandoffMessage` rejects wrong origin

**Command:**
```bash
pnpm vitest run apps/web/src/app/lib/impersonation.spec.ts
```

**Output:**
```
✓ apps/web/src/app/lib/impersonation.spec.ts (12 tests) 2ms

Test Files  1 passed (1)
     Tests  12 passed (12)
  Start at  09:55:56
  Duration  214ms (transform 24ms, setup 0ms, collect 22ms, tests 2ms, environment 0ms, prepare 48ms)
```

**Commit SHA:** `0038a06`  
**Message:** `test(web): per-function negative-path coverage for impersonation message guards`

---

**Status:** DONE  
All 12 tests passing (9 original + 3 new). Per-function negative-path coverage complete. Ready for downstream tasks.

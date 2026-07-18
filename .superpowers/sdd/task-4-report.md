# Task 4 Report: Web — impersonation-aware auth store

## Status: DONE

## What changed

Replaced `apps/web/src/app/stores/auth.store.ts` verbatim with the content specified in
`.superpowers/sdd/task-4-brief.md` (Step 1). No deviation from the brief's code.

Summary of the diff (full diff shown further below):
- Added import of `IMPERSONATION_FLAG` and `isImpersonationTab` from `../lib/impersonation`
  (Task 3's lib — verified the exports exist and match the expected signatures before editing:
  `IMPERSONATION_FLAG = 'cp.impersonating'`, `isImpersonationTab(pathname, storage): boolean`).
- `AuthState` interface gained `isImpersonating: boolean` and
  `startImpersonation: (accessToken: string, user: IUser) => void`. All previously existing
  members (`accessToken`, `refreshToken`, `user`, `isHydrated`, `setSession`, `setTokens`,
  `updateUser`, `clear`, `hasRole`, `setHydrated`) are unchanged in name and signature.
- Added a module-load-time `impersonationTab` boolean (SSR-guarded via `typeof window !==
  'undefined'`) and an `authStorage` selection: `localStorage` under SSR, `sessionStorage` when
  `impersonationTab` is true, `localStorage` otherwise (unchanged behavior for normal tabs).
- `createJSONStorage(() => localStorage)` → `createJSONStorage(() => authStorage)`.
- New store field `isImpersonating: impersonationTab` (initial value from module load).
- New `startImpersonation` action: sets the `cp.impersonating` sessionStorage flag and calls
  `set({ accessToken, refreshToken: null, user, isImpersonating: true })`.
- `partialize` unchanged: `{ accessToken, refreshToken, user }` — still excludes `isHydrated`
  and `isImpersonating` from persisted state (both are derived per-tab, not persisted).

## Build verification

Command: `pnpm nx build web`

Ran it with output piped to a scratchpad log to check the exit code explicitly:

```
$ pnpm nx build web > scratchpad/build_out.txt 2>&1; echo "EXIT_CODE=$?"
EXIT_CODE=0
$ grep -iE "error|Successfully ran" scratchpad/build_out.txt
 NX   Successfully ran target build for project web and 1 task it depends on
```

Relevant output lines:
```
✓ built in 5.88s
 NX   Successfully ran target build for project web and 1 task it depends on
Nx read the output from the cache instead of running the command for 1 out of 2 tasks.
```

**Interpretation:** Exit code 0, "Successfully ran target build" present, and — unlike what the
task note anticipated — there were **zero TypeScript errors of any kind**, not even
pre-existing/unrelated ones. The only non-empty output besides the asset manifest was Vite's
standard "chunk larger than 500 kB" size-warning (about `FinancePage`, `blocks`, and the main
`index` bundle), which is a bundling-size advisory, not a TS/build error, and is unrelated to
this change. So this is a clean pass, not a "pre-existing baseline errors" case — there was
nothing to triage or attribute.

## Files changed

- `apps/web/src/app/stores/auth.store.ts` (modified, committed — commit `8171081`)

Note: `git status` at the start of this task also showed `.superpowers/sdd/task-2-report.md` and
`.superpowers/sdd/task-3-report.md` as modified (leftover from earlier tasks in this session,
not touched by me). I deliberately staged and committed only `auth.store.ts`, per the brief's
Step 3 instructions, leaving those two files untouched/uncommitted. Also note this
`task-4-report.md` file previously contained an unrelated stale report (from an earlier,
differently-scoped "Task 4: Weekly Finalization Logic" work item that reused this filename) —
it has been overwritten with this report for the current impersonation-store task.

## Self-review

- **All existing methods/behavior preserved for normal (non-impersonation) tabs?** Yes.
  `setSession`, `setTokens`, `updateUser`, `clear`, `hasRole`, `setHydrated` are byte-identical
  to before. For a normal tab, `impersonationTab` evaluates to `false` (pathname doesn't start
  with `/impersonate` and `sessionStorage` doesn't carry the flag), so `authStorage` resolves to
  `window.localStorage` exactly as before — persistence target and storage key
  (`STORAGE_KEYS.authStore = 'cp.auth'`) are unchanged for the common case.
- **Does `partialize` still exclude `isImpersonating`/`isHydrated`?** Yes — `partialize` only
  picks `accessToken`, `refreshToken`, `user`, matching the brief exactly. Both `isHydrated` and
  `isImpersonating` remain derived/session-local state, never written to storage.
- **Is the SSR guard `typeof window` correct?** Yes, used consistently in two places:
  `impersonationTab` computation (`typeof window !== 'undefined' && isImpersonationTab(...)`)
  and `authStorage` selection (`typeof window === 'undefined' ? localStorage : ...`). Under SSR,
  `impersonationTab` short-circuits to `false` and `authStorage` falls back to the bare
  `localStorage` reference (not `window.localStorage`) — matches the brief verbatim; this file
  doesn't appear to run in an actual SSR context (Vite SPA), but the guard is defensive and
  matches the original file's existing pattern (which had no window-access guard needed since it
  called plain `localStorage` directly).
- **Do interfaces from Task 3 line up?** Confirmed by reading
  `apps/web/src/app/lib/impersonation.ts`: it exports `IMPERSONATION_FLAG` (string constant) and
  `isImpersonationTab(pathname: string, storage: Pick<Storage, 'getItem'>): boolean` — both used
  exactly as imported, no type mismatches.
- **Consumer impact:** Confirmed via grep that ~24 files import `useAuthStore` (AuthProvider,
  RoleGuard, LoginPage, layouts, hooks, various pages). Since the interface change is additive
  only (new fields/action, no removed or changed signatures), none of those needed changes, and
  the successful build (which typechecks all consumers via Vite/tsc) confirms no breakage.

No further action needed; task complete as specified in the brief.

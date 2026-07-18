# Admin Impersonate-Student Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an ADMIN log into ("impersonate") a student account in a new browser tab, with full student access, while keeping the admin's own session alive in the original tab.

**Architecture:** A new ADMIN-only endpoint mints an **access-only** JWT for the target student carrying an `impersonatedBy` claim (no refresh token, so the student's real `refreshTokenHash` is never touched). The admin tab opens a `/impersonate` handoff tab and passes the token via `postMessage` (never on the URL). The handoff tab persists its session in **`sessionStorage`** (per-tab, isolated) instead of the shared `localStorage`, so both sessions coexist. A banner marks the impersonation tab and offers "Thoát".

**Tech Stack:** NestJS + `@nestjs/jwt` + Passport-JWT + TypeORM (`apps/api`); React + Vite + React Router + Zustand + TanStack Query (`apps/web`); shared types in `libs/shared`; Jest for tests; pnpm + Nx.

## Global Constraints

- **No new refresh token for impersonation.** The impersonation flow signs an access token only and MUST NOT call `updateRefreshTokenHash` — the student has a single `refreshTokenHash` slot shared with their real login.
- **Only ADMIN** can impersonate. Backend guards with `@Roles(UserRole.ADMIN)`; the UI button is gated `base === '/admin'`.
- **Only STUDENT accounts** can be targeted. Reject non-student and inactive targets on the backend.
- **Token never on the URL.** Handoff is `postMessage` only, origin- and source-checked on both ends.
- **Impersonation session lives in `sessionStorage`**, keyed the same as the normal store (`cp.auth`), plus a flag `cp.impersonating='1'`. Never write the impersonation session to `localStorage`.
- **No DB schema change** ⇒ no migration. `JwtPayload.impersonatedBy` is a token-only claim.
- Access-token lifetime for impersonation = env `JWT_IMPERSONATION_EXPIRES_IN` (default `1d`).
- Message contract: ready type = `cp-impersonation-ready` (handoff→opener), handoff type = `cp-impersonation` (opener→handoff, payload `{ accessToken, user }`).

---

## File Structure

**Backend (`apps/api`)**
- `libs/shared/src/lib/auth.types.ts` — add `impersonatedBy?` to `JwtPayload`.
- `apps/api/src/modules/auth/auth.service.ts` — add `generateImpersonationToken()`.
- `apps/api/src/modules/auth/auth.service.spec.ts` — new tests for the method.
- `apps/api/src/modules/students/students.controller.ts` — add `POST :id/impersonate`, inject `AuthService`.
- `apps/api/src/modules/students/students.controller.spec.ts` — **new** controller test.
- `apps/api/src/modules/students/students.module.ts` — import `AuthModule`.
- `.env.example` — document `JWT_IMPERSONATION_EXPIRES_IN`.

**Frontend (`apps/web`)**
- `apps/web/src/app/lib/impersonation.ts` — **new** pure helpers + constants.
- `apps/web/src/app/lib/impersonation.spec.ts` — **new** unit tests.
- `apps/web/src/app/stores/auth.store.ts` — impersonation-aware storage + `startImpersonation` + `isImpersonating`.
- `apps/web/src/app/api/students.api.ts` — add `impersonate()`.
- `apps/web/src/app/hooks/useImpersonateStudent.ts` — **new** orchestration hook.
- `apps/web/src/app/pages/ImpersonationHandoffPage.tsx` — **new** handoff page.
- `apps/web/src/app/components/ImpersonationBanner.tsx` — **new** banner.
- `apps/web/src/app/App.tsx` — add `/impersonate` route + mount banner.
- `apps/web/src/app/pages/admin/students/StudentProfilePage.tsx` — add the trigger button.

---

## Task 1: Backend — mint impersonation access token

**Files:**
- Modify: `libs/shared/src/lib/auth.types.ts:36-42`
- Modify: `apps/api/src/modules/auth/auth.service.ts:5` (import) and add method after `login()`
- Test: `apps/api/src/modules/auth/auth.service.spec.ts` (append a `describe`)
- Modify: `.env.example`

**Interfaces:**
- Produces: `AuthService.generateImpersonationToken(studentUserId: string, adminId: string): Promise<{ accessToken: string; user: IUser }>` — loads the target via `this.users.findActiveById`, rejects missing/inactive (`NotFoundException`) and non-STUDENT (`ForbiddenException`), signs an access-only JWT with `impersonatedBy`.
- Consumes: existing `UsersService.findActiveById(id): Promise<User | null>`, `JwtService.signAsync`, `ConfigService.get`, private `AuthService.serializeUser`.

- [ ] **Step 1: Add the `impersonatedBy` claim to the shared payload**

In `libs/shared/src/lib/auth.types.ts`, change the `JwtPayload` interface to:

```ts
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Present only on tokens minted by admin impersonation; the admin's user id. */
  impersonatedBy?: string;
  iat?: number;
  exp?: number;
}
```

- [ ] **Step 2: Write the failing tests**

Append to `apps/api/src/modules/auth/auth.service.spec.ts`:

```ts
import { NotFoundException } from '@nestjs/common';

describe('AuthService.generateImpersonationToken', () => {
  const buildUser = (over: Record<string, unknown> = {}) => ({
    id: 'stu-1',
    email: 'student@example.com',
    username: null,
    firstName: 'A',
    lastName: 'Student',
    role: UserRole.STUDENT,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date('2026-07-12T00:00:00.000Z'),
    updatedAt: new Date('2026-07-12T00:00:00.000Z'),
    ...over,
  });

  it('signs an access token with the impersonatedBy claim and no refresh token', async () => {
    const users = {
      findActiveById: jest.fn().mockResolvedValue(buildUser()),
      updateRefreshTokenHash: jest.fn(),
    } as unknown as UsersService;
    const jwt = { signAsync: jest.fn().mockResolvedValue('access-jwt') } as unknown as JwtService;
    const config = {
      get: jest.fn().mockReturnValue('1d'),
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    const result = await service.generateImpersonationToken('stu-1', 'admin-9');

    expect(result.accessToken).toBe('access-jwt');
    expect(result.user.id).toBe('stu-1');
    expect((jwt.signAsync as jest.Mock)).toHaveBeenCalledTimes(1);
    const [payload, opts] = (jwt.signAsync as jest.Mock).mock.calls[0];
    expect(payload).toMatchObject({ sub: 'stu-1', role: UserRole.STUDENT, impersonatedBy: 'admin-9' });
    expect(opts).toMatchObject({ expiresIn: '1d' });
    expect((users.updateRefreshTokenHash as jest.Mock)).not.toHaveBeenCalled();
  });

  it('rejects when the target user is missing or inactive', async () => {
    const users = { findActiveById: jest.fn().mockResolvedValue(null) } as unknown as UsersService;
    const jwt = { signAsync: jest.fn() } as unknown as JwtService;
    const config = { get: jest.fn(), getOrThrow: jest.fn() } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    await expect(service.generateImpersonationToken('stu-x', 'admin-9')).rejects.toBeInstanceOf(NotFoundException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects impersonating a non-student account', async () => {
    const users = {
      findActiveById: jest.fn().mockResolvedValue(buildUser({ role: UserRole.TEACHER })),
    } as unknown as UsersService;
    const jwt = { signAsync: jest.fn() } as unknown as JwtService;
    const config = { get: jest.fn(), getOrThrow: jest.fn() } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    await expect(service.generateImpersonationToken('tea-1', 'admin-9')).rejects.toBeInstanceOf(ForbiddenException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm nx test api --testPathPattern=auth.service.spec`
Expected: FAIL — `service.generateImpersonationToken is not a function`.

- [ ] **Step 4: Implement the method**

In `apps/api/src/modules/auth/auth.service.ts`, extend the `@cp/shared` import (line 5) to include `UserRole`:

```ts
import { IUser, JwtPayload, LoginResponse, UserRole } from '@cp/shared';
```

Add this method to the `AuthService` class (e.g. directly after `login()`):

```ts
async generateImpersonationToken(
  studentUserId: string,
  adminId: string,
): Promise<{ accessToken: string; user: IUser }> {
  const user = await this.users.findActiveById(studentUserId);
  if (!user) {
    throw new NotFoundException(`Student ${studentUserId} not found or inactive`);
  }
  if (user.role !== UserRole.STUDENT) {
    throw new ForbiddenException('Only student accounts can be impersonated');
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    impersonatedBy: adminId,
  };

  // Access token only — never issue/store a refresh token here, or we would
  // clobber the student's single refreshTokenHash slot and break their login.
  const accessToken = await this.jwt.signAsync(payload, {
    expiresIn: this.config.get<string>('JWT_IMPERSONATION_EXPIRES_IN') ?? '1d',
  });

  return { accessToken, user: this.serializeUser(user) };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test api --testPathPattern=auth.service.spec`
Expected: PASS (4 tests: the existing refresh test + 3 new).

- [ ] **Step 6: Document the env var**

Add to `.env.example` near the other JWT vars (after `JWT_REFRESH_EXPIRES_IN`):

```
# Lifetime of the access token minted when an admin impersonates a student.
JWT_IMPERSONATION_EXPIRES_IN=1d
```

- [ ] **Step 7: Commit**

```bash
git add libs/shared/src/lib/auth.types.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.spec.ts .env.example
git commit -m "feat(api): mint access-only impersonation token with impersonatedBy claim"
```

---

## Task 2: Backend — expose `POST /students/:id/impersonate`

**Files:**
- Modify: `apps/api/src/modules/students/students.module.ts:18-34` (imports)
- Modify: `apps/api/src/modules/students/students.controller.ts` (constructor + new route)
- Test: `apps/api/src/modules/students/students.controller.spec.ts` (**new**)

**Interfaces:**
- Consumes: `StudentsService.getProfileById(id): Promise<StudentProfile>` (has `.userId`); `AuthService.generateImpersonationToken` from Task 1; `@CurrentUser()` yields `JwtPayload` (admin, `.sub`).
- Produces: `POST /api/students/:id/impersonate` (ADMIN) → `{ accessToken: string; user: IUser }`.

- [ ] **Step 1: Write the failing controller test**

Create `apps/api/src/modules/students/students.controller.spec.ts`:

```ts
import { StudentsController } from './students.controller';

describe('StudentsController.impersonate', () => {
  it('resolves the profile then mints an impersonation token for its user', async () => {
    const service = {
      getProfileById: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }),
    } as any;
    const auth = {
      generateImpersonationToken: jest.fn().mockResolvedValue({ accessToken: 'tok', user: { id: 'u1' } }),
    } as any;
    const controller = new StudentsController(service, {} as any, auth);

    const result = await controller.impersonate('p1', { sub: 'admin-1' } as any);

    expect(service.getProfileById).toHaveBeenCalledWith('p1');
    expect(auth.generateImpersonationToken).toHaveBeenCalledWith('u1', 'admin-1');
    expect(result).toEqual({ accessToken: 'tok', user: { id: 'u1' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test api --testPathPattern=students.controller.spec`
Expected: FAIL — constructor arity / `controller.impersonate is not a function`.

- [ ] **Step 3: Import AuthModule into StudentsModule**

In `apps/api/src/modules/students/students.module.ts`, add the import at top:

```ts
import { AuthModule } from '../auth/auth.module';
```

and add `AuthModule` to the module `imports` array (after `QuestsModule`):

```ts
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      Guardian,
      User,
      StudentSchedule,
      ClassEntity,
      Enrollment,
      TeacherStudent,
    ]),
    ShopModule,
    QuestsModule,
    AuthModule,
  ],
```

(No cycle: `AuthModule → UsersModule`, and `UsersModule` imports nothing back. If Nest ever reports a cycle, wrap as `forwardRef(() => AuthModule)` and inject `@Inject(forwardRef(() => AuthService))` — not expected here.)

- [ ] **Step 4: Inject AuthService and add the route**

In `apps/api/src/modules/students/students.controller.ts`:

Add the import:

```ts
import { AuthService } from '../auth/auth.service';
```

Extend the constructor to inject `AuthService`:

```ts
  constructor(
    public service: StudentsService,
    private readonly assignments: TeacherAssignmentsService,
    private readonly auth: AuthService,
  ) {}
```

Add the route (e.g. after `unblockStudent`, before `getStudentHeatmap`):

```ts
  @Roles(UserRole.ADMIN)
  @Post(':id/impersonate')
  async impersonate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() admin: JwtPayload,
  ): Promise<{ accessToken: string; user: import('@cp/shared').IUser }> {
    const profile = await this.service.getProfileById(id);
    return this.auth.generateImpersonationToken(profile.userId, admin.sub);
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test api --testPathPattern=students.controller.spec`
Expected: PASS.

- [ ] **Step 6: Verify the API still boots / builds**

Run: `pnpm nx build api`
Expected: build succeeds (confirms the AuthModule wiring has no DI/cycle error).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/students/students.controller.ts apps/api/src/modules/students/students.controller.spec.ts apps/api/src/modules/students/students.module.ts
git commit -m "feat(api): add ADMIN POST /students/:id/impersonate endpoint"
```

---

## Task 3: Web — pure impersonation helpers

**Files:**
- Create: `apps/web/src/app/lib/impersonation.ts`
- Test: `apps/web/src/app/lib/impersonation.spec.ts`

**Interfaces:**
- Produces:
  - `IMPERSONATION_FLAG = 'cp.impersonating'`
  - `READY_TYPE = 'cp-impersonation-ready'`, `HANDOFF_TYPE = 'cp-impersonation'`
  - `isImpersonationTab(pathname: string, storage: Pick<Storage,'getItem'>): boolean`
  - `isReadyMessage(e, expectedOrigin, expectedSource): boolean`
  - `isValidHandoffMessage(e, expectedOrigin, expectedSource): boolean`
  - `exitImpersonation(win: Window, authStoreKey: string): void`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/app/lib/impersonation.spec.ts`:

```ts
import {
  IMPERSONATION_FLAG,
  READY_TYPE,
  HANDOFF_TYPE,
  isImpersonationTab,
  isReadyMessage,
  isValidHandoffMessage,
  exitImpersonation,
} from './impersonation';

const store = (v: Record<string, string> = {}) => ({ getItem: (k: string) => v[k] ?? null });

describe('isImpersonationTab', () => {
  it('is true on the /impersonate handoff route', () => {
    expect(isImpersonationTab('/impersonate', store())).toBe(true);
  });
  it('is true once the flag is set (e.g. after redirect to /student)', () => {
    expect(isImpersonationTab('/student', store({ [IMPERSONATION_FLAG]: '1' }))).toBe(true);
  });
  it('is false for a normal admin tab', () => {
    expect(isImpersonationTab('/admin/students', store())).toBe(false);
  });
});

describe('message validation', () => {
  const opener = {} as unknown;
  it('accepts a well-formed ready message from the expected source', () => {
    expect(isReadyMessage({ origin: 'https://a', source: opener, data: { type: READY_TYPE } }, 'https://a', opener)).toBe(true);
  });
  it('rejects a ready message from a wrong origin', () => {
    expect(isReadyMessage({ origin: 'https://evil', source: opener, data: { type: READY_TYPE } }, 'https://a', opener)).toBe(false);
  });
  it('accepts a well-formed handoff message', () => {
    expect(isValidHandoffMessage({ origin: 'https://a', source: opener, data: { type: HANDOFF_TYPE, accessToken: 't' } }, 'https://a', opener)).toBe(true);
  });
  it('rejects a handoff message from a wrong source', () => {
    expect(isValidHandoffMessage({ origin: 'https://a', source: {}, data: { type: HANDOFF_TYPE } }, 'https://a', opener)).toBe(false);
  });
  it('rejects a message with the wrong type', () => {
    expect(isValidHandoffMessage({ origin: 'https://a', source: opener, data: { type: 'nope' } }, 'https://a', opener)).toBe(false);
  });
});

describe('exitImpersonation', () => {
  it('clears the flag and the auth store key, then closes the window', () => {
    const removed: string[] = [];
    const win = {
      sessionStorage: { removeItem: (k: string) => removed.push(k) },
      close: jest.fn(),
    } as unknown as Window;

    exitImpersonation(win, 'cp.auth');

    expect(removed).toContain(IMPERSONATION_FLAG);
    expect(removed).toContain('cp.auth');
    expect((win.close as jest.Mock)).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test web --testPathPattern=impersonation.spec`
Expected: FAIL — cannot find module `./impersonation`.

- [ ] **Step 3: Implement the helpers**

Create `apps/web/src/app/lib/impersonation.ts`:

```ts
/**
 * Pure helpers for admin→student impersonation.
 *
 * The impersonation tab keeps its session in sessionStorage (per-tab) so it
 * never overwrites the admin's localStorage session. The access token is
 * handed from the admin tab to the /impersonate tab via postMessage — never
 * on the URL — so both ends validate origin, source, and message type.
 */

export const IMPERSONATION_FLAG = 'cp.impersonating';
export const READY_TYPE = 'cp-impersonation-ready';
export const HANDOFF_TYPE = 'cp-impersonation';

/** True if this browser tab is (or is becoming) an impersonation tab. */
export function isImpersonationTab(
  pathname: string,
  storage: Pick<Storage, 'getItem'>,
): boolean {
  return pathname.startsWith('/impersonate') || storage.getItem(IMPERSONATION_FLAG) === '1';
}

interface IncomingMessage {
  origin: string;
  source: unknown;
  data: unknown;
}

function messageType(data: unknown): string | undefined {
  return typeof data === 'object' && data !== null
    ? (data as { type?: string }).type
    : undefined;
}

/** The handoff tab announced it is mounted and listening. */
export function isReadyMessage(e: IncomingMessage, expectedOrigin: string, expectedSource: unknown): boolean {
  return e.origin === expectedOrigin && e.source === expectedSource && messageType(e.data) === READY_TYPE;
}

/** The opener delivered the impersonation session. */
export function isValidHandoffMessage(e: IncomingMessage, expectedOrigin: string, expectedSource: unknown): boolean {
  return e.origin === expectedOrigin && e.source === expectedSource && messageType(e.data) === HANDOFF_TYPE;
}

/** Tear down the impersonation session and close the tab. */
export function exitImpersonation(win: Window, authStoreKey: string): void {
  win.sessionStorage.removeItem(IMPERSONATION_FLAG);
  win.sessionStorage.removeItem(authStoreKey);
  win.close();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test web --testPathPattern=impersonation.spec`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/lib/impersonation.ts apps/web/src/app/lib/impersonation.spec.ts
git commit -m "feat(web): add pure impersonation helpers (tab detection, message guards)"
```

---

## Task 4: Web — impersonation-aware auth store

**Files:**
- Modify: `apps/web/src/app/stores/auth.store.ts`

**Interfaces:**
- Consumes: `isImpersonationTab`, `IMPERSONATION_FLAG` from Task 3.
- Produces: store gains `isImpersonating: boolean` and `startImpersonation(accessToken: string, user: IUser): void`; persistence targets `sessionStorage` when the tab is an impersonation tab, else `localStorage` (unchanged behavior for normal tabs).

- [ ] **Step 1: Rewrite the store to select storage and add impersonation actions**

Replace the contents of `apps/web/src/app/stores/auth.store.ts` with:

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IUser, STORAGE_KEYS, UserRole } from '@cp/shared';

import { IMPERSONATION_FLAG, isImpersonationTab } from '../lib/impersonation';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: IUser | null;
  /** True once Zustand has finished hydrating from storage. */
  isHydrated: boolean;
  /** True in a tab that is impersonating a student (drives the banner). */
  isImpersonating: boolean;

  setSession: (accessToken: string, refreshToken: string, user: IUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  startImpersonation: (accessToken: string, user: IUser) => void;
  updateUser: (patch: Partial<IUser>) => void;
  clear: () => void;
  hasRole: (role: UserRole) => boolean;
  setHydrated: () => void;
}

/**
 * A normal tab persists to localStorage. An impersonation tab (the /impersonate
 * handoff route, or any tab already carrying the cp.impersonating flag) persists
 * to sessionStorage instead — isolated per tab — so it never overwrites the
 * admin's own session in the original tab.
 */
const impersonationTab =
  typeof window !== 'undefined' &&
  isImpersonationTab(window.location.pathname, window.sessionStorage);

const authStorage: Storage =
  typeof window === 'undefined'
    ? localStorage
    : impersonationTab
      ? window.sessionStorage
      : window.localStorage;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
      isImpersonating: impersonationTab,

      setSession: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      startImpersonation: (accessToken, user) => {
        window.sessionStorage.setItem(IMPERSONATION_FLAG, '1');
        set({ accessToken, refreshToken: null, user, isImpersonating: true });
      },
      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : state.user,
        })),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      hasRole: (role) => get().user?.role === role,
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: STORAGE_KEYS.authStore,
      storage: createJSONStorage(() => authStorage),
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
```

- [ ] **Step 2: Typecheck the web app**

Run: `pnpm nx build web`
Expected: build succeeds (confirms the new store API typechecks against all consumers).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/stores/auth.store.ts
git commit -m "feat(web): impersonation-aware auth store (sessionStorage isolation)"
```

---

## Task 5: Web — students API `impersonate()` + orchestration hook

**Files:**
- Modify: `apps/web/src/app/api/students.api.ts` (imports + `studentsApi.impersonate`)
- Create: `apps/web/src/app/hooks/useImpersonateStudent.ts`

**Interfaces:**
- Produces:
  - `studentsApi.impersonate(id: string): Promise<{ accessToken: string; user: IUser }>` — `POST /students/:id/impersonate`.
  - `useImpersonateStudent(): { start(profileId: string): Promise<{ ok: boolean; error?: 'popup' | 'failed' }>; isPending: boolean }` — opens the `/impersonate` tab synchronously, calls the API, waits for the tab's ready message, then `postMessage`s the session.
- Consumes: `apiClient` from `../lib/api-client`; `HANDOFF_TYPE`, `READY_TYPE`, `isReadyMessage` from `../lib/impersonation`; `IUser` from `@cp/shared`.

- [ ] **Step 1: Add the API function**

In `apps/web/src/app/api/students.api.ts`, add `IUser` to the `@cp/shared` import (line 10-19 block):

```ts
  IHeatmapData,
  IUser,
} from '@cp/shared';
```

Add an exported result type near the other `*Result` interfaces (after `UnblockStudentResult`):

```ts
export interface ImpersonateStudentResult {
  accessToken: string;
  user: IUser;
}
```

Add the method inside the `studentsApi` object (after `unblock`):

```ts
  async impersonate(id: string): Promise<ImpersonateStudentResult> {
    const { data } = await apiClient.post<ImpersonateStudentResult>(`/students/${id}/impersonate`);
    return data;
  },
```

- [ ] **Step 2: Create the orchestration hook**

Create `apps/web/src/app/hooks/useImpersonateStudent.ts`:

```ts
import { useState } from 'react';

import { studentsApi } from '../api/students.api';
import { HANDOFF_TYPE, READY_TYPE, isReadyMessage } from '../lib/impersonation';

/**
 * Drives the admin→student handoff:
 *  1. Open /impersonate in a new tab *synchronously* (so the browser does not
 *     block the popup — it must happen inside the click handler, before await).
 *  2. Request an impersonation token from the API (admin's own session).
 *  3. Wait for the new tab to announce it is ready (READY_TYPE).
 *  4. postMessage the { accessToken, user } to it (HANDOFF_TYPE).
 * The token is never placed on the URL.
 */
export function useImpersonateStudent() {
  const [isPending, setIsPending] = useState(false);

  async function start(profileId: string): Promise<{ ok: boolean; error?: 'popup' | 'failed' }> {
    const origin = window.location.origin;
    const child = window.open('/impersonate', '_blank');
    if (!child) return { ok: false, error: 'popup' };

    let onReady: (e: MessageEvent) => void = () => undefined;
    const childReady = new Promise<void>((resolve) => {
      onReady = (e: MessageEvent) => {
        if (!isReadyMessage(e, origin, child)) return;
        window.removeEventListener('message', onReady);
        resolve();
      };
      window.addEventListener('message', onReady);
    });

    setIsPending(true);
    try {
      const { accessToken, user } = await studentsApi.impersonate(profileId);
      await childReady;
      child.postMessage({ type: HANDOFF_TYPE, accessToken, user }, origin);
      return { ok: true };
    } catch {
      window.removeEventListener('message', onReady);
      child.close();
      return { ok: false, error: 'failed' };
    } finally {
      setIsPending(false);
    }
  }

  return { start, isPending };
}
```

- [ ] **Step 3: Typecheck the web app**

Run: `pnpm nx build web`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/students.api.ts apps/web/src/app/hooks/useImpersonateStudent.ts
git commit -m "feat(web): students.impersonate API + handoff orchestration hook"
```

---

## Task 6: Web — impersonation handoff page + route

**Files:**
- Create: `apps/web/src/app/pages/ImpersonationHandoffPage.tsx`
- Modify: `apps/web/src/app/App.tsx` (lazy import + route)

**Interfaces:**
- Consumes: `useAuthStore().startImpersonation` (Task 4); `HANDOFF_TYPE`, `READY_TYPE`, `isValidHandoffMessage` (Task 3).
- Produces: a public route `/impersonate` (outside `RoleGuard`) that receives the session and redirects to `/student`.

- [ ] **Step 1: Create the handoff page**

Create `apps/web/src/app/pages/ImpersonationHandoffPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../stores/auth.store';
import { HANDOFF_TYPE, READY_TYPE, isValidHandoffMessage } from '../lib/impersonation';

/**
 * Runs in the tab opened by the admin. Announces readiness to window.opener,
 * waits for the { accessToken, user } handoff, writes it to this tab's
 * (sessionStorage-backed) auth store, then redirects into the student portal.
 */
export default function ImpersonationHandoffPage() {
  const navigate = useNavigate();
  const startImpersonation = useAuthStore((s) => s.startImpersonation);
  const [status, setStatus] = useState<'waiting' | 'error'>('waiting');

  useEffect(() => {
    const opener = window.opener as Window | null;
    if (!opener) {
      setStatus('error');
      return;
    }
    const origin = window.location.origin;

    const onMessage = (e: MessageEvent) => {
      if (!isValidHandoffMessage(e, origin, opener)) return;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      const { accessToken, user } = e.data as { accessToken: string; user: Parameters<typeof startImpersonation>[1] };
      startImpersonation(accessToken, user);
      navigate('/student', { replace: true });
    };

    window.addEventListener('message', onMessage);
    opener.postMessage({ type: READY_TYPE }, origin);
    const timer = setTimeout(() => setStatus('error'), 10_000);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, [navigate, startImpersonation]);

  return (
    <div className="grid h-screen place-items-center text-on-surface-variant">
      {status === 'waiting' ? (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          Đang mở phiên học sinh…
        </span>
      ) : (
        <div className="text-center">
          <p>Không nhận được phiên mạo danh.</p>
          <button type="button" className="mt-2 underline" onClick={() => window.close()}>
            Đóng tab
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Register the route**

In `apps/web/src/app/App.tsx`, add the lazy import next to the other page imports (e.g. after `LoginPage`, line 30):

```tsx
const ImpersonationHandoff = lazy(() => import('./pages/ImpersonationHandoffPage'));
```

Add the route as a sibling of `/` — place it just before the `/` default route (after the Student portal `</Route>`, around line 282, before `<Route path="/" ... />`):

```tsx
              {/* ── Impersonation handoff (public; no RoleGuard) ─────── */}
              <Route path="/impersonate" element={<ImpersonationHandoff />} />
```

- [ ] **Step 3: Typecheck the web app**

Run: `pnpm nx build web`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pages/ImpersonationHandoffPage.tsx apps/web/src/app/App.tsx
git commit -m "feat(web): /impersonate handoff page receives session via postMessage"
```

---

## Task 7: Web — impersonation banner

**Files:**
- Create: `apps/web/src/app/components/ImpersonationBanner.tsx`
- Modify: `apps/web/src/app/App.tsx` (mount banner)

**Interfaces:**
- Consumes: `useAuthStore().isImpersonating` + `.user` (Task 4); `exitImpersonation` (Task 3); `STORAGE_KEYS` from `@cp/shared`.
- Produces: a fixed top bar rendered only when `isImpersonating`, with a "Thoát" action; includes an in-flow spacer so it does not cover page content.

- [ ] **Step 1: Create the banner**

Create `apps/web/src/app/components/ImpersonationBanner.tsx`:

```tsx
import { STORAGE_KEYS } from '@cp/shared';

import { useAuthStore } from '../stores/auth.store';
import { exitImpersonation } from '../lib/impersonation';

/**
 * Shown only in an impersonation tab. Makes it unmistakable that the admin is
 * acting as a student, and offers a one-click exit (clears this tab's session
 * and closes it — the admin's own tab is untouched).
 */
export function ImpersonationBanner() {
  const isImpersonating = useAuthStore((s) => s.isImpersonating);
  const user = useAuthStore((s) => s.user);

  if (!isImpersonating) return null;

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[100] flex h-10 items-center justify-center gap-3 bg-amber-500 px-4 text-sm font-medium text-black shadow">
        <span className="material-symbols-outlined text-[18px]">switch_account</span>
        <span>
          {user ? (
            <>Đang xem với tư cách <strong>{name || 'học sinh'}</strong></>
          ) : (
            <>Phiên mạo danh đã hết hạn</>
          )}
        </span>
        <button
          type="button"
          onClick={() => exitImpersonation(window, STORAGE_KEYS.authStore)}
          className="rounded bg-black/80 px-2 py-0.5 text-white hover:bg-black"
        >
          Thoát
        </button>
      </div>
      {/* Spacer so the fixed bar does not overlap the portal header. */}
      <div className="h-10" aria-hidden />
    </>
  );
}
```

- [ ] **Step 2: Mount the banner**

In `apps/web/src/app/App.tsx`, add the import (with the other non-lazy imports, near line 102):

```tsx
import { ImpersonationBanner } from './components/ImpersonationBanner';
```

Render it just after `<ThemeEffects />` (line 120), so it sits above the routed content in every tab (it renders nothing unless impersonating):

```tsx
            <ThemeEffects />
            <ImpersonationBanner />
```

- [ ] **Step 3: Typecheck the web app**

Run: `pnpm nx build web`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/components/ImpersonationBanner.tsx apps/web/src/app/App.tsx
git commit -m "feat(web): impersonation banner with exit action"
```

---

## Task 8: Web — trigger button on the student profile page

**Files:**
- Modify: `apps/web/src/app/pages/admin/students/StudentProfilePage.tsx`

**Interfaces:**
- Consumes: `useImpersonateStudent` (Task 5); existing `toast`, `t`, `base`, `idParam`, `s` (student, has `.isActive`).
- Produces: an ADMIN-only ("Đăng nhập với tư cách HS") button in the profile header actions.

- [ ] **Step 1: Import the hook**

In `apps/web/src/app/pages/admin/students/StudentProfilePage.tsx`, add near the other hook imports:

```tsx
import { useImpersonateStudent } from '../../../hooks/useImpersonateStudent';
```

- [ ] **Step 2: Wire the hook + handler**

Inside the component body (near the other hook calls, ~line 58), add:

```tsx
  const impersonate = useImpersonateStudent();

  async function handleImpersonate() {
    const res = await impersonate.start(idParam as string);
    if (!res.ok) {
      toast.error(
        res.error === 'popup'
          ? t(
              'pages.admin.studentProfile.impersonate.popupBlocked',
              'Trình duyệt đã chặn cửa sổ mới. Hãy cho phép popup rồi thử lại.',
            )
          : t(
              'pages.admin.studentProfile.impersonate.failed',
              'Không thể đăng nhập với tư cách học sinh.',
            ),
      );
    }
  }
```

- [ ] **Step 3: Add the button to the header actions**

In the `actions={ ... }` block (after the "resetPassword" button, ~line 241), add:

```tsx
            {base === '/admin' && (
              <Button
                variant="ghost"
                leadingIcon={<Icon name="switch_account" size={18} />}
                disabled={impersonate.isPending || !s.isActive}
                onClick={handleImpersonate}
              >
                {t('pages.admin.studentProfile.impersonate.action', 'Đăng nhập với tư cách HS')}
              </Button>
            )}
```

(Gated `base === '/admin'` so it never shows in the Teacher portal; disabled for blocked students since the backend rejects them.)

- [ ] **Step 4: Typecheck the web app**

Run: `pnpm nx build web`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/admin/students/StudentProfilePage.tsx
git commit -m "feat(web): admin impersonate-student button on student profile"
```

---

## Task 9: End-to-end manual verification

Automated tests cover the pure logic (token minting, controller wiring, tab detection, message guards). The multi-tab `postMessage` + `sessionStorage` isolation can only be confirmed in a real browser. Use the `run` skill (or `pnpm nx serve api` + `pnpm nx serve web`) and walk through:

- [ ] **Step 1: Happy path** — Log in as ADMIN → open a student profile → click "Đăng nhập với tư cách HS". A new tab opens, lands on `/student`, shows the student's dashboard, and displays the amber banner "Đang xem với tư cách <name>".
- [ ] **Step 2: Admin session preserved** — Switch back to the original tab; the admin is still logged in and can navigate `/admin/*` normally. Confirm `localStorage.cp.auth` still holds the admin session and `sessionStorage.cp.auth` (in the impersonation tab) holds the student session.
- [ ] **Step 3: Full student access** — In the impersonation tab, open an assignment / shop / quests page and confirm the student can act (data loads as that student).
- [ ] **Step 4: Exit** — Click "Thoát" in the banner; the impersonation tab closes (or shows it can be closed) and the admin tab is unaffected.
- [ ] **Step 5: Blocked student guard** — Block a student, reopen their profile; the impersonate button is disabled. (Optionally hit the endpoint directly to confirm it 4xxs.)
- [ ] **Step 6: Authorization** — Confirm a TEACHER does not see the button (Teacher portal) and `POST /students/:id/impersonate` returns 403 for a TEACHER/STUDENT token.
- [ ] **Step 7: Full suites green** — `pnpm nx test api` and `pnpm nx test web` pass.

---

## Self-Review

**Spec coverage:**
- New-tab + banner + sessionStorage isolation → Tasks 4, 6, 7. ✓
- Full student access (real access token, STUDENT role) → Task 1. ✓
- `impersonatedBy` claim, no separate audit table → Task 1 (`JwtPayload`, payload). ✓
- ADMIN-only → Task 2 (`@Roles(ADMIN)`) + Task 8 (`base === '/admin'`). ✓
- Access-only, no refresh (avoid clobbering `refreshTokenHash`) → Task 1 (asserted in test). ✓
- postMessage handoff, no token on URL → Tasks 3, 5, 6. ✓
- Reject inactive/non-student → Task 1. ✓
- Token-expiry / null-refresh handling → existing interceptor already handles `refreshToken === null` (auth.store isolation ensures the impersonation tab never reads the admin's refresh); banner shows "hết hạn" when `user` is cleared (Task 7). ✓
- Popup-blocked handling → Task 5 (`error: 'popup'`) + Task 8 (toast). ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `generateImpersonationToken(studentUserId, adminId)` returns `{ accessToken, user }` — same shape consumed by the controller (Task 2), the API wrapper `impersonate()` (Task 5), and the hook. Message constants `HANDOFF_TYPE`/`READY_TYPE` and `isReadyMessage`/`isValidHandoffMessage` are defined once (Task 3) and reused everywhere. `startImpersonation(accessToken, user)` signature matches store (Task 4), handoff page (Task 6). `STORAGE_KEYS.authStore` used consistently for the sessionStorage key. ✓

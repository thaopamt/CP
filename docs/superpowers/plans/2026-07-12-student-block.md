# Student Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin-controlled student blocking that revokes access, resets learning data, keeps personal/tuition records, and expires workspace drafts after 48 hours.

**Architecture:** Backend owns the destructive state transition through student-specific block/unblock endpoints. Existing learning-reset deletion logic is extracted into a transaction helper so standalone reset and block share one boundary. Frontend exposes account active state, adds admin actions, centralizes workspace-draft cleanup/TTL helpers, and clears auth plus drafts on blocked API responses.

**Tech Stack:** NestJS 10, TypeORM 0.3, Jest/ts-jest, React 18, Vite, Vitest, TanStack Query, Zustand, Axios.

## Global Constraints

- Scope: Student accounts only. Admin/teacher accounts are out of scope.
- Block student atomically deactivates user, revokes refresh token, and resets learning data.
- Unblock only restores access; it does not restore reset learning data.
- Preserve users identity fields, student profile fields, guardians, monthly tuition, class enrollment, schedules, attendance history, finance records, and teacher assignments.
- Delete/reset submissions, assignment progress, quests, badges, shop inventory, maze submissions, XP/gems/level/streak/cosmetics.
- Workspace drafts with keys `code-draft-workspace-*` expire after 48 hours.
- No database migration is required for core block because `users.is_active` and `student_profiles.learning_reset_at` already exist.
- Use TDD: write each failing test before production code and verify the failure.

---

## File Structure

- `apps/api/src/modules/students/students.service.ts`
  - Add `BlockStudentResult`, `UnblockStudentResult`.
  - Extract `resetLearningDataInTransaction(tx, studentId, resetAt)`.
  - Add `blockStudent(studentId)` and `unblockStudent(studentId)`.
  - Add private cache bump helpers.

- `apps/api/src/modules/students/students.controller.ts`
  - Add admin-only `POST /students/:id/block`.
  - Add admin-only `POST /students/:id/unblock`.

- `apps/api/src/modules/students/students.service.spec.ts`
  - Extend repository fakes for `User`.
  - Cover block, unblock, repeated inactive block, and existing reset behavior.

- `apps/api/src/modules/students/students.controller.spec.ts`
  - Cover route delegation and admin-only metadata for block/unblock.

- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
  - Inject `UsersService`.
  - Reject inactive/missing users with `ForbiddenException` response code `USER_BLOCKED`.

- `apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts`
  - New focused unit tests for active/inactive JWT validation.

- `apps/api/src/modules/auth/auth.service.ts`
  - Return `USER_BLOCKED` from refresh when the refresh token belongs to an inactive user.

- `apps/api/src/modules/auth/auth.service.spec.ts`
  - New focused unit test for inactive refresh behavior.

- `libs/shared/src/lib/admin.types.ts`
  - Add `isActive` to `IStudentProfile`.

- `apps/web/src/app/api/students.api.ts`
  - Include `ApiUser.isActive`.
  - Map `isActive` into `IStudentProfile`.
  - Add `BlockStudentResult`, `UnblockStudentResult`, `studentsApi.block`, and `studentsApi.unblock`.

- `apps/web/src/app/api/student.queries.ts`
  - Add `useBlockStudent(id)` and `useUnblockStudent(id)` with cache invalidation.

- `apps/web/src/app/pages/admin/students/StudentProfilePage.tsx`
  - Show Active/Blocked account badge.
  - Add Block student / Unblock student admin actions and confirmations.

- `apps/web/src/app/lib/learning-reset-storage.ts`
  - Export draft prefix and TTL constants.
  - Add `removeWorkspaceDrafts`, `readWorkspaceDraft`, and `writeWorkspaceDraft`.
  - Reuse `removeWorkspaceDrafts` in reset cleanup.

- `apps/web/src/app/lib/learning-reset-storage.spec.ts`
  - Extend tests for 48-hour TTL, legacy drafts, invalid JSON, and draft writes.

- `apps/web/src/app/providers/AuthProvider.tsx`
  - Detect `USER_BLOCKED`.
  - Clear workspace drafts and auth store on blocked responses.

- `apps/web/src/app/pages/student/WorkspacePage.tsx`
  - Use draft helpers for read/write and TTL behavior.

---

### Task 1: Backend Student Block/Unblock

**Files:**
- Modify: `apps/api/src/modules/students/students.service.ts`
- Modify: `apps/api/src/modules/students/students.controller.ts`
- Test: `apps/api/src/modules/students/students.service.spec.ts`
- Test: `apps/api/src/modules/students/students.controller.spec.ts`

**Interfaces:**
- Consumes: Existing `ResetStudentLearningDataResult`.
- Produces:
  - `blockStudent(studentId: string): Promise<BlockStudentResult>`
  - `unblockStudent(studentId: string): Promise<UnblockStudentResult>`
  - `POST /students/:id/block`
  - `POST /students/:id/unblock`

- [ ] **Step 1: Write failing service tests**

Append these tests inside `describe('StudentsService.resetLearningData', ...)` or rename the describe to `describe('StudentsService student destructive actions', ...)`. Update the test helper first so it can mock the `User` repository:

```ts
import { User } from '../users/user.entity';

function userRepo(user: Partial<User> | null) {
  return {
    findOne: jest.fn().mockResolvedValue(user),
    update: jest.fn().mockResolvedValue({ affected: user ? 1 : 0 }),
  };
}

function makeService(
  profile: Partial<StudentProfile> | null,
  user: Partial<User> | null = { id: 'user-1', isActive: true },
) {
  const repos = new Map<unknown, any>();
  const profileRepository = profileRepo(profile);
  const usersRepository = userRepo(user);
  const progressRepository = deleteRepo(2);
  const submissionRepository = deleteRepo(3);
  const questRepository = deleteRepo(4);
  const badgeRepository = deleteRepo(5);
  const inventoryRepository = deleteRepo(6);
  const mazeRepository = deleteRepo(7);

  repos.set(StudentProfile, profileRepository);
  repos.set(User, usersRepository);
  repos.set(StudentAssignmentProgress, progressRepository);
  repos.set(Submission, submissionRepository);
  repos.set(StudentQuest, questRepository);
  repos.set(StudentBadge, badgeRepository);
  repos.set(StudentInventory, inventoryRepository);
  repos.set(MazeSubmission, mazeRepository);

  const tx = {
    getRepository: jest.fn((entity) => repos.get(entity)),
    query: jest.fn().mockResolvedValue([]),
  };
  const ds = {
    transaction: jest.fn((fn) => fn(tx)),
  };
  const cache = {
    bumpTags: jest.fn().mockResolvedValue(undefined),
  };

  const service = new StudentsService(
    crudRepo<StudentProfile>(),
    usersRepository as unknown as Repository<User>,
    {} as Repository<Guardian>,
    ds as any,
    cache as any,
  );

  return {
    service,
    tx,
    cache,
    profileRepository,
    usersRepository,
    progressRepository,
    submissionRepository,
    questRepository,
    badgeRepository,
    inventoryRepository,
    mazeRepository,
  };
}
```

Add these failing tests:

```ts
it('blocks a student by deactivating the account, revoking refresh token, and resetting learning data', async () => {
  const ctx = makeService({
    id: 'profile-1',
    userId: 'user-1',
    monthlyTuition: 800000,
    grade: 10,
    attendanceRate: 95,
    daysAbsent: 1,
  });

  const result = await ctx.service.blockStudent('profile-1');

  expect(ctx.usersRepository.update).toHaveBeenCalledWith(
    { id: 'user-1' },
    { isActive: false, refreshTokenHash: null },
  );
  expect(ctx.progressRepository.delete).toHaveBeenCalledWith({ studentId: 'user-1' });
  expect(ctx.submissionRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
  expect(ctx.questRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
  expect(ctx.badgeRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
  expect(ctx.inventoryRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
  expect(ctx.mazeRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
  expect(ctx.profileRepository.update.mock.calls[0][1]).not.toEqual(
    expect.objectContaining({
      monthlyTuition: expect.anything(),
      grade: expect.anything(),
      attendanceRate: expect.anything(),
      daysAbsent: expect.anything(),
    }),
  );
  expect(result).toEqual({
    studentId: 'profile-1',
    userId: 'user-1',
    submissionsDeleted: 3,
    assignmentProgressDeleted: 2,
    questsDeleted: 4,
    badgesDeleted: 5,
    shopItemsDeleted: 6,
    mazeSubmissionsDeleted: 7,
    learningResetAt: resetAt.toISOString(),
    blockedAt: resetAt.toISOString(),
    isActive: false,
    alreadyBlocked: false,
  });
});

it('marks repeated block calls as alreadyBlocked while still enforcing the reset boundary', async () => {
  const ctx = makeService(
    { id: 'profile-1', userId: 'user-1' },
    { id: 'user-1', isActive: false },
  );

  const result = await ctx.service.blockStudent('profile-1');

  expect(ctx.usersRepository.update).toHaveBeenCalledWith(
    { id: 'user-1' },
    { isActive: false, refreshTokenHash: null },
  );
  expect(ctx.submissionRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
  expect(result.alreadyBlocked).toBe(true);
});

it('unblocks a student without restoring learning data or refresh token', async () => {
  const ctx = makeService(
    { id: 'profile-1', userId: 'user-1' },
    { id: 'user-1', isActive: false },
  );

  const result = await ctx.service.unblockStudent('profile-1');

  expect(ctx.usersRepository.update).toHaveBeenCalledWith(
    { id: 'user-1' },
    { isActive: true, refreshTokenHash: null },
  );
  expect(ctx.submissionRepository.delete).not.toHaveBeenCalled();
  expect(result).toEqual({
    studentId: 'profile-1',
    userId: 'user-1',
    unblockedAt: resetAt.toISOString(),
    isActive: true,
  });
});
```

- [ ] **Step 2: Run service tests to verify RED**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/students/students.service.spec.ts --runInBand
```

Expected: FAIL with TypeScript or runtime errors showing `blockStudent` and `unblockStudent` do not exist.

- [ ] **Step 3: Implement service interfaces and helper extraction**

In `apps/api/src/modules/students/students.service.ts`, change the TypeORM import:

```ts
import { DataSource, EntityManager, Repository, In, MoreThanOrEqual, Not } from 'typeorm';
```

Add interfaces below `ResetStudentLearningDataResult`:

```ts
export interface BlockStudentResult extends ResetStudentLearningDataResult {
  blockedAt: string;
  isActive: false;
  alreadyBlocked: boolean;
}

export interface UnblockStudentResult {
  studentId: string;
  userId: string;
  unblockedAt: string;
  isActive: true;
}
```

Add private cache helpers inside `StudentsService`:

```ts
  private bumpLearningResetCaches(userId: string): void {
    void this.cache.bumpTags([
      'students:list',
      'leaderboard:global',
      'badges:catalog',
      'maze:progress',
      `student:${userId}:profile`,
      `student:${userId}:dashboard`,
      `student:${userId}:quests`,
      `student:${userId}:badges`,
      `student:${userId}:shop`,
      `student:${userId}:maze`,
    ]);
  }

  private bumpStudentAccountCaches(userId: string): void {
    void this.cache.bumpTags([
      'students:list',
      `student:${userId}:profile`,
      `student:${userId}:dashboard`,
    ]);
  }
```

Extract the current body of `resetLearningData` into:

```ts
  private async resetLearningDataInTransaction(
    tx: EntityManager,
    studentId: string,
    resetAt: Date,
  ): Promise<ResetStudentLearningDataResult> {
    const profileRepo = tx.getRepository(StudentProfile);
    const profile = await profileRepo.findOne({ where: { id: studentId } });
    if (!profile) throw new NotFoundException(`Student ${studentId} not found`);

    const userId = profile.userId;

    await tx.query(
      `
        UPDATE badges b
        SET earned_count = GREATEST(0, b.earned_count - earned.badge_count)
        FROM (
          SELECT badge_id, COUNT(*)::int AS badge_count
          FROM student_badges
          WHERE user_id = $1
          GROUP BY badge_id
        ) earned
        WHERE b.id = earned.badge_id
      `,
      [userId],
    );

    const progressDelete = await tx.getRepository(StudentAssignmentProgress).delete({ studentId: userId });
    const submissionDelete = await tx.getRepository(Submission).delete({ userId });
    const questDelete = await tx.getRepository(StudentQuest).delete({ userId });
    const badgeDelete = await tx.getRepository(StudentBadge).delete({ userId });
    const inventoryDelete = await tx.getRepository(StudentInventory).delete({ userId });
    const mazeDelete = await tx.getRepository(MazeSubmission).delete({ userId });

    await profileRepo.update(
      { id: studentId },
      {
        level: 1,
        xp: 0,
        weeklyXp: 0,
        weekKey: null,
        monthlyXp: 0,
        monthKey: null,
        gems: 0,
        streak: 0,
        streakLastDate: null,
        problemsSolved: 0,
        mazesSolved: 0,
        badgesEarned: 0,
        questsCompleted: 0,
        equippedTheme: null,
        nameColor: null,
        equippedTitle: null,
        learningResetAt: resetAt,
      },
    );

    return {
      studentId,
      userId,
      submissionsDeleted: submissionDelete.affected ?? 0,
      assignmentProgressDeleted: progressDelete.affected ?? 0,
      questsDeleted: questDelete.affected ?? 0,
      badgesDeleted: badgeDelete.affected ?? 0,
      shopItemsDeleted: inventoryDelete.affected ?? 0,
      mazeSubmissionsDeleted: mazeDelete.affected ?? 0,
      learningResetAt: resetAt.toISOString(),
    };
  }
```

Replace `resetLearningData` with:

```ts
  async resetLearningData(studentId: string): Promise<ResetStudentLearningDataResult> {
    const resetAt = new Date();
    const result = await this.ds.transaction((tx) =>
      this.resetLearningDataInTransaction(tx, studentId, resetAt),
    );
    this.bumpLearningResetCaches(result.userId);
    return result;
  }
```

- [ ] **Step 4: Implement block/unblock service methods**

Add below `resetLearningData`:

```ts
  async blockStudent(studentId: string): Promise<BlockStudentResult> {
    const blockedAt = new Date();
    const result = await this.ds.transaction(async (tx) => {
      const profileRepo = tx.getRepository(StudentProfile);
      const userRepo = tx.getRepository(User);
      const profile = await profileRepo.findOne({ where: { id: studentId } });
      if (!profile) throw new NotFoundException(`Student ${studentId} not found`);

      const user = await userRepo.findOne({ where: { id: profile.userId } });
      if (!user) throw new NotFoundException(`User ${profile.userId} not found`);

      const alreadyBlocked = user.isActive === false;
      await userRepo.update(
        { id: profile.userId },
        { isActive: false, refreshTokenHash: null },
      );

      const reset = await this.resetLearningDataInTransaction(tx, studentId, blockedAt);
      return {
        ...reset,
        blockedAt: blockedAt.toISOString(),
        isActive: false as const,
        alreadyBlocked,
      };
    });

    this.bumpLearningResetCaches(result.userId);
    return result;
  }

  async unblockStudent(studentId: string): Promise<UnblockStudentResult> {
    const unblockedAt = new Date();
    const result = await this.ds.transaction(async (tx) => {
      const profileRepo = tx.getRepository(StudentProfile);
      const userRepo = tx.getRepository(User);
      const profile = await profileRepo.findOne({ where: { id: studentId } });
      if (!profile) throw new NotFoundException(`Student ${studentId} not found`);

      await userRepo.update(
        { id: profile.userId },
        { isActive: true, refreshTokenHash: null },
      );

      return {
        studentId,
        userId: profile.userId,
        unblockedAt: unblockedAt.toISOString(),
        isActive: true as const,
      };
    });

    this.bumpStudentAccountCaches(result.userId);
    return result;
  }
```

- [ ] **Step 5: Run service tests to verify GREEN**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/students/students.service.spec.ts --runInBand
```

Expected: PASS for reset/block/unblock service tests.

- [ ] **Step 6: Write failing controller tests**

Update `apps/api/src/modules/students/students.controller.spec.ts` with:

```ts
describe('StudentsController.blockStudent', () => {
  it('is admin-only and delegates to StudentsService', async () => {
    const result = {
      studentId: 'profile-1',
      userId: 'user-1',
      submissionsDeleted: 3,
      assignmentProgressDeleted: 2,
      questsDeleted: 4,
      badgesDeleted: 5,
      shopItemsDeleted: 6,
      mazeSubmissionsDeleted: 7,
      learningResetAt: '2026-07-12T03:04:05.000Z',
      blockedAt: '2026-07-12T03:04:05.000Z',
      isActive: false,
      alreadyBlocked: false,
    };
    const service = {
      resetLearningData: jest.fn(),
      blockStudent: jest.fn().mockResolvedValue(result),
      unblockStudent: jest.fn(),
    };
    const controller = new StudentsController(service as never, {} as never);

    await expect(controller.blockStudent('profile-1')).resolves.toEqual(result);
    expect(service.blockStudent).toHaveBeenCalledWith('profile-1');
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.blockStudent)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});

describe('StudentsController.unblockStudent', () => {
  it('is admin-only and delegates to StudentsService', async () => {
    const result = {
      studentId: 'profile-1',
      userId: 'user-1',
      unblockedAt: '2026-07-12T03:04:05.000Z',
      isActive: true,
    };
    const service = {
      resetLearningData: jest.fn(),
      blockStudent: jest.fn(),
      unblockStudent: jest.fn().mockResolvedValue(result),
    };
    const controller = new StudentsController(service as never, {} as never);

    await expect(controller.unblockStudent('profile-1')).resolves.toEqual(result);
    expect(service.unblockStudent).toHaveBeenCalledWith('profile-1');
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.unblockStudent)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});
```

- [ ] **Step 7: Run controller tests to verify RED**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/students/students.controller.spec.ts --runInBand
```

Expected: FAIL because `blockStudent` and `unblockStudent` controller methods do not exist.

- [ ] **Step 8: Implement controller endpoints**

Add to `StudentsController` after `resetLearningData`:

```ts
  @Roles(UserRole.ADMIN)
  @Post(':id/block')
  async blockStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.blockStudent(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/unblock')
  async unblockStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.unblockStudent(id);
  }
```

- [ ] **Step 9: Run controller tests to verify GREEN**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/students/students.controller.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 10: Commit Task 1**

```bash
git add apps/api/src/modules/students/students.service.ts apps/api/src/modules/students/students.controller.ts apps/api/src/modules/students/students.service.spec.ts apps/api/src/modules/students/students.controller.spec.ts
git commit -m "feat(api): add student block endpoints"
```

---

### Task 2: Backend Active Account Enforcement

**Files:**
- Modify: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts`
- Create: `apps/api/src/modules/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `UsersService.findActiveById(id)`, `UsersService.findByIdWithRefreshToken(id)`.
- Produces: inactive authenticated users receive `{ code: 'USER_BLOCKED', message: 'User is blocked' }` with HTTP 403.

- [ ] **Step 1: Write failing JwtStrategy tests**

Create `apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@cp/shared';

import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

function makeStrategy(activeUser: unknown) {
  const cfg = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const users = {
    findActiveById: jest.fn().mockResolvedValue(activeUser),
  } as unknown as UsersService;

  return {
    strategy: new JwtStrategy(cfg, users),
    users,
  };
}

describe('JwtStrategy', () => {
  const payload = {
    sub: 'user-1',
    email: 'student@example.com',
    role: UserRole.STUDENT,
  };

  it('returns the JWT payload when the account is active', async () => {
    const { strategy, users } = makeStrategy({ id: 'user-1' });

    await expect(strategy.validate(payload)).resolves.toEqual(payload);
    expect(users.findActiveById).toHaveBeenCalledWith('user-1');
  });

  it('rejects inactive or missing accounts with USER_BLOCKED', async () => {
    const { strategy } = makeStrategy(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(strategy.validate(payload)).rejects.toMatchObject({
      response: {
        code: 'USER_BLOCKED',
        message: 'User is blocked',
      },
    });
  });
});
```

- [ ] **Step 2: Run JwtStrategy test to verify RED**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts --runInBand
```

Expected: FAIL because `JwtStrategy` constructor does not accept `UsersService` and validate does not check account state.

- [ ] **Step 3: Implement active JWT validation**

Modify `apps/api/src/modules/auth/strategies/jwt.strategy.ts`:

```ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@cp/shared';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    cfg: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.users.findActiveById(payload.sub);
    if (!user) {
      throw new ForbiddenException({
        code: 'USER_BLOCKED',
        message: 'User is blocked',
      });
    }
    return payload;
  }
}
```

- [ ] **Step 4: Run JwtStrategy test to verify GREEN**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Write failing refresh-token test**

Create `apps/api/src/modules/auth/auth.service.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@cp/shared';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService.refreshTokens', () => {
  it('rejects inactive users with USER_BLOCKED before refresh-token comparison', async () => {
    const users = {
      findByIdWithRefreshToken: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        username: null,
        firstName: 'A',
        lastName: 'Student',
        role: UserRole.STUDENT,
        avatarUrl: null,
        isActive: false,
        refreshTokenHash: 'hash',
        createdAt: new Date('2026-07-12T00:00:00.000Z'),
        updatedAt: new Date('2026-07-12T00:00:00.000Z'),
      }),
    } as unknown as UsersService;
    const jwt = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const config = {
      getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
      get: jest.fn(),
    } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    await expect(service.refreshTokens('user-1', 'refresh')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.refreshTokens('user-1', 'refresh')).rejects.toMatchObject({
      response: {
        code: 'USER_BLOCKED',
        message: 'User is blocked',
      },
    });
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run AuthService test to verify RED**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/auth/auth.service.spec.ts --runInBand
```

Expected: FAIL because inactive refresh currently throws `UnauthorizedException`.

- [ ] **Step 7: Implement inactive refresh response**

Modify import in `apps/api/src/modules/auth/auth.service.ts`:

```ts
import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
```

Add private helper inside `AuthService`:

```ts
  private blockedException(): ForbiddenException {
    return new ForbiddenException({
      code: 'USER_BLOCKED',
      message: 'User is blocked',
    });
  }
```

Change the start of `refreshTokens`:

```ts
  async refreshTokens(userId: string, refreshToken: string): Promise<LoginResponse> {
    const user = await this.users.findByIdWithRefreshToken(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (!user.isActive) {
      throw this.blockedException();
    }
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }
```

- [ ] **Step 8: Run AuthService test to verify GREEN**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/auth/auth.service.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 9: Run auth and student backend test set**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts --runInBand
pnpm nx test api --testFile=apps/api/src/modules/auth/auth.service.spec.ts --runInBand
pnpm nx test api --testFile=apps/api/src/modules/students/students.service.spec.ts --runInBand
```

Expected: PASS for all three commands.

- [ ] **Step 10: Commit Task 2**

```bash
git add apps/api/src/modules/auth/strategies/jwt.strategy.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts apps/api/src/modules/auth/auth.service.spec.ts
git commit -m "feat(api): reject blocked users during auth"
```

---

### Task 3: Workspace Draft TTL Helpers

**Files:**
- Modify: `apps/web/src/app/lib/learning-reset-storage.ts`
- Test: `apps/web/src/app/lib/learning-reset-storage.spec.ts`

**Interfaces:**
- Produces:
  - `removeWorkspaceDrafts(storage: Storage): string[]`
  - `readWorkspaceDraft(input): WorkspaceDraftReadResult`
  - `writeWorkspaceDraft(input): void`
  - `WORKSPACE_DRAFT_TTL_MS`

- [ ] **Step 1: Write failing helper tests**

Extend imports:

```ts
import {
  applyLearningResetStorageCleanup,
  readWorkspaceDraft,
  removeWorkspaceDrafts,
  WORKSPACE_DRAFT_TTL_MS,
  writeWorkspaceDraft,
} from './learning-reset-storage';
```

Add tests:

```ts
describe('workspace draft helpers', () => {
  it('removes all workspace drafts and keeps unrelated localStorage keys', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{"code":"old"}');
    storage.setItem('code-draft-workspace-b', '{"code":"old"}');
    storage.setItem('cp_default_language', 'cpp');

    expect(removeWorkspaceDrafts(storage)).toEqual([
      'code-draft-workspace-a',
      'code-draft-workspace-b',
    ]);
    expect(storage.getItem('code-draft-workspace-a')).toBeNull();
    expect(storage.getItem('code-draft-workspace-b')).toBeNull();
    expect(storage.getItem('cp_default_language')).toBe('cpp');
  });

  it('reads valid drafts younger than 48 hours', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', JSON.stringify({
      code: 'print(1)',
      language: 'python',
      savedAt: '2026-07-12T00:00:00.000Z',
    }));

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-13T23:59:59.000Z'),
    })).toEqual({
      draft: {
        code: 'print(1)',
        language: 'python',
        savedAt: '2026-07-12T00:00:00.000Z',
      },
      removed: false,
    });
  });

  it('removes drafts older than 48 hours', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', JSON.stringify({
      code: 'print(1)',
      language: 'python',
      savedAt: '2026-07-12T00:00:00.000Z',
    }));

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-14T00:00:01.000Z'),
    })).toEqual({ draft: null, removed: true });
    expect(storage.getItem('code-draft-workspace-a')).toBeNull();
    expect(WORKSPACE_DRAFT_TTL_MS).toBe(48 * 60 * 60 * 1000);
  });

  it('allows legacy drafts without savedAt to be read once', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{"code":"old","language":"cpp"}');

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-14T00:00:01.000Z'),
    })).toEqual({
      draft: { code: 'old', language: 'cpp', savedAt: undefined },
      removed: false,
    });
  });

  it('removes invalid JSON drafts', () => {
    const storage = new MemoryStorage();
    storage.setItem('code-draft-workspace-a', '{bad json');

    expect(readWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      now: new Date('2026-07-12T00:00:00.000Z'),
    })).toEqual({ draft: null, removed: true });
    expect(storage.getItem('code-draft-workspace-a')).toBeNull();
  });

  it('writes drafts with savedAt', () => {
    const storage = new MemoryStorage();

    writeWorkspaceDraft({
      storage,
      key: 'code-draft-workspace-a',
      code: 'cout << 1;',
      language: 'cpp',
      now: new Date('2026-07-12T08:00:00.000Z'),
    });

    expect(storage.getItem('code-draft-workspace-a')).toBe(JSON.stringify({
      code: 'cout << 1;',
      language: 'cpp',
      savedAt: '2026-07-12T08:00:00.000Z',
    }));
  });
});
```

- [ ] **Step 2: Run helper tests to verify RED**

Run:

```bash
pnpm exec vitest run apps/web/src/app/lib/learning-reset-storage.spec.ts --config apps/web/vite.config.ts
```

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Implement helper functions**

Replace `apps/web/src/app/lib/learning-reset-storage.ts` with:

```ts
export const CODE_DRAFT_PREFIX = 'code-draft-workspace-';
const APPLIED_RESET_PREFIX = 'learning-reset-applied-';
export const WORKSPACE_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;

export interface LearningResetStorageCleanupInput {
  storage: Storage;
  userId?: string | null;
  learningResetAt?: string | null;
}

export interface LearningResetStorageCleanupResult {
  removedKeys: string[];
}

export interface WorkspaceDraft {
  code: string;
  language: string;
  savedAt?: string;
}

export interface WorkspaceDraftReadInput {
  storage: Storage;
  key: string;
  now?: Date;
}

export interface WorkspaceDraftReadResult {
  draft: WorkspaceDraft | null;
  removed: boolean;
}

export interface WorkspaceDraftWriteInput {
  storage: Storage;
  key: string;
  code: string;
  language: string;
  now?: Date;
}

export function removeWorkspaceDrafts(storage: Storage): string[] {
  const keysToRemove: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(CODE_DRAFT_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    storage.removeItem(key);
  }

  return keysToRemove;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isExpired(savedAt: string, now: Date): boolean {
  const savedTime = Date.parse(savedAt);
  if (!Number.isFinite(savedTime)) return true;
  return now.getTime() - savedTime > WORKSPACE_DRAFT_TTL_MS;
}

export function readWorkspaceDraft({
  storage,
  key,
  now = new Date(),
}: WorkspaceDraftReadInput): WorkspaceDraftReadResult {
  const raw = storage.getItem(key);
  if (!raw) return { draft: null, removed: false };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || typeof parsed.code !== 'string' || typeof parsed.language !== 'string') {
      storage.removeItem(key);
      return { draft: null, removed: true };
    }

    if (parsed.savedAt !== undefined) {
      if (typeof parsed.savedAt !== 'string' || isExpired(parsed.savedAt, now)) {
        storage.removeItem(key);
        return { draft: null, removed: true };
      }
      return {
        draft: {
          code: parsed.code,
          language: parsed.language,
          savedAt: parsed.savedAt,
        },
        removed: false,
      };
    }

    return {
      draft: {
        code: parsed.code,
        language: parsed.language,
        savedAt: undefined,
      },
      removed: false,
    };
  } catch {
    storage.removeItem(key);
    return { draft: null, removed: true };
  }
}

export function writeWorkspaceDraft({
  storage,
  key,
  code,
  language,
  now = new Date(),
}: WorkspaceDraftWriteInput): void {
  storage.setItem(key, JSON.stringify({
    code,
    language,
    savedAt: now.toISOString(),
  }));
}

export function applyLearningResetStorageCleanup({
  storage,
  userId,
  learningResetAt,
}: LearningResetStorageCleanupInput): LearningResetStorageCleanupResult {
  if (!userId || !learningResetAt) {
    return { removedKeys: [] };
  }

  const appliedKey = `${APPLIED_RESET_PREFIX}${userId}`;
  if (storage.getItem(appliedKey) === learningResetAt) {
    return { removedKeys: [] };
  }

  const removedKeys = removeWorkspaceDrafts(storage);
  storage.setItem(appliedKey, learningResetAt);

  return { removedKeys };
}
```

- [ ] **Step 4: Run helper tests to verify GREEN**

Run:

```bash
pnpm exec vitest run apps/web/src/app/lib/learning-reset-storage.spec.ts --config apps/web/vite.config.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add apps/web/src/app/lib/learning-reset-storage.ts apps/web/src/app/lib/learning-reset-storage.spec.ts
git commit -m "feat(web): add workspace draft ttl helpers"
```

---

### Task 4: Frontend API and Admin Student UI

**Files:**
- Modify: `libs/shared/src/lib/admin.types.ts`
- Modify: `apps/web/src/app/api/students.api.ts`
- Modify: `apps/web/src/app/api/student.queries.ts`
- Modify: `apps/web/src/app/pages/admin/students/StudentProfilePage.tsx`

**Interfaces:**
- Consumes: Backend `POST /students/:id/block` and `POST /students/:id/unblock`.
- Produces:
  - `IStudentProfile.isActive`
  - `studentsApi.block(id)`, `studentsApi.unblock(id)`
  - `useBlockStudent(id)`, `useUnblockStudent(id)`
  - Admin UI buttons and confirmations.

- [ ] **Step 1: Add shared/API types**

In `libs/shared/src/lib/admin.types.ts`, add below `avatarUrl?: string | null;`:

```ts
  isActive: boolean;
```

In `apps/web/src/app/api/students.api.ts`, add `isActive` to `ApiUser`:

```ts
  isActive: boolean;
```

Add to `toStudent` after `avatarUrl`:

```ts
    isActive: s.user.isActive,
```

Add result interfaces under `ResetStudentLearningDataResult`:

```ts
export interface BlockStudentResult extends ResetStudentLearningDataResult {
  blockedAt: string;
  isActive: false;
  alreadyBlocked: boolean;
}

export interface UnblockStudentResult {
  studentId: string;
  userId: string;
  unblockedAt: string;
  isActive: true;
}
```

Add API methods near `resetLearningData`:

```ts
  async block(id: string): Promise<BlockStudentResult> {
    const { data } = await apiClient.post<BlockStudentResult>(`/students/${id}/block`);
    return data;
  },

  async unblock(id: string): Promise<UnblockStudentResult> {
    const { data } = await apiClient.post<UnblockStudentResult>(`/students/${id}/unblock`);
    return data;
  },
```

- [ ] **Step 2: Add React Query mutations**

In `apps/web/src/app/api/student.queries.ts`, add helper below `useResetStudentLearningData`:

```ts
function invalidateStudentLearningCaches(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  userId: string,
) {
  void qc.invalidateQueries({ queryKey: ['students'] });
  void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(id) });
  void qc.invalidateQueries({ queryKey: studentQueryKeys.byUserId(userId) });
  void qc.invalidateQueries({ queryKey: studentQueryKeys.me() });
  void qc.invalidateQueries({ queryKey: studentQueryKeys.dashboard() });
  void qc.invalidateQueries({ queryKey: ['submissions'] });
  void qc.invalidateQueries({ queryKey: ['submissions-all'] });
  void qc.invalidateQueries({ queryKey: ['submissions-all-my'] });
  void qc.invalidateQueries({ queryKey: ['leaderboard'] });
  void qc.invalidateQueries({ queryKey: ['student-quests'] });
  void qc.invalidateQueries({ queryKey: ['student-badges'] });
  void qc.invalidateQueries({ queryKey: ['shop'] });
  void qc.invalidateQueries({ queryKey: ['maze-levels'] });
}
```

Refactor `useResetStudentLearningData` `onSuccess` body to call:

```ts
      invalidateStudentLearningCaches(qc, id, result.userId);
```

Add hooks:

```ts
export function useBlockStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentsApi.block(id),
    onSuccess: (result) => {
      invalidateStudentLearningCaches(qc, id, result.userId);
    },
  });
}

export function useUnblockStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentsApi.unblock(id),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['students'] });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.byUserId(result.userId) });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.me() });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.dashboard() });
    },
  });
}
```

- [ ] **Step 3: Wire admin UI actions**

Update imports in `StudentProfilePage.tsx`:

```ts
  useBlockStudent,
  useUnblockStudent,
```

Create mutations next to `resetLearningData`:

```ts
  const blockStudent = useBlockStudent(idParam as string);
  const unblockStudent = useUnblockStudent(idParam as string);
```

Add handlers below `handleResetLearningData`:

```tsx
  async function handleBlockStudent() {
    const ok = await confirm({
      title: t('pages.admin.studentProfile.block.title', 'Block student'),
      message: (
        <div className="space-y-2 text-left">
          <p>
            {t(
              'pages.admin.studentProfile.block.message',
              'Học sinh sẽ không thể truy cập website. Hệ thống sẽ xóa bài đã làm, submissions, progress khóa học, quest, badge, maze, shop và đặt lại XP/gems/level.',
            )}
          </p>
          <p className="font-medium">
            {t(
              'pages.admin.studentProfile.block.keep',
              'Thông tin cá nhân, học phí, lớp học, lịch học, điểm danh và dữ liệu finance sẽ được giữ nguyên.',
            )}
          </p>
          <p className="text-error font-medium">
            {t(
              'pages.admin.studentProfile.block.noRestore',
              'Unblock sau này chỉ mở lại quyền truy cập, không khôi phục dữ liệu học tập đã reset.',
            )}
          </p>
        </div>
      ),
      confirmLabel: t('pages.admin.studentProfile.block.confirm', 'Block student'),
      cancelLabel: t('common.cancel', 'Cancel'),
      intent: 'danger',
    });
    if (!ok) return;

    try {
      const result = await blockStudent.mutateAsync();
      const deletedCount =
        result.submissionsDeleted +
        result.assignmentProgressDeleted +
        result.questsDeleted +
        result.badgesDeleted +
        result.shopItemsDeleted +
        result.mazeSubmissionsDeleted;
      toast.success(
        t('pages.admin.studentProfile.block.success', {
          defaultValue: 'Đã block học sinh và reset dữ liệu học tập ({{count}} bản ghi).',
          count: deletedCount,
        }),
      );
    } catch {
      toast.error(t('pages.admin.studentProfile.block.error', 'Không thể block học sinh. Vui lòng thử lại.'));
    }
  }

  async function handleUnblockStudent() {
    const ok = await confirm({
      title: t('pages.admin.studentProfile.unblock.title', 'Unblock student'),
      message: (
        <div className="space-y-2 text-left">
          <p>{t('pages.admin.studentProfile.unblock.message', 'Học sinh sẽ có thể đăng nhập lại.')}</p>
          <p className="font-medium">
            {t(
              'pages.admin.studentProfile.unblock.noRestore',
              'Dữ liệu học tập đã reset sẽ không được khôi phục; học sinh bắt đầu lại từ trạng thái reset.',
            )}
          </p>
        </div>
      ),
      confirmLabel: t('pages.admin.studentProfile.unblock.confirm', 'Unblock student'),
      cancelLabel: t('common.cancel', 'Cancel'),
      intent: 'primary',
    });
    if (!ok) return;

    try {
      await unblockStudent.mutateAsync();
      toast.success(t('pages.admin.studentProfile.unblock.success', 'Đã unblock học sinh.'));
    } catch {
      toast.error(t('pages.admin.studentProfile.unblock.error', 'Không thể unblock học sinh. Vui lòng thử lại.'));
    }
  }
```

Update title badge area:

```tsx
              <div className="flex items-center gap-sm mt-xs">
                <EnrollmentStatusBadge status={s.status} />
                <StatusBadge tone={s.isActive ? 'success' : 'error'}>
                  {s.isActive
                    ? t('pages.admin.studentProfile.accountActive', 'Active')
                    : t('pages.admin.studentProfile.accountBlocked', 'Blocked')}
                </StatusBadge>
              </div>
```

Add block/unblock button after reset learning button:

```tsx
            {base === '/admin' && (
              s.isActive ? (
                <Button
                  variant="danger"
                  leadingIcon={<Icon name="block" size={18} />}
                  disabled={blockStudent.isPending}
                  onClick={handleBlockStudent}
                >
                  {t('pages.admin.studentProfile.block.action', 'Block student')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  leadingIcon={<Icon name="lock_open" size={18} />}
                  disabled={unblockStudent.isPending}
                  onClick={handleUnblockStudent}
                >
                  {t('pages.admin.studentProfile.unblock.action', 'Unblock student')}
                </Button>
              )
            )}
```

- [ ] **Step 4: Run TypeScript checks for touched frontend code**

Run:

```bash
pnpm exec tsc -p apps/web/tsconfig.app.json --noEmit
```

Expected: PASS, except if the known unrelated Blockly `getOptions` type error appears. If that known error appears, record it and continue with targeted Vitest and backend tests.

- [ ] **Step 5: Commit Task 4**

```bash
git add libs/shared/src/lib/admin.types.ts apps/web/src/app/api/students.api.ts apps/web/src/app/api/student.queries.ts apps/web/src/app/pages/admin/students/StudentProfilePage.tsx
git commit -m "feat(web): add student block admin controls"
```

---

### Task 5: WorkspacePage TTL and Blocked Session Cleanup

**Files:**
- Modify: `apps/web/src/app/pages/student/WorkspacePage.tsx`
- Modify: `apps/web/src/app/providers/AuthProvider.tsx`
- Test: `apps/web/src/app/lib/learning-reset-storage.spec.ts`

**Interfaces:**
- Consumes: Task 3 helpers.
- Produces: Workspace drafts are read/written with `savedAt`; blocked responses clear auth and workspace drafts.

- [ ] **Step 1: Write blocked cleanup helper test**

Add this test to `learning-reset-storage.spec.ts` if it was not already added in Task 3:

```ts
it('removeWorkspaceDrafts is safe to call before auth clear on blocked responses', () => {
  const storage = new MemoryStorage();
  storage.setItem('code-draft-workspace-a', '{"code":"old"}');
  storage.setItem('code-draft-workspace-b', '{"code":"old"}');
  storage.setItem('cp_default_language', 'python');

  const removed = removeWorkspaceDrafts(storage);

  expect(removed).toEqual(['code-draft-workspace-a', 'code-draft-workspace-b']);
  expect(storage.getItem('cp_default_language')).toBe('python');
});
```

- [ ] **Step 2: Run helper tests**

Run:

```bash
pnpm exec vitest run apps/web/src/app/lib/learning-reset-storage.spec.ts --config apps/web/vite.config.ts
```

Expected: PASS.

- [ ] **Step 3: Use draft helpers in WorkspacePage**

Update imports:

```ts
import {
  applyLearningResetStorageCleanup,
  readWorkspaceDraft,
  writeWorkspaceDraft,
} from '../../lib/learning-reset-storage';
```

Replace local type:

```ts
type WorkspaceDraft = { language: string; code: string };
```

Keep the same local type because page state only needs language/code.

Replace `readCurrentWorkspaceDraft` with:

```ts
  const readCurrentWorkspaceDraft = (): WorkspaceDraft => {
    const fallback = LANG_OPTIONS.find(l => l.value === localStorage.getItem('cp_default_language')) || defaultLangOption;
    const result = readWorkspaceDraft({
      storage: window.localStorage,
      key: draftKey,
    });
    const draftLang = LANG_OPTIONS.find(l => l.value === result.draft?.language) || fallback;
    return {
      language: draftLang.value,
      code: typeof result.draft?.code === 'string' ? result.draft.code : draftLang.template,
    };
  };
```

Replace auto-save body:

```ts
        writeWorkspaceDraft({
          storage: window.localStorage,
          key: draftKey,
          code,
          language,
        });
```

- [ ] **Step 4: Implement blocked response cleanup in AuthProvider**

Update import:

```ts
import { removeWorkspaceDrafts } from '../lib/learning-reset-storage';
```

Add helpers near `processQueue`:

```ts
const isBlockedResponse = (err: any) => (
  err?.response?.status === 403 &&
  err?.response?.data?.code === 'USER_BLOCKED'
);

function removeDraftsBeforeLogout() {
  try {
    removeWorkspaceDrafts(window.localStorage);
  } catch {
    // Storage cleanup must not prevent auth cleanup.
  }
}
```

Inside response interceptor, before the 401 refresh block:

```ts
        if (isBlockedResponse(err)) {
          processQueue(err, null);
          removeDraftsBeforeLogout();
          clear();
          return Promise.reject(err);
        }
```

Inside `catch (refreshErr)` before `clear()`:

```ts
            if (isBlockedResponse(refreshErr)) {
              removeDraftsBeforeLogout();
            }
```

- [ ] **Step 5: Run frontend helper tests and typecheck**

Run:

```bash
pnpm exec vitest run apps/web/src/app/lib/learning-reset-storage.spec.ts --config apps/web/vite.config.ts
pnpm exec tsc -p apps/web/tsconfig.app.json --noEmit
```

Expected: Vitest PASS. TypeScript PASS, except for the known unrelated Blockly `getOptions` error if it appears.

- [ ] **Step 6: Commit Task 5**

```bash
git add apps/web/src/app/pages/student/WorkspacePage.tsx apps/web/src/app/providers/AuthProvider.tsx apps/web/src/app/lib/learning-reset-storage.spec.ts
git commit -m "feat(web): clear expired and blocked student drafts"
```

---

### Task 6: Final Verification

**Files:**
- No code edits unless verification exposes a defect in files changed by Tasks 1-5.

**Interfaces:**
- Consumes: All prior tasks.
- Produces: Verified implementation ready for review.

- [ ] **Step 1: Run backend focused tests**

```bash
pnpm nx test api --testFile=apps/api/src/modules/students/students.service.spec.ts --runInBand
pnpm nx test api --testFile=apps/api/src/modules/students/students.controller.spec.ts --runInBand
pnpm nx test api --testFile=apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts --runInBand
pnpm nx test api --testFile=apps/api/src/modules/auth/auth.service.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 2: Run frontend focused tests**

```bash
pnpm exec vitest run apps/web/src/app/lib/learning-reset-storage.spec.ts --config apps/web/vite.config.ts
```

Expected: PASS.

- [ ] **Step 3: Run builds/typechecks**

```bash
pnpm nx build api
pnpm exec tsc -p apps/web/tsconfig.app.json --noEmit
```

Expected: API build PASS. Web typecheck PASS unless the known unrelated Blockly `getOptions` error appears at `apps/web/src/app/features/maze/blockly/blocks.ts(126,55)`.

- [ ] **Step 4: Run diff hygiene check**

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Review changed files**

```bash
git status --short
git diff --stat HEAD
```

Expected: only files from this feature are modified or committed. No unrelated file churn.

- [ ] **Step 6: Final commit if previous tasks were not committed individually**

If tasks were executed without per-task commits, commit all feature changes:

```bash
git add apps/api/src/modules/students/students.service.ts apps/api/src/modules/students/students.controller.ts apps/api/src/modules/students/students.service.spec.ts apps/api/src/modules/students/students.controller.spec.ts apps/api/src/modules/auth/strategies/jwt.strategy.ts apps/api/src/modules/auth/strategies/jwt.strategy.spec.ts apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.spec.ts libs/shared/src/lib/admin.types.ts apps/web/src/app/api/students.api.ts apps/web/src/app/api/student.queries.ts apps/web/src/app/pages/admin/students/StudentProfilePage.tsx apps/web/src/app/lib/learning-reset-storage.ts apps/web/src/app/lib/learning-reset-storage.spec.ts apps/web/src/app/providers/AuthProvider.tsx apps/web/src/app/pages/student/WorkspacePage.tsx
git commit -m "feat: block student accounts and expire drafts"
```

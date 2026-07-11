# Daily Check-in — Phase 1 (Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship the independently-deployable core daily check-in loop — a student self-check-in that grants base gems/XP plus a capped streak bonus in one atomic transaction, persists a per-user streak + a per-month calendar board, and surfaces it via a page, a once/day popup, and sidebar nav.

**Architecture:** A new self-contained NestJS module `apps/api/src/modules/checkin/` owns two TypeORM entities (`daily_checkins`, `checkin_states`) whose full schema (including default-0 Phase-2 enrichment columns) is created up-front for stability; `CheckinService` mirrors `QuestsService.applyRewardTx` (single `ds.transaction` with `FOR UPDATE` locks on `checkin_states` + `student_profiles`, injected `now`, cache bump, gateway publish) and builds its returned `ICheckinResult.status` from the in-transaction state object (no second DB read). The React side adds a thin axios API, react-query hooks, a `CheckinPage`, a gated `CheckinPopup`, and a pure `checkin-board.ts` helper (board layout, streak-bonus formula, and the once/day popup-gate decision) tested with vitest. Day boundaries use `Asia/Ho_Chi_Minh` via a new pure `checkinDayKey(now)` helper co-located with the existing quest period-keys.

**Tech Stack:** NestJS + TypeORM (Postgres, `synchronize: true`) on `apps/api`; React + react-query + axios + i18next on `apps/web`; Jest (via `nx test api`) for backend, Vitest (run directly) for frontend pure helpers; shared TypeScript interfaces in `libs/shared` (`@cp/shared`).

## Global Constraints

- **Monorepo:** NestJS backend in `apps/api`, React frontend in `apps/web`, shared types in `libs/shared/src` exported through `libs/shared/src/index.ts` as `@cp/shared`.
- **`synchronize: true`:** any new entity MUST be registered in BOTH `apps/api/src/app/app.module.ts` (via `TypeOrmModule.forFeature` inside its module) AND `apps/api/src/database/data-source.ts` `entities` array, or the TypeORM CLI (migration:generate/run) will not see it. (See memory `schema-drift-synchronize-gotcha.md`: `synchronize` does not reliably sync named constraints/enums — create the full stable schema once.)
- **Day boundary = `Asia/Ho_Chi_Minh` (UTC+7)** via `checkinDayKey(now)`. Never use raw UTC `toISOString().slice(0,10)` for check-in day keys.
- **`now` is always an injected method parameter**, never `new Date()` inside a transaction; thread the same `now` through `checkinDayKey(now)` and `applyXpGain(profile, xp, now)`.
- **One transaction per action:** all mutations for a single check-in (state streak, profile gems/xp/level, `daily_checkins` insert) run inside ONE `ds.transaction`, with `FOR UPDATE` (`lock: { mode: 'pessimistic_write' }`) on the user's `checkin_states` and `student_profiles` rows before any read-modify-write. The `UQ_daily_checkin_user_day` unique constraint is the backstop; catch Postgres `23505` OUTSIDE the transaction (after full rollback) and return `alreadyCheckedIn: true`.
- **Returned status is state-after-action:** `checkIn()` builds `ICheckinResult.status` from the same in-memory `CheckinState` object it just mutated inside the transaction (that object equals the committed row), NOT from a second post-transaction `getMe` DB read. This keeps production correct AND makes unit tests with mocked repositories deterministic (design §8).
- **Currency lives on `StudentProfile`** (`gems`, `xp`, `level`), NOT on `User`. Reuse `applyXpGain` (`../quests/period-keys`) and `advanceLevel` (`../../common/gamification.constants`, `XP_PER_LEVEL = 10000`).
- **Phase-1 boundary:** the entities carry enrichment columns (`freezeTokens`, `pendingWheelSpins`, `makeupUsedThisMonth`, `highestMilestoneAwarded`) as `default 0`, but NO Phase-1 code reads or writes them, and `checkin.constants.ts` contains ONLY Phase-1 constants (base gems/xp + streak bonus). The board builder and `checkin-board.ts` emit ONLY `{ checked, missed, future, today }`. NO reference to freeze / makeup / wheel / milestone / leaderboard / perfect-month anywhere in Phase-1 code.
- **TDD required:** write the failing test first, watch it fail, write minimal code, watch it pass. Commit frequently with conventional messages. Where a task is verified by `nx build` only (module wiring, page/popup composition, i18n), that is a deliberate, noted exception — all testable logic (day keys, reward math, board layout, popup gate, controller delegation) is extracted into pure/unit-tested units.
- **Web has no nx `test` target** — run frontend tests with `npx vitest run <path>` directly (`nx test web` does NOT work).
- **Shared dev DB:** `DATABASE_URL` in dev points at a shared AWS RDS (memory `shared-remote-dev-db.md`). No task in this plan runs against it; the optional live smoke test in Task 13 is explicitly confirmation-gated.

---

### Task 1: Shared `ICheckin*` interfaces

**Files:**
- Create: `libs/shared/src/lib/types/checkin.types.ts`
- Modify: `libs/shared/src/index.ts`

**Interfaces:**
- Consumes: nothing (leaf types).
- Produces: `ICheckinBoardCell`, `ICheckinStatus`, `ICheckinReward`, `ICheckinResult`, `ICheckinWheelResult`, `ICheckinLeaderboardRow` — all exported from `@cp/shared`. Phase-1 code uses `ICheckinBoardCell`, `ICheckinStatus`, `ICheckinReward`, `ICheckinResult`; the other two are declared now for schema/type stability but unused until Phase 2.

- [ ] Step: Create the shared types file. Write the full file `libs/shared/src/lib/types/checkin.types.ts`:
```ts
// ───────────────────────────────────────────────────────────────────────────
// Daily Check-in (điểm danh) — student self check-in gamification loop.
//
// One `daily_checkins` row per (user, dayKey); one `checkin_states` row per
// user. `status` values `makeup`/`missable` are Phase-2-only; `missed` is
// Phase-1-only (see design §4.3). The union carries all six for stability.
// ───────────────────────────────────────────────────────────────────────────

export interface ICheckinBoardCell {
  dayKey: string; // 'YYYY-MM-DD'
  status: 'checked' | 'makeup' | 'missable' | 'missed' | 'future' | 'today';
}

export interface ICheckinStatus {
  today: string; // checkinDayKey(now), VN day
  checkedInToday: boolean;
  monthKey: string; // 'YYYY-MM'
  board: ICheckinBoardCell[]; // whole current month
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  monthlyCheckins: number; // display-only
  freezeTokens: number;
  pendingWheelSpins: number;
  makeupRemaining: number;
  makeupCost: number;
}

export interface ICheckinReward {
  gems: number;
  xp: number;
}

export interface ICheckinResult {
  status: ICheckinStatus; // state after the action
  reward: ICheckinReward; // gems/xp granted by this action
  weeklyMilestone: boolean;
  allTimeMilestone: number | null; // 7|30|100|null
  perfectMonth: boolean;
  badgesEarned: string[]; // badge codes
  spinsGranted: number;
  leveledUp: boolean;
  alreadyCheckedIn?: boolean; // POST /checkin idempotent (HTTP 200, reward {0,0})
}

export interface ICheckinWheelResult {
  segmentIndex: number;
  prize: { kind: 'gems' | 'xp' | 'item'; amount?: number; itemCode?: string };
  status: ICheckinStatus;
}

export interface ICheckinLeaderboardRow {
  userId: string;
  displayName: string; // computed `${firstName} ${lastName}`.trim()
  avatarUrl: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  rank: number;
}
```

- [ ] Step: Export the new file from the shared barrel. Add this line to `libs/shared/src/index.ts` immediately after the existing `export * from './lib/types/shop.types';` line:
```ts
export * from './lib/types/checkin.types';
```

- [ ] Step: Verify the shared lib type-checks. Run:
```bash
npx tsc --noEmit -p libs/shared/tsconfig.lib.json
```
Expect: exit code 0, no errors. (If `tsconfig.lib.json` does not exist, run `npx nx build shared` instead and expect a successful build.)

- [ ] Step: Commit.
```bash
git add libs/shared/src/lib/types/checkin.types.ts libs/shared/src/index.ts
git commit -m "feat(shared): add ICheckin* interfaces for daily check-in"
```

---

### Task 2: `checkinDayKey` + `daysBetweenDayKeys` pure helpers (TDD)

**Files:**
- Create: `apps/api/src/modules/quests/period-keys.spec.ts`
- Modify: `apps/api/src/modules/quests/period-keys.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `checkinDayKey(now: Date): string` — VN (`Asia/Ho_Chi_Minh`) calendar day as `'YYYY-MM-DD'`.
  - `daysBetweenDayKeys(a: string, b: string): number` — integer calendar days `b - a`.

- [ ] Step: Write the failing test. Create `apps/api/src/modules/quests/period-keys.spec.ts`:
```ts
import { checkinDayKey, daysBetweenDayKeys } from './period-keys';

describe('checkinDayKey (Asia/Ho_Chi_Minh, UTC+7)', () => {
  it('maps 16:59:59Z to the same VN day and 17:00:00Z to the next VN day', () => {
    // 2026-07-11T16:59:59Z = 2026-07-11 23:59:59 VN
    expect(checkinDayKey(new Date('2026-07-11T16:59:59Z'))).toBe('2026-07-11');
    // 2026-07-11T17:00:00Z = 2026-07-12 00:00:00 VN
    expect(checkinDayKey(new Date('2026-07-11T17:00:00Z'))).toBe('2026-07-12');
  });

  it('treats early-morning VN time as the correct VN day (not the UTC yesterday)', () => {
    // 2026-07-03T23:00:00Z = 2026-07-04 06:00 VN
    expect(checkinDayKey(new Date('2026-07-03T23:00:00Z'))).toBe('2026-07-04');
  });
});

describe('daysBetweenDayKeys', () => {
  it('returns b - a in whole calendar days, including across months', () => {
    expect(daysBetweenDayKeys('2026-07-01', '2026-07-04')).toBe(3);
    expect(daysBetweenDayKeys('2026-07-11', '2026-07-11')).toBe(0);
    expect(daysBetweenDayKeys('2026-07-31', '2026-08-01')).toBe(1);
    expect(daysBetweenDayKeys('2026-07-04', '2026-07-01')).toBe(-3);
  });
});
```

- [ ] Step: Run the test, expect FAIL. Run:
```bash
npx nx test api --testPathPattern=period-keys.spec
```
Expect failure: `TS2305: Module '"./period-keys"' has no exported member 'checkinDayKey'` (and `daysBetweenDayKeys`).

- [ ] Step: Write the minimal implementation. Append to `apps/api/src/modules/quests/period-keys.ts` (after the existing `currentMonthlyXp` function, at end of file):
```ts

// ── Check-in day keys (Asia/Ho_Chi_Minh, UTC+7) ──────────────────────────────

const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Calendar day in VN (UTC+7), as 'YYYY-MM-DD'. */
export function checkinDayKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Whole calendar days from dayKey `a` to `b` (b - a). */
export function daysBetweenDayKeys(a: string, b: string): number {
  const toUtcNoon = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12);
  };
  return Math.round((toUtcNoon(b) - toUtcNoon(a)) / 86400000);
}
```

- [ ] Step: Run the test, expect PASS. Run:
```bash
npx nx test api --testPathPattern=period-keys.spec
```
Expect: both describe blocks green (`checkinDayKey`, `daysBetweenDayKeys`).

- [ ] Step: Commit.
```bash
git add apps/api/src/modules/quests/period-keys.ts apps/api/src/modules/quests/period-keys.spec.ts
git commit -m "feat(api): add checkinDayKey + daysBetweenDayKeys VN day helpers"
```

---

### Task 3: Entities + Phase-1 constants

**Files:**
- Create: `apps/api/src/modules/checkin/daily-checkin.entity.ts`
- Create: `apps/api/src/modules/checkin/checkin-state.entity.ts`
- Create: `apps/api/src/modules/checkin/checkin.constants.ts`

**Interfaces:**
- Consumes: `BaseEntity` from `../../common/entities/base.entity`.
- Produces:
  - `class DailyCheckin` (columns: `userId: string`, `dayKey: string`, `monthKey: string`, `source: string`).
  - `class CheckinState` (columns: `userId`, `currentStreak`, `longestStreak`, `lastCheckinDate: string | null`, `totalCheckins`, `monthKey: string | null`, `monthlyCheckins`, plus default-0 enrichment columns `freezeTokens`, `pendingWheelSpins`, `makeupUsedThisMonth`, `highestMilestoneAwarded`).
  - Constants: `CHECKIN_BASE_GEMS = 5`, `CHECKIN_BASE_XP = 20`, `CHECKIN_STREAK_GEM_PER_DAY = 2`, `CHECKIN_STREAK_GEM_CAP = 20`; helper `streakBonusGems(currentStreak: number): number`.

- [ ] Step: Write the `DailyCheckin` entity. Create `apps/api/src/modules/checkin/daily-checkin.entity.ts`:
```ts
import { Column, Entity, Index, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

/**
 * One row per (user, dayKey). `source` distinguishes real check-ins from
 * Phase-2 makeup fills; Phase-1 only ever writes 'checkin'. The UNIQUE
 * constraint is the double-check-in backstop (design §10).
 */
@Entity({ name: 'daily_checkins' })
@Unique('UQ_daily_checkin_user_day', ['userId', 'dayKey'])
@Index('IDX_daily_checkin_user_month', ['userId', 'monthKey'])
export class DailyCheckin extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  /** 'YYYY-MM-DD' in VN time. */
  @Column({ type: 'date', name: 'day_key' })
  dayKey!: string;

  /** 'YYYY-MM', used to build the monthly board fast. */
  @Column({ type: 'varchar', length: 7, name: 'month_key' })
  monthKey!: string;

  /** 'checkin' | 'makeup' — Phase 1 only writes 'checkin'. */
  @Column({ type: 'varchar', length: 16, default: 'checkin' })
  source!: string;
}
```

- [ ] Step: Write the `CheckinState` entity (full schema incl. default-0 enrichment columns). Create `apps/api/src/modules/checkin/checkin-state.entity.ts`:
```ts
import { Column, Entity, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

/**
 * One row per user. Enrichment columns (freezeTokens, pendingWheelSpins,
 * makeupUsedThisMonth, highestMilestoneAwarded) are created up-front as
 * default-0 for schema stability (design §3.2 tradeoff); NO Phase-1 code
 * reads or writes them.
 */
@Entity({ name: 'checkin_states' })
@Unique('UQ_checkin_state_user', ['userId'])
export class CheckinState extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'int', default: 0, name: 'current_streak' })
  currentStreak!: number;

  @Column({ type: 'int', default: 0, name: 'longest_streak' })
  longestStreak!: number;

  @Column({ type: 'date', nullable: true, name: 'last_checkin_date' })
  lastCheckinDate!: string | null;

  @Column({ type: 'int', default: 0, name: 'total_checkins' })
  totalCheckins!: number;

  @Column({ type: 'varchar', length: 7, nullable: true, name: 'month_key' })
  monthKey!: string | null;

  @Column({ type: 'int', default: 0, name: 'monthly_checkins' })
  monthlyCheckins!: number;

  // ── Enrichment columns (Phase 2) — default-0, untouched in Phase 1 ──────────
  @Column({ type: 'int', default: 0, name: 'freeze_tokens' })
  freezeTokens!: number;

  @Column({ type: 'int', default: 0, name: 'pending_wheel_spins' })
  pendingWheelSpins!: number;

  @Column({ type: 'int', default: 0, name: 'makeup_used_this_month' })
  makeupUsedThisMonth!: number;

  @Column({ type: 'int', default: 0, name: 'highest_milestone_awarded' })
  highestMilestoneAwarded!: number;
}
```

- [ ] Step: Write the Phase-1 constants. Create `apps/api/src/modules/checkin/checkin.constants.ts`:
```ts
/**
 * ── Check-in reward economy (Phase 1) ────────────────────────────────────────
 *
 * Phase-1 tunables ONLY: base gems/XP per check-in + a capped streak bonus.
 * Weekly / freeze / makeup / wheel / milestone / perfect-month constants are
 * added in Phase 2 — do NOT reference them here.
 */

/** Gems granted for an ordinary check-in. */
export const CHECKIN_BASE_GEMS = 5;

/** XP granted for an ordinary check-in. */
export const CHECKIN_BASE_XP = 20;

/** Extra gems per streak day beyond day 1. */
export const CHECKIN_STREAK_GEM_PER_DAY = 2;

/** Cap on the streak-bonus gems. */
export const CHECKIN_STREAK_GEM_CAP = 20;

/** bonusGems = min(cap, (currentStreak - 1) * perDay); never negative. */
export function streakBonusGems(currentStreak: number): number {
  return Math.min(CHECKIN_STREAK_GEM_CAP, Math.max(0, currentStreak - 1) * CHECKIN_STREAK_GEM_PER_DAY);
}
```

- [ ] Step: Commit (entities + constants are exercised by Task 5's tests).
```bash
git add apps/api/src/modules/checkin/daily-checkin.entity.ts apps/api/src/modules/checkin/checkin-state.entity.ts apps/api/src/modules/checkin/checkin.constants.ts
git commit -m "feat(api): add checkin entities and Phase-1 reward constants"
```

---

### Task 4: Register check-in entities in the standalone DataSource

**Files:**
- Modify: `apps/api/src/database/data-source.ts`

**Interfaces:**
- Consumes: `DailyCheckin`, `CheckinState` (Task 3).
- Produces: both entities present in `AppDataSource.entities`. This step compiles standalone (no dependency on the not-yet-created module/service/controller), so the repo builds and commits cleanly here. `CheckinModule` + `AppModule` wiring is done later in Task 7, after the service and controller exist.

> This is the first half of the module wiring, split out because the module file (Task 7) imports `CheckinService` (Task 5) and `CheckinController` (Task 6), which do not exist yet. Registering the entities here is self-contained and keeps every commit in a building state.

- [ ] Step: Register both entities in the standalone DataSource. In `apps/api/src/database/data-source.ts`, add the import after the existing chat imports (after line `import { ChatMessage } from '../modules/chat/chat-message.entity';`):
```ts
import { DailyCheckin } from '../modules/checkin/daily-checkin.entity';
import { CheckinState } from '../modules/checkin/checkin-state.entity';
```
Then add `DailyCheckin,` and `CheckinState,` to the `entities` array, immediately after the `ChatMessage,` entry:
```ts
    ChatConversation,
    ChatMessage,

    DailyCheckin,
    CheckinState,
  ],
```

- [ ] Step: Verify the API still builds with the entities registered (no module referenced yet). Run:
```bash
npx nx build api --skip-nx-cache
```
Expect: successful build, no TS errors referencing `DailyCheckin` or `CheckinState`.

- [ ] Step: Commit.
```bash
git add apps/api/src/database/data-source.ts
git commit -m "feat(api): register checkin entities in the TypeORM data-source"
```

---

### Task 5: `CheckinService` — `getMe` + `checkIn` (spec first)

**Files:**
- Create: `apps/api/src/modules/checkin/checkin.service.spec.ts`
- Create: `apps/api/src/modules/checkin/checkin.service.ts`

**Interfaces:**
- Consumes: `checkinDayKey`, `daysBetweenDayKeys`, `applyXpGain` (`../quests/period-keys`); `advanceLevel` (`../../common/gamification.constants`); `CHECKIN_BASE_GEMS`, `CHECKIN_BASE_XP`, `streakBonusGems` (`./checkin.constants`); `SystemCacheService.bumpTags(tags: string[])`; `GamificationGateway.publish(userId, event: IGamificationEvent)`; entities `CheckinState`, `DailyCheckin`, `StudentProfile`.
- Produces:
  - `class CheckinService` with constructor `(states: Repository<CheckinState>, dailies: Repository<DailyCheckin>, profiles: Repository<StudentProfile>, ds: DataSource, cache: SystemCacheService, gateway: GamificationGateway)`.
  - `getMe(userId: string, now?: Date): Promise<ICheckinStatus>`.
  - `checkIn(userId: string, now?: Date): Promise<ICheckinResult>` — builds the returned `status` from the in-transaction `CheckinState` object (state-after-action), NOT a second DB read.
  - Module-level `buildCheckinBoard(monthKey: string, today: string, rows: { dayKey: string; source: string }[]): ICheckinBoardCell[]` (emits only `checked | today | future | missed`).

- [ ] Step: Write the failing test. Create `apps/api/src/modules/checkin/checkin.service.spec.ts`:
```ts
import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { CheckinService } from './checkin.service';

function makeService(
  seed: {
    state?: Partial<CheckinState>;
    profile?: Partial<StudentProfile> | null;
    dailyRows?: { dayKey: string; source: string }[];
  } = {},
) {
  const stateRow = seed.state ?? null;
  const stateRepo = {
    findOne: jest.fn().mockResolvedValue(stateRow),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
  };
  const dailyRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
    find: jest.fn().mockResolvedValue(seed.dailyRows ?? []),
  };
  const profileRepo = {
    findOne: jest.fn().mockResolvedValue(
      seed.profile === null ? null : seed.profile ?? { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    ),
    save: jest.fn(async (x: unknown) => x),
  };

  const repos = new Map<unknown, unknown>([
    [CheckinState, stateRepo],
    [DailyCheckin, dailyRepo],
    [StudentProfile, profileRepo],
  ]);
  const tx = { getRepository: jest.fn((e: unknown) => repos.get(e)) };
  const ds = { transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) };
  const cache = { bumpTags: jest.fn().mockResolvedValue(undefined) };
  const gateway = { publish: jest.fn() };

  const service = new CheckinService(
    stateRepo as never,
    dailyRepo as never,
    profileRepo as never,
    ds as never,
    cache as never,
    gateway as never,
  );
  return { service, tx, cache, gateway, stateRepo, dailyRepo, profileRepo };
}

const NOW = new Date('2026-07-11T03:00:00Z'); // 2026-07-11 10:00 VN → dayKey 2026-07-11

describe('CheckinService.checkIn', () => {
  it('first-ever check-in: streak=1, grants base gems/xp, no bonus', async () => {
    const ctx = makeService({ profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 } });
    const res = await ctx.service.checkIn('u1', NOW);

    expect(res.alreadyCheckedIn).toBeUndefined();
    expect(res.reward).toEqual({ gems: 5, xp: 20 });
    expect(res.status.currentStreak).toBe(1);
    expect(res.status.checkedInToday).toBe(true);
    expect(ctx.dailyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', dayKey: '2026-07-11', monthKey: '2026-07', source: 'checkin' }),
    );
    expect(ctx.cache.bumpTags).toHaveBeenCalled();
  });

  it('consecutive day (gap === 1): streak increments and bonus applies', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 3, longestStreak: 3, lastCheckinDate: '2026-07-10', totalCheckins: 3, monthKey: '2026-07', monthlyCheckins: 3 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    // new streak = 4 → bonus = (4-1)*2 = 6 → gems = 5 + 6 = 11
    expect(res.status.currentStreak).toBe(4);
    expect(res.reward).toEqual({ gems: 11, xp: 20 });
  });

  it('gap > 1 (missed days): streak resets to 1 (no freeze in Phase 1)', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-08', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, freezeTokens: 3 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    expect(res.status.currentStreak).toBe(1);
    expect(res.reward).toEqual({ gems: 5, xp: 20 });
  });

  it('idempotent double check-in: same day → alreadyCheckedIn, reward {0,0}, no daily insert', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 2, longestStreak: 2, lastCheckinDate: '2026-07-11', totalCheckins: 2, monthKey: '2026-07', monthlyCheckins: 2 },
      profile: { userId: 'u1', gems: 100, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    expect(res.alreadyCheckedIn).toBe(true);
    expect(res.reward).toEqual({ gems: 0, xp: 0 });
    expect(res.status.currentStreak).toBe(2);
    expect(res.status.checkedInToday).toBe(true);
    expect(ctx.dailyRepo.save).not.toHaveBeenCalled();
    expect(ctx.profileRepo.save).not.toHaveBeenCalled();
  });

  it('month rollover: old monthKey resets monthlyCheckins before counting', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 1, longestStreak: 5, lastCheckinDate: '2026-06-30', totalCheckins: 20, monthKey: '2026-06', monthlyCheckins: 18, makeupUsedThisMonth: 2 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    // gap from 2026-06-30 to 2026-07-11 > 1 → streak resets to 1; monthly reset then +1
    expect(res.status.monthKey).toBe('2026-07');
    expect(res.status.monthlyCheckins).toBe(1);
    expect(res.status.currentStreak).toBe(1);
  });

  it('publishes a level:up event when the check-in crosses a level', async () => {
    const ctx = makeService({
      profile: { userId: 'u1', gems: 0, xp: 19990, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    // level 1 → 2 threshold = (1+1)*10000 = 20000; 19990 + 20 = 20010 ≥ 20000 → level up
    expect(res.leveledUp).toBe(true);
    expect(ctx.gateway.publish).toHaveBeenCalledWith('u1', expect.objectContaining({ type: 'level:up', level: 2 }));
  });
});

describe('CheckinService.getMe board', () => {
  it('builds a full-month board: checked past + today + future + missed', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 1, longestStreak: 1, lastCheckinDate: '2026-07-11', totalCheckins: 1, monthKey: '2026-07', monthlyCheckins: 1 },
      dailyRows: [{ dayKey: '2026-07-09', source: 'checkin' }, { dayKey: '2026-07-11', source: 'checkin' }],
    });
    const status = await ctx.service.getMe('u1', NOW);
    expect(status.board).toHaveLength(31); // July has 31 days
    const cell = (d: string) => status.board.find((c) => c.dayKey === d)!;
    expect(cell('2026-07-09').status).toBe('checked');
    expect(cell('2026-07-10').status).toBe('missed'); // past, no row
    expect(cell('2026-07-11').status).toBe('checked'); // today but checked wins
    expect(cell('2026-07-12').status).toBe('future');
    expect(status.checkedInToday).toBe(true);
    // Phase-1 enrichment fields are literal zeros:
    expect(status.freezeTokens).toBe(0);
    expect(status.pendingWheelSpins).toBe(0);
    expect(status.makeupRemaining).toBe(0);
    expect(status.makeupCost).toBe(0);
  });

  it("marks the current day 'today' when not yet checked in", async () => {
    const ctx = makeService({ state: null as never, dailyRows: [] });
    const status = await ctx.service.getMe('u1', NOW);
    const today = status.board.find((c) => c.dayKey === '2026-07-11')!;
    expect(today.status).toBe('today');
    expect(status.checkedInToday).toBe(false);
    expect(status.currentStreak).toBe(0);
  });
});
```

- [ ] Step: Run the test, expect FAIL. Run:
```bash
npx nx test api --testPathPattern=checkin.service.spec
```
Expect failure: `Cannot find module './checkin.service'` / `CheckinService is not defined`.

- [ ] Step: Write the minimal implementation. Create `apps/api/src/modules/checkin/checkin.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ICheckinBoardCell, ICheckinResult, ICheckinStatus } from '@cp/shared';

import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { GamificationGateway } from '../quests/gamification.gateway';
import { checkinDayKey, daysBetweenDayKeys, applyXpGain } from '../quests/period-keys';
import { advanceLevel } from '../../common/gamification.constants';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import { CHECKIN_BASE_GEMS, CHECKIN_BASE_XP, streakBonusGems } from './checkin.constants';

/** Number of calendar days in a 'YYYY-MM' month. */
function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Pure board builder for a month. Phase-1 emits only checked | today | future
 * | missed (makeup/missable are Phase-2). Exported for direct unit testing.
 */
export function buildCheckinBoard(
  monthKey: string,
  today: string,
  rows: { dayKey: string; source: string }[],
): ICheckinBoardCell[] {
  const filled = new Map(rows.map((r) => [r.dayKey, r.source] as const));
  const total = daysInMonth(monthKey);
  const cells: ICheckinBoardCell[] = [];
  for (let d = 1; d <= total; d++) {
    const dayKey = `${monthKey}-${String(d).padStart(2, '0')}`;
    let status: ICheckinBoardCell['status'];
    if (filled.get(dayKey) === 'checkin') status = 'checked';
    else if (dayKey === today) status = 'today';
    else if (dayKey > today) status = 'future';
    else status = 'missed';
    cells.push({ dayKey, status });
  }
  return cells;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckinState) private readonly states: Repository<CheckinState>,
    @InjectRepository(DailyCheckin) private readonly dailies: Repository<DailyCheckin>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    private readonly ds: DataSource,
    private readonly cache: SystemCacheService,
    private readonly gateway: GamificationGateway,
  ) {}

  /** Read-only status; never writes. Month-scoped counters are figured on the fly. */
  async getMe(userId: string, now: Date = new Date()): Promise<ICheckinStatus> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);
    const state = await this.states.findOne({ where: { userId } });
    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    return this.toStatus(state, rows, today, monthNow);
  }

  private toStatus(
    state: CheckinState | null,
    rows: { dayKey: string; source: string }[],
    today: string,
    monthNow: string,
  ): ICheckinStatus {
    const sameMonth = !!state && state.monthKey === monthNow;
    return {
      today,
      checkedInToday: state?.lastCheckinDate === today,
      monthKey: monthNow,
      board: buildCheckinBoard(monthNow, today, rows),
      currentStreak: state?.currentStreak ?? 0,
      longestStreak: state?.longestStreak ?? 0,
      totalCheckins: state?.totalCheckins ?? 0,
      monthlyCheckins: sameMonth ? state!.monthlyCheckins : 0,
      // Phase-1 boundary: enrichment/makeup fields are literal zeros (Phase 2 fills them).
      freezeTokens: 0,
      pendingWheelSpins: 0,
      makeupRemaining: 0,
      makeupCost: 0,
    };
  }

  async checkIn(userId: string, now: Date = new Date()): Promise<ICheckinResult> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);

    const outcome = await this.ds
      .transaction(async (tx) => {
        const stateRepo = tx.getRepository(CheckinState);
        const dailyRepo = tx.getRepository(DailyCheckin);
        const profileRepo = tx.getRepository(StudentProfile);

        const state =
          (await stateRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } })) ??
          stateRepo.create({
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastCheckinDate: null,
            totalCheckins: 0,
            monthKey: null,
            monthlyCheckins: 0,
          });
        const profile = await profileRepo.findOne({
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });

        // Month rollover before reading monthly counters.
        if (state.monthKey !== monthNow) {
          state.monthKey = monthNow;
          state.monthlyCheckins = 0;
          // makeupUsedThisMonth reset is Phase-2 behaviour; not touched in Phase 1.
        }

        // Idempotent fast-path — no reward, no insert. Return the (already
        // today-stamped) state so the caller builds status-after-action from it.
        if (state.lastCheckinDate === today) {
          return { gems: 0, xp: 0, leveledUp: false, newLevel: profile?.level ?? 1, alreadyCheckedIn: true as const, state };
        }

        // Streak update (Phase 1: no freeze — any gap > 1 resets).
        if (state.lastCheckinDate == null) {
          state.currentStreak = 1;
        } else {
          const gap = daysBetweenDayKeys(state.lastCheckinDate, today);
          state.currentStreak = gap === 1 ? state.currentStreak + 1 : 1;
        }
        state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
        state.lastCheckinDate = today;
        state.totalCheckins += 1;
        state.monthlyCheckins += 1;

        const gems = CHECKIN_BASE_GEMS + streakBonusGems(state.currentStreak);
        const xp = CHECKIN_BASE_XP;

        let leveledUp = false;
        let newLevel = profile?.level ?? 1;
        if (profile) {
          applyXpGain(profile, xp, now);
          profile.gems += gems;
          leveledUp = advanceLevel(profile);
          newLevel = profile.level;
          await profileRepo.save(profile);
        }
        await stateRepo.save(state);
        await dailyRepo.save(
          dailyRepo.create({ userId, dayKey: today, monthKey: monthNow, source: 'checkin' }),
        );
        return { gems, xp, leveledUp, newLevel, alreadyCheckedIn: false as const, state };
      })
      .catch((err) => {
        if (isUniqueViolation(err)) return null; // UNIQUE backstop → treat as already checked in
        throw err;
      });

    // 23505 backstop after full rollback: no in-memory state, so re-read.
    if (outcome === null) {
      const status = await this.getMe(userId, now);
      return this.result(status, 0, 0, false, true);
    }

    if (!outcome.alreadyCheckedIn) {
      await this.bumpCaches(userId);
      if (outcome.leveledUp) {
        this.gateway.publish(userId, {
          type: 'level:up',
          title: 'Level Up!',
          message: `You reached level ${outcome.newLevel}`,
          icon: 'trending_up',
          level: outcome.newLevel,
          at: new Date().toISOString(),
        });
      }
    }

    // Build status-after-action from the committed in-memory state object
    // (equals the persisted row), NOT a second DB read (see Global Constraints).
    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    const status = this.toStatus(outcome.state, rows, today, monthNow);
    return this.result(status, outcome.gems, outcome.xp, outcome.leveledUp, outcome.alreadyCheckedIn);
  }

  private result(
    status: ICheckinStatus,
    gems: number,
    xp: number,
    leveledUp: boolean,
    alreadyCheckedIn: boolean,
  ): ICheckinResult {
    return {
      status,
      reward: { gems, xp },
      weeklyMilestone: false,
      allTimeMilestone: null,
      perfectMonth: false,
      badgesEarned: [],
      spinsGranted: 0,
      leveledUp,
      ...(alreadyCheckedIn ? { alreadyCheckedIn: true } : {}),
    };
  }

  private async bumpCaches(userId: string): Promise<void> {
    await this.cache.bumpTags([
      `student:${userId}:quests`,
      `student:${userId}:badges`,
      `student:${userId}:dashboard`,
      `student:${userId}:profile`,
      `student:${userId}:shop`,
      'leaderboard:global',
    ]);
  }
}
```

- [ ] Step: Run the test, expect PASS. Run:
```bash
npx nx test api --testPathPattern=checkin.service.spec
```
Expect: both describe blocks green (8 passing tests). In particular the first-ever case passes because `status` is built from the in-memory `state` object (`currentStreak = 1`, `lastCheckinDate = today` → `checkedInToday = true`), not from a second `findOne` that would return `null`.

- [ ] Step: Commit.
```bash
git add apps/api/src/modules/checkin/checkin.service.ts apps/api/src/modules/checkin/checkin.service.spec.ts
git commit -m "feat(api): CheckinService getMe + checkIn (Phase-1 reward, board, idempotent)"
```

---

### Task 6: `CheckinController` — `GET /checkin/me` + `POST /checkin` (test first)

**Files:**
- Create: `apps/api/src/modules/checkin/checkin.controller.spec.ts`
- Create: `apps/api/src/modules/checkin/checkin.controller.ts`

**Interfaces:**
- Consumes: `CheckinService.getMe(userId)`, `CheckinService.checkIn(userId)`; guards `JwtAuthGuard`, `RolesGuard`; decorators `@Roles`, `@CurrentUser`; `JwtPayload`, `UserRole` from `@cp/shared`.
- Produces: HTTP routes `GET /checkin/me → ICheckinStatus`, `POST /checkin → ICheckinResult`, both `@Roles(UserRole.STUDENT)`.

- [ ] Step: Write the failing test (pure controller delegation; no Nest DI, so guards are not resolved). Create `apps/api/src/modules/checkin/checkin.controller.spec.ts`:
```ts
import { CheckinController } from './checkin.controller';

describe('CheckinController', () => {
  const status = { today: '2026-07-11', currentStreak: 1 } as never;
  const result = { reward: { gems: 5, xp: 20 } } as never;
  const user = { sub: 'u1', role: 'STUDENT' } as never;

  function make() {
    const service = {
      getMe: jest.fn().mockResolvedValue(status),
      checkIn: jest.fn().mockResolvedValue(result),
    };
    return { controller: new CheckinController(service as never), service };
  }

  it('GET /checkin/me delegates to service.getMe with the caller id', async () => {
    const { controller, service } = make();
    await expect(controller.me(user)).resolves.toBe(status);
    expect(service.getMe).toHaveBeenCalledWith('u1');
  });

  it('POST /checkin delegates to service.checkIn with the caller id', async () => {
    const { controller, service } = make();
    await expect(controller.checkIn(user)).resolves.toBe(result);
    expect(service.checkIn).toHaveBeenCalledWith('u1');
  });
});
```

- [ ] Step: Run the test, expect FAIL. Run:
```bash
npx nx test api --testPathPattern=checkin.controller.spec
```
Expect failure: `Cannot find module './checkin.controller'`.

- [ ] Step: Write the controller. Create `apps/api/src/modules/checkin/checkin.controller.ts`:
```ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CheckinService } from './checkin.service';

@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class CheckinController {
  constructor(private readonly service: CheckinService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.service.getMe(user.sub);
  }

  @Post()
  checkIn(@CurrentUser() user: JwtPayload) {
    return this.service.checkIn(user.sub);
  }
}
```

- [ ] Step: Run the test, expect PASS. Run:
```bash
npx nx test api --testPathPattern=checkin.controller.spec
```
Expect: both delegation tests green (2 passing tests).

- [ ] Step: Commit.
```bash
git add apps/api/src/modules/checkin/checkin.controller.ts apps/api/src/modules/checkin/checkin.controller.spec.ts
git commit -m "feat(api): CheckinController GET /checkin/me + POST /checkin (STUDENT) + test"
```

---

### Task 7: `CheckinModule` wiring + AppModule registration + build

**Files:**
- Create: `apps/api/src/modules/checkin/checkin.module.ts`
- Modify: `apps/api/src/app/app.module.ts`

**Interfaces:**
- Consumes: `DailyCheckin`, `CheckinState` (Task 3); `StudentProfile`; `QuestsModule` (exports `GamificationGateway`); `CheckinService` (Task 5); `CheckinController` (Task 6).
- Produces: `class CheckinModule` registered in `AppModule`. All referenced files now exist, so this task produces a fully building repo state and is the correct place to run `nx build api` and commit.

> This is the second half of the module wiring (the entity registration was done in Task 4). It is sequenced after Tasks 5–6 so that `checkin.module.ts`'s `providers`/`controllers` references resolve and the committed state builds.

- [ ] Step: Create the module file. Write `apps/api/src/modules/checkin/checkin.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentProfile } from '../students/student-profile.entity';
import { QuestsModule } from '../quests/quests.module';
import { DailyCheckin } from './daily-checkin.entity';
import { CheckinState } from './checkin-state.entity';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyCheckin, CheckinState, StudentProfile]),
    QuestsModule, // for GamificationGateway (level-up publish)
  ],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
```

- [ ] Step: Register the module in `AppModule`. In `apps/api/src/app/app.module.ts`, add the import after `import { ChatModule } from '../modules/chat/chat.module';`:
```ts
import { CheckinModule } from '../modules/checkin/checkin.module';
```
Then add `CheckinModule,` to the `imports` array, immediately after `ChatModule,`:
```ts
    BlogModule,
    ChatModule,
    CheckinModule,
  ],
```

- [ ] Step: Verify the API compiles with the full module wired. Run:
```bash
npx nx build api --skip-nx-cache
```
Expect: successful build, no TS errors referencing `CheckinModule`, `CheckinService`, `CheckinController`, `DailyCheckin`, or `CheckinState`.

- [ ] Step: Commit.
```bash
git add apps/api/src/modules/checkin/checkin.module.ts apps/api/src/app/app.module.ts
git commit -m "feat(api): wire CheckinModule into AppModule"
```

---

### Task 8: Frontend `checkin-board.ts` pure helpers (TDD, vitest)

**Files:**
- Create: `apps/web/src/app/lib/checkin-board.spec.ts`
- Create: `apps/web/src/app/lib/checkin-board.ts`

**Interfaces:**
- Consumes: `ICheckinBoardCell`, `ICheckinStatus` from `@cp/shared`.
- Produces:
  - `interface CheckinBoardWeek { cells: (ICheckinBoardCell | null)[] }`.
  - `buildBoardWeeks(status: ICheckinStatus): CheckinBoardWeek[]` — chunks the month's cells into Monday-first calendar weeks with `null` padding.
  - `streakBonusGems(currentStreak: number): number` — Phase-1 bonus formula (mirrors backend constants).
  - `shouldOpenCheckinPopup(params: { checkedInToday: boolean; today: string; lastPopupDay: string | null }): boolean` — pure once/day popup-gate decision (used by `CheckinPopup` in Task 11).

- [ ] Step: Write the failing test. Create `apps/web/src/app/lib/checkin-board.spec.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { ICheckinStatus } from '@cp/shared';

import { buildBoardWeeks, streakBonusGems, shouldOpenCheckinPopup } from './checkin-board';

function statusFor(month: string, cells: { dayKey: string; status: ICheckinStatus['board'][number]['status'] }[]): ICheckinStatus {
  return {
    today: `${month}-11`,
    checkedInToday: false,
    monthKey: month,
    board: cells,
    currentStreak: 0,
    longestStreak: 0,
    totalCheckins: 0,
    monthlyCheckins: 0,
    freezeTokens: 0,
    pendingWheelSpins: 0,
    makeupRemaining: 0,
    makeupCost: 0,
  };
}

describe('streakBonusGems', () => {
  it('is 0 on day 1, grows +2/day, and caps at 20', () => {
    expect(streakBonusGems(1)).toBe(0);
    expect(streakBonusGems(4)).toBe(6);
    expect(streakBonusGems(11)).toBe(20);
    expect(streakBonusGems(50)).toBe(20);
    expect(streakBonusGems(0)).toBe(0);
  });
});

describe('shouldOpenCheckinPopup', () => {
  it('opens when not checked in and not yet shown today', () => {
    expect(shouldOpenCheckinPopup({ checkedInToday: false, today: '2026-07-11', lastPopupDay: null })).toBe(true);
    expect(shouldOpenCheckinPopup({ checkedInToday: false, today: '2026-07-11', lastPopupDay: '2026-07-10' })).toBe(true);
  });

  it('stays closed when already checked in, or already shown today', () => {
    expect(shouldOpenCheckinPopup({ checkedInToday: true, today: '2026-07-11', lastPopupDay: null })).toBe(false);
    expect(shouldOpenCheckinPopup({ checkedInToday: false, today: '2026-07-11', lastPopupDay: '2026-07-11' })).toBe(false);
  });
});

describe('buildBoardWeeks', () => {
  it('lays a 31-day month (July 2026, 1st is Wednesday) into Monday-first weeks with padding', () => {
    const cells = Array.from({ length: 31 }, (_, i) => ({
      dayKey: `2026-07-${String(i + 1).padStart(2, '0')}`,
      status: 'future' as const,
    }));
    const weeks = buildBoardWeeks(statusFor('2026-07', cells));

    // July 1 2026 is a Wednesday → Monday-first offset 2 → two leading nulls.
    expect(weeks[0].cells.slice(0, 2)).toEqual([null, null]);
    expect(weeks[0].cells[2]?.dayKey).toBe('2026-07-01');
    // Every week has exactly 7 slots.
    for (const w of weeks) expect(w.cells).toHaveLength(7);
    // All 31 real cells preserved in order.
    const flat = weeks.flatMap((w) => w.cells).filter((c): c is NonNullable<typeof c> => c !== null);
    expect(flat).toHaveLength(31);
    expect(flat[0].dayKey).toBe('2026-07-01');
    expect(flat[30].dayKey).toBe('2026-07-31');
    // Trailing slots of the last week are null padding.
    const last = weeks[weeks.length - 1].cells;
    expect(last[last.length - 1]).toBeNull();
  });
});
```

- [ ] Step: Run the test, expect FAIL. Run:
```bash
npx vitest run apps/web/src/app/lib/checkin-board.spec.ts
```
Expect failure: `Failed to resolve import "./checkin-board"` / `buildBoardWeeks is not a function`.

- [ ] Step: Write the minimal implementation. Create `apps/web/src/app/lib/checkin-board.ts`:
```ts
import type { ICheckinBoardCell, ICheckinStatus } from '@cp/shared';

export interface CheckinBoardWeek {
  cells: (ICheckinBoardCell | null)[];
}

/** Monday-first weekday index (0 = Mon … 6 = Sun) for a 'YYYY-MM-DD' key. */
function mondayFirstDow(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
  return (dow + 6) % 7;
}

/**
 * Chunk a month's day cells into Monday-first calendar weeks, padding the
 * first and last weeks with nulls. Phase-1 status values only.
 */
export function buildBoardWeeks(status: ICheckinStatus): CheckinBoardWeek[] {
  const cells = status.board;
  if (cells.length === 0) return [];
  const slots: (ICheckinBoardCell | null)[] = [];
  const lead = mondayFirstDow(cells[0].dayKey);
  for (let i = 0; i < lead; i++) slots.push(null);
  slots.push(...cells);
  while (slots.length % 7 !== 0) slots.push(null);

  const weeks: CheckinBoardWeek[] = [];
  for (let i = 0; i < slots.length; i += 7) {
    weeks.push({ cells: slots.slice(i, i + 7) });
  }
  return weeks;
}

/** Phase-1 streak bonus gems: 0 on day 1, +2/day, capped at 20. Mirrors backend. */
export function streakBonusGems(currentStreak: number): number {
  return Math.min(20, Math.max(0, currentStreak - 1) * 2);
}

/**
 * Once/day popup gate: open only when the student has not checked in today AND
 * the popup has not already been shown for the server-authoritative VN day
 * (`today`). Pure so it can be unit-tested without a DOM.
 */
export function shouldOpenCheckinPopup(params: {
  checkedInToday: boolean;
  today: string;
  lastPopupDay: string | null;
}): boolean {
  if (params.checkedInToday) return false;
  if (params.lastPopupDay === params.today) return false;
  return true;
}
```

- [ ] Step: Run the test, expect PASS. Run:
```bash
npx vitest run apps/web/src/app/lib/checkin-board.spec.ts
```
Expect: 3 describe blocks green (`streakBonusGems`, `shouldOpenCheckinPopup`, `buildBoardWeeks`).

- [ ] Step: Commit.
```bash
git add apps/web/src/app/lib/checkin-board.ts apps/web/src/app/lib/checkin-board.spec.ts
git commit -m "feat(web): checkin-board pure helpers (weeks, streak bonus, popup gate) + vitest"
```

---

### Task 9: Frontend `checkin.api.ts` + `checkin.queries.ts`

**Files:**
- Create: `apps/web/src/app/api/checkin.api.ts`
- Create: `apps/web/src/app/api/checkin.queries.ts`

**Interfaces:**
- Consumes: `apiClient` (`../lib/api-client`); `ICheckinStatus`, `ICheckinResult` from `@cp/shared`; `queryStaleTime` (`./query-cache`).
- Produces:
  - `checkinApi = { me(), checkIn() }` returning axios responses.
  - `checkinQueryKeys` factory; hooks `useCheckinStatus()`, `useCheckIn()`.

- [ ] Step: Write the api wrapper. Create `apps/web/src/app/api/checkin.api.ts`:
```ts
import { ICheckinResult, ICheckinStatus } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const checkinApi = {
  me() {
    return apiClient.get<ICheckinStatus>('/checkin/me');
  },
  checkIn() {
    return apiClient.post<ICheckinResult>('/checkin');
  },
};
```

- [ ] Step: Write the react-query hooks. Create `apps/web/src/app/api/checkin.queries.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinApi } from './checkin.api';
import { queryStaleTime } from './query-cache';

export const checkinQueryKeys = {
  all: ['checkin'] as const,
  me: () => ['checkin', 'me'] as const,
};

export function useCheckinStatus() {
  return useQuery({
    queryKey: checkinQueryKeys.me(),
    queryFn: () => checkinApi.me().then((res) => res.data),
    staleTime: queryStaleTime.dashboard,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => checkinApi.checkIn().then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinQueryKeys.all });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      void qc.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}
```

- [ ] Step: Verify the web app type-checks these modules. Run:
```bash
npx tsc --noEmit -p apps/web/tsconfig.app.json
```
Expect: exit code 0, no errors in `checkin.api.ts` / `checkin.queries.ts`. (If `queryStaleTime.dashboard` does not exist, open `apps/web/src/app/api/query-cache.ts` and use whichever short-lived staleTime preset it exports.)

- [ ] Step: Commit.
```bash
git add apps/web/src/app/api/checkin.api.ts apps/web/src/app/api/checkin.queries.ts
git commit -m "feat(web): checkin api wrapper + react-query hooks"
```

---

### Task 10: `CheckinPage` + route + nav + i18n

**Files:**
- Create: `apps/web/src/app/pages/student/CheckinPage.tsx`
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/app/layouts/StudentLayout.tsx`
- Modify: `apps/web/src/app/i18n/locales/en.ts`
- Modify: `apps/web/src/app/i18n/locales/vi.ts`

**Interfaces:**
- Consumes: `useCheckinStatus`, `useCheckIn` (Task 9); `buildBoardWeeks`, `streakBonusGems` (Task 8); `useTranslation` (i18next).
- Produces: default-export React component `CheckinPage`; route `/student/checkin`; nav item `nav.student.checkin`; `checkin.*` + `nav.student.checkin` i18n keys (en + vi).

> This task is verified by `nx build web` (type-check + bundle). Its testable logic (board layout, streak bonus, popup gate) lives in the vitest-covered `checkin-board.ts` (Task 8); the page itself is pure composition, so a build check is the intended verification.

- [ ] Step: Add the i18n keys (en). In `apps/web/src/app/i18n/locales/en.ts`, inside the `nav.student` object, insert `checkin: 'Check-in',` immediately after the existing `chat: 'Chat',` line (the last real key in that block, en.ts ~line 134):
```ts
      me: 'Me',
      chat: 'Chat',
      checkin: 'Check-in',

    },
```
Then add a top-level `checkin` namespace. Insert this block immediately before the existing top-level `chat: {` block (en.ts ~line 157, a sibling of the top-level `nav` and `topBar`):
```ts
  checkin: {
    title: 'Daily Check-in',
    subtitle: 'Check in every day to keep your streak alive.',
    checkInCta: 'Check in',
    checkedInToday: 'Checked in today',
    currentStreak: 'Current streak',
    longestStreak: 'Longest streak',
    totalCheckins: 'Total check-ins',
    days: 'days',
    rewardToast: '+{{gems}} gems, +{{xp}} XP',
    alreadyCheckedIn: 'You have already checked in today.',
    weekdays: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' },
    popup: {
      title: 'Daily Check-in',
      body: 'Check in today to earn gems and grow your streak!',
      later: 'Later',
    },
  },
```

- [ ] Step: Add the i18n keys (vi). In `apps/web/src/app/i18n/locales/vi.ts`, inside the `nav.student` object, insert `checkin: 'Điểm danh',` immediately after the existing `chat: 'Tin nhắn',` line (vi.ts ~line 132):
```ts
      me: 'Thông tin cá nhân',
      chat: 'Tin nhắn',
      checkin: 'Điểm danh',

    },
```
Then insert the matching top-level namespace immediately before the existing top-level `chat: {` block (vi.ts ~line 155):
```ts
  checkin: {
    title: 'Điểm danh hằng ngày',
    subtitle: 'Điểm danh mỗi ngày để giữ chuỗi của bạn.',
    checkInCta: 'Điểm danh',
    checkedInToday: 'Đã điểm danh hôm nay',
    currentStreak: 'Chuỗi hiện tại',
    longestStreak: 'Chuỗi dài nhất',
    totalCheckins: 'Tổng số lần điểm danh',
    days: 'ngày',
    rewardToast: '+{{gems}} kim cương, +{{xp}} XP',
    alreadyCheckedIn: 'Bạn đã điểm danh hôm nay rồi.',
    weekdays: { mon: 'T2', tue: 'T3', wed: 'T4', thu: 'T5', fri: 'T6', sat: 'T7', sun: 'CN' },
    popup: {
      title: 'Điểm danh hằng ngày',
      body: 'Điểm danh hôm nay để nhận kim cương và nối dài chuỗi!',
      later: 'Để sau',
    },
  },
```

- [ ] Step: Write the page component. Create `apps/web/src/app/pages/student/CheckinPage.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { useCheckinStatus, useCheckIn } from '../../api/checkin.queries';
import { buildBoardWeeks, streakBonusGems } from '../../lib/checkin-board';
import type { ICheckinBoardCell } from '@cp/shared';

const CELL_CLASS: Record<ICheckinBoardCell['status'], string> = {
  checked: 'bg-primary text-on-primary',
  today: 'bg-tertiary-container text-on-tertiary-container ring-2 ring-primary',
  future: 'bg-surface-container-high text-on-surface-variant',
  missed: 'bg-surface-container text-on-surface-variant/50 line-through',
  makeup: 'bg-secondary-container text-on-secondary-container', // Phase 2 (never emitted in Phase 1)
  missable: 'bg-surface-container text-on-surface-variant', // Phase 2 (never emitted in Phase 1)
};

export default function CheckinPage() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useCheckinStatus();
  const checkIn = useCheckIn();

  if (isLoading || !status) {
    return <div className="p-lg text-on-surface-variant">…</div>;
  }

  const weeks = buildBoardWeeks(status);
  const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  return (
    <div className="max-w-3xl mx-auto py-lg flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-headline-md font-extrabold text-primary">{t('checkin.title')}</h1>
        <p className="text-on-surface-variant">{t('checkin.subtitle')}</p>
      </header>

      <section className="grid grid-cols-3 gap-md">
        <Stat label={t('checkin.currentStreak')} value={`${status.currentStreak} ${t('checkin.days')}`} />
        <Stat label={t('checkin.longestStreak')} value={`${status.longestStreak} ${t('checkin.days')}`} />
        <Stat label={t('checkin.totalCheckins')} value={String(status.totalCheckins)} />
      </section>

      <section className="rounded-3xl bg-surface-container-low p-md flex flex-col gap-sm">
        <div className="grid grid-cols-7 gap-1 text-center text-label-sm text-on-surface-variant">
          {weekdayKeys.map((k) => (
            <span key={k}>{t(`checkin.weekdays.${k}`)}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.cells.map((cell, ci) =>
              cell === null ? (
                <span key={ci} />
              ) : (
                <span
                  key={cell.dayKey}
                  className={`aspect-square grid place-items-center rounded-xl text-label-md ${CELL_CLASS[cell.status]}`}
                >
                  {Number(cell.dayKey.slice(-2))}
                </span>
              ),
            )}
          </div>
        ))}
      </section>

      <div className="flex items-center gap-md">
        <button
          type="button"
          disabled={status.checkedInToday || checkIn.isPending}
          onClick={() => checkIn.mutate()}
          className="px-lg py-3 rounded-full bg-primary text-on-primary font-bold disabled:opacity-50"
        >
          {status.checkedInToday ? t('checkin.checkedInToday') : t('checkin.checkInCta')}
        </button>
        <span className="text-on-surface-variant text-label-md">
          {t('checkin.rewardToast', { gems: 5 + streakBonusGems(status.currentStreak + 1), xp: 20 })}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-md flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className="text-title-lg font-extrabold text-on-surface">{value}</span>
    </div>
  );
}
```

- [ ] Step: Add the lazy import + route in `App.tsx`. Add the lazy declaration next to the other student page imports (after `const StudentShop = lazy(() => import('./pages/student/ShopPage'));`):
```ts
const StudentCheckin = lazy(() => import('./pages/student/CheckinPage'));
```
Then add the route inside the `/student` `<Route>` block (after `<Route path="shop" element={<StudentShop />} />`):
```tsx
                <Route path="checkin" element={<StudentCheckin />} />
```

- [ ] Step: Add the nav item in `StudentLayout.tsx`. After the `STUDENT_BADGES` declaration (line ~34), add:
```ts
const STUDENT_CHECKIN: SidebarNavItem = {
  to: '/student/checkin',
  icon: 'event_available',
  key: 'nav.student.checkin',
};
```
Then insert `STUDENT_CHECKIN` into the top-level `NAV` array, right after `STUDENT_QUESTS`:
```ts
const NAV: SidebarNavEntry[] = [
  STUDENT_HOME,
  STUDENT_QUESTS,
  STUDENT_CHECKIN,
  STUDENT_LEADERBOARD,
```
(Do NOT add it to `MOBILE_NAV` — that must stay at exactly 5 items.)

- [ ] Step: Verify the web app builds. Run:
```bash
npx nx build web --skip-nx-cache
```
Expect: successful production build, no unresolved imports and no missing-i18n-key TS errors.

- [ ] Step: Commit.
```bash
git add apps/web/src/app/pages/student/CheckinPage.tsx apps/web/src/app/App.tsx apps/web/src/app/layouts/StudentLayout.tsx apps/web/src/app/i18n/locales/en.ts apps/web/src/app/i18n/locales/vi.ts
git commit -m "feat(web): CheckinPage + /student/checkin route + nav + i18n"
```

---

### Task 11: `CheckinPopup` — once/day gate

**Files:**
- Create: `apps/web/src/app/components/CheckinPopup.tsx`
- Modify: `apps/web/src/app/layouts/StudentLayout.tsx`

**Interfaces:**
- Consumes: `useCheckinStatus`, `useCheckIn` (Task 9); `shouldOpenCheckinPopup` (Task 8, vitest-covered); `useTranslation`. localStorage key `checkin:lastPopupDay`.
- Produces: zero-prop default-export component `CheckinPopup`, mounted as a sibling of `<GamificationCelebration />` in `StudentLayout`.

> The once/day gate decision is the pure, vitest-covered `shouldOpenCheckinPopup` (Task 8). This component is the DOM/effect shell around it, verified by `nx build web`.

- [ ] Step: Write the popup component. Create `apps/web/src/app/components/CheckinPopup.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCheckinStatus, useCheckIn } from '../api/checkin.queries';
import { shouldOpenCheckinPopup } from '../lib/checkin-board';

const POPUP_KEY = 'checkin:lastPopupDay';

/**
 * Self-contained, zero-prop. Opens at most once per VN day (server-authoritative
 * `status.today`) and only when the student has not yet checked in today. The
 * gate decision is the pure `shouldOpenCheckinPopup` helper (unit-tested).
 */
export default function CheckinPopup() {
  const { t } = useTranslation();
  const { data: status } = useCheckinStatus();
  const checkIn = useCheckIn();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!status) return;
    const decision = shouldOpenCheckinPopup({
      checkedInToday: status.checkedInToday,
      today: status.today,
      lastPopupDay: localStorage.getItem(POPUP_KEY),
    });
    if (!decision) return;
    localStorage.setItem(POPUP_KEY, status.today);
    setOpen(true);
  }, [status]);

  if (!open || !status) return null;

  const dismiss = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-[min(92vw,26rem)] rounded-3xl bg-surface p-lg flex flex-col gap-md shadow-elev-3">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary text-[32px]">event_available</span>
          <h2 className="text-title-lg font-extrabold text-on-surface">{t('checkin.popup.title')}</h2>
        </div>
        <p className="text-on-surface-variant">{t('checkin.popup.body')}</p>
        <div className="flex items-center justify-end gap-sm">
          <button type="button" onClick={dismiss} className="px-md py-2 rounded-full text-on-surface-variant">
            {t('checkin.popup.later')}
          </button>
          <button
            type="button"
            disabled={checkIn.isPending}
            onClick={() =>
              checkIn.mutate(undefined, {
                onSuccess: dismiss,
              })
            }
            className="px-lg py-2 rounded-full bg-primary text-on-primary font-bold disabled:opacity-50"
          >
            {t('checkin.checkInCta')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Step: Mount the popup in `StudentLayout.tsx`. Add the import next to the existing `GamificationCelebration` import (after line 7):
```ts
import CheckinPopup from '../components/CheckinPopup';
```
Then mount it as a sibling right after `<GamificationCelebration />` (line ~98):
```tsx
      <GamificationCelebration />
      <CheckinPopup />
```

- [ ] Step: Verify the web app builds with the popup mounted. Run:
```bash
npx nx build web --skip-nx-cache
```
Expect: successful build; no unresolved import for `CheckinPopup`.

- [ ] Step: Commit.
```bash
git add apps/web/src/app/components/CheckinPopup.tsx apps/web/src/app/layouts/StudentLayout.tsx
git commit -m "feat(web): once/day CheckinPopup mounted in StudentLayout"
```

---

### Task 12: Production migration for check-in tables

**Files:**
- Create: `apps/api/src/database/migrations/1790000000005-CreateCheckinTables.ts`

**Interfaces:**
- Consumes: nothing (raw SQL). Mirrors the idempotent style of `1789900000000-CreateExamTables.ts` — `CREATE TABLE IF NOT EXISTS` + `IF NOT EXISTS` indexes, `gen_random_uuid()` defaults, because `synchronize: true` may already have created these tables on boot (shared dev DB — see memory `shared-remote-dev-db.md`).
- Produces: `class CreateCheckinTables1790000000005` creating `daily_checkins` + `checkin_states` with their unique constraints and indexes; a `down()` that drops them.

> Timestamp `1790000000005` sorts immediately after the current latest migration `1790000000004-AddStudentLearningResetAt.ts`.

- [ ] Step: Write the migration. Create `apps/api/src/database/migrations/1790000000005-CreateCheckinTables.ts`:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Daily check-in feature schema (design §3). Written idempotently
 * (CREATE ... IF NOT EXISTS) because the app runs with `synchronize: true`
 * and may have already created these tables from the entities on boot.
 * The full checkin_states schema — including the default-0 Phase-2 enrichment
 * columns — is created here for schema stability (design §3.2 tradeoff).
 */
export class CreateCheckinTables1790000000005 implements MigrationInterface {
  name = 'CreateCheckinTables1790000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    const baseCols = `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "deleted_at" TIMESTAMP WITH TIME ZONE,
      "version" integer NOT NULL DEFAULT '1'`;

    // ── daily_checkins ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_checkins" (
        ${baseCols},
        "user_id" uuid NOT NULL,
        "day_key" date NOT NULL,
        "month_key" character varying(7) NOT NULL,
        "source" character varying(16) NOT NULL DEFAULT 'checkin',
        CONSTRAINT "PK_daily_checkins" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_checkin_user_day" UNIQUE ("user_id", "day_key")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_checkin_user_month" ON "daily_checkins" ("user_id", "month_key")`,
    );

    // ── checkin_states ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkin_states" (
        ${baseCols},
        "user_id" uuid NOT NULL,
        "current_streak" integer NOT NULL DEFAULT '0',
        "longest_streak" integer NOT NULL DEFAULT '0',
        "last_checkin_date" date,
        "total_checkins" integer NOT NULL DEFAULT '0',
        "month_key" character varying(7),
        "monthly_checkins" integer NOT NULL DEFAULT '0',
        "freeze_tokens" integer NOT NULL DEFAULT '0',
        "pending_wheel_spins" integer NOT NULL DEFAULT '0',
        "makeup_used_this_month" integer NOT NULL DEFAULT '0',
        "highest_milestone_awarded" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_checkin_states" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_checkin_state_user" UNIQUE ("user_id")
      )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "checkin_states"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_daily_checkin_user_month"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_checkins"`);
  }
}
```

- [ ] Step: Verify the migration compiles and is discovered by the TypeORM CLI. This repo drives the TypeORM CLI through `tsx` with the base tsconfig (see `apps/api/project.json` `typeorm-run`/`typeorm-generate` targets, which run `tsx --tsconfig tsconfig.base.json ./node_modules/typeorm/cli.js <cmd> -d apps/api/src/database/data-source.ts`). Use the same invocation for `migration:show` (a standard TypeORM CLI subcommand; there is no dedicated nx target for it). Run:
```bash
npx nx build api --skip-nx-cache && npx tsx --tsconfig tsconfig.base.json ./node_modules/typeorm/cli.js migration:show -d apps/api/src/database/data-source.ts
```
Expect: the build succeeds; the `migration:show` output lists the migration as pending, i.e. a line reading exactly:
```
[ ] CreateCheckinTables1790000000005
```
(`migration:show` connects to `DATABASE_URL` read-only — it lists status only and does not run anything. Do NOT run `nx run api:typeorm-run` here; that would mutate the shared dev DB.)

- [ ] Step: Commit.
```bash
git add apps/api/src/database/migrations/1790000000005-CreateCheckinTables.ts
git commit -m "feat(api): prod migration for daily_checkins + checkin_states"
```

---

### Task 13: Full Phase-1 verification

**Files:** none (verification only).

**Interfaces:** Consumes every prior task. All required verification is automated and does NOT touch the database; the endpoint request/response contract is covered by the CheckinController and CheckinService unit tests. A live smoke test is provided only as an OPTIONAL, confirmation-gated step because dev `DATABASE_URL` is a shared AWS RDS (memory `shared-remote-dev-db.md`).

- [ ] Step: Run the full backend check-in suites (service + controller + day-key helpers). Run:
```bash
npx nx test api --testPathPattern="checkin.service.spec|checkin.controller.spec|period-keys.spec"
```
Expect: all three suites pass (period-keys helpers, CheckinService getMe/checkIn cases, CheckinController delegation).

- [ ] Step: Run the frontend pure-helper suite. Run:
```bash
npx vitest run apps/web/src/app/lib/checkin-board.spec.ts
```
Expect: all `checkin-board` tests pass (`streakBonusGems`, `shouldOpenCheckinPopup`, `buildBoardWeeks`).

- [ ] Step: Build both apps to confirm nothing else regressed. Run:
```bash
npx nx build api --skip-nx-cache && npx nx build web --skip-nx-cache
```
Expect: both builds succeed.

- [ ] Step (OPTIONAL — MUTATES THE SHARED DEV DB; ASK THE USER TO CONFIRM FIRST): live end-to-end smoke test. Booting `nx serve api` against dev `DATABASE_URL` lets `synchronize` create the tables and issues real `POST /checkin` writes to the shared AWS RDS. Only run this after the user explicitly confirms, or point `DATABASE_URL` at a disposable local Postgres. It requires a seeded STUDENT account; substitute a real one from the target DB in the login call below (the login response field is `accessToken`; routes are prefixed `/api`). In one shell:
```bash
npx nx serve api
```
In a second shell (replace the email/password with a real seeded STUDENT for the target DB):
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"STUDENT_EMAIL","password":"STUDENT_PASSWORD"}' | jq -r .accessToken)

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/checkin/me | jq '.today, .currentStreak, (.board | length)'
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/checkin | jq '.reward, .status.currentStreak, .status.checkedInToday'
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/checkin | jq '.alreadyCheckedIn, .reward'
```
Expect: `/checkin/me` returns a `today` VN day and a full-month `board`; the first `POST /checkin` returns `reward` `{gems:5,xp:20}` on a day-1 streak with `checkedInToday:true`; the second `POST /checkin` returns `alreadyCheckedIn:true` with `reward` `{gems:0,xp:0}`. Stop the `nx serve api` process when done.

- [ ] Step: Commit any incidental fixes surfaced by verification (only if changes were needed).
```bash
git add -A
git commit -m "test(checkin): Phase-1 verification fixes"
```

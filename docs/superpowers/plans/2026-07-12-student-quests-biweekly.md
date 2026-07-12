# Student Quests Biweekly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add richer daily student quests, add a global two-week reset cadence for bounty/event quests, and preserve the rule that already-solved coding assignments or maze levels do not count again.

**Architecture:** Add `QuestRecurrence.BIWEEKLY` to the shared contract, centralize quest period-key calculation in `apps/api/src/modules/quests/period-keys.ts`, and make `QuestsService.ensureQuestsAssigned()` compare stale rows against each quest's own active period. Keep the lazy-reset model: no cron job, no per-student rolling clock. Seed catalog expansion stays in the existing seed script and remains idempotent by title.

**Tech Stack:** NestJS 10, TypeORM, PostgreSQL enums/migrations, Jest/ts-jest, React 18, i18next, Nx.

## Global Constraints

- Two-week reset is global for all students, not per-student rolling.
- No cron job for quest reset.
- No new quest objective type unless existing objective types cannot express the catalog.
- Re-solving an already-completed coding assignment or maze level must not advance quest progress, profile counters, or rewards.
- Use TDD: write each behavior test first, run it red, then implement.
- Use explicit TypeORM migration for PostgreSQL enum changes.
- Preserve existing quest page layout except labels needed for the new recurrence.

---

## File Structure

- `libs/shared/src/lib/types/quests.types.ts`: shared recurrence enum and API contract.
- `apps/api/src/modules/quests/period-keys.ts`: reusable date/period helpers for quests, badges, leaderboard, and tests.
- `apps/api/src/modules/quests/period-keys.spec.ts`: red/green tests for global biweekly period keys.
- `apps/api/src/modules/quests/quests.service.ts`: assignment, stale-row expiry, and event-processing behavior.
- `apps/api/src/modules/quests/quests.service.spec.ts`: service-level tests for biweekly lazy reset and already-solved safeguards.
- `apps/api/src/database/migrations/1790000000006-AddBiweeklyQuestRecurrence.ts`: PostgreSQL enum migration.
- `apps/api/src/database/seeds/seed-quests.ts`: richer daily catalog, biweekly bounty/event catalog, idempotent update behavior, and exported catalog constants.
- `apps/api/src/database/seeds/seed-quests.catalog.spec.ts`: seed catalog tests without connecting to the database.
- `apps/web/src/app/i18n/locales/en.ts`: English recurrence labels.
- `apps/web/src/app/i18n/locales/vi.ts`: Vietnamese recurrence labels.
- `apps/web/src/app/pages/student/QuestsPage.tsx`: student card reset label selection.
- `apps/web/src/app/pages/admin/quests/QuestForm.tsx`: recurrence selector width for four recurrence options.

---

### Task 1: Shared `BIWEEKLY` Contract and Period Keys

**Files:**
- Modify: `libs/shared/src/lib/types/quests.types.ts`
- Modify: `apps/api/src/modules/quests/period-keys.ts`
- Modify: `apps/api/src/modules/quests/period-keys.spec.ts`
- Create: `apps/api/src/database/migrations/1790000000006-AddBiweeklyQuestRecurrence.ts`

**Interfaces:**
- Produces: `QuestRecurrence.BIWEEKLY`
- Produces: `dayKey(d: Date): string`
- Produces: `biweekKey(d: Date): string`
- Produces: `questPeriodKey(recurrence: QuestRecurrence, now: Date): string`
- Consumes: existing `weekKey(d: Date): string`

- [ ] **Step 1: Write the failing period-key tests**

Add these imports and tests to `apps/api/src/modules/quests/period-keys.spec.ts`:

```typescript
import { QuestRecurrence } from '@cp/shared';
import { biweekKey, questPeriodKey } from './period-keys';
```

```typescript
describe('biweekKey', () => {
  it('uses the same global period for ISO weeks 29 and 30', () => {
    expect(biweekKey(new Date('2026-07-13T00:00:00Z'))).toBe('2026-B15');
    expect(biweekKey(new Date('2026-07-26T23:59:59Z'))).toBe('2026-B15');
  });

  it('rolls over globally when the next two-week ISO window starts', () => {
    expect(biweekKey(new Date('2026-07-27T00:00:00Z'))).toBe('2026-B16');
  });

  it('starts a new B01 cycle with a new ISO week-year', () => {
    expect(biweekKey(new Date('2026-12-28T00:00:00Z'))).toBe('2026-B27');
    expect(biweekKey(new Date('2027-01-04T00:00:00Z'))).toBe('2027-B01');
  });
});

describe('questPeriodKey', () => {
  it('maps quest recurrence values to their active period keys', () => {
    const now = new Date('2026-07-13T08:30:00Z');

    expect(questPeriodKey(QuestRecurrence.NONE, now)).toBe('static');
    expect(questPeriodKey(QuestRecurrence.DAILY, now)).toBe('2026-07-13');
    expect(questPeriodKey(QuestRecurrence.WEEKLY, now)).toBe('2026-W29');
    expect(questPeriodKey(QuestRecurrence.BIWEEKLY, now)).toBe('2026-B15');
  });
});
```

- [ ] **Step 2: Run the period-key tests red**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/quests/period-keys.spec.ts
```

Expected: fail because `biweekKey`, `questPeriodKey`, and `QuestRecurrence.BIWEEKLY` do not exist yet.

- [ ] **Step 3: Add `BIWEEKLY` to the shared enum**

In `libs/shared/src/lib/types/quests.types.ts`, change `QuestRecurrence` to:

```typescript
export enum QuestRecurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
}
```

- [ ] **Step 4: Implement reusable period helpers**

In `apps/api/src/modules/quests/period-keys.ts`, add the import:

```typescript
import { QuestRecurrence } from '@cp/shared';
```

Replace the existing `weekKey()` implementation with this helper-backed block and keep the remaining XP/check-in functions unchanged:

```typescript
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoWeekParts(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

/** ISO week key, e.g. `2026-W24`. Mirrors quest recurrence windows. */
export function weekKey(d: Date): string {
  const { year, week } = isoWeekParts(d);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Global two-week ISO period key, e.g. weeks 29-30 of 2026 => `2026-B15`. */
export function biweekKey(d: Date): string {
  const { year, week } = isoWeekParts(d);
  const biweek = Math.ceil(week / 2);
  return `${year}-B${String(biweek).padStart(2, '0')}`;
}

export function questPeriodKey(recurrence: QuestRecurrence, now: Date): string {
  switch (recurrence) {
    case QuestRecurrence.DAILY:
      return dayKey(now);
    case QuestRecurrence.WEEKLY:
      return weekKey(now);
    case QuestRecurrence.BIWEEKLY:
      return biweekKey(now);
    case QuestRecurrence.NONE:
    default:
      return 'static';
  }
}
```

- [ ] **Step 5: Add the PostgreSQL enum migration**

Create `apps/api/src/database/migrations/1790000000006-AddBiweeklyQuestRecurrence.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the two-week quest recurrence value. PostgreSQL enum values cannot be
 * safely removed in a down migration, so rollback maps rows back to NONE and
 * leaves the enum value in place.
 */
export class AddBiweeklyQuestRecurrence1790000000006 implements MigrationInterface {
  name = 'AddBiweeklyQuestRecurrence1790000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."quests_recurrence_enum" ADD VALUE IF NOT EXISTS 'BIWEEKLY'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "quests" SET "recurrence" = 'NONE' WHERE "recurrence"::text = 'BIWEEKLY'`);
  }
}
```

- [ ] **Step 6: Run the period-key tests green**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/quests/period-keys.spec.ts
```

Expected: pass.

- [ ] **Step 7: Commit Task 1**

```bash
git add libs/shared/src/lib/types/quests.types.ts apps/api/src/modules/quests/period-keys.ts apps/api/src/modules/quests/period-keys.spec.ts apps/api/src/database/migrations/1790000000006-AddBiweeklyQuestRecurrence.ts
git commit -m "feat: add biweekly quest recurrence"
```

---

### Task 2: Quest Assignment Reset and Already-Solved Safeguards

**Files:**
- Create: `apps/api/src/modules/quests/quests.service.spec.ts`
- Modify: `apps/api/src/modules/quests/quests.service.ts`

**Interfaces:**
- Consumes: `questPeriodKey(recurrence, now)` from Task 1
- Produces: `QuestsService.ensureQuestsAssigned()` support for `BIWEEKLY`
- Produces: stale recurring rows expire by each quest's current period key
- Preserves: `handleCodingAccepted(... alreadySolved: true)` and `handleMazeAccepted(... alreadySolved: true)` skip progress and counters

- [ ] **Step 1: Write the failing service tests**

Create `apps/api/src/modules/quests/quests.service.spec.ts` with this structure:

```typescript
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import {
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
  StudentQuestStatus,
} from '@cp/shared';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { BadgesService } from './badges.service';
import { GamificationGateway } from './gamification.gateway';
import { Quest } from './quest.entity';
import { QuestsService } from './quests.service';
import { StudentQuest } from './student-quest.entity';

function crudMetadata(targetName: string) {
  return {
    connection: { options: { type: 'postgres' } },
    targetName,
    columns: [],
    relations: [],
  };
}

function baseQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'quest-1',
    title: 'Quest',
    description: '',
    type: QuestType.DAILY,
    status: QuestStatus.PUBLISHED,
    objectiveType: QuestObjectiveType.SOLVE_CODING,
    objectiveConfig: null,
    targetCount: 1,
    rewardXp: 10,
    rewardGems: 1,
    rewardBadgeId: null,
    icon: 'military_tech',
    category: null,
    sortOrder: 0,
    recurrence: QuestRecurrence.DAILY,
    startsAt: null,
    endsAt: null,
    prerequisiteQuestId: null,
    classIds: null,
    isActive: true,
    ...overrides,
  } as Quest;
}

function studentQuest(overrides: Partial<StudentQuest> = {}): StudentQuest {
  const quest = overrides.quest ?? baseQuest({ id: overrides.questId ?? 'quest-1' });
  return {
    id: 'sq-1',
    userId: 'student-1',
    questId: quest.id,
    quest,
    progress: 0,
    status: StudentQuestStatus.IN_PROGRESS,
    progressData: { countedIds: [], pointsAccrued: 0 },
    periodKey: '2026-07-13',
    startedAt: new Date('2026-07-13T00:00:00Z'),
    completedAt: null,
    claimedAt: null,
    ...overrides,
  } as StudentQuest;
}

function makeInsertBuilder(capture: { values: Partial<StudentQuest>[]; builder?: any }) {
  return {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn((values: Partial<StudentQuest>[]) => {
      capture.values = values;
      return capture.builder;
    }),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  } as any;
}

describe('QuestsService recurrence and duplicate-solve behavior', () => {
  let service: QuestsService;
  let questRepo: jest.Mocked<Repository<Quest>>;
  let studentQuestRepo: jest.Mocked<Repository<StudentQuest>>;
  let profileRepo: jest.Mocked<Repository<StudentProfile>>;
  let enrollmentRepo: jest.Mocked<Repository<Enrollment>>;
  let cache: { bumpTags: jest.Mock; remember: jest.Mock };
  let badges: { evaluateAndAward: jest.Mock };
  let insertCapture: { values: Partial<StudentQuest>[]; builder?: any };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-13T08:00:00Z'));
    insertCapture = { values: [] };
    insertCapture.builder = makeInsertBuilder(insertCapture);

    questRepo = {
      metadata: crudMetadata('Quest'),
      find: jest.fn(),
    } as any;
    studentQuestRepo = {
      find: jest.fn(),
      save: jest.fn(async (row) => row),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => insertCapture.builder),
    } as any;
    profileRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (row) => row),
    } as any;
    enrollmentRepo = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    cache = {
      bumpTags: jest.fn().mockResolvedValue(undefined),
      remember: jest.fn((_opts, fn) => fn()),
    };
    badges = { evaluateAndAward: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuestsService,
        { provide: getRepositoryToken(Quest), useValue: questRepo },
        { provide: getRepositoryToken(StudentQuest), useValue: studentQuestRepo },
        { provide: getRepositoryToken(StudentProfile), useValue: profileRepo },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: BadgesService, useValue: badges },
        { provide: GamificationGateway, useValue: { publish: jest.fn() } },
        { provide: SystemCacheService, useValue: cache },
      ],
    }).compile();

    service = moduleRef.get(QuestsService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('creates a new BIWEEKLY quest row for the current global two-week period and expires the stale row', async () => {
    const quest = baseQuest({
      id: 'quest-biweekly',
      recurrence: QuestRecurrence.BIWEEKLY,
      type: QuestType.BOUNTY,
    });
    const stale = studentQuest({
      id: 'sq-old',
      questId: quest.id,
      quest,
      periodKey: '2026-B14',
    });
    questRepo.find.mockResolvedValue([quest]);
    studentQuestRepo.find.mockResolvedValue([stale]);

    await service.ensureQuestsAssigned('student-1');

    expect(insertCapture.values).toEqual([
      expect.objectContaining({
        userId: 'student-1',
        questId: 'quest-biweekly',
        periodKey: '2026-B15',
        progress: 0,
        status: StudentQuestStatus.IN_PROGRESS,
      }),
    ]);
    const [criteria, patch] = studentQuestRepo.update.mock.calls[0];
    expect((criteria as any).id._value).toEqual(['sq-old']);
    expect(patch).toEqual({ status: StudentQuestStatus.EXPIRED });
    expect(cache.bumpTags).toHaveBeenCalledWith(['student:student-1:quests', 'student:student-1:dashboard']);
  });

  it('does not advance coding quest progress or profile counters for an already-solved assignment', async () => {
    const profile = {
      userId: 'student-1',
      streak: 4,
      streakLastDate: '2026-07-12',
      problemsSolved: 7,
      mazesSolved: 2,
    } as StudentProfile;
    const quest = baseQuest({
      id: 'coding-quest',
      objectiveType: QuestObjectiveType.SOLVE_CODING,
      targetCount: 1,
    });
    const row = studentQuest({ id: 'sq-coding', questId: quest.id, quest });

    questRepo.find.mockResolvedValue([quest]);
    profileRepo.findOne.mockResolvedValue(profile);
    studentQuestRepo.find.mockImplementation(async (opts?: any) => {
      if (!opts?.where?.status) return [];
      if (opts.where.status === StudentQuestStatus.IN_PROGRESS && !opts.where.quest) return [row];
      return [];
    });

    await service.handleCodingAccepted('student-1', {
      assignmentId: 'assignment-1',
      difficulty: 'HARD',
      tags: ['graphs'],
      points: 100,
      alreadySolved: true,
    });

    expect(studentQuestRepo.save).not.toHaveBeenCalled();
    expect(profileRepo.save).not.toHaveBeenCalled();
    expect(profile.problemsSolved).toBe(7);
    expect(profile.streak).toBe(4);
  });

  it('does not advance maze quest progress or profile counters for an already-solved maze level', async () => {
    const profile = {
      userId: 'student-1',
      streak: 4,
      streakLastDate: '2026-07-12',
      problemsSolved: 7,
      mazesSolved: 2,
    } as StudentProfile;
    const quest = baseQuest({
      id: 'maze-quest',
      objectiveType: QuestObjectiveType.SOLVE_MAZE,
      targetCount: 1,
    });
    const row = studentQuest({ id: 'sq-maze', questId: quest.id, quest });

    questRepo.find.mockResolvedValue([quest]);
    profileRepo.findOne.mockResolvedValue(profile);
    studentQuestRepo.find.mockImplementation(async (opts?: any) => {
      if (!opts?.where?.status) return [];
      if (opts.where.status === StudentQuestStatus.IN_PROGRESS && !opts.where.quest) return [row];
      return [];
    });

    await service.handleMazeAccepted('student-1', {
      mazeLevelId: 'maze-1',
      alreadySolved: true,
    });

    expect(studentQuestRepo.save).not.toHaveBeenCalled();
    expect(profileRepo.save).not.toHaveBeenCalled();
    expect(profile.mazesSolved).toBe(2);
    expect(profile.streak).toBe(4);
  });
});
```

- [ ] **Step 2: Run the service tests red**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/quests/quests.service.spec.ts
```

Expected: fail because `ensureQuestsAssigned()` does not understand `BIWEEKLY` and still expires recurring rows using only daily/weekly global comparisons.

- [ ] **Step 3: Update `QuestsService` to use centralized period keys**

In `apps/api/src/modules/quests/quests.service.ts`, add:

```typescript
import { dayKey, questPeriodKey } from './period-keys';
```

Replace the private `periodKeyFor`, `dayKey`, and `weekKey` helpers with:

```typescript
private periodKeyFor(quest: Quest, now: Date): string {
  return questPeriodKey(quest.recurrence, now);
}
```

Replace `this.dayKey(...)` usages in `updateProfileCounters()` with `dayKey(...)`:

```typescript
const today = dayKey(new Date());
if (profile.streakLastDate !== today) {
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  profile.streak = profile.streakLastDate === yesterday ? profile.streak + 1 : 1;
  profile.streakLastDate = today;
}
```

- [ ] **Step 4: Make stale expiry compare per quest recurrence**

In `ensureQuestsAssigned()`, replace the `staleIds` calculation with:

```typescript
const currentPeriodByQuestId = new Map(visible.map((quest) => [quest.id, this.periodKeyFor(quest, now)]));
const staleIds = existing
  .filter((sq) => {
    if (sq.status === StudentQuestStatus.EXPIRED) return false;
    if (sq.periodKey === 'static') return false;
    const currentPeriod = currentPeriodByQuestId.get(sq.questId);
    return !currentPeriod || sq.periodKey !== currentPeriod;
  })
  .map((sq) => sq.id);
```

- [ ] **Step 5: Run the service tests green**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/modules/quests/quests.service.spec.ts
```

Expected: pass.

- [ ] **Step 6: Commit Task 2**

```bash
git add apps/api/src/modules/quests/quests.service.ts apps/api/src/modules/quests/quests.service.spec.ts
git commit -m "fix: reset quest rows by recurrence period"
```

---

### Task 3: Seed Catalog Expansion and Idempotent Updates

**Files:**
- Modify: `apps/api/src/database/seeds/seed-quests.ts`
- Create: `apps/api/src/database/seeds/seed-quests.catalog.spec.ts`

**Interfaces:**
- Produces: exported `QUESTS`
- Produces: exported `BADGES`
- Produces: seed script that does not connect to DB when imported by tests
- Produces: expanded daily catalog and biweekly bounty/event catalog

- [ ] **Step 1: Write the failing seed catalog tests**

Create `apps/api/src/database/seeds/seed-quests.catalog.spec.ts`:

```typescript
import { QuestRecurrence, QuestType } from '@cp/shared';
import { QUESTS } from './seed-quests';

describe('quest seed catalog', () => {
  it('contains a richer daily catalog with varied objectives', () => {
    const daily = QUESTS.filter((quest) => quest.type === QuestType.DAILY);
    const titles = new Set(daily.map((quest) => quest.title));

    expect(daily.length).toBeGreaterThanOrEqual(16);
    expect([...titles]).toEqual(
      expect.arrayContaining([
        'Tăng tốc buổi học',
        'Bứt phá 6 bài',
        'Song kiếm HARD',
        'Mê cung đôi',
        'Python cơ bản mỗi ngày',
      ]),
    );
  });

  it('uses BIWEEKLY recurrence for repeatable bounty and event quests', () => {
    const biweekly = QUESTS.filter((quest) => quest.recurrence === QuestRecurrence.BIWEEKLY);
    const biweeklyTitles = new Set(biweekly.map((quest) => quest.title));

    expect(biweekly.some((quest) => quest.type === QuestType.BOUNTY)).toBe(true);
    expect(biweekly.some((quest) => quest.type === QuestType.EVENT)).toBe(true);
    expect([...biweeklyTitles]).toEqual(
      expect.arrayContaining([
        'Tiền thưởng 2 tuần: 20 bài',
        'Đường đua HARD 2 tuần',
        'Sự kiện cuối tuần',
        'Tuần lễ mê cung',
      ]),
    );
  });

  it('does not put date windows on BIWEEKLY quests', () => {
    const biweekly = QUESTS.filter((quest) => quest.recurrence === QuestRecurrence.BIWEEKLY);

    expect(biweekly.every((quest) => quest.daysWindow == null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the seed catalog tests red**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/database/seeds/seed-quests.catalog.spec.ts
```

Expected: fail because `QUESTS` is not exported and importing `seed-quests.ts` currently runs the database seed immediately.

- [ ] **Step 3: Export seed arrays and guard script execution**

In `apps/api/src/database/seeds/seed-quests.ts`, change:

```typescript
const BADGES: BadgeSeed[] = [
```

to:

```typescript
export const BADGES: BadgeSeed[] = [
```

Change:

```typescript
const QUESTS: QuestSeed[] = [
```

to:

```typescript
export const QUESTS: QuestSeed[] = [
```

Replace the bottom of the file with:

```typescript
if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Add more daily quests**

Add these entries after the existing daily entries in `QUESTS`:

```typescript
  { title: 'Tăng tốc buổi học', description: 'Giải 4 bài lập trình trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 4, rewardXp: 110, rewardGems: 14, icon: 'speed', recurrence: QuestRecurrence.DAILY, sortOrder: 10, category: 'Daily' },
  { title: 'Bứt phá 6 bài', description: 'Giải 6 bài lập trình trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 6, rewardXp: 190, rewardGems: 24, icon: 'rocket_launch', recurrence: QuestRecurrence.DAILY, sortOrder: 11, category: 'Daily' },
  { title: 'Song kiếm HARD', description: 'Giải 2 bài độ khó HARD hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 2, rewardXp: 220, rewardGems: 28, icon: 'local_fire_department', recurrence: QuestRecurrence.DAILY, sortOrder: 12, category: 'Daily' },
  { title: 'Mê cung đôi', description: 'Vượt 2 màn mê cung hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 2, rewardXp: 120, rewardGems: 14, icon: 'alt_route', recurrence: QuestRecurrence.DAILY, sortOrder: 13, category: 'Daily' },
  { title: 'Thợ săn điểm lớn', description: 'Kiếm 250 điểm trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 250, rewardXp: 130, rewardGems: 16, icon: 'payments', recurrence: QuestRecurrence.DAILY, sortOrder: 14, category: 'Daily' },
  { title: 'Python cơ bản mỗi ngày', description: 'Giải 1 bài có tag python hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'python' }, targetCount: 1, rewardXp: 70, rewardGems: 9, icon: 'code', recurrence: QuestRecurrence.DAILY, sortOrder: 15, category: 'Daily' },
  { title: 'Vòng lặp chăm chỉ', description: 'Giải 1 bài thuộc nhóm vòng lặp hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'vong-lap' }, targetCount: 1, rewardXp: 75, rewardGems: 9, icon: 'sync', recurrence: QuestRecurrence.DAILY, sortOrder: 16, category: 'Daily' },
  { title: 'Chuỗi ký tự nhanh', description: 'Giải 1 bài xử lý chuỗi hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'string' }, targetCount: 1, rewardXp: 80, rewardGems: 10, icon: 'text_fields', recurrence: QuestRecurrence.DAILY, sortOrder: 17, category: 'Daily' },
```

- [ ] **Step 5: Add repeatable biweekly bounty quests and update selected event quests**

Add these bounty entries before the high-tier bounty section:

```typescript
  { title: 'Tiền thưởng 2 tuần: 20 bài', description: 'Giải 20 bài lập trình trong chu kỳ 2 tuần.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 20, rewardXp: 700, rewardGems: 80, icon: 'workspace_premium', recurrence: QuestRecurrence.BIWEEKLY, sortOrder: 20, category: 'Bounty' },
  { title: 'Đường đua HARD 2 tuần', description: 'Giải 6 bài HARD trong chu kỳ 2 tuần.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 6, rewardXp: 850, rewardGems: 95, icon: 'whatshot', recurrence: QuestRecurrence.BIWEEKLY, sortOrder: 21, category: 'Bounty' },
  { title: 'Kho điểm 2 tuần', description: 'Kiếm 2.000 điểm trong chu kỳ 2 tuần.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 2000, rewardXp: 750, rewardGems: 90, icon: 'savings', recurrence: QuestRecurrence.BIWEEKLY, sortOrder: 22, category: 'Bounty' },
  { title: 'Thợ săn mê cung 2 tuần', description: 'Vượt 8 màn mê cung trong chu kỳ 2 tuần.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 8, rewardXp: 650, rewardGems: 75, icon: 'account_tree', recurrence: QuestRecurrence.BIWEEKLY, sortOrder: 23, category: 'Bounty' },
```

For existing event seed entries, set these recurrence and window values:

```typescript
// Example for each repeatable event quest:
recurrence: QuestRecurrence.BIWEEKLY,
// remove daysWindow from the object
```

Apply that pattern to all event seed entries:

- `Sự kiện cuối tuần`
- `Lễ hội thuật toán`
- `Cơn bão HARD`
- `Tuần lễ mê cung`
- `Đua điểm mùa hè`
- `Marathon 7 ngày`
- `Vượt cấp tốc hành`

- [ ] **Step 6: Update existing seed rows idempotently**

In the quest seed loop, build a payload and update existing rows:

```typescript
const questPayload = {
  title: q.title,
  description: q.description,
  type: q.type,
  status: QuestStatus.PUBLISHED,
  objectiveType: q.objectiveType,
  objectiveConfig: q.objectiveConfig ?? null,
  targetCount: q.targetCount,
  rewardXp: q.rewardXp,
  rewardGems: q.rewardGems,
  rewardBadgeId: q.rewardBadgeCode ? badgeIdByCode.get(q.rewardBadgeCode) ?? null : null,
  icon: q.icon,
  category: q.category ?? null,
  sortOrder: q.sortOrder,
  recurrence: q.recurrence,
  startsAt: q.daysWindow ? now : null,
  endsAt: q.daysWindow ? new Date(now.getTime() + q.daysWindow * 86400000) : null,
  classIds: null,
  isActive: true,
};

if (!quest) {
  quest = await questRepo.save(questRepo.create(questPayload));
  console.log(`  ⚔️  Quest created: ${q.title}`);
} else {
  await questRepo.update({ id: quest.id }, questPayload);
  quest = { ...quest, ...questPayload };
}
```

- [ ] **Step 7: Run the seed catalog tests green**

Run:

```bash
pnpm nx test api --testFile=apps/api/src/database/seeds/seed-quests.catalog.spec.ts
```

Expected: pass.

- [ ] **Step 8: Commit Task 3**

```bash
git add apps/api/src/database/seeds/seed-quests.ts apps/api/src/database/seeds/seed-quests.catalog.spec.ts
git commit -m "feat: expand student quest catalog"
```

---

### Task 4: Admin and Student UI Recurrence Labels

**Files:**
- Modify: `apps/web/src/app/i18n/locales/en.ts`
- Modify: `apps/web/src/app/i18n/locales/vi.ts`
- Modify: `apps/web/src/app/pages/student/QuestsPage.tsx`
- Modify: `apps/web/src/app/pages/admin/quests/QuestForm.tsx`

**Interfaces:**
- Consumes: `QuestRecurrence.BIWEEKLY`
- Produces: student label `resetsBiweekly`
- Produces: admin recurrence selector that comfortably renders four options

- [ ] **Step 1: Write the failing UI type check expectation**

Run this before UI changes after Tasks 1-3:

```bash
pnpm exec tsc -p apps/web/tsconfig.app.json --noEmit
```

Expected: either fail on missing `QuestRecurrence.BIWEEKLY` label handling or continue to report the known unrelated Blockly `getOptions` type error. Record the exact output before editing UI.

- [ ] **Step 2: Add recurrence translations**

In `apps/web/src/app/i18n/locales/en.ts`, update recurrence and student quest labels:

```typescript
recurrence: { NONE: 'One-time', DAILY: 'Daily', WEEKLY: 'Weekly', BIWEEKLY: 'Every 2 weeks' },
```

```typescript
resetsDaily: 'Resets daily',
resetsWeekly: 'Resets weekly',
resetsBiweekly: 'Resets every 2 weeks',
```

In `apps/web/src/app/i18n/locales/vi.ts`, update recurrence and student quest labels:

```typescript
recurrence: { NONE: 'Một lần', DAILY: 'Hằng ngày', WEEKLY: 'Hằng tuần', BIWEEKLY: 'Mỗi 2 tuần' },
```

```typescript
resetsDaily: 'Làm mới mỗi ngày',
resetsWeekly: 'Làm mới mỗi tuần',
resetsBiweekly: 'Làm mới mỗi 2 tuần',
```

- [ ] **Step 3: Show the biweekly reset label on student quest cards**

In `apps/web/src/app/pages/student/QuestsPage.tsx`, replace recurrence label selection with:

```typescript
const recurrenceLabel =
  sq.quest.recurrence === QuestRecurrence.BIWEEKLY
    ? t('gamif.student.quests.resetsBiweekly')
    : sq.quest.recurrence === QuestRecurrence.WEEKLY
      ? t('gamif.student.quests.resetsWeekly')
      : t('gamif.student.quests.resetsDaily');
```

- [ ] **Step 4: Fit four recurrence buttons in the admin quest form**

In `apps/web/src/app/pages/admin/quests/QuestForm.tsx`, change the recurrence button grid:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
```

- [ ] **Step 5: Run targeted web type check**

Run:

```bash
pnpm exec tsc -p apps/web/tsconfig.app.json --noEmit
```

Expected: no new errors from quest recurrence changes. If the pre-existing Blockly `getOptions` error appears, record it as unrelated baseline noise and continue with API/shared verification.

- [ ] **Step 6: Commit Task 4**

```bash
git add apps/web/src/app/i18n/locales/en.ts apps/web/src/app/i18n/locales/vi.ts apps/web/src/app/pages/student/QuestsPage.tsx apps/web/src/app/pages/admin/quests/QuestForm.tsx
git commit -m "feat: show biweekly quest recurrence labels"
```

---

### Task 5: Final Verification

**Files:**
- Verify all files touched by Tasks 1-4.

**Interfaces:**
- Consumes: all task outputs.
- Produces: verified implementation report.

- [ ] **Step 1: Run targeted API tests**

```bash
pnpm nx test api --testFile=apps/api/src/modules/quests/period-keys.spec.ts
pnpm nx test api --testFile=apps/api/src/modules/quests/quests.service.spec.ts
pnpm nx test api --testFile=apps/api/src/database/seeds/seed-quests.catalog.spec.ts
```

Expected: all pass.

- [ ] **Step 2: Build shared**

```bash
pnpm nx build shared
```

Expected: exit code 0.

- [ ] **Step 3: Build API**

```bash
pnpm nx build api
```

Expected: exit code 0.

- [ ] **Step 4: Type-check web**

```bash
pnpm exec tsc -p apps/web/tsconfig.app.json --noEmit
```

Expected: exit code 0, or only the known unrelated Blockly `getOptions` baseline error if it was present before Task 4.

- [ ] **Step 5: Check whitespace**

```bash
git diff --check
```

Expected: exit code 0.

- [ ] **Step 6: Review changed files**

```bash
git status --short
git diff --stat HEAD
```

Expected: only files related to quest recurrence, quest engine tests, seed catalog, migration, and UI labels are changed since the last task commit.

- [ ] **Step 7: Final commit if any verification-only fixes were needed**

If verification required edits after Task 4, commit them:

```bash
git add libs/shared/src/lib/types/quests.types.ts apps/api/src/modules/quests/period-keys.ts apps/api/src/modules/quests/period-keys.spec.ts apps/api/src/modules/quests/quests.service.ts apps/api/src/modules/quests/quests.service.spec.ts apps/api/src/database/migrations/1790000000006-AddBiweeklyQuestRecurrence.ts apps/api/src/database/seeds/seed-quests.ts apps/api/src/database/seeds/seed-quests.catalog.spec.ts apps/web/src/app/i18n/locales/en.ts apps/web/src/app/i18n/locales/vi.ts apps/web/src/app/pages/student/QuestsPage.tsx apps/web/src/app/pages/admin/quests/QuestForm.tsx
git commit -m "chore: verify biweekly quest cadence"
```

Expected: no uncommitted implementation changes remain except intentionally untracked local files.

# Daily Check-in — Phase 2 (Enrichments) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Layer the four approved check-in enrichments (freeze tokens + weekly milestone, gem-paid makeup, server-authoritative lucky wheel, attendance badges + all-time milestones + leaderboard + perfect-month) onto the completed Phase-1 check-in loop, with every anti-abuse guard implemented as concrete atomic code.

**Architecture:** The existing self-contained `apps/api/src/modules/checkin` module (entities `CheckinState`/`DailyCheckin`, `CheckinService.checkIn`/`getMe`, `CheckinController`, `checkin.constants.ts`) is extended in place. All reward mutations for one action run inside one `DataSource.transaction` with `FOR UPDATE` locks on `checkin_states` + `student_profiles`; the new `BadgesService.awardByCode` runs in its own transaction after commit (safe via `UQ_student_badge`). The React `apps/web` side gains makeup/wheel/leaderboard UI plus enrichment hooks, reusing the Phase-1 `checkinApi` wrapper and `checkinQueryKeys` factory.

**Tech Stack:** NestJS + TypeORM (Postgres, `synchronize:true`), Jest (`nx test api`) for API, React + react-query + axios for web, Vitest (direct, no nx target) for web pure helpers, `@cp/shared` for cross-cutting interfaces.

## Global Constraints

- **Monorepo:** NestJS `apps/api` + React `apps/web`; shared interfaces live in `libs/shared/src` (`@cp/shared`). Phase-1 already added every `ICheckin*` interface (spec §8) with all six board-cell status values in the union.
- **`synchronize:true`:** Phase 1 already created the full `checkin_states`/`daily_checkins` schema (including the enrichment columns `freezeTokens`, `pendingWheelSpins`, `makeupUsedThisMonth`, `highestMilestoneAwarded`, spec §3.2) **and the `UQ_daily_checkin_user_day` unique constraint on `(userId, dayKey)` (spec §3.1)** and already registered both entities in `apps/api/src/database/data-source.ts`. Phase 2 adds **no new entity**, so no `data-source.ts` edit is required. **`UQ_daily_checkin_user_day` is load-bearing for correctness** in Phase 2: it is the double-submit backstop (§10) and it makes `COUNT(*) == COUNT(DISTINCT day_key)` for the perfect-month evaluation (§4.3). Before shipping Tasks 9/10/14, confirm the live DB actually has this constraint (see MEMORY: *Schema drift vs synchronize gotcha* — `synchronize:true` does **not** reliably create/repair named constraints; verify against the shared remote dev DB).
- **Day boundary = Asia/Ho_Chi_Minh (UTC+7)** via `checkinDayKey(now)` / `daysBetweenDayKeys(a,b)` — both already exist in `apps/api/src/modules/quests/period-keys.ts` (spec §4.1). `monthKey = checkinDayKey(now).slice(0,7)`.
- **`now` is always an injected method parameter**, threaded through the whole transaction (used for both `checkinDayKey(now)` and `applyXpGain(profile, xp, now)`). NEVER call `new Date()` inside a transaction.
- **One transaction per action** with `pessimistic_write` (`FOR UPDATE`) lock on `checkin_states` + `student_profiles` to serialize read-modify-write per user (spec §7.1). Atomic conditional `UPDATE ... RETURNING id` guards protect gems / makeup-quota / wheel-spin; `affected !== 1` ⇒ throw and roll back. The daily-insert unique violation (`23505`) is caught **outside** the (rolled-back) transaction as the double-submit backstop (spec §10).
- **Currency = `gems` + `xp`/`level` on `StudentProfile`** (NOT `User`). Reuse the recipe: `applyXpGain(profile, xp, now)` (`../quests/period-keys`) + `profile.gems += n` + `advanceLevel(profile)` (`../../common/gamification.constants`, `XP_PER_LEVEL = 10000`), then `cache.bumpTags([...])` + `gateway.publish(...)` AFTER commit.
- **TDD required** (`superpowers:test-driven-development`): write the failing test first, watch it fail, implement minimally, watch it pass. **Commit frequently** with conventional messages.
- **Web has no nx `test` target** — run Vitest directly: `npx vitest run <path>`. API tests: `npx nx test api --testPathPattern=<pattern>`.
- **CheckinPage.tsx UI wiring is out-of-band from the TDD red-green loop.** Board/streak math lives in the pure, vitest-tested helper `apps/web/src/app/lib/checkin-board.ts` (Task 10). The presentational edits to `apps/web/src/app/pages/student/CheckinPage.tsx` in Tasks 10/11/13 are concrete paste-ready JSX/handler snippets but have **no unit test** (they only compose plan-defined hooks + helpers into the Phase-1 page); verify them via `npx nx run web:build` / manual smoke, not Jest/Vitest.
- **Phase-1 `CheckinService` constructor** (from spec §11.1 skeleton — consumed by every task):
  ```ts
  constructor(
    @InjectRepository(CheckinState)   private readonly stateRepo: Repository<CheckinState>,
    @InjectRepository(DailyCheckin)   private readonly dailyRepo: Repository<DailyCheckin>,
    @InjectRepository(StudentProfile) private readonly profileRepo: Repository<StudentProfile>,
    private readonly ds: DataSource,
    private readonly cache: SystemCacheService,
    private readonly badges: BadgesService,
    private readonly gateway: GamificationGateway,
    private readonly rand: () => number = Math.random,
  ) {}
  ```
- **Phase-1 private helper** consumed throughout: `private async buildStatus(userId: string, now: Date, dailyRepo: Repository<DailyCheckin>, state: CheckinState): Promise<ICheckinStatus>` (builds the board per spec §4.3 and assembles `ICheckinStatus` per §8).

---

### Task 9: Freeze tokens + weekly milestone in `checkIn`

Adds weekly milestone (gems/xp/+1 spin/+1 freeze, freeze cap 3) and automatic freeze consumption on a gap, and establishes the full Phase-2 `checkIn` skeleton (empty all-time loop + `perfectMonth:false` + post-commit badge-award loop + the `23505` double-submit backstop) that Tasks 12 & 14 fill in.

**Files:**
- Modify: `apps/api/src/modules/checkin/checkin.constants.ts` (add weekly + freeze constants)
- Modify: `apps/api/src/modules/checkin/checkin.service.ts` (rewrite `checkIn`)
- Test: `apps/api/src/modules/checkin/checkin.service.spec.ts`

**Interfaces:**
- Consumes: `checkinDayKey`, `daysBetweenDayKeys`, `applyXpGain` (`../quests/period-keys`); `advanceLevel` (`../../common/gamification.constants`); `buildStatus` (Phase-1 private); `CHECKIN_BASE_GEMS`, `CHECKIN_BASE_XP`, `CHECKIN_STREAK_GEM_PER_DAY`, `CHECKIN_STREAK_GEM_CAP` (Phase-1 constants).
- Produces: `CheckinService.checkIn(userId: string, now: Date): Promise<ICheckinResult>` (full Phase-2 skeleton); internal tx-return shape `{ status, reward, weeklyMilestone, allTimeMilestone, perfectMonth, milestoneCodes: string[], spinsGranted, leveledUp, newLevel, alreadyCheckedIn }`; constants `CHECKIN_WEEKLY_PERIOD/GEMS/XP/SPINS/FREEZE`, `CHECKIN_FREEZE_CAP`.

**Steps:**

- [ ] **Step: Add the weekly + freeze constants.** Append to `apps/api/src/modules/checkin/checkin.constants.ts`:
  ```ts
  // ── Phase 2: weekly milestone + freeze tokens (spec §5/§6a) ──────────────────
  export const CHECKIN_WEEKLY_PERIOD = 7;
  export const CHECKIN_WEEKLY_GEMS = 30;
  export const CHECKIN_WEEKLY_XP = 100;
  export const CHECKIN_WEEKLY_SPINS = 1;
  export const CHECKIN_WEEKLY_FREEZE = 1;
  export const CHECKIN_FREEZE_CAP = 3;
  ```

- [ ] **Step: Write the failing tests** (weekly milestone + freeze bridging + reset). Append to `apps/api/src/modules/checkin/checkin.service.spec.ts` (the file already defines `makeService` per spec §11.1):
  ```ts
  describe('checkIn — Phase 2 weekly milestone + freeze (Task 9)', () => {
    it('grants the weekly milestone when the streak reaches a multiple of 7', async () => {
      const { service } = makeService({
        state: {
          userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-10',
          totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6,
          freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      const res = await service.checkIn('u1', new Date('2026-07-11T03:00:00Z')); // VN 10:00 07-11
      expect(res.status.currentStreak).toBe(7);
      expect(res.weeklyMilestone).toBe(true);
      expect(res.spinsGranted).toBe(1);                 // weekly spin only (no all-time in Task 9)
      expect(res.status.freezeTokens).toBe(1);          // 0 + 1, capped at 3
      expect(res.reward.gems).toBe(5 + 12 + 30);        // base + bonus min(20,(7-1)*2)=12 + weekly 30
      expect(res.reward.xp).toBe(20 + 100);             // base 20 + weekly 100
    });

    it('bridges a gap with freeze tokens then earns a freeze back on the weekly (worked example §4.2)', async () => {
      const { service } = makeService({
        state: {
          userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-01',
          totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6,
          freezeTokens: 2, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      const res = await service.checkIn('u1', new Date('2026-07-04T03:00:00Z')); // VN 10:00 07-04, gap 3
      expect(res.status.currentStreak).toBe(7);         // 6 + 1 (bridged), missed = 2 consumed
      expect(res.weeklyMilestone).toBe(true);
      expect(res.status.freezeTokens).toBe(1);          // 2 - 2 = 0, then + 1 weekly = 1
    });

    it('resets the streak to 1 when freeze tokens are insufficient', async () => {
      const { service } = makeService({
        state: {
          userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-01',
          totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6,
          freezeTokens: 1, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      const res = await service.checkIn('u1', new Date('2026-07-04T03:00:00Z')); // gap 3, missed 2 > 1
      expect(res.status.currentStreak).toBe(1);
      expect(res.status.freezeTokens).toBe(1);          // untouched on reset
      expect(res.weeklyMilestone).toBe(false);
    });
  });
  ```

- [ ] **Step: Run the tests, expect FAIL.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected failure: `expect(received).toBe(expected) // Expected: true, Received: false` on `res.weeklyMilestone` (Phase-1 `checkIn` never sets weekly), and `Expected: 1, Received: 0` on `res.status.freezeTokens`.

- [ ] **Step: Rewrite `checkIn` with the full Phase-2 skeleton.** Add the weekly/freeze constants to the import from `./checkin.constants` and replace the `checkIn` method in `apps/api/src/modules/checkin/checkin.service.ts`:
  ```ts
  async checkIn(userId: string, now: Date): Promise<ICheckinResult> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);

    let out: {
      status: ICheckinStatus; reward: { gems: number; xp: number };
      weeklyMilestone: boolean; allTimeMilestone: number | null; perfectMonth: boolean;
      milestoneCodes: string[]; spinsGranted: number; leveledUp: boolean; newLevel: number;
      alreadyCheckedIn: boolean;
    };
    try {
      out = await this.ds.transaction(async (tx) => {
        const stateRepo = tx.getRepository(CheckinState);
        const dailyRepo = tx.getRepository(DailyCheckin);
        const profileRepo = tx.getRepository(StudentProfile);

        const state =
          (await stateRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } })) ??
          stateRepo.create({
            userId, currentStreak: 0, longestStreak: 0, lastCheckinDate: null,
            totalCheckins: 0, monthKey: monthNow, monthlyCheckins: 0,
            freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
          });
        const profile = await profileRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } });

        // Month rollover (spec §10) before reading monthly counters.
        if (state.monthKey !== monthNow) {
          state.monthKey = monthNow;
          state.monthlyCheckins = 0;
          state.makeupUsedThisMonth = 0;
        }

        // Idempotent fast-path (spec §10): no reward, no mutation.
        if (state.lastCheckinDate === today) {
          const status = await this.buildStatus(userId, now, dailyRepo, state);
          return {
            status, reward: { gems: 0, xp: 0 }, weeklyMilestone: false, allTimeMilestone: null,
            perfectMonth: false, milestoneCodes: [] as string[], spinsGranted: 0,
            leveledUp: false, newLevel: profile?.level ?? 0, alreadyCheckedIn: true,
          };
        }

        // Streak update (spec §4.2).
        if (state.lastCheckinDate == null) {
          state.currentStreak = 1;
        } else {
          const gap = daysBetweenDayKeys(state.lastCheckinDate, today); // >= 1
          if (gap === 1) {
            state.currentStreak += 1;
          } else {
            const missed = gap - 1;
            if (state.freezeTokens >= missed) {
              state.freezeTokens -= missed;    // auto-consume freeze (spec §6a)
              state.currentStreak += 1;
            } else {
              state.currentStreak = 1;         // reset (tokens untouched)
            }
          }
        }
        state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
        state.lastCheckinDate = today;
        state.totalCheckins += 1;
        state.monthlyCheckins += 1;

        // Base reward (Phase 1).
        const bonusGems = Math.min(CHECKIN_STREAK_GEM_CAP, (state.currentStreak - 1) * CHECKIN_STREAK_GEM_PER_DAY);
        let totalGems = CHECKIN_BASE_GEMS + bonusGems;
        let totalXp = CHECKIN_BASE_XP;
        let spinsGranted = 0;
        const milestoneCodes: string[] = [];
        let allTimeMilestone: number | null = null;
        let perfectMonth = false;

        // Weekly milestone (Phase 2, Task 9) — every 7th streak day.
        let weeklyMilestone = false;
        if (state.currentStreak % CHECKIN_WEEKLY_PERIOD === 0) {
          weeklyMilestone = true;
          totalGems += CHECKIN_WEEKLY_GEMS;
          totalXp += CHECKIN_WEEKLY_XP;
          spinsGranted += CHECKIN_WEEKLY_SPINS;
          state.pendingWheelSpins += CHECKIN_WEEKLY_SPINS;
          state.freezeTokens = Math.min(CHECKIN_FREEZE_CAP, state.freezeTokens + CHECKIN_WEEKLY_FREEZE);
        }

        // --- all-time milestone loop inserted in Task 12 ---

        // Persist the daily row FIRST so a COUNT (Task 14) sees it in this tx.
        // A concurrent double-submit trips UQ_daily_checkin_user_day here → 23505,
        // caught below (spec §10) after this whole tx rolls back.
        await dailyRepo.save(dailyRepo.create({ userId, dayKey: today, monthKey: monthNow, source: 'checkin' }));

        // --- perfect-month evaluation inserted in Task 14 ---

        const prevLevel = profile?.level ?? 0;
        if (profile) {
          applyXpGain(profile, totalXp, now);
          profile.gems += totalGems;
          advanceLevel(profile);
          await profileRepo.save(profile);
        }
        await stateRepo.save(state);

        const status = await this.buildStatus(userId, now, dailyRepo, state);
        return {
          status, reward: { gems: totalGems, xp: totalXp }, weeklyMilestone, allTimeMilestone,
          perfectMonth, milestoneCodes, spinsGranted,
          leveledUp: !!profile && profile.level > prevLevel, newLevel: profile?.level ?? prevLevel,
          alreadyCheckedIn: false,
        };
      });
    } catch (e: any) {
      // Double-submit backstop (spec §10): the losing insert violated
      // UQ_daily_checkin_user_day; the whole tx rolled back, so no reward was granted.
      // Return an idempotent 200 with no reward, exactly like the FOR-UPDATE fast-path.
      if (e?.code === '23505' || e?.driverError?.code === '23505') {
        const state = (await this.stateRepo.findOne({ where: { userId } })) as CheckinState;
        const status = await this.buildStatus(userId, now, this.dailyRepo, state);
        return {
          status, reward: { gems: 0, xp: 0 }, weeklyMilestone: false, allTimeMilestone: null,
          perfectMonth: false, badgesEarned: [], spinsGranted: 0, leveledUp: false, alreadyCheckedIn: true,
        };
      }
      throw e;
    }

    // Post-commit: award milestone/perfect-month badges (own tx, safe via UQ_student_badge).
    const badgesEarned: string[] = [];
    for (const code of out.milestoneCodes) {
      const b = await this.badges.awardByCode(userId, code, now);
      if (b) badgesEarned.push(b.code);
    }

    if (!out.alreadyCheckedIn) {
      await this.cache.bumpTags([
        `student:${userId}:quests`, `student:${userId}:badges`, `student:${userId}:dashboard`,
        `student:${userId}:profile`, `student:${userId}:shop`, 'leaderboard:global',
      ]);
      if (out.leveledUp) {
        this.gateway.publish(userId, {
          type: 'level:up', title: 'Level Up', message: `Level ${out.newLevel}`,
          icon: 'trending_up', level: out.newLevel, at: new Date().toISOString(),
        });
      }
    }

    return {
      status: out.status, reward: out.reward, weeklyMilestone: out.weeklyMilestone,
      allTimeMilestone: out.allTimeMilestone, perfectMonth: out.perfectMonth,
      badgesEarned, spinsGranted: out.spinsGranted, leveledUp: out.leveledUp,
      alreadyCheckedIn: out.alreadyCheckedIn,
    };
  }
  ```
  > `this.badges.awardByCode` (Task 12) is mocked in the spec (`badges: { awardByCode: jest.fn().mockResolvedValue(null) }`), so `checkIn`'s post-commit loop compiles and runs now; `milestoneCodes` is empty until Task 12. The `catch (e: any)` inspects both `e.code` and `e.driverError.code` because TypeORM surfaces the Postgres SQLSTATE on either depending on the driver wrapping.

- [ ] **Step: Run the tests, expect PASS.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected: the three Task-9 cases pass; all Phase-1 cases still green.

- [ ] **Step: Commit.**
  ```bash
  git add apps/api/src/modules/checkin/checkin.constants.ts apps/api/src/modules/checkin/checkin.service.ts apps/api/src/modules/checkin/checkin.service.spec.ts
  git commit -m "feat(checkin): weekly milestone + auto freeze consumption + 23505 backstop in checkIn"
  ```

---

### Task 10: Makeup check-in (`POST /checkin/makeup`) + board `makeup`/`missable`

Manual gem-paid backfill with atomic gem-debit and quota guards (no reward, no streak change), plus the `makeup`/`missable` cell statuses in both the backend board builder and the frontend `checkin-board.ts`.

**Files:**
- Modify: `apps/api/src/modules/checkin/checkin.constants.ts` (makeup constants)
- Modify: `apps/api/src/modules/checkin/checkin.service.ts` (`makeup`; rewrite `buildStatus`)
- Modify: `apps/api/src/modules/checkin/checkin.controller.ts` (route)
- Modify: `apps/web/src/app/lib/checkin-board.ts` + `apps/web/src/app/api/checkin.queries.ts` (UI hook) + `apps/web/src/app/pages/student/CheckinPage.tsx`
- Test: `apps/api/src/modules/checkin/checkin.service.spec.ts`; `apps/web/src/app/lib/checkin-board.spec.ts`

**Interfaces:**
- Consumes: `buildStatus` (rewritten here), `checkinDayKey`; `BadRequestException`, `ConflictException`, `NotFoundException` (`@nestjs/common`); `ICheckinBoardCell`, `ICheckinStatus` (`@cp/shared`).
- Produces: `CheckinService.makeup(userId: string, date: string, now: Date): Promise<ICheckinResult>`; internal makeup tx-return shape `{ status, reward, weeklyMilestone, allTimeMilestone, perfectMonth, milestoneCodes: string[], spinsGranted, leveledUp, newLevel }`; constants `CHECKIN_MAKEUP_COST_GEMS`, `CHECKIN_MAKEUP_MAX_PER_MONTH`; frontend `buildCheckinBoard(status: ICheckinStatus): CheckinBoardCellView[]` with `makeupable: boolean`.

**Steps:**

- [ ] **Step: Add makeup constants.** Append to `checkin.constants.ts`:
  ```ts
  // ── Phase 2: makeup (spec §5/§6b) ────────────────────────────────────────────
  export const CHECKIN_MAKEUP_COST_GEMS = 20;
  export const CHECKIN_MAKEUP_MAX_PER_MONTH = 2;
  ```

- [ ] **Step: Write the failing makeup tests.** Append to `checkin.service.spec.ts`:
  ```ts
  describe('makeup (Task 10)', () => {
    const seedState = {
      userId: 'u1', currentStreak: 5, longestStreak: 5, lastCheckinDate: '2026-07-10',
      totalCheckins: 5, monthKey: '2026-07', monthlyCheckins: 5,
      freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
    };

    it('rejects a future date or a date outside the current month', async () => {
      const { service } = makeService({ state: { ...seedState }, profile: { userId: 'u1', gems: 100 } });
      const now = new Date('2026-07-11T03:00:00Z'); // today = 2026-07-11
      await expect(service.makeup('u1', '2026-07-12', now)).rejects.toThrow(); // future
      await expect(service.makeup('u1', '2026-06-30', now)).rejects.toThrow(); // other month
    });

    it('rejects when gems are insufficient (atomic gem guard returns 0 rows)', async () => {
      const { service, tx } = makeService({ state: { ...seedState }, profile: { userId: 'u1', gems: 0 } });
      tx.query.mockResolvedValueOnce([]); // UPDATE student_profiles ... RETURNING id -> 0 rows
      await expect(service.makeup('u1', '2026-07-05', new Date('2026-07-11T03:00:00Z'))).rejects.toThrow();
    });

    it('rejects when the monthly quota is exhausted (atomic quota guard returns 0 rows)', async () => {
      const { service, tx } = makeService({ state: { ...seedState }, profile: { userId: 'u1', gems: 100 } });
      tx.query
        .mockResolvedValueOnce([{ id: 'p1' }]) // gem debit ok
        .mockResolvedValueOnce([]);            // quota UPDATE -> 0 rows
      await expect(service.makeup('u1', '2026-07-05', new Date('2026-07-11T03:00:00Z'))).rejects.toThrow();
    });

    it('fills a past day with source=makeup, no reward, no streak change', async () => {
      const { service, tx, dailyRepo } = makeService({ state: { ...seedState }, profile: { userId: 'u1', gems: 100 } });
      tx.query
        .mockResolvedValueOnce([{ id: 'p1' }])  // gem debit ok
        .mockResolvedValueOnce([{ id: 's1' }]); // quota bump ok
      const res = await service.makeup('u1', '2026-07-05', new Date('2026-07-11T03:00:00Z'));
      expect(res.reward).toEqual({ gems: 0, xp: 0 });
      expect(res.status.currentStreak).toBe(5); // unchanged
      expect(dailyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', dayKey: '2026-07-05', monthKey: '2026-07', source: 'makeup' }),
      );
    });
  });
  ```

- [ ] **Step: Run the tests, expect FAIL.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected failure: `TypeError: service.makeup is not a function`.

- [ ] **Step: Rewrite `buildStatus` (emit `makeup`/`missable`) and add `makeup`.** In `checkin.service.ts`, add `CHECKIN_MAKEUP_COST_GEMS`, `CHECKIN_MAKEUP_MAX_PER_MONTH` to the `./checkin.constants` import and `BadRequestException, ConflictException, NotFoundException` to the `@nestjs/common` import, then replace `buildStatus` and add `makeup`:
  ```ts
  private async buildStatus(
    userId: string, now: Date, dailyRepo: Repository<DailyCheckin>, state: CheckinState,
  ): Promise<ICheckinStatus> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);
    const rows = await dailyRepo.find({ where: { userId, monthKey: monthNow } });
    const byDay = new Map(rows.map((r) => [r.dayKey, r]));
    const [y, mo] = monthNow.split('-').map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();

    const board: ICheckinBoardCell[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = `${monthNow}-${String(d).padStart(2, '0')}`;
      const row = byDay.get(dayKey);
      let status: ICheckinBoardCell['status'];
      if (row?.source === 'checkin') status = 'checked';      // wins even on `today`
      else if (row?.source === 'makeup') status = 'makeup';   // Phase 2
      else if (dayKey === today) status = 'today';
      else if (dayKey > today) status = 'future';
      else status = 'missable';                                // Phase 2 (replaces 'missed')
      board.push({ dayKey, status });
    }

    const rolledOver = state.monthKey !== monthNow;
    const makeupUsed = rolledOver ? 0 : state.makeupUsedThisMonth;
    return {
      today, checkedInToday: state.lastCheckinDate === today, monthKey: monthNow, board,
      currentStreak: state.currentStreak, longestStreak: state.longestStreak,
      totalCheckins: state.totalCheckins, monthlyCheckins: rolledOver ? 0 : state.monthlyCheckins,
      freezeTokens: state.freezeTokens, pendingWheelSpins: state.pendingWheelSpins,
      makeupRemaining: Math.max(0, CHECKIN_MAKEUP_MAX_PER_MONTH - makeupUsed),
      makeupCost: CHECKIN_MAKEUP_COST_GEMS,
    };
  }

  async makeup(userId: string, date: string, now: Date): Promise<ICheckinResult> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);
    if (!(date < today) || date.slice(0, 7) !== monthNow) {
      throw new BadRequestException('Ngày makeup phải là ngày quá khứ trong tháng hiện tại.');
    }

    let out: {
      status: ICheckinStatus; reward: { gems: number; xp: number };
      weeklyMilestone: boolean; allTimeMilestone: number | null; perfectMonth: boolean;
      milestoneCodes: string[]; spinsGranted: number; leveledUp: boolean; newLevel: number;
    };
    try {
      out = await this.ds.transaction(async (tx) => {
        const stateRepo = tx.getRepository(CheckinState);
        const dailyRepo = tx.getRepository(DailyCheckin);

        const existing = await dailyRepo.findOne({ where: { userId, dayKey: date } });
        if (existing) throw new ConflictException('Ngày này đã được điểm danh.');

        // Atomic gem debit — WHERE gems >= cost; RETURNING id so affected = rows.length.
        const gemRows = await tx.query(
          `UPDATE student_profiles SET gems = gems - $1 WHERE user_id = $2 AND gems >= $1 RETURNING id`,
          [CHECKIN_MAKEUP_COST_GEMS, userId],
        );
        if (gemRows.length !== 1) throw new BadRequestException('Không đủ đá quý để makeup.');

        // Atomic, rollover-aware quota bump — cap enforced in the WHERE clause.
        const quotaRows = await tx.query(
          `UPDATE checkin_states
             SET makeup_used_this_month = CASE WHEN month_key = $2 THEN makeup_used_this_month + 1 ELSE 1 END,
                 monthly_checkins       = CASE WHEN month_key = $2 THEN monthly_checkins + 1 ELSE 1 END,
                 month_key = $2
           WHERE user_id = $1 AND (month_key <> $2 OR makeup_used_this_month < $3)
           RETURNING id`,
          [userId, monthNow, CHECKIN_MAKEUP_MAX_PER_MONTH],
        );
        if (quotaRows.length !== 1) throw new ConflictException('Đã dùng hết lượt makeup trong tháng.');

        // A concurrent same-date makeup that passed the existing-check above trips
        // UQ_daily_checkin_user_day here → 23505, caught below (spec §6b) after rollback.
        await dailyRepo.save(dailyRepo.create({ userId, dayKey: date, monthKey: monthNow, source: 'makeup' }));

        // --- perfect-month evaluation inserted in Task 14 ---

        const state = (await stateRepo.findOne({ where: { userId } })) as CheckinState;
        const status = await this.buildStatus(userId, now, dailyRepo, state);
        return {
          status, reward: { gems: 0, xp: 0 }, weeklyMilestone: false, allTimeMilestone: null,
          perfectMonth: false, milestoneCodes: [] as string[], spinsGranted: 0, leveledUp: false, newLevel: 0,
        };
      });
    } catch (e: any) {
      if (e instanceof BadRequestException || e instanceof ConflictException || e instanceof NotFoundException) {
        throw e;
      }
      // Concurrent same-date makeup lost the UQ_daily_checkin_user_day race; the whole
      // tx (incl. gem debit + quota bump) rolled back, so translate to the same 409.
      if (e?.code === '23505' || e?.driverError?.code === '23505') {
        throw new ConflictException('Ngày này đã được điểm danh.');
      }
      throw e;
    }

    const badgesEarned: string[] = [];
    for (const code of out.milestoneCodes) {
      const b = await this.badges.awardByCode(userId, code, now);
      if (b) badgesEarned.push(b.code);
    }
    await this.cache.bumpTags([
      `student:${userId}:quests`, `student:${userId}:badges`, `student:${userId}:dashboard`,
      `student:${userId}:profile`, `student:${userId}:shop`, 'leaderboard:global',
    ]);
    if (out.leveledUp) {
      this.gateway.publish(userId, {
        type: 'level:up', title: 'Level Up', message: `Level ${out.newLevel}`,
        icon: 'trending_up', level: out.newLevel, at: new Date().toISOString(),
      });
    }
    return {
      status: out.status, reward: out.reward, weeklyMilestone: false, allTimeMilestone: out.allTimeMilestone,
      perfectMonth: out.perfectMonth, badgesEarned, spinsGranted: out.spinsGranted, leveledUp: out.leveledUp,
    };
  }
  ```
  > The two `FOR UPDATE` reads are unnecessary here because the conditional `UPDATE ... WHERE ... RETURNING id` guards are themselves atomic and roll back together in one transaction — no double-debit, no cap overrun (spec §6b/§10). `leveledUp`/`newLevel` stay `false`/`0` in Task 10 (makeup grants no XP); Task 14 rewrites the tail of this transaction to compute them when a perfect month completes, and the post-commit `if (out.leveledUp)` publish above then fires.

- [ ] **Step: Run the tests, expect PASS.** Command: `npx nx test api --testPathPattern=checkin.service.spec`.

- [ ] **Step: Add the controller route.** In `apps/api/src/modules/checkin/checkin.controller.ts` add `Body` to the `@nestjs/common` import and add:
  ```ts
  @Post('makeup')
  async makeup(@CurrentUser() user: JwtPayload, @Body('date') date: string) {
    return this.service.makeup(user.sub, date, new Date());
  }
  ```

- [ ] **Step: Write the failing web board test.** Create/append `apps/web/src/app/lib/checkin-board.spec.ts`:
  ```ts
  import { describe, expect, it } from 'vitest';
  import { buildCheckinBoard } from './checkin-board';
  import type { ICheckinStatus } from '@cp/shared';

  const base: ICheckinStatus = {
    today: '2026-07-11', checkedInToday: true, monthKey: '2026-07', board: [],
    currentStreak: 3, longestStreak: 3, totalCheckins: 3, monthlyCheckins: 3,
    freezeTokens: 0, pendingWheelSpins: 0, makeupRemaining: 2, makeupCost: 20,
  };

  describe('buildCheckinBoard (Task 10)', () => {
    it('flags only missable cells as makeupable and passes makeup cells through', () => {
      const status: ICheckinStatus = {
        ...base,
        board: [
          { dayKey: '2026-07-01', status: 'checked' },
          { dayKey: '2026-07-02', status: 'missable' },
          { dayKey: '2026-07-03', status: 'makeup' },
          { dayKey: '2026-07-12', status: 'future' },
        ],
      };
      const cells = buildCheckinBoard(status);
      expect(cells.map((c) => c.makeupable)).toEqual([false, true, false, false]);
      expect(cells.map((c) => c.status)).toEqual(['checked', 'missable', 'makeup', 'future']);
    });
  });
  ```

- [ ] **Step: Run the web test, expect FAIL.** Command: `npx vitest run apps/web/src/app/lib/checkin-board.spec.ts`. Expected failure: `does not provide an export named 'buildCheckinBoard'` (or `makeupable` undefined).

- [ ] **Step: Extend `checkin-board.ts`.** Replace the board-view helper in `apps/web/src/app/lib/checkin-board.ts`:
  ```ts
  import type { ICheckinBoardCell, ICheckinStatus } from '@cp/shared';

  export interface CheckinBoardCellView {
    dayKey: string;
    status: ICheckinBoardCell['status'];
    makeupable: boolean; // true only for past, still-empty days (spec §4.3 'missable')
  }

  export function buildCheckinBoard(status: ICheckinStatus): CheckinBoardCellView[] {
    return status.board.map((cell) => ({
      dayKey: cell.dayKey,
      status: cell.status,
      makeupable: cell.status === 'missable',
    }));
  }
  ```

- [ ] **Step: Run the web test, expect PASS.** Command: `npx vitest run apps/web/src/app/lib/checkin-board.spec.ts`.

- [ ] **Step: Add the `useMakeup` hook.** In `apps/web/src/app/api/checkin.queries.ts` add (invalidating all five keys per spec §9.5):
  ```ts
  export function useMakeup() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (date: string) => checkinApi.makeup(date).then((r) => r.data),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: checkinQueryKeys.all });      // ['checkin']
        void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });  // gems on dashboard data
        void qc.invalidateQueries({ queryKey: ['leaderboard'] });            // streak moved
        void qc.invalidateQueries({ queryKey: ['shop'] });
        void qc.invalidateQueries({ queryKey: ['student-badges'] });         // perfect-month badge
      },
    });
  }
  ```

- [ ] **Step: Wire the makeup button into `CheckinPage.tsx`** (out-of-band, presentational, no unit test). Assumes the Phase-1 page already has `status` in scope (from `useCheckinStatus()`) and the standard `useTranslation()` `t`. Add `import { buildCheckinBoard } from '../../lib/checkin-board';` and `import { useMakeup } from '../../api/checkin.queries';`, declare `const makeup = useMakeup();`, and render the board:
  ```tsx
  <div className="checkin-board" role="grid">
    {buildCheckinBoard(status).map((cell) => (
      <div key={cell.dayKey} className={`checkin-cell checkin-cell--${cell.status}`} role="gridcell">
        <span className="checkin-cell__day">{Number(cell.dayKey.slice(-2))}</span>
        {cell.makeupable && status.makeupRemaining > 0 && (
          <button
            type="button"
            className="checkin-cell__makeup"
            disabled={makeup.isPending}
            onClick={() => makeup.mutate(cell.dayKey)}
          >
            {t('checkin.makeup.button', { cost: status.makeupCost })}
          </button>
        )}
      </div>
    ))}
  </div>
  ```

- [ ] **Step: Commit.**
  ```bash
  git add apps/api/src/modules/checkin apps/web/src/app/lib/checkin-board.ts apps/web/src/app/lib/checkin-board.spec.ts apps/web/src/app/api/checkin.queries.ts apps/web/src/app/pages/student/CheckinPage.tsx
  git commit -m "feat(checkin): gem-paid makeup with atomic guards + 23505 conflict + missable/makeup board cells"
  ```

---

### Task 11: Lucky wheel (`pickWheelSegment` + `POST /checkin/wheel/spin`)

Server-authoritative weighted RNG with an injectable `rand`, an atomic spin-decrement guard, and the spin UI.

**Files:**
- Modify: `apps/api/src/modules/checkin/checkin.constants.ts` (`CHECKIN_WHEEL_SEGMENTS`)
- Modify: `apps/api/src/modules/checkin/checkin.service.ts` (`pickWheelSegment`, `spin`)
- Modify: `apps/api/src/modules/checkin/checkin.controller.ts` (route)
- Modify: `apps/web/src/app/api/checkin.queries.ts` + `apps/web/src/app/pages/student/CheckinPage.tsx`
- Test: `apps/api/src/modules/checkin/checkin.service.spec.ts`

**Interfaces:**
- Consumes: `this.rand` (Phase-1 constructor field), `applyXpGain`, `advanceLevel`, `buildStatus`, `ConflictException`.
- Produces: `export function pickWheelSegment(rand?: () => number)`; `CheckinService.spin(userId: string, now: Date): Promise<ICheckinWheelResult>`; `CHECKIN_WHEEL_SEGMENTS`; frontend `useWheelSpin()`.

**Steps:**

- [ ] **Step: Add the wheel segments constant.** Append to `checkin.constants.ts` (spec §5, total weight = 100, `index` contiguous 0..5):
  ```ts
  // ── Phase 2: lucky wheel (spec §5/§6c) — total weight = 100, no placeholder item ─
  export const CHECKIN_WHEEL_SEGMENTS = [
    { index: 0, kind: 'gems', amount: 10,  weight: 30 },
    { index: 1, kind: 'xp',   amount: 50,  weight: 25 },
    { index: 2, kind: 'gems', amount: 25,  weight: 20 },
    { index: 3, kind: 'xp',   amount: 150, weight: 12 },
    { index: 4, kind: 'gems', amount: 60,  weight: 8  },
    { index: 5, kind: 'gems', amount: 100, weight: 5  },
  ] as const;
  ```

- [ ] **Step: Write the failing wheel tests.** Append to `checkin.service.spec.ts`:
  ```ts
  import { pickWheelSegment } from './checkin.service';

  describe('wheel (Task 11)', () => {
    it('pickWheelSegment is deterministic under an injected rand', () => {
      const seg = pickWheelSegment(() => 0.5); // r = 50 -> passes seg0(30), lands in seg1(25)
      expect(seg.index).toBe(1);
      expect(seg.kind).toBe('xp');
      expect(seg.amount).toBe(50);
    });

    it('spin grants the deterministic prize when a spin is available', async () => {
      const { service, tx, profileRepo } = makeService({
        state: {
          userId: 'u1', currentStreak: 3, longestStreak: 3, lastCheckinDate: '2026-07-11',
          totalCheckins: 3, monthKey: '2026-07', monthlyCheckins: 3,
          freezeTokens: 0, pendingWheelSpins: 1, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      tx.query.mockResolvedValueOnce([{ id: 's1' }]); // atomic decrement succeeds
      const res = await service.spin('u1', new Date('2026-07-11T03:00:00Z')); // rand default () => 0.5
      expect(res.segmentIndex).toBe(1);
      expect(res.prize).toEqual({ kind: 'xp', amount: 50 });
      expect(profileRepo.save).toHaveBeenCalled();
    });

    it('spin with no pending spins throws (atomic decrement affected 0)', async () => {
      const { service, tx } = makeService({
        state: {
          userId: 'u1', currentStreak: 3, longestStreak: 3, lastCheckinDate: '2026-07-11',
          totalCheckins: 3, monthKey: '2026-07', monthlyCheckins: 3,
          freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      tx.query.mockResolvedValueOnce([]); // decrement matched 0 rows
      await expect(service.spin('u1', new Date('2026-07-11T03:00:00Z'))).rejects.toThrow('NO_SPINS');
    });
  });
  ```

- [ ] **Step: Run the tests, expect FAIL.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected failure: `does not provide an export named 'pickWheelSegment'`.

- [ ] **Step: Add `pickWheelSegment` + `spin`.** In `checkin.service.ts` add `CHECKIN_WHEEL_SEGMENTS` to the `./checkin.constants` import, then add the exported helper (top-level, after imports) and the method:
  ```ts
  export function pickWheelSegment(rand: () => number = Math.random) {
    const total = CHECKIN_WHEEL_SEGMENTS.reduce((s, x) => s + x.weight, 0);
    let r = rand() * total;
    for (const seg of CHECKIN_WHEEL_SEGMENTS) {
      if ((r -= seg.weight) < 0) return seg;
    }
    return CHECKIN_WHEEL_SEGMENTS[CHECKIN_WHEEL_SEGMENTS.length - 1];
  }
  ```
  ```ts
  async spin(userId: string, now: Date): Promise<ICheckinWheelResult> {
    const out = await this.ds.transaction(async (tx) => {
      const stateRepo = tx.getRepository(CheckinState);
      const dailyRepo = tx.getRepository(DailyCheckin);
      const profileRepo = tx.getRepository(StudentProfile);

      // Atomic decrement — only the winner of a double-submit gets a prize (spec §6c).
      const spinRows = await tx.query(
        `UPDATE checkin_states SET pending_wheel_spins = pending_wheel_spins - 1
           WHERE user_id = $1 AND pending_wheel_spins > 0 RETURNING id`,
        [userId],
      );
      if (spinRows.length !== 1) throw new ConflictException('NO_SPINS');

      const seg = pickWheelSegment(this.rand);
      const profile = await profileRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } });
      const prevLevel = profile?.level ?? 0;
      let prize: ICheckinWheelResult['prize'];
      if (seg.kind === 'gems') {
        if (profile) { profile.gems += seg.amount; await profileRepo.save(profile); }
        prize = { kind: 'gems', amount: seg.amount };
      } else {
        if (profile) { applyXpGain(profile, seg.amount, now); advanceLevel(profile); await profileRepo.save(profile); }
        prize = { kind: 'xp', amount: seg.amount };
      }

      const state = (await stateRepo.findOne({ where: { userId } })) as CheckinState;
      const status = await this.buildStatus(userId, now, dailyRepo, state);
      return { segmentIndex: seg.index, prize, status, leveledUp: !!profile && profile.level > prevLevel, newLevel: profile?.level ?? prevLevel };
    });

    await this.cache.bumpTags([
      `student:${userId}:quests`, `student:${userId}:badges`, `student:${userId}:dashboard`,
      `student:${userId}:profile`, `student:${userId}:shop`, 'leaderboard:global',
    ]);
    if (out.leveledUp) {
      this.gateway.publish(userId, {
        type: 'level:up', title: 'Level Up', message: `Level ${out.newLevel}`,
        icon: 'trending_up', level: out.newLevel, at: new Date().toISOString(),
      });
    }
    return { segmentIndex: out.segmentIndex, prize: out.prize, status: out.status };
  }
  ```

- [ ] **Step: Run the tests, expect PASS.** Command: `npx nx test api --testPathPattern=checkin.service.spec`.

- [ ] **Step: Add the controller route.** In `checkin.controller.ts`:
  ```ts
  @Post('wheel/spin')
  async spin(@CurrentUser() user: JwtPayload) {
    return this.service.spin(user.sub, new Date());
  }
  ```

- [ ] **Step: Add the `useWheelSpin` hook.** In `apps/web/src/app/api/checkin.queries.ts` add (invalidating all five keys per spec §9.5):
  ```ts
  export function useWheelSpin() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => checkinApi.spin().then((r) => r.data),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: checkinQueryKeys.all });      // ['checkin']
        void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });  // gems/xp on dashboard data
        void qc.invalidateQueries({ queryKey: ['leaderboard'] });
        void qc.invalidateQueries({ queryKey: ['shop'] });
        void qc.invalidateQueries({ queryKey: ['student-badges'] });
      },
    });
  }
  ```

- [ ] **Step: Wire the wheel UI into `CheckinPage.tsx`** (out-of-band, presentational, no unit test). Segments come from the server response only — no client RNG (spec §6c); the labels below are a local display-only constant that mirrors the server weights, so the frontend never imports the backend `CHECKIN_WHEEL_SEGMENTS`. Add `import { useState } from 'react';`, `import type { ICheckinWheelResult } from '@cp/shared';`, and `import { useWheelSpin } from '../../api/checkin.queries';`; declare `const wheel = useWheelSpin();` and `const [spinResult, setSpinResult] = useState<ICheckinWheelResult | null>(null);`, then:
  ```tsx
  {/* display-only labels; the server is authoritative for the actual prize */}
  {(() => {
    const WHEEL_DISPLAY = ['💎 10', '⭐ 50', '💎 25', '⭐ 150', '💎 60', '💎 100'];
    return (
      <section className="checkin-wheel">
        <ul className="checkin-wheel__segments">
          {WHEEL_DISPLAY.map((label, i) => (
            <li key={i} className={spinResult?.segmentIndex === i ? 'is-won' : undefined}>{label}</li>
          ))}
        </ul>
        <button
          type="button"
          className="checkin-wheel__spin"
          disabled={status.pendingWheelSpins === 0 || wheel.isPending}
          onClick={() => wheel.mutate(undefined, { onSuccess: (data) => setSpinResult(data) })}
        >
          {t('checkin.wheel.spin', { count: status.pendingWheelSpins })}
        </button>
        {spinResult && (
          <p className="checkin-wheel__prize">
            {spinResult.prize.kind === 'gems'
              ? `+${spinResult.prize.amount} 💎`
              : `+${spinResult.prize.amount} ⭐`}
          </p>
        )}
      </section>
    );
  })()}
  ```

- [ ] **Step: Commit.**
  ```bash
  git add apps/api/src/modules/checkin apps/web/src/app/api/checkin.queries.ts apps/web/src/app/pages/student/CheckinPage.tsx
  git commit -m "feat(checkin): server-authoritative lucky wheel with atomic spin decrement"
  ```

---

### Task 12: Badges + all-time milestone (`BadgesService.awardByCode`)

New public `awardByCode` mirroring `evaluateAndAward`'s transactional award block, 4 seeded badges (idempotent by `code`), and the all-time milestone loop (7/30/100) in `checkIn` gated by `highestMilestoneAwarded` with the 30/100 gems fallback.

**Files:**
- Modify: `apps/api/src/modules/quests/badges.service.ts` (`awardByCode`)
- Create: `apps/api/src/database/seeds/seed-checkin.ts`
- Modify: `package.json` (seed script)
- Modify: `apps/api/src/modules/checkin/checkin.constants.ts` (milestone/badge constants)
- Modify: `apps/api/src/modules/checkin/checkin.service.ts` (milestone loop)
- Test: `apps/api/src/modules/quests/badges.service.spec.ts`; `apps/api/src/modules/checkin/checkin.service.spec.ts`

**Interfaces:**
- Consumes: `Badge`, `StudentBadge` (`./badge.entity`, `./student-badge.entity`); `applyXpGain`, `advanceLevel`; `UQ_student_badge` (`StudentBadge`); `BadgeCriteriaType`, `BadgeRarity` (`@cp/shared`); `AppDataSource` (`../data-source`).
- Produces: `BadgesService.awardByCode(userId: string, code: string, now?: Date): Promise<Badge | null>`; constants `CHECKIN_ALLTIME_MILESTONES`, `CHECKIN_MILESTONE_SHOP_ITEM_AT`, `CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS`, `CHECKIN_BADGE_CODES`; `checkIn` now returns real `allTimeMilestone`/`badgesEarned`.

**Steps:**

- [ ] **Step: Write the failing `awardByCode` test.** Create `apps/api/src/modules/quests/badges.service.spec.ts`:
  ```ts
  import { BadgesService } from './badges.service';
  import { Badge } from './badge.entity';
  import { StudentBadge } from './student-badge.entity';
  import { StudentProfile } from '../students/student-profile.entity';

  function make(seed: { badge?: any; owned?: any; profile?: any }) {
    const badge = seed.badge ?? { id: 'b7', code: 'checkin-streak-7', title: 'On Fire', description: 'd', icon: 'i', rewardXp: 150, rewardGems: 15, isActive: true, earnedCount: 0 };
    const badgesRepo = { findOne: jest.fn().mockResolvedValue(badge), find: jest.fn(), createQueryBuilder: jest.fn() };
    const studentBadgesRepo = { findOne: jest.fn().mockResolvedValue(seed.owned ?? null), find: jest.fn() };
    const profilesRepo = { findOne: jest.fn().mockResolvedValue(seed.profile ?? { userId: 'u1', gems: 0, xp: 0, level: 1, badgesEarned: 0 }) };

    const sbTx = { findOne: jest.fn().mockResolvedValue(seed.owned ?? null), save: jest.fn(async (x) => x), create: jest.fn((x) => x) };
    const badgeTx = { save: jest.fn(async (x) => x) };
    const profTx = { findOne: jest.fn().mockResolvedValue(seed.profile ?? { userId: 'u1', gems: 0, xp: 0, level: 1, badgesEarned: 0 }), save: jest.fn(async (x) => x) };
    const repos = new Map<unknown, any>([[StudentBadge, sbTx], [Badge, badgeTx], [StudentProfile, profTx]]);
    const tx = { getRepository: jest.fn((e) => repos.get(e)) };
    const ds = { transaction: jest.fn((fn) => fn(tx)) };
    const gateway = { publish: jest.fn() };
    const cache = { bumpTags: jest.fn().mockResolvedValue(undefined) };
    const service = new BadgesService(badgesRepo as any, studentBadgesRepo as any, profilesRepo as any, ds as any, gateway as any, cache as any);
    return { service, sbTx, profTx, gateway, badge };
  }

  describe('BadgesService.awardByCode (Task 12)', () => {
    it('grants an unowned active badge and its reward', async () => {
      const { service, sbTx, profTx, gateway, badge } = make({});
      const res = await service.awardByCode('u1', 'checkin-streak-7', new Date('2026-07-11T03:00:00Z'));
      expect(res).toBe(badge);
      expect(sbTx.save).toHaveBeenCalled();
      expect(profTx.save).toHaveBeenCalledWith(expect.objectContaining({ gems: 15, badgesEarned: 1 }));
      expect(gateway.publish).toHaveBeenCalledWith('u1', expect.objectContaining({ type: 'badge:earned' }));
    });

    it('returns null and grants nothing when already owned', async () => {
      const { service, sbTx } = make({ owned: { userId: 'u1', badgeId: 'b7' } });
      const res = await service.awardByCode('u1', 'checkin-streak-7');
      expect(res).toBeNull();
      expect(sbTx.save).not.toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step: Run the test, expect FAIL.** Command: `npx nx test api --testPathPattern=badges.service.spec`. Expected failure: `TypeError: service.awardByCode is not a function`.

- [ ] **Step: Add `awardByCode`.** Append to `BadgesService` in `apps/api/src/modules/quests/badges.service.ts` (mirrors the `evaluateAndAward` award block, lines 106–141):
  ```ts
  /**
   * Award a single badge by its `code` (used by check-in milestones, which have
   * no StudentProfile stat for `evaluateAndAward` to key on). Idempotent via
   * UQ_student_badge; grants the badge's own XP/gems reward and publishes.
   */
  async awardByCode(userId: string, code: string, now: Date = new Date()): Promise<Badge | null> {
    const badge = await this.badges.findOne({ where: { code, isActive: true } });
    if (!badge) return null;
    const owned = await this.studentBadges.findOne({ where: { userId, badgeId: badge.id } });
    if (owned) return null;

    let awarded: Badge | null = null;
    await this.ds.transaction(async (tx) => {
      const sbRepo = tx.getRepository(StudentBadge);
      const badgeRepo = tx.getRepository(Badge);
      const profRepo = tx.getRepository(StudentProfile);

      const exists = await sbRepo.findOne({ where: { userId, badgeId: badge.id } });
      if (exists) return;
      const fresh = await profRepo.findOne({ where: { userId } });
      if (!fresh) return;

      await sbRepo.save(sbRepo.create({ userId, badgeId: badge.id }));
      badge.earnedCount += 1;
      await badgeRepo.save(badge);
      applyXpGain(fresh, badge.rewardXp, now);
      fresh.gems += badge.rewardGems;
      fresh.badgesEarned += 1;
      advanceLevel(fresh);
      await profRepo.save(fresh);
      awarded = badge;
    });

    if (awarded) {
      this.gateway.publish(userId, {
        type: 'badge:earned', title: awarded.title, message: awarded.description, icon: awarded.icon,
        badgeId: awarded.id, rewardXp: awarded.rewardXp, rewardGems: awarded.rewardGems,
        at: new Date().toISOString(),
      });
      await this.cache.bumpTags([
        `student:${userId}:badges`, `student:${userId}:dashboard`,
        `student:${userId}:profile`, 'leaderboard:global',
      ]);
    }
    return awarded;
  }
  ```

- [ ] **Step: Run the test, expect PASS.** Command: `npx nx test api --testPathPattern=badges.service.spec`.

- [ ] **Step: Add milestone/badge constants.** Append to `checkin.constants.ts`:
  ```ts
  // ── Phase 2: all-time milestones + badges (spec §5/§6d) ──────────────────────
  export const CHECKIN_ALLTIME_MILESTONES = [7, 30, 100] as const;
  export const CHECKIN_MILESTONE_SHOP_ITEM_AT = [30, 100] as const;
  export const CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS = 100; // gems in lieu of a shop item (spec §6c)
  export const CHECKIN_BADGE_CODES = {
    STREAK_7: 'checkin-streak-7',
    STREAK_30: 'checkin-streak-30',
    STREAK_100: 'checkin-streak-100',
    PERFECT_MONTH: 'checkin-perfect-month',
  } as const;
  ```

- [ ] **Step: Create the idempotent seed.** Create `apps/api/src/database/seeds/seed-checkin.ts` (mirrors `seed-quests.ts` upsert-by-`code`; `threshold: 999999` so `evaluateAndAward` never self-awards these — spec §6d):
  ```ts
  import 'reflect-metadata';
  import { AppDataSource } from '../data-source';
  import { Badge } from '../../modules/quests/badge.entity';
  import { BadgeCriteriaType, BadgeRarity } from '@cp/shared';

  const CHECKIN_BADGES = [
    { code: 'checkin-streak-7',      title: 'Điểm danh 7 ngày',   description: 'Chuỗi điểm danh 7 ngày liên tiếp.',   icon: 'event_available', rarity: BadgeRarity.RARE,      rewardXp: 150,  rewardGems: 15 },
    { code: 'checkin-streak-30',     title: 'Điểm danh 30 ngày',  description: 'Chuỗi điểm danh 30 ngày liên tiếp.',  icon: 'calendar_month',  rarity: BadgeRarity.EPIC,      rewardXp: 500,  rewardGems: 50 },
    { code: 'checkin-streak-100',    title: 'Điểm danh 100 ngày', description: 'Chuỗi điểm danh 100 ngày liên tiếp.', icon: 'local_fire_department', rarity: BadgeRarity.LEGENDARY, rewardXp: 2000, rewardGems: 200 },
    { code: 'checkin-perfect-month', title: 'Tháng hoàn hảo',     description: 'Điểm danh đủ mọi ngày trong một tháng.', icon: 'auto_awesome', rarity: BadgeRarity.EPIC,   rewardXp: 800,  rewardGems: 80 },
  ];

  async function main() {
    console.log('🚀 Seeding check-in badges…');
    if (!AppDataSource.isInitialized) { await AppDataSource.initialize(); }
    const badgeRepo = AppDataSource.getRepository(Badge);
    for (const b of CHECKIN_BADGES) {
      const existing = await badgeRepo.findOne({ where: { code: b.code } });
      if (!existing) {
        await badgeRepo.save(badgeRepo.create({
          code: b.code, title: b.title, description: b.description, icon: b.icon, rarity: b.rarity,
          criteria: { type: BadgeCriteriaType.STREAK_DAYS, threshold: 999999 },
          rewardXp: b.rewardXp, rewardGems: b.rewardGems, isActive: true,
        }));
        console.log(`  🏅 Badge created: ${b.code}`);
      }
    }
    console.log(`✅ Seeded ${CHECKIN_BADGES.length} check-in badges.`);
    await AppDataSource.destroy();
  }
  main().catch((e) => { console.error(e); process.exit(1); });
  ```

- [ ] **Step: Add the seed script.** In `package.json` add under `scripts` (after `seed:medium`):
  ```json
  "seed:checkin": "tsx --tsconfig tsconfig.base.json apps/api/src/database/seeds/seed-checkin.ts",
  ```

- [ ] **Step: Write the failing all-time milestone tests.** Append to `checkin.service.spec.ts`:
  ```ts
  describe('checkIn — all-time milestone (Task 12)', () => {
    it('fires the streak-7 milestone once (stacking with weekly = 2 spins)', async () => {
      const { service, badges } = makeService({
        state: {
          userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-10',
          totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6,
          freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      badges.awardByCode.mockResolvedValue({ code: 'checkin-streak-7' });
      const res = await service.checkIn('u1', new Date('2026-07-11T03:00:00Z'));
      expect(res.allTimeMilestone).toBe(7);
      expect(res.spinsGranted).toBe(2); // weekly (1) + all-time-7 (1) stack
      expect(badges.awardByCode).toHaveBeenCalledWith('u1', 'checkin-streak-7', expect.any(Date));
      expect(res.badgesEarned).toContain('checkin-streak-7');
    });

    it('does not re-award a milestone after reset+re-climb (highestMilestoneAwarded gate)', async () => {
      const { service, badges } = makeService({
        state: {
          userId: 'u1', currentStreak: 6, longestStreak: 40, lastCheckinDate: '2026-07-10',
          totalCheckins: 40, monthKey: '2026-07', monthlyCheckins: 6,
          freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 7,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      const res = await service.checkIn('u1', new Date('2026-07-11T03:00:00Z')); // streak -> 7 again
      expect(res.allTimeMilestone).toBeNull();
      expect(res.spinsGranted).toBe(1); // weekly only
      expect(badges.awardByCode).not.toHaveBeenCalledWith('u1', 'checkin-streak-7', expect.any(Date));
    });
  });
  ```

- [ ] **Step: Run the tests, expect FAIL.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected failure: `Expected: 7, Received: null` on `res.allTimeMilestone`.

- [ ] **Step: Insert the all-time milestone loop.** In `checkin.service.ts` add `CHECKIN_ALLTIME_MILESTONES`, `CHECKIN_MILESTONE_SHOP_ITEM_AT`, `CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS`, `CHECKIN_BADGE_CODES` to the `./checkin.constants` import, then replace the marker `// --- all-time milestone loop inserted in Task 12 ---` in `checkIn` with:
  ```ts
        // All-time milestone (Phase 2, Task 12) — each M rewards once-ever (spec §4.4).
        const codeByMilestone: Record<number, string> = {
          7: CHECKIN_BADGE_CODES.STREAK_7,
          30: CHECKIN_BADGE_CODES.STREAK_30,
          100: CHECKIN_BADGE_CODES.STREAK_100,
        };
        for (const M of CHECKIN_ALLTIME_MILESTONES) {
          if (state.currentStreak >= M && state.highestMilestoneAwarded < M) {
            state.highestMilestoneAwarded = M;           // gate: blocks reset+re-climb farming
            state.pendingWheelSpins += 1;
            spinsGranted += 1;
            allTimeMilestone = M;
            milestoneCodes.push(codeByMilestone[M]);      // awarded post-commit via awardByCode
            if ((CHECKIN_MILESTONE_SHOP_ITEM_AT as readonly number[]).includes(M)) {
              totalGems += CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS; // gems fallback (spec §6c) — no placeholder item
            }
          }
        }
  ```

- [ ] **Step: Run the tests, expect PASS.** Command: `npx nx test api --testPathPattern=checkin.service.spec`.

- [ ] **Step: Commit.**
  ```bash
  git add apps/api/src/modules/quests/badges.service.ts apps/api/src/modules/quests/badges.service.spec.ts apps/api/src/database/seeds/seed-checkin.ts package.json apps/api/src/modules/checkin/checkin.constants.ts apps/api/src/modules/checkin/checkin.service.ts apps/api/src/modules/checkin/checkin.service.spec.ts
  git commit -m "feat(checkin): awardByCode + seeded badges + all-time milestone with once-ever gate"
  ```

---

### Task 13: Leaderboard (`GET /checkin/leaderboard`)

Manual QueryBuilder `leftJoin` onto `User` (no ManyToOne relation on `CheckinState`), composing `displayName`, plus the leaderboard UI.

**Files:**
- Modify: `apps/api/src/modules/checkin/checkin.service.ts` (`getLeaderboard`)
- Modify: `apps/api/src/modules/checkin/checkin.controller.ts` (route)
- Modify: `apps/web/src/app/api/checkin.queries.ts` + `apps/web/src/app/pages/student/CheckinPage.tsx`
- Test: `apps/api/src/modules/checkin/checkin.service.spec.ts`

**Interfaces:**
- Consumes: `User` (`../users/user.entity`); `this.stateRepo.createQueryBuilder`; `ICheckinLeaderboardRow` (`@cp/shared`).
- Produces: `CheckinService.getLeaderboard(limit?: number): Promise<ICheckinLeaderboardRow[]>`; frontend `useCheckinLeaderboard(limit?: number)`.

**Steps:**

- [ ] **Step: Write the failing leaderboard test.** Append to `checkin.service.spec.ts`:
  ```ts
  describe('getLeaderboard (Task 13)', () => {
    it('joins User, composes displayName, and assigns ranks', async () => {
      const { service, stateRepo } = makeService({});
      const qb: any = {
        leftJoin: jest.fn(() => qb), select: jest.fn(() => qb), addSelect: jest.fn(() => qb),
        orderBy: jest.fn(() => qb), addOrderBy: jest.fn(() => qb), limit: jest.fn(() => qb),
        getRawMany: jest.fn().mockResolvedValue([
          { userId: 'u1', currentStreak: '12', longestStreak: '20', totalCheckins: '40', firstName: 'An', lastName: 'Nguyen', avatarUrl: null },
          { userId: 'u2', currentStreak: '9',  longestStreak: '9',  totalCheckins: '15', firstName: 'Bao', lastName: '',      avatarUrl: 'x.png' },
        ]),
      };
      stateRepo.createQueryBuilder = jest.fn(() => qb);
      const rows = await service.getLeaderboard(20);
      expect(rows[0]).toEqual({ userId: 'u1', displayName: 'An Nguyen', avatarUrl: null, currentStreak: 12, longestStreak: 20, totalCheckins: 40, rank: 1 });
      expect(rows[1].displayName).toBe('Bao');
      expect(rows[1].rank).toBe(2);
    });
  });
  ```

- [ ] **Step: Run the test, expect FAIL.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected failure: `TypeError: service.getLeaderboard is not a function`.

- [ ] **Step: Add `getLeaderboard`.** In `checkin.service.ts` add `import { User } from '../users/user.entity';` and the method. **The join ON-condition uses raw column names** (`u.id = s.user_id`, spec §3.2) — TypeORM does **not** property-resolve raw ON-condition strings (repo convention: `attendance.service.ts:63` uses `'ts.student_id = sp.id'`), so an entity-property name like `s.userId` would emit SQL referencing a non-existent `"s"."userId"` column and 500 at runtime:
  ```ts
  async getLeaderboard(limit = 20): Promise<ICheckinLeaderboardRow[]> {
    const capped = Math.min(100, Math.max(1, limit));
    const rows = await this.stateRepo
      .createQueryBuilder('s')
      .leftJoin(User, 'u', 'u.id = s.user_id') // raw ON: snake_case columns, not entity props (spec §3.2)
      .select('s.user_id', 'userId')
      .addSelect('s.current_streak', 'currentStreak')
      .addSelect('s.longest_streak', 'longestStreak')
      .addSelect('s.total_checkins', 'totalCheckins')
      .addSelect('u.first_name', 'firstName')
      .addSelect('u.last_name', 'lastName')
      .addSelect('u.avatar_url', 'avatarUrl')
      .orderBy('s.current_streak', 'DESC')
      .addOrderBy('s.total_checkins', 'DESC')
      .limit(capped)
      .getRawMany<{
        userId: string; currentStreak: string; longestStreak: string; totalCheckins: string;
        firstName: string | null; lastName: string | null; avatarUrl: string | null;
      }>();

    return rows.map((r, i) => ({
      userId: r.userId,
      displayName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(), // spec §6d, mirrors leaderboard.service.ts:141
      avatarUrl: r.avatarUrl ?? null,
      currentStreak: Number(r.currentStreak),
      longestStreak: Number(r.longestStreak),
      totalCheckins: Number(r.totalCheckins),
      rank: i + 1,
    }));
  }
  ```

- [ ] **Step: Run the test, expect PASS.** Command: `npx nx test api --testPathPattern=checkin.service.spec`.

- [ ] **Step: Add the controller route.** In `checkin.controller.ts` add `Get`, `Query` to the `@nestjs/common` import and:
  ```ts
  @Get('leaderboard')
  async leaderboard(@Query('limit') limit?: string) {
    return this.service.getLeaderboard(limit ? Number(limit) : 20);
  }
  ```

- [ ] **Step: Add the `useCheckinLeaderboard` hook.** In `apps/web/src/app/api/checkin.queries.ts`:
  ```ts
  export function useCheckinLeaderboard(limit = 20) {
    return useQuery({
      queryKey: checkinQueryKeys.leaderboard(limit),
      queryFn: () => checkinApi.leaderboard(limit).then((r) => r.data),
      staleTime: queryStaleTime.dashboard,
    });
  }
  ```

- [ ] **Step: Wire the leaderboard panel into `CheckinPage.tsx`** (out-of-band, presentational, no unit test). Add `import { useCheckinLeaderboard } from '../../api/checkin.queries';`, declare `const leaderboard = useCheckinLeaderboard();`, then:
  ```tsx
  <section className="checkin-leaderboard">
    <h3>{t('checkin.leaderboard.title')}</h3>
    <ol className="checkin-leaderboard__list">
      {(leaderboard.data ?? []).map((row) => (
        <li key={row.userId} className="checkin-leaderboard__row">
          <span className="rank">#{row.rank}</span>
          {row.avatarUrl
            ? <img className="avatar" src={row.avatarUrl} alt="" />
            : <span className="avatar avatar--fallback" aria-hidden />}
          <span className="name">{row.displayName}</span>
          <span className="streak">🔥 {row.currentStreak}</span>
        </li>
      ))}
    </ol>
  </section>
  ```

- [ ] **Step: Commit.**
  ```bash
  git add apps/api/src/modules/checkin apps/web/src/app/api/checkin.queries.ts apps/web/src/app/pages/student/CheckinPage.tsx
  git commit -m "feat(checkin): streak leaderboard endpoint + UI"
  ```

---

### Task 14: Perfect-month reward (repeatable money, once-ever badge)

Perfect-month detection by a real per-transaction `COUNT` (spec §4.3) in the same transaction as the fill, wired into **both** `checkIn` and `makeup`: repeatable gems/xp/spin every perfect month, badge granted once-ever via `awardByCode`.

> The milestone shop-item-at-30/100 gems fallback (`CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS`) is already implemented in the Task-12 all-time milestone loop (single source of truth). The optional real-item path (a new `ShopService` grant-by-code + a verified item code) is **not** shipped: `ShopService.purchase` is the only grant path and it *debits* gems (`apps/api/src/modules/shop/shop.service.ts:227`), so there is no free grant-by-code to reuse.

> **Correctness note (COUNT):** spec §4.3 mandates `COUNT(DISTINCT day_key)`. `applyPerfectMonth` below uses `dailyRepo.count({ where: { userId, monthKey } })` (a `COUNT(*)`), which the spec's own testing strategy (§11) explicitly permits (`dailyRepo.count`/query). This is **exact** only because `UQ_daily_checkin_user_day` guarantees at most one row per `(userId, dayKey)`, so `COUNT(*) == COUNT(DISTINCT day_key)`. This correctness is **load-bearing on that constraint** (see Global Constraints) — confirm Phase 1 actually created `UQ_daily_checkin_user_day` on the live DB before shipping this task; if the constraint is ever absent, switch `applyPerfectMonth` to an explicit `SELECT COUNT(DISTINCT day_key) …` raw query.

**Files:**
- Modify: `apps/api/src/modules/checkin/checkin.constants.ts` (perfect-month constants)
- Modify: `apps/api/src/modules/checkin/checkin.service.ts` (`applyPerfectMonth` helper; wire into `checkIn` + `makeup`)
- Test: `apps/api/src/modules/checkin/checkin.service.spec.ts`

**Interfaces:**
- Consumes: `dailyRepo.count`; `applyXpGain`, `advanceLevel`; `CHECKIN_BADGE_CODES` (Task 12).
- Produces: `CheckinService.applyPerfectMonth(dailyRepo, userId, monthNow, state): Promise<{ perfect; gems; xp; spins; code: string | null }>`; constants `CHECKIN_PERFECT_MONTH_GEMS/XP/SPINS`; `checkIn`/`makeup` return real `perfectMonth`.

**Steps:**

- [ ] **Step: Add perfect-month constants.** Append to `checkin.constants.ts`:
  ```ts
  // ── Phase 2: perfect month (spec §5/§10) ─────────────────────────────────────
  export const CHECKIN_PERFECT_MONTH_GEMS = 200;
  export const CHECKIN_PERFECT_MONTH_XP = 500;
  export const CHECKIN_PERFECT_MONTH_SPINS = 1;
  ```

- [ ] **Step: Write the failing perfect-month tests.** Append to `checkin.service.spec.ts`:
  ```ts
  describe('perfect month (Task 14)', () => {
    it('checkIn grants the repeatable perfect-month reward when the fill completes the month', async () => {
      const { service, badges, dailyRepo } = makeService({
        state: {
          userId: 'u1', currentStreak: 30, longestStreak: 30, lastCheckinDate: '2026-07-30',
          totalCheckins: 30, monthKey: '2026-07', monthlyCheckins: 30,
          freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 100,
        },
        profile: { userId: 'u1', gems: 0, xp: 0, level: 1 },
      });
      dailyRepo.count.mockResolvedValue(31); // July has 31 days; this fill makes it complete
      badges.awardByCode.mockResolvedValue({ code: 'checkin-perfect-month' });
      const res = await service.checkIn('u1', new Date('2026-07-31T03:00:00Z')); // today = 2026-07-31
      expect(res.perfectMonth).toBe(true);
      // streak 31: base 5 + bonus min(20,60)=20 + perfect 200 = 225 (no weekly: 31 % 7 !== 0)
      expect(res.reward.gems).toBeGreaterThanOrEqual(200 + 5);
      expect(res.reward.xp).toBeGreaterThanOrEqual(500);
      expect(res.spinsGranted).toBeGreaterThanOrEqual(1);
      expect(badges.awardByCode).toHaveBeenCalledWith('u1', 'checkin-perfect-month', expect.any(Date));
    });

    it('makeup that completes the month grants perfect-month money even if the badge is already owned', async () => {
      const { service, tx, dailyRepo, badges } = makeService({
        state: {
          userId: 'u1', currentStreak: 5, longestStreak: 5, lastCheckinDate: '2026-07-30',
          totalCheckins: 5, monthKey: '2026-07', monthlyCheckins: 30,
          freezeTokens: 0, pendingWheelSpins: 0, makeupUsedThisMonth: 0, highestMilestoneAwarded: 0,
        },
        profile: { userId: 'u1', gems: 100, xp: 0, level: 1 },
      });
      tx.query
        .mockResolvedValueOnce([{ id: 'p1' }])  // gem debit ok
        .mockResolvedValueOnce([{ id: 's1' }]); // quota bump ok
      dailyRepo.count.mockResolvedValue(31);    // this makeup fill completes the month
      badges.awardByCode.mockResolvedValue(null); // badge already owned -> repeatable money still applies
      const res = await service.makeup('u1', '2026-07-15', new Date('2026-07-31T03:00:00Z'));
      expect(res.perfectMonth).toBe(true);
      expect(res.reward.gems).toBe(200); // perfect-month money (the makeup day itself gives 0)
      expect(res.reward.xp).toBe(500);
    });
  });
  ```

- [ ] **Step: Run the tests, expect FAIL.** Command: `npx nx test api --testPathPattern=checkin.service.spec`. Expected failure: `Expected: true, Received: false` on `res.perfectMonth`.

- [ ] **Step: Add `applyPerfectMonth` and wire it in.** In `checkin.service.ts` add `CHECKIN_PERFECT_MONTH_GEMS`, `CHECKIN_PERFECT_MONTH_XP`, `CHECKIN_PERFECT_MONTH_SPINS` to the `./checkin.constants` import, add the helper, and replace both `// --- perfect-month evaluation inserted in Task 14 ---` markers.

  Helper:
  ```ts
  /**
   * Evaluate perfect month by a real COUNT (spec §4.3/§10) — never trust the
   * display counter. UQ_daily_checkin_user_day makes row-count == distinct-day
   * count, so it fires exactly once, on the fill that completes the month.
   * Money is repeatable each perfect month; the badge (returned code) is once-ever.
   */
  private async applyPerfectMonth(
    dailyRepo: Repository<DailyCheckin>, userId: string, monthNow: string, state: CheckinState,
  ): Promise<{ perfect: boolean; gems: number; xp: number; spins: number; code: string | null }> {
    const [y, mo] = monthNow.split('-').map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();
    const filled = await dailyRepo.count({ where: { userId, monthKey: monthNow } });
    if (filled !== daysInMonth) return { perfect: false, gems: 0, xp: 0, spins: 0, code: null };
    state.pendingWheelSpins += CHECKIN_PERFECT_MONTH_SPINS;
    return {
      perfect: true, gems: CHECKIN_PERFECT_MONTH_GEMS, xp: CHECKIN_PERFECT_MONTH_XP,
      spins: CHECKIN_PERFECT_MONTH_SPINS, code: CHECKIN_BADGE_CODES.PERFECT_MONTH,
    };
  }
  ```

  In `checkIn`, replace `// --- perfect-month evaluation inserted in Task 14 ---` (it sits after the `dailyRepo.save(...)` and before the profile save) with:
  ```ts
        const pm = await this.applyPerfectMonth(dailyRepo, userId, monthNow, state);
        if (pm.perfect) {
          perfectMonth = true;
          totalGems += pm.gems;
          totalXp += pm.xp;
          spinsGranted += pm.spins;
          milestoneCodes.push(pm.code as string); // badge granted once-ever post-commit
        }
  ```

  In `makeup`, replace the tail of the transaction — the marker `// --- perfect-month evaluation inserted in Task 14 ---` **together with the Task-10 trailing `const state = …; const status = …; return {…}` block that followed it** — with the block below (it supersedes that trailing block, computing `leveledUp`/`newLevel` so the post-commit `if (out.leveledUp)` publish in `makeup` fires when a perfect month advances the level):
  ```ts
        const state = (await stateRepo.findOne({ where: { userId } })) as CheckinState;
        const pm = await this.applyPerfectMonth(dailyRepo, userId, monthNow, state);
        let pmGems = 0;
        let pmXp = 0;
        let leveledUp = false;
        let newLevel = 0;
        if (pm.perfect) {
          pmGems = pm.gems;
          pmXp = pm.xp;
          const profRepo = tx.getRepository(StudentProfile);
          const profile = await profRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } });
          const prevLevel = profile?.level ?? 0;
          if (profile) {
            applyXpGain(profile, pmXp, now);
            profile.gems += pmGems;
            advanceLevel(profile);
            await profRepo.save(profile);
          }
          leveledUp = !!profile && profile.level > prevLevel;
          newLevel = profile?.level ?? prevLevel;
          await stateRepo.save(state); // persist the +1 pending spin
        }
        const status = await this.buildStatus(userId, now, dailyRepo, state);
        return {
          status, reward: { gems: pmGems, xp: pmXp }, weeklyMilestone: false, allTimeMilestone: null,
          perfectMonth: pm.perfect, milestoneCodes: pm.perfect ? [pm.code as string] : [], spinsGranted: pm.spins,
          leveledUp, newLevel,
        };
  ```
  > `makeup`'s day reward stays `{0,0}` when the month is not completed; when it is, the reward reflects the repeatable perfect-month money (spec §6b/§10). The `level:up` gateway event on this path is published post-commit by the `if (out.leveledUp)` guard already added to `makeup` in Task 10, exactly as `checkIn`/`spin` do.

- [ ] **Step: Run the tests, expect PASS.** Command: `npx nx test api --testPathPattern=checkin.service.spec`.

- [ ] **Step: Full suite + web sanity.** Commands: `npx nx test api --testPathPattern=checkin.service.spec` and `npx nx test api --testPathPattern=badges.service.spec` and `npx vitest run apps/web/src/app/lib/checkin-board.spec.ts` — all green.

- [ ] **Step: Commit.**
  ```bash
  git add apps/api/src/modules/checkin/checkin.constants.ts apps/api/src/modules/checkin/checkin.service.ts apps/api/src/modules/checkin/checkin.service.spec.ts
  git commit -m "feat(checkin): perfect-month reward (repeatable money, once-ever badge) via real COUNT"
  ```

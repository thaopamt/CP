# Student Quest Cadence and Catalog Expansion Design

## Context

Student quests currently support three recurrence modes: `NONE`, `DAILY`, and `WEEKLY`.
Daily quests are seeded from `apps/api/src/database/seeds/seed-quests.ts`, and progress is advanced by the backend quest engine in `apps/api/src/modules/quests/quests.service.ts`.

Coding submissions and maze submissions already capture whether the student had solved the same assignment or maze level before. They pass `alreadySolved` into the quest engine, and the engine skips quest progress and lifetime counters when that flag is true.

## Goals

- Add more daily missions so students see a richer set of daily objectives.
- Include harder daily missions without making all daily progress depend on hard tasks.
- Reduce repeated-feeling missions by varying objective type, difficulty, topic tag, point target, and maze target.
- Let bounty and event missions reset every two weeks on the same global schedule for all students.
- Preserve the rule that re-solving an already-completed coding assignment or maze level never advances quests, profile counters, or rewards.

## Non-Goals

- No per-student rolling two-week cycle.
- No cron job for resetting quests.
- No frontend redesign of the quests page beyond labels needed for the new recurrence.
- No new quest objective type unless existing objective types cannot express the needed catalog.

## Recommended Approach

Add a new recurrence value, `BIWEEKLY`, shared across API and web.

The backend will derive a global two-week `periodKey` for any `BIWEEKLY` quest. The key will be stable for every student and will roll over at the same time system-wide. This follows the existing lazy-reset model: when a student opens quests or submits progress in a new period, `ensureQuestsAssigned()` creates a fresh `student_quests` row for the new period and expires old recurring rows.

## Period Key Rules

- `DAILY`: keep current `YYYY-MM-DD` UTC key.
- `WEEKLY`: keep current ISO week key, such as `2026-W29`.
- `BIWEEKLY`: use an ISO-week-based two-week key, such as `2026-B15`.
- `NONE`: keep `static`.

`BIWEEKLY` windows are global and UTC-aligned, matching the existing daily and weekly quest behavior. The key uses the ISO week-year and pairs weeks as `1-2 => B01`, `3-4 => B02`, and so on, so ISO weeks `29-30` produce `B15`. A new ISO week-year starts a new `B01` cycle. The implementation should centralize the key calculation in reusable period-key helpers so tests can lock the rollover behavior.

## Quest Catalog Changes

Daily quest seed expansion should add a balanced mix:

- More coding volume missions, such as solving 4 or 6 coding assignments in a day.
- Harder difficulty missions, such as solving 2 HARD problems.
- Topic missions using `SOLVE_BY_TAG`, such as arrays, strings, math, graphs, or dynamic programming.
- Maze missions with higher daily targets, such as clearing 2 maze levels.
- Point missions with higher point targets.

Bounty and event seeds should move suitable missions to `BIWEEKLY` recurrence. These should be bigger than daily missions but smaller and more repeatable than permanent main-story goals. Existing one-time long-tail bounty achievements can stay `NONE` when they represent lifetime milestones.

The seed remains idempotent by title. Existing rows should be updated when seeded again so recurrence, targets, rewards, dates, and active state reflect the current catalog.

## Existing Completed-Item Rule

The completed-item rule remains backend-authoritative:

- `SubmissionsController` checks `StudentAssignmentProgressService.hasCompleted()` before recording the new accepted result.
- `MazeService` checks for an earlier successful maze submission before saving the current successful submission.
- `QuestsService.applyEvent()` returns no progress when `event.alreadySolved` is true.
- `QuestsService.updateProfileCounters()` also skips streak and lifetime counters when `event.alreadySolved` is true.

Tests should cover this path directly so later catalog expansion cannot accidentally allow repeated solves to count.

## UI Changes

Admin quest form and quest list should display the new recurrence label:

- English: `Every 2 weeks`
- Vietnamese: `Mỗi 2 tuần`

Student quest cards and detail drawer should display:

- English: `Resets every 2 weeks`
- Vietnamese: `Làm mới mỗi 2 tuần`

No layout redesign is required.

## Testing

Tests should be added before implementation for:

- `BIWEEKLY` period-key calculation and rollover.
- `ensureQuestsAssigned()` creating a new period row for `BIWEEKLY` quests while expiring old recurring rows.
- Quest progress not advancing when a coding event has `alreadySolved: true`.
- Quest progress not advancing when a maze event has `alreadySolved: true`.
- Seed catalog sanity where selected bounty/event quests use `BIWEEKLY` and new daily titles exist.

Verification should include targeted API/shared tests first, then builds or type-checks for touched projects.

## Risks

- PostgreSQL enum migrations must be handled explicitly for the `quests.recurrence` enum.
- Existing event quests seeded with date windows may not update unless the seed updates existing rows, not only creates missing rows.
- If `BIWEEKLY` stale-row logic only compares against daily and weekly keys, old two-week attempts could remain visible. Stale handling must compare against each quest's own active period key.

## Acceptance Criteria

- Daily catalog contains more varied daily missions than the current seed.
- Bounty/event missions that should reset every two weeks use `QuestRecurrence.BIWEEKLY`.
- All students share the same two-week reset period.
- Re-solving an already-completed coding assignment or maze level does not advance quest progress, counters, or rewards.
- Admin and student UI render the two-week recurrence label correctly.
- New tests fail before implementation and pass after implementation.

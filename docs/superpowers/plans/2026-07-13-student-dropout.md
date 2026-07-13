# Student Dropout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the logic to properly handle student dropouts ("Nghỉ học" / INACTIVE) by blocking their login, hiding them from future schedules, but retaining their current month's tuition.

**Architecture:** We will sync `User.isActive` with the `StudentProfile.status` when the admin updates it. `FinanceService` will filter out inactive students for reports strictly *after* the month they dropped out (using `profile.updatedAt` as a proxy).

**Tech Stack:** NestJS, Jest, TypeORM.

## Global Constraints
- Do not modify existing admin gamification logic or data wiping features.
- Write a test for every new behavior.

---

### Task 1: Automatically Manage User.isActive based on Profile Status

**Files:**
- Modify: `apps/api/src/modules/students/students.service.ts`
- Modify: `apps/api/src/modules/students/students.service.spec.ts`

**Interfaces:**
- Consumes: `UpdateStudentDto.status` to determine whether to deactivate or activate the `User` record.
- Produces: Updated `User` records in the database with `isActive: false` and `refreshTokenHash: null` when status is set to `INACTIVE`.

- [ ] **Step 1: Write the failing test**

```typescript
// Add to `students.service.spec.ts` inside `describe('updateStudent')` (create the describe block if missing):
  it('updates user.isActive to false and clears refreshTokenHash when status changes to INACTIVE', async () => {
    const ctx = makeService(
      { id: 'profile-1', userId: 'user-1', status: EnrollmentStatus.ACTIVE },
      { id: 'user-1', isActive: true }
    );
    // Mock the profile findOne
    ctx.profileRepository.findOne = jest.fn()
      .mockResolvedValueOnce({ id: 'profile-1', userId: 'user-1', status: EnrollmentStatus.ACTIVE })
      .mockResolvedValueOnce({ id: 'profile-1', userId: 'user-1', status: EnrollmentStatus.INACTIVE, user: {}, guardians: [] });

    await ctx.service.updateStudent('profile-1', { status: EnrollmentStatus.INACTIVE });

    expect(ctx.usersRepository.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.objectContaining({ isActive: false, refreshTokenHash: null })
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:api -- apps/api/src/modules/students/students.service.spec.ts`
Expected: FAIL due to missing logic syncing `isActive` in `updateStudent`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// In `apps/api/src/modules/students/students.service.ts`, inside `updateStudent`:
// Add inside the transaction `if (dto.status !== undefined)` check:
      if (dto.status !== undefined) {
        profilePatch.status = dto.status;
        if (dto.status === EnrollmentStatus.INACTIVE || dto.status === EnrollmentStatus.GRADUATED) {
           await userRepo.update({ id: profile.userId }, { isActive: false, refreshTokenHash: null });
        } else if (dto.status === EnrollmentStatus.ACTIVE || dto.status === EnrollmentStatus.PENDING) {
           await userRepo.update({ id: profile.userId }, { isActive: true });
        }
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:api -- apps/api/src/modules/students/students.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/students/students.service.ts apps/api/src/modules/students/students.service.spec.ts
git commit -m "feat(students): auto-deactivate user account when enrollment status is inactive"
```

---

### Task 2: Filter Inactive Students in Future Finance Reports

**Files:**
- Modify: `apps/api/src/modules/finance/finance.service.ts`
- Modify: `apps/api/src/modules/finance/finance.service.spec.ts`

**Interfaces:**
- Consumes: `StudentProfile` data loaded in `FinanceService.computeMonthlyReport`.
- Produces: Corrected monthly reporting logic that stops calculating tuition for inactive students the month *after* they become inactive.

- [ ] **Step 1: Write the failing test**

```typescript
// Add to `finance.service.spec.ts` inside `describe('FinanceService')`:
  it('excludes INACTIVE students starting from the month after their updatedAt timestamp', async () => {
    // Create an inactive profile that was updated (dropped out) in 2026-06
    const p1 = profile('p1', 's1', 600_000);
    p1.status = EnrollmentStatus.INACTIVE;
    p1.updatedAt = new Date('2026-06-15T00:00:00.000Z');

    const service = serviceWith({
      profiles: [p1],
      schedules: [schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', null)]
    });

    // They should appear in the month they dropped out (June 2026)
    const reportJune = await service.getMonthlyReport({ month: '2026-06' });
    expect(reportJune.rows.map(r => r.studentId)).toEqual(['s1']);

    // They should NOT appear in the next month (July 2026)
    const reportJuly = await service.getMonthlyReport({ month: '2026-07' });
    expect(reportJuly.rows.map(r => r.studentId)).toEqual([]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:api -- apps/api/src/modules/finance/finance.service.spec.ts`
Expected: FAIL because INACTIVE students are currently included forever.

- [ ] **Step 3: Write minimal implementation**

```typescript
// In `apps/api/src/modules/finance/finance.service.ts`, inside `computeMonthlyReport`:
// Locate `const profiles = allProfiles.filter((profile) => { ... })`
// Update it to:
    const profiles = allProfiles.filter((profile) => {
      if (visibleSet && !visibleSet.has(profile.userId)) return false;
      if (!this.hasStartedByMonthEnd(profile, to)) return false;
      
      if (profile.status === EnrollmentStatus.INACTIVE || profile.status === EnrollmentStatus.GRADUATED) {
        if (profile.updatedAt) {
           const inactiveMonthStr = profile.updatedAt.toISOString().slice(0, 7);
           if (month > inactiveMonthStr) return false;
        }
      }
      return true;
    });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:api -- apps/api/src/modules/finance/finance.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/finance/finance.service.ts apps/api/src/modules/finance/finance.service.spec.ts
git commit -m "feat(finance): exclude inactive students from finance reports starting the month after dropout"
```

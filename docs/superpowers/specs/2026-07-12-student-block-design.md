# Design: Student Block + Learning Reset

**Ngay:** 2026-07-12
**Trang thai:** Approved design
**Pham vi:** Student accounts only. Admin/teacher accounts are out of scope.

---

## 1. Overview

Tinh nang nay cho phep admin block mot hoc sinh. Khi hoc sinh bi block, hoc sinh khong duoc truy cap web bang tai khoan do nua, refresh token bi revoke, access token cu bi chan o tang API, va du lieu hoc tap/gamification bi reset mot chieu. Thong tin ca nhan, hoc phi, lop hoc, lich hoc, diem danh va finance records duoc giu nguyen.

Unblock chi mo lai quyen dang nhap/truy cap. Du lieu hoc tap da reset khong duoc khoi phuc; hoc sinh bat dau hoc lai tu trang thai reset.

## 2. Goals

- Admin co action rieng `Block student` tren trang student profile.
- Block student thuc hien atomically: deactivate user, revoke refresh token, reset learning data.
- Student blocked khong tiep tuc dung duoc session cu.
- Local workspace drafts (`code-draft-workspace-*`) co TTL 48 gio.
- Khi block/reset, moi draft workspace cu bi xoa khoi `localStorage`.
- Existing reset boundary duoc giu: chi xoa learning/gamification data, khong xoa profile/admin/tuition/schedule/attendance/finance data.

## 3. Non-goals

- Khong ap dung cho admin hoac teacher accounts.
- Khong xoa `users`, `student_profiles`, `guardians`, class enrollment, schedule, attendance, monthly tuition, or finance monthly due/status records.
- Khong restore learning data khi unblock.
- Khong them audit log rieng trong phase nay.
- Khong migrate drafts len server-side storage.

## 4. Existing Context

Repo da co nhung phan co the reuse:

- `users.is_active` trong `apps/api/src/modules/users/user.entity.ts`.
- Login/refresh da reject inactive user trong `apps/api/src/modules/auth/auth.service.ts`.
- `StudentsService.resetLearningData(studentId)` da xoa submissions/progress/quest/badge/shop/maze va reset XP/gems/level/streak/cosmetic.
- `student_profiles.learning_reset_at` da duoc expose ve dashboard de frontend xoa stale workspace drafts.
- `apps/web/src/app/lib/learning-reset-storage.ts` da xoa key `code-draft-workspace-*` theo reset marker.

Khoang trong hien tai:

- Access token cu van co the dung tren cac route chi validate JWT payload neu account vua bi inactive.
- Admin student profile chua expose `user.isActive`/blocked status.
- Workspace draft chua co timestamp/TTL.

## 5. Backend Design

### 5.1 Student APIs

Them hai endpoint admin-only vao `StudentsController`:

- `POST /students/:id/block`
- `POST /students/:id/unblock`

`id` la `StudentProfile.id`, giong endpoint `reset-learning-data` hien tai.

Response cua `block` reuse shape reset hien tai va them trang thai account:

```ts
interface BlockStudentResult extends ResetStudentLearningDataResult {
  blockedAt: string;
  isActive: false;
  alreadyBlocked: boolean;
}
```

Response cua `unblock`:

```ts
interface UnblockStudentResult {
  studentId: string;
  userId: string;
  unblockedAt: string;
  isActive: true;
}
```

### 5.2 Block Transaction

`StudentsService.blockStudent(studentId)` chay trong mot transaction:

1. Load `StudentProfile` by profile id.
2. Lay `profile.userId`.
3. Load the related `User`.
4. Capture `alreadyBlocked = user.isActive === false`.
5. Update `users`:
   - `isActive = false`
   - `refreshTokenHash = null`
6. Reset learning data bang cung boundary cua `resetLearningData`.
7. Set `learningResetAt = blockedAt`.
8. Return deletion counters, `alreadyBlocked`, and timestamps.

Block always runs the reset boundary, even if the user was already inactive. This guarantees that a student deactivated through another path still loses learning data when the explicit `Block student` action is used. Repeated block calls after the first one are safe: the second call normally deletes `0` learning rows because the data is already gone, and the UI disables the button while the first request is pending.

De tranh nested transaction, implementation se tach logic xoa learning data thanh helper noi bo nhan `EntityManager`, vi du:

```ts
private async resetLearningDataInTransaction(
  tx: EntityManager,
  studentId: string,
  resetAt: Date,
): Promise<ResetStudentLearningDataResult>
```

`resetLearningData` hien tai goi helper nay trong transaction rieng. `blockStudent` goi cung helper trong transaction block.

### 5.3 Data Deleted vs Preserved

Deleted/reset on block:

- `student_assignment_progress` for `profile.userId`
- `submissions` for `profile.userId`
- `student_quests` for `profile.userId`
- `student_badges` for `profile.userId`
- `student_inventory` for `profile.userId`
- `maze_submissions` for `profile.userId`
- `StudentProfile` gamification counters: `level`, `xp`, `weeklyXp`, `monthlyXp`, `gems`, `streak`, solved counters, badge/quest counters
- equipped cosmetics: `equippedTheme`, `nameColor`, `equippedTitle`

Preserved on block:

- `users` identity fields: email, username, first name, last name, avatar
- `student_profiles` personal/enrollment fields: home address, grade, cohort, status, start date
- `monthlyTuition`
- guardians
- class enrollment and class-course enrollment
- schedules
- attendance history
- finance amount due/status records
- teacher assignments

Badge denormalization remains required: decrement `badges.earned_count` from existing `student_badges` before deleting those rows, same as current reset.

### 5.4 Unblock

`StudentsService.unblockStudent(studentId)`:

1. Load profile by id.
2. Set `users.isActive = true`.
3. Keep `refreshTokenHash = null`; student must login again.
4. Do not recreate submissions/progress/badges/shop items/maze submissions.
5. Do not change `learningResetAt`.

### 5.5 Active Account Enforcement

The backend must reject requests from inactive users even when their access token has not expired yet.

Preferred implementation is a shared active-user enforcement path used by every authenticated JWT request, not per-feature checks. Because this repo already routes authenticated HTTP requests through `JwtAuthGuard`, the implementation should centralize active checking there or in the JWT strategy it uses, and return a stable blocked response:

```json
{
  "statusCode": 403,
  "message": "User is blocked",
  "code": "USER_BLOCKED"
}
```

Login and refresh continue to reject inactive users. Block also clears `refreshTokenHash`, so refresh tokens are invalid immediately.

### 5.6 Cache Invalidation

After block/reset:

- bump backend cache tags already used by reset learning:
  - `students:list`
  - `leaderboard:global`
  - `badges:catalog`
  - `maze:progress`
  - `student:${userId}:profile`
  - `student:${userId}:dashboard`
  - `student:${userId}:quests`
  - `student:${userId}:badges`
  - `student:${userId}:shop`
  - `student:${userId}:maze`

After unblock:

- bump `students:list`
- bump `student:${userId}:profile`
- bump `student:${userId}:dashboard`

## 6. Frontend/Admin UX

### 6.1 Shared Types and API Adapter

Expose active status through student profile data:

- Add `isActive: boolean` to `IStudentProfile`.
- Include `isActive` in `ApiUser` and `toStudent` in `apps/web/src/app/api/students.api.ts`.

Add API methods:

- `studentsApi.block(id)`
- `studentsApi.unblock(id)`

Add React Query mutations:

- `useBlockStudent(id)`
- `useUnblockStudent(id)`

Both mutations invalidate:

- `['students']`
- `studentQueryKeys.detail(id)`
- `studentQueryKeys.byUserId(userId)`
- student dashboard/submission/quest/badge/shop/maze caches when block returns reset counters

### 6.2 Student Profile Page

On `apps/web/src/app/pages/admin/students/StudentProfilePage.tsx`:

- Show account badge next to enrollment status:
  - `Active`
  - `Blocked`
- For admins only (`base === '/admin'`):
  - if `s.isActive === true`, show danger button `Block student`
  - if `s.isActive === false`, show button `Unblock student`

Block confirm copy must state:

- student cannot access the website
- submissions, assignment progress, quests, badges, shop inventory, maze submissions, XP/gems/level/streak/cosmetics will be reset
- personal info, tuition, classes, schedule, attendance, and finance data stay intact
- this cannot be undone by unblock

Unblock confirm copy must state:

- access is restored
- reset learning data is not restored
- student starts from the reset state and must login again

### 6.3 Blocked Student Session Handling

When frontend receives `USER_BLOCKED` or inactive-user response from an authenticated API call:

1. Remove workspace drafts (`code-draft-workspace-*`) from `localStorage`.
2. Clear auth store (`accessToken`, `refreshToken`, `user`).
3. Redirect to login.
4. Show a short message that the account is blocked.

This handling must not delete unrelated localStorage values such as theme, locale, or default language. Auth store clearing handles only auth persistence.

## 7. Workspace Draft TTL

### 7.1 Storage Format

Workspace drafts keep the same key format:

```ts
const draftKey = `code-draft-workspace-${problemId ?? 'new'}`;
```

New value shape:

```ts
type WorkspaceDraft = {
  language: string;
  code: string;
  savedAt: string;
};
```

`savedAt` is ISO string written every time auto-save writes the draft.

### 7.2 48 Hour Expiration

Constant:

```ts
const WORKSPACE_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;
```

When reading a draft:

- if draft is missing, use default template
- if JSON is invalid, remove it and use default template
- if `savedAt` exists and `Date.now() - Date.parse(savedAt) > WORKSPACE_DRAFT_TTL_MS`, remove it and use default template
- if `savedAt` is missing but `code` and `language` are valid legacy fields, allow one compatibility read; the next auto-save writes `savedAt`

When reset/block cleanup runs:

- remove all keys starting with `code-draft-workspace-`
- write `learning-reset-applied-${userId}` marker with the latest `learningResetAt`

### 7.3 Helper Boundary

Extend the existing helper rather than scattering localStorage logic in pages:

- keep `applyLearningResetStorageCleanup`
- add `removeWorkspaceDrafts(storage): string[]`
- add `readWorkspaceDraft(storage, key, now)` or a similarly small pure helper
- add `writeWorkspaceDraft(storage, key, draft, now)`

`WorkspacePage` should use these helpers for read/write/cleanup.

## 8. Error Handling

- Blocking a missing student returns `404`.
- Blocking an already blocked student is safe: it still enforces the reset boundary, normally returns deletion counters as `0`, and reports `alreadyBlocked: true`.
- Unblocking an already active student is idempotent and returns `isActive: true`.
- If block fails mid-transaction, neither account state nor learning data reset should be partially applied.
- If localStorage cleanup throws due to browser storage issues, auth clear and redirect still proceed.

## 9. Testing

Backend tests:

- `StudentsService.blockStudent` deactivates user, clears refresh token, resets learning data, and preserves profile/tuition/schedule/attendance/finance fields.
- `StudentsService.unblockStudent` activates user and does not restore learning data.
- `StudentsController.blockStudent` and `unblockStudent` are admin-only.
- Active-user enforcement rejects inactive users with response code `USER_BLOCKED`.
- Existing `resetLearningData` tests still pass after extracting transaction helper.

Frontend tests:

- `learning-reset-storage` removes all workspace drafts on reset/block.
- workspace draft read removes expired drafts older than 48 hours.
- workspace draft write stores `savedAt`.
- legacy draft without `savedAt` can be read once and is rewritten with `savedAt` by auto-save.
- auth response handling clears auth and workspace drafts for blocked responses.

Manual verification:

- Admin blocks an active student from student profile.
- Student cannot continue using an already-open session.
- Student draft keys are removed after blocked response.
- Admin unblocks student.
- Student can login again and sees reset learning state.
- Personal info, monthly tuition, class, schedule, attendance, and finance records remain.

## 10. Rollout Notes

No database migration is required for core block because `users.is_active` and `student_profiles.learning_reset_at` already exist.

If implementation discovers any learning table that references `student_profiles.id` instead of `profile.userId`, reset logic must verify that table before deleting. Current validated reset boundary uses `profile.userId` for submissions/progress/quests/badges/shop/maze.

Keep block/unblock student-specific in the UI and API naming. Generic user deactivation for teachers/admins remains a separate account-management concern.

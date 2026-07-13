# Student Dropout (Nghỉ học) Status Feature Design

## 1. Context & Goal
The admin needs the ability to mark a student as "Nghỉ học" (Dropout / Inactive). When this happens:
1. The student can no longer log into the system.
2. The student immediately disappears from all future class schedules and check-in rosters.
3. The student's tuition data (finance records) for the *current* month remains visible so the center can collect final payments, but they will not appear in the finance reports of *future* months.

## 2. Proposed Approach

### 2.1 Prevent Login & Schedule Visibility (User.isActive)
- When the admin updates a student's profile status to `INACTIVE` (Ngừng học / Nghỉ học), the system will automatically update the underlying `User.isActive` flag to `false`.
- **Login:** The `AuthService` already checks `User.isActive`. By setting this to false and clearing their `refreshTokenHash`, any active sessions will be terminated and future login attempts will be rejected.
- **Schedules:** The `AttendanceService` already filters schedules by checking `student: { isActive: true }`. By marking the user as inactive, they will instantly disappear from all teacher check-in views and schedule rosters.

### 2.2 Finance Visibility
- The `FinanceService` dynamically calculates tuition for each month. To allow the student to remain in the current month's report but disappear in future months, we will update the student filtering logic in `FinanceService.computeMonthlyReport()`.
- **Logic:** If a student is `INACTIVE` or `GRADUATED`, we will check their `updatedAt` timestamp (which records when their status was changed). If the report's `month` (e.g., `2026-08`) is strictly greater than the month they dropped out (e.g., `2026-07`), they will be excluded from the report. Otherwise, they remain in the report.

## 3. Files to Modify

- `apps/api/src/modules/students/students.service.ts`: Update the `updateStudent` method to sync `dto.status === EnrollmentStatus.INACTIVE` with `User.isActive = false`. Unblock if status changes back to `ACTIVE`.
- `apps/api/src/modules/finance/finance.service.ts`: Update `computeMonthlyReport` to filter out inactive students from future months based on `profile.updatedAt`.

## 4. Open Questions / Clarifications
- We will use the `updatedAt` timestamp of the `StudentProfile` as the proxy for the dropout date. This assumes that once a student drops out, their profile won't be constantly updated in later months. Does this sound reasonable?

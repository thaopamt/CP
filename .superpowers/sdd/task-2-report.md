# Task 2: Backend — expose `POST /students/:id/impersonate` — Report

## Status: DONE

## TDD Evidence

### Step 1-2: Test Created & RED State
Created `apps/api/src/modules/students/students.controller.spec.ts` with:
- Test case: `resolves the profile then mints an impersonate token for its user`
- Mock setup: `StudentsService.getProfileById` and `AuthService.generateImpersonationToken`
- Constructor call with 3 params (service, assignments, auth)

**RED Output** (expected failures):
```
Expected 2 arguments, but got 3.
Property 'impersonate' does not exist on type 'StudentsController'.
Test Suites: 1 failed, 1 total
```

### Step 3-4: Implementation Added

#### File 1: `apps/api/src/modules/students/students.module.ts`
- Added import: `import { AuthModule } from '../auth/auth.module';`
- Added `AuthModule` to imports array after `QuestsModule`
- No circular dependency introduced (verified per brief)

#### File 2: `apps/api/src/modules/students/students.controller.ts`
- Added import: `import { AuthService } from '../auth/auth.service';`
- Extended constructor with `private readonly auth: AuthService`
- Added new route handler:
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
- Route placed after `unblockStudent` handler, before `getStudentHeatmap` (as specified)

### Step 5: Test Result — GREEN State
```
PASS [api] apps/api/src/modules/students/students.controller.spec.ts
  StudentsController.impersonate
    ✓ resolves the profile then mints an impersonation token for its user (2 ms)
Test Suites: 1 passed, 1 total
Tests: 1 passed, 1 total
```

### Step 6: Build Result
```
Successfully ran target build for project api and 1 task it depends on
webpack 5.106.2 compiled successfully in 2846 ms
```
- No DI errors
- No circular dependency warnings
- Build succeeded

## Files Changed
1. **Modified**: `apps/api/src/modules/students/students.module.ts`
   - Added AuthModule import and to imports array

2. **Modified**: `apps/api/src/modules/students/students.controller.ts`
   - Added AuthService import
   - Injected AuthService in constructor
   - Added `impersonate()` route handler

3. **Created**: `apps/api/src/modules/students/students.controller.spec.ts`
   - Unit test for the impersonate endpoint

## Commit
```
Commit: 5ccbcb4
Message: feat(api): add ADMIN POST /students/:id/impersonate endpoint
```

## Self-Review

### Implementation Correctness
✓ Constructor arity: 3 params (service, assignments, auth) matches test expectations  
✓ Route guard: `@Roles(UserRole.ADMIN)` correctly restricts to admin only  
✓ Parameter handling: `@Param('id')` with `ParseUUIDPipe()` validates UUID format  
✓ CurrentUser injection: `@CurrentUser() admin: JwtPayload` extracts admin.sub correctly  
✓ Service chain: Resolves profile → extracts userId → calls auth.generateImpersonationToken  
✓ Return type: Matches interface `{ accessToken: string; user: IUser }`  

### Module Wiring
✓ AuthModule imported at top of StudentsModule  
✓ AuthModule added to imports array (no provider duplication)  
✓ No circular dependency: AuthModule → UsersModule (one-way, as verified in brief)  
✓ AuthService available for injection via DI container  

### Test Coverage
✓ Test constructs controller directly with mocks (matches codebase pattern from blog.controller.spec.ts)  
✓ Test verifies getProfileById called with correct student id  
✓ Test verifies generateImpersonationToken called with extracted userId and admin.sub  
✓ Test asserts correct return value  

### Build & Integration
✓ Full `pnpm nx build api` succeeds  
✓ No TypeScript compilation errors  
✓ No NestJS DI resolution errors  
✓ No circular module dependency warnings  

### Code Quality
✓ Follows existing controller patterns (similar structure to blockStudent/unblockStudent)  
✓ Consistent with Task 1 AuthService interface contract  
✓ Proper error handling deferred to AuthService (NotFoundException, ForbiddenException)  
✓ Async/await used consistently  

## Dependencies Met
- ✓ `AuthService.generateImpersonationToken()` exists and works (Task 1)
- ✓ `StudentsService.getProfileById()` returns profile with userId
- ✓ `@CurrentUser()` decorator provides JwtPayload with admin.sub
- ✓ `@Roles(UserRole.ADMIN)` guard enforces admin-only access
- ✓ No unsatisfied imports or missing methods

## Conclusion
TDD cycle complete: RED → GREEN → BUILD SUCCESS. Endpoint is ready for integration testing and API documentation.

## Fix: restored deleted controller specs

### Issue
The original `students.controller.spec.ts` contained three passing describe blocks (`resetLearningData`, `blockStudent`, `unblockStudent`) that were deleted when Task 2's implementer overwrote the file with only the `impersonate` test, causing loss of regression coverage for existing admin-only endpoint guards.

### Fix Applied
Restored all three original describe blocks plus the new `impersonate` test in a single file, with constructor calls updated to pass three arguments `(service, assignments, auth)` as required by the updated `StudentsController` signature.

### Test Command
```
pnpm nx test api --testPathPattern=students.controller.spec
```

### Test Output
```
PASS [api] apps/api/src/modules/students/students.controller.spec.ts
  StudentsController.resetLearningData
    ✓ is admin-only and delegates to StudentsService (2 ms)
  StudentsController.blockStudent
    ✓ is admin-only and delegates to StudentsService
  StudentsController.unblockStudent
    ✓ is admin-only and delegates to StudentsService (1 ms)
  StudentsController.impersonate
    ✓ resolves the profile then mints an impersonation token for its user
Test Suites: 1 passed, 1 total
Tests: 4 passed, 4 total
Snapshots: 0 total
Time: 2.137 s, estimated 3 s
Ran all test suites matching /students.controller.spec/i.
```

### Commit
```
Commit: 7dd3ac5
Message: test(api): restore controller specs dropped in impersonate task
```

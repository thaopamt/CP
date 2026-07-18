# Thiết kế: Mạo danh học sinh (Admin Impersonation)

- **Ngày:** 2026-07-18
- **Trạng thái:** Đã duyệt thiết kế, chờ viết plan
- **Phạm vi:** Cho phép tài khoản ADMIN đăng nhập ("mạo danh") vào tài khoản học sinh để xem/thao tác như học sinh đó.

## 1. Quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Mô hình session | Mở **tab mới**, giữ nguyên session admin ở tab cũ. Tab mạo danh cô lập trong `sessionStorage`. Banner "Thoát" ở tab mạo danh. |
| Mức quyền | **Toàn quyền** như học sinh thật (xem bài, nộp bài, quest, shop...). |
| Audit | Chỉ gắn claim `impersonatedBy` (id admin) vào token. **Không** tạo bảng log riêng. |
| Ai dùng được | Chỉ **ADMIN**. |
| Chuyển token sang tab mới | **postMessage** (không lộ token qua URL, không cần endpoint redeem). |
| Refresh token | Phiên mạo danh **chỉ cấp access token (mặc định hạn 1 ngày), KHÔNG refresh token**. |

## 2. Bối cảnh kỹ thuật (ràng buộc dẫn tới thiết kế)

- **Auth stateless JWT** (`@nestjs/jwt` + `passport-jwt`). Access + refresh token trả trong **response body** (không cookie). `sub` = `User.id` là danh tính.
- **`refreshTokenHash` chỉ có MỘT slot / user** (lưu hash, rotate mỗi lần refresh). Nếu phiên mạo danh cấp + lưu refresh token cho học sinh → **ghi đè refresh token thật của học sinh**, làm học sinh bị đá ra. ⇒ Mạo danh **không** cấp refresh token, **không** đụng `refreshTokenHash`.
- **Web lưu session bằng Zustand persist → `localStorage` key `cp.auth`**, chỉ **một slot session**. `localStorage` dùng chung mọi tab cùng origin ⇒ để có 2 session đồng thời, tab mạo danh phải dùng **`sessionStorage`** (cô lập theo tab).
- **Student = `StudentProfile`** map 1:1 với `User` (`@OneToOne`, `userId` unique). **`StudentProfile.id` ≠ `User.id`** — URL admin dùng `StudentProfile.id`, phải map qua `userId`.
- Guard theo từng controller: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`. `jwt.strategy.validate()` re-check user còn active mỗi request và **trả nguyên payload** làm `req.user` ⇒ thêm field vào payload là tự có ở `req.user`.

## 3. Luồng tổng quan

1. Admin ở trang danh sách/hồ sơ học sinh bấm **"Đăng nhập với tư cách học sinh"**.
2. Trình duyệt mở **tab mới** tại `/impersonate` **ngay trong click handler** (đồng bộ, tránh bị chặn popup).
3. Tab admin gọi `POST /students/:id/impersonate` → nhận `{ accessToken, user }` (access token có claim `impersonatedBy`).
4. Tab con (`/impersonate`) gửi `{ type: 'cp-impersonation-ready' }` cho `window.opener`.
5. Tab admin nhận "ready" → `postMessage({ type: 'cp-impersonation', accessToken, user }, origin)` sang tab con.
6. Tab con lưu session vào `sessionStorage`, đặt cờ `cp.impersonating='1'`, điều hướng `/student`, hiện **banner**.
7. Session admin ở tab cũ **không thay đổi**.

## 4. Backend (`apps/api`)

### 4a. Mở rộng `JwtPayload`
`libs/shared/src/lib/auth.types.ts` — thêm trường tuỳ chọn:
```ts
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  impersonatedBy?: string; // id admin đang mạo danh; chỉ có ở token mạo danh
  iat?: number;
  exp?: number;
}
```

### 4b. `AuthService.generateImpersonationToken(studentUser, adminId)`
`apps/api/src/modules/auth/auth.service.ts` — ký **chỉ access token**:
- payload: `{ sub: studentUser.id, email: studentUser.email, role: UserRole.STUDENT, impersonatedBy: adminId }`
- `expiresIn` = env mới `JWT_IMPERSONATION_EXPIRES_IN` (mặc định `1d`).
- **Không** tạo refresh token, **không** gọi `updateRefreshTokenHash`.
- Trả `{ accessToken }`.

### 4c. `StudentsService.impersonate(profileId, adminId)`
`apps/api/src/modules/students/students.service.ts`:
- Load `StudentProfile` theo `profileId` (dùng khuôn `getProfileById`), lấy `userId`.
- Load `User`; chặn nếu `!user.isActive` (throw, ví dụ `ForbiddenException`) hoặc `user.role !== UserRole.STUDENT`.
- Gọi `AuthService.generateImpersonationToken(user, adminId)`.
- Trả `{ accessToken, user: <IUser wire-format> }`.
- `StudentsModule` cần import `AuthModule` (đã export `AuthService`/`JwtService`).

### 4d. Route
`apps/api/src/modules/students/students.controller.ts` — theo khuôn `block`/`unblock`:
```ts
@Roles(UserRole.ADMIN)
@Post(':id/impersonate')
impersonate(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentUser() admin: JwtPayload,
) {
  return this.studentsService.impersonate(id, admin.sub);
}
```
Guard đã có ở cấp class (`JwtAuthGuard`, `RolesGuard`).

### 4e. Config
`.env.example` — thêm `JWT_IMPERSONATION_EXPIRES_IN=1d`.

## 5. Frontend (`apps/web`)

### 5a. Auth store chọn storage động
`apps/web/src/app/stores/auth.store.ts` — tại thời điểm tạo store (module load):
```ts
const isImpersonationTab =
  window.location.pathname.startsWith('/impersonate') ||
  window.sessionStorage.getItem('cp.impersonating') === '1';
const persistStorage = isImpersonationTab ? sessionStorage : localStorage;
```
- Nếu tab mạo danh → persist vào `sessionStorage` (khởi đầu rỗng, không đọc/ghi session admin ở `localStorage`).
- Ngược lại → `localStorage` như hiện tại.
- Thêm state: `isImpersonating: boolean` và tên HS đang xem (để render banner). Có thể suy ra từ `user` + cờ sessionStorage.

### 5b. API + query hook
- `apps/web/src/app/api/students.api.ts` — thêm `impersonate(profileId)` → `POST /students/:id/impersonate` (khuôn như `block`).
- `apps/web/src/app/api/student.queries.ts` — thêm `useImpersonateStudent` (`useMutation`, khuôn như `useBlockStudent`).

### 5c. Handoff — tab admin
Trong onClick của nút (trang danh sách hoặc hồ sơ học sinh):
1. `const child = window.open('/impersonate', '_blank')` — **gọi đồng bộ trước await** để không bị chặn popup. Nếu `child === null` → toast hướng dẫn bật popup.
2. Gọi `impersonate(profileId)` (mutation). Nếu lỗi → toast, đóng/không dùng tab con.
3. Nghe `message` từ `child`: khi nhận `{ type: 'cp-impersonation-ready' }` (kiểm `event.origin === location.origin` và `event.source === child`), gửi:
   `child.postMessage({ type: 'cp-impersonation', accessToken, user }, location.origin)`.
4. Gỡ listener sau khi gửi.

### 5d. Handoff — trang `/impersonate`
`ImpersonationHandoffPage` (route public trong `App.tsx`, ngoài `RoleGuard`):
1. Mount → `window.opener?.postMessage({ type: 'cp-impersonation-ready' }, location.origin)`.
2. Nghe `message`: kiểm `event.origin === location.origin` + `event.source === window.opener` + `type === 'cp-impersonation'`.
3. Nhận được: `sessionStorage.setItem('cp.impersonating','1')`, gọi `setSession(accessToken, null, user)` (store đã trỏ sessionStorage), điều hướng `/student`.
4. Có timeout (ví dụ 10s) → nếu không nhận token, hiện lỗi + nút đóng tab.

### 5e. Banner
Component global (mount trong layout student, hoặc App) hiển thị khi `isImpersonating`:
- Nội dung: "Đang xem như **[tên HS]** — **Thoát**".
- **Thoát**: xóa session trong `sessionStorage` (`cp.auth`, `cp.impersonating`), `window.close()`; fallback nếu không đóng được → hiện "Bạn có thể đóng tab này".
- Styling nổi bật (thanh trên cùng) để admin luôn biết đang ở chế độ mạo danh.

## 6. Xử lý lỗi / edge case

- **HS bị khoá / không active**: backend throw → toast ở tab admin, không hoàn tất handoff.
- **Access token hết hạn giữa phiên**: tab mạo danh không có refresh token → interceptor trong `AuthProvider.tsx` **phải bỏ qua refresh khi `refreshToken` null** (không được đọc nhầm refresh của admin từ localStorage — đã tách nhờ sessionStorage), clear session, hiện "Phiên mạo danh đã hết hạn". Cần review `AuthProvider.tsx` để đảm bảo nhánh `refreshToken === null` an toàn.
- **Popup bị chặn** (`window.open` trả null): toast hướng dẫn cho phép popup, không gọi API vô ích.
- **Chặn mạo danh ADMIN/TEACHER**: endpoint chỉ nhận `StudentProfile.id` + validate `role === STUDENT`.
- **postMessage sai origin/type**: cả hai đầu kiểm `event.origin === location.origin` và `type` → bỏ qua message lạ.

## 7. Bảo mật

- Chỉ ADMIN gọi được endpoint (`RolesGuard` + `@Roles(ADMIN)`).
- Claim `impersonatedBy` để phân biệt hành động trong phiên mạo danh (phục vụ log/nhận diện sau này).
- Access-only + hạn ngắn (`JWT_IMPERSONATION_EXPIRES_IN`) giảm rủi ro token rò rỉ.
- postMessage kiểm origin + source + type hai đầu; token không xuất hiện trên URL/lịch sử.
- Không đụng `refreshTokenHash` của học sinh ⇒ không ảnh hưởng phiên đăng nhập thật của HS.

## 8. Kiểm thử

### Backend
- `AuthService.generateImpersonationToken`: token decode có `impersonatedBy`, `sub` = student user id, `role = STUDENT`, **không** trả refresh token; `refreshTokenHash` của user **không đổi**.
- `StudentsService.impersonate`: map `StudentProfile.id` → `User` đúng; chặn khi HS inactive; chặn khi target không phải STUDENT.
- e2e: ADMIN `POST /students/:id/impersonate` → 200; STUDENT & TEACHER → 403; HS bị khoá → lỗi tương ứng.

### Frontend
- Logic chọn storage: tab `/impersonate` hoặc có cờ `cp.impersonating` → dùng sessionStorage; tab thường → localStorage.
- `ImpersonationHandoffPage`: bỏ qua message sai origin/type; nhận đúng → set session + điều hướng.
- Banner hiện đúng khi `isImpersonating`, nút Thoát xóa session sessionStorage.
- Interceptor với `refreshToken === null`: không loop refresh, clear + báo hết hạn.

## 9. Ngoài phạm vi (YAGNI)

- Không làm bảng audit log riêng (chỉ claim trong token).
- Không hỗ trợ TEACHER mạo danh.
- Không làm chế độ read-only.
- Không làm refresh token cho phiên mạo danh (mạo danh lại khi hết hạn).

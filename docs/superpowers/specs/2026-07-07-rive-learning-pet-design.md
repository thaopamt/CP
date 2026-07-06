# Design: Learning Pet với Rive Animation

**Ngày:** 2026-07-07
**Trạng thái:** Đã duyệt (brainstorming với user)
**Phạm vi:** Thiết kế tính năng thú cưng học tập (learning pet) cho học sinh, render bằng Rive, tích hợp vào hệ gamification hiện có.

## 1. Mục tiêu & Quyết định đã chốt

Tính năng pet nhằm kích thích học sinh học đều đặn: pet phản ứng cảm xúc theo hoạt động học tập (giải bài đúng, streak, level up) và "buồn/ngủ" khi học sinh bỏ bê.

Quyết định đã chốt với user:

| Quyết định | Lựa chọn |
|---|---|
| Vị trí hiển thị | Widget nổi trên mọi trang student (mount trong `StudentLayout`) |
| Sở hữu pet | Mặc định mọi học sinh đều có (tạo lazy lần đầu truy cập) |
| Hệ tiến hoá | Pet có EXP/level/evolution **riêng**, tách khỏi `StudentProfile.xp/level` |
| Kiến trúc | **Server-driven state**: backend sở hữu toàn bộ pet state, frontend chỉ render |
| Asset Rive | [Roboware Character Builder](https://rive.app/marketplace/27869-52666-roboware-character-builder/) (tạm thời, thiết kế cho phép thay file khác) |

**Lưu ý bối cảnh:** frontend là **Vite + React SPA** (react-router-dom, zustand, react-query), KHÔNG phải Next.js. Không có SSR nên tích hợp Rive đơn giản.

## 2. Backend (NestJS) — module `pets`

### 2.1 Entity `StudentPet` (bảng `student_pets`)

Module mới `apps/api/src/modules/pets/`, theo pattern các module hiện có (entity + service + controller, `BaseEntity`).

| Field | Kiểu | Ghi chú |
|---|---|---|
| `userId` | uuid, unique | 1-1 với `User`; tạo lazy khi `GET /pets/me` lần đầu |
| `name` | varchar, nullable | Học sinh đặt tên pet |
| `species` | varchar, default `'roboware'` | Key trỏ tới rig frontend; sau này thêm loài mới qua shop |
| `xp` | int, default 0 | Pet XP, thang riêng |
| `level` | int, default 1 | |
| `evolutionStage` | int, default 1 | Suy từ level (xem 2.3), lưu để query/hiển thị nhanh |
| `mood` | varchar (TS enum `PetMood`) | `HAPPY / IDLE / SLEEPY / SAD` — cột varchar (không dùng Postgres enum, xem 2.6); giá trị lưu lần cuối, luôn recompute khi đọc |
| `lastActivityAt` | timestamptz, nullable | Cập nhật mỗi lần có hoạt động học tập |
| `lastGreetedDate` | date, nullable | Để frontend biết có bắn `greeting` đầu ngày không |

### 2.2 Điểm hook duy nhất: quest engine

`PetsService.onLearningActivity(userId, event)` được gọi từ **`QuestsService.handleEvent()`** (apps/api/src/modules/quests/quests.service.ts) — KHÔNG hook trực tiếp vào `submissions.controller.ts` hay `maze.service.ts`, vì quest engine đã nhận sẵn mọi sự kiện học tập (`CODING_ACCEPTED`, `MAZE_ACCEPTED`) và đã cập nhật streak/counters tại đó. Một điểm chạm duy nhất, khó quên hook khi thêm loại hoạt động mới.

Hành vi:
- Cộng pet XP theo `event.points` (bài đã giải rồi — `alreadySolved` — không cộng, đồng bộ với quest engine).
- Cập nhật `lastActivityAt`, recompute mood.
- Check level-up / evolution → emit realtime event.
- Lỗi trong pet flow phải `.catch` và log, không được làm hỏng flow chấm bài/quest (giống cách quest hook hiện tại được gọi).

### 2.3 Thang XP & evolution của pet

- Level n → n+1 cần `n * 100` pet XP (tuyến tính, dễ hiểu với học sinh; tunable qua constant).
- `evolutionStage = 1` (level 1–4), `2` (5–9), `3` (10–19), `4` (20+). Constant trong `pets/pet.constants.ts`.
- Điểm cộng mỗi bài đúng: `ceil(assignment.points / 10)`, tối thiểu 5. (Số liệu khởi điểm, chỉnh sau khi chạy thật.)

### 2.4 Mood: tính khi đọc, không cron

Derive từ `lastActivityAt` mỗi lần `GET /pets/me` (và sau mỗi activity):

| Điều kiện | Mood |
|---|---|
| Có hoạt động hôm nay | `HAPPY` |
| Nghỉ 1 ngày | `IDLE` |
| Nghỉ 2 ngày | `SLEEPY` |
| Nghỉ ≥ 3 ngày (hoặc chưa từng hoạt động) | `SAD` |

Không dùng scheduled job — tránh cron đụng DB dev dùng chung (AWS RDS shared).

### 2.5 API & realtime

- `GET /pets/me` — trả pet (tạo lazy nếu chưa có), mood đã recompute, kèm `xpIntoLevel` / `xpForNextLevel`.
- `PATCH /pets/me` — đổi tên pet (validate độ dài, trim).
- Realtime: tái dùng `GamificationGateway.publish()` (namespace `/gamification`). Mở rộng union `IGamificationEvent` trong `libs/shared/src/lib/types/gamification.types.ts` thêm: `pet:xp`, `pet:level_up`, `pet:evolve` (payload kèm `petXp`, `petLevel`, `mood`).

### 2.6 Migration

- Dev: `synchronize: true` tự tạo bảng `student_pets`. **Cẩn trọng:** enum/named constraint không được synchronize sửa về sau (bài học schema-drift đã gặp) → dùng varchar cho `mood`/`species` thay vì Postgres enum để tránh drift.
- Prod: file migration riêng (theo tiền lệ module exams, migration 1789900000000).

### 2.7 Ngoài phạm vi v1 (phase 2)

- **Pet mission:** tái dùng quest engine — thêm `rewardPetXp` vào quest là thành pet mission. Không xây hệ mission riêng.
- **Skin/loài pet qua shop:** thêm category shop mới hoặc payload `species`; entity đã chừa sẵn field `species`.
- Cho pet ăn/tương tác chạm.

## 3. Frontend (Vite + React)

### 3.1 Dependency & asset

- Thêm `@rive-app/react-canvas` (runtime chính thức Rive khuyến nghị cho web app thường; không cần WebGL2 cho 1 character).
- File `.riv` đặt tại `apps/web/public/pet/roboware.riv`.
- **License CC BY 4.0:** thêm dòng attribution tác giả Sutrisno_88 (Roboware Character Builder) ở footer/trang About.

### 3.2 Lớp adapter `pet-rig.ts` — mấu chốt để thay file .riv sau này

File Roboware chỉ có 3 trigger (`trg_happy`, `trg_sad`, `trg_greeting`) + idle animation, trong khi tính năng cần 6 trạng thái. Adapter ánh xạ semantic action → trigger của rig hiện tại:

```ts
// apps/web/src/app/features/pet/pet-rig.ts
export type PetAction = 'idle' | 'happy' | 'sad' | 'sleepy' | 'celebrate' | 'level_up' | 'greeting';

export const PET_RIGS: Record<string, PetRig> = {
  roboware: {
    src: '/pet/roboware.riv',
    stateMachine: 'main_sm',
    triggers: {
      idle: null,               // idle animation chạy sẵn trong state machine
      happy: 'trg_happy',
      celebrate: 'trg_happy',   // + confetti overlay (tsparticles)
      sad: 'trg_sad',
      sleepy: 'trg_sad',        // + overlay "Zzz" (framer-motion)
      level_up: 'trg_happy',    // + confetti overlay
      greeting: 'trg_greeting',
    },
    overlays: { sleepy: 'zzz', celebrate: 'confetti', level_up: 'confetti' },
  },
};
```

Đổi pet khác = thay file `.riv` + thêm/sửa 1 entry rig. Không đụng logic component.

**Bước xác minh bắt buộc trước khi code component:** load file .riv thật, dump `rive.contents` ở dev để xác nhận tên state machine (`main_sm`) và 3 trigger — marketplace listing không liệt kê inputs nên phải kiểm chứng từ file thực tế.

### 3.3 Components & data flow

```
StudentLayout
 ├── GamificationCelebration (đã có)
 └── PetWidget (mới, floating góc dưới phải)
      ├── PetCanvas (bọc riêng useRive — best practice Rive: cô lập để cleanup canvas đúng)
      ├── Overlay effects (Zzz / confetti)
      └── Pet info popover (tên, level, XP bar, nút đổi tên)
```

- `apps/web/src/app/api/pet.api.ts` + `pet.queries.ts` — theo convention API hiện có (`usePetQuery` key `['pet','me']`).
- `PetWidget` mount 1 lần trong `StudentLayout.tsx` cạnh `GamificationCelebration`. Nút thu nhỏ/ẩn, trạng thái lưu localStorage (qua `ui.store.ts`).
- Realtime: mở rộng `useGamificationSocket.ts` — event `pet:*` → invalidate `['pet','me']` + đẩy action vào pet widget (qua zustand store nhỏ hoặc event emitter nội bộ) để bắn trigger Rive ngay.
- `quest:completed` / `level:up` (event sẵn có) → cũng bắn `celebrate`.
- Greeting: khi widget mount lần đầu trong ngày (so `lastGreetedDate`) → bắn `greeting`.

### 3.4 Hành vi mood → animation

| Trạng thái server | Hành vi widget |
|---|---|
| `HAPPY` | idle + thi thoảng bắn `trg_happy` (random 30–60s) |
| `IDLE` | idle thuần |
| `SLEEPY` | `trg_sad` + overlay Zzz |
| `SAD` | `trg_sad`, tooltip nhắc "Pet nhớ bạn, giải 1 bài nào!" |
| event `pet:xp` | bắn `happy` |
| event `pet:level_up` / `pet:evolve` | bắn `level_up` + confetti |

## 4. Error handling

- Pet flow backend không bao giờ throw ra ngoài flow chấm bài/quest (catch + log).
- Frontend: nếu `.riv` load lỗi hoặc `useStateMachineInput` trả null (trigger không tồn tại) → fallback hiển thị ảnh tĩnh pet (SVG/PNG), widget không crash app. `useStateMachineInput` trả null cho tới khi file load xong — luôn null-check trước khi `.fire()`.
- Socket mất kết nối: mood vẫn đúng nhờ recompute khi refetch `GET /pets/me`.

## 5. Testing

- **Backend:** unit test `PetsService` — tính mood theo `lastActivityAt` (4 ngưỡng + chưa từng hoạt động), cộng XP/level-up/evolution boundary, `alreadySolved` không cộng XP, lazy create idempotent.
- **Frontend:** unit test adapter `pet-rig.ts` (mọi `PetAction` đều map được, kể cả rig thiếu trigger), test hook mapping event → action.
- **Manual/e2e:** submit bài đúng ở Workspace → thấy pet nhảy `happy` realtime; đổi giờ hệ thống/DB để kiểm mood decay.

## 6. Thứ tự triển khai (cho implementation plan)

1. Xác minh file .riv (dump contents, chốt tên state machine + triggers).
2. Backend: entity + service (mood/XP logic thuần, có test) → controller → hook vào quest engine → realtime events + shared types.
3. Frontend: cài dep, `pet-rig.ts` + `PetCanvas` render tĩnh → `PetWidget` + data hooks → realtime + overlay effects.
4. Migration prod + attribution license.

## Attribution

Rive asset: "Roboware Character Builder" by Sutrisno_88 — CC BY 4.0 — https://rive.app/marketplace/27869-52666-roboware-character-builder/

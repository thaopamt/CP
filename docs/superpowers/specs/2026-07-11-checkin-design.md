# Design: Student Daily Check-in (Điểm danh hằng ngày)

**Ngày:** 2026-07-11
**Trạng thái:** Draft
**Phạm vi:** Student portal only — KHÔNG liên quan tới admin/teacher attendance.

---

## 1. Overview & Goals

Tính năng "điểm danh hằng ngày" là một cơ chế gamification tự-điểm-danh trên student portal của monorepo NestJS (`apps/api`) + React (`apps/web`). Mỗi ngày học sinh vào khu vực student sẽ được nhắc điểm danh, nhận thưởng (gems + XP + badge + đôi khi vật phẩm shop), và duy trì streak.

Mục tiêu:

- **Hybrid model:** một bảng lịch theo tháng (calendar board, reset mỗi tháng dương lịch) **CỘNG** một chuỗi streak liên tục toàn thời gian (all-time consecutive-day streak) với milestone badges. Cả hai cùng cập nhật trên mỗi lần check-in.
- **Đặt ở 3 nơi:** auto popup 1 lần/ngày (dismissible) khi vào student area; một trang riêng `pages/student/CheckinPage.tsx` truy cập từ sidebar nav; realtime reward toasts.
- **Reuse hạ tầng có sẵn:** reward recipe (`applyXpGain` + `profile.gems +=` + `advanceLevel` trong transaction, sau đó cache bump + realtime publish), `BadgesService`, `GamificationGateway`, react-query cache.
- **Tách biệt hoàn toàn** khỏi metric streak coding hiện có (`StudentProfile.streak`).

**Về phạm vi tài liệu:** spec này mô tả TOÀN BỘ tính năng (core + cả bốn enrichment), theo approved design. Việc triển khai được **tách theo phase** (§12): Phase 1 là vòng lặp check-in lõi, Phase 2 là các enrichment. Reviewer đã nêu lo ngại rằng bốn enrichment (freeze, makeup, wheel, leaderboard/perfect-month) là engagement gold-plating có thể cắt bớt; xem §13 (Open Decisions) — quyết định giữ nguyên cả bốn theo approved design, nhưng phase hoá rõ ràng để có thể dừng sau Phase 1 nếu cần.

## 2. Non-goals

- **KHÔNG** phải attendance của admin/teacher (điểm danh lớp học do giáo viên chấm). Đây là self check-in của học sinh, hoàn toàn độc lập, không ghi vào `AttendanceRecord`.
- **KHÔNG** reuse `StudentProfile.streak` / `StudentProfile.streakLastDate` — hai field đó chỉ được điều khiển bởi submissions được chấp nhận (coding streak). Check-in giữ streak **riêng** trong `checkin_states`. Reuse sẽ làm hỏng metric coding-streak.
- **KHÔNG** có admin UI để chỉnh reward config. Toàn bộ config là backend constants.
- **KHÔNG** có client-side RNG cho lucky wheel.
- **KHÔNG** thêm `BadgeCriteriaType` mới / stat mới vào `StudentProfile`.

## 3. Data Model

Module mới tự-chứa: `apps/api/src/modules/checkin/` với hai entity, cùng extend `BaseEntity` (`id` uuid, `createdAt`, `updatedAt` như `Badge`/`StudentProfile`).

### 3.1 `daily_checkins` — một dòng cho mỗi (user, dayKey)

| Column | Type / decorator | Ghi chú |
|---|---|---|
| `id` | uuid (BaseEntity) | PK |
| `userId` | `@Column({ type: 'uuid', name: 'user_id' })` | FK logic tới User (KHÔNG khai báo ManyToOne relation — join thủ công qua QueryBuilder khi cần, §6d) |
| `dayKey` | `@Column({ type: 'date', name: 'day_key' })` | `'YYYY-MM-DD'` theo giờ VN, kiểu `string` (giống `streakLastDate`) |
| `monthKey` | `@Column({ type: 'varchar', length: 7, name: 'month_key' })` | `'YYYY-MM'`, dùng để query board tháng |
| `source` | `@Column({ type: 'varchar', length: 16, default: 'checkin' })` | `'checkin'` hoặc `'makeup'` — phân biệt ô được điền bằng makeup (đây là reader thực sự: board §4.3 và perfect-month count §6b đọc `source`) |

**UNIQUE constraint:** `@Unique('UQ_daily_checkin_user_day', ['userId', 'dayKey'])`. Đây là chốt chống double check-in (xem §10).
**Index:** `@Index('IDX_daily_checkin_user_month', ['userId', 'monthKey'])` để build board tháng và count perfect-month nhanh.

> Đã **loại bỏ** các cột `gemsAwarded`/`xpAwarded`/`streakAfter` (write-only, không có reader trong spec). Nếu sau này cần history endpoint mới thêm lại khi đã có consumer. `source` được giữ vì board và perfect-month count đọc nó.

### 3.2 `checkin_states` — một dòng cho mỗi user

| Column | Type / decorator | Ghi chú |
|---|---|---|
| `id` | uuid (BaseEntity) | PK |
| `userId` | `@Column({ type: 'uuid', name: 'user_id' })` | one row per user (KHÔNG có ManyToOne relation) |
| `currentStreak` | `@Column({ type: 'int', default: 0, name: 'current_streak' })` | streak liên tục hiện tại |
| `longestStreak` | `@Column({ type: 'int', default: 0, name: 'longest_streak' })` | all-time streak dài nhất |
| `lastCheckinDate` | `@Column({ type: 'date', nullable: true, name: 'last_checkin_date' })` | dayKey lần điểm danh gần nhất, kiểu `string \| null` |
| `totalCheckins` | `@Column({ type: 'int', default: 0, name: 'total_checkins' })` | tổng số lần check-in thật (makeup KHÔNG tính) |
| `monthKey` | `@Column({ type: 'varchar', length: 7, nullable: true, name: 'month_key' })` | tháng của `monthlyCheckins` hiện tại |
| `monthlyCheckins` | `@Column({ type: 'int', default: 0, name: 'monthly_checkins' })` | số ô đã điền trong tháng `monthKey` (bao gồm makeup) — **chỉ dùng để hiển thị**; perfect-month đánh giá bằng COUNT thực (§4.3) |
| `freezeTokens` | `@Column({ type: 'int', default: 0, name: 'freeze_tokens' })` | token đóng băng streak, cap 3 (Phase 2) |
| `pendingWheelSpins` | `@Column({ type: 'int', default: 0, name: 'pending_wheel_spins' })` | lượt quay còn lại (Phase 2) |
| `makeupUsedThisMonth` | `@Column({ type: 'int', default: 0, name: 'makeup_used_this_month' })` | số makeup đã dùng trong `monthKey`, cap 2 (Phase 2) |
| `highestMilestoneAwarded` | `@Column({ type: 'int', default: 0, name: 'highest_milestone_awarded' })` | mốc all-time cao nhất đã trả thưởng (badge + spin + item). Chống farm khi reset rồi leo lại (§4.4). (Phase 2) |

**UNIQUE constraint:** `@Unique('UQ_checkin_state_user', ['userId'])`.

> **Schema-stability tradeoff (chấp nhận có chủ đích):** Phase 1 tạo đầy đủ schema `checkin_states` kể cả các cột enrichment (`freezeTokens`, `pendingWheelSpins`, `makeupUsedThisMonth`, `highestMilestoneAwarded`) dù chưa có feature tiêu thụ. Lý do: giữ bảng ổn định, tránh nhiều lần alter enum/constraint (memory `schema-drift-synchronize-gotcha.md` cảnh báo `synchronize` không sync đáng tin cho constraint/enum). Nếu enrichment bị cắt/đổi, chỉ cột int mặc-định-0 dư ra (không rủi ro dữ liệu).

### 3.3 Nơi chứa reward config

File constants riêng: `apps/api/src/modules/checkin/checkin.constants.ts`, mirror `apps/api/src/common/gamification.constants.ts`. Xem bảng §5. Không có admin UI.

## 4. Core Mechanics

### 4.1 Timezone day-boundary + `checkinDayKey`

Ranh giới ngày là múi giờ cố định **Asia/Ho_Chi_Minh (UTC+7)**, KHÔNG dùng UTC thô (để check-in lúc 6h sáng VN không bị tính vào ngày hôm trước). Hiện repo **không có** utility timezone-aware nào; `quests.service.ts` dùng `d.toISOString().slice(0,10)` (UTC = 07:00 VN).

Thêm hai pure helper vào `apps/api/src/modules/quests/period-keys.ts` (cạnh `weekKey`/`monthKey`/`applyXpGain`), nhận `now: Date` làm tham số để test không cần mock clock:

```ts
const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Calendar day ở VN (UTC+7), dạng 'YYYY-MM-DD'. */
export function checkinDayKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** Số ngày lịch từ dayKey a đến b (b - a). */
export function daysBetweenDayKeys(a: string, b: string): number {
  const toUtcNoon = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12);
  };
  return Math.round((toUtcNoon(b) - toUtcNoon(a)) / 86400000);
}
```

`monthKey` cho board = `checkinDayKey(now).slice(0, 7)` (`'YYYY-MM'`). VN không có DST (cố định UTC+7 từ 1975) nên không có edge spring/fall; UTC-noon anchoring là defensive.

### 4.2 Streak rules — thuật toán chính xác

Gọi `state = checkin_states` của user, `today = checkinDayKey(now)`. `now` được **inject** làm tham số của method (không gọi `new Date()` bên trong) để test deterministic. Toàn bộ read-modify-write dưới đây chạy trong MỘT transaction với row lock `FOR UPDATE` trên `checkin_states` và `student_profiles` (§7.1, §10) để serialize theo user.

```
POST /checkin (now):                       // now injected
  today    = checkinDayKey(now)
  monthNow = today.slice(0, 7)

  // Lock state + profile rows FOR UPDATE (§7.1) trước khi đọc/ghi.

  // Month rollover (§10) trước khi đọc monthly counters:
  if (state.monthKey !== monthNow):
      state.monthKey            = monthNow
      state.monthlyCheckins     = 0
      state.makeupUsedThisMonth = 0

  // Idempotent fast-path (§10): trả 200 với ICheckinResult, KHÔNG throw, KHÔNG cấp thưởng.
  if (state.lastCheckinDate === today):
      return ICheckinResult{ status: currentStatus, reward: { gems: 0, xp: 0 },
                             weeklyMilestone: false, allTimeMilestone: null,
                             perfectMonth: false, badgesEarned: [], spinsGranted: 0,
                             leveledUp: false, alreadyCheckedIn: true }

  // Cập nhật streak — nhánh tường minh (đã bỏ điều kiện gộp mập mờ):
  if (state.lastCheckinDate == null):
      state.currentStreak = 1
  else:
      gap = daysBetweenDayKeys(state.lastCheckinDate, today)   // gap >= 1 vì today !== last
      if (gap === 1):
          state.currentStreak = state.currentStreak + 1
      else:                                                    // gap > 1: có ngày bị bỏ lỡ
          missed = gap - 1
          if (state.freezeTokens >= missed):                   // Phase 2, §6a auto-consume
              state.freezeTokens  -= missed
              state.currentStreak  = state.currentStreak + 1   // giữ chuỗi
          else:
              state.currentStreak  = 1                         // reset

  state.longestStreak   = max(state.longestStreak, state.currentStreak)
  state.lastCheckinDate = today
  state.totalCheckins  += 1
  state.monthlyCheckins += 1

  // Rewards (TẤT CẢ trong CÙNG transaction với daily insert; §7.1):
  //  - Phase 1: base gems/XP + capped streak bonus (§5)
  //  - Phase 2: weekly milestone nếu currentStreak % 7 == 0 (§6a) — gems/xp/+1 spin/+1 freeze
  //  - Phase 2: all-time milestone (dưới đây)                (§6d)
  //  - Phase 2: perfect-month nếu lần điền này lấp đủ tháng   (§4.3/§6b)

  // All-time milestone (Phase 2) — chỉ thưởng M lần đầu tiên đạt trong ĐỜI:
  for M in CHECKIN_ALLTIME_MILESTONES:          // [7, 30, 100]
      if (state.currentStreak >= M && state.highestMilestoneAwarded < M):
          state.highestMilestoneAwarded = M
          awardByCode(userId, CHECKIN_BADGE_CODES.STREAK_{M})   // badge, once-ever
          state.pendingWheelSpins += 1                          // spin, once-ever nhờ gate trên
          if (M in CHECKIN_MILESTONE_SHOP_ITEM_AT):             // 30, 100
              grant shop item HOẶC CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS (§6c/§6d)

  insert daily_checkins(userId, dayKey = today, monthKey = monthNow, source = 'checkin')
        // UNIQUE backstop; đặt trong cùng tx; 23505 bắt NGOÀI tx → alreadyCheckedIn (§10)
```

Gate `highestMilestoneAwarded < M` đảm bảo mỗi mốc all-time chỉ trả **spin + item + badge đúng một lần trong đời**, kể cả khi streak reset rồi leo lại M (chống farm).

**Worked example** (freeze bridging — Phase 2):
Trạng thái đầu: `currentStreak=6`, `lastCheckinDate='2026-07-01'`, `freezeTokens=2`, `highestMilestoneAwarded=0`.
Học sinh bỏ lỡ 07-02, 07-03; check-in ngày `2026-07-04` (`now = 2026-07-03T18:00:00Z` = 04:00 VN 07-04).
`gap = daysBetweenDayKeys('2026-07-01','2026-07-04') = 3`, `missed = 2`.
`freezeTokens (2) >= missed (2)` → consume 2 token (`freezeTokens=0`), `currentStreak = 6 + 1 = 7`.
Đạt bội số 7 → weekly milestone (§6a) cấp +30 gems, +100 XP, +1 spin, +1 freeze token (→ `freezeTokens=1`, cap 3). Đồng thời all-time milestone 7 lần đầu (`highestMilestoneAwarded 0<7`) → badge `checkin-streak-7` + 1 spin, `highestMilestoneAwarded=7`. Tổng spin ngày này = 2 (weekly + all-time-7 **stack** — xem §6a). Board tháng chỉ điền ô 07-04 (freeze KHÔNG lấp ô 07-02/07-03).

### 4.3 Monthly calendar board semantics

Board của một `monthKey` = mảng ô cho từng ngày dương lịch của tháng đó. Server build từ `daily_checkins WHERE userId AND monthKey = :m`. Board luôn là **tháng hiện tại** (`today.slice(0,7)`), nên không bao giờ chứa ngày của tháng trước.

**Trạng thái ô và precedence (tường minh, mutually exclusive):**

Áp dụng theo thứ tự ưu tiên từ trên xuống — ô đầu tiên khớp thắng:

1. `checked` — có dòng `source='checkin'` cho ngày đó. **Thắng cả `today`**: một ngày == today đã check-in hiển thị `checked` (không phải `today`).
2. `makeup` — có dòng `source='makeup'`. (Phase 2 mới phát sinh.)
3. `today` — ngày == today **và chưa** có dòng nào (current day chưa điểm danh).
4. `future` — ngày > today, chưa có dòng.
5. Ngày < today, chưa có dòng:
   - **Phase 1:** `missed`.
   - **Phase 2:** `missable` (mọi ngày quá khứ-trong-tháng còn trống đều có thể makeup, miễn còn quota + gems; không có "window" giới hạn ngày). Không dùng `missed` ở Phase 2 vì trong một board tháng-hiện-tại mọi ngày quá khứ đều makeupable.

Client phân biệt "đã check-in hôm nay chưa" qua flag toàn cục `checkedInToday` trong `ICheckinStatus`, không suy từ ô board.

> **Phase emission (tường minh):** Phase 1 chỉ phát các status `{ checked, missed, future, today }`. Các status `makeup`/`missable` được thêm ở task makeup (Phase 2), cả ở backend build lẫn `checkin-board.ts`. Union type §8 chứa đủ 6 giá trị nhưng `missed` là Phase-1-only và `makeup`/`missable` là Phase-2-only.

**Perfect month** = mọi ngày từ 1 đến ngày cuối tháng đều `checked` hoặc `makeup`. Đánh giá bằng **COUNT thực trong cùng transaction**, KHÔNG tin `monthlyCheckins`:
```sql
SELECT COUNT(DISTINCT day_key) FROM daily_checkins
WHERE user_id = :u AND month_key = :m
```
so với `new Date(y, m, 0).getDate()` (số ngày trong tháng). Chỉ đánh giá ở lần điền ô (checkin hoặc makeup) làm đầy tháng. `monthlyCheckins` chỉ để hiển thị.

### 4.4 All-time streak

`currentStreak` là chuỗi liên tục hiện tại (có thể được freeze bắc cầu). `longestStreak` là max lịch sử. Milestone all-time tại `currentStreak ∈ {7, 30, 100}` cấp **badge + 1 spin** (30 và 100 thêm shop item / gems fallback). **Toàn bộ phần thưởng milestone (badge + spin + item) chỉ trả một lần trong đời** cho mỗi mốc, gate bằng `state.highestMilestoneAwarded < M` (§4.2) — không phải chỉ badge idempotent. Reset streak rồi leo lại 7/30/100 KHÔNG trả thưởng lần nữa.

## 5. Reward Economy — tunable constants

`apps/api/src/modules/checkin/checkin.constants.ts`:

| Constant | Giá trị | Phase | Ý nghĩa | Trạng thái |
|---|---|---|---|---|
| `CHECKIN_BASE_GEMS` | `5` | 1 | gems mỗi lần check-in thường | **Locked** |
| `CHECKIN_BASE_XP` | `20` | 1 | XP mỗi lần check-in thường | **Locked** |
| `CHECKIN_STREAK_GEM_PER_DAY` | `2` | 1 | +gems mỗi ngày streak vượt day 1 | **Locked** |
| `CHECKIN_STREAK_GEM_CAP` | `20` | 1 | trần bonus streak gems | **Locked** |
| `CHECKIN_WEEKLY_PERIOD` | `7` | 2 | mốc weekly (mỗi ngày streak chia hết 7) | **Locked** |
| `CHECKIN_WEEKLY_GEMS` | `30` | 2 | weekly milestone gems | **Locked** |
| `CHECKIN_WEEKLY_XP` | `100` | 2 | weekly milestone XP | **Locked** |
| `CHECKIN_WEEKLY_SPINS` | `1` | 2 | +wheel spin mỗi weekly | **Locked** |
| `CHECKIN_WEEKLY_FREEZE` | `1` | 2 | +freeze token mỗi weekly | **Locked** |
| `CHECKIN_FREEZE_CAP` | `3` | 2 | trần freeze token nắm giữ | **Locked** |
| `CHECKIN_ALLTIME_MILESTONES` | `[7, 30, 100]` | 2 | mốc all-time cấp badge + spin | **Locked** |
| `CHECKIN_MILESTONE_SHOP_ITEM_AT` | `[30, 100]` | 2 | mốc thêm shop item / gems fallback | **Locked** |
| `CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS` | `100` | 2 | gems thay cho shop item khi chưa có grant-by-code (§6c) | **Assumption** |
| `CHECKIN_MAKEUP_COST_GEMS` | `20` | 2 | phí makeup | **Locked** |
| `CHECKIN_MAKEUP_MAX_PER_MONTH` | `2` | 2 | makeup tối đa/tháng | **Locked** |
| `CHECKIN_PERFECT_MONTH_GEMS` | `200` | 2 | thưởng perfect month | **Assumption** ("large reward" cụ thể hoá) |
| `CHECKIN_PERFECT_MONTH_XP` | `500` | 2 | XP perfect month | **Assumption** |
| `CHECKIN_PERFECT_MONTH_SPINS` | `1` | 2 | +spin perfect month | **Assumption** |
| `CHECKIN_BADGE_CODES` | `{ STREAK_7:'checkin-streak-7', STREAK_30:'checkin-streak-30', STREAK_100:'checkin-streak-100', PERFECT_MONTH:'checkin-perfect-month' }` | 2 | mã badge seed (4 badge) | **Locked** |

Bonus streak công thức: `bonusGems = min(CHECKIN_STREAK_GEM_CAP, (currentStreak - 1) * CHECKIN_STREAK_GEM_PER_DAY)`. Tổng gems ngày thường (Phase 1) = `CHECKIN_BASE_GEMS + bonusGems`. Weekly/perfect-month cộng thêm ở Phase 2.

**Wheel segments** (`CHECKIN_WHEEL_SEGMENTS`) — server-authoritative weights (§6c). KHÔNG dùng placeholder item code:

```ts
export const CHECKIN_WHEEL_SEGMENTS = [
  { index: 0, kind: 'gems', amount: 10,  weight: 30 },
  { index: 1, kind: 'xp',   amount: 50,  weight: 25 },
  { index: 2, kind: 'gems', amount: 25,  weight: 20 },
  { index: 3, kind: 'xp',   amount: 150, weight: 12 },
  { index: 4, kind: 'gems', amount: 60,  weight: 8  },
  { index: 5, kind: 'gems', amount: 100, weight: 5  },
] as const;
```
Segment index 5 dùng gems (100) thay vì một shop item, vì **chưa có** shop item code đã verify và **chưa có** method public cấp item free-by-code trên `ShopService` (§6c). `prize.kind: 'item'` vẫn tồn tại trong type (§8) để dùng sau; reviewer có thể thay index 5 thành `{ kind:'item', itemCode:'<verified-code>' }` **sau khi** đã (a) chọn item code có thật và (b) thêm grant method.
> Ràng buộc bất biến: tổng weight = 100; `index` liên tục 0..n-1 khớp thứ tự client vẽ. Số segment/weight là **Assumption** — reviewer xác nhận.

**Gem-economy budget (cần reviewer chốt — §13.4):** với học sinh streak trưởng thành, faucet passive/ngày ≈ 5 base + tối đa 20 bonus = **25 gems/ngày** (Phase 1), cộng weekly (30/7 ≈ 4.3/ngày), wheel EV (≈17.8 gems/spin × ~1 spin/tuần ≈ 2.5/ngày), perfect-month (200/tháng ≈ 6.6/ngày) → **~35 gems/ngày, ~1.100/tháng** (Phase 2), chồng lên faucet quest/exam có sẵn. Sink nội bộ duy nhất là makeup (≤40 gems/tháng) — nhưng makeup lại mở khoá perfect-month +200, nên **makeup+perfect-month là đòn bẩy net +160 gems**, không phải sink thật. Trước khi lock các số Assumption, phải: (a) đối chiếu với giá shop item thực tế; (b) cân nhắc giảm `CHECKIN_BASE_GEMS`/`CHECKIN_STREAK_GEM_CAP` hoặc thêm trần tổng gems/ngày. Ghi rõ trong §13.4.

## 6. Enrichments (cả bốn — Phase 2)

### 6a. Streak freeze tokens — AUTOMATIC + free

- **Kiếm (weekly milestone, Phase 2):** khi `currentStreak` chạm bội số `CHECKIN_WEEKLY_PERIOD` (7), cấp weekly milestone = `CHECKIN_WEEKLY_GEMS`/`CHECKIN_WEEKLY_XP` + `CHECKIN_WEEKLY_SPINS` spin + `CHECKIN_WEEKLY_FREEZE` freeze. Nắm giữ cap `CHECKIN_FREEZE_CAP` (3): `state.freezeTokens = min(3, state.freezeTokens + 1)`.
- **Auto-consume** (§4.2): khi `gap > 1`, `missed = gap - 1`. Nếu `freezeTokens >= missed` → trừ `missed` token, giữ chuỗi (`currentStreak += 1`). Không đủ → reset `currentStreak = 1` (không trừ token).
- Freeze **chỉ bảo toàn bộ đếm streak**, KHÔNG lấp ô board của các ngày missed (những ngày đó vẫn `missable` cho makeup).
- **Weekly + all-time-7 stacking (chốt):** tại `currentStreak == 7` cả weekly milestone và all-time milestone 7 cùng fire trong một lần check-in → **stack** (2 spin + 1 freeze + 1 badge). Đây là quyết định có chủ đích (hai track thưởng độc lập); đánh dấu là tunable trong §13.5. (30 và 100 không phải bội số 7 nên không chồng.)
- Weekly milestone là Phase 2 (gắn với freeze/spin economy). Phase 1 KHÔNG cấp weekly.

### 6b. Makeup check-in — MANUAL, tốn gems

`POST /checkin/makeup { date }` (date = `'YYYY-MM-DD'`). Toàn bộ chạy trong transaction với `FOR UPDATE` trên `checkin_states` + `student_profiles`. Rules chính xác:

1. `date` phải `< today` (`checkinDayKey(now)`) và thuộc **tháng hiện tại** (`date.slice(0,7) === today.slice(0,7)`). Ngoài → 400.
2. Chưa có dòng `daily_checkins` cho `(userId, date)`. Đã có → 409.
3. `state.makeupUsedThisMonth < CHECKIN_MAKEUP_MAX_PER_MONTH` (2). Hết → 409.
4. `profile.gems >= CHECKIN_MAKEUP_COST_GEMS` (20). Thiếu → 400.

**Thực hiện atomic (chống lost-update khi 2 makeup khác ngày chạy song song):** vì `UQ_daily_checkin_user_day` chỉ chặn trùng CÙNG ngày, hai makeup khác ngày phải được serialize bằng row lock. Trong transaction:
- Lấy `checkin_states` và `student_profiles` bằng `FOR UPDATE` (pessimistic write) TRƯỚC khi đọc `makeupUsedThisMonth`/`gems`. Tương đương: dùng conditional UPDATE và kiểm `affected`:
  - `UPDATE student_profiles SET gems = gems - :cost WHERE user_id = :u AND gems >= :cost` → `affected !== 1` ⇒ 400 (thiếu gems).
  - `UPDATE checkin_states SET makeup_used_this_month = makeup_used_this_month + 1 WHERE user_id = :u AND makeup_used_this_month < :cap` → `affected !== 1` ⇒ 409 (hết quota).
- `state.monthlyCheckins += 1` (display); insert `daily_checkins(source='makeup')`.
- Sau khi lấp, đánh giá perfect-month bằng COUNT thực (§4.3), không dựa `monthlyCheckins`.

**DECISION:** makeup **KHÔNG** cấp gems/XP cho ngày đó và **KHÔNG** thay đổi `currentStreak`/`longestStreak`/`lastCheckinDate`/`totalCheckins`. Nó chỉ lấp ô board phục vụ perfect-month. (Tránh exploit + tránh tương tác freeze/makeup phức tạp.)

### 6c. Lucky wheel — server-authoritative weighted RNG

`POST /checkin/wheel/spin`. Toàn bộ trong transaction với `FOR UPDATE` trên `checkin_states` + `student_profiles`. Rules:

1. **Giảm spin atomic (chống double-submit):** không dùng read-modify-write trần. Trong transaction chạy:
   ```sql
   UPDATE checkin_states SET pending_wheel_spins = pending_wheel_spins - 1
   WHERE user_id = :u AND pending_wheel_spins > 0
   ```
   Nếu `affected !== 1` → rollback, 409 `NO_SPINS`. (Tương đương: `SELECT ... FOR UPDATE` state row đầu transaction rồi kiểm `pendingWheelSpins > 0`.) **Chỉ cấp prize khi decrement thực sự thành công** — hai request song song với `pendingWheelSpins=1` chỉ một request thắng.
2. Chọn segment bằng weighted random trên `CHECKIN_WHEEL_SEGMENTS`; cấp prize (gems/xp qua reward recipe §7). Trả `{ segmentIndex, prize }` cho client chạy animation. KHÔNG có RNG phía client.

Testable: hàm chọn tách riêng và **inject RNG**:
```ts
export function pickWheelSegment(rand: () => number = Math.random) {
  const total = CHECKIN_WHEEL_SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let r = rand() * total;
  for (const seg of CHECKIN_WHEEL_SEGMENTS) { if ((r -= seg.weight) < 0) return seg; }
  return CHECKIN_WHEEL_SEGMENTS[CHECKIN_WHEEL_SEGMENTS.length - 1];
}
```
`CheckinService` nhận `rand` (default `Math.random`) để test truyền `() => 0.5` deterministic.

> **Item grant — không có sẵn cơ chế free-by-code.** `ShopService` (`apps/api/src/modules/shop/shop.service.ts`) **không có** method public nào cấp item free theo code; đường mua duy nhất là `purchase(userId, itemId)` (cần `itemId`, và **trừ** `profile.gems`). Do đó prize `kind:'item'` (wheel) và shop item ở mốc 30/100 (§6d) yêu cầu **hoặc** thêm method grant mới (insert `ShopInventory` row trực tiếp, mô phỏng khối grant trong transaction của `purchase`) **hoặc** fallback về gems tương đương (`CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS`). Mặc định spec dùng **gems fallback**; đường item là mở rộng Phase-2 tùy chọn cần verify item code + grant method trước khi bật.

### 6d. Attendance badges + leaderboard — reuse `BadgesService`

**Seeding (4 badge):** thêm 4 badge upsert idempotent-by-`code` (giống `seed-quests.ts` `BADGES` array — `findOne({where:{code}})`, tạo nếu thiếu). Tạo seed riêng `apps/api/src/database/seeds/seed-checkin.ts` hoặc bổ sung vào `BADGES`. Mỗi badge cần: `code` (`checkin-streak-7` / `checkin-streak-30` / `checkin-streak-100` / `checkin-perfect-month`), `title`, `description`, `icon` (Material Symbols, ví dụ `event_available`), `rarity`, `rewardXp`, `rewardGems`, `isActive`, và `criteria` jsonb. Vì `criteria` non-nullable và không có `BadgeCriteriaType` cho check-in, seed đặt `criteria = { type: BadgeCriteriaType.STREAK_DAYS, threshold: 999999 }` (threshold cao để `evaluateAndAward` không bao giờ tự cấp — chỉ cấp qua method mới).

**Awarding — cần method MỚI trên `BadgesService`.** `evaluateAndAward` không thể cấp badge theo code (nó chỉ đánh giá `criteria.type` map tới stat của `StudentProfile`, không có stat check-in). Thêm public method:
```ts
async awardByCode(userId: string, code: string): Promise<Badge | null>
```
sao chép nguyên khối transactional award của `evaluateAndAward`: tìm badge active theo `code`; guard tồn tại (`UQ_student_badge` + existence check trên `StudentBadge`); nếu chưa sở hữu → insert `StudentBadge`, `badge.earnedCount += 1`, `applyXpGain(profile, badge.rewardXp, now)`, `profile.gems += badge.rewardGems`, `profile.badgesEarned += 1`, `advanceLevel(profile)`, `gateway.publish(userId, { type:'badge:earned', ... })`, `cache.bumpTags(...)`; trả `Badge` mới hoặc `null` nếu đã sở hữu. `CheckinService` tính điều kiện **7/30/100/perfect-month** rồi gọi `awardByCode` với code tương ứng (`CHECKIN_BADGE_CODES`).

**Wiring:** `CheckinModule` `imports: [QuestsModule]` (đã export `BadgesService`, `GamificationGateway`); inject theo class.

**Leaderboard:** `GET /checkin/leaderboard` — vì `checkin_states` **không có** ManyToOne relation tới User, phải join thủ công bằng QueryBuilder (KHÔNG dùng `relations:['user']`):
```
qb over CheckinState s
  .leftJoin(User, 'u', 'u.id = s.userId')
  .addSelect(['u.firstName', 'u.lastName', 'u.avatarUrl'])
  .orderBy('s.currentStreak', 'DESC').addOrderBy('s.totalCheckins', 'DESC')
  .limit(limit)
```
`User` entity KHÔNG có cột `displayName` — chỉ có `firstName`/`lastName`/`username`/`avatarUrl`. `displayName` là field **output tính toán**: `displayName = \`${firstName} ${lastName}\`.trim()` (mirror `leaderboard.service.ts:141`). Trả `ICheckinLeaderboardRow[]` (§8), `rank` gán theo thứ tự, top N (mặc định 20).

## 7. Reuse of Existing Systems

### 7.1 Reward recipe (chính xác) + concurrency

Trong `CheckinService`, tiêm `private readonly ds: DataSource` và `private readonly cache: SystemCacheService`, import `applyXpGain` từ `../quests/period-keys` và `advanceLevel` từ `../../common/gamification.constants`. Theo `QuestsService.applyRewardTx`. **`now` được inject vào method và thread xuyên suốt transaction** (dùng cho cả `checkinDayKey(now)` và `applyXpGain(profile, xp, now)`) — KHÔNG tạo `new Date()` bên trong tx (nếu không hai đồng hồ có thể lệch ranh giới ngày/period).

**Yêu cầu atomicity bắt buộc:**
- MỌI mutation của một hành động (state streak/spin/freeze/milestone, profile gems/xp/level, insert `daily_checkins`) chạy trong **MỘT** transaction.
- Đầu transaction, lock `checkin_states` + `student_profiles` của user bằng `FOR UPDATE` (pessimistic write) để serialize read-modify-write per user (chống lost-update trên gems/quota/streak/spin — kể cả với quest-claim/shop hiện có tác động cùng `student_profiles`).
- Với `POST /checkin`, insert `daily_checkins` là **backstop** UNIQUE; bắt lỗi Postgres `23505` **NGOÀI** transaction (sau khi rollback toàn bộ) và trả `alreadyCheckedIn: true`. Fast-path `state.lastCheckinDate === today` (dưới lock) là lớp idempotent đầu tiên.
- Badge award (`awardByCode`) an toàn nhờ `UQ_student_badge`; nhưng spin/gems/xp/milestone **phải** nằm trong khối atomic này.

```ts
return this.ds.transaction(async (tx) => {
  const stateRepo   = tx.getRepository(CheckinState);
  const dailyRepo   = tx.getRepository(DailyCheckin);
  const profileRepo = tx.getRepository(StudentProfile);

  // Lock FOR UPDATE per user:
  const state = await stateRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } })
                ?? stateRepo.create({ userId, /* defaults */ });
  const profile = await profileRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } });

  // ... cập nhật state theo §4.2 (dùng cùng `now` đã inject) ...
  if (profile) {
    applyXpGain(profile, totalXp, now);   // XP thường + weekly + perfect-month (cùng `now`)
    profile.gems += totalGems;            // gems thường + bonus + weekly + perfect
    advanceLevel(profile);
    await profileRepo.save(profile);
  }
  await stateRepo.save(state);
  await dailyRepo.save(dailyRepo.create({ userId, dayKey: today, monthKey: monthNow, source: 'checkin' }));
  return { ... };
});
```
`advanceLevel` dùng `XP_PER_LEVEL = 10000`.

### 7.2 Cache bump tags

Sau khi grant, gọi `this.cache.bumpTags([...])` với đúng bộ tag của `bumpStudentGamificationCaches`:
```ts
await this.cache.bumpTags([
  `student:${userId}:quests`,
  `student:${userId}:badges`,
  `student:${userId}:dashboard`,
  `student:${userId}:profile`,
  `student:${userId}:shop`,
  'leaderboard:global',
]);
```

### 7.3 Gateway publish

`this.gateway.publish(userId, event)` với `IGamificationEvent`. `GamificationEventType` chỉ gồm `'quest:completed' | 'badge:earned' | 'level:up'` — check-in reward toast tái sử dụng `type: 'badge:earned'` cho milestone badge (frontend đã hiển thị emoji 🏅). Level-up dùng `type: 'level:up'`. Mặc định KHÔNG publish cho check-in thường (tránh spam); chỉ publish khi có badge/level-up/milestone. `event.at = new Date().toISOString()`.

## 8. API Surface

Tất cả endpoint `@Roles(UserRole.STUDENT)`, controller `CheckinController` route base `checkin`.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/checkin/me` | — | `ICheckinStatus` |
| POST | `/checkin` | — | `ICheckinResult` |
| POST | `/checkin/makeup` | `{ date: string }` (`'YYYY-MM-DD'`) | `ICheckinResult` |
| POST | `/checkin/wheel/spin` | — | `ICheckinWheelResult` |
| GET | `/checkin/leaderboard` | query `?limit=20` | `ICheckinLeaderboardRow[]` |

`GET /checkin/me` **không ghi DB**. Nếu `state.monthKey !== currentMonth`, tính giá trị month-scoped hiệu dụng on-the-fly cho response: `monthlyCheckins = 0`, `makeupUsedThisMonth = 0` ⇒ `makeupRemaining = cap`. Không mutate state trong GET; lần `POST /checkin` kế tiếp mới persist reset (§10).

Type mới trong `libs/shared/src` (`@cp/shared`):

```ts
export interface ICheckinBoardCell {
  dayKey: string;            // 'YYYY-MM-DD'
  // 'missed' = Phase-1-only; 'makeup'/'missable' = Phase-2-only (§4.3)
  status: 'checked' | 'makeup' | 'missable' | 'missed' | 'future' | 'today';
}
export interface ICheckinStatus {
  today: string;                     // checkinDayKey(now)
  checkedInToday: boolean;
  monthKey: string;                  // 'YYYY-MM'
  board: ICheckinBoardCell[];        // cả tháng hiện tại
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  monthlyCheckins: number;           // display-only
  freezeTokens: number;
  pendingWheelSpins: number;
  makeupRemaining: number;           // cap - makeupUsedThisMonth (đã tính rollover on-the-fly)
  makeupCost: number;                // CHECKIN_MAKEUP_COST_GEMS
}
export interface ICheckinReward { gems: number; xp: number; }
export interface ICheckinResult {
  status: ICheckinStatus;            // trạng thái sau hành động
  reward: ICheckinReward;            // gems/xp cấp trong hành động này (makeup = {0,0})
  weeklyMilestone: boolean;
  allTimeMilestone: number | null;   // 7|30|100|null (chỉ khi lần đầu đạt)
  perfectMonth: boolean;
  badgesEarned: string[];            // codes
  spinsGranted: number;
  leveledUp: boolean;
  alreadyCheckedIn?: boolean;        // POST /checkin idempotent (HTTP 200, reward {0,0})
}
export interface ICheckinWheelResult {
  segmentIndex: number;
  prize: { kind: 'gems' | 'xp' | 'item'; amount?: number; itemCode?: string };
  status: ICheckinStatus;
}
export interface ICheckinLeaderboardRow {
  userId: string;
  displayName: string;               // computed: `${firstName} ${lastName}`.trim()
  avatarUrl: string | null;
  currentStreak: number; longestStreak: number; totalCheckins: number; rank: number;
}
```

## 9. Frontend

### 9.1 Files

- `apps/web/src/app/api/checkin.api.ts` — thin axios wrapper trên `apiClient` (import `../lib/api-client`), style shop/quests (trả `AxiosResponse`):
  ```ts
  export const checkinApi = {
    me() { return apiClient.get<ICheckinStatus>('/checkin/me'); },
    checkIn() { return apiClient.post<ICheckinResult>('/checkin'); },
    makeup(date: string) { return apiClient.post<ICheckinResult>('/checkin/makeup', { date }); },
    spin() { return apiClient.post<ICheckinWheelResult>('/checkin/wheel/spin'); },
    leaderboard(limit = 20) { return apiClient.get<ICheckinLeaderboardRow[]>('/checkin/leaderboard', { params: { limit } }); },
  };
  ```
- `apps/web/src/app/api/checkin.queries.ts` — key factory + hooks:
  ```ts
  export const checkinQueryKeys = {
    all: ['checkin'] as const,
    me: () => ['checkin', 'me'] as const,
    leaderboard: (limit: number) => ['checkin', 'leaderboard', limit] as const,
  };
  ```
  `useCheckinStatus()` dùng `queryFn: () => checkinApi.me().then(r => r.data)`, `staleTime: queryStaleTime.dashboard`.
  Mutations (`useCheckIn`, `useMakeup`, `useWheelSpin`) `onSuccess` invalidate (§9.5).

### 9.2 Page

`apps/web/src/app/pages/student/CheckinPage.tsx` — calendar board (grid 7 cột) + streak stats + wheel + makeup + leaderboard. Board và streak math tách thành **pure helpers** ở `apps/web/src/app/lib/checkin-board.ts` (build board model từ `ICheckinStatus`, tính bonus label, `makeupRemaining`) để test bằng vitest. `checkin-board.ts` chỉ phát status `{checked, missed, future, today}` ở Phase 1; `makeup`/`missable` thêm ở task makeup (Phase 2).

Route + nav (verified):
- `App.tsx`: `const StudentCheckin = lazy(() => import('./pages/student/CheckinPage'));` + `<Route path="checkin" element={<StudentCheckin />} />` trong khối `/student` (đã có `RoleGuard [STUDENT]` + `StudentLayout`). URL = `/student/checkin`.
- `StudentLayout.tsx`: thêm `const STUDENT_CHECKIN: SidebarNavItem = { to:'/student/checkin', icon:'event_available', key:'nav.student.checkin' };`, đưa vào NAV array (và tuỳ chọn MOBILE_NAV — nếu thêm vào mobile phải bỏ 1 mục để giữ đúng 5).

### 9.3 Popup — gated once/day

`apps/web/src/app/components/CheckinPopup.tsx` — self-contained, zero-prop. Mount trong `StudentLayout.tsx` như sibling của `<GamificationCelebration />` (line 98): `<CheckinPopup />` (import cạnh line 7). Gate hiển thị 1 lần/ngày:
- Đọc `useCheckinStatus()`; nếu `checkedInToday === true` → không mở.
- localStorage key `checkin:lastPopupDay`. Nếu `localStorage.getItem('checkin:lastPopupDay') !== status.today` và chưa check-in → mở popup, và ghi `localStorage.setItem('checkin:lastPopupDay', status.today)` khi hiển thị/dismiss. `status.today` là VN dayKey từ server (không tính local), nên nguồn ngày là server-authoritative.
- Popup dismissible; nút "Điểm danh" gọi `useCheckIn()`.

### 9.4 i18n

Thêm key `checkin` vào object `nav.student` của cả hai file:
- `en.ts`: `checkin: 'Check-in',`
- `vi.ts`: `checkin: 'Điểm danh',`
Thêm các key nội dung trang dưới namespace mới `checkin.*` (title, streak, board, wheel, makeup, leaderboard, popup) ở cả en/vi.

### 9.5 Query keys invalidate

Sau `useCheckIn`/`useMakeup`/`useWheelSpin` `onSuccess`:
```ts
void qc.invalidateQueries({ queryKey: checkinQueryKeys.all });      // ['checkin']
void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] }); // gems sống trên dashboard data
void qc.invalidateQueries({ queryKey: ['leaderboard'] });
void qc.invalidateQueries({ queryKey: ['shop'] });
void qc.invalidateQueries({ queryKey: ['student-badges'] });        // khi có badge
```
`useGamificationSocket` đã tự invalidate `['student-badges']`, `['students','dashboard']`, `['leaderboard']`, `['shop']` trên mọi `gamification:event`, nên realtime toast + refresh gems hoạt động sẵn khi backend publish.

## 10. Edge Cases & Concurrency

- **Double-submit `POST /checkin`:** hai request đồng thời. Dưới `FOR UPDATE` trên `checkin_states` (§7.1), request thứ hai thấy `lastCheckinDate === today` và trả `alreadyCheckedIn: true`. Backstop: `UQ_daily_checkin_user_day` — nếu vẫn chèn trùng, bắt Postgres `23505` **ngoài** transaction (sau rollback toàn bộ) → `alreadyCheckedIn: true`. TẤT CẢ reward (gems/xp/streak/spin/badge) nằm trong cùng tx với daily insert nên rollback nguyên khối; không cấp thưởng hai lần.
- **Concurrent makeup khác ngày:** `FOR UPDATE` trên `checkin_states` + `student_profiles` serialize hai transaction; hoặc conditional UPDATE có kiểm `affected` cho gems (`gems >= cost`) và quota (`makeup_used_this_month < cap`) (§6b). Không có chuyện 2 makeup chỉ trừ 20 gems hay vượt cap 2.
- **Wheel double-submit:** decrement atomic `UPDATE ... SET pending_wheel_spins = pending_wheel_spins - 1 WHERE pending_wheel_spins > 0`, `affected !== 1` → 409 `NO_SPINS`, chỉ cấp prize khi decrement thành công (§6c). Một spin không thể ra hai prize.
- **All-time milestone re-farm:** gate `highestMilestoneAwarded < M` (§4.2/§4.4) khiến badge + spin + item của mỗi mốc chỉ trả một lần trong đời, kể cả khi reset rồi leo lại.
- **Month rollover:** khi `state.monthKey !== monthNow` trong `POST /checkin`, reset `monthlyCheckins=0`, `makeupUsedThisMonth=0`, set `monthKey=monthNow` (persist) trước khi đọc. `GET /checkin/me` tính các giá trị này **on-the-fly, không ghi DB** (§8); board luôn dựng theo `today.slice(0,7)`.
- **Makeup window boundaries:** hợp lệ khi `date < today` VÀ `date.slice(0,7) === today.slice(0,7)`. Ngày 1 khi today là ngày 1 → không có ngày quá khứ trong tháng → makeup luôn 400. Ngày cuối tháng trước KHÔNG makeup được (khác month). `date == today` → 400 (dùng `/checkin`). Không có giới hạn "N ngày gần nhất" — mọi ngày quá khứ-trong-tháng còn trống đều makeupable miễn còn quota + gems.
- **Perfect-month idempotency & repeat:** perfect-month **badge** (`checkin-perfect-month`, code cố định + `UQ_student_badge`) chỉ cấp **một lần trong đời** (tháng perfect ĐẦU TIÊN). Phần thưởng tiền tệ (`CHECKIN_PERFECT_MONTH_GEMS/XP/SPINS`) cấp **lặp lại mỗi tháng perfect** (repeatable), độc lập với kết quả `awardByCode`, và **fire đúng một lần/tháng** — gắn với lần điền (checkin/makeup) làm đầy tháng, đánh giá bằng COUNT thực (§4.3) nên không double-count dù `monthlyCheckins` có drift.
- **Freeze vs makeup:** độc lập — makeup không đổi streak nên không tương tác freeze; freeze chỉ chạy trong `POST /checkin`.

## 11. Testing Strategy (TDD — bắt buộc)

### 11.1 API (Jest via nx) — `apps/api/src/modules/checkin/checkin.service.spec.ts`

Theo `students.service.spec.ts`: instantiate service bằng `new`, mock repos, fake `DataSource.transaction(fn) => fn(tx)`. Skeleton:

```ts
import { Repository } from 'typeorm';
import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { CheckinService } from './checkin.service';

function makeService(seed: { state?: Partial<CheckinState>; profile?: Partial<StudentProfile> } = {}) {
  const stateRepo   = { findOne: jest.fn().mockResolvedValue(seed.state ?? null), save: jest.fn(async (x) => x), create: jest.fn((x) => x) };
  const dailyRepo   = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn(async (x) => x), create: jest.fn((x) => x), find: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) };
  const profileRepo = { findOne: jest.fn().mockResolvedValue(seed.profile ?? { userId: 'u1', gems: 0, xp: 0, level: 1 }), save: jest.fn(async (x) => x) };

  const repos = new Map<unknown, any>([
    [CheckinState, stateRepo], [DailyCheckin, dailyRepo], [StudentProfile, profileRepo],
  ]);
  const tx  = { getRepository: jest.fn((e) => repos.get(e)), query: jest.fn().mockResolvedValue([]) };
  const ds  = { transaction: jest.fn((fn) => fn(tx)) };
  const cache   = { bumpTags: jest.fn().mockResolvedValue(undefined) };
  const badges  = { awardByCode: jest.fn().mockResolvedValue(null) };
  const gateway = { publish: jest.fn() };
  const rand    = jest.fn(() => 0.5);   // deterministic wheel

  const service = new CheckinService(
    stateRepo as any, dailyRepo as any, profileRepo as any,
    ds as any, cache as any, badges as any, gateway as any, rand,
  );
  return { service, tx, cache, badges, gateway, stateRepo, dailyRepo, profileRepo };
}
```

`now` được truyền vào method (`service.checkIn('u1', new Date('2026-07-11T18:30:00Z'))`) — không mock clock. Cases bắt buộc:
1. Idempotent double check-in (`state.lastCheckinDate === today`) → trả `alreadyCheckedIn:true`, reward `{0,0}`, không cấp thưởng.
2. Consecutive increment (`gap === 1`).
3. Freeze bridging (worked example §4.2): `freezeTokens >= missed` → streak giữ, token trừ đúng.
4. Reset khi token thiếu (`freezeTokens < missed` → streak = 1).
5. Makeup rules: khác tháng / ngày tương lai / hết quota / thiếu gems → lỗi; hợp lệ → gems -20, không đổi streak, không cấp gems/xp ngày đó.
6. Wheel weighted-random deterministic (`rand = () => 0.5` chọn đúng segment; assert `segmentIndex`) + zero-spins → 409.
7. Timezone day-boundary: `new Date('2026-07-11T16:59:59Z')` → dayKey `2026-07-11`; `...T17:00:00Z` → `2026-07-12`.
8. Month rollover: `state.monthKey` cũ → `monthlyCheckins`/`makeupUsedThisMonth` reset.
9. All-time milestone once-ever: đạt 7 → thưởng; reset rồi leo lại 7 (với `highestMilestoneAwarded=7`) → KHÔNG thưởng spin/badge lần hai.
10. Perfect-month qua COUNT thực (`dailyRepo.count`/query) == số ngày → cấp; badge once-ever nhưng gems/xp repeat.

Helper pure `checkinDayKey`/`daysBetweenDayKeys` test riêng trong `period-keys` spec.

### 11.2 Web (Vitest trực tiếp) — `apps/web/src/app/lib/checkin-board.spec.ts`

Theo `finance-month.spec.ts`: import từ `vitest`, test pure helpers input→output (build board model, tính bonus gems label, `makeupRemaining`), truyền Date/status làm tham số, không mock, không jsdom.

### 11.3 Run commands (verified)

- API: `npx nx test api --testPathPattern=checkin.service.spec`
- API period-keys: `npx nx test api --testPathPattern=period-keys.spec`
- Web: `npx vitest run apps/web/src/app/lib/checkin-board.spec.ts`
  (Lưu ý: project `web` KHÔNG có nx `test` target — phải chạy vitest trực tiếp; `nx test web` sẽ không hoạt động.)

## 12. Implementation Phasing (ordered task list)

### Phase 1 — Core

1. `libs/shared`: thêm các interface `ICheckin*` (§8).
2. `period-keys.ts`: thêm `checkinDayKey` + `daysBetweenDayKeys` + spec (TDD trước).
3. Entities `DailyCheckin`, `CheckinState` (đầy đủ schema kể cả cột enrichment mặc-định-0, §3.2 tradeoff) + constants file (chỉ base gems/xp + streak bonus dùng ở Phase 1).
4. `CheckinModule` (`TypeOrmModule.forFeature([DailyCheckin, CheckinState, StudentProfile])`, `imports: [QuestsModule]`); đăng ký ở `app/app.module.ts`; thêm 2 entity vào `database/data-source.ts` (import + array).
5. `CheckinService.spec` (idempotent, consecutive, timezone, month rollover) → `CheckinService`: `getMe`, `checkIn` với **reward Phase-1 = base gems/XP + capped streak bonus CHỈ** (không weekly, không freeze, không milestone), board build §4.3 chỉ phát `{checked, missed, future, today}`, cache bump + gateway publish, transaction + `FOR UPDATE` (§7.1).
6. `CheckinController`: `GET /checkin/me`, `POST /checkin` (Roles STUDENT).
7. Frontend: `checkin.api.ts` + `checkin.queries.ts`; `CheckinPage` (board + stats); `CheckinPopup` mount + once/day gate; route + nav + i18n keys; `checkin-board.ts` (chỉ `{checked, missed, future, today}`) + vitest spec.
8. Boot dev → `synchronize` tạo bảng; author migration prod (tham chiếu precedent exam `1789900000000`).

### Phase 2 — Enrichments

9. Freeze tokens + **weekly milestone**: trong `checkIn` thêm weekly (gems/xp/+1 spin/+1 freeze cap 3) + auto-consume freeze; day-7 stacking weekly + all-time-7 (§6a); test freeze bridging + reset + weekly.
10. Makeup: `POST /checkin/makeup` + rules §6b (atomic gem/quota, no reward, no streak) + thêm status `makeup`/`missable` vào board build (backend) và `checkin-board.ts`; test.
11. Lucky wheel: `pickWheelSegment` (inject `rand`) + `POST /checkin/wheel/spin` (atomic decrement §6c) + wheel UI animation; test deterministic + zero-spins.
12. Badges + all-time milestone: `BadgesService.awardByCode` method mới; seed **4** badge idempotent-by-code (`seed-checkin.ts`); trigger **7/30/100** + perfect-month trong `checkIn`, gate bằng `highestMilestoneAwarded` (§4.2/§4.4).
13. Leaderboard: `GET /checkin/leaderboard` (QueryBuilder leftJoin User, compose `displayName`) + UI.
14. Perfect-month reward (repeatable gems/xp/spin, badge once-ever) + shop item ở mốc 30/100 — mặc định gems fallback `CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS`; đường item thật cần grant method + item code verify (§6c).

## 13. Open Decisions (cần reviewer xác nhận)

1. **Timezone = Asia/Ho_Chi_Minh (UTC+7)** cho ranh giới ngày qua `checkinDayKey(now)` — mặc định đã chốt; xác nhận không cần cấu hình per-user.
2. **Makeup không cấp gems/XP và không đổi streak** — chỉ lấp ô board cho perfect-month; xác nhận chấp nhận trade-off chống exploit.
3. **Reward numbers — locked vs pending.** Các constant đánh dấu **Locked** ở §5 (base 5 gems/20 XP, streak +2/ngày cap +20, weekly 30/100/+1 spin/+1 freeze cap 3, all-time 7/30/100, makeup 20 gems / 2 lần tháng, badge codes) coi như đã chốt. Chỉ còn **pending** các giá trị **Assumption**: `CHECKIN_PERFECT_MONTH_GEMS/XP/SPINS`, `CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS`, số segment/weight của wheel, và item code thực (nếu bật đường shop-item). Xác nhận con số cuối cho nhóm Assumption.
4. **Gem-economy budget (§5).** Faucet passive ~35 gems/ngày, ~1.100/tháng ở Phase 2, sink nội bộ yếu (makeup lại là đòn bẩy +160 tới perfect-month). Cần reviewer: (a) đối chiếu giá shop item; (b) quyết có giảm base/cap hoặc thêm trần gems/ngày không, trước khi lock các số Assumption.
5. **Day-7 stacking (§6a).** Mặc định: weekly milestone và all-time-7 **stack** (2 spin + 1 freeze + badge tại streak 7). Xác nhận chấp nhận, hoặc đổi sang precedence "all-time supersedes weekly → 1 spin".
6. **Perfect-month reward repeatable vs badge once-ever (§10).** Mặc định: gems/XP/spin lặp mỗi tháng perfect; badge chỉ tháng perfect đầu tiên. Xác nhận.
7. **Phạm vi enrichment (giải quyết xung đột review ↔ approved design).** Reviewer đề xuất cắt/tách bốn enrichment (wheel, makeup, leaderboard, perfect-month) và split tài liệu thành spec Phase-1/Phase-2 riêng, coi chúng là engagement gold-plating. **Quyết định: giữ nguyên cả bốn trong MỘT spec theo approved design** ("Enrichments — ALL FOUR"; "spec describes everything, implementation is split"), nhưng phase hoá chặt (Phase 1 core độc lập, Phase 2 enrichment) để có thể dừng sau Phase 1 và đo engagement trước khi làm tiếp. Ghi nhận đây là điểm reviewer có thể phủ quyết ở khâu prioritization; nếu đồng ý cắt, ứng viên bỏ theo thứ tự: shop-item của wheel → toàn bộ wheel → leaderboard → (makeup + perfect-month như một cặp).

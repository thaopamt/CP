# Weekly Leaderboard Rewards System Design Spec

## 1. Mục tiêu (Goals)
Xây dựng tính năng tự động chốt bảng xếp hạng (BXH) mỗi tuần, trao phần thưởng (XP, Đá quý, Avatar tạm thời trong 1 tuần) cho Top 10 học sinh tích cực nhất, hiển thị popup chúc mừng vinh danh khi học sinh đăng nhập, và hiển thị Lịch sử vinh danh (Hall of Fame) trên trang xếp hạng.

---

## 2. Các quyết định thiết kế (Design Decisions)
- **Cơ chế chốt tuần & Dọn dẹp (Lazy Finalization & Expiration):** Tránh sử dụng Cron job chạy nền để giảm tải hệ thống và tăng độ tin cậy. Việc chốt tuần và trao quà sẽ được kích hoạt tự động (lazy) khi có request đầu tiên ở tuần mới. Việc thu hồi avatar hết hạn cũng sẽ chạy lazy khi học sinh truy cập kho đồ/profile/catalog.
- **Lịch sử vinh danh vĩnh viễn:** Lưu trữ trực tiếp Top 10 của các tuần đã chốt dưới dạng JSONB trong database để tránh mất dữ liệu lịch sử khi học sinh đổi tên hoặc xóa tài khoản.
- **Avatar thưởng tuần:** Tạo ra 3 vật phẩm avatar đặc quyền trong shop (không thể mua bằng đá quý):
  1. `CHAR_WEEKLY_CHAMPION` - Chiến thần Bảng tuần (Dành cho Rank 1)
  2. `CHAR_WEEKLY_ELITE` - Cao thủ Bảng tuần (Dành cho Rank 2-3)
  3. `CHAR_WEEKLY_CHALLENGER` - Đấu sĩ Bảng tuần (Dành cho Rank 4-10)

---

## 3. Kiến trúc & Data Model (Architecture & Data Flow)

### 3.1. Database Schema Changes

#### Bảng `student_inventory` (Thay đổi)
Thêm cột để lưu trữ thời điểm hết hạn của vật phẩm:
```sql
ALTER TABLE student_inventory ADD COLUMN expires_at TIMESTAMPTZ NULL DEFAULT NULL;
```

#### Bảng `student_profiles` (Thay đổi)
Thêm cột để lưu tuần gần nhất học sinh đã xem popup nhận thưởng:
```sql
ALTER TABLE student_profiles ADD COLUMN last_seen_weekly_reward_week VARCHAR(8) NULL DEFAULT NULL;
```

#### Bảng `leaderboard_finalized_weeks` (Thêm mới)
Lưu thông tin các tuần đã chốt:
```typescript
@Entity({ name: 'leaderboard_finalized_weeks' })
export class LeaderboardFinalizedWeek extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 8 })
  weekKey!: string; // Ví dụ: '2026-W28'

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  finalizedAt!: Date;

  @Column({ type: 'jsonb' })
  winners!: {
    userId: string;
    name: string;
    avatarUrl: string | null;
    rank: number;
    weeklyXp: number;
    rewards: {
      xp: number;
      gems: number;
      avatarCode: string;
    };
  }[];
}
```

---

### 3.2. Core Backend Services

#### 1. Luồng Finalize Tuần Cũ (Triggered Lazily)
Hàm check & finalize tuần trước sẽ chạy trong một transaction:
- Tìm tuần trước `prevWeekKey` (dựa trên thời gian hiện tại trừ đi 7 ngày).
- Kiểm tra xem tuần `prevWeekKey` đã có trong `leaderboard_finalized_weeks` chưa.
- Nếu chưa có:
  1. Lấy ra Top 10 học sinh có `week_key = prevWeekKey` sắp xếp theo `weekly_xp DESC, xp DESC`.
  2. Trao quà cho từng học sinh:
     - **Rank 1**: +1000 XP, +500 Gems, và thêm Avatar `CHAR_WEEKLY_CHAMPION` vào `student_inventory` với `expires_at = NOW() + 7 days`.
     - **Rank 2-3**: +500 XP, +300 Gems, và thêm Avatar `CHAR_WEEKLY_ELITE` với `expires_at = NOW() + 7 days`.
     - **Rank 4-10**: +200 XP, +100 Gems, và thêm Avatar `CHAR_WEEKLY_CHALLENGER` với `expires_at = NOW() + 7 days`.
  3. Lưu thông tin vào `LeaderboardFinalizedWeek` và commit transaction.

#### 2. Luồng Thu Hồi Avatar Quá Hạn (Lazy Expiration)
Hàm helper `cleanupExpiredInventory(userId)`:
- Quét bảng `student_inventory` tìm các dòng có `userId` và `expiresAt < NOW()`.
- Với mỗi dòng hết hạn:
  - Nếu đang được trang bị (`equipped = true`), gọi hàm tháo trang bị (unequip) để reset màu tên, theme, danh hiệu hoặc ảnh đại diện (CHARACTER) của học sinh.
  - Xóa dòng đó khỏi `student_inventory`.
- Tự động gọi helper này trước khi trả dữ liệu ở các API: load profile, load catalog shop, load inventory.

---

### 3.3. API Endpoints
- `GET /leaderboard/finalized` -> Trả về lịch sử các tuần đã chốt vinh danh (danh sách người thắng).
- `GET /leaderboard/pending-reward` -> Kiểm tra xem học sinh hiện tại có phần quà tuần chưa nhận không (so sánh tuần chốt gần nhất với `last_seen_weekly_reward_week`).
- `POST /leaderboard/claim-reward` -> Gọi khi học sinh bấm tắt/nhận popup để cập nhật `last_seen_weekly_reward_week` của học sinh.

---

## 4. UI/UX & Frontend Components

### 4.1. Popup chúc mừng (`WeeklyWinnerModal.tsx`)
- Hiển thị hiệu ứng pháo hoa giấy (Confetti) bay khắp màn hình bằng `@tsparticles/react`.
- Thẻ quà tặng phát sáng (Glow effect) theo thứ hạng:
  - **Rank 1 (Vàng)**: Hộp quà vàng rực rỡ, vương miện lấp lánh.
  - **Rank 2-3 (Bạc)**: Hộp quà bạc lấp lánh.
  - **Rank 4-10 (Đồng)**: Hộp quà đồng trẻ trung.
- Hiển thị chi tiết phần thưởng (+XP, +Gems, và Avatar nhận được kèm badge "Hạn dùng 7 ngày").

### 4.2. Giao diện bảng xếp hạng (`LeaderboardPage.tsx`)
- **Reward Preview**: Thêm icon hộp quà nhỏ bên cạnh Top 10 của tuần hiện tại. Hover vào sẽ hiện Tooltip hiển thị các phần quà họ sẽ nhận được nếu giữ vững phong độ.
- **Hall of Fame Tab**: Thêm tab "Lịch sử vinh danh" kế bên tab BXH hiện tại. Hiển thị danh sách các tuần đã qua kèm theo ảnh avatar và tên của Top 3 người chiến thắng của tuần đó.

---

## 5. Kế hoạch xác minh (Verification Plan)

### Automated Tests
- Test logic chốt tuần: Giả lập database có 12 học sinh có điểm XP của tuần trước (`2026-W28`). Chạy trigger chốt tuần và xác minh Top 10 nhận đủ quà, các bạn xếp hạng 11, 12 không nhận được quà.
- Test lazy expiration: Thêm một avatar hết hạn vào inventory của học sinh, gọi API load profile và xác minh avatar đã bị thu hồi và xóa khỏi DB.

### Manual Verification
- Deploy local, chỉnh sửa hệ thống thời gian giả lập để trigger chuyển tuần.
- Đăng nhập tài khoản đạt Top 1, xác minh popup chúc mừng hiển thị đẹp mắt, đầy đủ pháo hoa, Gems và XP tăng lên đúng mô tả, avatar mới xuất hiện trong kho đồ.
- Đợi 7 ngày giả lập (hoặc chỉnh sửa tay cột `expires_at` lùi về quá khứ), tải lại trang và xác minh avatar bị tự động thu hồi.

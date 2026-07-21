# Thiết Kế Giao Diện Vòng Quay May Mắn (Lucky Wheel Modal)

## 1. Tổng Quan
Nâng cấp trải nghiệm người dùng trên giao diện web học viên (`apps/web`). Thay vì chỉ sử dụng một nút bấm quay thưởng nhận kết quả text đơn thuần, hệ thống sẽ mở một **Modal Vòng quay may mắn tương tác 3D/SVG rực rỡ** với các hiệu ứng hình ảnh, âm thanh/pháo hoa sinh động.

## 2. Chi Tiết Giao Diện & Linh Kiện (Components)

### 2.1. Component `LuckyWheelModal`
- **Vị trí:** `apps/web/src/app/components/checkin/LuckyWheelModal.tsx` (hoặc `apps/web/src/app/features/checkin/`)
- **Thuộc tính (Props):**
  - `isOpen: boolean` - Trạng thái đóng/mở Modal.
  - `onClose: () => void` - Hàm đóng Modal.
  - `spinsCount: number` - Số lượt quay khả dụng (`status.pendingWheelSpins`).
  - `onSpin: () => Promise<ICheckinWheelResult>` - Hàm kích hoạt quay (gọi API `POST /checkin/wheel/spin`).

### 2.2. Cấu trúc Vòng quay (SVG / Canvas 6 Segment)
Vòng quay được chia đều 6 ô (góc mỗi ô 60 độ) theo đúng cấu hình `CHECKIN_WHEEL_SEGMENTS` từ backend:
1. **Ô 0 (Index 0):** `+10 Gems` (Màu vàng kim / Gold)
2. **Ô 1 (Index 1):** `+50 XP` (Màu tím neon / Purple)
3. **Ô 2 (Index 2):** `+25 Gems` (Màu xanh ngọc / Cyan)
4. **Ô 3 (Index 3):** `+150 XP` (Màu xanh lá / Emerald)
5. **Ô 4 (Index 4):** `+60 Gems` (Màu cam rực / Orange)
6. **Ô 5 (Index 5):** `+100 Gems` (Màu xanh dương / Blue)

### 2.3. Hiệu ứng Chuyển động (Spinning Physics & Animation)
- **Tốc độ xoay:** 5 vòng quay tròn đầy đủ (5 * 360 = 1800 deg) + góc quay tính toán dựa trên `result.index` từ backend.
- **Thời gian xoay:** 4 giây với đường cong giảm tốc `cubic-bezier(0.15, 0.9, 0.2, 1)`.
- **Hiệu ứng khi dừng:**
  - Phát hiệu ứng pháo hoa chúc mừng (Confetti animation).
  - Hiển thị Popup/Card vinh danh phần thưởng vừa nhận (`+X Gems` hoặc `+Y XP`).
  - Cập nhật số lượt quay còn lại tức thì.

## 3. Quy Trình Luồng Dữ Liệu (Data Flow)
1. Học viên vào trang Điểm danh (`CheckinPage.tsx`), nhìn thấy thẻ "Vòng quay may mắn" với nút *"Mở vòng quay (X lượt)"*.
2. Nhấn nút -> Modal `LuckyWheelModal` mở ra với hiệu ứng backdrop mờ.
3. Nhấn nút **SPIN** ở tâm bánh xe -> Gửi request tới backend `useWheelSpin()`.
4. Nhận kết quả `index` từ server -> Kích hoạt animation xoay bánh xe tới đúng ô trúng thưởng.
5. Khi bánh xe dừng -> Bùng nổ hiệu ứng confetti, hiển thị kết quả và cập nhật `pendingWheelSpins`.

## 4. Kế Hoạch Kiểm Thử (Verification Plan)
- **Kiểm thử giao diện:** Đảm bảo Vòng quay hiển thị đẹp mắt, sắc nét trên cả màn hình Desktop và Mobile.
- **Kiểm thử Animation:** Đảm bảo góc dừng của bánh xe khớp 100% với `index` phần thưởng do backend trả về.
- **Kiểm thử logic lượt quay:** Khi `pendingWheelSpins = 0`, nút SPIN bị vô hiệu hóa và hiển thị hướng dẫn kiếm thêm lượt.

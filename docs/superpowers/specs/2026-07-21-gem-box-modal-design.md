# Thiết Kế Giao Diện Mở Hộp Quà Đá Quý (Gem Box Opening Modal)

## 1. Tổng Quan
Thay vì mua `GEM_BOX` (Hộp quà đá quý) với kết quả dạng dòng thông báo đơn thuần, hệ thống sẽ mở một **Modal Rương Quà Bí Ẩn Tương Tác** sinh động trong Cửa hàng (`ShopPage.tsx`). Hộp quà đá quý có giá 100 Gems và trả về ngẫu nhiên 20–140 Gems.

## 2. Chi Tiết Giao Diện & Component `GemBoxModal`

### 2.1. Component `GemBoxModal`
- **Vị trí:** `apps/web/src/app/components/shop/GemBoxModal.tsx`
- **Thuộc tính (Props):**
  - `isOpen: boolean` - Trạng thái đóng/mở Modal.
  - `onClose: () => void` - Hàm đóng Modal.
  - `item: IShopItem` - Vật phẩm Hộp quà đá quý (`GEM_BOX`).
  - `userGems: number` - Số Gems hiện có của học viên.
  - `onOpenBox: () => Promise<IPurchaseResult>` - Hàm thực hiện mua/mở rương (API `POST /shop/purchase/:itemId`).

### 2.2. Các Trạng Thái & Hiệu Ứng (Animation States)
1. **Trạng thái Khai thác / Chuẩn bị (`idle`):**
   * Hiển thị chiếc rương bí ẩn khóa kín màu tím & vàng kim với ánh sáng nhấp nháy xung quanh.
   * Thông báo: *"Mở rương bí ẩn — Nhận ngẫu nhiên 20–140 Gems (Chi phí: 100 Gems)"*.
   * Nút bấm: `🎁 Mở Hộp Quà (100 Gems)`.

2. **Trạng thái Đang mở rương (`opening`):**
   * Rương quà rung lắc mạnh (CSS Keyframe Shake Animation).
   * Ánh sáng rực rỡ và các hạt năng lượng tỏa ra từ khe rương trong 2.5 giây.

3. **Trạng thái Công bố phần thưởng (`revealed`):**
   * Nắp rương mở tung ra.
   * **Nếu mở ra >= 100 Gems (Hòa/Lời):** Pháo hoa bùng nổ, rương phát sáng rạng rỡ.
     * Ví dụ: `🎉 Trúng lớn! Bạn nhận được 140 Gems (Lời +40 Gems!)`
   * **Nếu mở ra < 100 Gems (Lỗ):** Ánh sáng dịu nhẹ kèm thông báo động viên.
     * Ví dụ: `✨ Bạn nhận được 50 Gems. Chúc bạn may mắn lần sau!`
   * Nút hành động: `[Mở tiếp (100 Gems)]` (nếu `userGems >= 100`) hoặc `[Đóng cửa hàng]`.

## 3. Quy Trình Tích Hợp Trang `ShopPage.tsx`
- Khi học viên bấm nút *"Mua"* hoặc click vào card vật phẩm `GEM_BOX` trong danh mục Consumable tại `ShopPage.tsx`:
  - Không hiện popup confirm mặc định nữa.
  - Thay vào đó, bật Modal `GemBoxModal` để học viên tự tay trải nghiệm mở rương.

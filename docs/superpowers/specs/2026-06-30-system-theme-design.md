# System-wide Theme Design Spec

## Goal
Cho phép người dùng áp dụng giao diện (theme) toàn hệ thống sau khi mua hoặc sở hữu vật phẩm "Theme" từ cửa hàng. Theme được lưu trữ và duy trì trạng thái trên toàn bộ các trang, hỗ trợ đổi màu sắc, background, gradient.

## Current State
- Backend (`StudentProfile`) đã hỗ trợ cột `equippedTheme` và logic purchase/equip qua `shop.service.ts`.
- Mua vật phẩm Cosmetic được thêm vào kho đồ với `equipped: false`.
- Frontend đang dùng các CSS variable root trong `styles.css` (ví dụ: `--color-primary`, `--color-surface`).

## Architecture & Implementation Approach

### 1. Quản lý Theme bằng CSS Classes
- **Cách thức**: Các theme sẽ được định nghĩa cứng trong file `styles.css` thông qua các class như `.theme-ocean`, `.theme-hacker`. 
- **Cơ chế**: Các class này sẽ ghi đè (override) các biến CSS (như `--color-primary`, `--color-surface`, `--color-background`) đã được định nghĩa ở `:root` và `.dark`.
- **Background & Gradient**: Có thể khai báo thêm các thuộc tính `background-image`, `background-pattern` trực tiếp trong class theme để áp dụng lên thẻ `body` hoặc `html`.

### 2. Trạng thái Frontend (Theme Provider)
- Tạo một React Context/Provider (`ThemeProvider.tsx`).
- Provider này sẽ sử dụng hook `useCurrentStudent()` (hoặc tương đương) để lấy thông tin `equippedTheme` của user đăng nhập.
- Khi giá trị `equippedTheme` thay đổi, `ThemeProvider` sẽ sử dụng `useEffect` để gán class tương ứng (ví dụ: `theme-ocean`) vào `document.documentElement` (`<html>` tag).
- Đồng thời nó cũng phải dọn dẹp (remove) các class theme cũ để tránh xung đột.
- Nếu user không có `equippedTheme` (null), hệ thống sẽ xoá class theme, tự động fallback về theme mặc định (các biến ở `:root`).

### 3. Tương tác Người dùng (Shop & Inventory)
- Flow mua hàng: Giữ nguyên như hiện tại (thêm vào inventory, user phải tự vào Inventory để trang bị).
- Chức năng Trang bị (Equip): 
  - Tại trang Inventory (`MePage.tsx`), khi user bấm "Trang bị" một theme.
  - Frontend gọi API `shopApi.equip(itemId)`.
  - Thành công -> react-query tự động invalidate `useCurrentStudent()`.
  - `ThemeProvider` nhận thấy `equippedTheme` thay đổi -> tự động cập nhật CSS class -> Giao diện thay đổi tức thời trên toàn hệ thống.

## Trade-offs
- **Pros**: Hiệu năng cao (chỉ dựa vào CSS), tương thích 100% với TailwindCSS hiện tại, dễ tuỳ chỉnh style đặc thù (pattern/gradient).
- **Cons**: Phải deploy lại frontend mỗi khi muốn thêm theme mới.

## Future / Open Questions
- Danh sách các theme ban đầu cần thiết lập (Ví dụ: Ocean, Hacker, Sunset)?
- Các theme này cần cập nhật `seed` data của backend để code `themeKey` khớp với class name trong CSS.

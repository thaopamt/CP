# Finance Charts Design Spec

## Goal
Tạo khu vực Dashboard Trực quan bằng biểu đồ trong trang Tài chính (Finance Page) dành cho Admin. Giúp người dùng dễ dàng theo dõi xu hướng thu chi qua các tháng và cơ cấu của tháng hiện tại thay vì chỉ xem con số thô.

## Architecture & Dependencies
1. **Frontend Chart Library**: Thêm thư viện `recharts` vào dự án (`pnpm add recharts`).
2. **Backend API (New)**: `GET /api/finance/monthly-trend`
   - Nhận tham số query `months` (number, mặc định = 6).
   - Lặp qua các tháng gần nhất (tính từ tháng hiện tại hoặc tháng được truyền lên) và sử dụng logic tính toán `summary` hiện tại để tạo ra một mảng dữ liệu báo cáo của 6 tháng.

## Components & Data Flow

### 1. Backend: FinanceController & FinanceService
- Endpoint: `GET /api/finance/monthly-trend`
- Response Payload Format:
  ```json
  [
    {
      "month": "2026-02",
      "totalPotentialAmount": 50000000,
      "totalAmountDue": 45000000,
      "totalOutstandingAmount": 15000000
    },
    ...
  ]
  ```
- Implementation: Tách logic tạo `summary` (vốn đang dùng trong `getMonthlyReport`) thành một hàm private có thể tái sử dụng. Hàm `getMonthlyTrend` sẽ gọi hàm tính summary này trong 1 vòng lặp (generate ra N tháng gần nhất).

### 2. Frontend: FinanceDashboardCharts
- Nằm trong: `AdminFinancePage`
- Gồm 2 phần chính hiển thị ngang nhau (Grid 2 cột) trên Desktop và hiển thị dọc trên Mobile:
  - **Trend Chart (Biểu đồ xu hướng)**:
    - Loại: BarChart kết hợp Line hoặc 3 cột (BarChart).
    - X-Axis: Tháng (VD: 02/2026, 03/2026).
    - Data: Mảng 6 tháng từ `/api/finance/monthly-trend`.
    - Data keys: Tối đa có thể thu, Tổng thu, Chưa thu.
  - **Breakdown Chart (Biểu đồ cơ cấu)**:
    - Loại: PieChart / Donut Chart.
    - Data: Tính toán từ `summary` của tháng ĐANG CHỌN (trong trang AdminFinancePage).
    - Logic:
      - Đã thu = `totalAmountDue - totalOutstandingAmount`
      - Chưa thu = `totalOutstandingAmount`
    - Legend: Hiển thị Tổng thu, Đã thu, và Chưa thu.

## Error Handling
- Nếu không có dữ liệu cho biểu đồ Trend (do API lỗi hoặc không gọi được), hiển thị Empty state ("Chưa có dữ liệu thống kê").
- Nếu `summary` của tháng hiện tại = 0 (tức là không có khoản thu nào), hiển thị Empty state cho Pie Chart ("Không có khoản thu nào trong tháng này").

## Testing
- **UI Testing**: Đảm bảo biểu đồ responsive trên thiết bị di động (các cột nhỏ lại hoặc nằm dọc).
- **Backend Testing**: Kiểm tra API `/api/finance/monthly-trend` trả đúng 6 tháng liên tục lùi về quá khứ và khớp với dữ liệu thật.

## Scope Check
Spec này tập trung CỤ THỂ vào trang Admin Finance, không làm ảnh hưởng đến Teacher Finance (Giáo viên thường chỉ quan tâm đến lớp của mình trong 1 tháng). Dữ liệu tính toán tận dụng lại toàn bộ hàm có sẵn nên giảm rủi ro sai sót logic tài chính.

# Global Chat Room Design Spec

## 1. Mục tiêu (Goals)
Xây dựng một Phòng Chat Chung (Global Chat Room) nơi tất cả người dùng (học sinh, giáo viên, admin) có thể giao tiếp trực tuyến với nhau.

## 2. Các quyết định thiết kế (Design Decisions)
- **Vị trí & Bố cục:** Trang riêng biệt (Full-page) tại route `/student/global-chat`. Bao gồm 2 phần: khu vực nhắn tin rộng rãi bên trái và danh sách người dùng đang online bên phải.
- **Tính năng giao tiếp:** Tập trung vào sự đơn giản, tốc độ cao. Chỉ hỗ trợ Text cơ bản và gửi Emoji. Không hỗ trợ định dạng phức tạp hay gửi file.

## 3. Kiến trúc & Data Model (Architecture & Data Flow)
- **Frontend Components:**
  - `GlobalChatPage.tsx`: Layout chính, chứa 2 cột (Chat Area & Sidebar).
  - `GlobalMessageList.tsx`: Hiển thị danh sách tin nhắn. Tự động cuộn xuống khi có tin nhắn mới.
  - `GlobalMessageInput.tsx`: Input field với tính năng gõ text, emoji picker, và nút gửi.
  - `GlobalOnlineUsers.tsx`: Sidebar hiển thị danh sách người dùng hiện đang kết nối.
- **Backend/Socket:**
  - Sử dụng chung hạ tầng Socket.IO hiện có.
  - Room name: `global_chat`.
  - Database: Tin nhắn chat chung sẽ được lưu vào bảng/collection của `chat_messages` với `conversationId` đặc biệt (vd: `global` hoặc một UUID cố định cho global room).
- **Data Flow:**
  - Người dùng truy cập `/student/global-chat` -> Gửi sự kiện `join_room("global_chat")` qua WebSocket.
  - Fetch 50 tin nhắn gần nhất qua REST API (hoặc Socket ack).
  - Nhận sự kiện `new_message` khi có người khác gửi tin.
  - Nhận sự kiện `user_joined_global` và `user_left_global` để cập nhật danh sách người dùng online ở cột bên phải.

## 4. UI/UX
- Giao diện có màu sắc và typography đồng nhất với hệ thống Zenith hiện tại (`bg-surface`, `bg-primary`, v.v.).
- Danh sách online sẽ có avatar hoặc chữ cái đại diện, kèm theo dấu chấm xanh (trạng thái online).
- Tích hợp thêm icon vào Sidebar Nav trong `StudentLayout.tsx` để người dùng dễ dàng truy cập.

## 5. Các câu hỏi chưa giải quyết (Open Questions)
- Chưa có.

## 6. Phạm vi (Scope)
- **Trong scope:** Xây dựng UI Full-page cho sinh viên, tích hợp vào Sidebar, lưu trữ tin nhắn, real-time sync.
- **Ngoài scope:** Các tính năng nâng cao như Reply, React, Mention, Gửi file, Phân quyền quản trị viên chặn tin nhắn (có thể phát triển ở phase sau).

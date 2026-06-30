# Thiết kế Khối lệnh Tấn công Quái vật (Attack Block) trong Mê cung

## Goal
Thêm khối lệnh "Tấn công quái vật ⚔️" (`attack`) vào hệ thống lập trình mê cung (Blockly + Engine mô phỏng). 
Tính năng này giúp học sinh có thể lập trình điều kiện `if` để kiểm tra chiếc hộp bí ẩn phía trước, nếu có quái vật thì thực hiện tấn công để phá hủy/tiêu diệt quái vật trước khi bước đi tới, giải quyết trường hợp chiếc hộp có nội dung ngẫu nhiên (random) không biết trước là báu vật hay quái vật.

## Current State
- **Các khối lệnh hỗ trợ hiện tại**: Đi tới (`move_forward`), quay trái (`turn_left`), quay phải (`turn_right`), thu thập (`pick`), đứng yên (`wait`), vòng lặp và điều kiện `if`.
- **Hệ thống cảm biến**:
  - `BOX_AHEAD`: kiểm tra ô phía trước có hộp bí ẩn hay không.
  - `BOX_AHEAD_SAFE`: kiểm tra hộp phía trước có phải báu vật an toàn hay không (trả về `true` nếu là `treasure`, `false` nếu là `monster`).
- **Logic mô phỏng**: Lớp `simulate` trong `maze-engine.ts` chạy trên cả Client và Server để bảo đảm kết quả trùng khớp hoàn toàn. Khi người chơi bước vào ô chứa hộp bí ẩn có quái vật (`monster`) hoặc quái vật di chuyển (`CAUGHT`), lượt chơi thất bại ngay lập tức.

## Architecture & Implementation Approach

### 1. Cập nhật Shared Library (`libs/shared`)
- **`maze.types.ts`**:
  - Thêm `BlockType.ATTACK = 'attack'` vào enum `BlockType`.
  - Cập nhật `Command` union type để hỗ trợ lệnh `AttackCmd` (có kiểu `{ type: BlockType.ATTACK }`).
  - Thêm `'attack'` vào union type `SimStep['action']`.
- **`maze-validator.ts`**:
  - Cập nhật hàm `validateCommands` để kiểm tra quyền sử dụng khối lệnh `BlockType.ATTACK` nếu bàn chơi yêu cầu.
- **`maze-engine.ts`**:
  - Khai báo một tập hợp nội bộ `defeatedMonsters = new Set<number>()` để lưu trữ chỉ số các quái vật đã bị tiêu diệt trong lượt chạy mô phỏng.
  - Cập nhật hàm `advanceMonsters` để bỏ qua di chuyển của quái vật có chỉ số nằm trong `defeatedMonsters` (đồng thời đặt vị trí của chúng thành `{-1, -1}`).
  - Cập nhật hàm `monsterDangerAt` và `monsterViews` để bỏ qua các quái vật đã bị tiêu diệt.
  - Trong hàm `run(cmds: Command[])`, thêm nhánh xử lý `case BlockType.ATTACK:`:
    1. Xác định ô phía trước `targetCell = cellAhead(dir)`.
    2. Nếu ô phía trước chứa một hộp bí ẩn (`boxAt.has(key(targetCell))`) và hộp đó có nội dung là `monster`:
       - Xóa hộp khỏi `boxAt` (`boxAt.delete(key(targetCell))`).
    3. Nếu ô phía trước chứa quái vật di động (roaming monster):
       - Tìm tất cả quái vật `i` đang đứng tại `targetCell` (`sameCell(monsterPos[i], targetCell)`).
       - Thêm chỉ số `i` vào `defeatedMonsters` và đặt `monsterPos[i] = { x: -1, y: -1 }`.
    4. Trực tiếp thực hiện đẩy bước đi vào hàng đợi hiển thị `pushStep('attack', cmd)`.

### 2. Cập nhật Web Client (`apps/web`)
- **Blockly Blocks (`blocks.ts`)**:
  - Đăng ký khối lệnh mới:
    ```typescript
    {
      type: 'maze_attack',
      message0: 'tấn công ⚔️',
      previousStatement: null,
      nextStatement: null,
      colour: '#FF3366', // Màu hồng/đỏ nổi bật cho hành động tấn công
      tooltip: 'Tấn công quái vật hoặc phá hộp bí ẩn có quái vật phía trước',
    }
    ```
- **workspace-to-ast.ts**:
  - Ánh xạ khối `maze_attack` thành câu lệnh AST:
    ```typescript
    case 'maze_attack':
      return withBlockId(block, { type: BlockType.ATTACK });
    ```
- **toolbox.ts**:
  - Đưa khối `maze_attack` vào danh mục "Di chuyển" nếu cấp độ cho phép `allow.has(BlockType.ATTACK)`.
- **MazeLevelBuilder.tsx**:
  - Thêm `BlockType.ATTACK` vào danh sách `ALL_BLOCKS` để quản trị viên có thể bật/tắt quyền sử dụng khối lệnh này khi thiết kế màn chơi.
- **Localization (`vi.ts` / `en.ts`)**:
  - Thêm nhãn dịch cho `maze.blocks.attack`:
    - Tiếng Việt: `'tấn công'`
    - Tiếng Anh: `'attack'`

## Trade-offs
- **Pros**:
  - Đảm bảo logic đồng bộ 100% giữa trình mô phỏng ở Frontend và API chấm điểm ở Backend.
  - Triển khai nhanh, gọn gàng, hiệu năng tối ưu.
- **Cons**:
  - Nhân vật chỉ đổi trạng thái block đang chạy trên UI và quái vật biến mất/hộp biến mất mà chưa có hoạt ảnh kiếm chém hay nổ tung. Tuy nhiên điều này hoàn toàn đáp ứng tốt về mặt logic lập trình cho trẻ em.

## Future / Open Questions
- Chưa có câu hỏi mở nào thêm từ phía kỹ thuật.

# C. Loong Tracking

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Takahashi đã tạo ra một trò chơi để người chơi có thể điều khiển 1 con rồng trên mặt phẳng tọa độ. Con rồng gồm $N$ bộ phận, với bộ phận đầu tiên được gọi là **Đầu** (bộ phận 1).

Ban đầu, phần thứ $i$ nằm ở tọa độ $(i, 0)$. Xử lý $Q$ truy vấn như sau:
- `1 C`: Di chuyển phần **đầu** theo hướng $C$. Ở đây, $C$ là một trong 4 hướng `R`, `L`, `U` hoặc `D` (Right, Left, Up, Down). Các bộ phận còn lại sẽ di chuyển đến vị trí của bộ phận phía trước.
- `2 p`: Tìm tọa độ của bộ phận thứ $p$.

### Input
- Dòng đầu tiên chứa 2 số nguyên dương $N$ và $Q$ ($2 \le N \le 10^6$, $1 \le Q \le 2 \times 10^5$).
- $Q$ dòng tiếp theo, mỗi dòng chứa 1 truy vấn theo định dạng mô tả ở trên.

### Output
- Với mỗi truy vấn loại 2, in ra trên một dòng hai số nguyên $x$ và $y$ cách nhau bởi khoảng trắng — tọa độ $(x, y)$ của bộ phận thứ $p$ tại thời điểm đó.

### Example
| input | output |
| :--- | :--- |
| 5 9<br>2 3<br>1 U<br>2 3<br>1 R<br>1 D<br>2 3<br>1 L<br>2 1<br>2 5 | 3 0<br>2 0<br>1 1<br>1 0<br>1 0 |

### Note
Giải thích ví dụ:
- Ban đầu, các bộ phận của rồng nằm tại các vị trí:
  - Đầu (1) tại $(1, 0)$
  - Bộ phận 2 tại $(2, 0)$
  - Bộ phận 3 tại $(3, 0)$
  - Bộ phận 4 tại $(4, 0)$
  - Bộ phận 5 tại $(5, 0)$
- Truy vấn `2 3`: Bộ phận 3 ở $(3, 0)$.
- Truy vấn `1 U`: Đầu di chuyển lên $(1, 1)$. Các bộ phận khác di chuyển theo:
  - 2 di chuyển đến vị trí cũ của đầu: $(1, 0)$.
  - 3 di chuyển đến vị trí cũ của 2: $(2, 0)$.
  - 4 di chuyển đến vị trí cũ của 3: $(3, 0)$.
  - 5 di chuyển đến vị trí cũ của 4: $(4, 0)$.
- Truy vấn `2 3`: Bộ phận 3 hiện ở $(2, 0)$.

# A. MINI CANDY

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

An và Bình là hai anh em.

Ba của An sau một chuyến đi công tác xa nhà trở về, mua cho An và Bình $N$ gói kẹo, gói thứ $i$ có $A_i$ viên kẹo.

Để tránh việc tranh giành kẹo lẫn nhau, ba của An đã thống nhất việc chia kẹo theo cách sau:
- Trước hết, ba của An chọn ra một số nguyên $k$ (với $1 \le k \le N$).
- An sẽ được chia các gói kẹo từ $1$ đến $k$. Phần còn lại (các gói kẹo từ $k + 1$ đến $N$) sẽ được chia cho Bình.

Để tránh sự phân bua giữa hai anh em, ba của An muốn lựa chọn chỉ số $k$ sao cho chênh lệch giữa tổng số lượng viên kẹo của hai anh em là nhỏ nhất có thể. Hãy giúp ông thực hiện điều này.

### Input
- Dòng đầu tiên gồm số nguyên $N$ ($2 \le N \le 200000$) — số gói kẹo.
- Dòng thứ hai gồm $N$ số nguyên $A_1, A_2, \dots, A_N$ ($1 \le A_i \le 10^9$) — số viên kẹo trong từng gói kẹo.

### Output
- In ra chênh lệch lượng kẹo nhỏ nhất có thể.

### Scoring
- Subtask 1 ($50\%$ số điểm): $N \le 2000$.
- Subtask 2 ($50\%$ số điểm): Không có ràng buộc gì thêm.

### Example
| input | output |
| :--- | :--- |
| 5<br>5 1 3 2 6 | 1 |
| 6<br>4 5 3 6 1 2 | 3 |
| 2<br>100 100 | 0 |

### Note
- Trong ví dụ thứ nhất, nếu chọn $k = 3$ thì tổng số kẹo An được chia là $5 + 1 + 3 = 9$, tổng số kẹo Bình được chia là $2 + 6 = 8$, chênh lệch lượng kẹo là $|9 - 8| = 1$.
- Trong ví dụ thứ hai, có hai cách chọn $k$ tối ưu:
  - Chọn $k = 2$. Tổng số kẹo An được chia là $4 + 5 = 9$, tổng số kẹo Bình được chia là $3 + 6 + 1 + 2 = 12$, chênh lệch lượng kẹo là $|9 - 12| = 3$.
  - Chọn $k = 3$. Tổng số kẹo An được chia là $4 + 5 + 3 = 12$, tổng số kẹo Bình được chia là $6 + 1 + 2 = 9$, chênh lệch lượng kẹo là $|12 - 9| = 3$.

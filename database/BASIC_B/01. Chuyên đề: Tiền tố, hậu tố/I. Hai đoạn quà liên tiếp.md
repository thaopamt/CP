# I. Hai đoạn quà liên tiếp

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Nhân dịp trung thu thầy Huy có $n$ món quà, món quà thứ $i$ có giá trị $A_i$, và sẽ tặng cho 2 học sinh xuất sắc với điều kiện mỗi người chỉ có thể nhận $k$ món quà liên tiếp. Hãy tìm tổng giá trị lớn nhất có thể nhận được.

### Input
- Dòng đầu tiên chứa hai số nguyên $n$ và $k$ ($n \le 10^6$, $k \le \frac{n}{2}$).
- Dòng tiếp theo chứa $n$ số nguyên $A_i$ ($1 \le A_i \le 10^9$) mô tả giá trị của các món quà.

### Output
- In ra một số là giá trị lớn nhất mà hai học sinh có thể có được.

### Example
| input | output |
| :--- | :--- |
| 9 3<br>2 6 1 5 3 8 1 9 1 | 30 |

### Note
Trong ví dụ trên, chọn các món quà trong hai khoảng $(2, 4)$ và $(6, 8)$ (đánh số từ 1) thì tổng giá trị nhận được là $30$, là lớn nhất.

Giải thích ví dụ: Với $n = 9, k = 3$, ta cần chọn 2 đoạn con độ dài $3$ không giao nhau. Cách chọn tối ưu là:
- Đoạn thứ nhất: vị trí từ $2$ đến $4$ (giá trị $\{6, 1, 5\}$), có tổng là $12$.
- Đoạn thứ hai: vị trí từ $6$ đến $8$ (giá trị $\{8, 1, 9\}$), có tổng là $18$.

Tổng giá trị lớn nhất: $12 + 18 = 30$.

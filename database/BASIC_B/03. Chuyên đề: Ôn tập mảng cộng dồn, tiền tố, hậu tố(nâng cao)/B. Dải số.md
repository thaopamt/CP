# B. Dải số

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho một số nguyên dương $n$ và một mảng $A$ chứa $n$ số nguyên (có thể âm). Bạn muốn cắt một nhát cắt trên mảng đó để chia mảng đó thành hai đoạn trái và phải, sao cho cả hai đoạn đều có ít nhất một phần tử và tổng các phần tử của hai đoạn bằng nhau.

Đề bài yêu cầu đếm có bao nhiêu cách cắt thỏa mãn điều kiện trên.

### Input
- Dòng đầu tiên chứa một số nguyên dương $n$ ($1 \le n \le 2 \times 10^5$).
- Dòng thứ hai chứa $n$ số nguyên $A_i$, là số thứ $i$ của mảng $A$ ($|A_i| \le 10^9$).

### Output
- Số cách cắt mảng $A$ cho trước thỏa mãn điều kiện trên.

### Example
| input | output |
| :--- | :--- |
| 4<br>1 2 2 1 | 1 |
| 6<br>1 1 1 3 -3 3 | 2 |

### Note
- **Test 1:** Có 1 cách cắt là $[1, 2]$ / $[2, 1]$.
- **Test 2:** Có 2 cách cắt là:
  1. $[1, 1, 1]$ / $[3, -3, 3]$
  2. $[1, 1, 1, 3, -3]$ / $[3]$

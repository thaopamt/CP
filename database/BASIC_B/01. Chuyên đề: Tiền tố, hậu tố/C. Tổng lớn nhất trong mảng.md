# C. Tổng lớn nhất trong mảng

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Hãy tìm một đoạn trong mảng có trọng số lớn nhất, nghĩa là tổng các số trong đoạn là lớn nhất.

- Cho mảng $a_1, a_2, \dots, a_n$.
- Một đoạn $a(i, j) = a_i, \dots, a_j$ ($1 \le i \le j \le n$).
- Trọng số $w(a(i, j)) = a_i + a_{i+1} + \dots + a_j$.

**Yêu cầu:** Hãy tìm một đoạn trong mảng có trọng số lớn nhất.

### Input
- Dòng thứ nhất chứa một số nguyên $n \le 10^6$.
- Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \dots, a_n$ ($-200 \le a_i \le 800$).

### Output
- Ghi ra duy nhất một số nguyên là trọng số lớn nhất tìm được.

### Example
| input | output |
| :--- | :--- |
| 6<br>-2 11 -4 13 -5 2 | 20 |

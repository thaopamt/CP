# J. Dãy số (OLPCĐ 2014)

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho dãy số gồm $n$ số nguyên $a_1, a_2, \dots, a_n$. Một đoạn con của dãy đã cho là dãy $a_i, a_{i+1}, \dots, a_j$ ($1 \le i \le j \le n$), dãy có độ dài $j - i + 1$ và có trọng số bằng tổng $a_i + a_{i+1} + \dots + a_j$.

**Yêu cầu:** Tìm đoạn con có độ dài là một số chia hết cho 3 và có trọng số lớn nhất.

### Input
- Dòng đầu ghi số nguyên $n$ ($3 \le n \le 100000$).
- Dòng thứ hai ghi $n$ số nguyên $a_1, a_2, \dots, a_n$ ($|a_i| < 10^9$).

### Output
- Giá trị trọng số lớn nhất của đoạn con tìm được.

### Example
| input | output |
| :--- | :--- |
| 11<br>1 1 1 -9 1 1 1 1 -1 1 -9 | 4 |

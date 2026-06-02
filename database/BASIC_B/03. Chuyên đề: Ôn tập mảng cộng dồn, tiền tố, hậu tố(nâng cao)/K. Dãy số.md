# K. Dãy số

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho dãy gồm $n$ số nguyên $a_1, a_2, \dots, a_n$ và số nguyên dương $L$ ($1 \le L \le n$). Hãy tìm một dãy con gồm các phần tử liên tiếp có độ dài $s$ ($L \le s$) có tổng các phần tử là lớn nhất.

### Input
- Dòng đầu tiên gồm hai số nguyên $n, L$ ($1 \le n \le 10^5$, $1 \le L \le n$).
- Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \dots, a_n$ ($|a_i| \le 10^9$).

### Output
- Gồm một dòng chứa một số nguyên duy nhất là tổng lớn nhất của dãy con tìm được thoả mãn điều kiện.

### Scoring
- $30\%$ số test: $n \le 100$.
- $30\%$ số test: $n \le 5000$.
- $40\%$ số test còn lại: Không có điều kiện gì thêm.

### Example
| input | output |
| :--- | :--- |
| 5 2<br>1 3 -1 5 -1 | 8 |

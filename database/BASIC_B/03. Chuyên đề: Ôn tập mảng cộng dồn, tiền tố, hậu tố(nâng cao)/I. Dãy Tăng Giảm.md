# I. Dãy Tăng Giảm

- **Time limit per test:** 2 seconds
- **Memory limit per test:** 256 megabytes

Một dãy số được gọi là dãy tăng giảm khi và chỉ khi tồn tại một vị trí $i$ ($1 < i < n$) sao cho:
$a_1 < a_2 < \dots < a_{i-1} < a_i > a_{i+1} > \dots > a_n$

**Yêu cầu:** Cho một dãy số, hãy tìm dãy con liên tiếp dài nhất là dãy tăng giảm.

### Input
- Dòng đầu tiên gồm 1 số nguyên $n$ ($n \le 10^7$).
- Dòng thứ 2 gồm $n$ số nguyên $a_1, a_2, \dots, a_n$ ($|a_i| \le 10^9$).

### Output
- Độ dài của dãy con liên tiếp dài nhất tìm được.

### Example
| input | output |
| :--- | :--- |
| 4<br>1 3 2 4 | 3 |

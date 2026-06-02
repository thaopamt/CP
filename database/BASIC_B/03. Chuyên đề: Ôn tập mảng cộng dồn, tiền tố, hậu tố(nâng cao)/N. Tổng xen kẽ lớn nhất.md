# N. Tổng xen kẽ lớn nhất

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho một dãy $n$ số $a_1, a_2, \dots, a_n$ ($n \le 10^6$). Yêu cầu tìm tổng xen kẽ lớn nhất trong dãy con từ chỉ số $l$ đến $r$ sao cho:
$S(l, r) = a_l - a_{l+1} + a_{l+2} - a_{l+3} + \dots \pm a_r$

**Yêu cầu:** Tìm tổng xen kẽ lớn nhất trong dãy $a_1, a_2, \dots, a_n$.

### Input
- Dòng đầu tiên chứa số nguyên $n$ ($1 \le n \le 10^6$).
- Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \dots, a_n$.

### Output
- In ra tổng xen kẽ lớn nhất có thể tìm được.

### Scoring
- $50\%$ số điểm khi $n \le 5000$.
- $50\%$ số điểm không có ràng buộc gì thêm.

### Example
| input | output |
| :--- | :--- |
| 4<br>3 7 1 5 | 11 |

### Note
- Đoạn lớn nhất là $7 - 1 + 5$.

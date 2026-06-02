# F. Hiệu lớn nhất

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho số nguyên dương $n$ và dãy $a$ chứa $n$ số nguyên dương $a_1, a_2, \dots, a_n$. Hãy tìm hai chỉ số $i, j$ sao cho hiệu $a_j - a_i$ là lớn nhất ($1 \le i < j \le n$).

### Input
- Dòng đầu tiên chứa số nguyên dương $n$ ($1 \le n \le 10^5$).
- Dòng tiếp theo chứa $n$ số nguyên dương $a_i$ ($|a_i| \le 10^9$).

### Output
- Ghi ra hiệu lớn nhất có thể.

### Example
| input | output |
| :--- | :--- |
| 3<br>1 2 3 | 2 |

### Note
Giải thích ví dụ: Dãy số $A = \{1, 2, 3\}$. Các cặp $(i, j)$ thỏa mãn $1 \le i < j \le 3$ là:
- $i = 1, j = 2 \Rightarrow a_2 - a_1 = 2 - 1 = 1$.
- $i = 1, j = 3 \Rightarrow a_3 - a_1 = 3 - 1 = 2$.
- $i = 2, j = 3 \Rightarrow a_3 - a_2 = 3 - 2 = 1$.

Hiệu lớn nhất tìm được là 2.

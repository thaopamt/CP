# E. Bộ ba số (THT C2 Đà Nẵng 2022)

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho dãy gồm $N$ ($1 \le N \le 10^6$) số nguyên $A_1, A_2, \dots, A_N$ ($0 < A_i \le 10^5$).

Với bộ ba số $(i, j, k)$ trong đó $1 \le i < j < k \le N$ hãy tìm giá trị $S = 3A_i + 2A_j - 5A_k$ sao cho $S$ đạt giá trị lớn nhất.

### Input
- Dòng đầu tiên chứa số nguyên $N$.
- Dòng thứ hai chứa $N$ số nguyên $A_1, A_2, \dots, A_N$ giữa các số cách nhau một khoảng trắng.

### Output
- Một số duy nhất là số $S$ lớn nhất tìm được.

### Scoring
- Subtask 1 ($20\%$ số điểm): $N \le 100$.
- Subtask 2 ($40\%$ số điểm): $N \le 5 \times 10^3$.
- Subtask 3 ($40\%$ số điểm): $N \le 10^6$.

### Example
| input | output |
| :--- | :--- |
| 10<br>4 9 7 9 4 3 2 9 15 6 | 35 |

### Note
- 3 giá trị số cần tìm để $S$ đạt giá trị lớn nhất lần lượt là $9, 9$ và $2$ nằm ở 3 vị trí là $2, 4$ và $7$.

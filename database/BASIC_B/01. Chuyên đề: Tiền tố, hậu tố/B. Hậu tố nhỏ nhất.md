# B. Hậu tố nhỏ nhất

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho một mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$ và có $Q$ truy vấn gồm $X_1, X_2, \dots, X_Q$ hỏi số nhỏ nhất nằm trong phạm vi từ $X_i$ tới $n$.

### Input
- Dòng đầu chứa số nguyên $N$ ($1 \le N \le 10^5$, $1 \le Q \le 10^5$).
- Dòng thứ hai chứa $N$ số nguyên $A_1, A_2, \dots, A_N$ ($-10^{18} \le A_i \le 10^{18}$).
- Dòng thứ ba chứa số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo, mỗi dòng ghi 1 số $x$ ($1 \le x \le n$).

### Output
- Gồm $Q$ dòng, mỗi dòng in ra số nhỏ nhất nằm trong phạm vi từ $x$ tới $n$.

### Example
| input | output |
| :--- | :--- |
| 5<br>-2 5 4 6 3<br>3<br>1<br>3<br>5 | -2<br>3<br>3 |

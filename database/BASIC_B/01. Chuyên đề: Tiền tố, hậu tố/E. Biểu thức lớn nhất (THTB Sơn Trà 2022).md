# E. Biểu thức lớn nhất (THTB Sơn Trà 2022)

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho dãy số nguyên gồm $n$ phần tử $a_1, a_2, \dots, a_n$.

**Yêu cầu:** Tìm bộ ba chỉ số $i < j < k$ sao cho $a_i - a_j + a_k$ là lớn nhất.

### Input
- Dòng đầu tiên chứa số $n$ ($3 \le n \le 10^5$).
- Dòng tiếp theo chứa $n$ số nguyên $a_1, a_2, \dots, a_n$ ($-10^9 \le a_i \le 10^9$).

### Output
- Ghi ra một số nguyên duy nhất là giá trị lớn nhất của bài toán.

### Scoring
- 50% số test ứng với 50% số điểm bài toán có $N \le 100$.
- 50% số test còn lại ứng với 50% số điểm còn lại có $N \le 10^5$.

### Example
| input | output |
| :--- | :--- |
| 5<br>1 2 3 4 5 | 4 |

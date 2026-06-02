# L. CSES - Subarray Divisibility

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho một mảng gồm $n$ số nguyên, nhiệm vụ của bạn là đếm số lượng đoạn con trong đó tổng các giá trị chia hết cho $n$.

### Input
- Dòng đầu vào đầu tiên chứa một số nguyên $n$ là kích thước của mảng ($1 \le n \le 2 \times 10^5$).
- Dòng tiếp theo chứa $n$ số nguyên $x_1, x_2, \dots, x_n$ là nội dung của mảng ($-10^9 \le x_i \le 10^9$).

### Output
- In ra một số nguyên duy nhất là số lượng đoạn con có tổng chia hết cho $n$.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 1 2 7 4 | 1 |

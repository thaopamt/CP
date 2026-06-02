# D. Đoạn con dài nhất chia hết cho K

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho dãy gồm $N$ số nguyên dương và một số nguyên $K$. Bạn hãy giúp Tèo tìm ra đoạn con dài nhất gồm các phần tử liên tiếp sao cho tổng các phần tử này chia hết cho $K$.

### Input
- Dòng đầu tiên chứa hai số nguyên dương $N$ và $K$ ($1 \le N, K \le 10^5$).
- Dòng thứ hai chứa dãy số gồm $N$ phần tử $A_1, A_2, \dots, A_N$ ($0 \le A_i \le 10^9$).

### Output
- Là một số nguyên xác định độ dài lớn nhất của đoạn con tìm được. Nếu không có đoạn con nào thỏa mãn, in ra $0$.

### Example
| input | output |
| :--- | :--- |
| 9 4<br>3 9 9 5 1 1 10 3 5 | 6 |

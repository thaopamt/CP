# F. Dãy số (THTB Vòng Khu vực 2021)

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Bob gửi cho Alice một dãy số nguyên gồm $N$ phần tử: $A_1, A_2, \dots, A_N$.

Đây là thông tin về một kho báu. Một đoạn con $(L, R)$ của dãy là một dãy gồm các phần tử liên tiếp $A_L, A_{L+1}, \dots, A_R$ với $1 \le L < R \le N$, đoạn con $(L, R)$ được gọi là chứa thông tin quan trọng nhất nếu:
- Phần tử đầu tiên bằng phần tử cuối cùng ($A_L = A_R$).
- Tổng các phần tử của đoạn là lớn nhất có thể.

**Yêu cầu:** Hãy giúp Alice tìm đoạn con chứa thông tin quan trọng nhất.

### Input
- Dòng thứ nhất chứa số nguyên dương $N$.
- Dòng thứ hai chứa số nguyên $A_1, A_2, \dots, A_N$ ($|A_i| \le 10^9, 1 \le i \le N$).

### Output
- Ghi ra một số nguyên duy nhất là tổng của đoạn con chứa thông tin quan trọng nhất.

### Scoring
- Subtask 1 ($40\%$ số điểm): $N \le 10^2$.
- Subtask 2 ($30\%$ số điểm): $N \le 10^3$.
- Subtask 3 ($30\%$ số điểm): $N \le 10^5$.

### Example
| input | output |
| :--- | :--- |
| 7<br>3 3 3 3 1 11 1 | 13 |

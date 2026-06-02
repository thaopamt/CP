# K. Số hoàn hảo

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Số hoàn hảo là số mà tổng các ước của nó (bao gồm cả chính nó) bằng $2$ lần chính nó. 

Ví dụ: $6$ là số hoàn hảo vì $6$ có các ước số là $1, 2, 3, 6$. Tổng các ước là $1 + 2 + 3 + 6 = 12 = 2 \times 6$.

### Yêu cầu
Viết chương trình nhập vào một số nguyên dương $n$. In ra chữ 'YES' nếu $n$ là số hoàn hảo, ngược lại ghi chữ 'NO'.

### Input
- Một số nguyên dương $n$ ($n \le 10^{12}$).

### Output
- In ra chữ 'YES' nếu $n$ là số hoàn hảo, ngược lại 'NO'.

### Examples
| input | output |
| :--- | :--- |
| 6 | YES |
| 36 | NO |

### Note
Ví dụ $n = 10$ thì có các ước số: $1, 2, 5, 10$. Tổng ước là $1 + 2 + 5 + 10 = 18 \neq 20$, vì thế $10$ không phải số hoàn hảo.

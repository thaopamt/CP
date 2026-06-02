# G. Một lần sửa GCD

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho một dãy số nguyên dương gồm $n$ phần tử $a_1, a_2, \dots, a_n$. Bạn cần chọn một phần tử bất kỳ trong dãy và thay phần tử đó bằng một số nguyên khác trong khoảng từ $1$ đến $10^9$ (hoặc có thể giữ nguyên giá trị). Hãy tìm ước chung lớn nhất lớn nhất có thể của dãy mới tạo thành.

### Input
- Dòng đầu tiên chứa số nguyên dương $n$ là số lượng phần tử trong dãy ($2 \le n \le 10^5$).
- Dòng thứ hai chứa $n$ số nguyên dương, số thứ $i$ là phần tử $a_i$ ($1 \le a_i \le 10^9$).

### Output
- Ghi ra một số nguyên dương duy nhất là kết quả của bài toán.

### Example
| input | output |
| :--- | :--- |
| 3<br>7 6 8 | 2 |
| 3<br>12 15 18 | 6 |

### Note
**Giải thích ví dụ 1:**
Dãy số ban đầu: $(7, 6, 8)$. Ta có thể thay số $(7)$ bằng số $(2)$ (hoặc một bội số của $(2)$). Khi đó dãy trở thành $(2, 6, 8)$. Ước chung lớn nhất của dãy là $2$.

**Giải thích ví dụ 2:**
Dãy số ban đầu: $(12, 15, 18)$. Ta thay số $(15)$ bằng số $(6)$. Dãy trở thành $(12, 6, 18)$. Ước chung lớn nhất của dãy là $6$.

(Lưu ý: Nếu giữ nguyên dãy ban đầu thì ước chung lớn nhất chỉ là $3$. Nếu thay số $(12)$ hoặc $(18)$ thì kết quả cũng không vượt quá $3$).

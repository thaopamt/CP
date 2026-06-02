# D. Help Conan 12!

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Năm ngoái Conan chỉ mới bước vào học Tin học thật sự. Thế nhưng anh ta bị đàn em là Như Quỳnh thách đố bài toán sau:

Cho $T \le 10^5$. Mỗi dòng của $T$ có 1 số $N$ ($N \le 10^5$). Dãy số $A$ được xây dựng như sau:
- $A[0] = 0$.
- $A[1] = 1$.
- $A[2i] = A[i]$.
- $A[2i + 1] = A[i] + A[i + 1]$.

**Yêu cầu:** Nhiệm vụ của bạn là tìm số lớn nhất của dãy $A$ từ $1$ tới $N$.

### Input
- Dòng đầu tiên là số $T \le 10^5$.
- $T$ dòng sau, mỗi dòng là 1 số $N$ ($N \le 10^5$).

### Output
- Có $T$ dòng tương ứng với giá trị lớn nhất của các đoạn.

### Example
| input | output |
| :--- | :--- |
| 2<br>5<br>10 | 3<br>4 |

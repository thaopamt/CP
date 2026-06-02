# H. Hai nửa đồng nhất

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho dãy số $A$ gồm $n$ phần tử nguyên dương $a_1, a_2, \dots, a_n$, trong đó mỗi $a_i$ chỉ nhận giá trị $1$ hoặc $2$.

Một đoạn con $[l, r]$ (liên tiếp) được gọi là **hợp lệ** nếu ta chia nó thành hai nửa liên tiếp có cùng độ dài, mỗi nửa chỉ chứa đúng một giá trị duy nhất (tức là nửa bên trái toàn là $1$ hoặc toàn là $2$, nửa bên phải cũng toàn là $1$ hoặc toàn là $2$).

Ví dụ: đoạn con $[2, 2, 2, 1, 1, 1]$ là hợp lệ (ba số $2$ rồi ba số $1$), nhưng đoạn con $[1, 2, 1, 1, 2, 2]$ là không hợp lệ.

**Yêu cầu:** Hãy tìm độ dài lớn nhất của một đoạn con hợp lệ.

### Input
- Dòng đầu chứa một số nguyên $n$ ($2 \le n \le 10^5$).
- Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \dots, a_n$ ($a_i = 1$ hoặc $a_i = 2$), mỗi giá trị xuất hiện ít nhất một lần.

### Output
- Ghi ra một số nguyên — độ dài đoạn con hợp lệ dài nhất.

### Example
| input | output |
| :--- | :--- |
| 9<br>2 2 2 1 1 1 2 2 2 | 6 |

### Note
Trong ví dụ, dãy có các đoạn các phần tử giống nhau liên tiếp có độ dài lần lượt là $[3, 3, 3]$.
- Ghép hai đoạn đầu ta được đoạn con $[2, 2, 2, 1, 1, 1]$ có hai nửa đều dài $3$, độ dài là $6$ và hợp lệ.
- Ghép hai đoạn sau ta được đoạn con $[1, 1, 1, 2, 2, 2]$ cũng dài $6$ và hợp lệ.

Không có đoạn con hợp lệ nào dài hơn $6$, vì vậy đáp án là $6$.

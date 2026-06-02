# M. Đắp núi

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Trong một trò chơi xây địa hình 2D, một khu vực $A$ gồm $n$ vùng liên tiếp có độ cao là $A_1, A_2, \dots, A_n$.

Khu vực $A$ được gọi là một ngọn núi khi sườn bên trái của nó tăng đơn điệu và sườn bên phải của nó giảm đơn điệu. Nghĩa là, khi $A$ là ngọn núi với đỉnh núi là vùng có chiều cao $A_x$, thì $n$ vùng liên tiếp của $A$ phải có độ cao đảm bảo $A_1 < A_2 < \dots < A_x$ và $A_x > \dots > A_{n-1} > A_n$ ($1 < x < n$). Hai vùng đầu tiên và cuối cùng của khu vực $A$ không được là đỉnh núi.

Người chơi có thể tăng độ cao của các vùng để đắp $A$ thành một ngọn núi. Với mỗi vùng $A_i$ ($1 \le i \le n$), việc tăng độ cao lên 1 đơn vị sẽ tốn chi phí là 1 điểm.

**Yêu cầu:** Hãy viết chương trình tính chi phí tối thiểu để đắp khu vực $A$ thành một ngọn núi.

### Input
- Dòng đầu chứa số nguyên $n$ ($3 \le n \le 10^5$).
- Dòng tiếp theo gồm $n$ số nguyên $A_1, A_2, \dots, A_n$ ($0 \le A_i \le 10^9, 1 \le i \le n$). Các số trên cùng một dòng cách nhau bởi dấu cách.

### Output
- In ra một số nguyên duy nhất cho biết chi phí tối thiểu để đắp khu vực $A$ thành một ngọn núi.

### Scoring
- $60\%$ số điểm của bài: $3 \le n \le 10^3$.
- $40\%$ số điểm của bài: $3 \le n \le 10^5$.

### Example
| input | output |
| :--- | :--- |
| 5<br>1 1 1 1 1 | 4 |
| 6<br>3 4 5 6 5 1 | 0 |

### Note
- **Test ví dụ 1:** Có nhiều phương án để đắp thành một ngọn núi:
  - Có thể đắp được một ngọn núi với chiều cao: `1 2 3 2 1`. Chi phí của nó là $1 + 1 + 2 = 4$.
  - Có thể đắp được một ngọn núi với chiều cao: `1 4 3 2 1`. Chi phí của nó cao hơn: $3 + 2 + 1 = 6$.
- **Test ví dụ 2:** Vì $A$ đã là một ngọn núi nên không cần đắp thêm. Chi phí là $0$.

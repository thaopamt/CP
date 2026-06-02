# G. Ghép đội (GL THT 23-24)

- **Time limit per test:** 4 seconds
- **Memory limit per test:** 1024 megabytes

Có $n$ người tham gia một cuộc thi. Người thứ $i$ có chỉ số sức mạnh là $s_i$. Ban tổ chức muốn thực hiện ghép hai người thành một đội để thu được $\lfloor \frac{n}{2} \rfloor$ đội thi (nếu $n$ lẻ thì sẽ có một người bị loại) sao cho chênh lệch sức mạnh tối đa của hai đội bất kỳ là nhỏ nhất. Biết rằng, chỉ số sức mạnh của một đội gồm hai người $i, j$ là $s_i + s_j$. Hãy giúp ban tổ chức tìm ra cách ghép tối ưu.

### Input
- Dòng đầu tiên gồm một số nguyên dương $n$ ($n \le 10^7$) — số người trong cuộc thi.
- Dòng tiếp theo gồm $n$ số nguyên $s_1, s_2, \dots, s_n$ ($0 \le s_i \le 10^9$).

### Output
- Một dòng duy nhất gồm chênh lệch sức mạnh nhỏ nhất có thể thu được.

### Example
| input | output |
| :--- | :--- |
| 6<br>1 1 1 2 2 3 | 1 |

### Note
- Cách ghép tốt nhất là ghép các cặp chỉ số phần tử: $(1, 6)$, $(2, 5)$, $(3, 4)$. Các đội có chỉ số sức mạnh lần lượt là $3, 3, 4$. Chênh lệch lớn nhất giữa sức mạnh của hai đội bất kỳ là $4 - 3 = 1$.

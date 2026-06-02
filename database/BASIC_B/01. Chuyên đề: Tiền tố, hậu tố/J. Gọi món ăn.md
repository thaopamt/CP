# J. Gọi món ăn

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Nam đang rất đói và quyết định ăn trưa tại căng tin của Code Dream. Căng tin có $N$ món ăn khác nhau, mỗi món ăn có hai giá trị đặc biệt: món ăn thứ $i$ có hai giá trị $A_i$ và $B_i$, trong đó khách hàng phải trả $A_i$ nếu là món ăn đầu tiên được gọi trong bữa, còn trường hợp còn lại thì món đó có giá $B_i$.

Vì rất đói nên Nam không thể quyết định nên chọn những món nào để ăn. Anh quyết định hỏi bạn rằng nếu ăn đúng $k$ món ($1 \le k \le N$) thì phải trả số tiền ít nhất là bao nhiêu?

### Input
- Dòng đầu tiên ghi số nguyên dương $N$ ($2 \le N \le 5 \times 10^5$) — số lượng các món ăn.
- $N$ dòng tiếp theo, dòng thứ $i$ chứa hai số nguyên dương $A_i, B_i$ ($1 \le A_i, B_i \le 10^9$) — giá của món thứ $i$ theo mô tả ở trên.

### Output
- Ghi $N$ dòng, dòng thứ $k$ ghi số tiền tối thiểu phải trả khi ăn đúng $k$ món ăn trong số $N$ món ăn của căng tin.

### Example
| input | output |
| :--- | :--- |
| 3<br>14 5<br>9 3<br>5 8 | 5<br>8<br>13 |
| 5<br>1000 1000<br>1000 1000<br>1000 1000<br>1000 1000<br>1000 1000 | 1000<br>2000<br>3000<br>4000<br>5000 |

### Note
Với ví dụ đầu tiên:
- $k = 1$: chọn món ăn thứ 3, tổng tiền bằng $5$.
- $k = 2$: chọn món ăn thứ 2 và 3, tổng tiền bằng $3 + 5 = 8$.
- $k = 3$: chọn cả ba món, tổng tiền bằng $5 + 3 + 5 = 13$.

### Scoring
- Có 30% số test tương ứng với $N \le 1000$;
- Có 30% số test tiếp theo với tất cả các phần tử của dãy $A$ và $B$ bằng nhau;
- Có 40% số test còn lại không có ràng buộc gì thêm.

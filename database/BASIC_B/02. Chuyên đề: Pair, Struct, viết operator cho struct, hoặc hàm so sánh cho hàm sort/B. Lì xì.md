# B. Lì xì

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Nhân dịp Tết, ba bé Bo chuẩn bị $n$ túi lì xì cho bé Bo. Trong túi thứ $i$ có số tiền là $a_i$ và một số nguyên $b_i$ ($b_i \ge 0$). Nếu $b_i > 0$ thì bé Bo được phép chọn thêm $b_i$ túi lì xì khác. Việc chọn thêm này là tích lũy.

Đầu tiên, bé Bo chọn một túi bất kỳ, sau đó giả sử bé Bo đang có tổng số tiền là $A$ và số túi được phép chọn thêm là $B$ ($B > 0$). Nếu bé Bo chọn thêm túi thứ $i$ thì tổng số tiền là $A + a_i$ và tổng số túi được chọn thêm là $B - 1 + b_i$. Cứ như vậy cho đến khi không được phép chọn thêm ($B = 0$) hoặc đã chọn hết $n$ túi.

Bạn hãy giúp bé Bo xác định thứ tự chọn túi sao cho tổng số tiền bé có được là lớn nhất nhé.

### Input
- Dòng đầu tiên là số nguyên $n$ ($1 \le n \le 100$).
- Trong $n$ dòng tiếp theo, dòng thứ $i$ gồm 2 số nguyên $a_i$ và $b_i$ cách nhau một khoảng trắng ($1 \le a_i \le 100$, $0 \le b_i \le 100$).

### Output
- Là số nguyên xác định số tiền nhiều nhất mà bé Bo có được.

### Example
| input | output |
| :--- | :--- |
| 2<br>1 0<br>2 0 | 2 |
| 3<br>1 0<br>2 0<br>0 2 | 3 |
| 5<br>0 0<br>2 0<br>2 0<br>3 0<br>5 1 | 8 |

### Note
- Trong test 1, do chỉ chọn được 1 túi nên chọn túi có số tiền nhiều nhất là 2.
- Trong test 2, đầu tiên chọn túi 3, sau đó chọn túi 1 và tiếp theo là túi 2.

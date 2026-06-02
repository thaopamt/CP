# G. Tập cạnh kề

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho $n$ người, và $m$ quan hệ có dạng $u, v$ nghĩa là người $u$ là bạn của người $v$. (Lưu ý rằng $u$ là bạn của $v$ thì $v$ cũng là bạn của $u$).

Hãy in ra tập hợp bạn của mỗi người theo thứ tự tăng dần.

Lưu ý: Cặp bạn có thể bị lặp lại.

### Input
- Dòng đầu tiên chứa hai số tự nhiên $n, m$.
- $m$ dòng tiếp theo chứa hai số tự nhiên $u, v$ ($1 \le u, v \le n$).

### Output
- Gồm $n$ dòng, dòng thứ $i$ ghi tập hợp bạn bè của người $i$ theo thứ tự tăng dần (các phần tử cách nhau bởi khoảng trắng). Nếu một người không có bạn bè, in ra dòng trống.

### Scoring
- Subtask 1 ($60\%$ số điểm): $1 \le n, m \le 10^3$.
- Subtask 2 ($100\%$ số điểm): $1 \le n, m \le 10^5$.

### Example
| input | output |
| :--- | :--- |
| 3 3<br>1 2<br>1 3<br>1 3 | 2 3<br>1<br>1 |

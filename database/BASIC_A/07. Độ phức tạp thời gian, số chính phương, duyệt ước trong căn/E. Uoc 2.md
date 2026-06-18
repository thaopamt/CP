# E. Uoc 2

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Cho số nguyên dương $n$. Đếm số ước của $n$ có ước số là 2.

### Input
- Dòng đầu chứa số $t$ ($t \le 100$) - số test.
- Mỗi test chứa 1 số nguyên dương $n$ ($n \le 10^9$).

### Output
- Gồm $t$ dòng, mỗi dòng chứa số ước số thỏa mãn đề bài cho test tương ứng.

### Example
| input | output |
| :--- | :--- |
| 2<br>9<br>8 | 0<br>3 |

### Note
- 9 có các ước như sau ${1, 3, 9}$ và không hề có bất kỳ ước nào có ước số là 2 nên đáp án là 0.
- 8 có các ước như sau ${1, 2, 4, 8}$ và ba ước 2, 4, 8 đều có ước số là 2 nên đáp án là 3.

# G. Kiểm tra tam giác

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Viết chương trình nhập vào ba số nguyên dương $a, b, c$.

- In chữ "DEU" nếu 3 số là chiều dài của 3 cạnh tam giác đều
- In chữ "CAN" nếu 3 số là chiều dài của 3 cạnh tam giác cân
- In chữ "VUONG" nếu 3 số là chiều dài của 3 cạnh tam giác vuông
- Ngược lại thì in chữ "THUONG"

Đề đảm bảo $a, b, c$ là 3 cạnh của 1 tam giác. Nếu như $a, b, c$ là tam giác đều thì in ra DEU (không in ra CAN).

### Input
- Ba số nguyên dương $1 \le a, b, c \le 10^9$.

### Output
- In ra DEU/CAN/VUONG/THUONG.

### Examples
| input | output |
| :--- | :--- |
| 3 4 5 | VUONG |
| 4 5 4 | CAN |
| 6 6 6 | DEU |
| 7 9 8 | THUONG |

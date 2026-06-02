# F. Sắp xếp học sinh

- **Time limit per test:** 2 seconds
- **Memory limit per test:** 256 megabytes

Đến dịp cuối năm, trường L cần tổng hợp một chút thông tin học sinh để tổng kết.
Bạn được cho tên, điểm 3 môn Toán, Văn, Anh của $n$ học sinh.

### Input
- Dòng đầu tiên chứa một số nguyên dương $n$ ($n \le 10^5$) là số học sinh.
- Trong $n$ dòng tiếp theo, mỗi dòng chứa chuỗi $s_i$ và 3 số nguyên $a_i, b_i, c_i$ lần lượt là tên, điểm Toán, Văn, Anh của học sinh thứ $i$ ($|s_i| < 10$, $0 \le a_i, b_i, c_i \le 10$).

### Output
Xuất ra 3 dòng:
- **Dòng 1:** Tên các học sinh theo thứ tự từ điển.
- **Dòng 2:** Tên các học sinh theo thứ tự điểm Toán giảm dần, nếu bằng nhau thì ưu tiên tên nhỏ hơn (theo thứ tự từ điển) in trước.
- **Dòng 3:** Tên các học sinh theo thứ tự điểm trung bình 3 môn tăng dần, nếu bằng nhau thì ưu tiên tên nhỏ hơn (theo thứ tự từ điển) in trước.

Các tên trên mỗi dòng được in cách nhau bởi khoảng trắng.

### Example
| input | output |
| :--- | :--- |
| 4<br>Tan 10 2 3<br>Khang 6 9 10<br>Hieu 4 8 7<br>Khoi 3 2 1 | Hieu Khang Khoi Tan<br>Tan Khang Hieu Khoi<br>Khoi Tan Hieu Khang |

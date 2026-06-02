# H. Chạy bộ

- **Time limit per test:** 2 seconds
- **Memory limit per test:** 256 megabytes

Hôm nay là một ngày Chủ Nhật đẹp trời, shiba quyết định sẽ đi tập chạy quanh thành phố của mình để tăng cường sức khỏe sau 7749 ngày ngồi gõ code.

Thành phố nơi Thanh Nguyên sống có $n$ cửa hàng bán đồ gia dụng, được đánh số từ $1$ tới $n$. Shiba quyết định sẽ chạy bộ từ cửa hàng thứ $1$ tới cửa hàng thứ $n$ và sẽ mua các vật phẩm trong các cửa hàng. Cửa hàng thứ $i$ có bán loại vật phẩm thứ $a_i$ với giá tiền $c_i$ (các cửa hàng khác nhau có thể bán cùng một loại vật phẩm). Trên đường chạy của mình, shiba cần mua $m$ vật phẩm. Tại mỗi cửa hàng, cậu ấy quyết định sẽ mua vật phẩm đó hay không, nếu không thì cậu ấy sẽ bỏ qua cửa hàng đó và không thể mua vật phẩm ở cửa hàng đó nữa.

Hỏi số tiền ít nhất mà shiba cần chi để mua đủ các vật phẩm theo yêu cầu là bao nhiêu?

### Input
- Dòng thứ nhất chứa hai số nguyên dương $n, m$ ($n, m \le 10^6$, $m \le n$).
- $n$ dòng tiếp theo, mỗi dòng chứa hai số nguyên dương $a_i$ và $c_i$ ($a_i \le n, c_i \le 10^9$).
- Dòng thứ $n + 1$ chứa $m$ số nguyên, là các vật phẩm cần mua. Các số có thể trùng nhau.

### Output
- In ra một số nguyên duy nhất là số tiền ít nhất shiba phải chi. Nếu không mua được đủ theo yêu cầu thì ghi ra số nguyên $-1$.

### Example
| input | output |
| :--- | :--- |
| 6 4<br>1 2<br>1 3<br>1 4<br>1 5<br>2 2<br>2 3<br>1 1 2 1 | 11 |

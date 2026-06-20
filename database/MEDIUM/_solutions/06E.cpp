// 06E. Chia mảng thành 3 đoạn liên tiếp không rỗng có tổng bằng nhau.
// Đếm số cách. total phải chia hết cho 3. Với mỗi điểm cắt thứ hai j,
// cộng số điểm cắt thứ nhất i < j có tiền tố = total/3.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    if (total % 3 != 0) { cout << 0 << '\n'; return 0; }
    long long part = total / 3;

    long long pre = 0, ans = 0, waysFirst = 0;
    // duyệt j từ 2..n-1 là vị trí kết thúc đoạn 2; i (1..j-1) là kết thúc đoạn 1
    for (int j = 1; j <= n - 1; j++) {
        pre += a[j];
        // điểm cắt thứ hai hợp lệ tại j khi tiền tố = 2*part, ghép với waysFirst
        if (j >= 2 && pre == 2 * part) ans += waysFirst;
        // cập nhật số điểm cắt thứ nhất sau khi xét j làm điểm thứ hai
        if (pre == part) waysFirst++;
    }
    cout << ans << '\n';
    return 0;
}

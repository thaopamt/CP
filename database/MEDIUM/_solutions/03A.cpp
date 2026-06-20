// 03A. Điểm chia mảng cân bằng: đếm số điểm cắt k (1..n-1) chia mảng thành
// hai đoạn liên tiếp có tổng bằng nhau.
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

    long long pre = 0;
    int ans = 0;
    for (int k = 1; k <= n - 1; k++) {
        pre += a[k];                          // tổng A[1..k]
        if (pre == total - pre) ans++;        // hai phần bằng nhau
    }
    cout << ans << '\n';
    return 0;
}

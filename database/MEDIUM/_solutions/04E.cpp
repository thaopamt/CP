// 04E. Cập nhật đoạn rồi truy vấn tổng:
// - U phép cộng v vào đoạn [l, r] (mảng ban đầu toàn 0) -> dùng mảng hiệu.
// - Sau đó Q truy vấn tổng đoạn [l, r] -> dùng mảng tiền tố của mảng cuối.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> diff(n + 2, 0);
    int u; cin >> u;
    while (u--) {
        int l, r; long long v;
        cin >> l >> r >> v;
        diff[l] += v;
        diff[r + 1] -= v;
    }
    // dựng mảng cuối rồi lấy tiền tố để trả lời truy vấn tổng
    vector<long long> pre(n + 1, 0);
    long long cur = 0;
    for (int i = 1; i <= n; i++) {
        cur += diff[i];
        pre[i] = pre[i - 1] + cur;
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << pre[r] - pre[l - 1] << '\n';
    }
    return 0;
}

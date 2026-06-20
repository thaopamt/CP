// 01B. Truy vấn tổng đoạn [l, r] bằng mảng tiền tố
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);          // pre[i] = tổng A[1..i], pre[0] = 0
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre[i] = pre[i - 1] + a;
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        // tổng A[l..r] = pre[r] - pre[l-1]
        cout << pre[r] - pre[l - 1] << '\n';
    }
    return 0;
}

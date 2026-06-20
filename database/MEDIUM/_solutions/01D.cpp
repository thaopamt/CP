// 01D. Tổng đoạn theo modulo M
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre[i] = pre[i - 1] + a;              // tiền tố thật (chưa lấy dư)
    }
    long long M; cin >> M;
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        long long s = pre[r] - pre[l - 1];
        // chuẩn hóa số dư về [0, M-1] vì tổng có thể âm
        long long res = ((s % M) + M) % M;
        cout << res << '\n';
    }
    return 0;
}

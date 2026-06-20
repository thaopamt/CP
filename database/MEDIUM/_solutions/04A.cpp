// 04A. Hiệu tổng đoạn của hai mảng: với mỗi truy vấn [l, r] in ra
// (tổng A[l..r] - tổng B[l..r]). Dùng hai mảng tiền tố.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pa(n + 1, 0), pb(n + 1, 0);
    for (int i = 1; i <= n; i++) { long long x; cin >> x; pa[i] = pa[i - 1] + x; }
    for (int i = 1; i <= n; i++) { long long x; cin >> x; pb[i] = pb[i - 1] + x; }

    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        long long sa = pa[r] - pa[l - 1];
        long long sb = pb[r] - pb[l - 1];
        cout << sa - sb << '\n';
    }
    return 0;
}

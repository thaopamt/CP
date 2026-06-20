// 04C. So sánh tổng hai đoạn [l1,r1] và [l2,r2].
// In 1 nếu đoạn 1 lớn hơn, 2 nếu đoạn 2 lớn hơn, 0 nếu bằng nhau.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);
    for (int i = 1; i <= n; i++) { long long x; cin >> x; pre[i] = pre[i - 1] + x; }

    int q; cin >> q;
    while (q--) {
        int l1, r1, l2, r2; cin >> l1 >> r1 >> l2 >> r2;
        long long s1 = pre[r1] - pre[l1 - 1];
        long long s2 = pre[r2] - pre[l2 - 1];
        cout << (s1 > s2 ? 1 : (s2 > s1 ? 2 : 0)) << '\n';
    }
    return 0;
}

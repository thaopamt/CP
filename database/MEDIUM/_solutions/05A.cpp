// 05A. Tiền tố nhỏ nhất: truy vấn min của A[1..x].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pmin(n + 1);            // pmin[i] = min A[1..i]
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pmin[i] = (i == 1) ? a : min(pmin[i - 1], a);
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << pmin[x] << '\n';
    }
    return 0;
}

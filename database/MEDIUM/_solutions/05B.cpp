// 05B. Hậu tố lớn nhất: truy vấn max của A[x..n].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> smax(n + 2);            // smax[i] = max A[i..n]
    {
        vector<long long> a(n + 1);
        for (int i = 1; i <= n; i++) cin >> a[i];
        smax[n + 1] = LLONG_MIN;
        for (int i = n; i >= 1; i--) smax[i] = max(smax[i + 1], a[i]);
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << smax[x] << '\n';
    }
    return 0;
}

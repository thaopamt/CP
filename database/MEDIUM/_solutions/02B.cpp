// 02B. Truy vấn tổng hậu tố từ vị trí x đến hết mảng
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> suf(n + 2, 0);          // suf[i] = A[i..n]
    {
        vector<long long> a(n + 1);
        for (int i = 1; i <= n; i++) cin >> a[i];
        for (int i = n; i >= 1; i--) suf[i] = suf[i + 1] + a[i];
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << suf[x] << '\n';
    }
    return 0;
}

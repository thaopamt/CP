// 05D. Tiền tố mảng nhị phân: đếm số bit 1 trong đoạn [l, r].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> ones(n + 1, 0);               // ones[i] = số bit 1 trong A[1..i]
    for (int i = 1; i <= n; i++) {
        int a; cin >> a;
        ones[i] = ones[i - 1] + a;            // a chỉ là 0 hoặc 1
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << ones[r] - ones[l - 1] << '\n';
    }
    return 0;
}

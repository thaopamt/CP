// 01E. Đếm số chẵn trong đoạn [l, r] bằng prefix count
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> cnt(n + 1, 0);                // cnt[i] = số phần tử chẵn trong A[1..i]
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        cnt[i] = cnt[i - 1] + (a % 2 == 0 ? 1 : 0);
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << cnt[r] - cnt[l - 1] << '\n';   // số chẵn trong [l, r]
    }
    return 0;
}

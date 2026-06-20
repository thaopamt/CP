// 02E. Đếm số phần tử dương trong hậu tố A[x..n]
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> pos(n + 2, 0);                // pos[i] = số phần tử > 0 trong A[i..n]
    {
        vector<long long> a(n + 1);
        for (int i = 1; i <= n; i++) cin >> a[i];
        for (int i = n; i >= 1; i--) pos[i] = pos[i + 1] + (a[i] > 0 ? 1 : 0);
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << pos[x] << '\n';
    }
    return 0;
}

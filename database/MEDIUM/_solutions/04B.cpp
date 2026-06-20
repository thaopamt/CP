// 04B. Đếm số phần tử chia hết cho K trong đoạn [l, r] bằng prefix count.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    long long K; cin >> K;

    vector<int> cnt(n + 1, 0);                // cnt[i] = số phần tử chia hết K trong A[1..i]
    for (int i = 1; i <= n; i++)
        cnt[i] = cnt[i - 1] + (a[i] % K == 0 ? 1 : 0);

    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << cnt[r] - cnt[l - 1] << '\n';
    }
    return 0;
}

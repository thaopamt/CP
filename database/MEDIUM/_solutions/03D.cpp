// 03D. Mảng tích trừ phần tử: B[i] = (tích mọi A[j], j != i) mod (1e9+7),
// dùng tích tiền tố và tích hậu tố.
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007LL;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    vector<long long> pre(n + 2, 1), suf(n + 2, 1);
    for (int i = 1; i <= n; i++) pre[i] = pre[i - 1] * (a[i] % MOD) % MOD;   // tích A[1..i]
    for (int i = n; i >= 1; i--) suf[i] = suf[i + 1] * (a[i] % MOD) % MOD;   // tích A[i..n]

    for (int i = 1; i <= n; i++) {
        long long res = pre[i - 1] * suf[i + 1] % MOD;   // bỏ A[i]
        cout << res << " \n"[i == n];
    }
    return 0;
}

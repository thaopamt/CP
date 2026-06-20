// 02A. Mảng hậu tố (suffix sum)
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    vector<long long> suf(n + 2, 0);          // suf[i] = A[i] + A[i+1] + ... + A[n]
    for (int i = n; i >= 1; i--) suf[i] = suf[i + 1] + a[i];

    for (int i = 1; i <= n; i++) cout << suf[i] << " \n"[i == n];
    return 0;
}

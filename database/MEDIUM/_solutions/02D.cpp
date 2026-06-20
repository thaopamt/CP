// 02D. So sánh tiền tố và hậu tố: đếm vị trí i mà tổng trái > tổng phải
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    long long pre = 0;
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        pre += a[i];                          // tổng A[1..i]
        long long right = total - pre;        // tổng A[i+1..n]
        if (pre > right) ans++;
    }
    cout << ans << '\n';
    return 0;
}

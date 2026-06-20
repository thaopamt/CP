// 02C. Tổng hậu tố lớn nhất
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    long long suf = 0, best = LLONG_MIN;
    for (int i = n; i >= 1; i--) {
        suf += a[i];                          // tổng hậu tố bắt đầu từ i
        best = max(best, suf);
    }
    cout << best << '\n';
    return 0;
}

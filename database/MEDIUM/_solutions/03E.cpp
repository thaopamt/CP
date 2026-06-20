// 03E. Chia đôi mảng sao cho chênh lệch tổng hai phần nhỏ nhất.
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
    long long best = LLONG_MAX;
    for (int k = 1; k <= n - 1; k++) {
        pre += a[k];                          // tổng trái A[1..k]
        long long diff = llabs(pre - (total - pre));
        best = min(best, diff);
    }
    cout << best << '\n';
    return 0;
}

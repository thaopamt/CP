// 03B. Xóa một phần tử để hai phía bằng nhau: đếm số chỉ số i (1..n) sao cho
// tổng A[1..i-1] == tổng A[i+1..n].
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

    long long pre = 0;                        // pre = tổng A[1..i-1]
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        long long left = pre;
        long long right = total - pre - a[i]; // tổng A[i+1..n]
        if (left == right) ans++;
        pre += a[i];
    }
    cout << ans << '\n';
    return 0;
}

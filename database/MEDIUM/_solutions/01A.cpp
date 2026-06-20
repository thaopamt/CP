// 01A. Mảng cộng dồn (prefix sum)
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    // pre[i] = A[1] + A[2] + ... + A[i]; dùng long long tránh tràn số
    long long sum = 0;
    for (int i = 1; i <= n; i++) {
        long long a;
        cin >> a;
        sum += a;                 // cộng dồn tới vị trí i
        cout << sum << " \n"[i == n];
    }
    return 0;
}

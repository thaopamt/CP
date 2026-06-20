// 01C. Tổng tiền tố lớn nhất (prefix sum với số âm)
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long sum = 0;
    long long best = LLONG_MIN;               // đáp án có thể âm khi mảng toàn số âm
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        sum += a;                             // tiền tố tới vị trí i
        best = max(best, sum);                // cập nhật tiền tố lớn nhất
    }
    cout << best << '\n';
    return 0;
}

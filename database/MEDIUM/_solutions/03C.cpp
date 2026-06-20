// 03C. Lợi nhuận lớn nhất: tìm max(A[j] - A[i]) với i < j, dùng prefix-min.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    long long minLeft = a[1];                 // giá nhỏ nhất trong A[1..j-1]
    long long best = LLONG_MIN;               // có thể âm nếu mảng giảm dần
    for (int j = 2; j <= n; j++) {
        best = max(best, a[j] - minLeft);     // bán ở j, mua ở vị trí nhỏ nhất trước đó
        minLeft = min(minLeft, a[j]);
    }
    cout << best << '\n';
    return 0;
}

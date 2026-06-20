// 05C. Đếm số cặp (i, j) i < j có tiền tố bằng nhau P[i] == P[j]
// (tương đương số đoạn con liên tiếp có tổng bằng 0). Dùng map đếm tiền tố.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    map<long long, long long> freq;
    freq[0] = 1;                              // tiền tố P[0] = 0
    long long pre = 0, ans = 0;
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre += a;
        ans += freq[pre];                     // mọi j trước có cùng tiền tố tạo 1 cặp
        freq[pre]++;
    }
    cout << ans << '\n';
    return 0;
}

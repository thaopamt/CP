// 06A. Đếm số đoạn con liên tiếp có tổng bằng K.
// Dùng hashmap đếm số lần xuất hiện của tiền tố: với mỗi r, số l hợp lệ
// là số lần tiền tố (pre[r] - K) đã xuất hiện.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n; long long K;
    cin >> n >> K;
    unordered_map<long long, long long> freq;
    freq.reserve(n * 2);
    freq[0] = 1;                              // tiền tố rỗng = 0
    long long pre = 0, ans = 0;
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre += a;
        auto it = freq.find(pre - K);         // cần tiền tố trước = pre - K
        if (it != freq.end()) ans += it->second;
        freq[pre]++;
    }
    cout << ans << '\n';
    return 0;
}

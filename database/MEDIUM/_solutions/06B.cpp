// 06B. Đếm số đoạn con liên tiếp có tổng chia hết cho K.
// Hai tiền tố cùng số dư khi chia K tạo thành một đoạn con chia hết cho K.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n; long long K;
    cin >> n >> K;
    vector<long long> cnt(K, 0);              // đếm số tiền tố theo từng số dư
    cnt[0] = 1;                               // tiền tố rỗng có số dư 0
    long long pre = 0, ans = 0;
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre += a;
        long long r = ((pre % K) + K) % K;    // chuẩn hóa số dư về [0, K-1]
        ans += cnt[r];                        // ghép với mọi tiền tố cùng số dư
        cnt[r]++;
    }
    cout << ans << '\n';
    return 0;
}

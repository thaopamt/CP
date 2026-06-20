// 04D. Mảng hiệu (difference array): thực hiện M phép cộng v vào đoạn [l, r]
// trên mảng ban đầu toàn 0, in mảng cuối cùng.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    vector<long long> diff(n + 2, 0);         // mảng hiệu
    for (int t = 0; t < m; t++) {
        int l, r; long long v;
        cin >> l >> r >> v;
        diff[l] += v;                         // bắt đầu cộng v từ l
        diff[r + 1] -= v;                     // ngừng cộng sau r
    }
    long long cur = 0;
    for (int i = 1; i <= n; i++) {
        cur += diff[i];                       // tiền tố của mảng hiệu = giá trị thật
        cout << cur << " \n"[i == n];
    }
    return 0;
}

// 05E. Tiền tố trên chuỗi: đếm số lần ký tự c xuất hiện trong đoạn S[l..r].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    string s;
    cin >> s;                                 // chuỗi gồm n ký tự thường a-z
    // pre[c][i] = số lần ký tự c trong S[1..i]
    vector<array<int, 26>> pre(n + 1);
    pre[0].fill(0);
    for (int i = 1; i <= n; i++) {
        pre[i] = pre[i - 1];
        pre[i][s[i - 1] - 'a']++;
    }
    int q; cin >> q;
    while (q--) {
        int l, r; char c;
        cin >> l >> r >> c;
        int idx = c - 'a';
        cout << pre[r][idx] - pre[l - 1][idx] << '\n';
    }
    return 0;
}

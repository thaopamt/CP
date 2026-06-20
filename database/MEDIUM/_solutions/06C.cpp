// 06C. Tổng hình chữ nhật trên ma trận bằng tiền tố 2D.
// P[i][j] = tổng ô của hình chữ nhật từ (1,1) đến (i,j).
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int R, C;
    cin >> R >> C;
    vector<vector<long long>> P(R + 1, vector<long long>(C + 1, 0));
    for (int i = 1; i <= R; i++)
        for (int j = 1; j <= C; j++) {
            long long x; cin >> x;
            P[i][j] = x + P[i - 1][j] + P[i][j - 1] - P[i - 1][j - 1];
        }
    int q; cin >> q;
    while (q--) {
        int r1, c1, r2, c2;
        cin >> r1 >> c1 >> r2 >> c2;
        // tổng hình chữ nhật (r1,c1)-(r2,c2) theo bao - trừ - bù
        long long s = P[r2][c2] - P[r1 - 1][c2] - P[r2][c1 - 1] + P[r1 - 1][c1 - 1];
        cout << s << '\n';
    }
    return 0;
}

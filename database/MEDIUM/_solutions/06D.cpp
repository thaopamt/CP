// 06D. Đoạn con dài nhất có tổng bằng K.
// Lưu vị trí xuất hiện ĐẦU TIÊN của mỗi giá trị tiền tố; với mỗi r tìm
// tiền tố (pre - K) sớm nhất để đoạn con dài nhất.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n; long long K;
    cin >> n >> K;
    unordered_map<long long, int> first;      // tiền tố -> chỉ số nhỏ nhất
    first.reserve(n * 2);
    first[0] = 0;                             // pre[0] = 0 tại vị trí 0
    long long pre = 0;
    int best = 0;
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre += a;
        auto it = first.find(pre - K);
        if (it != first.end()) best = max(best, i - it->second);
        // chỉ lưu lần xuất hiện đầu tiên để giữ độ dài lớn nhất
        if (first.find(pre) == first.end()) first[pre] = i;
    }
    cout << best << '\n';
    return 0;
}

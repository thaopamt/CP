# Giáo trình Tiền tố - Hậu tố trong C++ (Lộ trình MEDIUM)

> Tài liệu giảng dạy gồm **30 bài** đi từ cơ bản đến nâng cao, kèm lời giải C++17 và bộ test.
> Đề bài (không kèm lời giải) được nạp vào hệ thống qua `pnpm seed:medium`; bộ test sinh bởi `node database/MEDIUM/generate-testcases.js`.

Toàn bộ **30 bài** thuộc **một chuyên đề duy nhất** "Tiền tố - Hậu tố", chia làm 6 phần kiến thức:
1. **Tổng tiền tố cơ bản** (Bài 1–5, Dễ) — prefix sum, truy vấn đoạn, modulo, đếm điều kiện.
2. **Tổng hậu tố cơ bản** (Bài 6–10, Dễ) — suffix sum, so sánh hai phía.
3. **Kết hợp tiền tố và hậu tố** (Bài 11–15, Trung bình) — điểm cân bằng, prefix min, tích trừ phần tử.
4. **Truy vấn đoạn và mảng hiệu** (Bài 16–20, Trung bình) — nhiều truy vấn, difference array.
5. **Điều kiện, min/max, đếm** (Bài 21–25, Trung bình–Khó) — prefix/suffix min-max, đếm cặp, chuỗi.
6. **Ứng dụng nâng cao** (Bài 26–30, Khó–Nâng cao) — subarray tổng K, chia hết, prefix 2D, chia ba phần.

---


# Phần 1 — Tổng tiền tố cơ bản

## Bài 1: 01. Mảng cộng dồn
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Mảng tiền tố (prefix sum)

Cho một mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$. Hãy in ra **mảng cộng dồn** (mảng tiền tố) $P$, trong đó $P_i = A_1 + A_2 + \dots + A_i$ là tổng của $i$ phần tử đầu tiên.

### Input
- Dòng đầu chứa số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng thứ hai chứa $N$ số nguyên $A_1, A_2, \dots, A_N$ ($-10^9 \le A_i \le 10^9$).

### Output
- In ra $N$ số $P_1, P_2, \dots, P_N$ trên một dòng, các số cách nhau bởi dấu cách.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 -1 4 1 5 | 3 2 6 7 12 |

**Note**

Tổng có thể vượt quá phạm vi `int` ($N \cdot \max|A_i|$ lên tới $10^{14}$), vì vậy cần dùng kiểu `long long`.

**Ý tưởng:** Duyệt một lần, cộng dồn `sum += A[i]` và in ngay `sum` chính là `P[i]`.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 -1 4 1 5` | `3 2 6 7 12` | ví dụ mẫu / cơ bản |
| 2 | `1` `0` | `0` | cơ bản (công khai) |
| 3 | `1` `-1000000000` | `-1000000000` | cơ bản (công khai) |
| 4 | `6` `-2 -2 -2 -2 -2 -2` | `-2 -4 -6 -8 -10 -12` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `7 7 7 7` | `7 14 21 28` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `8` `1 2 3 4 5 6 7 8` | `1 3 6 10 15 21 28 36` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `5 -4 3 -2 1` | `5 1 4 2 3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `1000000000 1000000000 1000000000 1000000000 1000000000` | `1000000000 2000000000 3000000000 4000000000 5000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `10` `940 600 -360 -104 742 264 -996 -586 373 153` | `940 1540 1180 1076 1818 2082 1086 500 873 1026` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 2: 02. Truy vấn tổng đoạn
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Tổng đoạn bằng hiệu hai tiền tố

Cho một mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$ và $Q$ truy vấn. Mỗi truy vấn gồm hai số $l, r$, yêu cầu tính tổng các phần tử trong đoạn $[l, r]$, tức $A_l + A_{l+1} + \dots + A_r$.

### Input
- Dòng đầu chứa số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng thứ hai chứa $N$ số nguyên $A_1, A_2, \dots, A_N$ ($-10^9 \le A_i \le 10^9$).
- Dòng thứ ba chứa số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo, mỗi dòng chứa hai số nguyên $l, r$ ($1 \le l \le r \le N$).

### Output
- Gồm $Q$ dòng, mỗi dòng in ra tổng của đoạn $[l, r]$ tương ứng.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 -1 4 1 5<br>3<br>1 5<br>2 3<br>4 4 | 12<br>3<br>1 |

**Note**

Dùng mảng tiền tố $P_i = A_1 + \dots + A_i$ thì tổng đoạn $[l, r] = P_r - P_{l-1}$, trả lời mỗi truy vấn trong $O(1)$.

**Ý tưởng:** Dựng `pre[i]=pre[i-1]+A[i]`, tổng đoạn `[l,r] = pre[r]-pre[l-1]`, mỗi truy vấn O(1).

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 01B. Truy vấn tổng đoạn [l, r] bằng mảng tiền tố
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);          // pre[i] = tổng A[1..i], pre[0] = 0
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre[i] = pre[i - 1] + a;
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        // tổng A[l..r] = pre[r] - pre[l-1]
        cout << pre[r] - pre[l - 1] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 -1 4 1 5` `3` `1 5` `2 3` `4 4` | `12` `3` `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `42` `1` `1 1` | `42` | cơ bản (công khai) |
| 3 | `5` `-5 -3 -9 -1 -7` `3` `1 5` `2 4` `3 3` | `-25` `-13` `-9` | cơ bản (công khai) |
| 4 | `8` `1 2 3 4 5 6 7 8` `4` `1 8` `1 1` `8 8` `3 6` | `36` `1` `8` `18` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `1000000000 1000000000 1000000000 1000000000` `1` `1 4` | `4000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `5 -4 3 -2 1 0` `3` `2 5` `1 6` `6 6` | `-2` `3` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `7 7 7 7 7` `2` `1 5` `2 4` | `35` `21` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `20` `820 -187 -29 -39 -107 605 115 226 915 -122 98 -861 -607 619 62 -577 518 -799 336 -851` `5` `7 18` `7 8` `5 17` `5 15` `10 15` | `-413` `341` `884` `943` `-811` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `2` `-74 15` `3` `1 2` `1 1` `2 2` | `-59` `-74` `15` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 3: 03. Tổng tiền tố lớn nhất
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Prefix sum với số âm

Cho mảng $N$ phần tử $A_1, A_2, \dots, A_N$. Với mỗi $i$, đặt $P_i = A_1 + A_2 + \dots + A_i$ (tổng tiền tố). Hãy tìm giá trị lớn nhất trong các tổng tiền tố $P_1, P_2, \dots, P_N$.

### Input
- Dòng đầu chứa số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng thứ hai chứa $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là tổng tiền tố lớn nhất.

### Example
| input | output |
| :--- | :--- |
| 5<br>2 -3 4 -1 2 | 4 |

**Note**

Đáp án có thể là số âm (khi mảng toàn số âm) nên khởi tạo kết quả bằng giá trị rất nhỏ và dùng `long long`.

**Ý tưởng:** Cộng dồn tiền tố, giữ giá trị lớn nhất gặp được. Khởi tạo `best` rất nhỏ vì đáp án có thể âm.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `2 -3 4 -1 2` | `4` | ví dụ mẫu / cơ bản |
| 2 | `1` `-7` | `-7` | cơ bản (công khai) |
| 3 | `1` `1000000000` | `1000000000` | cơ bản (công khai) |
| 4 | `5` `-5 -3 -9 -1 -7` | `-5` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `7 7 7 7` | `28` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `-1 -2 10 -3 -4 -5` | `7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `1000000000 1000000000 1000000000 1000000000 1000000000` | `5000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `6` `3 -10 3 -10 3 -10` | `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `10` `916 -630 642 -184 146 801 -695 169 -97 838` | `1906` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 4: 04. Tổng đoạn theo modulo
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Prefix sum kết hợp số học modulo

Cho mảng $N$ phần tử $A_1, A_2, \dots, A_N$ và số nguyên $M$. Có $Q$ truy vấn, mỗi truy vấn gồm $l, r$; hãy in ra phần dư của tổng đoạn $A_l + \dots + A_r$ khi chia cho $M$, kết quả nằm trong $[0, M-1]$ (lưu ý tổng đoạn có thể âm).

### Input
- Dòng đầu chứa số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng thứ hai chứa $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng thứ ba chứa số nguyên $M$ ($2 \le M \le 10^9$).
- Dòng thứ tư chứa số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo, mỗi dòng chứa hai số nguyên $l, r$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả một truy vấn.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 -1 4 1 5<br>7<br>3<br>1 5<br>2 3<br>4 4 | 5<br>3<br>1 |

**Note**

Tính tiền tố thật bằng `long long` rồi chuẩn hóa số dư: `((s % M) + M) % M` để tránh kết quả âm.

**Ý tưởng:** Tính tiền tố thật bằng `long long`, lấy tổng đoạn rồi chuẩn hóa `((s%M)+M)%M` để tránh dư âm.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 01D. Tổng đoạn theo modulo M
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pre[i] = pre[i - 1] + a;              // tiền tố thật (chưa lấy dư)
    }
    long long M; cin >> M;
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        long long s = pre[r] - pre[l - 1];
        // chuẩn hóa số dư về [0, M-1] vì tổng có thể âm
        long long res = ((s % M) + M) % M;
        cout << res << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 -1 4 1 5` `7` `3` `1 5` `2 3` `4 4` | `5` `3` `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `10` `3` `1` `1 1` | `1` | cơ bản (công khai) |
| 3 | `5` `-5 -3 -9 -1 -7` `4` `2` `1 5` `2 4` | `3` `3` | cơ bản (công khai) |
| 4 | `3` `1000000000 1000000000 1000000000` `1000000000` `2` `1 3` `1 1` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `6 6 6 6 6` `6` `2` `1 5` `1 2` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `2 3 5 7 11` `1000000007` `2` `1 5` `3 5` | `28` `23` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `4` `-1 -1 -1 -1` `2` `3` `1 4` `1 1` `2 3` | `0` `1` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `4` `100 -50 25 -75` `13` `2` `1 4` `2 3` | `0` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `15` `-977 493 506 234 874 -104 -859 -412 -754 -824 183 -609 -624 -279 -981` `17` `3` `1 15` `3 9` `7 7` | `15` `12` `8` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 5: 05. Đếm số chẵn trong đoạn
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Prefix count theo điều kiện

Cho mảng $N$ phần tử $A_1, A_2, \dots, A_N$ và $Q$ truy vấn. Mỗi truy vấn gồm $l, r$; hãy đếm xem trong đoạn $[l, r]$ có bao nhiêu phần tử là số chẵn.

### Input
- Dòng đầu chứa số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng thứ hai chứa $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng thứ ba chứa số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo, mỗi dòng chứa hai số nguyên $l, r$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là số phần tử chẵn trong đoạn tương ứng.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 2 4 1 6<br>3<br>1 5<br>2 3<br>4 4 | 3<br>2<br>0 |

**Note**

Dùng mảng đếm tiền tố `cnt[i]` = số phần tử chẵn trong $A_1..A_i$; đáp số đoạn = `cnt[r]-cnt[l-1]`. Số âm chẵn (ví dụ $-4$) vẫn tính là chẵn.

**Ý tưởng:** Mảng đếm tiền tố `cnt[i]` = số phần tử chẵn trong `A[1..i]`; đáp số = `cnt[r]-cnt[l-1]`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 01E. Đếm số chẵn trong đoạn [l, r] bằng prefix count
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> cnt(n + 1, 0);                // cnt[i] = số phần tử chẵn trong A[1..i]
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        cnt[i] = cnt[i - 1] + (a % 2 == 0 ? 1 : 0);
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << cnt[r] - cnt[l - 1] << '\n';   // số chẵn trong [l, r]
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 2 4 1 6` `3` `1 5` `2 3` `4 4` | `3` `2` `0` | ví dụ mẫu / cơ bản |
| 2 | `1` `2` `1` `1 1` | `1` | cơ bản (công khai) |
| 3 | `1` `1` `1` `1 1` | `0` | cơ bản (công khai) |
| 4 | `4` `-2 -4 -6 -8` `2` `1 4` `2 3` | `4` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `1 3 5 7 9` `1` `1 5` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `2 4 6 8 10` `2` `1 5` `3 5` | `5` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `0 1 0 1 0 1` `2` `1 6` `2 5` | `3` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `6` `-1 2 -3 4 -5 6` `3` `1 6` `1 1` `6 6` | `3` `0` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-46 32 -28 27 -37 15 -2 -4 -42 36 1 2 -42 -33 10 -2 38 -34 4 -12` `3` `1 20` `5 15` `10 10` | `15` `7` `1` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---


# Phần 2 — Tổng hậu tố cơ bản

## Bài 6: 06. Mảng hậu tố
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Mảng hậu tố (suffix sum)

Cho mảng $N$ phần tử $A_1, \dots, A_N$. In ra mảng hậu tố $S$ với $S_i = A_i + A_{i+1} + \dots + A_N$ (tổng từ vị trí $i$ tới hết mảng).

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- $N$ số $S_1 \dots S_N$ trên một dòng, cách nhau bởi dấu cách.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 -1 4 1 5 | 12 9 10 6 5 |

**Note**

Duyệt từ phải sang trái: $S_i = S_{i+1} + A_i$. Dùng `long long`.

**Ý tưởng:** Duyệt từ phải sang trái: `suf[i]=suf[i+1]+A[i]`.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 02A. Mảng hậu tố (suffix sum)
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    vector<long long> suf(n + 2, 0);          // suf[i] = A[i] + A[i+1] + ... + A[n]
    for (int i = n; i >= 1; i--) suf[i] = suf[i + 1] + a[i];

    for (int i = 1; i <= n; i++) cout << suf[i] << " \n"[i == n];
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 -1 4 1 5` | `12 9 10 6 5` | ví dụ mẫu / cơ bản |
| 2 | `1` `0` | `0` | cơ bản (công khai) |
| 3 | `1` `-1000000000` | `-1000000000` | cơ bản (công khai) |
| 4 | `6` `-2 -2 -2 -2 -2 -2` | `-12 -10 -8 -6 -4 -2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `7 7 7 7` | `28 21 14 7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `8` `1 2 3 4 5 6 7 8` | `36 35 33 30 26 21 15 8` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `5 -4 3 -2 1` | `3 -2 2 -1 1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `1000000000 1000000000 1000000000 1000000000 1000000000` | `5000000000 4000000000 3000000000 2000000000 1000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `10` `472 617 -936 -820 560 364 -310 812 420 199` | `1378 906 289 1225 2045 1485 1121 1431 619 199` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 7: 07. Truy vấn tổng hậu tố
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Tổng hậu tố từ vị trí x

Cho mảng $N$ phần tử và $Q$ truy vấn, mỗi truy vấn là một số $x$; hãy tính tổng hậu tố $A_x + A_{x+1} + \dots + A_N$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng một số $x$ ($1 \le x \le N$).

### Output
- $Q$ dòng, mỗi dòng một kết quả.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 -1 4 1 5<br>3<br>1<br>3<br>5 | 12<br>10<br>5 |

**Note**

Tính sẵn mảng hậu tố $S$, mỗi truy vấn trả lời $O(1)$ bằng $S_x$.

**Ý tưởng:** Dựng sẵn mảng hậu tố, mỗi truy vấn trả `suf[x]` trong O(1).

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 02B. Truy vấn tổng hậu tố từ vị trí x đến hết mảng
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> suf(n + 2, 0);          // suf[i] = A[i..n]
    {
        vector<long long> a(n + 1);
        for (int i = 1; i <= n; i++) cin >> a[i];
        for (int i = n; i >= 1; i--) suf[i] = suf[i + 1] + a[i];
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << suf[x] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 -1 4 1 5` `3` `1` `3` `5` | `12` `10` `5` | ví dụ mẫu / cơ bản |
| 2 | `1` `42` `1` `1` | `42` | cơ bản (công khai) |
| 3 | `5` `-5 -3 -9 -1 -7` `3` `1` `2` `5` | `-25` `-20` `-7` | cơ bản (công khai) |
| 4 | `8` `1 2 3 4 5 6 7 8` `3` `1` `4` `8` | `36` `30` `8` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `1000000000 1000000000 1000000000 1000000000` `2` `1` `2` | `4000000000` `3000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `7 7 7 7 7` `3` `1` `3` `5` | `35` `21` `7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `5 -4 3 -2 1 0` `3` `2` `6` `1` | `-2` `0` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `2` `2 -100` `2` `1` `2` | `-98` `-100` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-656 884 -65 457 -304 446 -101 751 823 -867 259 -215 746 675 248 -971 860 -926 -300 298` `5` `1` `10` `20` `5` `15` | `2042` `-193` `298` `1422` `-791` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 8: 08. Tổng hậu tố lớn nhất
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Suffix sum với số âm

Cho mảng $N$ phần tử. Tìm giá trị lớn nhất trong các tổng hậu tố $S_i = A_i + \dots + A_N$ (với $i = 1 \dots N$).

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là tổng hậu tố lớn nhất.

### Example
| input | output |
| :--- | :--- |
| 5<br>2 -3 4 -1 2 | 5 |

**Note**

Đáp án có thể âm; dùng `long long`, khởi tạo kết quả bằng giá trị rất nhỏ.

**Ý tưởng:** Cộng dồn hậu tố từ phải sang trái, giữ giá trị lớn nhất. Đáp án có thể âm.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 02C. Tổng hậu tố lớn nhất
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    long long suf = 0, best = LLONG_MIN;
    for (int i = n; i >= 1; i--) {
        suf += a[i];                          // tổng hậu tố bắt đầu từ i
        best = max(best, suf);
    }
    cout << best << '\n';
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `2 -3 4 -1 2` | `5` | ví dụ mẫu / cơ bản |
| 2 | `1` `-7` | `-7` | cơ bản (công khai) |
| 3 | `1` `1000000000` | `1000000000` | cơ bản (công khai) |
| 4 | `5` `-5 -3 -9 -1 -7` | `-7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `7 7 7 7` | `28` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `-5 -4 -3 10 -1 -2` | `7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `1000000000 1000000000 1000000000 1000000000 1000000000` | `5000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `6` `-10 3 -10 3 -10 3` | `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `10` `-850 -800 -348 696 190 801 -381 265 -329 -116` | `1126` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 9: 09. So sánh tiền tố và hậu tố
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Kết hợp tiền tố và tổng tổng thể

Cho mảng $N$ phần tử. Với mỗi vị trí $i$ ($1 \le i \le N$), so sánh tổng bên trái $A_1 + \dots + A_i$ với tổng bên phải $A_{i+1} + \dots + A_N$ (khi $i = N$ thì phần phải rỗng, coi như $0$). Hãy đếm số vị trí $i$ mà tổng bên trái **lớn hơn** tổng bên phải.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số vị trí thỏa mãn.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 1 4 1 5 | 3 |

**Note**

Gọi $tong$ là tổng cả mảng; duyệt $i$, giữ tiền tố $pre$, phần phải $= tong - pre$.

**Ý tưởng:** Giữ tiền tố `pre`, phần phải = `total - pre`; đếm vị trí có `pre > total-pre`.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 02D. So sánh tiền tố và hậu tố: đếm vị trí i mà tổng trái > tổng phải
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    long long pre = 0;
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        pre += a[i];                          // tổng A[1..i]
        long long right = total - pre;        // tổng A[i+1..n]
        if (pre > right) ans++;
    }
    cout << ans << '\n';
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 1 4 1 5` | `3` | ví dụ mẫu / cơ bản |
| 2 | `1` `0` | `0` | cơ bản (công khai) |
| 3 | `2` `5 5` | `1` | cơ bản (công khai) |
| 4 | `5` `-1 -1 -1 -1 -1` | `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `10 0 0 0` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `1 1 1 1 1 1` | `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `-3 2 -1 4 -2` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `3` `1000000000 -1000000000 1000000000` | `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `15` `-3 -79 0 -48 44 65 -18 -78 61 -58 -57 52 -44 -21 30` | `4` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 10: 10. Đếm số dương ở hậu tố
- **Mức độ:** Dễ
- **Kiến thức trọng tâm:** Suffix count theo điều kiện

Cho mảng $N$ phần tử và $Q$ truy vấn, mỗi truy vấn là một số $x$; hãy đếm số phần tử **dương** (lớn hơn $0$) trong đoạn hậu tố $A_x, A_{x+1}, \dots, A_N$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng một số $x$ ($1 \le x \le N$).

### Output
- $Q$ dòng, mỗi dòng một kết quả.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 -1 4 0 5<br>3<br>1<br>3<br>5 | 3<br>2<br>1 |

**Note**

Dùng mảng đếm hậu tố `pos[i]` = số phần tử $>0$ trong $A_i..A_N$. Số $0$ không phải số dương.

**Ý tưởng:** Mảng đếm hậu tố `pos[i]` = số phần tử > 0 trong `A[i..N]`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 02E. Đếm số phần tử dương trong hậu tố A[x..n]
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> pos(n + 2, 0);                // pos[i] = số phần tử > 0 trong A[i..n]
    {
        vector<long long> a(n + 1);
        for (int i = 1; i <= n; i++) cin >> a[i];
        for (int i = n; i >= 1; i--) pos[i] = pos[i + 1] + (a[i] > 0 ? 1 : 0);
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << pos[x] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 -1 4 0 5` `3` `1` `3` `5` | `3` `2` `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `7` `1` `1` | `1` | cơ bản (công khai) |
| 3 | `1` `-2` `1` `1` | `0` | cơ bản (công khai) |
| 4 | `4` `-1 -2 -3 -4` `3` `1` `2` `4` | `0` `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `1 2 3 4 5` `3` `1` `3` `5` | `5` `3` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4` `0 0 0 0` `2` `1` `2` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `5 -3 2 -1 0 4` `3` `1` `4` `6` | `3` `1` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `2` `-1000000000 1000000000` `2` `1` `2` | `1` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-10 -21 41 36 30 49 40 -45 -28 47 -28 33 7 17 36 -47 35 -12 21 47` `4` `1` `10` `20` `5` | `13` `8` `1` `11` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---


# Phần 3 — Kết hợp tiền tố và hậu tố

## Bài 11: 11. Điểm chia cân bằng
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Tiền tố + tổng tổng thể

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$. Một điểm cắt $k$ (với $1 \le k \le N-1$) chia mảng thành hai đoạn liên tiếp: đoạn trái $A_1..A_k$ và đoạn phải $A_{k+1}..A_N$.

Hãy đếm số điểm cắt $k$ sao cho tổng của hai đoạn bằng nhau.

### Input
- Dòng 1: số nguyên $N$ ($2 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số điểm cắt cân bằng.

### Example
| input | output |
| :--- | :--- |
| 6<br>1 2 3 3 2 1 | 1 |

**Note**

Gọi $tong$ là tổng của cả mảng. Duyệt $k$ từ trái sang phải và giữ tiền tố $pre = A_1 + \dots + A_k$, kiểm tra điều kiện $pre = tong - pre$. Dùng kiểu `long long` để tránh tràn số.

**Ý tưởng:** Với mỗi điểm cắt k, kiểm tra `pre == total - pre`. Đếm số điểm thỏa mãn.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 03A. Điểm chia mảng cân bằng: đếm số điểm cắt k (1..n-1) chia mảng thành
// hai đoạn liên tiếp có tổng bằng nhau.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    long long pre = 0;
    int ans = 0;
    for (int k = 1; k <= n - 1; k++) {
        pre += a[k];                          // tổng A[1..k]
        if (pre == total - pre) ans++;        // hai phần bằng nhau
    }
    cout << ans << '\n';
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `6` `1 2 3 3 2 1` | `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `5` | `0` | cơ bản (công khai) |
| 3 | `2` `4 4` | `1` | cơ bản (công khai) |
| 4 | `4` `1 2 3 4` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `0 0 0 0 0` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `2 -2 2 -2 2 -2` | `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `4` `-3 -3 -3 -3` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `7` `10 0 10 0 10 0 0` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `12` `-2 2 3 -6 -9 5 8 6 10 10 -1 -5` | `0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 12: 12. Xóa một phần tử
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Tiền tố trái và hậu tố phải

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$. Hãy đếm số chỉ số $i$ (với $1 \le i \le N$) sao cho khi **xóa** phần tử $A_i$ thì tổng các phần tử bên trái $A_1 + \dots + A_{i-1}$ bằng tổng các phần tử bên phải $A_{i+1} + \dots + A_N$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số chỉ số thỏa mãn.

### Example
| input | output |
| :--- | :--- |
| 5<br>2 3 1 2 3 | 1 |

**Note**

Giữ tiền tố $pre$ = tổng $A_1 + \dots + A_{i-1}$. Khi đó phần phải $= tong - pre - A_i$, với $tong$ là tổng cả mảng. So sánh hai bên để đếm. Dùng kiểu `long long`.

**Ý tưởng:** Left = `pre[i-1]`, right = `total - pre[i-1] - A[i]`; đếm vị trí có left == right.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 03B. Xóa một phần tử để hai phía bằng nhau: đếm số chỉ số i (1..n) sao cho
// tổng A[1..i-1] == tổng A[i+1..n].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    long long pre = 0;                        // pre = tổng A[1..i-1]
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        long long left = pre;
        long long right = total - pre - a[i]; // tổng A[i+1..n]
        if (left == right) ans++;
        pre += a[i];
    }
    cout << ans << '\n';
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `2 3 1 2 3` | `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `0` | `1` | cơ bản (công khai) |
| 3 | `1` `7` | `1` | cơ bản (công khai) |
| 4 | `3` `1 5 1` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `0 0 0 0 0` | `5` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4` `1 2 3 4` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `3 -1 2 2 -1 3` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `-2 -2 -8 -2 -2` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `12` `10 3 0 4 -2 -3 -3 -8 -9 -9 3 -5` | `0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 13: 13. Lợi nhuận lớn nhất
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Prefix min

Cho mảng giá $A_1, A_2, \dots, A_N$. Hãy tìm giá trị lớn nhất của $A_j - A_i$ với $i < j$ (mua ở ngày $i$, bán ở ngày $j$ sau đó).

Lưu ý đáp án có thể âm nếu mảng giảm dần.

### Input
- Dòng 1: số nguyên $N$ ($2 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là lợi nhuận lớn nhất.

### Example
| input | output |
| :--- | :--- |
| 6<br>7 1 5 3 6 4 | 5 |

**Note**

Duyệt $j$ từ trái sang phải, giữ giá nhỏ nhất $minLeft$ trong các phần tử trước $j$ (tiền tố min); cập nhật đáp án bằng $A_j - minLeft$.

**Ý tưởng:** Duyệt j, giữ giá nhỏ nhất trước đó `minLeft`; cập nhật `A[j]-minLeft`.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `6` `7 1 5 3 6 4` | `5` | ví dụ mẫu / cơ bản |
| 2 | `2` `1 1` | `0` | cơ bản (công khai) |
| 3 | `2` `5 1` | `-4` | cơ bản (công khai) |
| 4 | `5` `5 4 3 2 1` | `-1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `1 2 3 4 5` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4` `-5 -1 -3 -2` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3` `-1000000000 0 1000000000` | `2000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `6` `3 3 3 3 3 3` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `15` `384 18 -448 -17 -395 393 -981 -552 754 553 474 -797 924 608 -860` | `1905` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 14: 14. Mảng tích trừ phần tử
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Tích tiền tố × tích hậu tố

Cho mảng gồm $N$ phần tử nguyên dương $A_1, A_2, \dots, A_N$. Hãy tính mảng $B$ với $B_i$ = tích của **tất cả** các phần tử **trừ** $A_i$, in ra theo modulo $10^9 + 7$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($1 \le A_i \le 1000$).

### Output
- $N$ số $B_1 \dots B_N$ trên một dòng, cách nhau bởi dấu cách (đã lấy dư $10^9 + 7$).

### Example
| input | output |
| :--- | :--- |
| 4<br>1 2 3 4 | 24 12 8 6 |

**Note**

$B_i$ = (tích tiền tố $A_1..A_{i-1}$) $\times$ (tích hậu tố $A_{i+1}..A_N$), nhân theo modulo $10^9 + 7$. Tránh dùng phép chia.

**Ý tưởng:** `B[i] = preProd[i-1] * sufProd[i+1] % MOD`, tránh phép chia.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 03D. Mảng tích trừ phần tử: B[i] = (tích mọi A[j], j != i) mod (1e9+7),
// dùng tích tiền tố và tích hậu tố.
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007LL;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    vector<long long> pre(n + 2, 1), suf(n + 2, 1);
    for (int i = 1; i <= n; i++) pre[i] = pre[i - 1] * (a[i] % MOD) % MOD;   // tích A[1..i]
    for (int i = n; i >= 1; i--) suf[i] = suf[i + 1] * (a[i] % MOD) % MOD;   // tích A[i..n]

    for (int i = 1; i <= n; i++) {
        long long res = pre[i - 1] * suf[i + 1] % MOD;   // bỏ A[i]
        cout << res << " \n"[i == n];
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `4` `1 2 3 4` | `24 12 8 6` | ví dụ mẫu / cơ bản |
| 2 | `1` `5` | `1` | cơ bản (công khai) |
| 3 | `2` `7 9` | `9 7` | cơ bản (công khai) |
| 4 | `5` `1 1 1 1 1` | `1 1 1 1 1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `3` `1000 1000 1000` | `1000000 1000000 1000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `2 3 4 5 6` | `360 240 180 144 120` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `1 2 1 2 1 2` | `8 4 8 4 8 4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `4` `10 1 10 1` | `10 100 10 100` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `10` `276 197 801 829 963 594 670 280 47 269` | `501206051 519456192 367456768 551668121 698164978 253085640 90049059 251188820 304954664 138783901` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 15: 15. Chia đôi chênh lệch nhỏ nhất
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Tiền tố + tổng tổng thể

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$. Chọn điểm cắt $k$ (với $1 \le k \le N-1$) chia mảng thành hai đoạn liên tiếp. Hãy tìm giá trị nhỏ nhất của $\lvert (A_1 + \dots + A_k) - (A_{k+1} + \dots + A_N) \rvert$.

### Input
- Dòng 1: số nguyên $N$ ($2 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là chênh lệch nhỏ nhất.

### Example
| input | output |
| :--- | :--- |
| 5<br>1 2 3 4 10 | 0 |

**Note**

Giữ tiền tố $pre$, phần phải $= tong - pre$ với $tong$ là tổng cả mảng. Lấy $\min$ của trị tuyệt đối hiệu $\lvert pre - (tong - pre) \rvert$. Dùng kiểu `long long`.

**Ý tưởng:** Với mỗi điểm cắt k, tính `|pre - (total-pre)|`, lấy nhỏ nhất.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 03E. Chia đôi mảng sao cho chênh lệch tổng hai phần nhỏ nhất.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    long long pre = 0;
    long long best = LLONG_MAX;
    for (int k = 1; k <= n - 1; k++) {
        pre += a[k];                          // tổng trái A[1..k]
        long long diff = llabs(pre - (total - pre));
        best = min(best, diff);
    }
    cout << best << '\n';
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `1 2 3 4 10` | `0` | ví dụ mẫu / cơ bản |
| 2 | `2` `3 8` | `5` | cơ bản (công khai) |
| 3 | `2` `5 5` | `0` | cơ bản (công khai) |
| 4 | `6` `1 1 1 1 1 1` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `-2 3 -1 4` | `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `10 1 1 1 1` | `6` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3` `1000000000 1 1000000000` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `4` `-5 -5 -5 -5` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `15` `322 881 462 -127 755 -856 -553 -454 -971 686 -87 -618 -321 -291 80` | `10` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---


# Phần 4 — Truy vấn đoạn và mảng hiệu

## Bài 16: 16. Hiệu tổng hai mảng
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Hai mảng tiền tố song song

Cho hai mảng $A$ và $B$ cùng độ dài $N$. Có $Q$ truy vấn, mỗi truy vấn gồm hai số $l, r$; với mỗi truy vấn hãy in ra giá trị (tổng $A_l + A_{l+1} + \dots + A_r$) trừ đi (tổng $B_l + B_{l+1} + \dots + B_r$).

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng 3: $N$ số nguyên $B_i$ ($-10^9 \le B_i \le 10^9$).
- Dòng 4: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng gồm hai số $l, r$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả của một truy vấn.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 1 4 1 5<br>2 2 2 2 2<br>3<br>1 5<br>2 3<br>4 4 | 4<br>1<br>-1 |

**Note**

Dùng hai mảng tiền tố riêng cho $A$ và $B$; kết quả $= (PA_r - PA_{l-1}) - (PB_r - PB_{l-1})$. Dùng `long long`.

**Ý tưởng:** Dựng tiền tố cho A và B, kết quả = `(PA_r-PA_{l-1}) - (PB_r-PB_{l-1})`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 04A. Hiệu tổng đoạn của hai mảng: với mỗi truy vấn [l, r] in ra
// (tổng A[l..r] - tổng B[l..r]). Dùng hai mảng tiền tố.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pa(n + 1, 0), pb(n + 1, 0);
    for (int i = 1; i <= n; i++) { long long x; cin >> x; pa[i] = pa[i - 1] + x; }
    for (int i = 1; i <= n; i++) { long long x; cin >> x; pb[i] = pb[i - 1] + x; }

    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        long long sa = pa[r] - pa[l - 1];
        long long sb = pb[r] - pb[l - 1];
        cout << sa - sb << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 1 4 1 5` `2 2 2 2 2` `3` `1 5` `2 3` `4 4` | `4` `1` `-1` | ví dụ mẫu / cơ bản |
| 2 | `1` `10` `3` `1` `1 1` | `7` | cơ bản (công khai) |
| 3 | `3` `-5 -3 -1` `5 3 1` `2` `1 3` `2 2` | `-18` `-6` | cơ bản (công khai) |
| 4 | `4` `1 2 3 4` `4 3 2 1` `3` `1 4` `1 2` `3 4` | `0` `-4` `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `2` `1000000000 1000000000` `-1000000000 -1000000000` `1` `1 2` | `4000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4` `0 0 0 0` `0 0 0 0` `2` `1 4` `2 3` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `5 5 5 5 5` `1 2 3 4 5` `2` `1 5` `3 5` | `10` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `2` `7 7` `7 7` `3` `1 2` `1 1` `2 2` | `0` `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `431 227 -682 -397 430 -38 108 8 -875 674 -996 228 529 863 503 797 -315 877 -690 812` `-842 -412 519 -217 -433 120 501 73 -103 658 -345 -158 -840 643 438 -313 -23 71 -227 -565` `3` `1 20` `5 15` `10 10` | `3949` `880` `16` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 17: 17. Đếm chia hết trong đoạn
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Prefix count theo điều kiện chia hết

Cho mảng gồm $N$ phần tử và số nguyên $K$. Có $Q$ truy vấn, mỗi truy vấn gồm hai số $l, r$; với mỗi truy vấn hãy đếm số phần tử trong đoạn $[l, r]$ chia hết cho $K$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($1 \le A_i \le 10^9$).
- Dòng 3: số nguyên $K$ ($1 \le K \le 10^9$).
- Dòng 4: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng gồm hai số $l, r$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả của một truy vấn.

### Example
| input | output |
| :--- | :--- |
| 5<br>3 6 4 9 5<br>3<br>3<br>1 5<br>2 4<br>3 3 | 3<br>2<br>0 |

**Note**

Mảng tiền tố `cnt[i]` = số phần tử chia hết cho $K$ trong $A_1 \dots A_i$; đáp số $= cnt[r] - cnt[l-1]$.

**Ý tưởng:** Mảng đếm tiền tố các phần tử chia hết K; đáp số = `cnt[r]-cnt[l-1]`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 04B. Đếm số phần tử chia hết cho K trong đoạn [l, r] bằng prefix count.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    long long K; cin >> K;

    vector<int> cnt(n + 1, 0);                // cnt[i] = số phần tử chia hết K trong A[1..i]
    for (int i = 1; i <= n; i++)
        cnt[i] = cnt[i - 1] + (a[i] % K == 0 ? 1 : 0);

    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << cnt[r] - cnt[l - 1] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `3 6 4 9 5` `3` `3` `1 5` `2 4` `3 3` | `3` `2` `0` | ví dụ mẫu / cơ bản |
| 2 | `1` `6` `2` `1` `1 1` | `1` | cơ bản (công khai) |
| 3 | `1` `5` `2` `1` `1 1` | `0` | cơ bản (công khai) |
| 4 | `5` `2 4 6 8 10` `2` `2` `1 5` `2 4` | `5` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `1 3 5 7 9` `2` `1` `1 5` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `10 20 30 40 50` `10` `2` `1 5` `3 5` | `5` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `7 14 3 21 5 28` `7` `3` `1 6` `1 1` `6 6` | `4` `1` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `100 99 98 97 96` `4` `2` `1 5` `2 3` | `2` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `54 55 55 32 62 27 53 76 81 12 82 13 35 5 56 20 29 98 11 29` `5` `3` `1 20` `5 15` `10 10` | `5` `2` `0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 18: 18. So sánh hai đoạn
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Truy vấn tổng đoạn nhiều lần

Cho mảng gồm $N$ phần tử. Mỗi truy vấn gồm bốn số $l_1, r_1, l_2, r_2$ mô tả hai đoạn. Hãy so sánh tổng đoạn $[l_1, r_1]$ và tổng đoạn $[l_2, r_2]$: in ra `1` nếu tổng đoạn thứ nhất lớn hơn, `2` nếu tổng đoạn thứ hai lớn hơn, `0` nếu bằng nhau.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng gồm bốn số $l_1, r_1, l_2, r_2$ ($1 \le l_1 \le r_1 \le N$, $1 \le l_2 \le r_2 \le N$).

### Output
- $Q$ dòng, mỗi dòng là `0`, `1` hoặc `2`.

### Example
| input | output |
| :--- | :--- |
| 5<br>1 2 3 4 5<br>3<br>1 2 4 5<br>1 5 3 3<br>2 2 4 4 | 2<br>1<br>2 |

**Note**

Tính tổng mỗi đoạn bằng mảng tiền tố rồi so sánh. Dùng `long long`.

**Ý tưởng:** Tính tổng hai đoạn bằng tiền tố rồi so sánh, in 0/1/2.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 04C. So sánh tổng hai đoạn [l1,r1] và [l2,r2].
// In 1 nếu đoạn 1 lớn hơn, 2 nếu đoạn 2 lớn hơn, 0 nếu bằng nhau.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pre(n + 1, 0);
    for (int i = 1; i <= n; i++) { long long x; cin >> x; pre[i] = pre[i - 1] + x; }

    int q; cin >> q;
    while (q--) {
        int l1, r1, l2, r2; cin >> l1 >> r1 >> l2 >> r2;
        long long s1 = pre[r1] - pre[l1 - 1];
        long long s2 = pre[r2] - pre[l2 - 1];
        cout << (s1 > s2 ? 1 : (s2 > s1 ? 2 : 0)) << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `1 2 3 4 5` `3` `1 2 4 5` `1 5 3 3` `2 2 4 4` | `2` `1` `2` | ví dụ mẫu / cơ bản |
| 2 | `1` `5` `1` `1 1 1 1` | `0` | cơ bản (công khai) |
| 3 | `4` `-1 -2 -3 -4` `2` `1 2 3 4` `1 1 4 4` | `1` `1` | cơ bản (công khai) |
| 4 | `5` `3 3 3 3 3` `2` `1 2 3 4` `1 3 2 4` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `10 -5 3 8 -2` `2` `1 2 3 5` `1 5 1 5` | `2` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `3` `1000000000 1000000000 -1000000000` `1` `1 2 3 3` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `4` `2 4 6 8` `2` `1 1 4 4` `1 2 3 4` | `2` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `0 0 0 0 0` `2` `1 3 2 4` `1 1 5 5` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-86 46 972 -470 686 650 -687 -943 -25 890 -597 387 -160 -914 -77 271 806 -62 501 777` `6` `11 12 14 18` `2 7 2 6` `6 11 1 11` `2 17 1 18` `5 13 5 6` `18 20 3 9` | `2` `2` `2` `1` `2` `1` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 19: 19. Mảng hiệu cập nhật đoạn
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Difference array

Cho mảng $A$ gồm $N$ phần tử ban đầu đều bằng $0$. Thực hiện $M$ thao tác, mỗi thao tác gồm ba số $l, r, v$: cộng thêm $v$ vào mọi phần tử trong đoạn $[l, r]$. Sau khi thực hiện tất cả thao tác, hãy in ra mảng cuối cùng.

### Input
- Dòng 1: hai số nguyên $N$ và $M$ ($1 \le N \le 10^5$, $1 \le M \le 10^5$).
- $M$ dòng tiếp theo: mỗi dòng gồm ba số $l, r, v$ ($1 \le l \le r \le N$, $-10^9 \le v \le 10^9$).

### Output
- $N$ số là mảng cuối cùng, in trên một dòng, cách nhau bởi dấu cách.

### Example
| input | output |
| :--- | :--- |
| 5 3<br>1 3 2<br>2 5 1<br>4 4 10 | 2 3 3 11 1 |

**Note**

Dùng **mảng hiệu** (difference array): với mỗi thao tác làm `diff[l] += v; diff[r+1] -= v`. Mảng cuối = tiền tố của `diff`. Độ phức tạp $O(N + M)$.

**Ý tưởng:** `diff[l]+=v; diff[r+1]-=v`; mảng cuối = tiền tố của `diff`.

**Độ phức tạp:** O(N + M)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5 3` `1 3 2` `2 5 1` `4 4 10` | `2 3 3 11 1` | ví dụ mẫu / cơ bản |
| 2 | `1 1` `1 1 5` | `5` | cơ bản (công khai) |
| 3 | `4 1` `1 4 1` | `1 1 1 1` | cơ bản (công khai) |
| 4 | `5 2` `1 1 100` `5 5 -100` | `100 0 0 0 -100` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `6 3` `1 6 1` `1 6 1` `1 6 1` | `3 3 3 3 3 3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5 3` `2 4 5` `1 3 -2` `3 5 7` | `-2 3 10 12 7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3 1` `1 3 1000000000` | `1000000000 1000000000 1000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `4 2` `1 2 -5` `3 4 -5` | `-5 -5 -5 -5` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `50 20` `28 43 44` `10 17 3` `15 33 13` `26 43 89` `7 42 -63` `8 27 95` `13 47 32` `1 46 31` `8 29 100` `26 32 -38` `11 42 47` `25 47 70` `31 38 28` `24 28 -94` `2 4 -41` `41 49 22` `2 44 49` `18 18 2` `28 35 -19` `18 48 63` | `31 39 39 39 80 80 17 212 212 215 262 262 294 294 307 307 307 369 367 367 367 367 367 273 343 394 394 324 418 318 346 346 384 371 371 390 390 390 362 362 384 384 400 267 218 218 187 85 22 0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 500 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 20: 20. Cập nhật đoạn rồi truy vấn
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Difference array + prefix sum

Cho mảng $A$ gồm $N$ phần tử ban đầu đều bằng $0$. Thực hiện $U$ thao tác cộng đoạn (mỗi thao tác gồm ba số $l, r, v$ cộng $v$ vào $A_l \dots A_r$). Sau đó trả lời $Q$ truy vấn, mỗi truy vấn gồm hai số $l, r$ hỏi tổng đoạn $[l, r]$ của mảng cuối cùng.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: số nguyên $U$ ($0 \le U \le 10^5$).
- $U$ dòng tiếp theo: mỗi dòng gồm ba số $l, r, v$ ($1 \le l \le r \le N$, $-10^9 \le v \le 10^9$).
- Dòng tiếp theo: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng gồm hai số $l, r$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là tổng đoạn được hỏi.

### Example
| input | output |
| :--- | :--- |
| 5<br>2<br>1 3 2<br>2 5 1<br>3<br>1 5<br>2 4<br>3 3 | 10<br>7<br>3 |

**Note**

Dựng mảng cuối bằng **mảng hiệu**, sau đó lấy **tiền tố** của mảng cuối để trả lời truy vấn tổng trong $O(1)$. Dùng `long long`.

**Ý tưởng:** Dựng mảng cuối bằng mảng hiệu, rồi lấy tiền tố để trả lời truy vấn tổng.

**Độ phức tạp:** O(N + U + Q)

**Code C++17:**
```cpp
// 04E. Cập nhật đoạn rồi truy vấn tổng:
// - U phép cộng v vào đoạn [l, r] (mảng ban đầu toàn 0) -> dùng mảng hiệu.
// - Sau đó Q truy vấn tổng đoạn [l, r] -> dùng mảng tiền tố của mảng cuối.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> diff(n + 2, 0);
    int u; cin >> u;
    while (u--) {
        int l, r; long long v;
        cin >> l >> r >> v;
        diff[l] += v;
        diff[r + 1] -= v;
    }
    // dựng mảng cuối rồi lấy tiền tố để trả lời truy vấn tổng
    vector<long long> pre(n + 1, 0);
    long long cur = 0;
    for (int i = 1; i <= n; i++) {
        cur += diff[i];
        pre[i] = pre[i - 1] + cur;
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << pre[r] - pre[l - 1] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `2` `1 3 2` `2 5 1` `3` `1 5` `2 4` `3 3` | `10` `7` `3` | ví dụ mẫu / cơ bản |
| 2 | `1` `1` `1 1 7` `1` `1 1` | `7` | cơ bản (công khai) |
| 3 | `4` `1` `1 4 3` `2` `1 4` `2 3` | `12` `6` | cơ bản (công khai) |
| 4 | `5` `2` `1 1 10` `5 5 20` `3` `1 5` `1 1` `5 5` | `30` `10` `20` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `6` `2` `1 6 1` `1 3 5` `3` `1 6` `1 3` `4 6` | `21` `18` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `2` `2 4 -3` `1 5 4` `2` `1 5` `2 4` | `11` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3` `1` `1 3 1000000000` `1` `1 3` | `3000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `4` `0` `2` `1 4` `2 2` | `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `50` `15` `7 28 -98` `9 38 50` `1 18 -65` `45 47 33` `8 43 -23` `10 39 16` `20 26 31` `28 35 23` `13 27 -99` `15 30 28` `30 45 -86` `14 32 -72` `20 30 -95` `14 32 59` `4 35 -81` `10` `22 33` `10 22` `43 48` `20 27` `25 35` `12 31` `16 40` `15 45` `18 35` `3 33` | `-2533` `-3428` `-182` `-2303` `-1883` `-5060` `-4709` `-5460` `-3808` `-6908` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---


# Phần 5 — Điều kiện, min/max, đếm

## Bài 21: 21. Tiền tố nhỏ nhất
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Prefix min truy vấn

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$ và $Q$ truy vấn. Mỗi truy vấn là một số nguyên $x$; với mỗi truy vấn, hãy in ra giá trị nhỏ nhất trong đoạn tiền tố $A_1, A_2, \dots, A_x$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng một số nguyên $x$ ($1 \le x \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả của một truy vấn tương ứng.

### Example
| input | output |
| :--- | :--- |
| 5<br>4 2 5 1 3<br>3<br>1<br>3<br>5 | 4<br>2<br>1 |

**Note**

Tính sẵn mảng `pmin[i] = min(pmin[i-1], A_i)` (tiền tố min), sau đó mỗi truy vấn trả lời trong $O(1)$.

**Ý tưởng:** `pmin[i]=min(pmin[i-1],A[i])`; trả lời `pmin[x]`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 05A. Tiền tố nhỏ nhất: truy vấn min của A[1..x].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pmin(n + 1);            // pmin[i] = min A[1..i]
    for (int i = 1; i <= n; i++) {
        long long a; cin >> a;
        pmin[i] = (i == 1) ? a : min(pmin[i - 1], a);
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << pmin[x] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `4 2 5 1 3` `3` `1` `3` `5` | `4` `2` `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `7` `1` `1` | `7` | cơ bản (công khai) |
| 3 | `1` `-1000000000` `1` `1` | `-1000000000` | cơ bản (công khai) |
| 4 | `5` `5 4 3 2 1` `3` `1` `3` `5` | `5` `3` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `1 2 3 4 5` `3` `1` `3` `5` | `1` `1` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4` `3 3 3 3` `3` `1` `2` `4` | `3` `3` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `-2 5 -8 1 -3` `4` `1` `2` `3` `5` | `-2` `-2` `-8` `-8` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `2` `1000000000 -1000000000` `2` `1` `2` | `1000000000` `-1000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-232 -381 -979 707 -893 523 986 -321 -984 -718 -835 204 585 145 413 792 23 49 -700 710` `5` `1` `10` `20` `5` `15` | `-232` `-984` `-984` `-979` `-984` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 22: 22. Hậu tố lớn nhất
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Suffix max truy vấn

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$ và $Q$ truy vấn. Mỗi truy vấn là một số nguyên $x$; với mỗi truy vấn, hãy in ra giá trị lớn nhất trong đoạn hậu tố $A_x, A_{x+1}, \dots, A_N$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng một số nguyên $x$ ($1 \le x \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả của một truy vấn tương ứng.

### Example
| input | output |
| :--- | :--- |
| 5<br>4 2 5 1 3<br>3<br>1<br>3<br>5 | 5<br>5<br>3 |

**Note**

Tính sẵn mảng `smax[i] = max(smax[i+1], A_i)` (hậu tố max) bằng cách duyệt từ phải sang trái, sau đó mỗi truy vấn trả lời trong $O(1)$.

**Ý tưởng:** `smax[i]=max(smax[i+1],A[i])`; trả lời `smax[x]`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 05B. Hậu tố lớn nhất: truy vấn max của A[x..n].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> smax(n + 2);            // smax[i] = max A[i..n]
    {
        vector<long long> a(n + 1);
        for (int i = 1; i <= n; i++) cin >> a[i];
        smax[n + 1] = LLONG_MIN;
        for (int i = n; i >= 1; i--) smax[i] = max(smax[i + 1], a[i]);
    }
    int q; cin >> q;
    while (q--) {
        int x; cin >> x;
        cout << smax[x] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `4 2 5 1 3` `3` `1` `3` `5` | `5` `5` `3` | ví dụ mẫu / cơ bản |
| 2 | `1` `7` `1` `1` | `7` | cơ bản (công khai) |
| 3 | `1` `-1000000000` `1` `1` | `-1000000000` | cơ bản (công khai) |
| 4 | `5` `1 2 3 4 5` `3` `1` `3` `5` | `5` `5` `5` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `5 4 3 2 1` `3` `1` `3` `5` | `5` `3` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4` `3 3 3 3` `3` `1` `2` `4` | `3` `3` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5` `-2 5 -8 1 -3` `4` `1` `2` `4` `5` | `5` `5` `1` `-3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `2` `-1000000000 1000000000` `2` `1` `2` | `1000000000` `1000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-30 272 -122 -144 -137 -479 -861 701 -16 858 755 695 491 -132 -868 -430 -225 -336 733 995` `5` `1` `10` `20` `5` `15` | `995` `995` `995` `995` `995` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 23: 23. Đếm cặp tiền tố bằng nhau
- **Mức độ:** Khó
- **Kiến thức trọng tâm:** Đếm cặp dựa trên tiền tố (map)

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$. Đặt $P_0 = 0$ và $P_i = A_1 + A_2 + \dots + A_i$. Hãy đếm số cặp chỉ số $(i, j)$ với $0 \le i < j \le N$ và $P_i = P_j$. (Mỗi cặp như vậy tương ứng với một đoạn con liên tiếp có tổng bằng $0$.)

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số cặp thỏa mãn (có thể rất lớn).

### Example
| input | output |
| :--- | :--- |
| 5<br>1 -1 2 -2 3 | 3 |

**Note**

Dùng `map` đếm số lần xuất hiện của mỗi giá trị tiền tố (bắt đầu với $P_0 = 0$). Đáp án có thể lớn nên dùng `long long`.

**Ý tưởng:** Số cặp `(i<j)` có `P[i]==P[j]` = tổng `C(freq[v],2)`; duyệt cộng `freq[pre]` trước khi tăng.

**Độ phức tạp:** O(N log N)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `1 -1 2 -2 3` | `3` | ví dụ mẫu / cơ bản |
| 2 | `1` `0` | `1` | cơ bản (công khai) |
| 3 | `1` `5` | `0` | cơ bản (công khai) |
| 4 | `4` `0 0 0 0` | `10` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `6` `1 -1 1 -1 1 -1` | `9` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5` `1 2 3 4 5` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `4` `3 -3 3 -3` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `6` `2 -2 2 -2 4 -4` | `7` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `15` `-4 -4 1 -1 -3 5 -5 -4 0 3 5 1 -4 -3 4` | `5` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 24: 24. Tiền tố mảng nhị phân
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Prefix count trên mảng 0/1

Cho mảng gồm $N$ phần tử $A_1, A_2, \dots, A_N$ chỉ gồm các giá trị $0$ và $1$, và $Q$ truy vấn. Mỗi truy vấn gồm hai số $l, r$; hãy đếm số bit $1$ trong đoạn $[l, r]$.

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($A_i \in \{0, 1\}$).
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng hai số nguyên $l, r$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả của một truy vấn tương ứng.

### Example
| input | output |
| :--- | :--- |
| 5<br>1 0 1 1 0<br>3<br>1 5<br>2 4<br>3 3 | 3<br>2<br>1 |

**Note**

Tính tiền tố `ones[i]` = số bit $1$ trong $A_1 \dots A_i$; đáp số của truy vấn $[l, r]$ là $ones[r] - ones[l-1]$.

**Ý tưởng:** Tiền tố số bit 1; đáp số = `ones[r]-ones[l-1]`.

**Độ phức tạp:** O(N + Q)

**Code C++17:**
```cpp
// 05D. Tiền tố mảng nhị phân: đếm số bit 1 trong đoạn [l, r].
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> ones(n + 1, 0);               // ones[i] = số bit 1 trong A[1..i]
    for (int i = 1; i <= n; i++) {
        int a; cin >> a;
        ones[i] = ones[i - 1] + a;            // a chỉ là 0 hoặc 1
    }
    int q; cin >> q;
    while (q--) {
        int l, r; cin >> l >> r;
        cout << ones[r] - ones[l - 1] << '\n';
    }
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `1 0 1 1 0` `3` `1 5` `2 4` `3 3` | `3` `2` `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `1` `1` `1 1` | `1` | cơ bản (công khai) |
| 3 | `1` `0` `1` `1 1` | `0` | cơ bản (công khai) |
| 4 | `5` `1 1 1 1 1` `2` `1 5` `2 4` | `5` `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `0 0 0 0 0` `1` `1 5` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `1 0 1 0 1 0` `2` `1 6` `2 5` | `3` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `0 1 1 0 1 1` `3` `1 6` `1 1` `6 6` | `4` `0` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `1 1 0 0 1` `2` `2 5` `1 3` | `2` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `0 0 1 1 0 1 1 1 1 0 1 0 0 1 0 0 0 0 1 1` `3` `1 20` `5 15` `10 10` | `10` `6` `0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 25: 25. Đếm ký tự trong đoạn
- **Mức độ:** Trung bình
- **Kiến thức trọng tâm:** Prefix trên chuỗi (26 mảng)

Cho một chuỗi $S$ gồm $N$ ký tự thường (`a`–`z`) và $Q$ truy vấn. Mỗi truy vấn gồm hai số $l, r$ và một ký tự $c$; hãy đếm số lần ký tự $c$ xuất hiện trong đoạn $S_l S_{l+1} \dots S_r$ (chỉ số tính từ $1$).

### Input
- Dòng 1: số nguyên $N$ ($1 \le N \le 10^5$).
- Dòng 2: chuỗi $S$ có độ dài $N$.
- Dòng 3: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng gồm $l$, $r$ và một ký tự $c$ ($1 \le l \le r \le N$).

### Output
- $Q$ dòng, mỗi dòng là kết quả của một truy vấn tương ứng.

### Example
| input | output |
| :--- | :--- |
| 5<br>ababc<br>3<br>1 5 a<br>2 4 b<br>5 5 c | 2<br>2<br>1 |

**Note**

Dùng $26$ mảng tiền tố (mỗi ký tự một mảng) hoặc `pre[i][c]` = số lần ký tự $c$ xuất hiện trong $S_1 \dots S_i$; đáp số là $pre[r][c] - pre[l-1][c]$.

**Ý tưởng:** `pre[i][c]` = số lần ký tự c trong `S[1..i]`; đáp số = `pre[r][c]-pre[l-1][c]`.

**Độ phức tạp:** O(26N + Q)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5` `ababc` `3` `1 5 a` `2 4 b` `5 5 c` | `2` `2` `1` | ví dụ mẫu / cơ bản |
| 2 | `1` `a` `1` `1 1 a` | `1` | cơ bản (công khai) |
| 3 | `1` `a` `1` `1 1 b` | `0` | cơ bản (công khai) |
| 4 | `5` `zzzzz` `2` `1 5 z` `2 4 a` | `5` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5` `abcde` `2` `1 5 a` `1 5 e` | `1` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `6` `aaabbb` `3` `1 6 a` `4 6 a` `1 3 b` | `3` `0` `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `11` `mississippi` `3` `1 11 s` `2 5 i` `1 11 p` | `4` `2` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `9` `abcabcabc` `3` `1 9 a` `4 9 b` `1 3 c` | `3` `2` `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `30` `cdbccdbacbacdcddddbdcddabaaacb` `3` `1 30 a` `10 20 b` `30 30 c` | `6` `2` `0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---


# Phần 6 — Ứng dụng nâng cao (subarray, chuỗi, ma trận 2D)

## Bài 26: 26. Đoạn con tổng bằng K
- **Mức độ:** Khó
- **Kiến thức trọng tâm:** Hashmap tiền tố

Cho mảng $N$ phần tử và số $K$. Hãy đếm số **đoạn con liên tiếp** (không rỗng) có tổng bằng đúng $K$.

### Input
- Dòng 1: hai số nguyên $N$ và $K$ ($1 \le N \le 10^5$, $-10^{14} \le K \le 10^{14}$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số đoạn con thỏa mãn (có thể rất lớn).

### Example
| input | output |
| :--- | :--- |
| 5 3<br>1 2 3 -3 3 | 5 |

**Note**

Dùng `map`/`unordered_map` đếm số lần xuất hiện của tiền tố. Với mỗi $r$, số đoạn kết thúc tại $r$ bằng số lần tiền tố $pre_r - K$ đã xuất hiện. Khởi tạo tiền tố $0$ xuất hiện một lần. Dùng `long long`.

**Ý tưởng:** Với mỗi r, cộng số lần tiền tố `pre-K` đã xuất hiện. Khởi tạo `freq[0]=1`.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5 3` `1 2 3 -3 3` | `5` | ví dụ mẫu / cơ bản |
| 2 | `1 5` `5` | `1` | cơ bản (công khai) |
| 3 | `1 3` `5` | `0` | cơ bản (công khai) |
| 4 | `4 0` `0 0 0 0` | `10` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `5 0` `1 -1 1 -1 1` | `6` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5 4` `2 2 2 2 2` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3 1000000000` `1000000000 1000000000 -1000000000` | `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `6 3` `3 1 -1 2 -2 3` | `6` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20 0` `5 0 -1 -3 -3 -1 -4 -5 -1 -1 5 0 1 -5 -5 -4 5 1 5 -2` | `5` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 5 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 27: 27. Đoạn con chia hết cho K
- **Mức độ:** Khó
- **Kiến thức trọng tâm:** Tiền tố theo số dư

Cho mảng $N$ phần tử và số nguyên dương $K$. Hãy đếm số **đoạn con liên tiếp** (không rỗng) có tổng chia hết cho $K$.

### Input
- Dòng 1: hai số nguyên $N$ và $K$ ($1 \le N \le 10^5$, $1 \le K \le 10^6$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số đoạn con thỏa mãn (có thể rất lớn).

### Example
| input | output |
| :--- | :--- |
| 5 3<br>2 1 2 1 3 | 7 |

**Note**

Hai tiền tố có cùng số dư khi chia $K$ tạo thành một đoạn con chia hết cho $K$. Đếm số tiền tố theo từng số dư; chuẩn hóa số dư về $[0, K-1]$ bằng `((pre % K) + K) % K`. Dùng `long long`.

**Ý tưởng:** Hai tiền tố cùng số dư mod K tạo đoạn chia hết; đếm theo từng số dư.

**Độ phức tạp:** O(N + K)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5 3` `2 1 2 1 3` | `7` | ví dụ mẫu / cơ bản |
| 2 | `1 5` `5` | `1` | cơ bản (công khai) |
| 3 | `1 3` `4` | `0` | cơ bản (công khai) |
| 4 | `4 3` `3 3 3 3` | `10` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4 2` `-1 -1 -1 -1` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `4 2` `2 4 6 8` | `10` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3 7` `1000000000 -1000000000 1000000000` | `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5 5` `5 -5 10 -10 7` | `10` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20 4` `-1 -3 -1 3 -5 5 9 0 9 -8 -8 -8 -5 4 5 -1 7 4 0 -9` | `53` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 7 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 28: 28. Tổng hình chữ nhật 2D
- **Mức độ:** Khó
- **Kiến thức trọng tâm:** Prefix sum 2 chiều

Cho ma trận $R \times C$. Có $Q$ truy vấn, mỗi truy vấn gồm $r_1, c_1, r_2, c_2$; hãy tính tổng các ô trong hình chữ nhật con từ góc trên trái $(r_1, c_1)$ đến góc dưới phải $(r_2, c_2)$.

### Input
- Dòng 1: hai số nguyên $R$ và $C$ ($1 \le R, C$, $R \cdot C \le 10^6$).
- $R$ dòng tiếp theo: mỗi dòng $C$ số nguyên (giá trị mỗi ô trong $[-10^9, 10^9]$).
- Dòng tiếp theo: số nguyên $Q$ ($1 \le Q \le 10^5$).
- $Q$ dòng tiếp theo: mỗi dòng bốn số $r_1, c_1, r_2, c_2$ ($1 \le r_1 \le r_2 \le R$, $1 \le c_1 \le c_2 \le C$).

### Output
- $Q$ dòng, mỗi dòng là tổng hình chữ nhật con tương ứng.

### Example
| input | output |
| :--- | :--- |
| 3 3<br>1 2 3<br>4 5 6<br>7 8 9<br>3<br>1 1 2 2<br>2 2 3 3<br>1 1 3 3 | 12<br>28<br>45 |

**Note**

Dựng tiền tố 2D $P[i][j]$ = tổng hình chữ nhật từ $(1,1)$ đến $(i,j)$ bằng công thức bao–trừ–bù: $P[i][j] = a[i][j] + P[i-1][j] + P[i][j-1] - P[i-1][j-1]$. Tổng truy vấn $= P[r_2][c_2] - P[r_1-1][c_2] - P[r_2][c_1-1] + P[r_1-1][c_1-1]$. Dùng `long long`.

**Ý tưởng:** `P[i][j]` theo bao-trừ-bù; truy vấn = `P[r2][c2]-P[r1-1][c2]-P[r2][c1-1]+P[r1-1][c1-1]`.

**Độ phức tạp:** O(R·C + Q)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `3 3` `1 2 3` `4 5 6` `7 8 9` `3` `1 1 2 2` `2 2 3 3` `1 1 3 3` | `12` `28` `45` | ví dụ mẫu / cơ bản |
| 2 | `1 1` `42` `1` `1 1 1 1` | `42` | cơ bản (công khai) |
| 3 | `2 2` `-1 -2` `-3 -4` `2` `1 1 2 2` `1 1 1 1` | `-10` `-1` | cơ bản (công khai) |
| 4 | `1 4` `1 1 1 1` `2` `1 1 1 4` `1 2 1 3` | `4` `2` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4 1` `1` `2` `3` `4` `2` `1 1 4 1` `2 1 3 1` | `10` `5` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `2 2` `1000000000 1000000000` `1000000000 1000000000` `1` `1 1 2 2` | `4000000000` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `3 3` `5 -3 2` `-1 4 -6` `7 0 1` `3` `1 1 3 3` `2 1 3 2` `1 3 2 3` | `9` `10` `-4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `2 3` `0 0 0` `0 0 0` `1` `1 1 2 3` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `8 8` `-21 -4 -2 -90 30 33 -92 30` `-1 39 81 69 39 12 84 79` `45 12 -61 -59 26 -3 -4 29` `-20 -46 -11 -39 -16 -32 100 2` `9 -91 -18 94 61 -7 -46 16` `4 -7 50 -89 20 96 40 -36` `-64 62 -80 59 54 38 -17 40` `27 87 55 55 50 -65 30 5` `3` `1 1 8 8` `2 3 5 6` `4 4 4 4` | `641` `136` `-39` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 50 50 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 29: 29. Đoạn con dài nhất tổng bằng K
- **Mức độ:** Khó
- **Kiến thức trọng tâm:** Hashmap lưu vị trí tiền tố đầu tiên

Cho mảng $N$ phần tử và số $K$. Hãy tìm độ dài của **đoạn con liên tiếp dài nhất** có tổng bằng đúng $K$. Nếu không có đoạn con nào, in ra $0$.

### Input
- Dòng 1: hai số nguyên $N$ và $K$ ($1 \le N \le 10^5$, $-10^{14} \le K \le 10^{14}$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là độ dài đoạn con dài nhất (hoặc $0$).

### Example
| input | output |
| :--- | :--- |
| 5 3<br>1 2 3 -3 3 | 4 |

**Note**

Lưu vị trí xuất hiện **đầu tiên** của mỗi giá trị tiền tố trong `unordered_map`. Với mỗi $r$, nếu tiền tố $pre_r - K$ đã từng xuất hiện ở vị trí $p$ thì có đoạn con độ dài $r - p$. Chỉ ghi vị trí lần đầu để đoạn con dài nhất.

**Ý tưởng:** Lưu vị trí xuất hiện đầu tiên của mỗi tiền tố; với mỗi r tìm `pre-K` sớm nhất.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
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
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `5 3` `1 2 3 -3 3` | `4` | ví dụ mẫu / cơ bản |
| 2 | `1 5` `5` | `1` | cơ bản (công khai) |
| 3 | `1 3` `5` | `0` | cơ bản (công khai) |
| 4 | `4 0` `0 0 0 0` | `4` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `6 0` `1 -1 1 -1 1 -1` | `6` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `5 6` `2 2 2 2 2` | `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `5 9` `1 2 3 4 5` | `3` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `7 3` `-2 3 1 -1 2 -3 4` | `5` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `30 0` `-2 3 1 -2 5 -5 3 -4 -1 -4 5 -1 -2 3 -4 -1 4 -2 5 0 -4 5 4 0 5 -1 0 3 -2 -2` | `19` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 5 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

## Bài 30: 30. Chia ba phần bằng nhau
- **Mức độ:** Nâng cao
- **Kiến thức trọng tâm:** Tiền tố + đếm cộng dồn

Cho mảng $N$ phần tử. Hãy đếm số cách chia mảng thành **ba đoạn liên tiếp không rỗng** sao cho tổng ba đoạn bằng nhau.

### Input
- Dòng 1: số nguyên $N$ ($3 \le N \le 10^5$).
- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).

### Output
- Một số nguyên là số cách chia (có thể rất lớn).

### Example
| input | output |
| :--- | :--- |
| 6<br>1 2 3 0 3 3 | 0 |

**Note**

Nếu tổng cả mảng không chia hết cho $3$ thì đáp án là $0$. Đặt $part = tong/3$. Duyệt và đếm: với mỗi điểm cắt thứ hai (tiền tố $= 2 \cdot part$), cộng dồn số điểm cắt thứ nhất trước đó (tiền tố $= part$). Dùng `long long`.

**Ý tưởng:** Cần total chia hết 3; đếm điểm cắt 1 có tiền tố = part, cộng vào mỗi điểm cắt 2 có tiền tố = 2·part.

**Độ phức tạp:** O(N)

**Code C++17:**
```cpp
// 06E. Chia mảng thành 3 đoạn liên tiếp không rỗng có tổng bằng nhau.
// Đếm số cách. total phải chia hết cho 3. Với mỗi điểm cắt thứ hai j,
// cộng số điểm cắt thứ nhất i < j có tiền tố = total/3.
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n + 1);
    long long total = 0;
    for (int i = 1; i <= n; i++) { cin >> a[i]; total += a[i]; }

    if (total % 3 != 0) { cout << 0 << '\n'; return 0; }
    long long part = total / 3;

    long long pre = 0, ans = 0, waysFirst = 0;
    // duyệt j từ 2..n-1 là vị trí kết thúc đoạn 2; i (1..j-1) là kết thúc đoạn 1
    for (int j = 1; j <= n - 1; j++) {
        pre += a[j];
        // điểm cắt thứ hai hợp lệ tại j khi tiền tố = 2*part, ghép với waysFirst
        if (j >= 2 && pre == 2 * part) ans += waysFirst;
        // cập nhật số điểm cắt thứ nhất sau khi xét j làm điểm thứ hai
        if (pre == part) waysFirst++;
    }
    cout << ans << '\n';
    return 0;
}
```

**Bộ test (10 test):**
| # | Input | Output | Vai trò |
| :-- | :-- | :-- | :-- |
| 1 | `6` `1 2 3 0 3 3` | `0` | ví dụ mẫu / cơ bản |
| 2 | `3` `1 1 1` | `1` | cơ bản (công khai) |
| 3 | `2` `1 1` | `0` | cơ bản (công khai) |
| 4 | `6` `0 0 0 0 0 0` | `10` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 5 | `4` `3 3 3 1` | `0` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 6 | `9` `1 1 1 1 1 1 1 1 1` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 7 | `6` `2 -2 2 -2 2 -2` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 8 | `5` `3 3 6 5 1` | `1` | biên / số âm / n nhỏ / trường hợp dễ sai |
| 9 | `20` `-1 0 -3 -2 -3 -2 -1 -1 3 1 3 0 -3 -2 1 -2 2 -3 3 1` | `0` | n lớn gần giới hạn / ngẫu nhiên (ẩn) |
| 10 | _(test lớn — 1000 …)_ | _(đối chiếu khi chấm)_ | n lớn gần giới hạn / ngẫu nhiên (ẩn) |

---

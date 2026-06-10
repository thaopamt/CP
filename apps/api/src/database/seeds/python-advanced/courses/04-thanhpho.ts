import { CourseSpec } from '../../python-basic/types';

/**
 * Course PYTHON-ADV-04 — Cấp Thành phố.
 * Tier KHÓ NHẤT: luyện thi Tin học trẻ cấp thành phố.
 * Chủ đề: quy hoạch động (knapsack, LIS, LCS, edit distance, đường đi lưới),
 * đồ thị (BFS/DFS, thành phần liên thông, đường đi ngắn nhất, flood fill),
 * tổng tiền tố 2D, tổ hợp với modulo, chuỗi nâng cao, tham lam đoạn, đếm bit.
 *
 * NOTE for authors: mirror the basic-course shape. NEVER hand-write expected
 * outputs — every answer comes from solve(input). First 3 inputs are visible.
 * Outputs are ASCII only. Counting problems that can explode use modulo 1e9+7.
 */

const MOD = 1000000007;

// ---- shared helpers (Python-faithful integer semantics) ----
const toInt = (s: string) => parseInt(s.trim(), 10);
const firstLine = (input: string) => (input.split('\n')[0] ?? '').trim();
const lines = (input: string) => input.replace(/\n+$/, '').split('\n');
const readInts = (s: string): number[] =>
  (s ?? '')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));

const course: CourseSpec = {
  code: 'PYTHON-ADV-04',
  title: 'Cấp Thành phố',
  description:
    'Khóa luyện thi Tin học trẻ cấp thành phố — bậc cao nhất! Em sẽ chinh phục ' +
    'quy hoạch động, thuật toán đồ thị, tổ hợp với modulo và nhiều kỹ thuật nâng cao.',
  tags: ['python', 'nang-cao', 'tin-hoc-tre', 'cap-thanh-pho'],
  problems: [
    {
      key: '01',
      title: 'Cái túi (Knapsack 0/1)',
      difficulty: 'HARD',
      story:
        'Em có một chiếc túi chịu được trọng lượng tối đa `W` và `n` món đồ, mỗi món có trọng lượng và giá trị. ' +
        'Mỗi món chỉ lấy được tối đa một lần. Hãy chọn các món sao cho tổng giá trị lớn nhất mà tổng trọng lượng không vượt quá `W`.',
      inputDesc:
        'Dòng 1: hai số `n` và `W` (1 <= n <= 100, 1 <= W <= 1000). ' +
        'Tiếp theo `n` dòng, mỗi dòng hai số: trọng lượng và giá trị của một món đồ.',
      outputDesc: 'In ra tổng giá trị lớn nhất có thể đạt được.',
      note: 'Quy hoạch động 0/1 knapsack: dp[w] = giá trị tối đa với sức chứa w; duyệt w giảm dần. Độ phức tạp O(n*W).',
      solve: (input) => {
        const ls = lines(input);
        const [n, W] = readInts(ls[0]);
        const dp = new Array(W + 1).fill(0);
        for (let i = 1; i <= n; i++) {
          const [wt, val] = readInts(ls[i]);
          for (let w = W; w >= wt; w--) {
            if (dp[w - wt] + val > dp[w]) dp[w] = dp[w - wt] + val;
          }
        }
        return String(dp[W]);
      },
      inputs: [
        '3 5\n2 3\n3 4\n4 5',
        '4 10\n5 10\n4 40\n6 30\n3 50',
        '1 1\n2 100',
        '1 10\n10 7',
        '5 10\n2 3\n2 3\n2 3\n2 3\n2 3',
        '3 1000\n400 500\n500 600\n600 700',
        '2 6\n3 5\n3 5',
        '4 7\n1 1\n3 4\n4 5\n5 7',
      ],
    },
    {
      key: '02',
      title: 'Dãy con tăng dài nhất (LIS)',
      difficulty: 'HARD',
      story:
        'Cho một dãy gồm `n` số nguyên. Dãy con tăng là dãy lấy ra (giữ nguyên thứ tự, không nhất thiết liền nhau) sao cho ' +
        'các phần tử tăng nghiêm ngặt. Hãy tìm độ dài dãy con tăng dài nhất.',
      inputDesc: 'Dòng 1: số `n` (1 <= n <= 200). Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra độ dài dãy con tăng nghiêm ngặt dài nhất.',
      note: 'Quy hoạch động O(n^2): dp[i] = LIS kết thúc tại i = 1 + max(dp[j]) với j<i và a[j]<a[i].',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const n = a.length;
        if (n === 0) return '0';
        const dp = new Array(n).fill(1);
        let best = 1;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
          }
          if (dp[i] > best) best = dp[i];
        }
        return String(best);
      },
      inputs: [
        '6\n10 9 2 5 3 7',
        '5\n1 2 3 4 5',
        '1\n42',
        '5\n5 4 3 2 1',
        '8\n3 10 2 1 20 4 6 8',
        '4\n2 2 2 2',
        '7\n1 3 2 4 3 5 4',
        '6\n-5 -3 -4 -1 0 -2',
      ],
    },
    {
      key: '03',
      title: 'Dãy con chung dài nhất (LCS)',
      difficulty: 'HARD',
      story:
        'Cho hai chuỗi ký tự `A` và `B` (chỉ gồm chữ cái thường). Dãy con chung là chuỗi lấy ra từ cả hai (giữ nguyên thứ tự, ' +
        'không nhất thiết liền nhau). Hãy tìm độ dài dãy con chung dài nhất.',
      inputDesc: 'Dòng 1: chuỗi `A`. Dòng 2: chuỗi `B`. (Mỗi chuỗi dài tối đa 200 ký tự, có thể rỗng.)',
      outputDesc: 'In ra độ dài dãy con chung dài nhất của `A` và `B`.',
      note: 'Quy hoạch động bảng O(|A|*|B|): nếu A[i]==B[j] thì dp[i][j]=dp[i-1][j-1]+1, ngược lại max của hai ô lân cận.',
      solve: (input) => {
        const ls = input.replace(/\n+$/, '').split('\n');
        const A = ls[0] ?? '';
        const B = ls[1] ?? '';
        const m = A.length;
        const k = B.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(k + 1).fill(0));
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= k; j++) {
            if (A[i - 1] === B[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
        return String(dp[m][k]);
      },
      inputs: [
        'abcde\nace',
        'abc\nabc',
        'abc\ndef',
        'aggtab\ngxtxayb',
        'a\n',
        'xmjyauz\nmzjawxu',
        'aaaa\naa',
        'banana\natana',
      ],
    },
    {
      key: '04',
      title: 'Khoảng cách chỉnh sửa (Edit distance)',
      difficulty: 'HARD',
      story:
        'Cho hai chuỗi `A` và `B`. Mỗi bước em được phép: chèn một ký tự, xóa một ký tự, hoặc thay một ký tự. ' +
        'Hãy tìm số bước ít nhất để biến `A` thành `B`.',
      inputDesc: 'Dòng 1: chuỗi `A`. Dòng 2: chuỗi `B`. (Mỗi chuỗi dài tối đa 200 ký tự, có thể rỗng.)',
      outputDesc: 'In ra khoảng cách chỉnh sửa (Levenshtein) nhỏ nhất.',
      note: 'Quy hoạch động: dp[i][j] = nếu khớp dp[i-1][j-1], ngược lại 1 + min(xóa, chèn, thay). O(|A|*|B|).',
      solve: (input) => {
        const ls = input.replace(/\n+$/, '').split('\n');
        const A = ls[0] ?? '';
        const B = ls[1] ?? '';
        const m = A.length;
        const k = B.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(k + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= k; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= k; j++) {
            if (A[i - 1] === B[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
        return String(dp[m][k]);
      },
      inputs: [
        'kitten\nsitting',
        'abc\nabc',
        'abc\n',
        '\nxyz',
        'sunday\nsaturday',
        'horse\nros',
        'aaaa\naaaa',
        'intention\nexecution',
      ],
    },
    {
      key: '05',
      title: 'Đường đi chi phí nhỏ nhất trên lưới',
      difficulty: 'HARD',
      story:
        'Cho lưới `r` hàng `c` cột, mỗi ô có một chi phí không âm. Bắt đầu ở ô trên-trái (0,0), kết thúc ở ô dưới-phải (r-1,c-1). ' +
        'Mỗi bước chỉ được đi sang phải hoặc xuống dưới. Hãy tìm tổng chi phí nhỏ nhất của đường đi (tính cả ô đầu và ô cuối).',
      inputDesc:
        'Dòng 1: hai số `r` và `c` (1 <= r, c <= 20). Tiếp theo `r` dòng, mỗi dòng `c` số nguyên không âm là chi phí các ô.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất từ góc trên-trái tới góc dưới-phải.',
      note: 'Quy hoạch động: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]). O(r*c).',
      solve: (input) => {
        const ls = lines(input);
        const [r, c] = readInts(ls[0]);
        const g: number[][] = [];
        for (let i = 0; i < r; i++) g.push(readInts(ls[i + 1]));
        const dp: number[][] = Array.from({ length: r }, () => new Array(c).fill(0));
        for (let i = 0; i < r; i++) {
          for (let j = 0; j < c; j++) {
            if (i === 0 && j === 0) dp[i][j] = g[i][j];
            else if (i === 0) dp[i][j] = dp[i][j - 1] + g[i][j];
            else if (j === 0) dp[i][j] = dp[i - 1][j] + g[i][j];
            else dp[i][j] = g[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
          }
        }
        return String(dp[r - 1][c - 1]);
      },
      inputs: [
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 1\n5',
        '2 2\n1 2\n1 1',
        '1 4\n1 2 3 4',
        '4 1\n1 2 3 4',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
        '2 3\n1 2 5\n3 2 1',
        '3 4\n1 1 1 1\n9 9 9 1\n1 1 1 1',
      ],
    },
    {
      key: '06',
      title: 'Đếm đường đi trên lưới có vật cản',
      difficulty: 'HARD',
      story:
        'Cho lưới `r` hàng `c` cột. Ô `0` là đi được, ô `1` là vật cản. Bắt đầu ở ô (0,0), kết thúc ở ô (r-1,c-1), ' +
        'mỗi bước chỉ đi sang phải hoặc xuống dưới và không được vào ô vật cản. Hãy đếm số đường đi khác nhau.',
      inputDesc:
        'Dòng 1: hai số `r` và `c` (1 <= r, c <= 20). Tiếp theo `r` dòng, mỗi dòng `c` số (0 hoặc 1).',
      outputDesc: 'In ra số đường đi khác nhau theo modulo 1000000007. Nếu ô đầu hoặc ô cuối là vật cản thì kết quả là 0.',
      note: 'Quy hoạch động đếm đường: dp[i][j] = dp[i-1][j] + dp[i][j-1] (mod 1e9+7), ô vật cản dp = 0.',
      solve: (input) => {
        const ls = lines(input);
        const [r, c] = readInts(ls[0]);
        const g: number[][] = [];
        for (let i = 0; i < r; i++) g.push(readInts(ls[i + 1]));
        const dp: number[][] = Array.from({ length: r }, () => new Array(c).fill(0));
        for (let i = 0; i < r; i++) {
          for (let j = 0; j < c; j++) {
            if (g[i][j] === 1) {
              dp[i][j] = 0;
              continue;
            }
            if (i === 0 && j === 0) dp[i][j] = 1;
            else {
              let v = 0;
              if (i > 0) v += dp[i - 1][j];
              if (j > 0) v += dp[i][j - 1];
              dp[i][j] = v % MOD;
            }
          }
        }
        return String(dp[r - 1][c - 1] % MOD);
      },
      inputs: [
        '3 3\n0 0 0\n0 1 0\n0 0 0',
        '2 2\n0 0\n0 0',
        '1 1\n0',
        '1 1\n1',
        '3 3\n0 1 0\n0 1 0\n0 0 0',
        '2 2\n0 1\n1 0',
        '3 4\n0 0 0 0\n0 0 0 0\n0 0 0 0',
        '4 4\n0 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 0',
      ],
    },
    {
      key: '07',
      title: 'Đổi tiền - đếm cách',
      difficulty: 'HARD',
      story:
        'Em có các loại mệnh giá tiền (không giới hạn số tờ mỗi loại). Hãy đếm số cách tạo ra tổng số tiền `S` ' +
        '(thứ tự các tờ không quan trọng, ví dụ 1+2 và 2+1 là một cách).',
      inputDesc:
        'Dòng 1: hai số `n` và `S` (1 <= n <= 50, 0 <= S <= 1000). Dòng 2: `n` mệnh giá nguyên dương cách nhau dấu cách.',
      outputDesc: 'In ra số cách đổi tiền theo modulo 1000000007.',
      note: 'Quy hoạch động đếm tổ hợp: duyệt từng mệnh giá ngoài, dp[s] += dp[s-coin]. O(n*S).',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0]);
        const coins = readInts(ls[1]);
        const dp = new Array(S + 1).fill(0);
        dp[0] = 1;
        for (const coin of coins) {
          for (let s = coin; s <= S; s++) {
            dp[s] = (dp[s] + dp[s - coin]) % MOD;
          }
        }
        return String(dp[S] % MOD);
      },
      inputs: [
        '3 5\n1 2 5',
        '1 0\n7',
        '2 3\n2 4',
        '3 10\n2 3 5',
        '1 100\n1',
        '4 8\n1 2 3 4',
        '2 1000\n3 7',
        '3 6\n1 3 5',
      ],
    },
    {
      key: '08',
      title: 'Thành phần liên thông (DFS/BFS)',
      difficulty: 'HARD',
      story:
        'Cho một đồ thị vô hướng `n` đỉnh (đánh số từ 1) và `m` cạnh. Hãy đếm số thành phần liên thông của đồ thị.',
      inputDesc:
        'Dòng 1: hai số `n` và `m` (1 <= n <= 200, 0 <= m <= 1000). Tiếp theo `m` dòng, mỗi dòng hai số `u v` là một cạnh (1-indexed).',
      outputDesc: 'In ra số thành phần liên thông.',
      note: 'Duyệt DFS/BFS: với mỗi đỉnh chưa thăm, tăng bộ đếm rồi thăm toàn bộ thành phần. O(n+m).',
      solve: (input) => {
        const ls = lines(input);
        const [n, m] = readInts(ls[0]);
        const adj: number[][] = Array.from({ length: n + 1 }, () => []);
        for (let i = 0; i < m; i++) {
          const [u, v] = readInts(ls[i + 1]);
          adj[u].push(v);
          adj[v].push(u);
        }
        const seen = new Array(n + 1).fill(false);
        let comp = 0;
        for (let s = 1; s <= n; s++) {
          if (seen[s]) continue;
          comp++;
          const stack = [s];
          seen[s] = true;
          while (stack.length) {
            const u = stack.pop() as number;
            for (const v of adj[u]) {
              if (!seen[v]) {
                seen[v] = true;
                stack.push(v);
              }
            }
          }
        }
        return String(comp);
      },
      inputs: [
        '5 3\n1 2\n2 3\n4 5',
        '4 0',
        '3 3\n1 2\n2 3\n1 3',
        '1 0',
        '6 4\n1 2\n3 4\n5 6\n1 3',
        '5 4\n1 2\n2 3\n3 4\n4 5',
        '7 2\n1 7\n3 5',
        '2 1\n1 2',
      ],
    },
    {
      key: '09',
      title: 'Đường đi ngắn nhất trong mê cung (BFS)',
      difficulty: 'HARD',
      story:
        'Cho mê cung `r` hàng `c` cột. Ô `.` đi được, ô `#` là tường. Em xuất phát ở ô (0,0) và muốn tới ô (r-1,c-1), ' +
        'mỗi bước đi sang một trong 4 ô kề (lên/xuống/trái/phải) nếu ô đó đi được. Hãy tìm số bước ít nhất.',
      inputDesc:
        'Dòng 1: hai số `r` và `c` (1 <= r, c <= 20). Tiếp theo `r` dòng, mỗi dòng `c` ký tự `.` hoặc `#` (không có dấu cách).',
      outputDesc: 'In ra số bước ít nhất, hoặc `-1` nếu không thể tới đích (kể cả khi ô đầu/đích là tường).',
      note: 'BFS theo lớp trên lưới không trọng số: khoảng cách = số lớp. O(r*c).',
      solve: (input) => {
        const ls = lines(input);
        const [r, c] = readInts(ls[0]);
        const grid: string[] = [];
        for (let i = 0; i < r; i++) grid.push((ls[i + 1] ?? '').trim());
        if (grid[0][0] === '#' || grid[r - 1][c - 1] === '#') return '-1';
        const dist: number[][] = Array.from({ length: r }, () => new Array(c).fill(-1));
        const q: number[][] = [[0, 0]];
        dist[0][0] = 0;
        let head = 0;
        const dr = [-1, 1, 0, 0];
        const dc = [0, 0, -1, 1];
        while (head < q.length) {
          const [x, y] = q[head++];
          for (let k = 0; k < 4; k++) {
            const nx = x + dr[k];
            const ny = y + dc[k];
            if (nx >= 0 && nx < r && ny >= 0 && ny < c && dist[nx][ny] === -1 && grid[nx][ny] === '.') {
              dist[nx][ny] = dist[x][y] + 1;
              q.push([nx, ny]);
            }
          }
        }
        return String(dist[r - 1][c - 1]);
      },
      inputs: [
        '3 3\n...\n.#.\n...',
        '1 1\n.',
        '3 3\n..#\n##.\n...',
        '2 2\n.#\n#.',
        '1 5\n.....',
        '4 4\n....\n###.\n....\n.###',
        '3 3\n#..\n...\n...',
        '5 5\n.....\n.###.\n.#.#.\n.#.#.\n...#.',
      ],
    },
    {
      key: '10',
      title: 'Đếm vùng (Flood fill)',
      difficulty: 'HARD',
      story:
        'Cho lưới `r` hàng `c` cột gồm `0` (nước) và `1` (đất). Một "hòn đảo" là một nhóm các ô đất nối nhau theo 4 hướng ' +
        '(lên/xuống/trái/phải). Hãy đếm số hòn đảo.',
      inputDesc:
        'Dòng 1: hai số `r` và `c` (1 <= r, c <= 20). Tiếp theo `r` dòng, mỗi dòng `c` số (0 hoặc 1) cách nhau dấu cách.',
      outputDesc: 'In ra số hòn đảo.',
      note: 'Flood fill 4 hướng: mỗi ô đất chưa thăm khởi đầu một đảo mới, rồi loang toàn bộ đảo. O(r*c).',
      solve: (input) => {
        const ls = lines(input);
        const [r, c] = readInts(ls[0]);
        const g: number[][] = [];
        for (let i = 0; i < r; i++) g.push(readInts(ls[i + 1]));
        const seen: boolean[][] = Array.from({ length: r }, () => new Array(c).fill(false));
        const dr = [-1, 1, 0, 0];
        const dc = [0, 0, -1, 1];
        let count = 0;
        for (let i = 0; i < r; i++) {
          for (let j = 0; j < c; j++) {
            if (g[i][j] === 1 && !seen[i][j]) {
              count++;
              const stack = [[i, j]];
              seen[i][j] = true;
              while (stack.length) {
                const [x, y] = stack.pop() as number[];
                for (let k = 0; k < 4; k++) {
                  const nx = x + dr[k];
                  const ny = y + dc[k];
                  if (nx >= 0 && nx < r && ny >= 0 && ny < c && !seen[nx][ny] && g[nx][ny] === 1) {
                    seen[nx][ny] = true;
                    stack.push([nx, ny]);
                  }
                }
              }
            }
          }
        }
        return String(count);
      },
      inputs: [
        '3 3\n1 0 1\n0 0 0\n1 0 1',
        '2 2\n1 1\n1 1',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
        '1 5\n1 0 1 0 1',
        '4 4\n1 1 0 0\n1 0 0 1\n0 0 1 1\n0 0 0 1',
        '1 1\n1',
        '1 1\n0',
        '3 4\n1 1 1 1\n0 0 0 0\n1 1 1 1',
      ],
    },
    {
      key: '11',
      title: 'Tổng ma trận con (Prefix sum 2D)',
      difficulty: 'HARD',
      story:
        'Cho ma trận `r` hàng `c` cột các số nguyên và `q` truy vấn. Mỗi truy vấn cho 4 số `r1 c1 r2 c2` (0-indexed, ' +
        'r1<=r2, c1<=c2), hãy tính tổng các phần tử trong hình chữ nhật con từ (r1,c1) tới (r2,c2) (bao gồm cả biên).',
      inputDesc:
        'Dòng 1: hai số `r` và `c` (1 <= r, c <= 20). Tiếp theo `r` dòng, mỗi dòng `c` số nguyên. ' +
        'Dòng kế: số `q` (1 <= q <= 50). Tiếp theo `q` dòng, mỗi dòng 4 số `r1 c1 r2 c2`.',
      outputDesc: 'Với mỗi truy vấn, in ra tổng ma trận con trên một dòng.',
      note: 'Tính tổng tiền tố 2D P; tổng vùng = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]. O(r*c + q).',
      solve: (input) => {
        const ls = lines(input);
        const [r, c] = readInts(ls[0]);
        const P: number[][] = Array.from({ length: r + 1 }, () => new Array(c + 1).fill(0));
        for (let i = 0; i < r; i++) {
          const row = readInts(ls[i + 1]);
          for (let j = 0; j < c; j++) {
            P[i + 1][j + 1] = row[j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
          }
        }
        const q = toInt(ls[r + 1]);
        const out: string[] = [];
        for (let k = 0; k < q; k++) {
          const [r1, c1, r2, c2] = readInts(ls[r + 2 + k]);
          const sum = P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
          out.push(String(sum));
        }
        return out.join('\n');
      },
      inputs: [
        '3 3\n1 2 3\n4 5 6\n7 8 9\n2\n0 0 1 1\n1 1 2 2',
        '1 1\n5\n1\n0 0 0 0',
        '2 2\n1 1\n1 1\n1\n0 0 1 1',
        '3 3\n1 0 0\n0 1 0\n0 0 1\n1\n0 0 2 2',
        '2 4\n1 2 3 4\n5 6 7 8\n2\n0 0 0 3\n1 0 1 3',
        '4 4\n-1 -1 -1 -1\n-1 -1 -1 -1\n-1 -1 -1 -1\n-1 -1 -1 -1\n1\n0 0 3 3',
        '3 3\n2 2 2\n2 2 2\n2 2 2\n3\n0 0 0 0\n0 0 2 2\n1 1 1 1',
        '1 5\n10 20 30 40 50\n1\n0 1 0 3',
      ],
    },
    {
      key: '12',
      title: 'Tổ hợp chập (nCr mod p)',
      difficulty: 'HARD',
      story:
        'Cho hai số `n` và `r`. Hãy tính số tổ hợp chập `r` của `n` phần tử, ký hiệu C(n, r), tức số cách chọn `r` phần tử ' +
        'không phân biệt thứ tự từ `n` phần tử. Vì kết quả có thể rất lớn, hãy in theo modulo 1000000007.',
      inputDesc: 'Một dòng chứa hai số `n` và `r` (0 <= r <= n <= 1000).',
      outputDesc: 'In ra C(n, r) modulo 1000000007.',
      note: 'Tam giác Pascal mod p: C[i][j] = C[i-1][j-1] + C[i-1][j] (mod 1e9+7). O(n^2).',
      solve: (input) => {
        const [n, r] = readInts(firstLine(input));
        if (r < 0 || r > n) return '0';
        // Pascal row by row up to n, keep current row only.
        let row = [1];
        for (let i = 1; i <= n; i++) {
          const next = new Array(i + 1).fill(0);
          next[0] = 1;
          next[i] = 1;
          for (let j = 1; j < i; j++) {
            next[j] = (row[j - 1] + row[j]) % MOD;
          }
          row = next;
        }
        return String(row[r] % MOD);
      },
      inputs: [
        '5 2',
        '5 0',
        '5 5',
        '10 3',
        '1000 1',
        '1000 500',
        '6 3',
        '20 10',
      ],
    },
    {
      key: '13',
      title: 'Chuỗi đối xứng dài nhất',
      difficulty: 'HARD',
      story:
        'Cho một chuỗi ký tự `s`. Hãy tìm độ dài chuỗi con liền nhau (substring) dài nhất là chuỗi đối xứng (đọc xuôi ngược như nhau).',
      inputDesc: 'Một dòng chứa chuỗi `s` (dài tối đa 200 ký tự, gồm chữ cái thường, có thể rỗng).',
      outputDesc: 'In ra độ dài chuỗi con đối xứng liền nhau dài nhất. Chuỗi rỗng cho kết quả 0.',
      note: 'Quy hoạch động pal[i][j] hoặc loang từ tâm: mở rộng quanh mỗi tâm. O(n^2).',
      solve: (input) => {
        const s = (input.split('\n')[0] ?? '').trim();
        const n = s.length;
        if (n === 0) return '0';
        let best = 1;
        const expand = (l: number, r: number) => {
          while (l >= 0 && r < n && s[l] === s[r]) {
            if (r - l + 1 > best) best = r - l + 1;
            l--;
            r++;
          }
        };
        for (let i = 0; i < n; i++) {
          expand(i, i);
          expand(i, i + 1);
        }
        return String(best);
      },
      inputs: [
        'babad',
        'cbbd',
        'a',
        'abcde',
        'aaaa',
        'forgeeksskeegfor',
        'racecar',
        'abacabad',
      ],
    },
    {
      key: '14',
      title: 'Đếm số lần xuất hiện mẫu',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi văn bản `T` và một chuỗi mẫu `P`. Hãy đếm số lần `P` xuất hiện trong `T` (các lần xuất hiện được phép chồng lấn nhau).',
      inputDesc: 'Dòng 1: chuỗi `T`. Dòng 2: chuỗi `P` (không rỗng). Mỗi chuỗi dài tối đa 200 ký tự, gồm chữ cái thường.',
      outputDesc: 'In ra số lần xuất hiện của `P` trong `T`.',
      note: 'Trượt cửa sổ độ dài |P| qua T, so khớp từng vị trí. O(|T|*|P|), đủ nhanh với giới hạn nhỏ.',
      solve: (input) => {
        const ls = input.replace(/\n+$/, '').split('\n');
        const T = ls[0] ?? '';
        const P = ls[1] ?? '';
        if (P.length === 0 || P.length > T.length) return '0';
        let count = 0;
        for (let i = 0; i + P.length <= T.length; i++) {
          if (T.substr(i, P.length) === P) count++;
        }
        return String(count);
      },
      inputs: [
        'ababab\nab',
        'aaaa\naa',
        'abcabc\nabc',
        'hello\nz',
        'aaa\naaaa',
        'mississippi\nissi',
        'banana\nana',
        'abcdef\nabcdef',
      ],
    },
    {
      key: '15',
      title: 'Lập lịch hoạt động (Interval greedy)',
      difficulty: 'HARD',
      story:
        'Cho `n` hoạt động, mỗi hoạt động có thời điểm bắt đầu và kết thúc. Em chỉ tham gia được một hoạt động tại một thời điểm. ' +
        'Hai hoạt động không xung đột nếu hoạt động sau bắt đầu vào lúc hoặc sau khi hoạt động trước kết thúc. Hãy tìm số hoạt động nhiều nhất có thể tham gia.',
      inputDesc:
        'Dòng 1: số `n` (1 <= n <= 200). Tiếp theo `n` dòng, mỗi dòng hai số: thời điểm bắt đầu và kết thúc (bắt đầu <= kết thúc).',
      outputDesc: 'In ra số hoạt động nhiều nhất có thể tham gia.',
      note: 'Tham lam: sắp xếp theo thời điểm kết thúc tăng dần, luôn chọn hoạt động kết thúc sớm nhất còn hợp lệ. O(n log n).',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0]);
        const acts: number[][] = [];
        for (let i = 0; i < n; i++) {
          const [s, e] = readInts(ls[i + 1]);
          acts.push([s, e]);
        }
        acts.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        let count = 0;
        let lastEnd = -Infinity;
        for (const [s, e] of acts) {
          if (s >= lastEnd) {
            count++;
            lastEnd = e;
          }
        }
        return String(count);
      },
      inputs: [
        '3\n1 2\n2 3\n3 4',
        '1\n5 10',
        '4\n1 3\n2 5\n4 7\n6 8',
        '3\n1 10\n2 3\n4 5',
        '5\n0 1\n0 1\n0 1\n0 1\n0 1',
        '6\n1 4\n3 5\n0 6\n5 7\n3 9\n5 9',
        '2\n1 100\n1 100',
        '4\n1 2\n1 2\n3 4\n3 4',
      ],
    },
    {
      key: '16',
      title: 'Đếm bit 1 tổng cộng',
      difficulty: 'MEDIUM',
      story:
        'Cho `n`, hãy tính tổng số bit 1 trong biểu diễn nhị phân của tất cả các số từ 0 đến `n` (kể cả 0 và `n`).',
      inputDesc: 'Một dòng chứa số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'In ra tổng số bit 1 của mọi số trong đoạn [0, n].',
      note: 'Đếm popcount từng số (dùng phép & và dịch bit), cộng dồn. O(n log n).',
      solve: (input) => {
        const n = toInt(firstLine(input));
        let total = 0;
        for (let x = 0; x <= n; x++) {
          let v = x;
          while (v > 0) {
            total += v & 1;
            v = Math.floor(v / 2);
          }
        }
        return String(total);
      },
      inputs: [
        '5',
        '0',
        '1',
        '2',
        '7',
        '100',
        '1000',
        '1023',
      ],
    },
    {
      key: '17',
      title: 'Tập con có tổng (Subset sum)',
      difficulty: 'HARD',
      story:
        'Cho `n` số nguyên dương và một mục tiêu `S`. Hãy cho biết có thể chọn một tập con (có thể rỗng) sao cho tổng các phần tử ' +
        'đúng bằng `S` hay không.',
      inputDesc:
        'Dòng 1: hai số `n` và `S` (1 <= n <= 100, 0 <= S <= 1000). Dòng 2: `n` số nguyên dương cách nhau dấu cách.',
      outputDesc: 'In `YES` nếu tồn tại tập con có tổng bằng `S`, ngược lại in `NO`.',
      note: 'Quy hoạch động boolean: dp[s] = có thể tạo tổng s; duyệt từng số, cập nhật s giảm dần. O(n*S).',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const dp = new Array(S + 1).fill(false);
        dp[0] = true;
        for (const x of a) {
          for (let s = S; s >= x; s--) {
            if (dp[s - x]) dp[s] = true;
          }
        }
        return dp[S] ? 'YES' : 'NO';
      },
      inputs: [
        '4 9\n3 34 4 12',
        '4 30\n3 34 4 12',
        '1 0\n5',
        '3 7\n2 3 5',
        '3 1\n2 4 6',
        '5 11\n1 2 3 4 5',
        '2 1000\n500 500',
        '3 1000\n100 200 300',
      ],
    },
    {
      key: '18',
      title: 'Tổng đoạn con lớn nhất (Kadane)',
      difficulty: 'HARD',
      story:
        'Cho một dãy gồm `n` số nguyên (có thể âm). Hãy tìm tổng lớn nhất của một đoạn con liền nhau, không rỗng.',
      inputDesc: 'Dòng 1: số `n` (1 <= n <= 200). Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra tổng lớn nhất của một đoạn con liền nhau không rỗng.',
      note: 'Thuật toán Kadane: cur = max(x, cur + x), best = max(best, cur). O(n).',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        let cur = a[0];
        let best = a[0];
        for (let i = 1; i < a.length; i++) {
          cur = Math.max(a[i], cur + a[i]);
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '8\n-2 1 -3 4 -1 2 1 -5',
        '1\n5',
        '1\n-3',
        '5\n-1 -2 -3 -4 -5',
        '4\n1 2 3 4',
        '5\n5 -2 5 -2 5',
        '3\n-2 -1 -3',
        '6\n2 -8 3 -2 4 -10',
      ],
    },
    {
      key: '19',
      title: 'Đường đi dài nhất trong DAG',
      difficulty: 'HARD',
      story:
        'Cho một đồ thị có hướng không chu trình (DAG) gồm `n` đỉnh (đánh số từ 1) và `m` cạnh có hướng. ' +
        'Hãy tìm số cạnh nhiều nhất trên một đường đi (độ dài đường đi dài nhất, tính theo số cạnh).',
      inputDesc:
        'Dòng 1: hai số `n` và `m` (1 <= n <= 200, 0 <= m <= 1000). Tiếp theo `m` dòng, mỗi dòng `u v` là cạnh có hướng u->v (1-indexed). Đồ thị bảo đảm không có chu trình.',
      outputDesc: 'In ra số cạnh trên đường đi dài nhất (0 nếu đồ thị không có cạnh).',
      note: 'Quy hoạch động trên thứ tự topo: longest[v] = 1 + max(longest[u]) theo cạnh u->v. O(n+m).',
      solve: (input) => {
        const ls = lines(input);
        const [n, m] = readInts(ls[0]);
        const adj: number[][] = Array.from({ length: n + 1 }, () => []);
        const indeg = new Array(n + 1).fill(0);
        for (let i = 0; i < m; i++) {
          const [u, v] = readInts(ls[i + 1]);
          adj[u].push(v);
          indeg[v]++;
        }
        // Kahn topo sort.
        const queue: number[] = [];
        for (let v = 1; v <= n; v++) if (indeg[v] === 0) queue.push(v);
        const dist = new Array(n + 1).fill(0);
        let head = 0;
        let best = 0;
        const ind = indeg.slice();
        while (head < queue.length) {
          const u = queue[head++];
          if (dist[u] > best) best = dist[u];
          for (const v of adj[u]) {
            if (dist[u] + 1 > dist[v]) dist[v] = dist[u] + 1;
            ind[v]--;
            if (ind[v] === 0) queue.push(v);
          }
        }
        return String(best);
      },
      inputs: [
        '4 3\n1 2\n2 3\n3 4',
        '3 0',
        '1 0',
        '5 4\n1 2\n1 3\n3 4\n4 5',
        '6 6\n1 2\n2 3\n1 4\n4 5\n5 6\n3 6',
        '2 1\n1 2',
        '4 2\n1 2\n3 4',
        '5 5\n1 2\n2 3\n3 4\n4 5\n1 5',
      ],
    },
    {
      key: '20',
      title: 'Chia kẹo cân bằng (Partition)',
      difficulty: 'HARD',
      story:
        'Cho `n` viên kẹo với khối lượng nguyên dương. Hãy chia chúng thành hai phần sao cho chênh lệch tổng khối lượng giữa hai phần là nhỏ nhất. ' +
        'Hãy in ra giá trị chênh lệch nhỏ nhất đó.',
      inputDesc:
        'Dòng 1: số `n` (1 <= n <= 100). Dòng 2: `n` khối lượng nguyên dương cách nhau dấu cách (tổng khối lượng <= 2000).',
      outputDesc: 'In ra chênh lệch nhỏ nhất giữa tổng hai phần.',
      note: 'Quy hoạch động subset-sum: tìm tổng đạt được gần tổng/2 nhất; đáp số = total - 2*best. O(n*total).',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        let total = 0;
        for (const x of a) total += x;
        const half = Math.floor(total / 2);
        const dp = new Array(half + 1).fill(false);
        dp[0] = true;
        for (const x of a) {
          for (let s = half; s >= x; s--) {
            if (dp[s - x]) dp[s] = true;
          }
        }
        let best = 0;
        for (let s = half; s >= 0; s--) {
          if (dp[s]) {
            best = s;
            break;
          }
        }
        return String(total - 2 * best);
      },
      inputs: [
        '4\n1 6 11 5',
        '1\n7',
        '2\n10 10',
        '3\n1 2 3',
        '5\n3 1 4 2 2',
        '4\n8 7 5 3',
        '6\n1 1 1 1 1 1',
        '3\n100 100 100',
      ],
    },
  ],
};

export default course;

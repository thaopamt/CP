import { CourseSpec } from '../types';

/**
 * Chương 3 — DP 2 chiều cơ bản.
 * Mục tiêu: làm quen với bảng dp hai chiều qua các bài đường đi trong lưới: đếm
 * số đường, đường đi tổng nhỏ/lớn nhất, lưới có vật cản, hình vuông toàn 1.
 *
 * NOTE cho người viết: không bao giờ tự gõ đáp án — luôn trả về từ solve(input).
 * 3 input đầu là test mẫu hiển thị. Kích thước lưới giữ nhỏ để mọi giá trị nằm
 * trong số nguyên an toàn của JS.
 */

const readInts = (line: string): number[] =>
  line
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));
const lines = (input: string): string[] => input.replace(/\r/g, '').split('\n');

/** Đọc lưới m×n: dòng đầu "m n", m dòng tiếp theo mỗi dòng n số. */
const readGrid = (input: string): { m: number; n: number; g: number[][] } => {
  const ls = lines(input);
  const [m, n] = readInts(ls[0]);
  const g: number[][] = [];
  for (let i = 0; i < m; i++) g.push(readInts(ls[1 + i]));
  return { m, n, g };
};

const course: CourseSpec = {
  code: 'DP-BASIC-03',
  title: 'Chương 3: DP 2 chiều cơ bản',
  description:
    'Quy hoạch động trên bảng hai chiều: đếm số đường đi trong lưới, đường đi ' +
    'tổng nhỏ nhất / lớn nhất, lưới có vật cản, tam giác số và hình vuông toàn 1.',
  tags: ['quy-hoach-dong', 'co-ban', 'dp-2-chieu', 'luoi', 'unique-paths'],
  problems: [
    {
      key: '01',
      title: 'Đếm số đường đi trong lưới',
      difficulty: 'EASY',
      story:
        'Một robot đứng ở góc trên bên trái của một lưới $m \\times n$ (ô $(0,0)$). Mỗi bước robot chỉ được đi sang **phải** hoặc xuống **dưới**.\n\n' +
        'Hỏi có bao nhiêu đường đi khác nhau để robot tới được góc dưới bên phải (ô $(m-1, n-1)$)?',
      inputDesc: 'Một dòng chứa hai số nguyên $m$ và $n$ $(1 \\le m, n \\le 15)$.',
      outputDesc: 'In ra số đường đi.',
      note: 'dp[i][j] = dp[i-1][j] + dp[i][j-1]; hàng đầu và cột đầu đều bằng 1.',
      solve: (input) => {
        const [m, n] = readInts(lines(input)[0]);
        const dp = new Array(n).fill(1);
        for (let i = 1; i < m; i++) {
          for (let j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
          }
        }
        return String(dp[n - 1]);
      },
      inputs: ['3 7', '3 2', '1 1', '1 10', '10 1', '10 10', '15 15'],
    },
    {
      key: '02',
      title: 'Đường đi trong lưới có vật cản',
      difficulty: 'MEDIUM',
      story:
        'Vẫn là robot đi từ góc trên trái xuống góc dưới phải, mỗi bước sang phải hoặc xuống dưới. Nhưng lưới $m \\times n$ có một số ô bị chặn (đánh dấu $1$) mà robot không được đi qua.\n\n' +
        'Hãy đếm số đường đi hợp lệ. Nếu ô xuất phát hoặc ô đích bị chặn thì kết quả là $0$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 15)$. $m$ dòng tiếp theo, mỗi dòng $n$ số: $1$ là ô bị chặn, $0$ là ô đi được.',
      outputDesc: 'In ra số đường đi hợp lệ.',
      note: 'Ô bị chặn có dp = 0; ô còn lại dp[i][j] = dp[i-1][j] + dp[i][j-1].',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) {
              dp[i][j] = 0;
            } else if (i === 0 && j === 0) {
              dp[i][j] = 1;
            } else {
              dp[i][j] = (i > 0 ? dp[i - 1][j] : 0) + (j > 0 ? dp[i][j - 1] : 0);
            }
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n0 0 0\n0 1 0\n0 0 0',
        '2 2\n0 1\n0 0',
        '1 1\n0',
        '1 1\n1',
        '1 4\n0 0 1 0',
        '3 1\n0\n1\n0',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '03',
      title: 'Đường đi tổng nhỏ nhất',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$ gồm các số không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Chi phí của một đường đi là tổng các số trên các ô nó đi qua. Hãy tìm chi phí nhỏ nhất.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra tổng nhỏ nhất.',
      note: 'dp[i][j] = g[i][j] + min(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const up = i > 0 ? dp[i - 1][j] : Infinity;
            const left = j > 0 ? dp[i][j - 1] : Infinity;
            const best = i === 0 && j === 0 ? 0 : Math.min(up, left);
            dp[i][j] = g[i][j] + best;
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 3\n1 2 3',
        '2 2\n1 2\n1 1',
        '1 1\n5',
        '3 1\n2\n3\n4',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '04',
      title: 'Đường đi nhặt vàng nhiều nhất',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$, ô $(i,j)$ có $g_{ij}$ thỏi vàng. Robot đi từ góc trên trái xuống góc dưới phải, mỗi bước sang phải hoặc xuống dưới, và nhặt vàng ở mọi ô đi qua.\n\n' +
        'Hãy tìm số vàng nhiều nhất robot có thể nhặt được.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra số vàng nhiều nhất.',
      note: 'dp[i][j] = g[i][j] + max(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const up = i > 0 ? dp[i - 1][j] : 0;
            const left = j > 0 ? dp[i][j - 1] : 0;
            dp[i][j] = g[i][j] + Math.max(up, left);
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '2 2\n0 0\n0 0',
        '1 4\n1 2 3 4',
        '1 1\n7',
        '4 1\n1\n2\n3\n4',
        '2 3\n1 1 1\n1 9 1',
      ],
    },
    {
      key: '05',
      title: 'Tam giác số tổng nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một tam giác số gồm $n$ hàng: hàng thứ $i$ (đánh số từ $1$) có đúng $i$ số.\n\n' +
        'Bắt đầu từ đỉnh, mỗi bước em đi xuống một trong hai số kề ngay bên dưới (vị trí $j$ ở hàng $i$ đi xuống vị trí $j$ hoặc $j+1$ ở hàng $i+1$).\n\n' +
        'Hãy tìm tổng nhỏ nhất của một đường đi từ đỉnh xuống đáy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 200)$. $n$ dòng tiếp theo mô tả tam giác, dòng thứ $i$ có $i$ số nguyên không âm $(\\le 1000)$.',
      outputDesc: 'In ra tổng nhỏ nhất.',
      note: 'Tính từ đáy lên: dp[j] = t[i][j] + min(dp[j], dp[j+1]).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const tri: number[][] = [];
        for (let i = 0; i < n; i++) tri.push(readInts(ls[1 + i]));
        const dp = tri[n - 1].slice();
        for (let i = n - 2; i >= 0; i--) {
          for (let j = 0; j <= i; j++) {
            dp[j] = tri[i][j] + Math.min(dp[j], dp[j + 1]);
          }
        }
        return String(dp[0]);
      },
      inputs: [
        '4\n2\n3 4\n6 5 7\n4 1 8 3',
        '1\n5',
        '2\n1\n2 3',
        '1\n0',
        '3\n1\n2 2\n3 3 3',
        '3\n5\n9 6\n4 6 8',
      ],
    },
    {
      key: '06',
      title: 'Đường rơi tổng nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới vuông $n \\times n$. Một "đường rơi" bắt đầu ở một ô bất kỳ trên hàng đầu tiên và kết thúc ở hàng cuối cùng.\n\n' +
        'Từ ô $(i, j)$ em rơi xuống một trong ba ô: $(i+1, j-1)$, $(i+1, j)$ hoặc $(i+1, j+1)$ (nếu còn nằm trong lưới).\n\n' +
        'Hãy tìm tổng nhỏ nhất của một đường rơi.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. $n$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-100 \\le g_{ij} \\le 100)$.',
      outputDesc: 'In ra tổng nhỏ nhất.',
      note: 'dp[i][j] = g[i][j] + min(dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1]).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const g: number[][] = [];
        for (let i = 0; i < n; i++) g.push(readInts(ls[1 + i]));
        let prev = g[0].slice();
        for (let i = 1; i < n; i++) {
          const cur = new Array(n).fill(0);
          for (let j = 0; j < n; j++) {
            let best = prev[j];
            if (j > 0) best = Math.min(best, prev[j - 1]);
            if (j < n - 1) best = Math.min(best, prev[j + 1]);
            cur[j] = g[i][j] + best;
          }
          prev = cur;
        }
        return String(Math.min(...prev));
      },
      inputs: [
        '3\n2 1 3\n6 5 4\n7 8 9',
        '1\n5',
        '2\n1 2\n3 4',
        '1\n-7',
        '3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9',
        '3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '07',
      title: 'Hình vuông toàn số 1 lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Hãy tìm cạnh của hình vuông con lớn nhất mà mọi ô bên trong đều bằng $1$.\n\n' +
        'Ví dụ nếu hình vuông toàn $1$ lớn nhất có kích thước $2 \\times 2$ thì đáp án là $2$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 200)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra độ dài cạnh của hình vuông toàn $1$ lớn nhất (bằng $0$ nếu không có ô $1$ nào).',
      note: 'dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) nếu g[i][j] = 1.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        let best = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) {
              dp[i][j] =
                i === 0 || j === 0
                  ? 1
                  : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
              if (dp[i][j] > best) best = dp[i][j];
            }
          }
        }
        return String(best);
      },
      inputs: [
        '3 4\n1 0 1 1\n1 1 1 1\n0 1 1 1',
        '2 2\n0 0\n0 0',
        '1 5\n1 1 1 1 1',
        '1 1\n1',
        '1 1\n0',
        '4 1\n1\n1\n1\n1',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '08',
      title: 'Đếm hình vuông toàn số 1',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Hãy đếm **tổng số** hình vuông con (với mọi kích thước $1 \\times 1$, $2 \\times 2$, $\\dots$) mà mọi ô bên trong đều bằng $1$.\n\n' +
        'Ví dụ một hình vuông $2 \\times 2$ toàn $1$ sẽ đóng góp: bốn hình $1 \\times 1$ và một hình $2 \\times 2$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 200)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra tổng số hình vuông toàn $1$.',
      note: 'dp[i][j] vừa là cạnh hình vuông lớn nhất kết thúc tại (i,j), vừa là số hình vuông kết thúc tại đó; cộng dồn mọi dp[i][j].',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        let total = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) {
              dp[i][j] =
                i === 0 || j === 0
                  ? 1
                  : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
              total += dp[i][j];
            }
          }
        }
        return String(total);
      },
      inputs: [
        '3 4\n0 1 1 1\n1 1 1 1\n0 1 1 1',
        '2 2\n1 1\n1 1',
        '1 3\n1 0 1',
        '1 1\n0',
        '1 1\n1',
        '2 2\n0 0\n0 0',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '09',
      title: 'Robot đi thêm hướng chéo',
      difficulty: 'EASY',
      story:
        'Một robot đứng ở góc trên trái của lưới $m \\times n$ và muốn tới góc dưới phải. Mỗi bước robot có thể đi **sang phải**, xuống **dưới**, hoặc đi **chéo** xuống-phải (giảm khoảng cách theo cả hai chiều).\n\n' +
        'Hãy đếm số đường đi khác nhau.',
      inputDesc: 'Một dòng chứa hai số nguyên $m$ và $n$ $(1 \\le m, n \\le 12)$.',
      outputDesc: 'In ra số đường đi.',
      note: 'dp[i][j] = dp[i-1][j] + dp[i][j-1] + dp[i-1][j-1].',
      solve: (input) => {
        const [m, n] = readInts(lines(input)[0]);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) dp[i][j] = 1;
            else {
              dp[i][j] =
                (i > 0 ? dp[i - 1][j] : 0) +
                (j > 0 ? dp[i][j - 1] : 0) +
                (i > 0 && j > 0 ? dp[i - 1][j - 1] : 0);
            }
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: ['3 3', '1 1', '2 2', '1 7', '8 1', '3 4', '5 5'],
    },
    {
      key: '10',
      title: 'Đường đi qua điểm hẹn',
      difficulty: 'MEDIUM',
      story:
        'Robot đi từ góc trên trái $(0,0)$ tới góc dưới phải $(m-1, n-1)$ của lưới $m \\times n$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Có một "điểm hẹn" ở ô $(r, c)$ mà robot **bắt buộc** phải đi qua. Hãy đếm số đường đi thỏa mãn điều kiện này.',
      inputDesc:
        'Một dòng chứa bốn số nguyên $m$, $n$, $r$, $c$ $(1 \\le m, n \\le 15;\\ 0 \\le r < m;\\ 0 \\le c < n)$.',
      outputDesc: 'In ra số đường đi đi qua điểm hẹn.',
      note: 'Số đường đi từ A tới B (chỉ phải/xuống) = C(khoảng cách hàng + khoảng cách cột, khoảng cách hàng). Nhân số đường (0,0)→(r,c) với (r,c)→(m-1,n-1).',
      solve: (input) => {
        const [m, n, r, c] = readInts(lines(input)[0]);
        // số đường từ (0,0) tới (a,b) chỉ đi phải/xuống = C(a+b, a)
        const comb = (a: number, b: number): number => {
          let res = 1;
          const k = Math.min(b, a - b);
          for (let i = 0; i < k; i++) {
            res = (res * (a - i)) / (i + 1);
          }
          return Math.round(res);
        };
        const toCheckpoint = comb(r + c, r);
        const fromCheckpoint = comb(m - 1 - r + (n - 1 - c), m - 1 - r);
        return String(toCheckpoint * fromCheckpoint);
      },
      inputs: ['3 3 1 1', '3 7 0 0', '1 1 0 0', '5 5 4 4', '1 6 0 3', '6 1 4 0', '4 4 2 1'],
    },
    {
      key: '11',
      title: 'Tam giác số tổng lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một tam giác số gồm $n$ hàng: hàng thứ $i$ (đánh số từ $1$) có đúng $i$ số.\n\n' +
        'Bắt đầu từ đỉnh, mỗi bước em đi xuống một trong hai số kề ngay bên dưới (vị trí $j$ ở hàng $i$ đi xuống vị trí $j$ hoặc $j+1$ ở hàng $i+1$).\n\n' +
        'Hãy tìm tổng **lớn nhất** của một đường đi từ đỉnh xuống đáy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 200)$. $n$ dòng tiếp theo mô tả tam giác, dòng thứ $i$ có $i$ số nguyên không âm $(\\le 1000)$.',
      outputDesc: 'In ra tổng lớn nhất.',
      note: 'Tính từ đáy lên: dp[j] = t[i][j] + max(dp[j], dp[j+1]).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const tri: number[][] = [];
        for (let i = 0; i < n; i++) tri.push(readInts(ls[1 + i]));
        const dp = tri[n - 1].slice();
        for (let i = n - 2; i >= 0; i--) {
          for (let j = 0; j <= i; j++) {
            dp[j] = tri[i][j] + Math.max(dp[j], dp[j + 1]);
          }
        }
        return String(dp[0]);
      },
      inputs: [
        '4\n2\n3 4\n6 5 7\n4 1 8 3',
        '1\n5',
        '2\n1\n2 3',
        '1\n0',
        '3\n0\n0 0\n0 0 0',
        '3\n5\n9 6\n4 6 8',
      ],
    },
    {
      key: '12',
      title: 'Đường rơi tổng lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới vuông $n \\times n$. Một "đường rơi" bắt đầu ở một ô bất kỳ trên hàng đầu tiên và kết thúc ở hàng cuối cùng.\n\n' +
        'Từ ô $(i, j)$ em rơi xuống một trong ba ô: $(i+1, j-1)$, $(i+1, j)$ hoặc $(i+1, j+1)$ (nếu còn nằm trong lưới).\n\n' +
        'Hãy tìm tổng **lớn nhất** của một đường rơi.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. $n$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-100 \\le g_{ij} \\le 100)$.',
      outputDesc: 'In ra tổng lớn nhất.',
      note: 'dp[i][j] = g[i][j] + max(dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1]).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const g: number[][] = [];
        for (let i = 0; i < n; i++) g.push(readInts(ls[1 + i]));
        let prev = g[0].slice();
        for (let i = 1; i < n; i++) {
          const cur = new Array(n).fill(0);
          for (let j = 0; j < n; j++) {
            let best = prev[j];
            if (j > 0) best = Math.max(best, prev[j - 1]);
            if (j < n - 1) best = Math.max(best, prev[j + 1]);
            cur[j] = g[i][j] + best;
          }
          prev = cur;
        }
        return String(Math.max(...prev));
      },
      inputs: [
        '3\n2 1 3\n6 5 4\n7 8 9',
        '1\n5',
        '2\n1 2\n3 4',
        '1\n-7',
        '3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9',
        '3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '13',
      title: 'Mỏ vàng',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$, ô $(i,j)$ chứa $g_{ij}$ vàng. Một thợ mỏ bắt đầu ở **một ô bất kỳ của cột đầu tiên** (cột $0$).\n\n' +
        'Mỗi bước anh ta đi sang phải theo một trong ba hướng: phải-lên $(i-1, j+1)$, phải-ngang $(i, j+1)$, hoặc phải-xuống $(i+1, j+1)$ (nếu còn trong lưới), và nhặt vàng ở mọi ô đi qua.\n\n' +
        'Hãy tìm số vàng nhiều nhất anh ta có thể thu được khi đi tới cột cuối cùng.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra số vàng nhiều nhất.',
      note: 'Quét theo từng cột từ trái sang phải. dp[i][j] = g[i][j] + max(dp[i-1][j-1], dp[i][j-1], dp[i+1][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        let prev = new Array(m).fill(0);
        for (let i = 0; i < m; i++) prev[i] = g[i][0];
        for (let j = 1; j < n; j++) {
          const cur = new Array(m).fill(0);
          for (let i = 0; i < m; i++) {
            let best = prev[i];
            if (i > 0) best = Math.max(best, prev[i - 1]);
            if (i < m - 1) best = Math.max(best, prev[i + 1]);
            cur[i] = g[i][j] + best;
          }
          prev = cur;
        }
        return String(Math.max(...prev));
      },
      inputs: [
        '3 3\n1 3 3\n2 1 4\n0 6 4',
        '1 4\n1 2 3 4',
        '3 1\n5\n2\n8',
        '1 1\n9',
        '2 2\n0 0\n0 0',
        '3 4\n1 1 1 1\n1 9 1 1\n1 1 1 1',
      ],
    },
    {
      key: '14',
      title: 'Đường đi tổng nhỏ nhất có nước đi chéo',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$ gồm các số không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước được đi **sang phải**, xuống **dưới**, hoặc **chéo** xuống-phải.\n\n' +
        'Chi phí của một đường đi là tổng các số trên các ô nó đi qua. Hãy tìm chi phí nhỏ nhất.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra tổng nhỏ nhất.',
      note: 'dp[i][j] = g[i][j] + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : Infinity;
            const left = j > 0 ? dp[i][j - 1] : Infinity;
            const diag = i > 0 && j > 0 ? dp[i - 1][j - 1] : Infinity;
            dp[i][j] = g[i][j] + Math.min(up, left, diag);
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 3\n1 2 3',
        '2 2\n1 2\n3 1',
        '1 1\n5',
        '3 1\n2\n3\n4',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '15',
      title: 'Đếm số đường đi tổng nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới. Trong tất cả các đường đi, có một (hoặc nhiều) đường có **tổng nhỏ nhất**.\n\n' +
        'Hãy đếm xem có bao nhiêu đường đi đạt tổng nhỏ nhất đó.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 30)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra số đường đi có tổng nhỏ nhất.',
      note: 'Lưu cặp (tổng nhỏ nhất, số cách đạt nó) cho mỗi ô; cộng số cách của các ô trên kề có cùng tổng tối ưu.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const best: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        const cnt: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              best[i][j] = g[i][j];
              cnt[i][j] = 1;
              continue;
            }
            const up = i > 0 ? best[i - 1][j] : Infinity;
            const left = j > 0 ? best[i][j - 1] : Infinity;
            const m0 = Math.min(up, left);
            best[i][j] = g[i][j] + m0;
            let c = 0;
            if (i > 0 && best[i - 1][j] === m0) c += cnt[i - 1][j];
            if (j > 0 && best[i][j - 1] === m0) c += cnt[i][j - 1];
            cnt[i][j] = c;
          }
        }
        return String(cnt[m - 1][n - 1]);
      },
      inputs: [
        '2 2\n1 1\n1 1',
        '1 3\n1 2 3',
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 1\n5',
        '3 1\n2\n3\n4',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '16',
      title: 'Đường đi tích lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Giá trị của một đường đi là **tích** các số trên các ô nó đi qua. Hãy tìm tích lớn nhất.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 6)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 9)$.',
      outputDesc: 'In ra tích lớn nhất.',
      note: 'Lưới chỉ chứa số không âm nên dp[i][j] = g[i][j] * max(dp[i-1][j], dp[i][j-1]); nếu có số 0 trên đường thì tích bằng 0.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : 0;
            const left = j > 0 ? dp[i][j - 1] : 0;
            const base = i === 0 ? left : j === 0 ? up : Math.max(up, left);
            dp[i][j] = g[i][j] * base;
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '2 2\n1 2\n3 4',
        '1 3\n2 3 4',
        '3 3\n1 2 1\n2 2 2\n1 2 1',
        '1 1\n7',
        '2 2\n5 0\n0 5',
        '3 1\n2\n3\n4',
      ],
    },
    {
      key: '17',
      title: 'Số đường đi có đúng k lần rẽ',
      difficulty: 'MEDIUM',
      story:
        'Robot đi từ góc trên trái $(0,0)$ tới góc dưới phải $(m-1, n-1)$ của lưới $m \\times n$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Một "lần rẽ" xảy ra khi robot đổi hướng (đang đi phải chuyển sang đi xuống, hoặc ngược lại). Hãy đếm số đường đi có **đúng $k$ lần rẽ**.',
      inputDesc:
        'Một dòng chứa ba số nguyên $m$, $n$, $k$ $(1 \\le m, n \\le 12;\\ 0 \\le k \\le 24)$.',
      outputDesc: 'In ra số đường đi có đúng $k$ lần rẽ.',
      note: 'Trạng thái (ô, hướng vừa đi). Mỗi khi đổi hướng thì tăng số lần rẽ thêm 1; đệ quy/DP trên (i, j, dir, turns).',
      solve: (input) => {
        const [m, n, k] = readInts(lines(input)[0]);
        // dp[i][j][dir][t]: dir 0 = vừa đi phải, 1 = vừa đi xuống
        const dp: number[][][][] = Array.from({ length: m }, () =>
          Array.from({ length: n }, () =>
            Array.from({ length: 2 }, () => new Array(k + 1).fill(0)),
          ),
        );
        if (n > 1) dp[0][1][0][0] = 1; // bước đầu sang phải
        if (m > 1) dp[1][0][1][0] = 1; // bước đầu xuống dưới
        if (m === 1 && n === 1) {
          return String(k === 0 ? 1 : 0);
        }
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            for (let dir = 0; dir < 2; dir++) {
              for (let t = 0; t <= k; t++) {
                const ways = dp[i][j][dir][t];
                if (ways === 0) continue;
                // đi tiếp sang phải
                if (j + 1 < n) {
                  const nt = dir === 0 ? t : t + 1;
                  if (nt <= k) dp[i][j + 1][0][nt] += ways;
                }
                // đi tiếp xuống dưới
                if (i + 1 < m) {
                  const nt = dir === 1 ? t : t + 1;
                  if (nt <= k) dp[i + 1][j][1][nt] += ways;
                }
              }
            }
          }
        }
        const res = dp[m - 1][n - 1][0][k] + dp[m - 1][n - 1][1][k];
        return String(res);
      },
      inputs: [
        '3 3 2',
        '3 3 0',
        '2 2 1',
        '1 1 0',
        '1 5 0',
        '5 1 3',
        '4 4 4',
      ],
    },
    {
      key: '18',
      title: 'Đường đi nhặt vàng nhiều nhất có vật cản',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$. Ô có giá trị $-1$ là **vật cản** không đi được; các ô còn lại chứa số vàng không âm. Robot đi từ góc trên trái xuống góc dưới phải, mỗi bước sang phải hoặc xuống dưới, nhặt vàng ở mọi ô đi qua.\n\n' +
        'Hãy tìm số vàng nhiều nhất robot có thể nhặt. Nếu không có đường đi hợp lệ nào tới đích, in ra $-1$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số: $-1$ là vật cản, ngược lại là số vàng không âm $(\\le 100)$.',
      outputDesc: 'In ra số vàng nhiều nhất, hoặc $-1$ nếu không tới được đích.',
      note: 'Dùng -Infinity cho ô không tới được; ô vật cản luôn -Infinity. dp[i][j] = g[i][j] + max(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const NEG = -Infinity;
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(NEG));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === -1) {
              dp[i][j] = NEG;
              continue;
            }
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : NEG;
            const left = j > 0 ? dp[i][j - 1] : NEG;
            const base = Math.max(up, left);
            dp[i][j] = base === NEG ? NEG : g[i][j] + base;
          }
        }
        return String(dp[m - 1][n - 1] === NEG ? -1 : dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 3 1\n1 -1 1\n4 2 1',
        '2 2\n0 -1\n-1 0',
        '1 4\n1 2 3 4',
        '1 1\n7',
        '1 1\n-1',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '19',
      title: 'Hệ số tam giác Pascal',
      difficulty: 'EASY',
      story:
        'Tam giác Pascal: hàng $0$ là số $1$; mỗi số bên trong là tổng của hai số ngay phía trên nó. Số ở hàng $n$, vị trí $k$ chính là hệ số tổ hợp $C(n, k)$.\n\n' +
        'Cho $n$ và $k$, hãy tính $C(n, k)$ bằng quy hoạch động trên tam giác Pascal.',
      inputDesc:
        'Một dòng chứa hai số nguyên $n$ và $k$ $(0 \\le k \\le n \\le 50)$.',
      outputDesc: 'In ra $C(n, k)$.',
      note: 'C[i][j] = C[i-1][j-1] + C[i-1][j], với C[i][0] = C[i][i] = 1.',
      solve: (input) => {
        const [n, k] = readInts(lines(input)[0]);
        const C: number[][] = Array.from({ length: n + 1 }, (_, i) =>
          new Array(i + 1).fill(0),
        );
        for (let i = 0; i <= n; i++) {
          C[i][0] = 1;
          C[i][i] = 1;
          for (let j = 1; j < i; j++) {
            C[i][j] = C[i - 1][j - 1] + C[i - 1][j];
          }
        }
        return String(C[n][k]);
      },
      inputs: ['5 2', '4 0', '0 0', '6 3', '50 1', '50 25'],
    },
    {
      key: '20',
      title: 'Đường đi qua hai điểm hẹn',
      difficulty: 'MEDIUM',
      story:
        'Robot đi từ góc trên trái $(0,0)$ tới góc dưới phải $(m-1, n-1)$ của lưới $m \\times n$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Có hai "điểm hẹn" $A = (r_1, c_1)$ và $B = (r_2, c_2)$ mà robot bắt buộc phải đi qua **theo thứ tự** $A$ rồi tới $B$. Đề bảo đảm $A$ nằm "trước" $B$ trên mọi đường phải/xuống hợp lệ (tức $r_1 \\le r_2$ và $c_1 \\le c_2$).\n\n' +
        'Hãy đếm số đường đi đi qua cả hai điểm hẹn.',
      inputDesc:
        'Một dòng chứa sáu số nguyên $m$, $n$, $r_1$, $c_1$, $r_2$, $c_2$ $(1 \\le m, n \\le 15;\\ 0 \\le r_1 \\le r_2 < m;\\ 0 \\le c_1 \\le c_2 < n)$.',
      outputDesc: 'In ra số đường đi qua $A$ rồi $B$.',
      note: 'Số đường = [(0,0)→A] × [A→B] × [B→(m-1,n-1)], mỗi đoạn là một hệ số tổ hợp.',
      solve: (input) => {
        const [m, n, r1, c1, r2, c2] = readInts(lines(input)[0]);
        const comb = (a: number, b: number): number => {
          if (b < 0 || b > a) return 0;
          let res = 1;
          const k = Math.min(b, a - b);
          for (let i = 0; i < k; i++) {
            res = (res * (a - i)) / (i + 1);
          }
          return Math.round(res);
        };
        const seg = (
          ar: number,
          ac: number,
          br: number,
          bc: number,
        ): number => {
          const dr = br - ar;
          const dc = bc - ac;
          if (dr < 0 || dc < 0) return 0;
          return comb(dr + dc, dr);
        };
        const ways =
          seg(0, 0, r1, c1) *
          seg(r1, c1, r2, c2) *
          seg(r2, c2, m - 1, n - 1);
        return String(ways);
      },
      inputs: [
        '4 4 1 1 2 2',
        '3 3 0 0 2 2',
        '1 1 0 0 0 0',
        '5 5 0 0 4 4',
        '1 6 0 1 0 4',
        '6 1 1 0 4 0',
      ],
    },
    {
      key: '21',
      title: 'Đếm hình vuông 2×2 toàn số 1',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Hãy đếm số hình vuông con kích thước **đúng $2 \\times 2$** mà cả bốn ô đều bằng $1$.\n\n' +
        'Mỗi hình vuông $2 \\times 2$ được xác định bởi ô góc trên-trái của nó.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 200)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra số hình vuông $2 \\times 2$ toàn $1$.',
      note: 'Với mỗi ô (i,j) làm góc trên-trái, kiểm tra g[i][j], g[i][j+1], g[i+1][j], g[i+1][j+1] đều bằng 1.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        let cnt = 0;
        for (let i = 0; i + 1 < m; i++) {
          for (let j = 0; j + 1 < n; j++) {
            if (
              g[i][j] === 1 &&
              g[i][j + 1] === 1 &&
              g[i + 1][j] === 1 &&
              g[i + 1][j + 1] === 1
            ) {
              cnt++;
            }
          }
        }
        return String(cnt);
      },
      inputs: [
        '3 3\n1 1 0\n1 1 1\n0 1 1',
        '2 2\n1 1\n1 1',
        '2 2\n1 0\n1 1',
        '1 1\n1',
        '1 5\n1 1 1 1 1',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '22',
      title: 'Tổng lớn nhất của hình vuông con k×k',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên. Hãy tìm tổng lớn nhất của một hình vuông con kích thước $k \\times k$ nằm hoàn toàn trong lưới.\n\n' +
        'Đề bảo đảm $k \\le m$ và $k \\le n$.',
      inputDesc:
        'Dòng đầu chứa ba số $m$, $n$, $k$ $(1 \\le k \\le m \\le 100,\\ 1 \\le k \\le n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-1000 \\le g_{ij} \\le 1000)$.',
      outputDesc: 'In ra tổng lớn nhất của một hình vuông con $k \\times k$.',
      note: 'Dùng tổng tích lũy 2D: P[i][j] = tổng các ô (0..i-1, 0..j-1). Tổng một hình vuông tính bằng bao hàm-loại trừ trong O(1).',
      solve: (input) => {
        const ls = lines(input);
        const [m, n, k] = readInts(ls[0]);
        const g: number[][] = [];
        for (let i = 0; i < m; i++) g.push(readInts(ls[1 + i]));
        const P: number[][] = Array.from({ length: m + 1 }, () =>
          new Array(n + 1).fill(0),
        );
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            P[i][j] =
              g[i - 1][j - 1] + P[i - 1][j] + P[i][j - 1] - P[i - 1][j - 1];
          }
        }
        let best = -Infinity;
        for (let i = 0; i + k <= m; i++) {
          for (let j = 0; j + k <= n; j++) {
            const s =
              P[i + k][j + k] - P[i][j + k] - P[i + k][j] + P[i][j];
            if (s > best) best = s;
          }
        }
        return String(best);
      },
      inputs: [
        '3 3 2\n1 2 3\n4 5 6\n7 8 9',
        '2 2 1\n1 2\n3 4',
        '1 1 1\n5',
        '3 3 3\n1 1 1\n1 1 1\n1 1 1',
        '2 4 2\n-1 -2 -3 -4\n-5 -6 -7 -8',
        '1 5 1\n1 5 1 5 1',
      ],
    },
    {
      key: '23',
      title: 'Đường tăng dài nhất trong lưới',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên. Bắt đầu từ một ô bất kỳ, mỗi bước em đi sang một trong **bốn** ô kề (trên, dưới, trái, phải) có giá trị **lớn hơn ngặt** ô hiện tại.\n\n' +
        'Hãy tìm độ dài (số ô) của đường đi tăng dần dài nhất.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 30)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-1000 \\le g_{ij} \\le 1000)$.',
      outputDesc: 'In ra độ dài đường tăng dài nhất.',
      note: 'Ghi nhớ (memoization): f(i,j) = 1 + max f của các ô kề có giá trị lớn hơn. Đáp án là max của mọi f(i,j).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const memo: number[][] = Array.from({ length: m }, () =>
          new Array(n).fill(0),
        );
        const dx = [1, -1, 0, 0];
        const dy = [0, 0, 1, -1];
        const dfs = (i: number, j: number): number => {
          if (memo[i][j] !== 0) return memo[i][j];
          let best = 1;
          for (let d = 0; d < 4; d++) {
            const ni = i + dx[d];
            const nj = j + dy[d];
            if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;
            if (g[ni][nj] > g[i][j]) {
              best = Math.max(best, 1 + dfs(ni, nj));
            }
          }
          memo[i][j] = best;
          return best;
        };
        let ans = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            ans = Math.max(ans, dfs(i, j));
          }
        }
        return String(ans);
      },
      inputs: [
        '3 3\n9 9 4\n6 6 8\n2 1 1',
        '3 3\n3 4 5\n3 2 6\n2 2 1',
        '1 1\n7',
        '1 5\n1 2 3 4 5',
        '2 2\n5 5\n5 5',
        '2 3\n7 7 7\n7 7 7',
      ],
    },
    {
      key: '24',
      title: 'Hái anh đào một lượt đi-về',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $n \\times n$, ô $(i,j)$ chứa $g_{ij}$ quả anh đào ($g_{ij} \\ge 0$). Một người đi từ ô $(0,0)$ tới ô $(n-1,n-1)$ rồi quay về $(0,0)$. Lượt đi chỉ đi **phải/xuống**, lượt về chỉ đi **trái/lên**. Mỗi ô đi qua sẽ được hái hết anh đào (và ô đó trở thành rỗng cho lần sau).\n\n' +
        'Hãy tìm tổng số anh đào nhiều nhất hái được. Gợi ý: tương đương hai người cùng đi từ $(0,0)$ tới $(n-1,n-1)$, ô chung chỉ tính một lần.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 30)$. $n$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra tổng số anh đào nhiều nhất.',
      note: 'DP theo số bước t = x1+y1 = x2+y2. Trạng thái (t, x1, x2); y suy ra từ t. Nếu hai người trùng ô, chỉ cộng một lần.',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const g: number[][] = [];
        for (let i = 0; i < n; i++) g.push(readInts(ls[1 + i]));
        const NEG = -Infinity;
        // dp[x1][x2] cho bước t hiện tại
        let dp: number[][] = Array.from({ length: n }, () =>
          new Array(n).fill(NEG),
        );
        dp[0][0] = g[0][0];
        for (let t = 1; t <= 2 * (n - 1); t++) {
          const nd: number[][] = Array.from({ length: n }, () =>
            new Array(n).fill(NEG),
          );
          for (let x1 = 0; x1 < n; x1++) {
            const y1 = t - x1;
            if (y1 < 0 || y1 >= n) continue;
            for (let x2 = 0; x2 < n; x2++) {
              const y2 = t - x2;
              if (y2 < 0 || y2 >= n) continue;
              let best = NEG;
              for (const px1 of [x1, x1 - 1]) {
                for (const px2 of [x2, x2 - 1]) {
                  if (px1 < 0 || px2 < 0) continue;
                  if (dp[px1][px2] === NEG) continue;
                  best = Math.max(best, dp[px1][px2]);
                }
              }
              if (best === NEG) continue;
              let gain = g[x1][y1];
              if (x1 !== x2) gain += g[x2][y2];
              nd[x1][x2] = best + gain;
            }
          }
          dp = nd;
        }
        const res = dp[n - 1][n - 1];
        return String(res === NEG ? 0 : res);
      },
      inputs: [
        '3\n0 1 0\n1 0 1\n0 1 0',
        '1\n5',
        '2\n1 2\n3 4',
        '2\n0 0\n0 0',
        '3\n1 1 1\n1 1 1\n1 1 1',
        '4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1',
      ],
    },
    {
      key: '25',
      title: 'Đếm đường đi có tổng đúng bằng S',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Hãy đếm số đường đi có tổng các ô đi qua **đúng bằng $S$**.',
      inputDesc:
        'Dòng đầu chứa ba số $m$, $n$, $S$ $(1 \\le m, n \\le 12;\\ 0 \\le S \\le 200)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 20)$.',
      outputDesc: 'In ra số đường đi có tổng đúng bằng $S$.',
      note: 'dp[i][j][s] = số đường tới (i,j) với tổng đúng s. Cộng từ ô trên và ô trái với s đã trừ g[i][j].',
      solve: (input) => {
        const ls = lines(input);
        const [m, n, S] = readInts(ls[0]);
        const g: number[][] = [];
        for (let i = 0; i < m; i++) g.push(readInts(ls[1 + i]));
        const dp: number[][][] = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => new Array(S + 1).fill(0)),
        );
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const v = g[i][j];
            if (i === 0 && j === 0) {
              if (v <= S) dp[i][j][v] = 1;
              continue;
            }
            for (let s = v; s <= S; s++) {
              let ways = 0;
              if (i > 0) ways += dp[i - 1][j][s - v];
              if (j > 0) ways += dp[i][j - 1][s - v];
              dp[i][j][s] = ways;
            }
          }
        }
        return String(dp[m - 1][n - 1][S]);
      },
      inputs: [
        '2 2 4\n1 1\n1 1',
        '1 3 6\n1 2 3',
        '2 2 5\n1 2\n3 1',
        '1 1 0\n0',
        '1 1 7\n7',
        '3 3 0\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '26',
      title: 'Đường đi ba hướng có vật cản',
      difficulty: 'MEDIUM',
      story:
        'Robot đứng ở góc trên trái lưới $m \\times n$ và muốn tới góc dưới phải. Mỗi bước robot đi **sang phải**, xuống **dưới**, hoặc **chéo** xuống-phải. Một số ô bị chặn (đánh dấu $1$) không được đi qua.\n\n' +
        'Hãy đếm số đường đi hợp lệ. Nếu ô xuất phát hoặc ô đích bị chặn thì kết quả là $0$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 12)$. $m$ dòng tiếp theo, mỗi dòng $n$ số: $1$ là ô bị chặn, $0$ là ô đi được.',
      outputDesc: 'In ra số đường đi hợp lệ.',
      note: 'Ô bị chặn có dp = 0; ô còn lại dp[i][j] = dp[i-1][j] + dp[i][j-1] + dp[i-1][j-1].',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) {
              dp[i][j] = 0;
            } else if (i === 0 && j === 0) {
              dp[i][j] = 1;
            } else {
              dp[i][j] =
                (i > 0 ? dp[i - 1][j] : 0) +
                (j > 0 ? dp[i][j - 1] : 0) +
                (i > 0 && j > 0 ? dp[i - 1][j - 1] : 0);
            }
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n0 0 0\n0 1 0\n0 0 0',
        '2 2\n0 0\n0 0',
        '2 2\n0 1\n0 0',
        '1 1\n0',
        '1 1\n1',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '27',
      title: 'Hình chữ nhật toàn số 1 lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Hãy tìm **diện tích** (số ô) của hình chữ nhật con lớn nhất mà mọi ô bên trong đều bằng $1$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 50)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra diện tích hình chữ nhật toàn $1$ lớn nhất (bằng $0$ nếu không có ô $1$ nào).',
      note: 'h[i][j] = chiều cao cột số 1 kết thúc tại (i,j). Với mỗi ô, mở rộng sang trái/phải khi chiều cao còn >= chiều cao tại đó để tính diện tích.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const h: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) h[i][j] = (i > 0 ? h[i - 1][j] : 0) + 1;
            else h[i][j] = 0;
          }
        }
        let best = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (h[i][j] === 0) continue;
            let minH = h[i][j];
            for (let j2 = j; j2 < n; j2++) {
              minH = Math.min(minH, h[i][j2]);
              if (minH === 0) break;
              const area = minH * (j2 - j + 1);
              if (area > best) best = area;
            }
          }
        }
        return String(best);
      },
      inputs: [
        '3 4\n1 0 1 1\n1 1 1 1\n0 1 1 1',
        '2 2\n0 0\n0 0',
        '1 5\n1 1 1 1 1',
        '1 1\n1',
        '1 1\n0',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '28',
      title: 'Đếm số ô tới được khi đi phải/xuống tránh vật cản',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$. Ô đánh dấu $1$ là **vật cản** không đi được, ô $0$ đi được. Một robot bắt đầu ở ô $(0,0)$ và mỗi bước chỉ đi **sang phải** hoặc xuống **dưới**, không được đi qua vật cản.\n\n' +
        'Hãy đếm xem có bao nhiêu ô của lưới mà robot có thể tới được (kể cả ô xuất phát, nếu nó không bị chặn). Nếu ô $(0,0)$ bị chặn thì không tới được ô nào, in ra $0$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số: $1$ là vật cản, $0$ là ô đi được.',
      outputDesc: 'In ra số ô robot có thể tới được.',
      note: 'reach[i][j] = ô đi được VÀ (là (0,0), hoặc reach[i-1][j], hoặc reach[i][j-1]). Đếm số ô có reach = true.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const reach: boolean[][] = Array.from({ length: m }, () =>
          new Array(n).fill(false),
        );
        let cnt = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) continue;
            if (i === 0 && j === 0) reach[i][j] = true;
            else
              reach[i][j] =
                (i > 0 && reach[i - 1][j]) || (j > 0 && reach[i][j - 1]);
            if (reach[i][j]) cnt++;
          }
        }
        return String(cnt);
      },
      inputs: [
        '3 3\n0 0 0\n0 1 0\n0 0 0',
        '2 2\n0 1\n0 0',
        '1 4\n0 0 1 0',
        '1 1\n0',
        '1 1\n1',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '29',
      title: 'Đếm đường đi tránh một ô cấm',
      difficulty: 'EASY',
      story:
        'Robot đi từ góc trên trái $(0,0)$ tới góc dưới phải $(m-1, n-1)$ của lưới $m \\times n$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Có **đúng một ô cấm** ở vị trí $(r, c)$ mà robot không được đi qua (đề bảo đảm ô cấm không trùng góc xuất phát hay góc đích). Hãy đếm số đường đi hợp lệ.',
      inputDesc:
        'Một dòng chứa bốn số nguyên $m$, $n$, $r$, $c$ $(1 \\le m, n \\le 15;\\ 0 \\le r < m;\\ 0 \\le c < n)$.',
      outputDesc: 'In ra số đường đi tránh ô cấm.',
      note: 'Tổng số đường = C((m-1)+(n-1), m-1). Số đường đi QUA ô cấm = [(0,0)→(r,c)] × [(r,c)→(m-1,n-1)]. Lấy hiệu.',
      solve: (input) => {
        const [m, n, r, c] = readInts(lines(input)[0]);
        const comb = (a: number, b: number): number => {
          if (b < 0 || b > a) return 0;
          let res = 1;
          const k = Math.min(b, a - b);
          for (let i = 0; i < k; i++) {
            res = (res * (a - i)) / (i + 1);
          }
          return Math.round(res);
        };
        const total = comb(m - 1 + (n - 1), m - 1);
        const through =
          comb(r + c, r) * comb(m - 1 - r + (n - 1 - c), m - 1 - r);
        return String(total - through);
      },
      inputs: [
        '3 3 1 1',
        '3 7 0 3',
        '2 2 0 1',
        '5 5 2 2',
        '1 6 0 3',
        '6 1 3 0',
      ],
    },
    {
      key: '30',
      title: 'Đường đi giá trị lớn nhất ba hướng, giá trị có thể âm',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên (có thể âm). Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước được đi **sang phải**, xuống **dưới**, hoặc **chéo** xuống-phải.\n\n' +
        'Giá trị của đường đi là tổng các ô đi qua. Hãy tìm giá trị **lớn nhất**.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-100 \\le g_{ij} \\le 100)$.',
      outputDesc: 'In ra giá trị lớn nhất.',
      note: 'dp[i][j] = g[i][j] + max(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) với các hướng hợp lệ.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : -Infinity;
            const left = j > 0 ? dp[i][j - 1] : -Infinity;
            const diag = i > 0 && j > 0 ? dp[i - 1][j - 1] : -Infinity;
            dp[i][j] = g[i][j] + Math.max(up, left, diag);
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 -2 3\n-4 5 -6\n7 -8 9',
        '1 3\n-1 -2 -3',
        '2 2\n1 2\n3 4',
        '1 1\n-5',
        '3 1\n-1\n-2\n-3',
        '3 3\n-1 -1 -1\n-1 -1 -1\n-1 -1 -1',
      ],
    },
    {
      key: '31',
      title: 'Hình vuông con lớn nhất gồm các ô bằng nhau',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên. Hãy tìm cạnh của hình vuông con lớn nhất mà **mọi ô bên trong đều có cùng một giá trị** (giá trị nào cũng được, miễn là cả hình vuông giống nhau).\n\n' +
        'Ví dụ một hình vuông $2 \\times 2$ mà cả bốn ô đều bằng $7$ là hợp lệ.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-100 \\le g_{ij} \\le 100)$.',
      outputDesc: 'In ra độ dài cạnh của hình vuông con lớn nhất toàn ô bằng nhau (luôn $\\ge 1$).',
      note: 'dp[i][j] = 1 nếu một trong ba ô trên/trái/chéo khác giá trị; ngược lại = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        let best = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 || j === 0) {
              dp[i][j] = 1;
            } else if (
              g[i - 1][j] === g[i][j] &&
              g[i][j - 1] === g[i][j] &&
              g[i - 1][j - 1] === g[i][j]
            ) {
              dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            } else {
              dp[i][j] = 1;
            }
            if (dp[i][j] > best) best = dp[i][j];
          }
        }
        return String(best);
      },
      inputs: [
        '3 3\n5 5 1\n5 5 2\n3 4 4',
        '2 2\n7 7\n7 7',
        '2 3\n1 2 3\n4 5 6',
        '1 1\n9',
        '1 5\n2 2 2 2 2',
        '4 1\n3\n3\n3\n3',
        '3 3\n4 4 4\n4 4 4\n4 4 4',
      ],
    },
    {
      key: '32',
      title: 'Đường rơi tổng nhỏ nhất không cùng cột hai hàng liền',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới vuông $n \\times n$. Một "đường rơi" chọn đúng một ô ở mỗi hàng, từ hàng đầu xuống hàng cuối.\n\n' +
        'Ràng buộc: ô chọn ở hai hàng **liền nhau không được nằm cùng cột**. Tổng của đường rơi là tổng các ô được chọn.\n\n' +
        'Hãy tìm tổng nhỏ nhất của một đường rơi như vậy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. $n$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-100 \\le g_{ij} \\le 100)$.',
      outputDesc: 'In ra tổng nhỏ nhất.',
      note: 'Với mỗi hàng chỉ cần biết giá trị nhỏ nhất và nhì nhỏ của hàng trước; cột đang xét lấy giá trị tối ưu của hàng trước ở cột khác.',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const g: number[][] = [];
        for (let i = 0; i < n; i++) g.push(readInts(ls[1 + i]));
        let prev = g[0].slice();
        for (let i = 1; i < n; i++) {
          // tìm cột có giá trị nhỏ nhất và nhì nhỏ của prev
          let min1 = Infinity;
          let min1Col = -1;
          let min2 = Infinity;
          for (let j = 0; j < n; j++) {
            if (prev[j] < min1) {
              min2 = min1;
              min1 = prev[j];
              min1Col = j;
            } else if (prev[j] < min2) {
              min2 = prev[j];
            }
          }
          const cur = new Array(n).fill(0);
          for (let j = 0; j < n; j++) {
            const fromPrev = j === min1Col ? min2 : min1;
            cur[j] = g[i][j] + fromPrev;
          }
          prev = cur;
        }
        return String(Math.min(...prev));
      },
      inputs: [
        '3\n1 2 3\n4 5 6\n7 8 9',
        '2\n1 2\n3 4',
        '1\n5',
        '1\n-7',
        '3\n1 1 1\n1 1 1\n1 1 1',
        '3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9',
        '4\n1 2 3 4\n4 3 2 1\n1 2 3 4\n4 3 2 1',
      ],
    },
    {
      key: '33',
      title: 'Hình chữ nhật con có tổng lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên (có thể âm). Hãy tìm tổng lớn nhất của một hình chữ nhật con **khác rỗng** (gồm các hàng liên tiếp và cột liên tiếp).\n\n' +
        'Đây là bài "Kadane hai chiều": cố định cặp hàng trên–dưới rồi tìm dải cột tốt nhất.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 12)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-100 \\le g_{ij} \\le 100)$.',
      outputDesc: 'In ra tổng lớn nhất của một hình chữ nhật con.',
      note: 'Với mỗi cặp hàng (r1, r2), gộp các cột thành mảng tổng theo cột rồi chạy Kadane 1 chiều.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        let best = -Infinity;
        for (let r1 = 0; r1 < m; r1++) {
          const colSum = new Array(n).fill(0);
          for (let r2 = r1; r2 < m; r2++) {
            for (let j = 0; j < n; j++) colSum[j] += g[r2][j];
            // Kadane trên colSum
            let cur = colSum[0];
            let localBest = colSum[0];
            for (let j = 1; j < n; j++) {
              cur = Math.max(colSum[j], cur + colSum[j]);
              localBest = Math.max(localBest, cur);
            }
            best = Math.max(best, localBest);
          }
        }
        return String(best);
      },
      inputs: [
        '3 3\n1 2 -1\n-3 4 2\n1 -1 5',
        '2 2\n1 2\n3 4',
        '1 4\n-1 3 -2 4',
        '1 1\n-5',
        '2 2\n-1 -2\n-3 -4',
        '3 1\n2\n-5\n3',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '34',
      title: 'Đường đi phải/xuống tối đa hoá giá trị nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Với mỗi đường đi, xét **giá trị nhỏ nhất** trong các ô nó đi qua. Hãy chọn đường đi sao cho giá trị nhỏ nhất ấy **lớn nhất có thể**, rồi in ra giá trị đó.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-1000 \\le g_{ij} \\le 1000)$.',
      outputDesc: 'In ra giá trị nhỏ nhất lớn nhất có thể.',
      note: 'dp[i][j] = min(g[i][j], max(dp[i-1][j], dp[i][j-1])).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : -Infinity;
            const left = j > 0 ? dp[i][j - 1] : -Infinity;
            dp[i][j] = Math.min(g[i][j], Math.max(up, left));
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n5 1 2\n3 4 1\n2 3 6',
        '1 4\n4 2 7 3',
        '2 2\n5 1\n1 5',
        '1 1\n9',
        '3 1\n4\n2\n6',
        '2 2\n-1 -2\n-3 -4',
        '3 3\n9 9 9\n9 9 9\n9 9 9',
      ],
    },
    {
      key: '35',
      title: 'Đường đi phải/xuống tối thiểu hoá giá trị lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Với mỗi đường đi, xét **giá trị lớn nhất** trong các ô nó đi qua. Hãy chọn đường đi sao cho giá trị lớn nhất ấy **nhỏ nhất có thể**, rồi in ra giá trị đó.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-1000 \\le g_{ij} \\le 1000)$.',
      outputDesc: 'In ra giá trị lớn nhất nhỏ nhất có thể.',
      note: 'dp[i][j] = max(g[i][j], min(dp[i-1][j], dp[i][j-1])).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : Infinity;
            const left = j > 0 ? dp[i][j - 1] : Infinity;
            dp[i][j] = Math.max(g[i][j], Math.min(up, left));
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 9 9\n1 9 9\n1 1 1',
        '1 4\n4 2 7 3',
        '2 2\n1 5\n5 1',
        '1 1\n9',
        '3 1\n4\n8\n2',
        '2 2\n-1 -2\n-3 -4',
        '3 3\n5 5 5\n5 5 5\n5 5 5',
      ],
    },
    {
      key: '36',
      title: 'Trò chơi hầm ngục',
      difficulty: 'MEDIUM',
      story:
        'Một hiệp sĩ vào hầm ngục $m \\times n$ ở ô $(0,0)$ và phải tới ô $(m-1, n-1)$, mỗi bước đi sang phải hoặc xuống dưới. Ô $(i,j)$ có giá trị $g_{ij}$: nếu dương thì cộng máu, nếu âm thì trừ máu.\n\n' +
        'Máu của hiệp sĩ phải **luôn $\\ge 1$** ở mọi thời điểm (kể cả ngay sau khi vào ô đầu). Hãy tìm lượng máu khởi đầu **nhỏ nhất** để hiệp sĩ tới được đích.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(-1000 \\le g_{ij} \\le 1000)$.',
      outputDesc: 'In ra lượng máu khởi đầu nhỏ nhất.',
      note: 'Tính ngược từ đích: need[i][j] = max(1, min(need phải, need xuống) - g[i][j]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const need: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = m - 1; i >= 0; i--) {
          for (let j = n - 1; j >= 0; j--) {
            if (i === m - 1 && j === n - 1) {
              need[i][j] = Math.max(1, 1 - g[i][j]);
              continue;
            }
            const down = i + 1 < m ? need[i + 1][j] : Infinity;
            const right = j + 1 < n ? need[i][j + 1] : Infinity;
            const nxt = Math.min(down, right);
            need[i][j] = Math.max(1, nxt - g[i][j]);
          }
        }
        return String(need[0][0]);
      },
      inputs: [
        '3 3\n-2 -3 3\n-5 -10 1\n10 30 -5',
        '1 1\n0',
        '1 3\n1 -2 3',
        '1 1\n-5',
        '1 1\n5',
        '2 2\n0 0\n0 0',
        '3 1\n-1\n-2\n-3',
      ],
    },
    {
      key: '37',
      title: 'Đếm số đường đi tăng nghiêm ngặt trong lưới',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên. Một đường đi (có thể chỉ gồm một ô) bắt đầu ở một ô bất kỳ, mỗi bước đi sang một trong **bốn** ô kề (trên, dưới, trái, phải) có giá trị **lớn hơn ngặt** ô hiện tại.\n\n' +
        'Hãy đếm tổng số đường đi tăng nghiêm ngặt như vậy (mỗi ô đơn lẻ cũng tính là một đường đi).',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 8)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên $(0 \\le g_{ij} \\le 50)$.',
      outputDesc: 'In ra số đường đi tăng nghiêm ngặt.',
      note: 'f(i,j) = 1 + tổng f của các ô kề lớn hơn (memoization). Đáp án = tổng mọi f(i,j).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const memo: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        const dx = [1, -1, 0, 0];
        const dy = [0, 0, 1, -1];
        const dfs = (i: number, j: number): number => {
          if (memo[i][j] !== 0) return memo[i][j];
          let ways = 1;
          for (let d = 0; d < 4; d++) {
            const ni = i + dx[d];
            const nj = j + dy[d];
            if (ni < 0 || ni >= m || nj < 0 || nj >= n) continue;
            if (g[ni][nj] > g[i][j]) ways += dfs(ni, nj);
          }
          memo[i][j] = ways;
          return ways;
        };
        let total = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) total += dfs(i, j);
        }
        return String(total);
      },
      inputs: [
        '2 2\n1 2\n3 4',
        '1 4\n1 2 3 4',
        '2 2\n1 1\n1 1',
        '1 1\n7',
        '3 1\n3\n2\n1',
        '2 3\n5 5 5\n5 5 5',
        '3 3\n1 2 3\n6 5 4\n7 8 9',
      ],
    },
    {
      key: '38',
      title: 'Đếm đường đơn điệu không vượt đường chéo chính',
      difficulty: 'MEDIUM',
      story:
        'Trên lưới vuông $n \\times n$, robot đi từ ô $(0,0)$ tới ô $(n-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Ràng buộc: trên suốt đường đi, robot **không bao giờ đi xuống dưới đường chéo chính**, tức ở mọi ô $(i, j)$ trên đường phải có $i \\le j$ (số hàng không vượt quá số cột).\n\n' +
        'Hãy đếm số đường đi hợp lệ. (Đây chính là số Catalan.)',
      inputDesc:
        'Một dòng chứa số nguyên $n$ $(1 \\le n \\le 18)$.',
      outputDesc: 'In ra số đường đi hợp lệ.',
      note: 'dp[i][j] = dp[i-1][j] + dp[i][j-1] nhưng chỉ tính các ô có i <= j.',
      solve: (input) => {
        const n = parseInt(lines(input)[0].trim(), 10);
        const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (i > j) continue;
            if (i === 0 && j === 0) {
              dp[i][j] = 1;
              continue;
            }
            let ways = 0;
            if (i > 0 && i - 1 <= j) ways += dp[i - 1][j];
            if (j > 0 && i <= j - 1) ways += dp[i][j - 1];
            dp[i][j] = ways;
          }
        }
        return String(dp[n - 1][n - 1]);
      },
      inputs: ['3', '1', '2', '4', '5', '10', '18'],
    },
    {
      key: '39',
      title: 'Nhặt nhiều ô số 1 nhất trên đường phải/xuống',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Hãy tìm số ô mang giá trị $1$ **nhiều nhất** mà robot có thể đi qua trên một đường đi.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra số ô $1$ nhiều nhất nhặt được.',
      note: 'dp[i][j] = g[i][j] + max(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const up = i > 0 ? dp[i - 1][j] : 0;
            const left = j > 0 ? dp[i][j - 1] : 0;
            const base = i === 0 && j === 0 ? 0 : Math.max(up, left);
            dp[i][j] = g[i][j] + base;
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 0 0\n1 1 0\n0 1 1',
        '2 2\n1 1\n1 1',
        '1 4\n1 0 1 1',
        '1 1\n0',
        '1 1\n1',
        '2 2\n0 0\n0 0',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '40',
      title: 'Đếm đường đi có tổng không vượt quá S',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Hãy đếm số đường đi mà tổng các ô đi qua **không vượt quá $S$** (tức tổng $\\le S$).',
      inputDesc:
        'Dòng đầu chứa ba số $m$, $n$, $S$ $(1 \\le m, n \\le 12;\\ 0 \\le S \\le 200)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 20)$.',
      outputDesc: 'In ra số đường đi có tổng không vượt quá $S$.',
      note: 'dp[i][j][s] = số đường tới (i,j) với tổng đúng s; đáp án là tổng dp[m-1][n-1][0..S].',
      solve: (input) => {
        const ls = lines(input);
        const [m, n, S] = readInts(ls[0]);
        const g: number[][] = [];
        for (let i = 0; i < m; i++) g.push(readInts(ls[1 + i]));
        const dp: number[][][] = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => new Array(S + 1).fill(0)),
        );
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const v = g[i][j];
            if (i === 0 && j === 0) {
              if (v <= S) dp[i][j][v] = 1;
              continue;
            }
            for (let s = v; s <= S; s++) {
              let ways = 0;
              if (i > 0) ways += dp[i - 1][j][s - v];
              if (j > 0) ways += dp[i][j - 1][s - v];
              dp[i][j][s] = ways;
            }
          }
        }
        let total = 0;
        for (let s = 0; s <= S; s++) total += dp[m - 1][n - 1][s];
        return String(total);
      },
      inputs: [
        '2 2 4\n1 1\n1 1',
        '1 3 6\n1 2 3',
        '2 2 5\n1 2\n3 1',
        '1 1 0\n0',
        '1 1 3\n7',
        '3 3 0\n0 0 0\n0 0 0\n0 0 0',
        '3 3 200\n1 2 3\n4 5 6\n7 8 9',
      ],
    },
    {
      key: '41',
      title: 'Tam giác số: đếm đường có tổng đúng bằng S',
      difficulty: 'MEDIUM',
      story:
        'Cho một tam giác số gồm $n$ hàng: hàng thứ $i$ (đánh số từ $1$) có đúng $i$ số. Bắt đầu từ đỉnh, mỗi bước đi xuống một trong hai số kề ngay bên dưới (vị trí $j$ ở hàng $i$ đi xuống vị trí $j$ hoặc $j+1$ ở hàng $i+1$).\n\n' +
        'Hãy đếm số đường đi từ đỉnh xuống đáy có tổng các số đi qua **đúng bằng $S$**.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $S$ $(1 \\le n \\le 15;\\ 0 \\le S \\le 300)$. $n$ dòng tiếp theo mô tả tam giác, dòng thứ $i$ có $i$ số nguyên không âm $(\\le 20)$.',
      outputDesc: 'In ra số đường đi có tổng đúng bằng $S$.',
      note: 'dp[i][j][s] = số đường tới ô (i,j) của tam giác với tổng đúng s; cộng từ hai ô phía trên.',
      solve: (input) => {
        const ls = lines(input);
        const [n, S] = readInts(ls[0]);
        const tri: number[][] = [];
        for (let i = 0; i < n; i++) tri.push(readInts(ls[1 + i]));
        // dp theo hàng
        let prev: number[][] = [new Array(S + 1).fill(0)];
        const v0 = tri[0][0];
        if (v0 <= S) prev[0][v0] = 1;
        for (let i = 1; i < n; i++) {
          const cur: number[][] = Array.from({ length: i + 1 }, () =>
            new Array(S + 1).fill(0),
          );
          for (let j = 0; j <= i; j++) {
            const v = tri[i][j];
            for (let s = v; s <= S; s++) {
              let ways = 0;
              if (j - 1 >= 0 && j - 1 <= i - 1) ways += prev[j - 1][s - v];
              if (j <= i - 1) ways += prev[j][s - v];
              cur[j][s] = ways;
            }
          }
          prev = cur;
        }
        let total = 0;
        for (let j = 0; j < prev.length; j++) total += prev[j][S];
        return String(total);
      },
      inputs: [
        '3 6\n1\n2 3\n1 2 3',
        '1 5\n5',
        '2 4\n1\n2 3',
        '1 0\n0',
        '1 2\n5',
        '3 0\n0\n0 0\n0 0 0',
        '4 10\n1\n2 2\n3 3 3\n4 4 4 4',
      ],
    },
    {
      key: '42',
      title: 'Đường đi tích nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên **dương**. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Giá trị của một đường đi là **tích** các số trên các ô nó đi qua. Hãy tìm tích **nhỏ nhất**.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 6)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên dương $(1 \\le g_{ij} \\le 9)$.',
      outputDesc: 'In ra tích nhỏ nhất.',
      note: 'Mọi ô đều dương nên dp[i][j] = g[i][j] * min(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : Infinity;
            const left = j > 0 ? dp[i][j - 1] : Infinity;
            dp[i][j] = g[i][j] * Math.min(up, left);
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '2 2\n1 2\n3 4',
        '1 3\n2 3 4',
        '3 3\n1 2 1\n2 2 2\n1 2 1',
        '1 1\n7',
        '3 1\n2\n3\n4',
        '2 2\n5 1\n1 5',
        '3 3\n9 9 9\n9 9 9\n9 9 9',
      ],
    },
    {
      key: '43',
      title: 'Đếm đường đi quân vua có vật cản',
      difficulty: 'MEDIUM',
      story:
        'Một quân vua đứng ở góc trên trái lưới $m \\times n$ và muốn tới góc dưới phải. Mỗi bước quân vua đi **sang phải**, xuống **dưới**, hoặc **chéo** xuống-phải. Một số ô bị chặn (đánh dấu $1$) không được đi qua.\n\n' +
        'Hãy đếm số đường đi hợp lệ. Nếu ô xuất phát hoặc ô đích bị chặn thì kết quả là $0$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 12)$. $m$ dòng tiếp theo, mỗi dòng $n$ số: $1$ là ô bị chặn, $0$ là ô đi được.',
      outputDesc: 'In ra số đường đi hợp lệ.',
      note: 'Ô bị chặn có dp = 0; ô còn lại dp[i][j] = dp[i-1][j] + dp[i][j-1] + dp[i-1][j-1].',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) {
              dp[i][j] = 0;
            } else if (i === 0 && j === 0) {
              dp[i][j] = 1;
            } else {
              dp[i][j] =
                (i > 0 ? dp[i - 1][j] : 0) +
                (j > 0 ? dp[i][j - 1] : 0) +
                (i > 0 && j > 0 ? dp[i - 1][j - 1] : 0);
            }
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n0 0 0\n0 1 0\n0 0 0',
        '2 2\n0 0\n0 0',
        '2 2\n0 1\n0 0',
        '1 1\n0',
        '1 1\n1',
        '1 4\n0 0 1 0',
        '4 4\n0 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 0',
      ],
    },
    {
      key: '44',
      title: 'Hình chữ nhật toàn số 0 lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Hãy tìm **diện tích** (số ô) của hình chữ nhật con lớn nhất mà mọi ô bên trong đều bằng $0$.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 50)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra diện tích hình chữ nhật toàn $0$ lớn nhất (bằng $0$ nếu không có ô $0$ nào).',
      note: 'h[i][j] = chiều cao cột số 0 kết thúc tại (i,j). Với mỗi hàng, mở rộng sang phải lấy min chiều cao để tính diện tích.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const h: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 0) h[i][j] = (i > 0 ? h[i - 1][j] : 0) + 1;
            else h[i][j] = 0;
          }
        }
        let best = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (h[i][j] === 0) continue;
            let minH = h[i][j];
            for (let j2 = j; j2 < n; j2++) {
              minH = Math.min(minH, h[i][j2]);
              if (minH === 0) break;
              const area = minH * (j2 - j + 1);
              if (area > best) best = area;
            }
          }
        }
        return String(best);
      },
      inputs: [
        '3 4\n0 1 0 0\n0 0 0 0\n1 0 0 0',
        '2 2\n1 1\n1 1',
        '1 5\n0 0 0 0 0',
        '1 1\n0',
        '1 1\n1',
        '3 1\n0\n0\n0',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '45',
      title: 'Đường đi ba hướng giá trị lớn nhất không âm',
      difficulty: 'EASY',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên **không âm**. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước được đi **sang phải**, xuống **dưới**, hoặc **chéo** xuống-phải, nhặt giá trị ở mọi ô đi qua.\n\n' +
        'Hãy tìm tổng **lớn nhất** robot có thể thu được.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra tổng lớn nhất.',
      note: 'dp[i][j] = g[i][j] + max(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) với các hướng hợp lệ.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j] = g[i][j];
              continue;
            }
            const up = i > 0 ? dp[i - 1][j] : -Infinity;
            const left = j > 0 ? dp[i][j - 1] : -Infinity;
            const diag = i > 0 && j > 0 ? dp[i - 1][j - 1] : -Infinity;
            dp[i][j] = g[i][j] + Math.max(up, left, diag);
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 4\n1 2 3 4',
        '2 2\n1 2\n3 4',
        '1 1\n7',
        '3 1\n2\n3\n4',
        '2 2\n0 0\n0 0',
        '3 3\n1 1 1\n1 1 1\n1 1 1',
      ],
    },
    {
      key: '46',
      title: 'Đếm đường đi tránh hai ô cấm',
      difficulty: 'MEDIUM',
      story:
        'Robot đi từ góc trên trái $(0,0)$ tới góc dưới phải $(m-1, n-1)$ của lưới $m \\times n$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Có **hai ô cấm** ở vị trí $(r_1, c_1)$ và $(r_2, c_2)$ mà robot không được đi qua (đề bảo đảm hai ô cấm khác nhau và không trùng góc xuất phát hay góc đích). Hãy đếm số đường đi hợp lệ.',
      inputDesc:
        'Một dòng chứa sáu số nguyên $m$, $n$, $r_1$, $c_1$, $r_2$, $c_2$ $(1 \\le m, n \\le 15)$, các chỉ số ô hợp lệ trong lưới.',
      outputDesc: 'In ra số đường đi tránh cả hai ô cấm.',
      note: 'DP đếm số đường phải/xuống, đặt dp = 0 ở hai ô cấm.',
      solve: (input) => {
        const [m, n, r1, c1, r2, c2] = readInts(lines(input)[0]);
        const blocked = (i: number, j: number): boolean =>
          (i === r1 && j === c1) || (i === r2 && j === c2);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (blocked(i, j)) {
              dp[i][j] = 0;
            } else if (i === 0 && j === 0) {
              dp[i][j] = 1;
            } else {
              dp[i][j] = (i > 0 ? dp[i - 1][j] : 0) + (j > 0 ? dp[i][j - 1] : 0);
            }
          }
        }
        return String(dp[m - 1][n - 1]);
      },
      inputs: [
        '3 3 0 1 1 1',
        '3 3 1 0 1 2',
        '2 2 0 1 1 0',
        '1 5 0 2 0 3',
        '5 1 1 0 3 0',
        '4 4 1 1 2 2',
        '5 5 1 2 3 1',
      ],
    },
    {
      key: '47',
      title: 'Bậc thang hai hàng tổng lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $2 \\times n$. Em duyệt qua các cột từ trái sang phải và ở **mỗi cột được chọn nhiều nhất một ô** (chọn ô hàng trên, ô hàng dưới, hoặc bỏ qua cột).\n\n' +
        'Ràng buộc: nếu hai cột **liền nhau** đều có ô được chọn thì hai ô đó **không được nằm cùng một hàng**.\n\n' +
        'Hãy tìm tổng giá trị lớn nhất của các ô được chọn.',
      inputDesc:
        'Dòng đầu chứa $n$ (số cột) $(1 \\le n \\le 1000)$. Hai dòng tiếp theo mỗi dòng $n$ số nguyên không âm $(\\le 1000)$: hàng trên rồi hàng dưới.',
      outputDesc: 'In ra tổng lớn nhất.',
      note: 'dp theo cột với trạng thái hàng vừa chọn: none / trên / dưới. Cột này chọn trên thì cột trước không được là trên (none hoặc dưới).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const top = readInts(ls[1]);
        const bot = readInts(ls[2]);
        const NEG = -Infinity;
        // trạng thái: 0 = cột trước bỏ qua, 1 = chọn hàng trên, 2 = chọn hàng dưới
        let none = 0;
        let pickTop = NEG;
        let pickBot = NEG;
        for (let j = 0; j < n; j++) {
          const prevBest = Math.max(none, pickTop, pickBot);
          // bỏ qua cột này
          const newNone = prevBest;
          // chọn hàng trên: cột trước không được là hàng trên
          const newTop = Math.max(none, pickBot) + top[j];
          // chọn hàng dưới: cột trước không được là hàng dưới
          const newBot = Math.max(none, pickTop) + bot[j];
          none = newNone;
          pickTop = newTop;
          pickBot = newBot;
        }
        return String(Math.max(none, pickTop, pickBot));
      },
      inputs: [
        '3\n1 2 3\n4 5 6',
        '1\n5\n9',
        '2\n3 4\n1 2',
        '1\n0\n0',
        '4\n0 0 0 0\n0 0 0 0',
        '4\n9 1 9 1\n1 9 1 9',
        '5\n1 2 3 4 5\n5 4 3 2 1',
      ],
    },
    {
      key: '48',
      title: 'Đường đi tổng nhỏ nhất được bỏ qua một ô',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới, chi phí là tổng các ô đi qua.\n\n' +
        'Robot được dùng **đúng một lần** khả năng đặc biệt: bỏ qua (miễn phí, không tính chi phí) một ô bất kỳ trên đường đi của mình. Hãy tìm chi phí nhỏ nhất.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra chi phí nhỏ nhất sau khi bỏ qua đúng một ô.',
      note: 'dp[i][j][0] = tổng nhỏ nhất chưa dùng quyền bỏ qua; dp[i][j][1] = đã dùng. Chuyển trạng thái khi bỏ qua ô (i,j) hiện tại.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const INF = Infinity;
        const dp: number[][][] = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => [INF, INF]),
        );
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              dp[i][j][0] = g[i][j];
              dp[i][j][1] = 0; // bỏ qua ô đầu
              continue;
            }
            const up0 = i > 0 ? dp[i - 1][j][0] : INF;
            const left0 = j > 0 ? dp[i][j - 1][0] : INF;
            const best0 = Math.min(up0, left0);
            dp[i][j][0] = best0 === INF ? INF : best0 + g[i][j];

            const up1 = i > 0 ? dp[i - 1][j][1] : INF;
            const left1 = j > 0 ? dp[i][j - 1][1] : INF;
            const best1 = Math.min(up1, left1);
            // đến (i,j) đã dùng quyền: hoặc dùng quyền trước đó rồi cộng g[i][j],
            // hoặc dùng quyền tại đây (bỏ qua g[i][j]) từ trạng thái 0.
            const useHere = best0 === INF ? INF : best0;
            const carried = best1 === INF ? INF : best1 + g[i][j];
            dp[i][j][1] = Math.min(useHere, carried);
          }
        }
        return String(Math.min(dp[m - 1][n - 1][0], dp[m - 1][n - 1][1]));
      },
      inputs: [
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 3\n1 2 3',
        '2 2\n1 9\n9 1',
        '1 1\n5',
        '3 1\n2\n3\n4',
        '2 2\n0 0\n0 0',
        '3 3\n9 9 9\n9 9 9\n9 9 9',
      ],
    },
    {
      key: '49',
      title: 'Đếm hình vuông toàn số 1 cạnh lẻ',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ chỉ gồm các số $0$ và $1$. Hãy đếm số hình vuông con toàn $1$ có **cạnh lẻ** (cạnh bằng $1, 3, 5, \\dots$).\n\n' +
        'Một hình vuông $3 \\times 3$ toàn $1$ chứa: chín hình $1 \\times 1$ và một hình $3 \\times 3$ — tất cả đều có cạnh lẻ nên được đếm.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 100)$. $m$ dòng tiếp theo, mỗi dòng $n$ số $0$ hoặc $1$.',
      outputDesc: 'In ra số hình vuông toàn $1$ có cạnh lẻ.',
      note: 'dp[i][j] = cạnh hình vuông lớn nhất kết thúc tại (i,j). Số hình cạnh lẻ kết thúc tại đó = ceil(dp/2) = số giá trị lẻ trong [1..dp].',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        let total = 0;
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (g[i][j] === 1) {
              dp[i][j] =
                i === 0 || j === 0
                  ? 1
                  : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
              // số cạnh lẻ trong [1..dp[i][j]] = ceil(dp/2)
              total += Math.ceil(dp[i][j] / 2);
            }
          }
        }
        return String(total);
      },
      inputs: [
        '3 3\n1 1 1\n1 1 1\n1 1 1',
        '2 2\n1 1\n1 1',
        '1 5\n1 1 1 1 1',
        '1 1\n0',
        '1 1\n1',
        '2 2\n0 0\n0 0',
        '4 4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1',
      ],
    },
    {
      key: '50',
      title: 'Đường đi tổng nhỏ nhất và số đường đạt được',
      difficulty: 'MEDIUM',
      story:
        'Cho lưới $m \\times n$ gồm các số nguyên không âm. Robot đi từ ô $(0,0)$ tới ô $(m-1, n-1)$, mỗi bước sang phải hoặc xuống dưới.\n\n' +
        'Hãy tìm **tổng nhỏ nhất** của một đường đi và **số đường đi** đạt được tổng nhỏ nhất đó. In ra hai số trên cùng một dòng, cách nhau bởi dấu cách.',
      inputDesc:
        'Dòng đầu chứa $m$ và $n$ $(1 \\le m, n \\le 30)$. $m$ dòng tiếp theo, mỗi dòng $n$ số nguyên không âm $(\\le 100)$.',
      outputDesc: 'In ra hai số: tổng nhỏ nhất và số đường đi đạt tổng đó, cách nhau bởi dấu cách.',
      note: 'Lưu (tổng nhỏ nhất, số cách) cho mỗi ô; cộng số cách của các ô trên kề có cùng tổng tối ưu.',
      solve: (input) => {
        const { m, n, g } = readGrid(input);
        const best: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        const cnt: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (i === 0 && j === 0) {
              best[i][j] = g[i][j];
              cnt[i][j] = 1;
              continue;
            }
            const up = i > 0 ? best[i - 1][j] : Infinity;
            const left = j > 0 ? best[i][j - 1] : Infinity;
            const m0 = Math.min(up, left);
            best[i][j] = g[i][j] + m0;
            let c = 0;
            if (i > 0 && best[i - 1][j] === m0) c += cnt[i - 1][j];
            if (j > 0 && best[i][j - 1] === m0) c += cnt[i][j - 1];
            cnt[i][j] = c;
          }
        }
        return best[m - 1][n - 1] + ' ' + cnt[m - 1][n - 1];
      },
      inputs: [
        '2 2\n1 1\n1 1',
        '1 3\n1 2 3',
        '3 3\n1 3 1\n1 5 1\n4 2 1',
        '1 1\n5',
        '3 1\n2\n3\n4',
        '2 2\n0 0\n0 0',
        '3 3\n0 0 0\n0 0 0\n0 0 0',
      ],
    },
  ],
};

export default course;

import { CourseSpec } from '../types';

/**
 * Chương 5 — Knapsack (bài toán cái túi) cơ bản.
 * Mục tiêu: nhóm bài chọn đồ vật theo trọng lượng/tổng: 0/1 knapsack, subset sum,
 * coin change (đếm cách & ít xu nhất), chia mảng thành hai phần bằng nhau.
 *
 * NOTE cho người viết: không bao giờ tự gõ đáp án — luôn trả về từ solve(input).
 * 3 input đầu là test mẫu hiển thị. Giới hạn giữ nhỏ để mọi giá trị (kể cả số
 * đếm) nằm trong số nguyên an toàn của JS.
 */

const readInts = (line: string): number[] =>
  (line ?? '')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));
const lines = (input: string): string[] => input.replace(/\r/g, '').split('\n');

const course: CourseSpec = {
  code: 'DP-BASIC-05',
  title: 'Chương 5: Knapsack cơ bản',
  description:
    'Nhóm bài toán cái túi: 0/1 knapsack, subset sum, đổi tiền (đếm số cách và ' +
    'số xu ít nhất), chia mảng thành hai phần có tổng bằng nhau.',
  tags: ['quy-hoach-dong', 'co-ban', 'knapsack', 'subset-sum', 'coin-change'],
  problems: [
    {
      key: '01',
      title: 'Cái túi 0/1',
      difficulty: 'MEDIUM',
      story:
        'Em có một chiếc túi chịu được trọng lượng tối đa $W$ và $n$ món đồ. Món đồ thứ $i$ nặng $w_i$ và có giá trị $v_i$.\n\n' +
        'Mỗi món đồ chỉ được lấy nhiều nhất một lần. Hãy chọn các món sao cho tổng trọng lượng không vượt quá $W$ và tổng giá trị là lớn nhất.',
      inputDesc:
        'Dòng đầu chứa $n$ và $W$ $(1 \\le n \\le 100,\\ 0 \\le W \\le 1000)$. Dòng thứ hai chứa $n$ trọng lượng $w_i$. Dòng thứ ba chứa $n$ giá trị $v_i$ $(0 \\le w_i, v_i \\le 1000)$.',
      outputDesc: 'In ra tổng giá trị lớn nhất.',
      note: 'Duyệt từng món, cập nhật dp[c] = max(dp[c], dp[c-w] + v) với c giảm dần từ W.',
      solve: (input) => {
        const ls = lines(input);
        const [n, W] = readInts(ls[0]);
        const w = readInts(ls[1]);
        const v = readInts(ls[2]);
        const dp = new Array(W + 1).fill(0);
        for (let i = 0; i < n; i++) {
          for (let c = W; c >= w[i]; c--) {
            dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
          }
        }
        return String(dp[W]);
      },
      inputs: [
        '3 4\n1 3 4\n15 20 30',
        '4 5\n1 2 3 2\n10 20 30 15',
        '1 0\n5\n10',
        '2 10\n5 5\n7 8',
        '3 6\n2 3 4\n3 4 5',
        '1 3\n5\n10',
        '4 4\n2 2 2 2\n3 3 3 3',
      ],
    },
    {
      key: '02',
      title: 'Tổng tập con',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên dương và một số đích $S$. Hãy cho biết có thể chọn ra một tập con của dãy sao cho tổng của chúng đúng bằng $S$ hay không.',
      inputDesc:
        'Dòng đầu chứa $n$ và $S$ $(1 \\le n \\le 100,\\ 0 \\le S \\le 10^4)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 1000)$.',
      outputDesc: 'In ra `YES` nếu chọn được, ngược lại in ra `NO`.',
      note: 'dp[s] = true nếu tạo được tổng s; duyệt từng số, cập nhật s giảm dần.',
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
        '3 0\n1 2 3',
        '5 11\n1 2 3 4 5',
        '2 7\n2 4',
        '1 5\n5',
        '4 8\n2 2 2 2',
      ],
    },
    {
      key: '03',
      title: 'Đổi tiền — đếm số cách',
      difficulty: 'MEDIUM',
      story:
        'Em có các đồng xu với $n$ loại mệnh giá khác nhau, mỗi loại có số lượng không giới hạn. Hãy đếm số cách chọn các đồng xu để tổng giá trị đúng bằng $A$.\n\n' +
        'Hai cách được coi là khác nhau nếu số lượng dùng của ít nhất một loại xu khác nhau (thứ tự không quan trọng).',
      inputDesc:
        'Dòng đầu chứa $n$ và $A$ $(1 \\le n \\le 50,\\ 0 \\le A \\le 5000)$. Dòng thứ hai chứa $n$ mệnh giá nguyên dương phân biệt $(\\le 1000)$.',
      outputDesc: 'In ra số cách đổi (kết quả đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'Lặp ngoài theo từng loại xu, lặp trong theo số tiền tăng dần: dp[s] += dp[s-coin].',
      solve: (input) => {
        const ls = lines(input);
        const [, A] = readInts(ls[0]);
        const coins = readInts(ls[1]);
        const dp = new Array(A + 1).fill(0);
        dp[0] = 1;
        for (const coin of coins) {
          for (let s = coin; s <= A; s++) {
            dp[s] += dp[s - coin];
          }
        }
        return String(dp[A]);
      },
      inputs: [
        '3 5\n1 2 5',
        '1 3\n2',
        '4 10\n2 5 3 6',
        '2 0\n1 2',
        '3 4\n1 2 3',
        '1 7\n3',
        '1 12\n4',
      ],
    },
    {
      key: '04',
      title: 'Đổi tiền — ít xu nhất',
      difficulty: 'MEDIUM',
      story:
        'Em có các đồng xu với $n$ loại mệnh giá, mỗi loại số lượng không giới hạn. Hãy tìm số đồng xu **ít nhất** để tổng giá trị đúng bằng $A$.\n\n' +
        'Nếu không có cách nào tạo ra đúng $A$, hãy in ra $-1$.',
      inputDesc:
        'Dòng đầu chứa $n$ và $A$ $(1 \\le n \\le 50,\\ 0 \\le A \\le 10^4)$. Dòng thứ hai chứa $n$ mệnh giá nguyên dương phân biệt $(\\le 1000)$.',
      outputDesc: 'In ra số xu ít nhất, hoặc $-1$ nếu không thể.',
      note: 'dp[s] = min(dp[s], dp[s-coin] + 1) cho mọi loại xu, với s tăng dần.',
      solve: (input) => {
        const ls = lines(input);
        const [, A] = readInts(ls[0]);
        const coins = readInts(ls[1]);
        const dp = new Array(A + 1).fill(Infinity);
        dp[0] = 0;
        for (let s = 1; s <= A; s++) {
          for (const coin of coins) {
            if (coin <= s && dp[s - coin] + 1 < dp[s]) dp[s] = dp[s - coin] + 1;
          }
        }
        return String(dp[A] === Infinity ? -1 : dp[A]);
      },
      inputs: [
        '3 11\n1 2 5',
        '1 3\n2',
        '2 6\n1 3',
        '3 0\n1 2 5',
        '3 7\n2 4 6',
        '1 9\n3',
        '1 5\n5',
      ],
    },
    {
      key: '05',
      title: 'Chia mảng thành hai phần bằng nhau',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương. Hãy cho biết có thể chia dãy thành hai nhóm (mỗi phần tử thuộc đúng một nhóm) sao cho tổng hai nhóm bằng nhau hay không.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 100)$.',
      outputDesc: 'In ra `YES` nếu chia được, ngược lại in ra `NO`.',
      note: 'Nếu tổng lẻ thì không thể; ngược lại quy về bài tổng tập con với đích = tổng / 2.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
        if (total % 2 !== 0) return 'NO';
        const half = total / 2;
        const dp = new Array(half + 1).fill(false);
        dp[0] = true;
        for (const x of a) {
          for (let s = half; s >= x; s--) {
            if (dp[s - x]) dp[s] = true;
          }
        }
        return dp[half] ? 'YES' : 'NO';
      },
      inputs: [
        '4\n1 5 11 5',
        '3\n1 2 5',
        '2\n2 2',
        '4\n1 1 1 1',
        '1\n7',
        '3\n2 2 2',
        '2\n3 3',
      ],
    },
    {
      key: '06',
      title: 'Đếm số tập con có tổng cho trước',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên không âm và một số đích $S$. Hãy đếm số tập con của dãy có tổng đúng bằng $S$.\n\n' +
        'Mỗi phần tử chỉ được dùng nhiều nhất một lần. Hai tập con khác nhau nếu tập chỉ số được chọn khác nhau.',
      inputDesc:
        'Dòng đầu chứa $n$ và $S$ $(1 \\le n \\le 60,\\ 0 \\le S \\le 5000)$. Dòng thứ hai chứa $n$ số nguyên không âm $(\\le 1000)$.',
      outputDesc: 'In ra số tập con thỏa mãn (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'dp[s] = số tập con có tổng s; duyệt từng phần tử, cập nhật s giảm dần: dp[s] += dp[s-x].',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const dp = new Array(S + 1).fill(0);
        dp[0] = 1;
        for (const x of a) {
          for (let s = S; s >= x; s--) {
            dp[s] += dp[s - x];
          }
        }
        return String(dp[S]);
      },
      inputs: [
        '4 3\n1 1 2 3',
        '3 0\n0 0 0',
        '5 5\n1 2 3 4 5',
        '3 10\n1 2 3',
        '4 4\n2 2 2 2',
        '1 5\n5',
        '1 3\n5',
      ],
    },
    {
      key: '07',
      title: 'Chia hai nhóm chênh lệch ít nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương. Hãy chia dãy thành hai nhóm (mỗi phần tử thuộc đúng một nhóm) sao cho **chênh lệch** giữa tổng hai nhóm là nhỏ nhất.\n\n' +
        'Hãy in ra giá trị chênh lệch nhỏ nhất đó.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 100)$.',
      outputDesc: 'In ra chênh lệch nhỏ nhất giữa tổng hai nhóm.',
      note: 'Tìm tổng tập con lớn nhất không vượt quá tổng/2; chênh lệch = tổng − 2 × tổng đó.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
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
        '3\n1 2 3',
        '2\n10 1',
        '1\n7',
        '5\n3 1 4 2 2',
        '4\n2 2 2 2',
        '2\n5 5',
      ],
    },
    {
      key: '08',
      title: 'Cắt thanh gỗ',
      difficulty: 'MEDIUM',
      story:
        'Em có một thanh gỗ dài $n$ đơn vị. Một đoạn gỗ dài $i$ bán được giá $p_i$ (với $i$ từ $1$ đến $n$).\n\n' +
        'Em có thể cắt thanh gỗ thành nhiều đoạn nguyên (hoặc để nguyên). Hãy tìm tổng tiền lớn nhất thu được từ thanh gỗ.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 1000)$ — giá của đoạn dài $1, 2, \\dots, n$.',
      outputDesc: 'In ra tổng tiền lớn nhất.',
      note: 'Đây là cái túi không giới hạn: dp[len] = max(dp[len], dp[len-i] + p[i]).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const p = readInts(ls[1]); // p[0] là giá đoạn dài 1
        const dp = new Array(n + 1).fill(0);
        for (let len = 1; len <= n; len++) {
          for (let i = 1; i <= len; i++) {
            dp[len] = Math.max(dp[len], dp[len - i] + p[i - 1]);
          }
        }
        return String(dp[n]);
      },
      inputs: [
        '4\n1 5 8 9',
        '8\n1 5 8 9 10 17 17 20',
        '1\n5',
        '3\n2 2 2',
        '5\n3 5 8 9 10',
        '2\n0 0',
        '4\n3 0 0 0',
      ],
    },
    {
      key: '09',
      title: 'Đếm cách tạo tổng có thứ tự',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương phân biệt và một số đích $T$. Hãy đếm số cách viết $T$ thành tổng các số trong dãy, trong đó **thứ tự có quan trọng** và mỗi số được dùng bao nhiêu lần cũng được.\n\n' +
        'Ví dụ với các số $\\{1, 2, 3\\}$ và $T = 4$: các cách gồm $1+1+1+1$, $1+1+2$, $1+2+1$, $2+1+1$, $2+2$, $1+3$, $3+1$ — tổng cộng $7$ cách.',
      inputDesc:
        'Dòng đầu chứa $n$ và $T$ $(1 \\le n \\le 50,\\ 0 \\le T \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên dương phân biệt $(\\le 1000)$.',
      outputDesc: 'In ra số cách (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'Lặp ngoài theo tổng s, lặp trong theo từng số: dp[s] += dp[s-num]. (Thứ tự lặp ngược với bài đếm cách đổi tiền.)',
      solve: (input) => {
        const ls = lines(input);
        const [, T] = readInts(ls[0]);
        const nums = readInts(ls[1]);
        const dp = new Array(T + 1).fill(0);
        dp[0] = 1;
        for (let s = 1; s <= T; s++) {
          for (const num of nums) {
            if (num <= s) dp[s] += dp[s - num];
          }
        }
        return String(dp[T]);
      },
      inputs: [
        '3 4\n1 2 3',
        '2 3\n1 2',
        '1 5\n2',
        '3 0\n1 2 3',
        '2 4\n4 5',
        '1 6\n2',
        '1 7\n3',
      ],
    },
    {
      key: '10',
      title: 'Gán dấu để đạt mục tiêu',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên không âm. Em phải đặt trước mỗi số một dấu cộng ($+$) hoặc trừ ($-$), rồi cộng tất cả lại.\n\n' +
        'Hãy đếm số cách đặt dấu sao cho kết quả đúng bằng số mục tiêu $T$.',
      inputDesc:
        'Dòng đầu chứa $n$ và $T$ $(1 \\le n \\le 60,\\ -10^4 \\le T \\le 10^4)$. Dòng thứ hai chứa $n$ số nguyên không âm $(\\le 1000)$.',
      outputDesc: 'In ra số cách gán dấu (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'Gọi P là nhóm dấu cộng: tổng(P) = (tổng + T) / 2; bài toán quy về đếm tập con có tổng đó.',
      solve: (input) => {
        const ls = lines(input);
        const [, T] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
        // cần tổng(P) = (total + T) / 2, phải không âm và chẵn
        if (Math.abs(T) > total || (total + T) % 2 !== 0) return '0';
        const target = (total + T) / 2;
        const dp = new Array(target + 1).fill(0);
        dp[0] = 1;
        for (const x of a) {
          for (let s = target; s >= x; s--) {
            dp[s] += dp[s - x];
          }
        }
        return String(dp[target]);
      },
      inputs: [
        '5 3\n1 1 1 1 1',
        '1 1\n1',
        '3 0\n1 2 3',
        '2 5\n1 2',
        '4 0\n0 0 0 0',
        '1 -1\n1',
        '3 6\n1 2 3',
      ],
    },
    {
      key: '11',
      title: 'Cái túi không giới hạn',
      difficulty: 'MEDIUM',
      story:
        'Em có một chiếc túi chịu được trọng lượng tối đa $W$ và $n$ loại món đồ. Loại thứ $i$ nặng $w_i$ và có giá trị $v_i$.\n\n' +
        'Khác với bài cái túi 0/1, mỗi loại món đồ có thể lấy **bao nhiêu lần cũng được**. Hãy chọn các món sao cho tổng trọng lượng không vượt quá $W$ và tổng giá trị là lớn nhất.',
      inputDesc:
        'Dòng đầu chứa $n$ và $W$ $(1 \\le n \\le 100,\\ 0 \\le W \\le 1000)$. Dòng thứ hai chứa $n$ trọng lượng $w_i$ $(1 \\le w_i \\le 1000)$. Dòng thứ ba chứa $n$ giá trị $v_i$ $(0 \\le v_i \\le 1000)$.',
      outputDesc: 'In ra tổng giá trị lớn nhất.',
      note: 'dp[c] = max(dp[c], dp[c-w] + v) với c TĂNG dần (vì mỗi món lấy nhiều lần).',
      solve: (input) => {
        const ls = lines(input);
        const [n, W] = readInts(ls[0]);
        const w = readInts(ls[1]);
        const v = readInts(ls[2]);
        const dp = new Array(W + 1).fill(0);
        for (let i = 0; i < n; i++) {
          for (let c = w[i]; c <= W; c++) {
            dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
          }
        }
        return String(dp[W]);
      },
      inputs: [
        '2 5\n1 3\n4 9',
        '3 10\n2 3 5\n3 4 6',
        '1 0\n2\n5',
        '1 7\n3\n2',
        '2 6\n6 7\n10 12',
        '2 8\n2 2\n3 3',
        '1 9\n3\n4',
      ],
    },
    {
      key: '12',
      title: 'Cái túi giới hạn số lượng',
      difficulty: 'MEDIUM',
      story:
        'Em có một chiếc túi chịu được trọng lượng tối đa $W$ và $n$ loại món đồ. Loại thứ $i$ nặng $w_i$, có giá trị $v_i$ và chỉ có $c_i$ bản.\n\n' +
        'Mỗi loại được lấy nhiều nhất $c_i$ lần. Hãy chọn sao cho tổng trọng lượng không vượt quá $W$ và tổng giá trị là lớn nhất.',
      inputDesc:
        'Dòng đầu chứa $n$ và $W$ $(1 \\le n \\le 50,\\ 0 \\le W \\le 1000)$. Dòng thứ hai chứa $n$ trọng lượng $w_i$ $(1 \\le w_i \\le 1000)$. Dòng thứ ba chứa $n$ giá trị $v_i$ $(0 \\le v_i \\le 1000)$. Dòng thứ tư chứa $n$ số lượng $c_i$ $(1 \\le c_i \\le 50)$.',
      outputDesc: 'In ra tổng giá trị lớn nhất.',
      note: 'Coi mỗi món i như có c_i bản giống nhau, rồi áp dụng cái túi 0/1 (c giảm dần).',
      solve: (input) => {
        const ls = lines(input);
        const [n, W] = readInts(ls[0]);
        const w = readInts(ls[1]);
        const v = readInts(ls[2]);
        const c = readInts(ls[3]);
        const dp = new Array(W + 1).fill(0);
        for (let i = 0; i < n; i++) {
          for (let k = 0; k < c[i]; k++) {
            for (let cap = W; cap >= w[i]; cap--) {
              dp[cap] = Math.max(dp[cap], dp[cap - w[i]] + v[i]);
            }
          }
        }
        return String(dp[W]);
      },
      inputs: [
        '2 8\n2 3\n3 4\n2 2',
        '2 10\n1 5\n5 20\n3 1',
        '1 0\n2\n5\n3',
        '1 9\n3\n4\n2',
        '2 6\n6 7\n10 12\n1 1',
        '3 7\n1 2 3\n2 3 5\n1 1 1',
        '1 10\n2\n3\n3',
      ],
    },
    {
      key: '13',
      title: 'Ít số chính phương nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho số nguyên dương $n$. Hãy tìm số lượng **ít nhất** các số chính phương ($1, 4, 9, 16, \\dots$) có tổng đúng bằng $n$.\n\n' +
        'Ví dụ $n = 12 = 4 + 4 + 4$ cần $3$ số; $n = 13 = 4 + 9$ chỉ cần $2$ số.',
      inputDesc: 'Một dòng duy nhất chứa số nguyên $n$ $(0 \\le n \\le 10^4)$.',
      outputDesc: 'In ra số lượng số chính phương ít nhất (với $n = 0$ in ra $0$).',
      note: 'dp[s] = min qua mọi số chính phương j*j <= s của dp[s - j*j] + 1.',
      solve: (input) => {
        const n = parseInt(lines(input)[0].trim(), 10);
        const dp = new Array(n + 1).fill(Infinity);
        dp[0] = 0;
        for (let s = 1; s <= n; s++) {
          for (let j = 1; j * j <= s; j++) {
            if (dp[s - j * j] + 1 < dp[s]) dp[s] = dp[s - j * j] + 1;
          }
        }
        return String(dp[n]);
      },
      inputs: ['12', '13', '1', '0', '100', '7', '9999'],
    },
    {
      key: '14',
      title: 'Tổng xúc xắc',
      difficulty: 'MEDIUM',
      story:
        'Em gieo $d$ viên xúc xắc, mỗi viên có $f$ mặt đánh số từ $1$ đến $f$. Hãy đếm số cách gieo sao cho tổng số chấm đúng bằng $T$.\n\n' +
        'Hai cách khác nhau nếu có ít nhất một viên xúc xắc cho kết quả khác nhau (các viên được phân biệt).',
      inputDesc:
        'Một dòng chứa ba số $d$, $f$, $T$ $(1 \\le d \\le 30,\\ 1 \\le f \\le 20,\\ 0 \\le T \\le 300)$.',
      outputDesc: 'In ra số cách gieo (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'dp[i][s] = số cách dùng i viên đạt tổng s; dp[i][s] = tổng dp[i-1][s-k] với k từ 1..f.',
      solve: (input) => {
        const [d, f, T] = readInts(lines(input)[0]);
        let dp = new Array(T + 1).fill(0);
        dp[0] = 1;
        for (let i = 0; i < d; i++) {
          const nd = new Array(T + 1).fill(0);
          for (let s = 0; s <= T; s++) {
            if (dp[s] === 0) continue;
            for (let k = 1; k <= f && s + k <= T; k++) {
              nd[s + k] += dp[s];
            }
          }
          dp = nd;
        }
        return String(dp[T]);
      },
      inputs: [
        '2 6 7',
        '1 6 3',
        '2 6 1',
        '1 6 0',
        '3 4 5',
        '4 2 4',
        '2 2 4',
      ],
    },
    {
      key: '15',
      title: 'Số 0 và số 1',
      difficulty: 'MEDIUM',
      story:
        'Cho một danh sách gồm $k$ chuỗi nhị phân (chỉ gồm ký tự `0` và `1`). Em có tối đa $m$ số $0$ và $n$ số $1$ để "chi trả".\n\n' +
        'Mỗi chuỗi được chọn tốn đúng số ký tự $0$ và $1$ của nó. Hãy chọn được **nhiều chuỗi nhất** sao cho tổng số $0$ không vượt quá $m$ và tổng số $1$ không vượt quá $n$.',
      inputDesc:
        'Dòng đầu chứa $k$, $m$, $n$ $(1 \\le k \\le 100,\\ 0 \\le m, n \\le 100)$. $k$ dòng tiếp theo, mỗi dòng một chuỗi nhị phân (độ dài $\\le 100$).',
      outputDesc: 'In ra số chuỗi nhiều nhất có thể chọn.',
      note: 'Cái túi hai chiều: dp[i][j] = số chuỗi nhiều nhất khi dùng i số 0 và j số 1; duyệt i, j giảm dần.',
      solve: (input) => {
        const ls = lines(input);
        const [k, m, n] = readInts(ls[0]);
        const dp: number[][] = Array.from({ length: m + 1 }, () =>
          new Array(n + 1).fill(0),
        );
        for (let t = 0; t < k; t++) {
          const str = (ls[1 + t] ?? '').trim();
          let zeros = 0;
          let ones = 0;
          for (const ch of str) {
            if (ch === '0') zeros++;
            else if (ch === '1') ones++;
          }
          for (let i = m; i >= zeros; i--) {
            for (let j = n; j >= ones; j--) {
              if (dp[i - zeros][j - ones] + 1 > dp[i][j]) {
                dp[i][j] = dp[i - zeros][j - ones] + 1;
              }
            }
          }
        }
        return String(dp[m][n]);
      },
      inputs: [
        '4 5 3\n10\n0001\n111001\n1',
        '3 3 3\n11\n00\n01',
        '2 0 0\n0\n1',
        '1 5 5\n00111',
        '3 1 1\n10\n01\n11',
        '2 2 2\n00\n00',
        '4 10 10\n1\n0\n11\n00',
      ],
    },
    {
      key: '16',
      title: 'Chia thành K nhóm bằng nhau',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương và một số $K$. Hãy cho biết có thể chia tất cả các phần tử thành $K$ nhóm khác rỗng sao cho tổng mỗi nhóm bằng nhau hay không.',
      inputDesc:
        'Dòng đầu chứa $n$ và $K$ $(1 \\le K \\le n \\le 16)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 100)$.',
      outputDesc: 'In ra `YES` nếu chia được, ngược lại in ra `NO`.',
      note: 'Tổng phải chia hết cho K; quay lui lần lượt lấp đầy từng nhóm đến target = tổng/K.',
      solve: (input) => {
        const ls = lines(input);
        const [n, K] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
        if (total % K !== 0) return 'NO';
        const target = total / K;
        if (a.some((x) => x > target)) return 'NO';
        a.sort((x, y) => y - x);
        const used = new Array(n).fill(false);
        const fill = (groups: number, cur: number, start: number): boolean => {
          if (groups === 0) return true;
          if (cur === target) return fill(groups - 1, 0, 0);
          for (let i = start; i < n; i++) {
            if (!used[i] && cur + a[i] <= target) {
              used[i] = true;
              if (fill(groups, cur + a[i], i + 1)) return true;
              used[i] = false;
              if (cur === 0) break;
            }
          }
          return false;
        };
        return fill(K, 0, 0) ? 'YES' : 'NO';
      },
      inputs: [
        '5 2\n1 2 3 4 6',
        '4 3\n2 2 2 2',
        '1 1\n7',
        '3 2\n1 2 4',
        '4 4\n3 3 3 3',
        '6 3\n1 1 1 1 1 1',
        '4 2\n1 1 1 1',
      ],
    },
    {
      key: '17',
      title: 'Cái túi đúng sức chứa',
      difficulty: 'MEDIUM',
      story:
        'Em có một chiếc túi và $n$ món đồ. Món thứ $i$ nặng $w_i$ và có giá trị $v_i$, mỗi món lấy nhiều nhất một lần.\n\n' +
        'Lần này em muốn tổng trọng lượng **đúng bằng** $W$ (không nhỏ hơn). Hãy tìm tổng giá trị lớn nhất khi tổng trọng lượng đúng bằng $W$; nếu không có cách nào in ra $-1$.',
      inputDesc:
        'Dòng đầu chứa $n$ và $W$ $(1 \\le n \\le 100,\\ 0 \\le W \\le 1000)$. Dòng thứ hai chứa $n$ trọng lượng $w_i$ $(1 \\le w_i \\le 1000)$. Dòng thứ ba chứa $n$ giá trị $v_i$ $(0 \\le v_i \\le 1000)$.',
      outputDesc: 'In ra tổng giá trị lớn nhất khi trọng lượng đúng bằng $W$, hoặc $-1$.',
      note: 'Khởi tạo dp[0]=0, các vị trí khác = -∞ (không đạt được); cập nhật như cái túi 0/1.',
      solve: (input) => {
        const ls = lines(input);
        const [n, W] = readInts(ls[0]);
        const w = readInts(ls[1]);
        const v = readInts(ls[2]);
        const NEG = -Infinity;
        const dp = new Array(W + 1).fill(NEG);
        dp[0] = 0;
        for (let i = 0; i < n; i++) {
          for (let c = W; c >= w[i]; c--) {
            if (dp[c - w[i]] !== NEG && dp[c - w[i]] + v[i] > dp[c]) {
              dp[c] = dp[c - w[i]] + v[i];
            }
          }
        }
        return String(dp[W] === NEG ? -1 : dp[W]);
      },
      inputs: [
        '3 5\n1 2 3\n6 10 12',
        '2 4\n2 2\n3 4',
        '2 7\n2 4\n5 6',
        '1 0\n3\n9',
        '3 6\n2 2 2\n1 1 1',
        '2 3\n2 2\n5 5',
        '1 5\n5\n8',
      ],
    },
    {
      key: '18',
      title: 'Đếm tập con theo hiệu',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên không âm. Hãy đếm số cách chia dãy thành hai nhóm $S_1$ và $S_2$ (mỗi phần tử thuộc đúng một nhóm) sao cho $S_1 - S_2 = d$, trong đó $S_1, S_2$ là tổng của hai nhóm.',
      inputDesc:
        'Dòng đầu chứa $n$ và $d$ $(1 \\le n \\le 60,\\ 0 \\le d \\le 5000)$. Dòng thứ hai chứa $n$ số nguyên không âm $(\\le 1000)$.',
      outputDesc: 'In ra số cách (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'S1 = (tổng + d)/2; quy về đếm số tập con có tổng đúng S1.',
      solve: (input) => {
        const ls = lines(input);
        const [, d] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
        if (d > total || (total + d) % 2 !== 0) return '0';
        const target = (total + d) / 2;
        const dp = new Array(target + 1).fill(0);
        dp[0] = 1;
        for (const x of a) {
          for (let s = target; s >= x; s--) {
            dp[s] += dp[s - x];
          }
        }
        return String(dp[target]);
      },
      inputs: [
        '4 1\n1 1 2 3',
        '4 0\n1 1 1 1',
        '3 0\n0 0 0',
        '2 5\n1 2',
        '5 3\n1 1 1 1 1',
        '1 0\n0',
        '3 6\n1 2 3',
      ],
    },
    {
      key: '19',
      title: 'Đổi tiền — nhiều xu nhất',
      difficulty: 'MEDIUM',
      story:
        'Em có các đồng xu với $n$ loại mệnh giá, mỗi loại số lượng không giới hạn. Hãy tìm số đồng xu **nhiều nhất** để tổng giá trị đúng bằng $A$.\n\n' +
        'Nếu không có cách nào tạo ra đúng $A$, hãy in ra $-1$.',
      inputDesc:
        'Dòng đầu chứa $n$ và $A$ $(1 \\le n \\le 50,\\ 0 \\le A \\le 10^4)$. Dòng thứ hai chứa $n$ mệnh giá nguyên dương phân biệt $(\\le 1000)$.',
      outputDesc: 'In ra số xu nhiều nhất, hoặc $-1$ nếu không thể.',
      note: 'dp[s] = max(dp[s], dp[s-coin] + 1) với s tăng dần; khởi tạo dp[0]=0, còn lại -∞.',
      solve: (input) => {
        const ls = lines(input);
        const [, A] = readInts(ls[0]);
        const coins = readInts(ls[1]);
        const dp = new Array(A + 1).fill(-Infinity);
        dp[0] = 0;
        for (let s = 1; s <= A; s++) {
          for (const coin of coins) {
            if (coin <= s && dp[s - coin] !== -Infinity && dp[s - coin] + 1 > dp[s]) {
              dp[s] = dp[s - coin] + 1;
            }
          }
        }
        return String(dp[A] === -Infinity ? -1 : dp[A]);
      },
      inputs: [
        '3 11\n1 2 5',
        '2 6\n2 3',
        '1 3\n2',
        '3 0\n1 2 5',
        '3 7\n2 4 6',
        '1 9\n3',
        '2 10\n5 5',
      ],
    },
    {
      key: '20',
      title: 'Cắt dây nhiều đoạn nhất',
      difficulty: 'MEDIUM',
      story:
        'Em có một sợi dây dài $n$ và chỉ được phép cắt thành các đoạn có độ dài thuộc tập $\\{a, b, c\\}$.\n\n' +
        'Hãy cắt sao cho dùng hết sợi dây (tổng độ dài các đoạn đúng bằng $n$) và **số đoạn là nhiều nhất**. Nếu không cắt được in ra $-1$.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(0 \\le n \\le 10^4)$. Dòng thứ hai chứa ba số nguyên dương $a$, $b$, $c$ $(1 \\le a, b, c \\le 1000)$.',
      outputDesc: 'In ra số đoạn nhiều nhất, hoặc $-1$ nếu không thể.',
      note: 'Cái túi không giới hạn tối đa hoá số đoạn: dp[s] = max(dp[s-len]+1).',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const segs = readInts(ls[1]);
        const dp = new Array(n + 1).fill(-Infinity);
        dp[0] = 0;
        for (let s = 1; s <= n; s++) {
          for (const len of segs) {
            if (len <= s && dp[s - len] !== -Infinity && dp[s - len] + 1 > dp[s]) {
              dp[s] = dp[s - len] + 1;
            }
          }
        }
        return String(dp[n] === -Infinity ? -1 : dp[n]);
      },
      inputs: [
        '5\n5 3 2',
        '7\n2 3 5',
        '0\n1 2 3',
        '4\n3 3 3',
        '11\n2 3 5',
        '1\n2 3 4',
        '9\n3 3 3',
      ],
    },
    {
      key: '21',
      title: 'Đổi tiền nguồn hạn chế',
      difficulty: 'MEDIUM',
      story:
        'Em có $n$ loại mệnh giá xu; loại thứ $i$ có giá trị $coin_i$ và chỉ có $cnt_i$ đồng. Hãy đếm số cách chọn các đồng xu để tổng giá trị đúng bằng $A$.\n\n' +
        'Hai cách khác nhau nếu số lượng dùng của ít nhất một loại xu khác nhau (thứ tự không quan trọng).',
      inputDesc:
        'Dòng đầu chứa $n$ và $A$ $(1 \\le n \\le 50,\\ 0 \\le A \\le 2000)$. Dòng thứ hai chứa $n$ mệnh giá $coin_i$ $(1 \\le coin_i \\le 1000)$. Dòng thứ ba chứa $n$ số lượng $cnt_i$ $(1 \\le cnt_i \\le 50)$.',
      outputDesc: 'In ra số cách (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'Với mỗi loại xu, coi như cnt_i bản giống nhau và làm như đếm tập con (0/1) theo từng bản.',
      solve: (input) => {
        const ls = lines(input);
        const [, A] = readInts(ls[0]);
        const coins = readInts(ls[1]);
        const cnt = readInts(ls[2]);
        const dp = new Array(A + 1).fill(0);
        dp[0] = 1;
        for (let i = 0; i < coins.length; i++) {
          for (let k = 0; k < cnt[i]; k++) {
            for (let s = A; s >= coins[i]; s--) {
              dp[s] += dp[s - coins[i]];
            }
          }
        }
        return String(dp[A]);
      },
      inputs: [
        '2 4\n1 2\n2 2',
        '3 5\n1 2 5\n5 5 5',
        '1 0\n2\n3',
        '1 6\n2\n2',
        '2 3\n1 2\n1 1',
        '2 8\n2 2\n2 2',
        '1 10\n3\n3',
      ],
    },
    {
      key: '22',
      title: 'Tổng tập con gần nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên dương và một giới hạn $W$. Hãy tìm tổng tập con **lớn nhất** nhưng không vượt quá $W$.',
      inputDesc:
        'Dòng đầu chứa $n$ và $W$ $(1 \\le n \\le 100,\\ 0 \\le W \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 1000)$.',
      outputDesc: 'In ra tổng tập con lớn nhất không vượt quá $W$.',
      note: 'Chính là cái túi 0/1 với value = weight: dp[c] = max(dp[c], dp[c-x] + x).',
      solve: (input) => {
        const ls = lines(input);
        const [, W] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const dp = new Array(W + 1).fill(0);
        for (const x of a) {
          for (let c = W; c >= x; c--) {
            if (dp[c - x] + x > dp[c]) dp[c] = dp[c - x] + x;
          }
        }
        return String(dp[W]);
      },
      inputs: [
        '4 10\n3 4 5 2',
        '3 6\n5 7 9',
        '1 0\n5',
        '2 3\n5 6',
        '4 8\n2 2 2 2',
        '3 100\n10 20 30',
        '1 5\n5',
      ],
    },
    {
      key: '23',
      title: 'Đếm bội tập con không giới hạn',
      difficulty: 'MEDIUM',
      story:
        'Cho $n$ loại số nguyên dương phân biệt và một số đích $S$. Hãy đếm số cách chọn (có lặp) các số sao cho tổng đúng bằng $S$, trong đó mỗi loại được dùng **bao nhiêu lần cũng được** và **thứ tự không quan trọng**.\n\n' +
        'Ví dụ với $\\{1, 2\\}$ và $S = 4$: các cách là $1+1+1+1$, $1+1+2$, $2+2$ — tổng cộng $3$ cách.',
      inputDesc:
        'Dòng đầu chứa $n$ và $S$ $(1 \\le n \\le 50,\\ 0 \\le S \\le 5000)$. Dòng thứ hai chứa $n$ số nguyên dương phân biệt $(\\le 1000)$.',
      outputDesc: 'In ra số cách (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'Giống đếm cách đổi tiền: lặp ngoài theo từng số, lặp trong theo tổng tăng dần.',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0]);
        const nums = readInts(ls[1]);
        const dp = new Array(S + 1).fill(0);
        dp[0] = 1;
        for (const num of nums) {
          for (let s = num; s <= S; s++) {
            dp[s] += dp[s - num];
          }
        }
        return String(dp[S]);
      },
      inputs: [
        '2 4\n1 2',
        '3 5\n1 2 5',
        '2 0\n1 2',
        '1 7\n2',
        '1 6\n2',
        '3 4\n1 2 3',
        '1 10\n5',
      ],
    },
    {
      key: '24',
      title: 'Đếm cách tổng số chính phương',
      difficulty: 'MEDIUM',
      story:
        'Cho số nguyên dương $n$. Hãy đếm số cách viết $n$ thành tổng các số chính phương ($1, 4, 9, \\dots$), trong đó **thứ tự không quan trọng** và mỗi số chính phương được dùng bao nhiêu lần cũng được.\n\n' +
        'Ví dụ $n = 5$: $1+1+1+1+1$ và $1+4$ — tổng cộng $2$ cách.',
      inputDesc: 'Một dòng duy nhất chứa số nguyên $n$ $(0 \\le n \\le 300)$.',
      outputDesc: 'In ra số cách (với $n = 0$ in ra $1$ — tập rỗng).',
      note: 'Đếm cách dùng tập số chính phương (1,4,9,...) như bài đếm cách đổi tiền không giới hạn.',
      solve: (input) => {
        const n = parseInt(lines(input)[0].trim(), 10);
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let j = 1; j * j <= n; j++) {
          const sq = j * j;
          for (let s = sq; s <= n; s++) {
            dp[s] += dp[s - sq];
          }
        }
        return String(dp[n]);
      },
      inputs: ['5', '4', '1', '0', '10', '9', '50'],
    },
    {
      key: '25',
      title: 'Chia hai nhóm bằng số lượng',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương với $n$ **chẵn**. Hãy chia dãy thành hai nhóm có **đúng $n/2$ phần tử mỗi nhóm** sao cho chênh lệch tổng hai nhóm là nhỏ nhất.\n\n' +
        'Hãy in ra giá trị chênh lệch nhỏ nhất đó.',
      inputDesc:
        'Dòng đầu chứa số nguyên chẵn $n$ $(2 \\le n \\le 30)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 100)$.',
      outputDesc: 'In ra chênh lệch nhỏ nhất giữa tổng hai nhóm có cùng kích thước.',
      note: 'dp[cnt][s] = đạt được tổng s khi chọn cnt phần tử; tìm s gần tổng/2 với cnt = n/2.',
      solve: (input) => {
        const ls = lines(input);
        const n = parseInt(ls[0].trim(), 10);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
        const half = n / 2;
        // dp[c] = tập tổng đạt được khi chọn đúng c phần tử
        const dp: boolean[][] = Array.from({ length: half + 1 }, () =>
          new Array(total + 1).fill(false),
        );
        dp[0][0] = true;
        for (const x of a) {
          for (let c = half; c >= 1; c--) {
            for (let s = total; s >= x; s--) {
              if (dp[c - 1][s - x]) dp[c][s] = true;
            }
          }
        }
        let best = total;
        for (let s = 0; s <= total; s++) {
          if (dp[half][s]) {
            const diff = Math.abs(total - 2 * s);
            if (diff < best) best = diff;
          }
        }
        return String(best);
      },
      inputs: [
        '4\n1 2 3 4',
        '2\n10 1',
        '4\n5 5 5 5',
        '6\n1 1 1 1 1 1',
        '4\n10 20 30 40',
        '2\n7 7',
        '6\n3 1 4 2 5 6',
      ],
    },
    {
      key: '26',
      title: 'Tập con ít phần tử nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương và một số đích $S$. Hãy tìm tập con có **ít phần tử nhất** mà tổng đúng bằng $S$.\n\n' +
        'Mỗi phần tử dùng nhiều nhất một lần. Nếu không có tập con nào in ra $-1$.',
      inputDesc:
        'Dòng đầu chứa $n$ và $S$ $(1 \\le n \\le 100,\\ 0 \\le S \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 1000)$.',
      outputDesc: 'In ra số phần tử ít nhất, hoặc $-1$ nếu không thể (với $S = 0$ in ra $0$).',
      note: 'dp[s] = số phần tử ít nhất đạt tổng s; cập nhật như cái túi 0/1 (s giảm dần) với dp[s]=min(dp[s], dp[s-x]+1).',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const dp = new Array(S + 1).fill(Infinity);
        dp[0] = 0;
        for (const x of a) {
          for (let s = S; s >= x; s--) {
            if (dp[s - x] + 1 < dp[s]) dp[s] = dp[s - x] + 1;
          }
        }
        return String(dp[S] === Infinity ? -1 : dp[S]);
      },
      inputs: [
        '4 5\n1 2 3 4',
        '3 6\n2 4 6',
        '2 7\n2 4',
        '3 0\n1 2 3',
        '4 8\n2 2 2 2',
        '1 5\n5',
        '5 10\n10 1 1 1 1',
      ],
    },
    {
      key: '27',
      title: 'Tổng tập con chia hết cho 3',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương. Hãy tìm tổng tập con **lớn nhất** mà chia hết cho $3$.\n\n' +
        'Tập con rỗng có tổng $0$ (chia hết cho $3$) luôn hợp lệ, nên đáp án luôn $\\ge 0$.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 1000)$.',
      outputDesc: 'In ra tổng tập con lớn nhất chia hết cho $3$.',
      note: 'dp[r] = tổng lớn nhất đạt được với số dư r (mod 3); cập nhật theo từng số.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const NEG = -Infinity;
        let dp = [0, NEG, NEG]; // dp[r] = tổng lớn nhất có số dư r
        for (const x of a) {
          const nd = dp.slice();
          for (let r = 0; r < 3; r++) {
            if (dp[r] === NEG) continue;
            const nr = (r + x) % 3;
            if (dp[r] + x > nd[nr]) nd[nr] = dp[r] + x;
          }
          dp = nd;
        }
        return String(dp[0]);
      },
      inputs: [
        '4\n1 2 3 4',
        '3\n1 2 3',
        '2\n1 1',
        '1\n5',
        '5\n3 6 9 12 15',
        '4\n2 2 2 2',
        '3\n1 4 7',
      ],
    },
    {
      key: '28',
      title: 'Đếm tập con chia hết cho K',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương và một số $K$. Hãy đếm số tập con (kể cả tập rỗng) có tổng chia hết cho $K$.\n\n' +
        'Tập rỗng có tổng $0$, chia hết cho mọi $K$, nên luôn được tính.',
      inputDesc:
        'Dòng đầu chứa $n$ và $K$ $(1 \\le n \\le 50,\\ 1 \\le K \\le 100)$. Dòng thứ hai chứa $n$ số nguyên dương $(\\le 1000)$.',
      outputDesc: 'In ra số tập con có tổng chia hết cho $K$ (đảm bảo nằm trong phạm vi số nguyên an toàn).',
      note: 'dp[r] = số tập con có tổng đồng dư r (mod K); với mỗi số, cập nhật theo số dư mới.',
      solve: (input) => {
        const ls = lines(input);
        const [, K] = readInts(ls[0]);
        const a = readInts(ls[1]);
        let dp = new Array(K).fill(0);
        dp[0] = 1; // tập rỗng
        for (const x of a) {
          const nd = dp.slice();
          for (let r = 0; r < K; r++) {
            if (dp[r] === 0) continue;
            const nr = (r + x) % K;
            nd[nr] += dp[r];
          }
          dp = nd;
        }
        return String(dp[0]);
      },
      inputs: [
        '3 2\n1 2 3',
        '4 3\n1 2 3 6',
        '1 5\n5',
        '2 4\n1 2',
        '4 2\n2 2 2 2',
        '1 3\n7',
        '5 5\n5 5 5 5 5',
      ],
    },
    {
      key: '29',
      title: 'Số tiền nhỏ nhất không tạo được',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ giá trị xu (mỗi đồng dùng nhiều nhất một lần). Hãy tìm số tiền nguyên dương **nhỏ nhất** mà em **không thể** tạo ra bằng một tập con nào của các đồng xu.\n\n' +
        'Ví dụ với $\\{1, 2, 5\\}$: tạo được $1, 2, 3, 5, 6, 7, 8$ nhưng không tạo được $4$, nên đáp án là $4$.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 100)$. Dòng thứ hai chứa $n$ giá trị xu nguyên dương $(\\le 100)$.',
      outputDesc: 'In ra số tiền nguyên dương nhỏ nhất không tạo được.',
      note: 'Đánh dấu mọi tổng tập con đạt được (subset-sum), rồi quét từ 1 lên tìm tổng đầu tiên không đạt.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const total = a.reduce((s, x) => s + x, 0);
        const dp = new Array(total + 1).fill(false);
        dp[0] = true;
        for (const x of a) {
          for (let s = total; s >= x; s--) {
            if (dp[s - x]) dp[s] = true;
          }
        }
        for (let s = 1; s <= total; s++) {
          if (!dp[s]) return String(s);
        }
        return String(total + 1);
      },
      inputs: [
        '3\n1 2 5',
        '3\n1 2 3',
        '1\n2',
        '1\n1',
        '4\n1 1 1 1',
        '3\n5 7 1',
        '4\n2 4 6 8',
      ],
    },
    {
      key: '30',
      title: 'Cái túi hai ràng buộc',
      difficulty: 'MEDIUM',
      story:
        'Em có một chiếc túi với giới hạn trọng lượng $W$ và giới hạn thể tích $V$, cùng $n$ món đồ. Món thứ $i$ nặng $w_i$, chiếm thể tích $u_i$ và có giá trị $val_i$.\n\n' +
        'Mỗi món lấy nhiều nhất một lần. Hãy chọn sao cho tổng trọng lượng không quá $W$ **và** tổng thể tích không quá $V$, tối đa hoá tổng giá trị.',
      inputDesc:
        'Dòng đầu chứa $n$, $W$, $V$ $(1 \\le n \\le 50,\\ 0 \\le W, V \\le 100)$. Dòng thứ hai chứa $n$ trọng lượng $w_i$. Dòng thứ ba chứa $n$ thể tích $u_i$. Dòng thứ tư chứa $n$ giá trị $val_i$ $(0 \\le w_i, u_i, val_i \\le 100)$.',
      outputDesc: 'In ra tổng giá trị lớn nhất.',
      note: 'dp[cw][cv] = max; duyệt từng món, cập nhật cw và cv giảm dần (cái túi 0/1 hai chiều).',
      solve: (input) => {
        const ls = lines(input);
        const [n, W, V] = readInts(ls[0]);
        const w = readInts(ls[1]);
        const u = readInts(ls[2]);
        const val = readInts(ls[3]);
        const dp: number[][] = Array.from({ length: W + 1 }, () =>
          new Array(V + 1).fill(0),
        );
        for (let i = 0; i < n; i++) {
          for (let cw = W; cw >= w[i]; cw--) {
            for (let cv = V; cv >= u[i]; cv--) {
              const cand = dp[cw - w[i]][cv - u[i]] + val[i];
              if (cand > dp[cw][cv]) dp[cw][cv] = cand;
            }
          }
        }
        return String(dp[W][V]);
      },
      inputs: [
        '3 5 5\n2 3 4\n3 2 1\n4 5 6',
        '2 4 4\n2 2\n2 2\n3 4',
        '1 0 0\n1\n1\n9',
        '2 10 1\n5 5\n2 2\n7 8',
        '3 6 6\n2 2 2\n2 2 2\n1 1 1',
        '1 5 5\n5\n5\n10',
        '2 3 3\n2 2\n2 2\n5 5',
      ],
    },
  ],
};

export default course;

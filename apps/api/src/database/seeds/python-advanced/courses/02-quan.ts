import { CourseSpec } from '../../python-basic/types';

/**
 * Course PYTHON-ADV-02 — Cấp Quận (Tin học trẻ, mức trung bình).
 * Mục tiêu: luyện các kỹ thuật nền tảng cho thi đấu: sắp xếp (kèm tiêu chí),
 * đếm tần suất, sàng nguyên tố, UCLN/BCNN, đổi cơ số, tổng tiền tố (prefix sum),
 * hai con trỏ, tham lam đơn giản, dãy số, biến đổi chuỗi, bài toán ước số,
 * số học modulo.
 *
 * NOTE for authors: mirror the basic-course shape. Never hand-write expected
 * output — return it from `solve(input)`; the builder runs solve over inputs[]
 * to GENERATE outputs. First 3 inputs are visible samples. Output is ASCII only.
 * Python semantics: // = Math.floor, % only on non-negative operands, no floats,
 * parseInt(x, 10). Keep results within Number.MAX_SAFE_INTEGER.
 */

// ---- reusable helpers (Python-faithful integer semantics) ----
const toInt = (s: string) => parseInt(s.trim(), 10);
const firstLine = (input: string) => (input.split('\n')[0] ?? '').trim();
const lines = (input: string) => input.replace(/\n+$/, '').split('\n');
const readInts = (s: string): number[] =>
  (s ?? '')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
};

const course: CourseSpec = {
  code: 'PYTHON-ADV-02',
  title: 'Cấp Quận',
  description:
    'Luyện thi Tin học trẻ cấp quận: em sẽ rèn các kỹ thuật trung bình như sắp xếp ' +
    'theo tiêu chí, đếm tần suất, sàng nguyên tố, đổi cơ số, tổng tiền tố và tham lam!',
  tags: ['python', 'nang-cao', 'tin-hoc-tre', 'cap-quan'],
  problems: [
    {
      key: '01',
      title: 'Sắp xếp tăng dần',
      difficulty: 'EASY',
      story:
        'Cho một dãy số nguyên, hãy in ra dãy đã được sắp xếp theo thứ tự tăng dần.\n\n' +
        'Dòng 1 chứa `n` (1 <= n <= 1000). Dòng 2 chứa `n` số nguyên, mỗi số có trị tuyệt đối không quá 1000000.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra `n` số đã sắp xếp tăng dần, cách nhau một dấu cách, trên một dòng.',
      note: 'Có thể dùng hàm sorted() của Python.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        return arr.slice().sort((a, b) => a - b).join(' ');
      },
      inputs: [
        '5\n3 1 4 1 5',
        '1\n7',
        '4\n9 8 7 6',
        '6\n-1 -3 0 2 -2 1',
        '2\n5 5',
        '5\n1000000 -1000000 0 500 -500',
        '3\n2 2 2',
        '7\n7 6 5 4 3 2 1',
      ],
    },
    {
      key: '02',
      title: 'Sắp xếp giảm dần',
      difficulty: 'EASY',
      story:
        'Cho một dãy số nguyên, hãy in ra dãy đã được sắp xếp theo thứ tự giảm dần.\n\n' +
        'Dòng 1 chứa `n` (1 <= n <= 1000). Dòng 2 chứa `n` số nguyên, trị tuyệt đối không quá 1000000.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra `n` số đã sắp xếp giảm dần, cách nhau một dấu cách, trên một dòng.',
      note: 'Dùng sorted(a, reverse=True).',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        return arr.slice().sort((a, b) => b - a).join(' ');
      },
      inputs: [
        '5\n3 1 4 1 5',
        '1\n7',
        '4\n1 2 3 4',
        '6\n-1 -3 0 2 -2 1',
        '2\n5 5',
        '3\n100 100 100',
        '5\n-5 -4 -3 -2 -1',
        '7\n1 2 3 4 5 6 7',
      ],
    },
    {
      key: '03',
      title: 'Sắp xếp theo trị tuyệt đối',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy số nguyên, hãy sắp xếp tăng dần theo TRỊ TUYỆT ĐỐI của mỗi số. ' +
        'Nếu hai số có cùng trị tuyệt đối thì số nhỏ hơn (theo giá trị thật) đứng trước.\n\n' +
        'Dòng 1 chứa `n` (1 <= n <= 1000). Dòng 2 chứa `n` số nguyên, trị tuyệt đối không quá 1000000.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra `n` số đã sắp xếp theo tiêu chí trên, cách nhau một dấu cách.',
      note: 'Dùng sorted(a, key=lambda x: (abs(x), x)).',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        return arr
          .slice()
          .sort((a, b) => (Math.abs(a) - Math.abs(b)) || (a - b))
          .join(' ');
      },
      inputs: [
        '5\n-3 1 -1 2 3',
        '1\n-7',
        '4\n-2 2 -1 1',
        '6\n0 -5 5 -3 3 -1',
        '2\n-4 4',
        '3\n-10 -10 10',
        '5\n-1000000 1000000 0 1 -1',
        '4\n9 -9 8 -8',
      ],
    },
    {
      key: '04',
      title: 'Phần tử xuất hiện nhiều nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy số nguyên, hãy tìm phần tử xuất hiện nhiều lần nhất. ' +
        'Nếu có nhiều phần tử cùng số lần xuất hiện nhiều nhất, hãy in ra phần tử có giá trị NHỎ NHẤT trong số đó.\n\n' +
        'Dòng 1 chứa `n` (1 <= n <= 1000). Dòng 2 chứa `n` số nguyên, trị tuyệt đối không quá 1000000.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra phần tử có tần suất lớn nhất (nếu hòa, chọn giá trị nhỏ nhất).',
      note: 'Dùng từ điển đếm tần suất rồi chọn theo (tần suất giảm, giá trị tăng).',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        const cnt = new Map<number, number>();
        for (const v of arr) cnt.set(v, (cnt.get(v) ?? 0) + 1);
        let best = arr[0];
        let bestC = -1;
        for (const [v, c] of cnt) {
          if (c > bestC || (c === bestC && v < best)) {
            best = v;
            bestC = c;
          }
        }
        return String(best);
      },
      inputs: [
        '5\n1 2 2 3 3',
        '1\n7',
        '6\n4 4 4 1 1 9',
        '3\n5 5 5',
        '5\n-1 -1 2 2 2',
        '4\n10 20 30 40',
        '7\n3 3 1 1 2 2 2',
        '5\n-5 -5 -5 -2 -2',
      ],
    },
    {
      key: '05',
      title: 'Đếm tần suất theo thứ tự',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy số nguyên, hãy in ra mỗi giá trị phân biệt cùng số lần xuất hiện của nó, ' +
        'theo thứ tự GIÁ TRỊ tăng dần. Mỗi cặp in trên một dòng dạng `gia_tri so_lan`.\n\n' +
        'Dòng 1 chứa `n` (1 <= n <= 1000). Dòng 2 chứa `n` số nguyên, trị tuyệt đối không quá 1000000.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'Mỗi dòng một cặp `gia_tri so_lan`, sắp theo giá trị tăng dần.',
      note: 'Đếm bằng từ điển, rồi duyệt các khóa theo thứ tự tăng dần.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        const cnt = new Map<number, number>();
        for (const v of arr) cnt.set(v, (cnt.get(v) ?? 0) + 1);
        const keys = Array.from(cnt.keys()).sort((a, b) => a - b);
        return keys.map((k) => k + ' ' + cnt.get(k)).join('\n');
      },
      inputs: [
        '5\n1 2 2 3 3',
        '1\n7',
        '6\n3 1 2 1 3 1',
        '3\n5 5 5',
        '5\n-1 -2 -1 -2 0',
        '4\n10 10 20 20',
        '7\n4 4 4 4 4 4 4',
        '5\n100 1 100 1 50',
      ],
    },
    {
      key: '06',
      title: 'Đếm số nguyên tố bằng sàng',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 1000000), hãy đếm số lượng số nguyên tố không vượt quá `n`. ' +
        'Hãy dùng sàng Eratosthenes để chạy nhanh.',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In ra số lượng số nguyên tố trong khoảng từ 2 đến `n`.',
      note: 'Sàng Eratosthenes: đánh dấu bội của mỗi số nguyên tố là hợp số.',
      solve: (input) => {
        const n = toInt(input);
        if (n < 2) return '0';
        const sieve = new Uint8Array(n + 1);
        let c = 0;
        for (let i = 2; i <= n; i++) {
          if (sieve[i] === 0) {
            c++;
            for (let j = i * i; j <= n; j += i) sieve[j] = 1;
          }
        }
        return String(c);
      },
      inputs: ['10', '1', '2', '100', '1000', '7', '50', '1000000'],
    },
    {
      key: '07',
      title: 'Số nguyên tố trong đoạn',
      difficulty: 'MEDIUM',
      story:
        'Cho hai số `a` và `b` (1 <= a <= b <= 1000000) trên cùng một dòng, ' +
        'hãy đếm số lượng số nguyên tố nằm trong đoạn [a, b] (tính cả hai đầu mút).',
      inputDesc: 'Một dòng chứa hai số `a` và `b` cách nhau dấu cách.',
      outputDesc: 'In ra số lượng số nguyên tố trong đoạn [a, b].',
      note: 'Dựng sàng tới b, rồi đếm các số nguyên tố từ a tới b.',
      solve: (input) => {
        const [a, b] = readInts(firstLine(input));
        if (b < 2) return '0';
        const sieve = new Uint8Array(b + 1);
        sieve[0] = 1;
        sieve[1] = 1;
        for (let i = 2; i * i <= b; i++) {
          if (sieve[i] === 0) {
            for (let j = i * i; j <= b; j += i) sieve[j] = 1;
          }
        }
        let c = 0;
        const lo = a < 2 ? 2 : a;
        for (let i = lo; i <= b; i++) if (sieve[i] === 0) c++;
        return String(c);
      },
      inputs: ['1 10', '10 20', '2 2', '90 100', '1 1', '999000 1000000', '7 7', '14 16'],
    },
    {
      key: '08',
      title: 'UCLN và BCNN',
      difficulty: 'MEDIUM',
      story:
        'Cho hai số nguyên dương `a` và `b` (1 <= a, b <= 1000000) trên cùng một dòng, ' +
        'hãy in ra ước chung lớn nhất và bội chung nhỏ nhất của chúng. ' +
        '(BCNN luôn nằm trong giới hạn an toàn với dữ liệu cho.)',
      inputDesc: 'Một dòng chứa hai số `a` và `b` cách nhau dấu cách.',
      outputDesc: 'In ra hai số trên một dòng: UCLN rồi BCNN, cách nhau một dấu cách.',
      note: 'UCLN dùng Euclid; BCNN = a // UCLN * b.',
      solve: (input) => {
        const [a, b] = readInts(firstLine(input));
        const g = gcd(a, b);
        const l = (a / g) * b;
        return g + ' ' + l;
      },
      inputs: ['12 18', '7 1', '100 100', '4 6', '17 5', '1000 250', '13 13', '24 36'],
    },
    {
      key: '09',
      title: 'Đổi sang nhị phân',
      difficulty: 'MEDIUM',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000000), hãy in ra biểu diễn nhị phân của `n` ' +
        '(không có số 0 thừa ở đầu; với n = 0 thì in `0`).',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra chuỗi nhị phân biểu diễn `n`.',
      note: 'Lặp: lấy n % 2 làm bit cuối, rồi chia nguyên n cho 2.',
      solve: (input) => {
        let n = toInt(input);
        if (n === 0) return '0';
        let s = '';
        while (n > 0) {
          s = (n % 2) + s;
          n = Math.floor(n / 2);
        }
        return s;
      },
      inputs: ['10', '0', '1', '255', '1000000000', '2', '7', '1024'],
    },
    {
      key: '10',
      title: 'Đọc số nhị phân',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi nhị phân (chỉ gồm các ký tự `0` và `1`, độ dài từ 1 đến 30), ' +
        'hãy in ra giá trị thập phân tương ứng.',
      inputDesc: 'Một dòng chứa chuỗi nhị phân.',
      outputDesc: 'In ra số thập phân tương ứng với chuỗi nhị phân đó.',
      note: 'Duyệt từ trái sang phải: ket_qua = ket_qua * 2 + chu_so.',
      solve: (input) => {
        const s = firstLine(input);
        let v = 0;
        for (const ch of s) v = v * 2 + (ch === '1' ? 1 : 0);
        return String(v);
      },
      inputs: ['1010', '0', '1', '11111111', '111111111111111111111111111111', '10', '111', '10000000000'],
    },
    {
      key: '11',
      title: 'Tổng đoạn con (prefix sum)',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy `n` số nguyên và `q` câu hỏi. Mỗi câu hỏi cho hai vị trí `l` và `r` (1 <= l <= r <= n), ' +
        'hãy tính tổng các phần tử từ vị trí `l` tới `r` (tính cả hai đầu). Vị trí đánh số từ 1.\n\n' +
        'Dòng 1: `n` và `q` (1 <= n, q <= 1000). Dòng 2: `n` số nguyên (trị tuyệt đối <= 1000000). ' +
        'Tiếp theo `q` dòng, mỗi dòng hai số `l r`.',
      inputDesc: 'Dòng 1: `n q`. Dòng 2: `n` số nguyên. `q` dòng tiếp theo: mỗi dòng `l r`.',
      outputDesc: 'Với mỗi câu hỏi, in tổng đoạn [l, r] trên một dòng.',
      note: 'Tính mảng tổng tiền tố pre[i] = a[0]+...+a[i-1]; tổng đoạn = pre[r] - pre[l-1].',
      solve: (input) => {
        const ls = lines(input);
        const [n, q] = readInts(ls[0] ?? '');
        const arr = readInts(ls[1] ?? '');
        const pre = new Array(n + 1).fill(0);
        for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + arr[i];
        const out: string[] = [];
        for (let i = 0; i < q; i++) {
          const [l, r] = readInts(ls[2 + i] ?? '');
          out.push(String(pre[r] - pre[l - 1]));
        }
        return out.join('\n');
      },
      inputs: [
        '5 2\n1 2 3 4 5\n1 3\n2 5',
        '1 1\n7\n1 1',
        '4 3\n10 20 30 40\n1 4\n2 3\n1 1',
        '5 1\n-1 -2 -3 -4 -5\n1 5',
        '6 2\n1 1 1 1 1 1\n2 5\n1 6',
        '3 3\n100 -50 50\n1 1\n1 2\n1 3',
        '5 2\n2 4 6 8 10\n3 3\n1 5',
        '4 2\n-5 5 -5 5\n1 2\n3 4',
      ],
    },
    {
      key: '12',
      title: 'Hai con trỏ: cặp có tổng',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy số nguyên ĐÃ được sắp xếp tăng dần và một số `s`. ' +
        'Hãy cho biết có tồn tại hai phần tử ở HAI VỊ TRÍ khác nhau có tổng đúng bằng `s` hay không. ' +
        'Hãy dùng kỹ thuật hai con trỏ.\n\n' +
        'Dòng 1: `n` và `s` (1 <= n <= 100000). Dòng 2: `n` số nguyên tăng dần, trị tuyệt đối <= 1000000.',
      inputDesc: 'Dòng 1: `n s`. Dòng 2: `n` số nguyên tăng dần.',
      outputDesc: 'In `YES` nếu tồn tại cặp có tổng bằng `s`, ngược lại in `NO`.',
      note: 'Một con trỏ ở đầu, một ở cuối; tổng nhỏ thì tiến trái, tổng lớn thì lùi phải.',
      solve: (input) => {
        const ls = lines(input);
        const [, s] = readInts(ls[0] ?? '');
        const arr = readInts(ls[1] ?? '');
        let i = 0;
        let j = arr.length - 1;
        while (i < j) {
          const sum = arr[i] + arr[j];
          if (sum === s) return 'YES';
          if (sum < s) i++;
          else j--;
        }
        return 'NO';
      },
      inputs: [
        '5 6\n1 2 3 4 5',
        '4 10\n1 2 3 4',
        '1 5\n5',
        '5 8\n2 2 2 2 2',
        '6 0\n-3 -1 0 1 2 3',
        '5 100\n10 20 30 40 50',
        '3 7\n3 4 5',
        '2 -3\n-2 -1',
      ],
    },
    {
      key: '13',
      title: 'Tham lam: chọn nhiều việc nhất',
      difficulty: 'HARD',
      story:
        'Có `n` công việc, mỗi việc có thời điểm bắt đầu `s` và kết thúc `f`. ' +
        'Một người chỉ làm được một việc tại một thời điểm; việc tiếp theo phải bắt đầu KHÔNG SỚM HƠN ' +
        'thời điểm kết thúc của việc trước (cho phép bằng). Hãy chọn được nhiều việc nhất.\n\n' +
        'Dòng 1: `n` (1 <= n <= 100000). Mỗi dòng trong `n` dòng tiếp theo: hai số `s f` (0 <= s < f <= 1000000000).',
      inputDesc: 'Dòng 1: `n`. `n` dòng tiếp theo: mỗi dòng `s f`.',
      outputDesc: 'In ra số công việc tối đa có thể làm.',
      note: 'Tham lam: sắp các việc theo thời điểm kết thúc tăng dần, lần lượt chọn việc đầu tiên không trùng.',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0] ?? '');
        const jobs: [number, number][] = [];
        for (let i = 0; i < n; i++) {
          const [s, f] = readInts(ls[1 + i] ?? '');
          jobs.push([s, f]);
        }
        jobs.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        let count = 0;
        let cur = -Infinity;
        for (const [s, f] of jobs) {
          if (s >= cur) {
            count++;
            cur = f;
          }
        }
        return String(count);
      },
      inputs: [
        '3\n1 3\n2 5\n4 6',
        '1\n0 10',
        '4\n1 2\n2 3\n3 4\n1 4',
        '3\n0 5\n0 5\n0 5',
        '5\n1 2\n1 2\n1 2\n3 4\n3 4',
        '4\n0 1000000000\n1 2\n3 4\n5 6',
        '2\n5 10\n10 15',
        '6\n1 4\n3 5\n0 6\n5 7\n3 9\n6 10',
      ],
    },
    {
      key: '14',
      title: 'Đổi tiền ít tờ nhất',
      difficulty: 'HARD',
      story:
        'Cho một bộ mệnh giá tiền và một số tiền `m` cần trả đúng. ' +
        'Hãy dùng ít tờ tiền nhất để trả đủ `m`. Mỗi mệnh giá có thể dùng nhiều lần. ' +
        'Bộ mệnh giá luôn chứa giá trị 1 nên luôn trả được.\n\n' +
        'Dòng 1: `k` và `m` (1 <= k <= 20, 0 <= m <= 1000000). Dòng 2: `k` mệnh giá phân biệt (1 <= mỗi mệnh giá <= 1000000).',
      inputDesc: 'Dòng 1: `k m`. Dòng 2: `k` mệnh giá cách nhau dấu cách.',
      outputDesc: 'In ra số tờ tiền ít nhất để trả đúng số tiền `m`.',
      note: 'Quy hoạch động: dp[x] = số tờ ít nhất để trả x = min(dp[x - coin] + 1).',
      solve: (input) => {
        const ls = lines(input);
        const [, m] = readInts(ls[0] ?? '');
        const coins = readInts(ls[1] ?? '');
        const INF = Infinity;
        const dp = new Array(m + 1).fill(INF);
        dp[0] = 0;
        for (let x = 1; x <= m; x++) {
          for (const c of coins) {
            if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
          }
        }
        return String(dp[m]);
      },
      inputs: [
        '3 11\n1 2 5',
        '1 0\n1',
        '3 6\n1 3 4',
        '4 27\n1 5 10 25',
        '2 7\n1 2',
        '3 100\n1 10 50',
        '4 30\n1 3 9 27',
        '3 1\n1 5 10',
      ],
    },
    {
      key: '15',
      title: 'Số hạng thứ n của dãy',
      difficulty: 'MEDIUM',
      story:
        'Xét dãy số được định nghĩa: a(1) = 1, a(2) = 2, và với k >= 3 thì a(k) = a(k-1) + 2*a(k-2). ' +
        'Cho `n` (1 <= n <= 40), hãy in ra số hạng thứ `n`. (Giới hạn n <= 40 để kết quả an toàn.)',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 40).',
      outputDesc: 'In ra giá trị a(n).',
      note: 'Dùng hai biến lưu hai số hạng trước, lặp để tính dần.',
      solve: (input) => {
        const n = toInt(input);
        if (n === 1) return '1';
        if (n === 2) return '2';
        let a = 1;
        let b = 2;
        for (let k = 3; k <= n; k++) {
          const c = b + 2 * a;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: ['1', '2', '3', '5', '10', '40', '7', '20'],
    },
    {
      key: '16',
      title: 'Mã hóa độ dài loạt (RLE)',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi chỉ gồm các chữ cái thường (a-z), hãy nén bằng cách thay mỗi đoạn liên tiếp cùng ký tự ' +
        'bằng `ký_tự + số_lần`. Ví dụ `aaabbc` thành `a3b2c1`.',
      inputDesc: 'Một dòng chứa chuỗi gồm các chữ cái thường, độ dài từ 1 đến 100000.',
      outputDesc: 'In ra chuỗi đã nén theo quy tắc trên, trên một dòng.',
      note: 'Duyệt chuỗi, đếm số lần lặp liên tiếp của mỗi ký tự.',
      solve: (input) => {
        const s = firstLine(input);
        let out = '';
        let i = 0;
        while (i < s.length) {
          let j = i;
          while (j < s.length && s[j] === s[i]) j++;
          out += s[i] + String(j - i);
          i = j;
        }
        return out;
      },
      inputs: ['aaabbc', 'a', 'abcabc', 'zzzzz', 'aabbaabb', 'q', 'mmmmmmmmmm', 'abcd'],
    },
    {
      key: '17',
      title: 'Kiểm tra đảo chữ (anagram)',
      difficulty: 'MEDIUM',
      story:
        'Cho hai chuỗi chỉ gồm chữ cái thường (a-z), hãy kiểm tra chúng có phải là đảo chữ của nhau không ' +
        '(cùng tập ký tự với cùng số lần xuất hiện, chỉ khác thứ tự).\n\n' +
        'Dòng 1: chuỗi thứ nhất. Dòng 2: chuỗi thứ hai. Mỗi chuỗi dài từ 1 đến 100000.',
      inputDesc: 'Dòng 1: chuỗi A. Dòng 2: chuỗi B.',
      outputDesc: 'In `YES` nếu hai chuỗi là đảo chữ của nhau, ngược lại in `NO`.',
      note: 'Đếm tần suất từng chữ cái của hai chuỗi rồi so sánh.',
      solve: (input) => {
        const ls = lines(input);
        const a = (ls[0] ?? '').trim();
        const b = (ls[1] ?? '').trim();
        if (a.length !== b.length) return 'NO';
        const cnt = new Array(26).fill(0);
        for (const ch of a) cnt[ch.charCodeAt(0) - 97]++;
        for (const ch of b) cnt[ch.charCodeAt(0) - 97]--;
        return cnt.every((v) => v === 0) ? 'YES' : 'NO';
      },
      inputs: [
        'listen\nsilent',
        'hello\nworld',
        'a\na',
        'abc\ncba',
        'aabb\nbbaa',
        'abc\nabcd',
        'rat\ncar',
        'aaaa\naaaa',
      ],
    },
    {
      key: '18',
      title: 'Đếm ước số chung',
      difficulty: 'MEDIUM',
      story:
        'Cho hai số nguyên dương `a` và `b` (1 <= a, b <= 1000000), ' +
        'hãy đếm số lượng ước số chung dương của chúng (các số chia hết cả `a` và `b`).',
      inputDesc: 'Một dòng chứa hai số `a` và `b` cách nhau dấu cách.',
      outputDesc: 'In ra số lượng ước chung dương của `a` và `b`.',
      note: 'Ước chung của a và b chính là ước của UCLN(a, b); đếm ước của UCLN.',
      solve: (input) => {
        const [a, b] = readInts(firstLine(input));
        const g = gcd(a, b);
        let c = 0;
        for (let i = 1; i * i <= g; i++) {
          if (g % i === 0) {
            c++;
            if (g / i !== i) c++;
          }
        }
        return String(c);
      },
      inputs: ['12 18', '7 1', '100 100', '17 5', '36 24', '1000000 500000', '13 26', '48 60'],
    },
    {
      key: '19',
      title: 'Lũy thừa modulo',
      difficulty: 'MEDIUM',
      story:
        'Cho ba số nguyên `a`, `b`, `m` (0 <= a <= 1000000, 0 <= b <= 1000000000, 1 <= m <= 1000000) ' +
        'trên cùng một dòng, hãy tính `(a^b) mod m`. Quy ước `0^0 mod m = 1 mod m`.',
      inputDesc: 'Một dòng chứa ba số `a`, `b`, `m` cách nhau dấu cách.',
      outputDesc: 'In ra giá trị `(a^b) mod m`.',
      note: 'Dùng lũy thừa nhanh (bình phương liên tiếp), luôn lấy modulo để không tràn số.',
      solve: (input) => {
        let [a, b, m] = readInts(firstLine(input));
        let result = 1 % m;
        let base = a % m;
        while (b > 0) {
          if (b % 2 === 1) result = (result * base) % m;
          base = (base * base) % m;
          b = Math.floor(b / 2);
        }
        return String(result);
      },
      inputs: [
        '2 10 1000',
        '0 0 7',
        '5 3 13',
        '7 0 100',
        '3 1000000000 1000000',
        '10 5 1',
        '2 30 1000003',
        '999 2 1000000',
      ],
    },
    {
      key: '20',
      title: 'Sắp xếp học sinh theo điểm',
      difficulty: 'HARD',
      story:
        'Có `n` học sinh, mỗi học sinh có một mã số (số nguyên) và một điểm (số nguyên). ' +
        'Hãy in danh sách mã số sắp theo điểm GIẢM DẦN; nếu hai học sinh cùng điểm thì học sinh có ' +
        'mã số NHỎ HƠN đứng trước.\n\n' +
        'Dòng 1: `n` (1 <= n <= 100000). Mỗi dòng trong `n` dòng tiếp theo: hai số `ma_so diem` ' +
        '(0 <= ma_so <= 1000000, 0 <= diem <= 1000000).',
      inputDesc: 'Dòng 1: `n`. `n` dòng tiếp theo: mỗi dòng `ma_so diem`.',
      outputDesc: 'In ra `n` mã số đã sắp theo tiêu chí trên, cách nhau một dấu cách, trên một dòng.',
      note: 'Dùng sorted với key=lambda x: (-diem, ma_so).',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0] ?? '');
        const st: [number, number][] = [];
        for (let i = 0; i < n; i++) {
          const [id, sc] = readInts(ls[1 + i] ?? '');
          st.push([id, sc]);
        }
        st.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
        return st.map((x) => x[0]).join(' ');
      },
      inputs: [
        '3\n1 90\n2 85\n3 90',
        '1\n5 100',
        '4\n10 50\n20 50\n30 70\n40 60',
        '2\n100 0\n50 0',
        '5\n1 10\n2 20\n3 30\n4 20\n5 10',
        '3\n7 100\n8 100\n9 100',
        '4\n1000000 1\n0 1\n500000 2\n1 2',
        '5\n5 5\n4 4\n3 3\n2 2\n1 1',
      ],
    },
  ],
};

export default course;

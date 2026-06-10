import { CourseSpec } from '../../python-basic/types';

/**
 * Course PYTHON-ADV-01 — Cấp Phường (ward level).
 * Bậc dễ nhất của chương trình luyện thi Tin học trẻ: các bài toán nền tảng
 * về xử lý mảng, thao tác chữ số, số học cơ bản, đếm/tần suất, quét chuỗi,
 * dãy số đơn giản, tham lam và mô phỏng đơn giản.
 *
 * NOTE for authors: mirror the python-basic shape. Never hand-write an expected
 * output — return it from `solve(input)`. The first 3 inputs become visible
 * samples. Outputs are ASCII only (numbers, YES/NO, space-separated lists).
 * All results stay within Number.MAX_SAFE_INTEGER; input sizes are bounded so
 * sums/products never overflow.
 */

// ---- small reusable helpers (Python-faithful integer semantics) ----
const toInt = (s: string) => parseInt(s.trim(), 10);
const firstLine = (input: string) => (input.split('\n')[0] ?? '').trim();
const lines = (input: string) => input.replace(/\n+$/, '').split('\n');
const readInts = (s: string): number[] =>
  s
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const digitSum = (n: number): number => {
  // n >= 0
  let s = 0;
  while (n > 0) {
    s += n % 10;
    n = Math.floor(n / 10);
  }
  return s;
};

const reverseDigits = (n: number): number => {
  // n >= 0
  let r = 0;
  while (n > 0) {
    r = r * 10 + (n % 10);
    n = Math.floor(n / 10);
  }
  return r;
};

const course: CourseSpec = {
  code: 'PYTHON-ADV-01',
  title: 'Cấp Phường',
  description:
    'Khóa nền tảng luyện thi Tin học trẻ cấp phường/xã: em sẽ làm quen các bài ' +
    'toán nhỏ về mảng, chữ số, số học và mô phỏng để vững bước vào kỳ thi!',
  tags: ['python', 'nang-cao', 'tin-hoc-tre', 'cap-phuong'],
  problems: [
    {
      key: '01',
      title: 'Tổng dãy số',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên (1 <= n <= 1000, mỗi số có trị tuyệt đối <= 1000000), ' +
        'hãy tính tổng của tất cả các số trong dãy.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra một số nguyên là tổng của dãy.',
      note: 'Khởi tạo biến tổng bằng 0 rồi cộng dần từng phần tử khi duyệt.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        let s = 0;
        for (const v of arr) s += v;
        return String(s);
      },
      inputs: [
        '5\n1 2 3 4 5',
        '1\n7',
        '3\n10 20 30',
        '4\n-1 -2 -3 -4',
        '6\n0 0 0 0 0 0',
        '2\n1000000 1000000',
        '5\n-5 5 -5 5 -5',
        '3\n100 200 300',
      ],
    },
    {
      key: '02',
      title: 'Đếm số dương',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên (1 <= n <= 1000), hãy đếm xem có bao nhiêu số dương (lớn hơn 0).\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra số lượng số dương trong dãy.',
      note: 'Số 0 không phải số dương. Dùng điều kiện v > 0 để đếm.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        let c = 0;
        for (const v of arr) if (v > 0) c++;
        return String(c);
      },
      inputs: [
        '5\n1 -2 3 -4 5',
        '1\n0',
        '3\n-1 -2 -3',
        '4\n1 2 3 4',
        '6\n0 0 1 0 0 1',
        '2\n-100 100',
        '5\n0 0 0 0 0',
        '3\n7 0 -7',
      ],
    },
    {
      key: '03',
      title: 'Lớn nhất trong dãy',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên (1 <= n <= 1000), hãy tìm số lớn nhất trong dãy.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra giá trị lớn nhất của dãy.',
      note: 'Khởi tạo max bằng phần tử đầu rồi cập nhật khi gặp phần tử lớn hơn.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        let mx = arr[0];
        for (const v of arr) if (v > mx) mx = v;
        return String(mx);
      },
      inputs: [
        '5\n3 1 4 1 5',
        '1\n7',
        '3\n-2 -5 -1',
        '4\n10 10 10 10',
        '6\n9 8 7 6 5 4',
        '2\n-100 100',
        '5\n0 0 0 0 1',
        '3\n5 3 8',
      ],
    },
    {
      key: '04',
      title: 'Tổng các chữ số',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000), hãy tính tổng các chữ số của nó. ' +
        'Ví dụ 1234 có tổng chữ số là 10.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra tổng các chữ số của `n`.',
      note: 'Lấy chữ số cuối bằng n % 10, rồi chia n cho 10 (lấy phần nguyên) cho tới khi n = 0.',
      solve: (input) => {
        const n = toInt(input);
        if (n === 0) return '0';
        return String(digitSum(n));
      },
      inputs: ['1234', '0', '9', '1000', '999999', '7', '505', '1000000'],
    },
    {
      key: '05',
      title: 'Chẵn hay lẻ',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên `n` (trị tuyệt đối <= 1000000), hãy cho biết `n` là số chẵn hay số lẻ.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `CHAN` nếu `n` chẵn, ngược lại in `LE`.',
      note: 'Số chẵn chia hết cho 2. Với số âm, dùng ((n % 2) + 2) % 2 để tránh sai dấu.',
      solve: (input) => {
        const n = toInt(input);
        return ((n % 2) + 2) % 2 === 0 ? 'CHAN' : 'LE';
      },
      inputs: ['4', '7', '0', '-3', '-8', '1000000', '999999', '1'],
    },
    {
      key: '06',
      title: 'Đảo ngược chữ số',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000), hãy in ra số nhận được khi viết các chữ số theo thứ tự ngược lại. ' +
        'Ví dụ 1230 đảo lại thành 321.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra số sau khi đảo ngược các chữ số (bỏ số 0 ở đầu kết quả).',
      note: 'Lặp: lấy chữ số cuối n % 10, ghép dần vào kết quả r = r * 10 + chữ số.',
      solve: (input) => String(reverseDigits(toInt(input))),
      inputs: ['123', '1230', '0', '7', '1000', '90909', '100', '54321'],
    },
    {
      key: '07',
      title: 'Kiểm tra số nguyên tố',
      difficulty: 'EASY',
      story:
        'Số nguyên tố là số lớn hơn 1 và chỉ chia hết cho 1 và chính nó. ' +
        'Cho một số nguyên `n` (0 <= n <= 1000000), hãy cho biết `n` có phải số nguyên tố không.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `YES` nếu `n` là số nguyên tố, ngược lại in `NO`.',
      note: 'Chỉ cần kiểm tra các ước từ 2 tới căn bậc hai của n.',
      solve: (input) => (isPrime(toInt(input)) ? 'YES' : 'NO'),
      inputs: ['7', '1', '2', '4', '97', '0', '9973', '1'],
    },
    {
      key: '08',
      title: 'Đếm số chia hết cho k',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên không âm và một số nguyên dương `k` (1 <= n <= 1000, 1 <= k <= 1000), ' +
        'hãy đếm xem trong dãy có bao nhiêu số chia hết cho `k`.\n\n' +
        'Dòng 1 chứa `n` và `k`. Dòng 2 chứa `n` số nguyên không âm.',
      inputDesc: 'Dòng 1: hai số `n` và `k`. Dòng 2: `n` số nguyên không âm cách nhau dấu cách.',
      outputDesc: 'In ra số lượng phần tử chia hết cho `k`.',
      note: 'Một số chia hết cho k khi phần dư của phép chia bằng 0 (v % k === 0).',
      solve: (input) => {
        const ls = lines(input);
        const k = readInts(ls[0] ?? '')[1];
        const arr = readInts(ls[1] ?? '');
        let c = 0;
        for (const v of arr) if (v % k === 0) c++;
        return String(c);
      },
      inputs: [
        '5 2\n1 2 3 4 5',
        '4 3\n3 6 9 10',
        '1 5\n5',
        '6 1\n1 2 3 4 5 6',
        '5 10\n1 2 3 4 5',
        '3 7\n0 7 14',
        '4 2\n1 3 5 7',
        '5 100\n100 200 250 300 99',
      ],
    },
    {
      key: '09',
      title: 'Đếm chữ số chẵn',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000), hãy đếm xem `n` có bao nhiêu chữ số chẵn ' +
        '(các chữ số 0, 2, 4, 6, 8). Lưu ý: số 0 có một chữ số và đó là chữ số chẵn.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra số lượng chữ số chẵn của `n`.',
      note: 'Tách từng chữ số bằng n % 10, kiểm tra chữ số đó có chia hết cho 2 không.',
      solve: (input) => {
        let n = toInt(input);
        let c = 0;
        if (n === 0) return '1';
        while (n > 0) {
          const d = n % 10;
          if (d % 2 === 0) c++;
          n = Math.floor(n / 10);
        }
        return String(c);
      },
      inputs: ['1234', '0', '2468', '13579', '1000000', '7', '20', '888'],
    },
    {
      key: '10',
      title: 'Đếm xuất hiện',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên và một số `x` (1 <= n <= 1000), hãy đếm xem `x` xuất hiện bao nhiêu lần trong dãy.\n\n' +
        'Dòng 1 chứa `n` và `x`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `x`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra số lần `x` xuất hiện trong dãy.',
      note: 'Duyệt qua dãy, mỗi lần gặp phần tử bằng x thì tăng bộ đếm.',
      solve: (input) => {
        const ls = lines(input);
        const x = readInts(ls[0] ?? '')[1];
        const arr = readInts(ls[1] ?? '');
        let c = 0;
        for (const v of arr) if (v === x) c++;
        return String(c);
      },
      inputs: [
        '5 1\n1 2 1 3 1',
        '4 9\n1 2 3 4',
        '1 7\n7',
        '5 5\n5 5 5 5 5',
        '6 0\n-1 0 1 0 0 2',
        '3 -2\n-2 -2 -1',
        '4 100\n10 20 30 40',
        '5 3\n3 1 3 1 3',
      ],
    },
    {
      key: '11',
      title: 'Tìm kiếm vị trí',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên và một số cần tìm `x`, hãy in ra vị trí (đánh số từ 1) đầu tiên mà `x` xuất hiện. ' +
        'Nếu `x` không có trong dãy thì in `-1`.\n\n' +
        'Dòng 1 chứa `n` và `x`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `x`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra vị trí 1-based đầu tiên của `x`, hoặc `-1` nếu không tìm thấy.',
      note: 'Trả vị trí ngay khi tìm thấy lần đầu, không cần duyệt tiếp.',
      solve: (input) => {
        const ls = lines(input);
        const x = readInts(ls[0] ?? '')[1];
        const arr = readInts(ls[1] ?? '');
        const idx = arr.indexOf(x);
        return String(idx === -1 ? -1 : idx + 1);
      },
      inputs: [
        '5 3\n1 2 3 4 5',
        '4 9\n1 2 3 4',
        '1 7\n7',
        '5 2\n2 2 2 2 2',
        '6 6\n6 5 4 3 2 1',
        '5 12\n2 4 6 10 12',
        '3 -5\n5 -5 5',
        '4 100\n10 20 30 40',
      ],
    },
    {
      key: '12',
      title: 'Dãy Fibonacci',
      difficulty: 'EASY',
      story:
        'Dãy Fibonacci: F(1) = 1, F(2) = 1, F(k) = F(k-1) + F(k-2). ' +
        'Cho `n` (1 <= n <= 40), hãy in ra `n` số Fibonacci đầu tiên trên một dòng, cách nhau dấu cách. ' +
        '(Giới hạn n <= 40 để các số không quá lớn.)',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 40).',
      outputDesc: 'In ra `n` số Fibonacci đầu tiên, cách nhau dấu cách, trên một dòng.',
      note: 'Dùng hai biến lưu hai số liền trước, lặp để sinh số tiếp theo.',
      solve: (input) => {
        const n = toInt(input);
        const res: number[] = [];
        let a = 1;
        let b = 1;
        for (let i = 1; i <= n; i++) {
          res.push(a);
          const c = a + b;
          a = b;
          b = c;
        }
        return res.join(' ');
      },
      inputs: ['5', '1', '2', '10', '40', '3', '7', '20'],
    },
    {
      key: '13',
      title: 'Đổi tiền tham lam',
      difficulty: 'MEDIUM',
      story:
        'Em có các loại tiền mệnh giá 50000, 20000, 10000, 5000, 2000, 1000 (đồng). ' +
        'Cho số tiền `m` là bội của 1000 (0 <= m <= 100000000), hãy cho biết cần ít nhất bao nhiêu tờ tiền để trả đủ ' +
        'số tiền đó (ưu tiên dùng mệnh giá lớn trước).',
      inputDesc: 'Một số nguyên `m` (là bội của 1000).',
      outputDesc: 'In ra số tờ tiền ít nhất cần dùng.',
      note: 'Tham lam: liên tục dùng mệnh giá lớn nhất còn dùng được, lấy m chia mệnh giá rồi giữ phần dư.',
      solve: (input) => {
        let m = toInt(input);
        const coins = [50000, 20000, 10000, 5000, 2000, 1000];
        let cnt = 0;
        for (const c of coins) {
          cnt += Math.floor(m / c);
          m = m % c;
        }
        return String(cnt);
      },
      inputs: ['90000', '0', '1000', '50000', '78000', '100000000', '37000', '5000'],
    },
    {
      key: '14',
      title: 'Tổng số lớn hơn ngưỡng',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm `n` số nguyên và một ngưỡng `t` (1 <= n <= 1000), ' +
        'hãy tính tổng các phần tử lớn hơn `t`. Nếu không có phần tử nào thỏa mãn thì tổng là 0.\n\n' +
        'Dòng 1 chứa `n` và `t`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `t`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra tổng các phần tử lớn hơn `t`.',
      note: 'Duyệt dãy, chỉ cộng những phần tử thỏa điều kiện v > t.',
      solve: (input) => {
        const ls = lines(input);
        const t = readInts(ls[0] ?? '')[1];
        const arr = readInts(ls[1] ?? '');
        let s = 0;
        for (const v of arr) if (v > t) s += v;
        return String(s);
      },
      inputs: [
        '5 2\n1 2 3 4 5',
        '4 10\n1 2 3 4',
        '1 0\n7',
        '5 5\n5 5 5 5 5',
        '6 0\n-1 -2 1 2 -3 3',
        '3 100\n50 150 250',
        '4 -5\n-10 -3 -1 -8',
        '5 3\n3 3 4 4 5',
      ],
    },
    {
      key: '15',
      title: 'Đếm nguyên âm',
      difficulty: 'EASY',
      story:
        'Cho một dòng văn bản chỉ gồm các chữ cái thường a-z và dấu cách, ' +
        'hãy đếm xem có bao nhiêu nguyên âm (các chữ cái a, e, i, o, u). Độ dài dòng <= 1000.',
      inputDesc: 'Một dòng văn bản gồm chữ thường và dấu cách.',
      outputDesc: 'In ra số lượng nguyên âm trong dòng.',
      note: 'Duyệt từng ký tự, kiểm tra nó có nằm trong tập {a, e, i, o, u} không.',
      solve: (input) => {
        const s = firstLine(input);
        const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
        let c = 0;
        for (const ch of s) if (vowels.has(ch)) c++;
        return String(c);
      },
      inputs: [
        'hello world',
        'xyz',
        'aeiou',
        'lap trinh that vui',
        'b',
        'a e i o u a e i o u',
        'python',
        'tin hoc tre',
      ],
    },
    {
      key: '16',
      title: 'Đếm từ',
      difficulty: 'EASY',
      story:
        'Cho một dòng văn bản gồm các từ cách nhau bởi một hoặc nhiều dấu cách (độ dài <= 1000), ' +
        'hãy đếm xem dòng đó có bao nhiêu từ. Dòng có thể rỗng (không có từ nào).',
      inputDesc: 'Một dòng văn bản.',
      outputDesc: 'In ra số lượng từ trong dòng.',
      note: 'Tách dòng theo dấu cách, bỏ các phần rỗng rồi đếm số phần còn lại.',
      solve: (input) => {
        const s = firstLine(input);
        const words = s.split(/\s+/).filter((w) => w.length > 0);
        return String(words.length);
      },
      inputs: [
        'lap trinh that vui',
        'python',
        'a b c d e',
        'tin   hoc    tre',
        'mot',
        'hoc sinh gioi tin hoc',
        'xin chao cac ban',
        'cap phuong',
      ],
    },
    {
      key: '17',
      title: 'Số đối xứng',
      difficulty: 'EASY',
      story:
        'Số đối xứng (palindrome) là số đọc xuôi và đọc ngược đều giống nhau, ví dụ 121, 1331. ' +
        'Cho số nguyên không âm `n` (0 <= n <= 1000000), hãy kiểm tra `n` có đối xứng không.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `YES` nếu `n` đối xứng, ngược lại in `NO`.',
      note: 'Đảo ngược các chữ số rồi so sánh với số ban đầu.',
      solve: (input) => {
        const n = toInt(input);
        return reverseDigits(n) === n ? 'YES' : 'NO';
      },
      inputs: ['121', '123', '7', '1331', '10', '0', '12321', '1000'],
    },
    {
      key: '18',
      title: 'Giá trị xuất hiện nhiều nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm `n` số nguyên không âm (1 <= n <= 1000, mỗi số <= 1000000), ' +
        'hãy tìm giá trị xuất hiện nhiều lần nhất. Nếu có nhiều giá trị cùng số lần xuất hiện lớn nhất, ' +
        'hãy in giá trị nhỏ nhất trong số đó.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên không âm.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên không âm cách nhau dấu cách.',
      outputDesc: 'In ra giá trị xuất hiện nhiều nhất (nếu hòa, chọn giá trị nhỏ nhất).',
      note: 'Dùng bảng tần suất (dictionary). Duyệt qua các giá trị để chọn giá trị có tần suất lớn nhất, ưu tiên giá trị nhỏ hơn khi hòa.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        const freq = new Map<number, number>();
        for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
        let best = arr[0];
        let bestCount = -1;
        for (const [val, cnt] of freq) {
          if (cnt > bestCount || (cnt === bestCount && val < best)) {
            best = val;
            bestCount = cnt;
          }
        }
        return String(best);
      },
      inputs: [
        '5\n1 2 1 3 1',
        '1\n7',
        '4\n2 2 3 3',
        '6\n5 5 5 1 1 1',
        '3\n9 8 7',
        '5\n0 0 0 0 0',
        '7\n4 4 2 2 2 4 9',
        '4\n100 100 50 50',
      ],
    },
    {
      key: '19',
      title: 'Mô phỏng nhiệt độ',
      difficulty: 'MEDIUM',
      story:
        'Một bình nước bắt đầu ở nhiệt độ 0 độ. Em thực hiện `n` thao tác (1 <= n <= 1000), ' +
        'mỗi thao tác là một số nguyên: số dương nghĩa là tăng nhiệt độ thêm bấy nhiêu, số âm nghĩa là giảm. ' +
        'Tuy nhiên nhiệt độ không bao giờ xuống dưới 0 (nếu phép giảm làm âm thì nhiệt độ chỉ về 0). ' +
        'Hãy in ra nhiệt độ cuối cùng.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên (mỗi số có trị tuyệt đối <= 1000).',
      inputDesc: 'Dòng 1: số lượng thao tác `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra nhiệt độ cuối cùng (luôn >= 0).',
      note: 'Mô phỏng từng bước: cộng giá trị vào nhiệt độ, nếu kết quả nhỏ hơn 0 thì gán lại bằng 0.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        let temp = 0;
        for (const v of arr) {
          temp += v;
          if (temp < 0) temp = 0;
        }
        return String(temp);
      },
      inputs: [
        '3\n10 -5 20',
        '1\n5',
        '3\n-5 -5 -5',
        '4\n10 -100 5 5',
        '2\n0 0',
        '5\n1 1 1 1 1',
        '4\n100 -50 -50 -50',
        '3\n-1 2 -1',
      ],
    },
    {
      key: '20',
      title: 'Khoảng cách lớn nhất giữa hai số kề',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm `n` số nguyên (2 <= n <= 1000), hãy tìm khoảng cách lớn nhất giữa hai phần tử ' +
        'liền kề nhau, tức là giá trị lớn nhất của trị tuyệt đối hiệu hai số đứng cạnh nhau.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n` (n >= 2). Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra khoảng cách lớn nhất giữa hai phần tử liền kề.',
      note: 'Duyệt từ phần tử thứ 2, tính |arr[i] - arr[i-1]| và giữ giá trị lớn nhất.',
      solve: (input) => {
        const arr = readInts(lines(input)[1] ?? '');
        let mx = 0;
        for (let i = 1; i < arr.length; i++) {
          const d = Math.abs(arr[i] - arr[i - 1]);
          if (d > mx) mx = d;
        }
        return String(mx);
      },
      inputs: [
        '5\n1 5 2 8 3',
        '2\n3 3',
        '3\n1 2 3',
        '4\n10 1 10 1',
        '2\n-100 100',
        '5\n0 0 0 0 0',
        '6\n1 2 4 7 11 16',
        '3\n-5 -1 -10',
      ],
    },
  ],
};

export default course;

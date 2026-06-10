import { CourseSpec } from '../types';

/**
 * Course 11 — Thuật toán cơ bản.
 * Mục tiêu: kết hợp vòng lặp và câu lệnh điều kiện để giải các bài toán nền tảng:
 * kiểm tra số nguyên tố, đếm, tìm kiếm, sắp xếp, ước số, số đối xứng...
 *
 * NOTE for authors: mirror this exact shape. Never write an expected output by
 * hand — return it from `solve(input)`. The first 3 inputs become visible
 * samples. Outputs are ASCII only (numbers, YES/NO). All results stay within
 * JS safe integers (Fibonacci n<=40, factorial n<=18, etc.).
 */

// ---- small reusable helpers (Python-faithful integer semantics) ----
const toInt = (s: string) => parseInt(s.trim(), 10);
const firstLine = (input: string) => (input.split('\n')[0] ?? '').trim();
const readInts = (input: string): number[] =>
  input
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

const sumOfDivisors = (n: number): number => {
  // sum of all positive divisors of n (n >= 1)
  let s = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      s += i;
      const j = n / i;
      if (j !== i) s += j;
    }
  }
  return s;
};

const countDivisors = (n: number): number => {
  let c = 0;
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      c += 1;
      if (n / i !== i) c += 1;
    }
  }
  return c;
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

const isPalindromeNumber = (n: number): boolean => n === reverseDigits(n);

const digitSum = (n: number): number => {
  // n >= 0
  let s = 0;
  while (n > 0) {
    s += n % 10;
    n = Math.floor(n / 10);
  }
  return s;
};

const course: CourseSpec = {
  code: 'PYTHON-BASIC-11',
  title: 'Thuật toán cơ bản',
  description:
    'Khóa học về các thuật toán nền tảng: tìm kiếm, đếm, sắp xếp và kiểm tra. ' +
    'Em sẽ kết hợp vòng lặp với câu lệnh điều kiện để giải nhiều bài toán thú vị!',
  tags: ['python', 'co-ban', 'thuat-toan', 'algorithm'],
  problems: [
    {
      key: '01',
      title: 'Kiểm tra số nguyên tố',
      difficulty: 'MEDIUM',
      story:
        'Số nguyên tố là số lớn hơn 1 và chỉ chia hết cho 1 và chính nó. Cho một số nguyên `n` ' +
        '(1 <= n <= 1000000), hãy cho biết `n` có phải số nguyên tố không.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `YES` nếu `n` là số nguyên tố, ngược lại in `NO`.',
      note: 'Chỉ cần kiểm tra các ước từ 2 đến căn bậc hai của n là đủ.',
      solve: (input) => (isPrime(toInt(input)) ? 'YES' : 'NO'),
      inputs: ['7', '1', '2', '4', '97', '100', '9973', '1000'],
    },
    {
      key: '02',
      title: 'Số hoàn hảo',
      difficulty: 'MEDIUM',
      story:
        'Số hoàn hảo là số nguyên dương bằng tổng các ước thực sự của nó (các ước nhỏ hơn chính nó). ' +
        'Ví dụ 6 = 1 + 2 + 3. Cho `n` (1 <= n <= 100000), hãy kiểm tra `n` có hoàn hảo không.',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In `YES` nếu `n` là số hoàn hảo, ngược lại in `NO`.',
      note: 'Tổng ước thực sự = tổng tất cả ước trừ đi chính n.',
      solve: (input) => {
        const n = toInt(input);
        if (n < 1) return 'NO';
        return sumOfDivisors(n) - n === n && n > 0 && n !== 1 ? 'YES' : 'NO';
      },
      inputs: ['6', '28', '12', '1', '496', '8128', '27', '100'],
    },
    {
      key: '03',
      title: 'Đếm số nguyên tố tới n',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 100000), hãy đếm xem có bao nhiêu số nguyên tố trong khoảng từ 1 đến `n` (tính cả `n`).',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In ra số lượng số nguyên tố không vượt quá `n`.',
      note: 'Duyệt từ 2 đến n, mỗi số kiểm tra nguyên tố rồi đếm.',
      solve: (input) => {
        const n = toInt(input);
        let c = 0;
        for (let i = 2; i <= n; i++) if (isPrime(i)) c++;
        return String(c);
      },
      inputs: ['10', '1', '2', '20', '100', '1000', '50', '7'],
    },
    {
      key: '04',
      title: 'Số Fibonacci thứ n',
      difficulty: 'MEDIUM',
      story:
        'Dãy Fibonacci: F(1) = 1, F(2) = 1, F(k) = F(k-1) + F(k-2). Cho `n` (1 <= n <= 40), ' +
        'hãy in ra số Fibonacci thứ `n`. (Giới hạn n <= 40 để kết quả không quá lớn.)',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 40).',
      outputDesc: 'In ra giá trị F(n).',
      note: 'Dùng hai biến lưu hai số trước, lặp để tính số tiếp theo.',
      solve: (input) => {
        const n = toInt(input);
        let a = 1;
        let b = 1;
        if (n <= 2) return '1';
        for (let i = 3; i <= n; i++) {
          const c = a + b;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: ['1', '2', '5', '10', '40', '7', '20', '3'],
    },
    {
      key: '05',
      title: 'Ước chung lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho hai số nguyên dương `a` và `b` (1 <= a, b <= 1000000) trên cùng một dòng, ' +
        'hãy tìm ước chung lớn nhất (UCLN) của chúng.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau dấu cách.',
      outputDesc: 'In ra UCLN của `a` và `b`.',
      note: 'Dùng thuật toán Euclid: UCLN(a, b) = UCLN(b, a % b).',
      solve: (input) => {
        const [a, b] = readInts(input);
        return String(gcd(a, b));
      },
      inputs: ['12 18', '7 1', '100 100', '17 5', '48 36', '1000000 2', '13 13', '24 60'],
    },
    {
      key: '06',
      title: 'Bội chung nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho hai số nguyên dương `a` và `b` (1 <= a, b <= 10000) trên cùng một dòng, ' +
        'hãy tìm bội chung nhỏ nhất (BCNN). (Giới hạn nhỏ để kết quả an toàn.)',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau dấu cách.',
      outputDesc: 'In ra BCNN của `a` và `b`.',
      note: 'BCNN(a, b) = a / UCLN(a, b) * b.',
      solve: (input) => {
        const [a, b] = readInts(input);
        const g = gcd(a, b);
        return String((a / g) * b);
      },
      inputs: ['4 6', '3 5', '7 1', '10 10', '12 18', '100 80', '9 6', '15 20'],
    },
    {
      key: '07',
      title: 'Tổng các ước',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 1000000), hãy tính tổng tất cả các ước dương của `n` (kể cả 1 và chính `n`).',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In ra tổng các ước của `n`.',
      note: 'Duyệt i từ 1 tới căn n, nếu n chia hết cho i thì cộng cả i và n/i.',
      solve: (input) => String(sumOfDivisors(toInt(input))),
      inputs: ['6', '1', '12', '7', '28', '100', '13', '36'],
    },
    {
      key: '08',
      title: 'Đếm số ước',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 1000000), hãy đếm xem `n` có bao nhiêu ước dương.',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In ra số lượng ước của `n`.',
      note: 'Số nguyên tố luôn có đúng 2 ước. Số chính phương có số ước lẻ.',
      solve: (input) => String(countDivisors(toInt(input))),
      inputs: ['6', '1', '12', '7', '16', '100', '13', '36'],
    },
    {
      key: '09',
      title: 'Đảo ngược chữ số',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000), hãy in ra số nhận được khi viết các chữ số của `n` theo thứ tự ngược lại. ' +
        'Ví dụ 1230 đảo lại thành 321.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra số sau khi đảo ngược các chữ số (bỏ số 0 ở đầu).',
      note: 'Lặp: lấy chữ số cuối bằng n % 10, ghép dần vào kết quả.',
      solve: (input) => String(reverseDigits(toInt(input))),
      inputs: ['123', '1230', '0', '7', '1000', '90909', '100', '54321'],
    },
    {
      key: '10',
      title: 'Số đối xứng',
      difficulty: 'MEDIUM',
      story:
        'Số đối xứng (palindrome) là số đọc xuôi và đọc ngược đều giống nhau, ví dụ 121, 1331. ' +
        'Cho số nguyên không âm `n` (0 <= n <= 1000000), hãy kiểm tra `n` có đối xứng không.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `YES` nếu `n` đối xứng, ngược lại in `NO`.',
      note: 'Đảo ngược chữ số rồi so sánh với số ban đầu.',
      solve: (input) => (isPalindromeNumber(toInt(input)) ? 'YES' : 'NO'),
      inputs: ['121', '123', '7', '1331', '10', '0', '12321', '1000'],
    },
    {
      key: '11',
      title: 'Tìm kiếm tuyến tính',
      difficulty: 'MEDIUM',
      story:
        'Cho một danh sách số và một số cần tìm `x`. Hãy cho biết `x` có xuất hiện trong danh sách không.\n\n' +
        'Dòng 1 chứa `n` và `x`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `x`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In `YES` nếu `x` có trong danh sách, ngược lại in `NO`.',
      note: 'Duyệt lần lượt từng phần tử, nếu gặp phần tử bằng x thì dừng và in YES.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const [, x] = readInts(lines[0] ?? '');
        const arr = readInts(lines[1] ?? '');
        return arr.includes(x) ? 'YES' : 'NO';
      },
      inputs: [
        '5 3\n1 2 3 4 5',
        '4 9\n1 2 3 4',
        '1 7\n7',
        '3 0\n-1 0 1',
        '6 6\n6 5 4 3 2 1',
        '5 8\n2 4 6 10 12',
        '2 -5\n-5 5',
        '4 100\n10 20 30 40',
      ],
    },
    {
      key: '12',
      title: 'Vị trí tìm thấy',
      difficulty: 'MEDIUM',
      story:
        'Cho danh sách số và số cần tìm `x`, hãy in ra vị trí (đánh số từ 1) đầu tiên mà `x` xuất hiện. ' +
        'Nếu không có thì in `-1`.\n\nDòng 1 chứa `n` và `x`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `x`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra vị trí 1-based đầu tiên của `x`, hoặc `-1` nếu không có.',
      note: 'Trả vị trí ngay khi tìm thấy lần đầu, đừng đợi duyệt hết.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const [, x] = readInts(lines[0] ?? '');
        const arr = readInts(lines[1] ?? '');
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
      key: '13',
      title: 'Lớn nhất và nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một danh sách số nguyên, hãy tìm số lớn nhất và số nhỏ nhất trong một lần duyệt.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra hai số trên một dòng: số lớn nhất rồi số nhỏ nhất, cách nhau dấu cách.',
      note: 'Khởi tạo max và min bằng phần tử đầu, rồi cập nhật khi duyệt.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        let mx = arr[0];
        let mn = arr[0];
        for (const v of arr) {
          if (v > mx) mx = v;
          if (v < mn) mn = v;
        }
        return mx + ' ' + mn;
      },
      inputs: [
        '5\n3 1 4 1 5',
        '1\n7',
        '3\n-2 -5 -1',
        '4\n10 10 10 10',
        '6\n9 8 7 6 5 4',
        '2\n100 -100',
        '5\n0 0 0 0 1',
        '3\n5 3 8',
      ],
    },
    {
      key: '14',
      title: 'Sắp xếp nổi bọt',
      difficulty: 'HARD',
      story:
        'Cho một danh sách số nguyên, hãy sắp xếp chúng theo thứ tự tăng dần (có thể dùng thuật toán nổi bọt) rồi in ra.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra `n` số đã sắp xếp tăng dần, cách nhau dấu cách, trên một dòng.',
      note: 'Nổi bọt: lặp nhiều lượt, đổi chỗ hai phần tử kề nhau nếu chúng sai thứ tự.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        const a = arr.slice();
        for (let i = 0; i < a.length; i++) {
          for (let j = 0; j < a.length - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
              const t = a[j];
              a[j] = a[j + 1];
              a[j + 1] = t;
            }
          }
        }
        return a.join(' ');
      },
      inputs: [
        '5\n3 1 4 1 5',
        '1\n7',
        '3\n9 8 7',
        '4\n2 2 1 1',
        '6\n-1 -3 0 2 -2 1',
        '2\n5 5',
        '5\n10 20 30 40 50',
        '4\n100 1 50 25',
      ],
    },
    {
      key: '15',
      title: 'Đếm số nguyên tố trong danh sách',
      difficulty: 'MEDIUM',
      story:
        'Cho một danh sách số nguyên, hãy đếm xem có bao nhiêu số là số nguyên tố.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên (0 <= mỗi số <= 1000000).',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra số lượng số nguyên tố trong danh sách.',
      note: 'Với mỗi số trong danh sách, kiểm tra nguyên tố rồi cộng vào bộ đếm.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        let c = 0;
        for (const v of arr) if (isPrime(v)) c++;
        return String(c);
      },
      inputs: [
        '5\n2 3 4 5 6',
        '1\n1',
        '3\n7 11 13',
        '4\n1 4 6 8',
        '6\n2 2 2 2 2 2',
        '5\n0 1 2 3 4',
        '3\n97 98 99',
        '4\n10 15 17 20',
      ],
    },
    {
      key: '16',
      title: 'Căn số (Digital root)',
      difficulty: 'MEDIUM',
      story:
        'Cộng các chữ số của số `n` lại, nếu kết quả vẫn nhiều hơn một chữ số thì tiếp tục cộng cho tới khi còn một chữ số. ' +
        'Đó là "căn số". Cho `n` (0 <= n <= 1000000), hãy in ra căn số của nó.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra căn số (một chữ số từ 0 đến 9).',
      note: 'Lặp việc cộng chữ số cho tới khi số nhỏ hơn 10.',
      solve: (input) => {
        let n = toInt(input);
        while (n >= 10) n = digitSum(n);
        return String(n);
      },
      inputs: ['38', '0', '9', '12345', '99999', '10', '7', '1000000'],
    },
    {
      key: '17',
      title: 'Số Armstrong',
      difficulty: 'HARD',
      story:
        'Số Armstrong (gồm `d` chữ số) là số bằng tổng các chữ số của nó, mỗi chữ số được nâng lên lũy thừa `d`. ' +
        'Ví dụ 153 = 1^3 + 5^3 + 3^3. Cho `n` (1 <= n <= 1000000), hãy kiểm tra `n` có phải số Armstrong không.',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In `YES` nếu `n` là số Armstrong, ngược lại in `NO`.',
      note: 'Đếm số chữ số trước, sau đó cộng từng chữ số mũ d.',
      solve: (input) => {
        const n = toInt(input);
        const digits = String(n).split('').map((c) => parseInt(c, 10));
        const d = digits.length;
        let total = 0;
        for (const dig of digits) total += Math.pow(dig, d);
        return total === n ? 'YES' : 'NO';
      },
      inputs: ['153', '154', '9', '370', '371', '407', '10', '1634'],
    },
    {
      key: '18',
      title: 'Giai thừa',
      difficulty: 'MEDIUM',
      story:
        'Giai thừa của `n` (viết là n!) là tích các số từ 1 đến `n`, với 0! = 1. ' +
        'Cho `n` (0 <= n <= 18), hãy in ra n!. (Giới hạn n <= 18 để kết quả nằm trong giới hạn an toàn.)',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 18).',
      outputDesc: 'In ra giá trị n!.',
      note: 'Khởi tạo kết quả bằng 1 rồi nhân dần từ 2 tới n.',
      solve: (input) => {
        const n = toInt(input);
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return String(r);
      },
      inputs: ['5', '0', '1', '10', '18', '3', '12', '7'],
    },
    {
      key: '19',
      title: 'Tổng các chữ số',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000), hãy tính tổng các chữ số của nó. ' +
        'Ví dụ 123 có tổng chữ số là 6.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra tổng các chữ số của `n`.',
      note: 'Lấy n % 10 để lấy chữ số cuối, rồi chia n cho 10 (lấy phần nguyên).',
      solve: (input) => {
        const n = toInt(input);
        if (n === 0) return '0';
        return String(digitSum(n));
      },
      inputs: ['123', '0', '9', '1000', '99999', '7', '505', '1000000'],
    },
    {
      key: '20',
      title: 'Đếm chữ số',
      difficulty: 'EASY',
      story:
        'Cho một số nguyên không âm `n` (0 <= n <= 1000000), hãy đếm xem `n` có bao nhiêu chữ số. ' +
        'Lưu ý số 0 có một chữ số.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra số lượng chữ số của `n`.',
      note: 'Lặp việc chia n cho 10 và đếm số lần cho tới khi n = 0.',
      solve: (input) => {
        let n = toInt(input);
        if (n === 0) return '1';
        let c = 0;
        while (n > 0) {
          c++;
          n = Math.floor(n / 10);
        }
        return String(c);
      },
      inputs: ['123', '0', '9', '1000', '999999', '7', '10', '1000000'],
    },
    {
      key: '21',
      title: 'Tổng các số nguyên tố tới n',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 100000), hãy tính tổng tất cả các số nguyên tố không vượt quá `n`.',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In ra tổng các số nguyên tố từ 2 đến `n`.',
      note: 'Duyệt từng số, nếu là nguyên tố thì cộng dồn.',
      solve: (input) => {
        const n = toInt(input);
        let s = 0;
        for (let i = 2; i <= n; i++) if (isPrime(i)) s += i;
        return String(s);
      },
      inputs: ['10', '1', '2', '20', '100', '1000', '5', '50'],
    },
    {
      key: '22',
      title: 'Phân tích thừa số nguyên tố',
      difficulty: 'HARD',
      story:
        'Cho `n` (2 <= n <= 1000000), hãy in ra các thừa số nguyên tố của `n` theo thứ tự tăng dần, ' +
        'mỗi thừa số được lặp lại đúng số lần nó xuất hiện. Ví dụ 12 = 2 2 3.',
      inputDesc: 'Một số nguyên `n` (2 <= n <= 1000000).',
      outputDesc: 'In ra các thừa số nguyên tố cách nhau dấu cách, trên một dòng.',
      note: 'Chia liên tục cho 2, rồi cho các số lẻ tăng dần tới căn n.',
      solve: (input) => {
        let n = toInt(input);
        const factors: number[] = [];
        for (let d = 2; d * d <= n; d++) {
          while (n % d === 0) {
            factors.push(d);
            n = Math.floor(n / d);
          }
        }
        if (n > 1) factors.push(n);
        return factors.join(' ');
      },
      inputs: ['12', '2', '7', '100', '97', '360', '64', '999983'],
    },
    {
      key: '23',
      title: 'Đếm số chẵn và số lẻ',
      difficulty: 'EASY',
      story:
        'Cho một danh sách số nguyên, hãy đếm có bao nhiêu số chẵn và bao nhiêu số lẻ.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra hai số trên một dòng: số lượng số chẵn rồi số lượng số lẻ.',
      note: 'Số chẵn khi chia 2 dư 0. Lưu ý số âm: dùng cách kiểm tra giá trị tuyệt đối hoặc % 2 === 0.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        let even = 0;
        let odd = 0;
        for (const v of arr) {
          if (((v % 2) + 2) % 2 === 0) even++;
          else odd++;
        }
        return even + ' ' + odd;
      },
      inputs: [
        '5\n1 2 3 4 5',
        '1\n7',
        '3\n2 4 6',
        '4\n-1 -2 -3 -4',
        '6\n0 0 0 1 1 1',
        '2\n10 11',
        '5\n5 5 5 5 5',
        '4\n100 99 98 97',
      ],
    },
    {
      key: '24',
      title: 'Tổng và trung bình',
      difficulty: 'EASY',
      story:
        'Cho một danh sách số nguyên, hãy tính tổng của chúng và phần nguyên của trung bình cộng (làm tròn xuống).\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra hai số trên một dòng: tổng rồi phần nguyên của trung bình cộng.',
      note: 'Trung bình lấy phần nguyên: dùng phép chia lấy phần nguyên (Math.floor / //).',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        let sum = 0;
        for (const v of arr) sum += v;
        const avg = Math.floor(sum / arr.length);
        return sum + ' ' + avg;
      },
      inputs: [
        '5\n1 2 3 4 5',
        '1\n7',
        '3\n10 20 30',
        '4\n1 1 1 1',
        '6\n2 3 5 7 11 13',
        '2\n100 1',
        '5\n5 5 5 5 5',
        '3\n7 8 9',
      ],
    },
    {
      key: '25',
      title: 'Tìm số lớn thứ hai',
      difficulty: 'HARD',
      story:
        'Cho một danh sách số nguyên (có ít nhất hai giá trị khác nhau), hãy tìm số lớn thứ hai (giá trị phân biệt).\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra giá trị lớn thứ hai (theo các giá trị phân biệt).',
      note: 'Có thể lấy tập các giá trị phân biệt, sắp xếp rồi lấy phần tử lớn thứ hai.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        const uniq = Array.from(new Set(arr)).sort((a, b) => b - a);
        return String(uniq[1]);
      },
      inputs: [
        '5\n3 1 4 1 5',
        '2\n9 7',
        '4\n10 10 5 5',
        '3\n-1 -2 -3',
        '6\n1 2 3 4 5 6',
        '5\n5 5 5 4 4',
        '4\n100 50 100 25',
        '3\n8 8 3',
      ],
    },
    {
      key: '26',
      title: 'Đếm số xuất hiện',
      difficulty: 'MEDIUM',
      story:
        'Cho một danh sách số nguyên và một số `x`, hãy đếm xem `x` xuất hiện bao nhiêu lần.\n\n' +
        'Dòng 1 chứa `n` và `x`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `x`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra số lần `x` xuất hiện trong danh sách.',
      note: 'Duyệt qua danh sách, mỗi lần gặp giá trị bằng x thì tăng bộ đếm.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const [, x] = readInts(lines[0] ?? '');
        const arr = readInts(lines[1] ?? '');
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
      key: '27',
      title: 'Kiểm tra danh sách tăng dần',
      difficulty: 'MEDIUM',
      story:
        'Cho một danh sách số nguyên, hãy kiểm tra xem nó có được sắp xếp tăng dần (không giảm) hay không.\n\n' +
        'Dòng 1 chứa `n`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: số lượng `n`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In `YES` nếu danh sách tăng dần (không giảm), ngược lại in `NO`.',
      note: 'So sánh từng cặp phần tử kề nhau: nếu có phần tử sau nhỏ hơn phần tử trước thì không tăng dần.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const arr = readInts(lines[1] ?? '');
        for (let i = 1; i < arr.length; i++) {
          if (arr[i] < arr[i - 1]) return 'NO';
        }
        return 'YES';
      },
      inputs: [
        '5\n1 2 3 4 5',
        '1\n7',
        '4\n1 3 2 4',
        '3\n5 5 5',
        '6\n1 1 2 2 3 3',
        '2\n9 8',
        '5\n-3 -2 -1 0 1',
        '4\n10 20 15 25',
      ],
    },
    {
      key: '28',
      title: 'Tổng các số chia hết cho 3 hoặc 5',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 1000000), hãy tính tổng các số từ 1 đến `n` chia hết cho 3 hoặc chia hết cho 5.',
      inputDesc: 'Một số nguyên dương `n`.',
      outputDesc: 'In ra tổng các số chia hết cho 3 hoặc 5 trong khoảng từ 1 đến `n`.',
      note: 'Một số chia hết cho 3 HOẶC 5: dùng điều kiện i % 3 == 0 hoặc i % 5 == 0.',
      solve: (input) => {
        const n = toInt(input);
        let s = 0;
        for (let i = 1; i <= n; i++) {
          if (i % 3 === 0 || i % 5 === 0) s += i;
        }
        return String(s);
      },
      inputs: ['10', '1', '3', '5', '15', '100', '1000', '7'],
    },
    {
      key: '29',
      title: 'Số nguyên tố thứ k',
      difficulty: 'HARD',
      story:
        'Cho `k` (1 <= k <= 1000), hãy in ra số nguyên tố thứ `k`. Ví dụ số nguyên tố thứ 1 là 2, thứ 2 là 3.',
      inputDesc: 'Một số nguyên dương `k`.',
      outputDesc: 'In ra số nguyên tố thứ `k`.',
      note: 'Duyệt các số tăng dần, đếm số nguyên tố cho tới khi đủ k.',
      solve: (input) => {
        const k = toInt(input);
        let count = 0;
        let num = 1;
        while (count < k) {
          num++;
          if (isPrime(num)) count++;
        }
        return String(num);
      },
      inputs: ['1', '2', '5', '10', '100', '3', '25', '1000'],
    },
    {
      key: '30',
      title: 'Đếm cặp có tổng bằng s',
      difficulty: 'HARD',
      story:
        'Cho một danh sách số nguyên và một số `s`, hãy đếm số cặp (i, j) với i < j sao cho tổng hai phần tử bằng `s`.\n\n' +
        'Dòng 1 chứa `n` và `s`. Dòng 2 chứa `n` số nguyên.',
      inputDesc: 'Dòng 1: hai số `n` và `s`. Dòng 2: `n` số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra số cặp phần tử (vị trí khác nhau, i < j) có tổng bằng `s`.',
      note: 'Dùng hai vòng lặp lồng nhau: với mỗi i, xét mọi j > i.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const [, s] = readInts(lines[0] ?? '');
        const arr = readInts(lines[1] ?? '');
        let c = 0;
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] + arr[j] === s) c++;
          }
        }
        return String(c);
      },
      inputs: [
        '5 6\n1 2 3 4 5',
        '4 10\n1 2 3 4',
        '1 5\n5',
        '5 4\n2 2 2 2 2',
        '6 0\n-1 1 -2 2 0 0',
        '4 8\n4 4 4 4',
        '5 100\n10 20 30 40 50',
        '3 7\n3 4 5',
      ],
    },
  ],
};

export default course;

import { CourseSpec } from '../types';

/**
 * Course 08 — Vòng lặp while.
 * Mục tiêu: học sinh tiểu học làm quen với vòng lặp while: lặp lại một việc
 * trong khi điều kiện còn đúng, biết cách cập nhật biến để vòng lặp DỪNG lại
 * (tránh lặp vô hạn). Các bài: đếm ngược, tách chữ số, đếm/đảo số, cộng dồn,
 * chia đôi, lũy thừa 2, GCD, Collatz...
 *
 * NOTE for authors: mirror this exact shape. Never write an expected output by
 * hand — return it from `solve(input)`. The first 3 inputs become visible
 * samples. Inputs are bounded (<= 1,000,000) and every solver terminates.
 */

/** Read the first whitespace-trimmed integer from stdin. */
const readInt = (input: string): number => parseInt(input.trim(), 10);

const course: CourseSpec = {
  code: 'PYTHON-BASIC-08',
  title: 'Vòng lặp while',
  description:
    'Khóa học về vòng lặp while: lặp lại một việc trong khi điều kiện còn đúng. ' +
    'Em sẽ học cách cập nhật biến đúng cách để vòng lặp luôn dừng lại đúng lúc!',
  tags: ['python', 'co-ban', 'while', 'vong-lap'],
  problems: [
    {
      key: '01',
      title: 'Đếm ngược từ n',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy dùng vòng lặp while in ra các số đếm ngược từ `n` về `1`, mỗi số trên một dòng.\n\nVí dụ với `n = 3` thì in ra:\n\n```\n3\n2\n1\n```',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000).',
      outputDesc: 'Các số từ n giảm dần về 1, mỗi số một dòng. Nếu n < 1 thì không in gì.',
      note: 'Đặt `i = n`, vòng lặp `while i >= 1:` in `i` rồi `i -= 1`. Nhớ giảm i để vòng lặp dừng!',
      solve: (input) => {
        const n = readInt(input);
        const out: string[] = [];
        let i = n;
        while (i >= 1) {
          out.push(String(i));
          i -= 1;
        }
        return out.join('\n');
      },
      inputs: ['3', '5', '1', '10', '0', '100'],
    },
    {
      key: '02',
      title: 'Đếm xuôi đến n',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy dùng while in ra các số từ `1` đến `n`, mỗi số một dòng.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000).',
      outputDesc: 'Các số từ 1 tăng dần đến n, mỗi số một dòng.',
      note: 'Đặt `i = 1`, `while i <= n:` in `i` rồi `i += 1`.',
      solve: (input) => {
        const n = readInt(input);
        const out: string[] = [];
        let i = 1;
        while (i <= n) {
          out.push(String(i));
          i += 1;
        }
        return out.join('\n');
      },
      inputs: ['5', '3', '1', '8', '12', '50'],
    },
    {
      key: '03',
      title: 'Tổng từ 1 đến n',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy dùng while tính tổng `1 + 2 + ... + n` và in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000000).',
      outputDesc: 'Một dòng: tổng các số từ 1 đến n.',
      note: 'Đặt `s = 0`, `i = 1`, `while i <= n: s += i; i += 1`. Nhớ tăng i!',
      solve: (input) => {
        const n = readInt(input);
        let s = 0;
        let i = 1;
        while (i <= n) {
          s += i;
          i += 1;
        }
        return String(s);
      },
      inputs: ['5', '10', '1', '100', '1000', '0'],
    },
    {
      key: '04',
      title: 'Đếm số chữ số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy đếm xem `n` có bao nhiêu chữ số.\n\nVí dụ `n = 405` có 3 chữ số.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: số chữ số của n.',
      note: 'Dùng `while n > 0: dem += 1; n //= 10`. Riêng n = 0 có 1 chữ số nên đếm bắt đầu phù hợp.',
      solve: (input) => {
        let n = readInt(input);
        if (n === 0) return '1';
        let dem = 0;
        while (n > 0) {
          dem += 1;
          n = Math.floor(n / 10);
        }
        return String(dem);
      },
      inputs: ['405', '7', '0', '1000000', '99', '10'],
    },
    {
      key: '05',
      title: 'Tổng các chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy tính tổng các chữ số của `n`.\n\nVí dụ `n = 123` có tổng chữ số là `1 + 2 + 3 = 6`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: tổng các chữ số của n.',
      note: 'Dùng `while n > 0: s += n % 10; n //= 10`. Lấy chữ số cuối bằng `n % 10`, bỏ nó đi bằng `n //= 10`.',
      solve: (input) => {
        let n = readInt(input);
        let s = 0;
        while (n > 0) {
          s += n % 10;
          n = Math.floor(n / 10);
        }
        return String(s);
      },
      inputs: ['123', '405', '0', '9', '1000000', '99999'],
    },
    {
      key: '06',
      title: 'Tích các chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy tính tích (nhân) tất cả các chữ số của `n`.\n\nVí dụ `n = 234` cho `2 * 3 * 4 = 24`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: tích các chữ số của n. Với n = 0 thì tích là 0.',
      note: 'Đặt `tich = 1`. Với n = 0 thì in 0. Dùng `while n > 0: tich *= n % 10; n //= 10`.',
      solve: (input) => {
        let n = readInt(input);
        if (n === 0) return '0';
        let tich = 1;
        while (n > 0) {
          tich *= n % 10;
          n = Math.floor(n / 10);
        }
        return String(tich);
      },
      inputs: ['234', '5', '0', '111', '999', '10'],
    },
    {
      key: '07',
      title: 'Tìm chữ số lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy tìm chữ số lớn nhất trong các chữ số của `n`.\n\nVí dụ `n = 4192` có chữ số lớn nhất là `9`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: chữ số lớn nhất của n.',
      note: 'Tách từng chữ số bằng `n % 10` rồi `n //= 10`, so sánh để giữ chữ số lớn nhất.',
      solve: (input) => {
        let n = readInt(input);
        if (n === 0) return '0';
        let mx = 0;
        while (n > 0) {
          const d = n % 10;
          if (d > mx) mx = d;
          n = Math.floor(n / 10);
        }
        return String(mx);
      },
      inputs: ['4192', '7', '0', '1000000', '55555', '102'],
    },
    {
      key: '08',
      title: 'Đảo ngược số',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra số khi đảo ngược thứ tự các chữ số.\n\nVí dụ `n = 1230` đảo lại thành `321` (các số 0 ở đầu kết quả sẽ biến mất).',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: số sau khi đảo ngược chữ số.',
      note: 'Dùng `kq = kq * 10 + n % 10` rồi `n //= 10`. Vì n giảm dần về 0 nên vòng lặp luôn dừng.',
      solve: (input) => {
        let n = readInt(input);
        let kq = 0;
        while (n > 0) {
          kq = kq * 10 + (n % 10);
          n = Math.floor(n / 10);
        }
        return String(kq);
      },
      inputs: ['1230', '7', '0', '100', '987654', '1000000'],
    },
    {
      key: '09',
      title: 'Chia đôi bao nhiêu lần',
      difficulty: 'MEDIUM',
      story:
        'Một tờ giấy dày `n`. Mỗi lần em gấp đôi thì độ dày coi như chia cho 2 (lấy phần nguyên). Hỏi cần bao nhiêu lần chia 2 để `n` còn `<= 1`?\n\nVí dụ `n = 8`: 8 -> 4 -> 2 -> 1, cần 3 lần.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000000).',
      outputDesc: 'Một dòng: số lần chia 2 để n <= 1.',
      note: 'Dùng `while n > 1: n //= 2; dem += 1`. Vì n chia 2 nên luôn giảm và dừng.',
      solve: (input) => {
        let n = readInt(input);
        let dem = 0;
        while (n > 1) {
          n = Math.floor(n / 2);
          dem += 1;
        }
        return String(dem);
      },
      inputs: ['8', '1', '10', '1000', '1000000', '2'],
    },
    {
      key: '10',
      title: 'Lũy thừa của 2 đầu tiên',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy tìm lũy thừa của 2 nhỏ nhất mà lớn hơn hoặc bằng `n` (tức `1, 2, 4, 8, 16, ...`).\n\nVí dụ `n = 5` thì kết quả là `8`.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000000).',
      outputDesc: 'Một dòng: lũy thừa của 2 nhỏ nhất >= n.',
      note: 'Đặt `p = 1`, `while p < n: p *= 2`. Mỗi bước p tăng gấp đôi nên nhanh chóng vượt n.',
      solve: (input) => {
        const n = readInt(input);
        let p = 1;
        while (p < n) {
          p *= 2;
        }
        return String(p);
      },
      inputs: ['5', '1', '16', '17', '1000', '1000000'],
    },
    {
      key: '11',
      title: 'Cộng dồn tới khi vượt mốc',
      difficulty: 'MEDIUM',
      story:
        'Em cộng dồn `1 + 2 + 3 + ...`. Máy tính cho em một mốc `m`. Hãy tìm số nhỏ nhất `k` sao cho tổng `1 + 2 + ... + k` lớn hơn `m`.\n\nVí dụ `m = 5`: tổng tới 3 là 6 > 5, nên `k = 3`.',
      inputDesc: 'Một số nguyên `m` (0 <= m <= 1000000).',
      outputDesc: 'Một dòng: số k nhỏ nhất để 1+2+...+k > m.',
      note: 'Đặt `s = 0`, `k = 0`, `while s <= m: k += 1; s += k`. Vì s tăng mãi nên chắc chắn vượt m.',
      solve: (input) => {
        const m = readInt(input);
        let s = 0;
        let k = 0;
        while (s <= m) {
          k += 1;
          s += k;
        }
        return String(k);
      },
      inputs: ['5', '0', '1', '100', '1000', '1000000'],
    },
    {
      key: '12',
      title: 'Bao nhiêu lần trừ k',
      difficulty: 'EASY',
      story:
        'Em có `n` viên kẹo và mỗi ngày ăn `k` viên. Hãy đếm sau bao nhiêu ngày thì hết hoặc không đủ để ăn tiếp (n trở thành nhỏ hơn k).\n\nNói cách khác: đếm số lần trừ `k` khỏi `n` khi `n >= k`.',
      inputDesc: 'Một dòng chứa hai số `n` và `k` (0 <= n <= 1000000, 1 <= k <= 1000000).',
      outputDesc: 'Một dòng: số lần có thể trừ k khỏi n.',
      note: 'Dùng `while n >= k: n -= k; dem += 1`. Vì k >= 1 nên n luôn giảm và dừng.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        let n = parseInt(parts[0], 10);
        const k = parseInt(parts[1], 10);
        let dem = 0;
        while (n >= k) {
          n -= k;
          dem += 1;
        }
        return String(dem);
      },
      inputs: ['10 3', '10 5', '7 10', '0 1', '1000000 1', '100 7'],
    },
    {
      key: '13',
      title: 'Số dư khi trừ liên tục',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số `n` và `k`. Em trừ `k` khỏi `n` nhiều lần khi còn `>= k`. Hãy in ra phần còn lại (số dư) cuối cùng.\n\nĐây chính là `n % k` nhưng làm bằng phép trừ.',
      inputDesc: 'Một dòng chứa hai số `n` và `k` (0 <= n <= 1000000, 1 <= k <= 1000000).',
      outputDesc: 'Một dòng: phần còn lại sau khi trừ k liên tục.',
      note: 'Dùng `while n >= k: n -= k`. In ra n. Vì k >= 1 nên dừng.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        let n = parseInt(parts[0], 10);
        const k = parseInt(parts[1], 10);
        while (n >= k) {
          n -= k;
        }
        return String(n);
      },
      inputs: ['10 3', '10 5', '7 10', '0 4', '1000000 7', '99 100'],
    },
    {
      key: '14',
      title: 'In bảng nhân bằng while',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số `n` (1 <= n <= 9). Hãy in bảng nhân của `n` từ 1 đến 10 bằng while, mỗi dòng theo mẫu `n x i = ket_qua`.\n\nVí dụ với `n = 2`, dòng đầu là `2 x 1 = 2`.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 9).',
      outputDesc: 'Mười dòng, mỗi dòng `n x i = n*i` với i từ 1 đến 10.',
      note: 'Đặt `i = 1`, `while i <= 10:` in dòng rồi `i += 1`.',
      solve: (input) => {
        const n = readInt(input);
        const out: string[] = [];
        let i = 1;
        while (i <= 10) {
          out.push(n + ' x ' + i + ' = ' + n * i);
          i += 1;
        }
        return out.join('\n');
      },
      inputs: ['2', '5', '9', '1', '7', '3'],
    },
    {
      key: '15',
      title: 'Đếm số chẵn từ 1 đến n',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số `n`. Hãy đếm có bao nhiêu số chẵn trong khoảng từ 1 đến n.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: số lượng số chẵn từ 1 đến n.',
      note: 'Dùng `i = 1`, `while i <= n:` nếu `i % 2 == 0` thì `dem += 1`, rồi `i += 1`.',
      solve: (input) => {
        const n = readInt(input);
        let dem = 0;
        let i = 1;
        while (i <= n) {
          if (i % 2 === 0) dem += 1;
          i += 1;
        }
        return String(dem);
      },
      inputs: ['10', '1', '0', '7', '100', '999'],
    },
    {
      key: '16',
      title: 'Tổng các số lẻ tới n',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số `n`. Hãy tính tổng các số lẻ trong khoảng từ 1 đến n.\n\nVí dụ `n = 5`: `1 + 3 + 5 = 9`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 100000).',
      outputDesc: 'Một dòng: tổng các số lẻ từ 1 đến n.',
      note: 'Có thể chạy `i = 1`, `while i <= n: i += 2` để chỉ duyệt số lẻ và cộng dồn.',
      solve: (input) => {
        const n = readInt(input);
        let s = 0;
        let i = 1;
        while (i <= n) {
          s += i;
          i += 2;
        }
        return String(s);
      },
      inputs: ['5', '1', '0', '10', '99', '100000'],
    },
    {
      key: '17',
      title: 'Đếm chữ số chẵn trong số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy đếm xem trong `n` có bao nhiêu chữ số chẵn (0, 2, 4, 6, 8).\n\nVí dụ `n = 1234` có 2 chữ số chẵn là 2 và 4.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: số chữ số chẵn của n.',
      note: 'Với n = 0 chữ số duy nhất là 0 (chẵn). Tách chữ số bằng `n % 10`, `n //= 10`.',
      solve: (input) => {
        let n = readInt(input);
        if (n === 0) return '1';
        let dem = 0;
        while (n > 0) {
          if ((n % 10) % 2 === 0) dem += 1;
          n = Math.floor(n / 10);
        }
        return String(dem);
      },
      inputs: ['1234', '0', '7', '2468', '13579', '1000000'],
    },
    {
      key: '18',
      title: 'Số Collatz mấy bước',
      difficulty: 'HARD',
      story:
        'Trò chơi Collatz: bắt đầu từ số `n`. Nếu `n` chẵn thì `n = n // 2`, nếu `n` lẻ thì `n = 3*n + 1`. Lặp lại tới khi `n = 1`. Hãy đếm số bước cần thực hiện.\n\nVí dụ `n = 6`: 6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1, cần 8 bước.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000).',
      outputDesc: 'Một dòng: số bước để đưa n về 1.',
      note: 'Dùng `while n != 1:` xử lý chẵn/lẻ rồi `dem += 1`. Với n nhỏ dãy luôn về 1 nên dừng.',
      solve: (input) => {
        let n = readInt(input);
        let dem = 0;
        while (n !== 1) {
          if (n % 2 === 0) n = Math.floor(n / 2);
          else n = 3 * n + 1;
          dem += 1;
        }
        return String(dem);
      },
      inputs: ['6', '1', '7', '27', '2', '1000'],
    },
    {
      key: '19',
      title: 'Ước chung lớn nhất (trừ)',
      difficulty: 'HARD',
      story:
        'Máy tính cho em hai số nguyên dương `a` và `b`. Hãy tìm ước chung lớn nhất (UCLN) bằng phép trừ: khi `a` khác `b`, trừ số nhỏ khỏi số lớn; khi bằng nhau thì đó là UCLN.\n\nVí dụ `a = 12, b = 18` -> UCLN = 6.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b` (1 <= a, b <= 1000000).',
      outputDesc: 'Một dòng: ước chung lớn nhất của a và b.',
      note: 'Dùng `while a != b: if a > b: a -= b else: b -= a`. Hiệu luôn giảm nên vòng lặp dừng.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        let a = parseInt(parts[0], 10);
        let b = parseInt(parts[1], 10);
        while (a !== b) {
          if (a > b) a -= b;
          else b -= a;
        }
        return String(a);
      },
      inputs: ['12 18', '7 7', '1 1000000', '100 60', '17 5', '1000000 999999'],
    },
    {
      key: '20',
      title: 'Ước chung lớn nhất (chia dư)',
      difficulty: 'HARD',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b` (không đồng thời bằng 0). Hãy tìm UCLN bằng thuật toán Euclid với phép chia dư: khi `b` khác 0, thay `(a, b)` bằng `(b, a % b)`.\n\nVí dụ `a = 48, b = 18` -> 6.',
      inputDesc: 'Một dòng chứa hai số `a` và `b` (0 <= a, b <= 1000000, không cả hai bằng 0).',
      outputDesc: 'Một dòng: ước chung lớn nhất của a và b.',
      note: 'Dùng `while b != 0: a, b = b, a % b`. In a. Số dư luôn nhỏ hơn b nên dừng rất nhanh.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        let a = parseInt(parts[0], 10);
        let b = parseInt(parts[1], 10);
        while (b !== 0) {
          const r = a % b;
          a = b;
          b = r;
        }
        return String(a);
      },
      inputs: ['48 18', '0 5', '1000000 0', '17 13', '100 75', '999999 1000000'],
    },
    {
      key: '21',
      title: 'Kiểm tra số nguyên tố',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy kiểm tra `n` có phải số nguyên tố không. In `YES` nếu là số nguyên tố, ngược lại in `NO`.\n\nSố nguyên tố là số > 1 chỉ chia hết cho 1 và chính nó.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: `YES` nếu n là số nguyên tố, ngược lại `NO`.',
      note: 'Dùng `i = 2`, `while i * i <= n:` nếu `n % i == 0` thì không nguyên tố. Tăng i mỗi bước để dừng.',
      solve: (input) => {
        const n = readInt(input);
        if (n < 2) return 'NO';
        let i = 2;
        let prime = true;
        while (i * i <= n) {
          if (n % i === 0) {
            prime = false;
            break;
          }
          i += 1;
        }
        return prime ? 'YES' : 'NO';
      },
      inputs: ['7', '1', '0', '12', '97', '1000000'],
    },
    {
      key: '22',
      title: 'Đếm chữ số 0',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy đếm xem có bao nhiêu chữ số `0` trong `n`.\n\nVí dụ `n = 1020` có 2 chữ số 0.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: số chữ số 0 của n.',
      note: 'Với n = 0 thì có 1 chữ số 0. Tách bằng `n % 10`, `n //= 10`.',
      solve: (input) => {
        let n = readInt(input);
        if (n === 0) return '1';
        let dem = 0;
        while (n > 0) {
          if (n % 10 === 0) dem += 1;
          n = Math.floor(n / 10);
        }
        return String(dem);
      },
      inputs: ['1020', '0', '7', '1000000', '505', '12345'],
    },
    {
      key: '23',
      title: 'Số Fibonacci đầu tiên vượt n',
      difficulty: 'HARD',
      story:
        'Dãy Fibonacci: `1, 1, 2, 3, 5, 8, 13, ...` (mỗi số bằng tổng hai số trước). Máy tính cho em một số `n`. Hãy tìm số Fibonacci đầu tiên lớn hơn hoặc bằng `n`.\n\nVí dụ `n = 10` thì kết quả là `13`.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000000).',
      outputDesc: 'Một dòng: số Fibonacci nhỏ nhất >= n.',
      note: 'Đặt `a = 1, b = 1`, `while b < n: a, b = b, a + b`. b tăng mãi nên chắc chắn vượt n.',
      solve: (input) => {
        const n = readInt(input);
        let a = 1;
        let b = 1;
        while (b < n) {
          const c = a + b;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: ['10', '1', '2', '100', '1000', '1000000'],
    },
    {
      key: '24',
      title: 'Giai thừa bằng while',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm nhỏ `n`. Hãy tính giai thừa `n! = 1 * 2 * ... * n` bằng vòng lặp while. Quy ước `0! = 1`.\n\nVí dụ `n = 4` cho `24`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 15).',
      outputDesc: 'Một dòng: giá trị n giai thừa.',
      note: 'Đặt `kq = 1`, `i = 1`, `while i <= n: kq *= i; i += 1`. Tăng i để dừng.',
      solve: (input) => {
        const n = readInt(input);
        let kq = 1;
        let i = 1;
        while (i <= n) {
          kq *= i;
          i += 1;
        }
        return String(kq);
      },
      inputs: ['4', '0', '1', '5', '10', '15'],
    },
    {
      key: '25',
      title: 'Tổng tới khi gặp 0',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một dãy số nguyên không âm, mỗi số một dòng, kết thúc bởi số `0`. Hãy tính tổng các số đó (không tính số 0 kết thúc, nhưng cộng 0 cũng không sao).',
      inputDesc: 'Nhiều dòng, mỗi dòng một số nguyên không âm; dòng cuối là 0 để dừng.',
      outputDesc: 'Một dòng: tổng tất cả các số trước số 0 kết thúc.',
      note: 'Đọc số, `while x != 0:` cộng dồn rồi đọc số tiếp theo. Số 0 làm điều kiện dừng.',
      solve: (input) => {
        const nums = input
          .trim()
          .split(/\s+/)
          .map((x) => parseInt(x, 10));
        let s = 0;
        let idx = 0;
        while (idx < nums.length && nums[idx] !== 0) {
          s += nums[idx];
          idx += 1;
        }
        return String(s);
      },
      inputs: ['3\n5\n2\n0', '10\n0', '0', '1\n1\n1\n1\n0', '100\n200\n300\n0', '7\n8\n9\n10\n0'],
    },
    {
      key: '26',
      title: 'Lớn nhất tới khi gặp 0',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một dãy số nguyên dương, mỗi số một dòng, kết thúc bởi số `0`. Hãy tìm số lớn nhất trong dãy (trước số 0). Dãy luôn có ít nhất một số dương.',
      inputDesc: 'Nhiều dòng số nguyên dương, kết thúc bởi 0.',
      outputDesc: 'Một dòng: số lớn nhất trong dãy.',
      note: 'Đọc số đầu làm `mx`, `while x != 0:` cập nhật mx rồi đọc tiếp. Số 0 dừng vòng lặp.',
      solve: (input) => {
        const nums = input
          .trim()
          .split(/\s+/)
          .map((x) => parseInt(x, 10));
        let mx = 0;
        let idx = 0;
        while (idx < nums.length && nums[idx] !== 0) {
          if (nums[idx] > mx) mx = nums[idx];
          idx += 1;
        }
        return String(mx);
      },
      inputs: ['3\n9\n2\n0', '5\n0', '1\n2\n3\n4\n0', '100\n50\n75\n0', '7\n7\n7\n0', '1000000\n1\n0'],
    },
    {
      key: '27',
      title: 'Đếm số lần xuất hiện chữ số',
      difficulty: 'HARD',
      story:
        'Máy tính cho em số nguyên không âm `n` và một chữ số `d` (0 <= d <= 9). Hãy đếm chữ số `d` xuất hiện bao nhiêu lần trong `n`.\n\nVí dụ `n = 1212, d = 1` cho kết quả 2.',
      inputDesc: 'Một dòng chứa hai số `n` và `d` (0 <= n <= 1000000, 0 <= d <= 9).',
      outputDesc: 'Một dòng: số lần chữ số d xuất hiện trong n.',
      note: 'Với n = 0: chỉ có chữ số 0. Tách chữ số bằng `n % 10`, `n //= 10`, so sánh với d.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        let n = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        let dem = 0;
        if (n === 0) {
          return d === 0 ? '1' : '0';
        }
        while (n > 0) {
          if (n % 10 === d) dem += 1;
          n = Math.floor(n / 10);
        }
        return String(dem);
      },
      inputs: ['1212 1', '0 0', '0 5', '555 5', '1000000 0', '987654 3'],
    },
    {
      key: '28',
      title: 'Tổng bình phương tới n',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số `n`. Hãy tính tổng các bình phương `1*1 + 2*2 + ... + n*n` bằng while.\n\nVí dụ `n = 3`: `1 + 4 + 9 = 14`.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 1000).',
      outputDesc: 'Một dòng: tổng các bình phương từ 1 đến n.',
      note: 'Đặt `s = 0`, `i = 1`, `while i <= n: s += i*i; i += 1`.',
      solve: (input) => {
        const n = readInt(input);
        let s = 0;
        let i = 1;
        while (i <= n) {
          s += i * i;
          i += 1;
        }
        return String(s);
      },
      inputs: ['3', '1', '5', '10', '100', '1000'],
    },
    {
      key: '29',
      title: 'In các chữ số trên từng dòng',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in các chữ số của `n` theo đúng thứ tự từ trái sang phải, mỗi chữ số trên một dòng.\n\nVí dụ `n = 305` in ra:\n\n```\n3\n0\n5\n```',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Mỗi chữ số của n trên một dòng, theo thứ tự từ trái sang phải.',
      note: 'Tách bằng `n % 10` cho chữ số phải nhất nên cần gom vào danh sách rồi đảo lại khi in.',
      solve: (input) => {
        let n = readInt(input);
        if (n === 0) return '0';
        const digits: number[] = [];
        while (n > 0) {
          digits.push(n % 10);
          n = Math.floor(n / 10);
        }
        digits.reverse();
        return digits.join('\n');
      },
      inputs: ['305', '0', '7', '1000000', '42', '987654'],
    },
    {
      key: '30',
      title: 'Số đối xứng (palindrome)',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy kiểm tra `n` có phải số đối xứng không (đọc xuôi giống đọc ngược). In `YES` nếu đối xứng, ngược lại `NO`.\n\nVí dụ `121` là đối xứng, `123` thì không.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 1000000).',
      outputDesc: 'Một dòng: `YES` nếu n đối xứng, ngược lại `NO`.',
      note: 'Đảo ngược n bằng while (`kq = kq*10 + n%10; n //= 10`) rồi so sánh với n gốc.',
      solve: (input) => {
        const goc = readInt(input);
        let n = goc;
        let kq = 0;
        while (n > 0) {
          kq = kq * 10 + (n % 10);
          n = Math.floor(n / 10);
        }
        return kq === goc ? 'YES' : 'NO';
      },
      inputs: ['121', '123', '0', '7', '1000001', '987654'],
    },
  ],
};

export default course;

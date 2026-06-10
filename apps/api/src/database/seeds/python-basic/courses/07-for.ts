import { CourseSpec } from '../types';

/**
 * Course 07 — Vòng lặp for.
 * Mục tiêu: học sinh tiểu học làm quen với vòng lặp `for` cùng `range()`:
 * lặp lại công việc, đếm số, cộng dồn (accumulator), in bảng cửu chương...
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. Helper `firstInt` reads the first integer of stdin.
 */

const firstInt = (input: string): number => parseInt(input.trim().split(/\s+/)[0] ?? '0', 10);

const course: CourseSpec = {
  code: 'PYTHON-BASIC-07',
  title: 'Vòng lặp for',
  description:
    'Khóa học về vòng lặp for cùng range(): giúp em lặp lại công việc, đếm số và ' +
    'cộng dồn kết quả mà không phải gõ đi gõ lại nhiều lần!',
  tags: ['python', 'co-ban', 'for', 'vong-lap'],
  problems: [
    {
      key: '01',
      title: 'In từ 1 đến n (mỗi dòng một số)',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in ra các số từ `1` đến `n`, MỖI SỐ TRÊN MỘT DÒNG.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'n dòng, lần lượt là 1, 2, ..., n. Nếu n = 0 thì không in gì.',
      note: 'Dùng `for i in range(1, n+1):` rồi `print(i)`. range(1, n+1) chạy từ 1 tới n.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 1; i <= n; i++) out.push(String(i));
        return out.join('\n');
      },
      inputs: ['5', '1', '3', '0', '10', '7'],
    },
    {
      key: '02',
      title: 'In từ 1 đến n trên một dòng',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in ra các số từ `1` đến `n` TRÊN CÙNG MỘT DÒNG, các số cách nhau đúng một dấu cách.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa các số 1, 2, ..., n cách nhau bởi dấu cách. Nếu n = 0 thì in dòng trống.',
      note: 'Dồn các số vào một danh sách rồi nối lại bằng dấu cách, hoặc dùng print(i, end=" ").',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 1; i <= n; i++) out.push(String(i));
        return out.join(' ');
      },
      inputs: ['5', '1', '4', '0', '10', '8'],
    },
    {
      key: '03',
      title: 'Tổng từ 1 đến n',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy tính tổng `1 + 2 + ... + n` và in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng từ 1 đến n. Nếu n = 0 thì in `0`.',
      note: 'Mẫu cộng dồn: đặt `tong = 0`, sau đó `for i in range(1, n+1): tong = tong + i`.',
      solve: (input) => {
        const n = firstInt(input);
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += i;
        return String(sum);
      },
      inputs: ['5', '1', '10', '0', '100', '3'],
    },
    {
      key: '04',
      title: 'Tổng các số chẵn đến n',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy tính tổng các số CHẴN từ `2` đến `n` (gồm cả n nếu n chẵn) và in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng các số chẵn không vượt quá n.',
      note: 'Dùng `if i % 2 == 0:` để kiểm tra số chẵn, rồi cộng dồn vào biến tổng.',
      solve: (input) => {
        const n = firstInt(input);
        let sum = 0;
        for (let i = 1; i <= n; i++) if (i % 2 === 0) sum += i;
        return String(sum);
      },
      inputs: ['10', '1', '6', '0', '7', '20'],
    },
    {
      key: '05',
      title: 'Giai thừa n!',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n` (0 <= n <= 12). Hãy tính giai thừa `n! = 1 * 2 * ... * n` và in ra kết quả. Quy ước `0! = 1`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 12).',
      outputDesc: 'Một dòng chứa giá trị n!.',
      note: 'Mẫu cộng dồn cho phép nhân: đặt `tich = 1` rồi `for i in range(1, n+1): tich = tich * i`.',
      solve: (input) => {
        const n = firstInt(input);
        let p = 1;
        for (let i = 1; i <= n; i++) p *= i;
        return String(p);
      },
      inputs: ['5', '1', '0', '3', '10', '12'],
    },
    {
      key: '06',
      title: 'Đếm bội số của k đến n',
      difficulty: 'MEDIUM',
      story: 'Cho hai số nguyên `n` và `k` (k >= 1). Hãy đếm xem có bao nhiêu số trong khoảng từ `1` đến `n` là bội của `k` (chia hết cho k), rồi in ra số lượng đó.',
      inputDesc: 'Dòng 1: số nguyên `n` (n >= 0). Dòng 2: số nguyên `k` (k >= 1).',
      outputDesc: 'Một dòng chứa số lượng bội của k trong khoảng 1..n.',
      note: 'Số i là bội của k khi `i % k == 0`. Dùng biến đếm cộng dồn mỗi khi gặp một bội số.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        const n = parseInt(parts[0] ?? '0', 10);
        const k = parseInt(parts[1] ?? '1', 10);
        let cnt = 0;
        for (let i = 1; i <= n; i++) if (i % k === 0) cnt++;
        return String(cnt);
      },
      inputs: ['10\n2', '10\n3', '5\n1', '0\n4', '100\n7', '20\n5'],
    },
    {
      key: '07',
      title: 'Bảng cửu chương của n',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in bảng cửu chương của `n` gồm 10 dòng theo mẫu (với n = 2):\n\n```\n2 x 1 = 2\n2 x 2 = 4\n...\n2 x 10 = 20\n```',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: '10 dòng, dòng thứ i là `n x i = (n*i)` với i chạy từ 1 đến 10.',
      note: 'Dùng `for i in range(1, 11):` và in chuỗi ghép `n, "x", i, "=", n*i`.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 1; i <= 10; i++) out.push(`${n} x ${i} = ${n * i}`);
        return out.join('\n');
      },
      inputs: ['2', '5', '9', '1', '7', '3'],
    },
    {
      key: '08',
      title: 'Tổng của n số cho trước',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n`, sau đó là `n` số nguyên. Hãy tính tổng của n số đó và in ra kết quả.',
      inputDesc: 'Dòng 1: số nguyên `n` (n >= 0). Dòng 2: n số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'Một dòng chứa tổng của n số. Nếu n = 0 thì in `0`.',
      note: 'Đọc n trước, sau đó dùng vòng for đọc và cộng dồn từng số vào biến tổng.',
      solve: (input) => {
        const tokens = input.trim().split(/\s+/).filter((t) => t.length > 0);
        const n = parseInt(tokens[0] ?? '0', 10);
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += parseInt(tokens[i] ?? '0', 10);
        return String(sum);
      },
      inputs: ['3\n10 20 30', '1\n5', '5\n1 2 3 4 5', '0\n', '4\n100 200 300 400', '6\n2 4 6 8 10 12'],
    },
    {
      key: '09',
      title: 'In n dấu sao trên một dòng',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in ra `n` dấu sao `*` LIÊN TIẾP trên cùng một dòng (không có dấu cách giữa các sao).',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng gồm n dấu `*`. Nếu n = 0 thì in dòng trống.',
      note: 'Có thể dùng vòng for cộng dồn chuỗi, hoặc đơn giản `print("*" * n)`.',
      solve: (input) => {
        const n = firstInt(input);
        let s = '';
        for (let i = 0; i < n; i++) s += '*';
        return s;
      },
      inputs: ['5', '1', '3', '0', '10', '8'],
    },
    {
      key: '10',
      title: 'In bình phương từ 1 đến n',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in ra bình phương của các số từ `1` đến `n` (tức `1*1, 2*2, ...`), MỖI GIÁ TRỊ TRÊN MỘT DÒNG.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'n dòng, dòng thứ i là i*i. Nếu n = 0 thì không in gì.',
      note: 'Trong vòng `for i in range(1, n+1):` hãy in `i*i`.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 1; i <= n; i++) out.push(String(i * i));
        return out.join('\n');
      },
      inputs: ['5', '1', '3', '0', '10', '6'],
    },
    {
      key: '11',
      title: 'Tổng n số lẻ đầu tiên',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n`. Hãy tính tổng của `n` số LẺ đầu tiên: `1 + 3 + 5 + ...` (gồm n số) và in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng của n số lẻ đầu tiên. Nếu n = 0 thì in `0`.',
      note: 'Số lẻ thứ i là `2*i - 1`. Dùng `for i in range(1, n+1):` và cộng dồn `2*i - 1`.',
      solve: (input) => {
        const n = firstInt(input);
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += 2 * i - 1;
        return String(sum);
      },
      inputs: ['3', '1', '5', '0', '10', '7'],
    },
    {
      key: '12',
      title: 'Đếm ngược từ n về 1',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in ra các số từ `n` giảm dần về `1`, MỖI SỐ TRÊN MỘT DÒNG.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'n dòng: n, n-1, ..., 1. Nếu n = 0 thì không in gì.',
      note: 'Dùng `for i in range(n, 0, -1):` để đếm ngược. Bước nhảy -1 nghĩa là giảm dần.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = n; i >= 1; i--) out.push(String(i));
        return out.join('\n');
      },
      inputs: ['5', '1', '3', '0', '10', '6'],
    },
    {
      key: '13',
      title: 'Lặp lại một từ n lần',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n` ở dòng 1 và một từ ở dòng 2. Hãy in ra từ đó `n` lần, MỖI LẦN TRÊN MỘT DÒNG.',
      inputDesc: 'Dòng 1: số nguyên `n` (n >= 0). Dòng 2: một từ (không chứa dấu cách).',
      outputDesc: 'n dòng, mỗi dòng là từ đã cho. Nếu n = 0 thì không in gì.',
      note: 'Dùng vòng `for _ in range(n):` rồi in từ ở mỗi vòng lặp.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const n = parseInt((lines[0] ?? '0').trim(), 10);
        const word = (lines[1] ?? '').trim();
        const out: string[] = [];
        for (let i = 0; i < n; i++) out.push(word);
        return out.join('\n');
      },
      inputs: ['3\nMeo', '1\nXin', '4\nPython', '0\nGi', '5\nHi', '2\nVui'],
    },
    {
      key: '14',
      title: 'Tổng các số chia hết cho 3 đến n',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n`. Hãy tính tổng các số trong khoảng `1` đến `n` mà chia hết cho `3`, rồi in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng các số chia hết cho 3 trong khoảng 1..n.',
      note: 'Kiểm tra `i % 3 == 0` rồi cộng dồn vào biến tổng.',
      solve: (input) => {
        const n = firstInt(input);
        let sum = 0;
        for (let i = 1; i <= n; i++) if (i % 3 === 0) sum += i;
        return String(sum);
      },
      inputs: ['10', '1', '9', '0', '3', '30'],
    },
    {
      key: '15',
      title: 'In các số chẵn từ 2 đến n',
      difficulty: 'EASY',
      story: 'Cho số nguyên `n`. Hãy in ra các số CHẴN từ `2` đến `n` TRÊN CÙNG MỘT DÒNG, cách nhau bởi dấu cách.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa các số chẵn 2, 4, ... không vượt quá n. Nếu không có số nào thì in dòng trống.',
      note: 'Dùng `for i in range(2, n+1, 2):` — bước nhảy 2 sẽ tự đi qua các số chẵn.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 2; i <= n; i += 2) out.push(String(i));
        return out.join(' ');
      },
      inputs: ['10', '1', '8', '0', '15', '2'],
    },
    {
      key: '16',
      title: 'Tích các số từ 1 đến n bỏ qua bội của 3',
      difficulty: 'HARD',
      story: 'Cho số nguyên `n` (1 <= n <= 12). Hãy tính tích các số từ `1` đến `n` NHƯNG BỎ QUA những số chia hết cho `3`. In ra kết quả.',
      inputDesc: 'Một số nguyên `n` (1 <= n <= 12).',
      outputDesc: 'Một dòng chứa tích các số từ 1 đến n mà không chia hết cho 3.',
      note: 'Đặt `tich = 1`. Trong vòng for, nếu `i % 3 != 0` thì nhân i vào tich.',
      solve: (input) => {
        const n = firstInt(input);
        let p = 1;
        for (let i = 1; i <= n; i++) if (i % 3 !== 0) p *= i;
        return String(p);
      },
      inputs: ['5', '1', '6', '3', '10', '12'],
    },
    {
      key: '17',
      title: 'Đếm số lớn hơn ngưỡng',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n` và `m` ở dòng 1, sau đó là `n` số nguyên ở dòng 2. Hãy đếm xem có bao nhiêu số trong dãy LỚN HƠN `m`, rồi in ra số lượng đó.',
      inputDesc: 'Dòng 1: hai số `n` và `m`. Dòng 2: n số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'Một dòng chứa số lượng phần tử lớn hơn m.',
      note: 'Đọc n và m, rồi dùng vòng for duyệt n số; mỗi khi gặp số > m thì tăng biến đếm.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const head = (lines[0] ?? '').trim().split(/\s+/);
        const n = parseInt(head[0] ?? '0', 10);
        const m = parseInt(head[1] ?? '0', 10);
        const nums = (lines[1] ?? '').trim().split(/\s+/).filter((t) => t.length > 0);
        let cnt = 0;
        for (let i = 0; i < n; i++) if (parseInt(nums[i] ?? '0', 10) > m) cnt++;
        return String(cnt);
      },
      inputs: ['5 3\n1 4 3 7 2', '3 0\n-1 5 0', '4 10\n1 2 3 4', '1 0\n9', '6 5\n5 6 7 8 9 10', '5 100\n10 20 30 40 50'],
    },
    {
      key: '18',
      title: 'Tìm số lớn nhất trong n số',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n` ở dòng 1, sau đó là `n` số nguyên ở dòng 2. Hãy tìm và in ra SỐ LỚN NHẤT trong dãy. Bảo đảm n >= 1.',
      inputDesc: 'Dòng 1: số nguyên `n` (n >= 1). Dòng 2: n số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'Một dòng chứa số lớn nhất trong dãy.',
      note: 'Lấy số đầu làm lớn nhất tạm thời, rồi duyệt for; gặp số lớn hơn thì cập nhật.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const n = parseInt((lines[0] ?? '1').trim(), 10);
        const nums = (lines[1] ?? '').trim().split(/\s+/).filter((t) => t.length > 0);
        let best = parseInt(nums[0] ?? '0', 10);
        for (let i = 1; i < n; i++) {
          const v = parseInt(nums[i] ?? '0', 10);
          if (v > best) best = v;
        }
        return String(best);
      },
      inputs: ['5\n3 7 2 9 4', '1\n42', '4\n-1 -5 -3 -2', '3\n10 10 10', '6\n1 2 3 4 5 6', '5\n100 50 200 30 150'],
    },
    {
      key: '19',
      title: 'Hình tam giác sao',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n`. Hãy in ra một hình tam giác bằng dấu sao: dòng thứ i có đúng `i` dấu sao (với i từ 1 đến n).\n\nVí dụ n = 3:\n\n```\n*\n**\n***\n```',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'n dòng, dòng thứ i gồm i dấu `*`. Nếu n = 0 thì không in gì.',
      note: 'Dùng vòng for ngoài cho từng dòng, trong mỗi dòng tạo chuỗi gồm i dấu sao.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 1; i <= n; i++) out.push('*'.repeat(i));
        return out.join('\n');
      },
      inputs: ['3', '1', '5', '0', '4', '6'],
    },
    {
      key: '20',
      title: 'Tổng các chữ số của một số',
      difficulty: 'MEDIUM',
      story: 'Cho một số nguyên không âm `n`. Hãy tính TỔNG CÁC CHỮ SỐ của nó và in ra kết quả.\n\nVí dụ n = 123 thì tổng là 1 + 2 + 3 = 6.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng các chữ số của n.',
      note: 'Có thể duyệt từng ký tự của n bằng vòng for: `for c in str(n):` rồi cộng dồn `int(c)`.',
      solve: (input) => {
        const s = String(firstInt(input));
        let sum = 0;
        for (let i = 0; i < s.length; i++) {
          const c = s[i];
          if (c >= '0' && c <= '9') sum += c.charCodeAt(0) - 48;
        }
        return String(sum);
      },
      inputs: ['123', '0', '9', '1000', '99999', '4567'],
    },
    {
      key: '21',
      title: 'Lũy thừa a mũ b',
      difficulty: 'MEDIUM',
      story: 'Cho hai số nguyên `a` và `b` (0 <= b <= 12, a nhỏ). Hãy tính `a` mũ `b` (tức a nhân với chính nó b lần) và in ra kết quả. Quy ước `a^0 = 1`.',
      inputDesc: 'Dòng 1: số nguyên `a`. Dòng 2: số nguyên `b` (0 <= b <= 12).',
      outputDesc: 'Một dòng chứa giá trị a mũ b.',
      note: 'Đặt `kq = 1` rồi `for _ in range(b): kq = kq * a`. Đây là mẫu nhân dồn.',
      solve: (input) => {
        const lines = input.trim().split(/\s+/);
        const a = parseInt(lines[0] ?? '0', 10);
        const b = parseInt(lines[1] ?? '0', 10);
        let r = 1;
        for (let i = 0; i < b; i++) r *= a;
        return String(r);
      },
      inputs: ['2\n5', '3\n0', '5\n3', '10\n2', '2\n10', '1\n12'],
    },
    {
      key: '22',
      title: 'Trung bình cộng của n số (làm tròn xuống)',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n` ở dòng 1 (n >= 1), sau đó là `n` số nguyên. Hãy tính trung bình cộng của n số đó LÀM TRÒN XUỐNG (chia lấy phần nguyên) và in ra kết quả.',
      inputDesc: 'Dòng 1: số nguyên `n` (n >= 1). Dòng 2: n số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'Một dòng chứa trung bình cộng làm tròn xuống (tổng chia n lấy phần nguyên).',
      note: 'Cộng dồn tổng trước, sau đó dùng phép chia lấy phần nguyên `tong // n` trong Python.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const n = parseInt((lines[0] ?? '1').trim(), 10);
        const nums = (lines[1] ?? '').trim().split(/\s+/).filter((t) => t.length > 0);
        let sum = 0;
        for (let i = 0; i < n; i++) sum += parseInt(nums[i] ?? '0', 10);
        return String(Math.floor(sum / n));
      },
      inputs: ['3\n10 20 30', '1\n7', '4\n1 2 3 4', '5\n2 2 2 2 3', '2\n5 8', '6\n10 10 10 10 10 11'],
    },
    {
      key: '23',
      title: 'In hình chữ nhật sao',
      difficulty: 'MEDIUM',
      story: 'Cho hai số nguyên `h` và `w` (số dòng và số cột). Hãy in ra một hình chữ nhật đặc bằng dấu sao gồm `h` dòng, mỗi dòng có đúng `w` dấu sao liên tiếp.',
      inputDesc: 'Dòng 1: số nguyên `h` (h >= 0). Dòng 2: số nguyên `w` (w >= 0).',
      outputDesc: 'h dòng, mỗi dòng gồm w dấu `*`. Nếu h = 0 thì không in gì.',
      note: 'Dùng hai vòng for lồng nhau, hoặc dùng `"*" * w` cho mỗi dòng.',
      solve: (input) => {
        const lines = input.trim().split(/\s+/);
        const h = parseInt(lines[0] ?? '0', 10);
        const w = parseInt(lines[1] ?? '0', 10);
        const out: string[] = [];
        for (let i = 0; i < h; i++) out.push('*'.repeat(w));
        return out.join('\n');
      },
      inputs: ['2\n4', '3\n3', '1\n5', '0\n4', '4\n1', '3\n6'],
    },
    {
      key: '24',
      title: 'Đếm số chẵn và số lẻ',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n` ở dòng 1, sau đó là `n` số nguyên không âm. Hãy đếm số lượng số CHẴN và số lượng số LẺ, rồi in ra hai số đó (chẵn trước, lẻ sau) trên cùng một dòng cách nhau dấu cách.',
      inputDesc: 'Dòng 1: số nguyên `n` (n >= 0). Dòng 2: n số nguyên không âm cách nhau dấu cách.',
      outputDesc: 'Một dòng: số_lượng_chẵn số_lượng_lẻ. Nếu n = 0 thì in `0 0`.',
      note: 'Dùng hai biến đếm. Trong vòng for, nếu `x % 2 == 0` tăng đếm chẵn, ngược lại tăng đếm lẻ.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const n = parseInt((lines[0] ?? '0').trim(), 10);
        const nums = (lines[1] ?? '').trim().split(/\s+/).filter((t) => t.length > 0);
        let even = 0;
        let odd = 0;
        for (let i = 0; i < n; i++) {
          const v = parseInt(nums[i] ?? '0', 10);
          if (v % 2 === 0) even++;
          else odd++;
        }
        return even + ' ' + odd;
      },
      inputs: ['5\n1 2 3 4 5', '1\n8', '4\n2 4 6 8', '0\n', '6\n1 3 5 7 9 11', '3\n0 1 2'],
    },
    {
      key: '25',
      title: 'Tổng dãy 1 - 2 + 3 - 4 + ...',
      difficulty: 'HARD',
      story: 'Cho số nguyên `n`. Hãy tính tổng đan dấu `1 - 2 + 3 - 4 + ... ` đến số hạng thứ `n` (số lẻ thì cộng, số chẵn thì trừ) và in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng đan dấu. Nếu n = 0 thì in `0`.',
      note: 'Trong vòng for, nếu `i % 2 == 1` thì cộng i, ngược lại trừ i.',
      solve: (input) => {
        const n = firstInt(input);
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += i % 2 === 1 ? i : -i;
        return String(sum);
      },
      inputs: ['4', '1', '5', '0', '10', '7'],
    },
    {
      key: '26',
      title: 'In các số từ a đến b',
      difficulty: 'EASY',
      story: 'Cho hai số nguyên `a` và `b` (a <= b). Hãy in ra tất cả các số nguyên từ `a` đến `b` (gồm cả a và b) TRÊN CÙNG MỘT DÒNG, cách nhau bởi dấu cách.',
      inputDesc: 'Dòng 1: số nguyên `a`. Dòng 2: số nguyên `b` (a <= b).',
      outputDesc: 'Một dòng chứa các số từ a đến b cách nhau dấu cách.',
      note: 'Dùng `for i in range(a, b+1):` để bao gồm cả b.',
      solve: (input) => {
        const lines = input.trim().split(/\s+/);
        const a = parseInt(lines[0] ?? '0', 10);
        const b = parseInt(lines[1] ?? '0', 10);
        const out: string[] = [];
        for (let i = a; i <= b; i++) out.push(String(i));
        return out.join(' ');
      },
      inputs: ['1\n5', '3\n3', '0\n4', '-2\n2', '10\n15', '7\n9'],
    },
    {
      key: '27',
      title: 'Đếm chữ số của một số',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên không âm `n`. Hãy đếm xem `n` có bao nhiêu CHỮ SỐ và in ra kết quả. Quy ước số 0 có 1 chữ số.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa số chữ số của n.',
      note: 'Có thể duyệt `for c in str(n):` và đếm, hoặc chia n cho 10 nhiều lần.',
      solve: (input) => {
        const s = String(firstInt(input));
        let cnt = 0;
        for (let i = 0; i < s.length; i++) {
          const c = s[i];
          if (c >= '0' && c <= '9') cnt++;
        }
        return String(cnt);
      },
      inputs: ['123', '0', '7', '1000', '99999', '40'],
    },
    {
      key: '28',
      title: 'Tổng bình phương từ 1 đến n',
      difficulty: 'MEDIUM',
      story: 'Cho số nguyên `n`. Hãy tính tổng bình phương `1*1 + 2*2 + ... + n*n` và in ra kết quả.',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'Một dòng chứa tổng các bình phương từ 1 đến n. Nếu n = 0 thì in `0`.',
      note: 'Mẫu cộng dồn: `for i in range(1, n+1): tong = tong + i*i`.',
      solve: (input) => {
        const n = firstInt(input);
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += i * i;
        return String(sum);
      },
      inputs: ['3', '1', '5', '0', '10', '7'],
    },
    {
      key: '29',
      title: 'Dãy số tăng dần bậc thang',
      difficulty: 'HARD',
      story: 'Cho số nguyên `n`. Hãy in ra `n` dòng: dòng thứ i (từ 1 đến n) chứa các số từ `1` đến `i` cách nhau dấu cách.\n\nVí dụ n = 3:\n\n```\n1\n1 2\n1 2 3\n```',
      inputDesc: 'Một số nguyên `n` (n >= 0).',
      outputDesc: 'n dòng, dòng thứ i là các số 1..i cách nhau dấu cách. Nếu n = 0 thì không in gì.',
      note: 'Dùng hai vòng for lồng nhau: vòng ngoài chạy dòng i, vòng trong in các số từ 1 đến i.',
      solve: (input) => {
        const n = firstInt(input);
        const out: string[] = [];
        for (let i = 1; i <= n; i++) {
          const row: string[] = [];
          for (let j = 1; j <= i; j++) row.push(String(j));
          out.push(row.join(' '));
        }
        return out.join('\n');
      },
      inputs: ['3', '1', '4', '0', '5', '2'],
    },
    {
      key: '30',
      title: 'Đếm số ngày học để đạt mục tiêu',
      difficulty: 'HARD',
      story: 'Mỗi ngày em học được thêm một số điểm bằng đúng số thứ tự của ngày: ngày 1 được 1 điểm, ngày 2 được 2 điểm, ... (cộng dồn). Cho số nguyên `m` là mục tiêu điểm. Hãy tìm SỐ NGÀY ÍT NHẤT để tổng điểm đạt từ `m` trở lên, rồi in ra số ngày đó. Nếu m <= 0 thì cần 0 ngày.',
      inputDesc: 'Một số nguyên `m` (m >= 0).',
      outputDesc: 'Một dòng chứa số ngày ít nhất để tổng điểm cộng dồn >= m.',
      note: 'Cộng dồn tổng theo từng ngày trong vòng for; dừng (đếm ngày) ngay khi tổng >= m.',
      solve: (input) => {
        const m = firstInt(input);
        if (m <= 0) return '0';
        let sum = 0;
        let day = 0;
        while (sum < m) {
          day++;
          sum += day;
        }
        return String(day);
      },
      inputs: ['10', '1', '0', '6', '100', '15'],
    },
  ],
};

export default course;

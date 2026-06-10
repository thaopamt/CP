import { CourseSpec } from '../types';

/**
 * Course 03 — Phép toán số học.
 * Mục tiêu: học sinh tiểu học làm quen với các phép toán +, -, *, /, //, %, **
 * và thứ tự thực hiện phép tính. Tất cả kết quả đều là số nguyên hoặc chuỗi ASCII.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. Use INTEGER division `//` (Math.floor) so answers stay
 * integers; only use `%` on NON-NEGATIVE operands so JS `%` matches Python.
 */
const course: CourseSpec = {
  code: 'PYTHON-BASIC-03',
  title: 'Phép toán số học',
  description:
    'Khóa học về các phép toán số học trong Python: cộng, trừ, nhân, chia, ' +
    'chia lấy phần nguyên (//), chia lấy phần dư (%) và lũy thừa (**). ' +
    'Cùng nhau biến máy tính thành chiếc máy tính bỏ túi nào!',
  tags: ['python', 'co-ban', 'phep-toan', 'so-hoc'],
  problems: [
    {
      key: '01',
      title: 'Tổng hai số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Hãy tính và in ra tổng của chúng `a + b`.\n\nVí dụ: với `3` và `5` thì in ra `8`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra một số là tổng `a + b`.',
      note: 'Dùng phép cộng `+`. Đọc hai số bằng `a, b = map(int, input().split())`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(a + b);
      },
      inputs: ['3 5', '0 0', '10 20', '100 1', '99999 1', '50000 50000'],
    },
    {
      key: '02',
      title: 'Hiệu hai số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b` (với `a` luôn lớn hơn hoặc bằng `b`). Hãy tính và in ra hiệu `a - b`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra một số là hiệu `a - b`.',
      note: 'Dùng phép trừ `-`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(a - b);
      },
      inputs: ['10 3', '5 5', '20 0', '100 99', '99999 1', '12345 2345'],
    },
    {
      key: '03',
      title: 'Tích hai số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Hãy tính và in ra tích `a * b`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra một số là tích `a * b`.',
      note: 'Dùng phép nhân `*`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(a * b);
      },
      inputs: ['3 4', '0 9', '1 100', '12 12', '999 0', '300 300'],
    },
    {
      key: '04',
      title: 'Chia lấy phần nguyên',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b` (với `b` khác 0). Hãy in ra kết quả của phép chia lấy phần nguyên `a // b`.\n\nVí dụ: `17 // 5` bằng `3` vì 17 chia 5 được 3 (dư 2).',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra một số là `a // b`.',
      note: 'Phép `//` lấy phần nguyên của phép chia (bỏ phần dư).',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(Math.floor(a / b));
      },
      inputs: ['17 5', '10 2', '0 7', '100 3', '99999 100', '7 8'],
    },
    {
      key: '05',
      title: 'Chia lấy phần dư',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b` (với `b` khác 0). Hãy in ra phần dư của phép chia `a % b`.\n\nVí dụ: `17 % 5` bằng `2` vì 17 chia 5 dư 2.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra một số là `a % b`.',
      note: 'Phép `%` lấy phần dư của phép chia.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(a % b);
      },
      inputs: ['17 5', '10 2', '0 7', '100 3', '7 8', '99999 7'],
    },
    {
      key: '06',
      title: 'Bình phương của một số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy in ra bình phương của nó `n ** 2` (tức là `n * n`).\n\nVí dụ: với `5` thì in ra `25`.',
      inputDesc: 'Một dòng chứa số nguyên `n`.',
      outputDesc: 'In ra `n` mũ 2.',
      note: 'Có thể dùng `n ** 2` hoặc `n * n`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(n ** 2);
      },
      inputs: ['5', '0', '1', '12', '100', '316'],
    },
    {
      key: '07',
      title: 'Lập phương của một số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy in ra lập phương của nó `n ** 3` (tức là `n * n * n`).\n\nVí dụ: với `3` thì in ra `27`.',
      inputDesc: 'Một dòng chứa số nguyên `n`.',
      outputDesc: 'In ra `n` mũ 3.',
      note: 'Có thể dùng `n ** 3`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(n ** 3);
      },
      inputs: ['3', '0', '1', '10', '12', '100'],
    },
    {
      key: '08',
      title: 'Lũy thừa của 2',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy in ra `2` mũ `n`, tức là `2 ** n`.\n\nVí dụ: với `3` thì in ra `8` vì 2*2*2 = 8.',
      inputDesc: 'Một dòng chứa số nguyên `n` (từ 0 đến 16).',
      outputDesc: 'In ra `2` mũ `n`.',
      note: 'Phép lũy thừa trong Python là `**`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(2 ** n);
      },
      inputs: ['3', '0', '1', '10', '8', '16'],
    },
    {
      key: '09',
      title: 'Trung bình hai số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Hãy in ra trung bình của chúng, tính bằng phép chia lấy phần nguyên: `(a + b) // 2`.\n\nVí dụ: với `4` và `7` thì `(4 + 7) // 2 = 11 // 2 = 5`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra `(a + b) // 2`.',
      note: 'Dùng `//` để kết quả là số nguyên.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(Math.floor((a + b) / 2));
      },
      inputs: ['4 7', '10 10', '0 0', '3 8', '100 1', '99999 1'],
    },
    {
      key: '10',
      title: 'Trung bình ba số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy in ra trung bình của chúng tính bằng phép chia lấy phần nguyên: `(a + b + c) // 3`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra `(a + b + c) // 3`.',
      note: 'Cộng cả ba số rồi chia lấy phần nguyên cho 3.',
      solve: (input) => {
        const [a, b, c] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(Math.floor((a + b + c) / 3));
      },
      inputs: ['3 5 7', '10 10 10', '0 0 0', '1 2 3', '100 200 300', '99 1 1'],
    },
    {
      key: '11',
      title: 'Chu vi hình chữ nhật',
      difficulty: 'EASY',
      story:
        'Máy tính cho em chiều dài `a` và chiều rộng `b` của một hình chữ nhật. Hãy tính và in ra chu vi của nó: `(a + b) * 2`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra chu vi hình chữ nhật.',
      note: 'Chu vi = (dài + rộng) * 2.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String((a + b) * 2);
      },
      inputs: ['5 3', '10 10', '1 1', '100 50', '0 7', '999 1'],
    },
    {
      key: '12',
      title: 'Diện tích hình chữ nhật',
      difficulty: 'EASY',
      story:
        'Máy tính cho em chiều dài `a` và chiều rộng `b` của một hình chữ nhật. Hãy tính và in ra diện tích của nó: `a * b`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra diện tích hình chữ nhật.',
      note: 'Diện tích = dài * rộng.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(a * b);
      },
      inputs: ['5 3', '10 10', '1 1', '100 50', '0 7', '999 2'],
    },
    {
      key: '13',
      title: 'Diện tích hình vuông',
      difficulty: 'EASY',
      story:
        'Máy tính cho em độ dài cạnh `a` của một hình vuông. Hãy tính và in ra diện tích của nó: `a ** 2`.',
      inputDesc: 'Một dòng chứa số nguyên `a`.',
      outputDesc: 'In ra diện tích hình vuông.',
      note: 'Diện tích hình vuông = cạnh * cạnh.',
      solve: (input) => {
        const a = parseInt(input.trim(), 10);
        return String(a ** 2);
      },
      inputs: ['5', '1', '0', '10', '100', '300'],
    },
    {
      key: '14',
      title: 'Đổi giây ra phút',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số giây `s`. Hãy in ra số phút trọn vẹn có trong `s` giây, tính bằng `s // 60`.\n\nVí dụ: `130` giây bằng `2` phút (còn dư 10 giây).',
      inputDesc: 'Một dòng chứa số nguyên `s` (số giây).',
      outputDesc: 'In ra số phút trọn vẹn `s // 60`.',
      note: 'Một phút có 60 giây nên dùng `s // 60`.',
      solve: (input) => {
        const s = parseInt(input.trim(), 10);
        return String(Math.floor(s / 60));
      },
      inputs: ['130', '60', '59', '0', '3600', '12345'],
    },
    {
      key: '15',
      title: 'Phút và giây',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số giây `s`. Hãy in ra số phút và số giây còn lại, cách nhau một dấu cách, theo mẫu `phut giay`.\n\nVí dụ: `130` giây → `2 10` (2 phút 10 giây). Số phút là `s // 60`, số giây còn lại là `s % 60`.',
      inputDesc: 'Một dòng chứa số nguyên `s` (số giây).',
      outputDesc: 'In ra hai số: số phút và số giây còn lại, cách nhau một dấu cách.',
      note: 'Phút = `s // 60`, giây còn lại = `s % 60`.',
      solve: (input) => {
        const s = parseInt(input.trim(), 10);
        return Math.floor(s / 60) + ' ' + (s % 60);
      },
      inputs: ['130', '60', '59', '0', '3661', '12345'],
    },
    {
      key: '16',
      title: 'Chữ số hàng đơn vị',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra chữ số cuối cùng (hàng đơn vị) của nó, tính bằng `n % 10`.\n\nVí dụ: với `327` thì chữ số cuối là `7`.',
      inputDesc: 'Một dòng chứa số nguyên không âm `n`.',
      outputDesc: 'In ra chữ số hàng đơn vị của `n`.',
      note: 'Chữ số cuối cùng của một số là `n % 10`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(n % 10);
      },
      inputs: ['327', '5', '0', '10', '99999', '12340'],
    },
    {
      key: '17',
      title: 'Bỏ chữ số cuối',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra số nhận được khi xóa đi chữ số cuối cùng của `n`, tính bằng `n // 10`.\n\nVí dụ: với `327` thì kết quả là `32`.',
      inputDesc: 'Một dòng chứa số nguyên không âm `n`.',
      outputDesc: 'In ra `n // 10`.',
      note: 'Phép `n // 10` sẽ bỏ đi chữ số cuối cùng.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(Math.floor(n / 10));
      },
      inputs: ['327', '5', '0', '10', '99999', '12340'],
    },
    {
      key: '18',
      title: 'Tổng hai chữ số',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số `n` (từ 10 đến 99). Hãy in ra tổng hai chữ số của nó.\n\nVí dụ: với `47` thì in ra `11` vì 4 + 7 = 11. Chữ số hàng chục là `n // 10`, hàng đơn vị là `n % 10`.',
      inputDesc: 'Một dòng chứa số nguyên hai chữ số `n`.',
      outputDesc: 'In ra tổng hai chữ số của `n`.',
      note: 'Hàng chục = `n // 10`, hàng đơn vị = `n % 10`, rồi cộng lại.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(Math.floor(n / 10) + (n % 10));
      },
      inputs: ['47', '10', '99', '50', '23', '88'],
    },
    {
      key: '19',
      title: 'Đảo ngược số hai chữ số',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số `n` (từ 10 đến 99). Hãy in ra số nhận được khi đảo ngược hai chữ số.\n\nVí dụ: với `47` thì in ra `74`. Số đảo ngược bằng `(n % 10) * 10 + (n // 10)`.',
      inputDesc: 'Một dòng chứa số nguyên hai chữ số `n`.',
      outputDesc: 'In ra số đảo ngược của `n`.',
      note: 'Lấy hàng đơn vị làm hàng chục mới và ngược lại.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String((n % 10) * 10 + Math.floor(n / 10));
      },
      inputs: ['47', '10', '99', '50', '23', '88'],
    },
    {
      key: '20',
      title: 'Số chẵn hay lẻ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra `0` nếu `n` chẵn và `1` nếu `n` lẻ. Đó chính là `n % 2`.',
      inputDesc: 'Một dòng chứa số nguyên không âm `n`.',
      outputDesc: 'In ra `n % 2` (0 nếu chẵn, 1 nếu lẻ).',
      note: 'Số chẵn chia 2 dư 0, số lẻ chia 2 dư 1.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(n % 2);
      },
      inputs: ['4', '7', '0', '1', '100', '99999'],
    },
    {
      key: '21',
      title: 'Tổng và hiệu',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên `a` và `b` (với `a` lớn hơn hoặc bằng `b`). Hãy in ra tổng `a + b` và hiệu `a - b` trên cùng một dòng, cách nhau một dấu cách.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra hai số: `a + b` và `a - b`, cách nhau một dấu cách.',
      note: 'Tính riêng tổng và hiệu rồi in ra cùng dòng.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return (a + b) + ' ' + (a - b);
      },
      inputs: ['10 3', '5 5', '20 0', '100 1', '99999 1', '12345 2345'],
    },
    {
      key: '22',
      title: 'Thương và dư',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên `a` và `b` (với `b` khác 0). Hãy in ra thương `a // b` và phần dư `a % b` trên cùng một dòng, cách nhau một dấu cách.\n\nVí dụ: với `17` và `5` thì in ra `3 2`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'In ra hai số: `a // b` và `a % b`, cách nhau một dấu cách.',
      note: 'Dùng `//` cho thương và `%` cho phần dư.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return Math.floor(a / b) + ' ' + (a % b);
      },
      inputs: ['17 5', '10 2', '0 7', '100 3', '7 8', '99999 100'],
    },
    {
      key: '23',
      title: 'Thứ tự phép tính',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `a + b * c`.\n\nLưu ý: phép nhân được thực hiện trước phép cộng! Ví dụ: với `2 3 4` thì `2 + 3 * 4 = 2 + 12 = 14`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra giá trị của `a + b * c`.',
      note: 'Nhân trước, cộng sau (thứ tự ưu tiên của phép toán).',
      solve: (input) => {
        const [a, b, c] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(a + b * c);
      },
      inputs: ['2 3 4', '0 0 0', '1 1 1', '10 5 2', '100 10 10', '5 0 99'],
    },
    {
      key: '24',
      title: 'Dùng dấu ngoặc',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `(a + b) * c`.\n\nLưu ý dấu ngoặc làm phép cộng được thực hiện trước! Ví dụ: với `2 3 4` thì `(2 + 3) * 4 = 5 * 4 = 20`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'In ra giá trị của `(a + b) * c`.',
      note: 'Dấu ngoặc giúp tính phép cộng trước phép nhân.',
      solve: (input) => {
        const [a, b, c] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String((a + b) * c);
      },
      inputs: ['2 3 4', '0 0 0', '1 1 1', '10 5 2', '100 10 10', '5 5 99'],
    },
    {
      key: '25',
      title: 'Số kẹo chia đều',
      difficulty: 'MEDIUM',
      story:
        'Có `n` chiếc kẹo được chia đều cho `k` bạn (với `k` khác 0). Hãy in ra số kẹo mỗi bạn nhận được, tính bằng `n // k`.\n\nVí dụ: `10` kẹo chia cho `3` bạn thì mỗi bạn được `3` chiếc.',
      inputDesc: 'Một dòng chứa hai số nguyên `n` và `k` cách nhau một dấu cách.',
      outputDesc: 'In ra số kẹo mỗi bạn nhận được.',
      note: 'Chia đều dùng phép `//`.',
      solve: (input) => {
        const [n, k] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(Math.floor(n / k));
      },
      inputs: ['10 3', '12 4', '0 5', '7 7', '100 6', '99999 100'],
    },
    {
      key: '26',
      title: 'Số kẹo còn thừa',
      difficulty: 'MEDIUM',
      story:
        'Có `n` chiếc kẹo được chia đều cho `k` bạn (với `k` khác 0). Sau khi chia đều, hãy in ra số kẹo còn thừa lại, tính bằng `n % k`.\n\nVí dụ: `10` kẹo chia cho `3` bạn thì còn thừa `1` chiếc.',
      inputDesc: 'Một dòng chứa hai số nguyên `n` và `k` cách nhau một dấu cách.',
      outputDesc: 'In ra số kẹo còn thừa.',
      note: 'Số còn thừa sau khi chia đều là `n % k`.',
      solve: (input) => {
        const [n, k] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return String(n % k);
      },
      inputs: ['10 3', '12 4', '0 5', '7 7', '100 6', '99999 100'],
    },
    {
      key: '27',
      title: 'Tổng dãy số liên tiếp',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra tổng các số từ `1` đến `n`, tính bằng công thức `n * (n + 1) // 2`.\n\nVí dụ: với `5` thì `1 + 2 + 3 + 4 + 5 = 15`.',
      inputDesc: 'Một dòng chứa số nguyên không âm `n`.',
      outputDesc: 'In ra tổng các số từ 1 đến `n`.',
      note: 'Dùng công thức `n * (n + 1) // 2` để tính nhanh.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(Math.floor((n * (n + 1)) / 2));
      },
      inputs: ['5', '1', '0', '10', '100', '1000'],
    },
    {
      key: '28',
      title: 'Đổi tiền ra tờ',
      difficulty: 'HARD',
      story:
        'Em có `n` nghìn đồng và muốn đổi ra các tờ `10` nghìn. Hãy in ra số tờ `10` nghìn nhận được và số tiền lẻ còn lại, cách nhau một dấu cách.\n\nVí dụ: với `37` thì in ra `3 7` (3 tờ 10 nghìn và còn lẻ 7 nghìn).',
      inputDesc: 'Một dòng chứa số nguyên không âm `n`.',
      outputDesc: 'In ra hai số: số tờ 10 nghìn (`n // 10`) và tiền lẻ (`n % 10`).',
      note: 'Số tờ = `n // 10`, tiền lẻ = `n % 10`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return Math.floor(n / 10) + ' ' + (n % 10);
      },
      inputs: ['37', '10', '9', '0', '100', '99999'],
    },
    {
      key: '29',
      title: 'Giờ phút từ phút',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số phút `m`. Hãy in ra số giờ và số phút còn lại, cách nhau một dấu cách, theo mẫu `gio phut`.\n\nVí dụ: `130` phút → `2 10` (2 giờ 10 phút). Một giờ có 60 phút.',
      inputDesc: 'Một dòng chứa số nguyên không âm `m` (số phút).',
      outputDesc: 'In ra hai số: số giờ (`m // 60`) và số phút còn lại (`m % 60`).',
      note: 'Giờ = `m // 60`, phút còn lại = `m % 60`.',
      solve: (input) => {
        const m = parseInt(input.trim(), 10);
        return Math.floor(m / 60) + ' ' + (m % 60);
      },
      inputs: ['130', '60', '59', '0', '1440', '12345'],
    },
    {
      key: '30',
      title: 'Tổng ba chữ số',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số nguyên có đúng ba chữ số `n` (từ 100 đến 999). Hãy in ra tổng ba chữ số của nó.\n\nVí dụ: với `347` thì in ra `14` vì 3 + 4 + 7 = 14. Hàng trăm là `n // 100`, hàng chục là `(n // 10) % 10`, hàng đơn vị là `n % 10`.',
      inputDesc: 'Một dòng chứa số nguyên ba chữ số `n`.',
      outputDesc: 'In ra tổng ba chữ số của `n`.',
      note: 'Tách từng chữ số bằng kết hợp `//` và `%` rồi cộng lại.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        const tram = Math.floor(n / 100);
        const chuc = Math.floor(n / 10) % 10;
        const donvi = n % 10;
        return String(tram + chuc + donvi);
      },
      inputs: ['347', '100', '999', '500', '210', '888'],
    },
  ],
};

export default course;

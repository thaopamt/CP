import { CourseSpec } from '../types';

/**
 * Course 10 — Danh sách (list / mảng).
 * Mục tiêu: học sinh tiểu học làm quen với việc đọc một dãy số vào danh sách rồi
 * xử lý: tính tổng, lớn nhất, nhỏ nhất, đếm, trung bình, đảo ngược, sắp xếp...
 *
 * NOTE for authors: mirror this exact shape. Never write an expected output by
 * hand — return it from `solve(input)`. The first 3 inputs become visible
 * samples. Standard input layout for this course: line 1 = n (số lượng), line 2
 * = n số nguyên cách nhau bởi dấu cách.
 */

/** Đọc input theo bố cục chuẩn: token đầu là n, n token tiếp theo là các số. */
function readList(input: string): number[] {
  const tokens = input.trim().split(/\s+/).filter((t) => t.length > 0);
  const n = parseInt(tokens[0] ?? '0', 10);
  const arr: number[] = [];
  for (let i = 1; i <= n; i++) {
    arr.push(parseInt(tokens[i] ?? '0', 10));
  }
  return arr;
}

const course: CourseSpec = {
  code: 'PYTHON-BASIC-10',
  title: 'Danh sách',
  description:
    'Học cách dùng danh sách (mảng/list) để lưu nhiều số cùng lúc, rồi tính ' +
    'tổng, tìm số lớn nhất nhỏ nhất, đếm và sắp xếp. Mỗi số là một viên ngọc nhỏ!',
  tags: ['python', 'co-ban', 'danh-sach', 'list'],
  problems: [
    {
      key: '01',
      title: 'Tổng của dãy số',
      difficulty: 'EASY',
      story: 'Em được cho một dãy số. Hãy tính tổng của tất cả các số trong dãy.',
      inputDesc:
        'Dòng 1: số nguyên `n` (số lượng số). Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tổng của dãy.',
      note: 'Đọc dãy bằng `a = list(map(int, input().split()))` rồi dùng `sum(a)`.',
      solve: (input) => {
        const a = readList(input);
        return String(a.reduce((s, x) => s + x, 0));
      },
      inputs: ['5\n1 2 3 4 5', '1\n42', '3\n10 20 30', '4\n0 0 0 0', '6\n7 7 7 7 7 7', '2\n100 1'],
    },
    {
      key: '02',
      title: 'Số lớn nhất',
      difficulty: 'EASY',
      story: 'Trong dãy số được cho, hãy tìm số lớn nhất.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lớn nhất trong dãy.',
      note: 'Dùng `max(a)` với `a` là danh sách đã đọc.',
      solve: (input) => {
        const a = readList(input);
        return String(Math.max(...a));
      },
      inputs: ['5\n3 1 4 1 5', '1\n9', '4\n10 20 5 15', '3\n7 7 7', '6\n1 2 3 4 5 6', '2\n100 99'],
    },
    {
      key: '03',
      title: 'Số nhỏ nhất',
      difficulty: 'EASY',
      story: 'Trong dãy số được cho, hãy tìm số nhỏ nhất.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số nhỏ nhất trong dãy.',
      note: 'Dùng `min(a)`.',
      solve: (input) => {
        const a = readList(input);
        return String(Math.min(...a));
      },
      inputs: ['5\n3 1 4 1 5', '1\n9', '4\n10 20 5 15', '3\n7 7 7', '6\n6 5 4 3 2 1', '2\n100 99'],
    },
    {
      key: '04',
      title: 'Đếm số chẵn',
      difficulty: 'EASY',
      story: 'Hãy đếm xem trong dãy có bao nhiêu số chẵn.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lượng số chẵn trong dãy.',
      note: 'Một số là chẵn khi `x % 2 == 0`. Dùng vòng lặp để đếm.',
      solve: (input) => {
        const a = readList(input);
        return String(a.filter((x) => x % 2 === 0).length);
      },
      inputs: ['5\n1 2 3 4 5', '1\n8', '4\n2 4 6 8', '3\n1 3 5', '6\n0 1 2 3 4 5', '2\n7 10'],
    },
    {
      key: '05',
      title: 'Đếm số dương',
      difficulty: 'EASY',
      story: 'Dãy số có thể chứa cả số âm. Hãy đếm xem có bao nhiêu số dương (lớn hơn 0).',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên (có thể âm) cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lượng số dương trong dãy.',
      note: 'Số dương là số `x > 0`. Số 0 không tính là dương.',
      solve: (input) => {
        const a = readList(input);
        return String(a.filter((x) => x > 0).length);
      },
      inputs: ['5\n-1 2 -3 4 5', '1\n0', '4\n1 2 3 4', '3\n-1 -2 -3', '6\n0 0 5 -5 3 -3', '2\n-7 7'],
    },
    {
      key: '06',
      title: 'Trung bình cộng (phần nguyên)',
      difficulty: 'EASY',
      story: 'Hãy tính trung bình cộng của dãy số, nhưng chỉ lấy PHẦN NGUYÊN (làm tròn xuống).',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra phần nguyên của trung bình cộng (tổng chia n, lấy phần nguyên).',
      note: 'Dùng phép chia lấy phần nguyên `//`: `sum(a) // len(a)`.',
      solve: (input) => {
        const a = readList(input);
        const sum = a.reduce((s, x) => s + x, 0);
        return String(Math.floor(sum / a.length));
      },
      inputs: ['5\n1 2 3 4 5', '1\n42', '3\n10 20 30', '4\n1 1 1 2', '6\n5 5 5 5 5 5', '2\n7 8'],
    },
    {
      key: '07',
      title: 'In dãy đảo ngược',
      difficulty: 'EASY',
      story: 'Hãy in lại dãy số theo thứ tự ngược lại, các số cách nhau một dấu cách trên một dòng.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra `n` số theo thứ tự ngược lại, cách nhau một dấu cách, trên một dòng.',
      note: 'Có thể dùng `a[::-1]` hoặc `a.reverse()`. In bằng `print(*a)`.',
      solve: (input) => {
        const a = readList(input);
        return a.slice().reverse().join(' ');
      },
      inputs: ['5\n1 2 3 4 5', '1\n7', '3\n10 20 30', '4\n4 3 2 1', '6\n1 1 2 2 3 3', '2\n9 8'],
    },
    {
      key: '08',
      title: 'Vị trí số lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Hãy tìm VỊ TRÍ (đếm từ 1) của số lớn nhất trong dãy. Nếu có nhiều số lớn nhất bằng nhau, ' +
        'lấy vị trí xuất hiện ĐẦU TIÊN.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là vị trí (1-based) của số lớn nhất xuất hiện đầu tiên.',
      note: 'Tìm `m = max(a)` rồi dùng `a.index(m) + 1`.',
      solve: (input) => {
        const a = readList(input);
        const m = Math.max(...a);
        return String(a.indexOf(m) + 1);
      },
      inputs: ['5\n3 1 4 1 5', '1\n9', '4\n10 20 5 20', '3\n7 7 7', '6\n1 2 3 4 5 6', '2\n100 99'],
    },
    {
      key: '09',
      title: 'Tổng các vị trí chẵn',
      difficulty: 'MEDIUM',
      story:
        'Đánh số các phần tử của dãy bắt đầu từ chỉ số 0 (như trong Python). Hãy tính tổng các phần tử ' +
        'nằm ở vị trí có CHỈ SỐ CHẴN: 0, 2, 4, ...',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tổng các phần tử ở chỉ số 0, 2, 4, ...',
      note: 'Dùng `a[::2]` để lấy các phần tử ở chỉ số chẵn rồi `sum(...)`.',
      solve: (input) => {
        const a = readList(input);
        let s = 0;
        for (let i = 0; i < a.length; i += 2) s += a[i];
        return String(s);
      },
      inputs: ['5\n1 2 3 4 5', '1\n42', '4\n10 20 30 40', '3\n7 7 7', '6\n1 2 3 4 5 6', '2\n100 1'],
    },
    {
      key: '10',
      title: 'Đếm số bằng mục tiêu',
      difficulty: 'EASY',
      story:
        'Em được cho một dãy số và một số mục tiêu `t`. Hãy đếm xem trong dãy có bao nhiêu số bằng đúng `t`.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên. Dòng 3: số mục tiêu `t`.',
      outputDesc: 'In ra một số duy nhất là số lần `t` xuất hiện trong dãy.',
      note: 'Dùng `a.count(t)` sau khi đọc dãy `a` và số `t`.',
      solve: (input) => {
        const tokens = input.trim().split(/\s+/).filter((x) => x.length > 0);
        const n = parseInt(tokens[0], 10);
        const a: number[] = [];
        for (let i = 1; i <= n; i++) a.push(parseInt(tokens[i], 10));
        const t = parseInt(tokens[n + 1], 10);
        return String(a.filter((x) => x === t).length);
      },
      inputs: ['5\n1 2 2 3 2\n2', '1\n7\n7', '4\n1 2 3 4\n5', '3\n9 9 9\n9', '6\n1 1 2 2 3 3\n3', '2\n5 8\n5'],
    },
    {
      key: '11',
      title: 'Đếm số lẻ',
      difficulty: 'EASY',
      story: 'Hãy đếm xem trong dãy có bao nhiêu số lẻ.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lượng số lẻ trong dãy.',
      note: 'Một số là lẻ khi `x % 2 == 1`.',
      solve: (input) => {
        const a = readList(input);
        return String(a.filter((x) => x % 2 === 1).length);
      },
      inputs: ['5\n1 2 3 4 5', '1\n8', '4\n1 3 5 7', '3\n2 4 6', '6\n0 1 2 3 4 5', '2\n7 10'],
    },
    {
      key: '12',
      title: 'Hiệu lớn nhất nhỏ nhất',
      difficulty: 'EASY',
      story: 'Hãy tính hiệu giữa số lớn nhất và số nhỏ nhất trong dãy (lớn nhất trừ nhỏ nhất).',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là `max(a) - min(a)`.',
      note: 'Dùng `max(a) - min(a)`.',
      solve: (input) => {
        const a = readList(input);
        return String(Math.max(...a) - Math.min(...a));
      },
      inputs: ['5\n3 1 4 1 5', '1\n9', '4\n10 20 5 15', '3\n7 7 7', '6\n1 2 3 4 5 6', '2\n100 99'],
    },
    {
      key: '13',
      title: 'In hai số lớn nhất',
      difficulty: 'HARD',
      story:
        'Hãy in ra hai số LỚN NHẤT của dãy theo thứ tự giảm dần, cách nhau một dấu cách. ' +
        'Nếu có các số bằng nhau thì vẫn lấy theo giá trị (ví dụ dãy `5 5 3` cho ra `5 5`).',
      inputDesc:
        'Dòng 1: số nguyên `n` (luôn có `n >= 2`). Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra hai số lớn nhất theo thứ tự giảm dần, cách nhau một dấu cách.',
      note: 'Sắp xếp giảm dần `sorted(a, reverse=True)` rồi lấy hai phần tử đầu.',
      solve: (input) => {
        const a = readList(input);
        const sorted = a.slice().sort((x, y) => y - x);
        return sorted[0] + ' ' + sorted[1];
      },
      inputs: ['5\n3 1 4 1 5', '2\n9 3', '4\n10 20 5 15', '3\n5 5 3', '6\n1 2 3 4 5 6', '2\n100 99'],
    },
    {
      key: '14',
      title: 'Số lớn thứ hai',
      difficulty: 'HARD',
      story:
        'Hãy tìm GIÁ TRỊ lớn thứ hai trong dãy. Nếu nhiều phần tử trùng nhau thì vẫn xét theo vị trí ' +
        'trong dãy đã sắp xếp giảm dần (ví dụ `5 5 3` thì lớn thứ hai là `5`).',
      inputDesc:
        'Dòng 1: số nguyên `n` (luôn có `n >= 2`). Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là giá trị lớn thứ hai.',
      note: 'Sắp xếp giảm dần rồi lấy phần tử ở chỉ số 1.',
      solve: (input) => {
        const a = readList(input);
        const sorted = a.slice().sort((x, y) => y - x);
        return String(sorted[1]);
      },
      inputs: ['5\n3 1 4 1 5', '2\n9 3', '4\n10 20 5 15', '3\n5 5 3', '6\n6 5 4 3 2 1', '2\n100 99'],
    },
    {
      key: '15',
      title: 'Đếm số khác nhau',
      difficulty: 'HARD',
      story: 'Hãy đếm xem trong dãy có bao nhiêu giá trị KHÁC NHAU (các số trùng nhau chỉ tính một lần).',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lượng giá trị khác nhau.',
      note: 'Dùng `len(set(a))` để đếm số phần tử khác nhau.',
      solve: (input) => {
        const a = readList(input);
        return String(new Set(a).size);
      },
      inputs: ['5\n1 2 2 3 3', '1\n7', '4\n1 2 3 4', '3\n5 5 5', '6\n1 1 1 2 2 3', '2\n8 8'],
    },
    {
      key: '16',
      title: 'In các số lớn hơn trung bình',
      difficulty: 'HARD',
      story:
        'Hãy tính trung bình cộng (lấy phần nguyên bằng `//`) của dãy, rồi in ra các số LỚN HƠN ' +
        'trung bình đó theo đúng thứ tự xuất hiện, cách nhau một dấu cách. Nếu không có số nào, in ra dòng trống.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc:
        'In ra các số lớn hơn trung bình (phần nguyên), giữ nguyên thứ tự, cách nhau một dấu cách.',
      note: 'Tính `tb = sum(a) // len(a)` rồi lọc các phần tử `> tb`.',
      solve: (input) => {
        const a = readList(input);
        const tb = Math.floor(a.reduce((s, x) => s + x, 0) / a.length);
        return a.filter((x) => x > tb).join(' ');
      },
      inputs: ['5\n1 2 3 4 5', '1\n42', '4\n10 20 30 40', '3\n7 7 7', '6\n1 5 2 8 3 9', '2\n100 1'],
    },
    {
      key: '17',
      title: 'Sắp xếp tăng dần',
      difficulty: 'HARD',
      story: 'Hãy sắp xếp dãy số theo thứ tự TĂNG DẦN rồi in ra, các số cách nhau một dấu cách.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra `n` số đã sắp xếp tăng dần, cách nhau một dấu cách, trên một dòng.',
      note: 'Dùng `sorted(a)` rồi `print(*sorted(a))`.',
      solve: (input) => {
        const a = readList(input);
        return a.slice().sort((x, y) => x - y).join(' ');
      },
      inputs: ['5\n3 1 4 1 5', '1\n7', '4\n4 3 2 1', '3\n1 2 3', '6\n5 5 5 1 1 1', '2\n9 8'],
    },
    {
      key: '18',
      title: 'Sắp xếp giảm dần',
      difficulty: 'HARD',
      story: 'Hãy sắp xếp dãy số theo thứ tự GIẢM DẦN rồi in ra, các số cách nhau một dấu cách.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra `n` số đã sắp xếp giảm dần, cách nhau một dấu cách, trên một dòng.',
      note: 'Dùng `sorted(a, reverse=True)`.',
      solve: (input) => {
        const a = readList(input);
        return a.slice().sort((x, y) => y - x).join(' ');
      },
      inputs: ['5\n3 1 4 1 5', '1\n7', '4\n1 2 3 4', '3\n3 2 1', '6\n1 1 1 5 5 5', '2\n8 9'],
    },
    {
      key: '19',
      title: 'Tích của dãy số',
      difficulty: 'EASY',
      story: 'Hãy tính tích (nhân tất cả lại) của các số trong dãy.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tích của tất cả các số.',
      note: 'Dùng một biến `tich = 1` rồi nhân dần từng phần tử.',
      solve: (input) => {
        const a = readList(input);
        return String(a.reduce((s, x) => s * x, 1));
      },
      inputs: ['5\n1 2 3 4 5', '1\n7', '3\n2 2 2', '4\n1 1 1 1', '6\n1 2 1 2 1 2', '2\n10 0'],
    },
    {
      key: '20',
      title: 'Đếm số bằng số lớn nhất',
      difficulty: 'MEDIUM',
      story: 'Hãy tìm số lớn nhất trong dãy, rồi đếm xem có bao nhiêu phần tử bằng đúng số lớn nhất đó.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lần số lớn nhất xuất hiện.',
      note: 'Tính `m = max(a)` rồi `a.count(m)`.',
      solve: (input) => {
        const a = readList(input);
        const m = Math.max(...a);
        return String(a.filter((x) => x === m).length);
      },
      inputs: ['5\n3 5 4 5 5', '1\n9', '4\n10 20 5 20', '3\n7 7 7', '6\n1 2 3 4 5 6', '2\n100 99'],
    },
    {
      key: '21',
      title: 'Tổng các số chẵn',
      difficulty: 'EASY',
      story: 'Hãy tính tổng của tất cả các số CHẴN trong dãy. Nếu không có số chẵn, in ra 0.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tổng các số chẵn.',
      note: 'Cộng dồn các phần tử thỏa `x % 2 == 0`.',
      solve: (input) => {
        const a = readList(input);
        return String(a.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0));
      },
      inputs: ['5\n1 2 3 4 5', '1\n7', '4\n2 4 6 8', '3\n1 3 5', '6\n0 1 2 3 4 5', '2\n10 11'],
    },
    {
      key: '22',
      title: 'Khoảng cách tới vị trí nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Hãy tìm VỊ TRÍ (đếm từ 1) của số nhỏ nhất trong dãy. Nếu có nhiều số nhỏ nhất bằng nhau, ' +
        'lấy vị trí xuất hiện ĐẦU TIÊN.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là vị trí (1-based) của số nhỏ nhất xuất hiện đầu tiên.',
      note: 'Tìm `m = min(a)` rồi `a.index(m) + 1`.',
      solve: (input) => {
        const a = readList(input);
        const m = Math.min(...a);
        return String(a.indexOf(m) + 1);
      },
      inputs: ['5\n3 1 4 1 5', '1\n9', '4\n10 5 20 5', '3\n7 7 7', '6\n6 5 4 3 2 1', '2\n100 99'],
    },
    {
      key: '23',
      title: 'Tổng các vị trí lẻ',
      difficulty: 'MEDIUM',
      story:
        'Đánh số các phần tử của dãy bắt đầu từ chỉ số 0 (như trong Python). Hãy tính tổng các phần tử ' +
        'nằm ở vị trí có CHỈ SỐ LẺ: 1, 3, 5, ...',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tổng các phần tử ở chỉ số 1, 3, 5, ...',
      note: 'Dùng `a[1::2]` để lấy các phần tử ở chỉ số lẻ.',
      solve: (input) => {
        const a = readList(input);
        let s = 0;
        for (let i = 1; i < a.length; i += 2) s += a[i];
        return String(s);
      },
      inputs: ['5\n1 2 3 4 5', '1\n42', '4\n10 20 30 40', '3\n7 7 7', '6\n1 2 3 4 5 6', '2\n100 1'],
    },
    {
      key: '24',
      title: 'Đếm số bằng 0',
      difficulty: 'EASY',
      story: 'Hãy đếm xem trong dãy có bao nhiêu số bằng 0.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là số lượng số 0 trong dãy.',
      note: 'Dùng `a.count(0)`.',
      solve: (input) => {
        const a = readList(input);
        return String(a.filter((x) => x === 0).length);
      },
      inputs: ['5\n0 1 0 2 0', '1\n0', '4\n1 2 3 4', '3\n0 0 0', '6\n0 5 0 5 0 5', '2\n7 8'],
    },
    {
      key: '25',
      title: 'In các số chẵn theo thứ tự',
      difficulty: 'MEDIUM',
      story:
        'Hãy in ra các số CHẴN trong dãy theo đúng thứ tự xuất hiện, cách nhau một dấu cách trên một dòng. ' +
        'Nếu không có số chẵn nào, in ra dòng trống.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra các số chẵn giữ nguyên thứ tự, cách nhau một dấu cách.',
      note: 'Lọc các phần tử `x % 2 == 0` rồi in bằng `print(*ds)`.',
      solve: (input) => {
        const a = readList(input);
        return a.filter((x) => x % 2 === 0).join(' ');
      },
      inputs: ['5\n1 2 3 4 5', '1\n8', '4\n2 4 6 8', '3\n1 3 5', '6\n0 1 2 3 4 5', '2\n7 10'],
    },
    {
      key: '26',
      title: 'Tổng các số dương',
      difficulty: 'EASY',
      story:
        'Dãy số có thể chứa cả số âm. Hãy tính tổng của các số DƯƠNG (lớn hơn 0). Nếu không có, in ra 0.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên (có thể âm) cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tổng các số dương.',
      note: 'Cộng dồn các phần tử thỏa `x > 0`.',
      solve: (input) => {
        const a = readList(input);
        return String(a.filter((x) => x > 0).reduce((s, x) => s + x, 0));
      },
      inputs: ['5\n-1 2 -3 4 5', '1\n0', '4\n1 2 3 4', '3\n-1 -2 -3', '6\n0 0 5 -5 3 -3', '2\n-7 7'],
    },
    {
      key: '27',
      title: 'Số nhỏ nhất khác số lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Hãy in ra hai số trên một dòng cách nhau một dấu cách: số nhỏ nhất, rồi số lớn nhất của dãy.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra `min(a)` và `max(a)` cách nhau một dấu cách.',
      note: 'In bằng `print(min(a), max(a))`.',
      solve: (input) => {
        const a = readList(input);
        return Math.min(...a) + ' ' + Math.max(...a);
      },
      inputs: ['5\n3 1 4 1 5', '1\n9', '4\n10 20 5 15', '3\n7 7 7', '6\n6 5 4 3 2 1', '2\n100 99'],
    },
    {
      key: '28',
      title: 'Đếm số lớn hơn mục tiêu',
      difficulty: 'MEDIUM',
      story:
        'Em được cho một dãy số và một số mục tiêu `t`. Hãy đếm xem trong dãy có bao nhiêu số LỚN HƠN `t`.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên. Dòng 3: số mục tiêu `t`.',
      outputDesc: 'In ra một số duy nhất là số lượng phần tử lớn hơn `t`.',
      note: 'Đọc thêm `t = int(input())` rồi đếm các phần tử `> t`.',
      solve: (input) => {
        const tokens = input.trim().split(/\s+/).filter((x) => x.length > 0);
        const n = parseInt(tokens[0], 10);
        const a: number[] = [];
        for (let i = 1; i <= n; i++) a.push(parseInt(tokens[i], 10));
        const t = parseInt(tokens[n + 1], 10);
        return String(a.filter((x) => x > t).length);
      },
      inputs: ['5\n1 2 3 4 5\n3', '1\n7\n10', '4\n10 20 30 40\n25', '3\n5 5 5\n5', '6\n1 2 3 4 5 6\n0', '2\n8 2\n5'],
    },
    {
      key: '29',
      title: 'Tổng giá trị các số khác nhau',
      difficulty: 'HARD',
      story:
        'Hãy tính tổng của các GIÁ TRỊ khác nhau trong dãy (mỗi giá trị chỉ cộng một lần dù xuất hiện nhiều lần).',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'In ra một số duy nhất là tổng các giá trị khác nhau.',
      note: 'Dùng `sum(set(a))` để cộng các giá trị khác nhau.',
      solve: (input) => {
        const a = readList(input);
        const uniq = Array.from(new Set(a));
        return String(uniq.reduce((s, x) => s + x, 0));
      },
      inputs: ['5\n1 2 2 3 3', '1\n7', '4\n1 2 3 4', '3\n5 5 5', '6\n1 1 2 2 3 3', '2\n8 8'],
    },
    {
      key: '30',
      title: 'In dãy đã sắp xếp và tổng',
      difficulty: 'HARD',
      story:
        'Hãy in ra hai dòng: dòng 1 là dãy đã sắp xếp TĂNG DẦN (các số cách nhau một dấu cách), ' +
        'dòng 2 là tổng của cả dãy.',
      inputDesc:
        'Dòng 1: số nguyên `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.',
      outputDesc: 'Dòng 1: dãy đã sắp xếp tăng dần. Dòng 2: tổng của dãy.',
      note: 'Dùng `sorted(a)` cho dòng đầu và `sum(a)` cho dòng hai.',
      solve: (input) => {
        const a = readList(input);
        const sorted = a.slice().sort((x, y) => x - y);
        const sum = a.reduce((s, x) => s + x, 0);
        return sorted.join(' ') + '\n' + String(sum);
      },
      inputs: ['5\n3 1 4 1 5', '1\n7', '4\n4 3 2 1', '3\n1 2 3', '6\n5 5 5 1 1 1', '2\n9 8'],
    },
  ],
};

export default course;

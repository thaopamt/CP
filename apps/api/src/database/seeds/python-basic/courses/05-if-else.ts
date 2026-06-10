import { CourseSpec } from '../types';

/**
 * Course 05 — Câu lệnh if - else.
 * Mục tiêu: học sinh tiểu học làm quen với việc ra quyết định nhị phân bằng
 * if ... else. Mỗi bài LUÔN in ra đúng MỘT trong HAI kết quả.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. Mỗi solver luôn trả về một trong hai kết quả, không
 * bao giờ rỗng. Phép `%` chỉ dùng với số không âm; chia lấy nguyên dùng
 * Math.floor; không dùng số thực.
 */

/** Đọc số nguyên đầu tiên trên dòng đầu. */
const firstInt = (input: string): number => parseInt(input.trim().split(/\s+/)[0], 10);

/** Đọc tất cả số nguyên trên input (tách theo khoảng trắng/xuống dòng). */
const ints = (input: string): number[] =>
  input
    .trim()
    .split(/\s+/)
    .map((x) => parseInt(x, 10));

/** Đọc dòng chữ đầu tiên (đã trim). */
const firstLine = (input: string): string => (input.split('\n')[0] ?? '').trim();

const course: CourseSpec = {
  code: 'PYTHON-BASIC-05',
  title: 'Câu lệnh if - else',
  description:
    'Học cách ra quyết định với `if ... else`: chương trình sẽ chọn in ra một ' +
    'trong hai kết quả tùy theo điều kiện. Cùng tập cho máy tính biết suy nghĩ nhé!',
  tags: ['python', 'co-ban', 'if-else', 'dieu-kien'],
  problems: [
    {
      key: '01',
      title: 'Chẵn hay lẻ',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 2 thì in ra `CHAN`, ngược lại in ra `LE`.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra `CHAN` hoặc `LE`.',
      note: 'Dùng `if n % 2 == 0:` để kiểm tra chia hết cho 2.',
      solve: (input) => (firstInt(input) % 2 === 0 ? 'CHAN' : 'LE'),
      inputs: ['4', '7', '0', '10', '13', '100', '1'],
    },
    {
      key: '02',
      title: 'Dương hay âm',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n >= 0` thì coi là dương và in ra `DUONG`, ngược lại in ra `AM`.\n\nLưu ý: số 0 được coi là `DUONG`.',
      inputDesc: 'Một số nguyên `n` (có thể âm).',
      outputDesc: 'In ra `DUONG` hoặc `AM`.',
      note: 'Ranh giới: `n >= 0` là `DUONG`. Đừng quên số 0 nhé!',
      solve: (input) => (firstInt(input) >= 0 ? 'DUONG' : 'AM'),
      inputs: ['5', '-3', '0', '-100', '42', '-1', '7'],
    },
    {
      key: '03',
      title: 'Đậu hay trượt',
      difficulty: 'EASY',
      story:
        'Một bạn có điểm thi là số nguyên `diem` (từ 0 đến 10). Nếu `diem >= 5` thì in ra `DAU`, ngược lại in ra `TRUOT`.',
      inputDesc: 'Một số nguyên `diem` từ 0 đến 10.',
      outputDesc: 'In ra `DAU` hoặc `TRUOT`.',
      note: 'Ranh giới: đúng 5 điểm là `DAU`.',
      solve: (input) => (firstInt(input) >= 5 ? 'DAU' : 'TRUOT'),
      inputs: ['8', '3', '5', '10', '0', '4', '6'],
    },
    {
      key: '04',
      title: 'Số lớn hơn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Hãy in ra số lớn hơn trong hai số. Nếu hai số bằng nhau thì in ra giá trị chung đó.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b`.',
      outputDesc: 'In ra số lớn hơn (một con số).',
      note: 'Dùng `if a >= b:` thì in `a`, ngược lại in `b`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a >= b ? a : b);
      },
      inputs: ['3 5', '9 2', '4 4', '-1 -7', '0 8', '100 100', '6 5'],
    },
    {
      key: '05',
      title: 'Số nhỏ hơn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Hãy in ra số nhỏ hơn trong hai số. Nếu bằng nhau thì in ra giá trị chung đó.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b`.',
      outputDesc: 'In ra số nhỏ hơn (một con số).',
      note: 'Dùng `if a <= b:` thì in `a`, ngược lại in `b`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a <= b ? a : b);
      },
      inputs: ['3 5', '9 2', '4 4', '-1 -7', '0 8', '7 7', '6 5'],
    },
    {
      key: '06',
      title: 'Bằng nhau hay khác nhau',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Nếu hai số bằng nhau thì in ra `BANG NHAU`, ngược lại in ra `KHAC NHAU`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b`.',
      outputDesc: 'In ra `BANG NHAU` hoặc `KHAC NHAU`.',
      note: 'Dùng `if a == b:` để so sánh bằng.',
      solve: (input) => {
        const [a, b] = ints(input);
        return a === b ? 'BANG NHAU' : 'KHAC NHAU';
      },
      inputs: ['5 5', '3 8', '0 0', '-2 -2', '10 1', '7 7', '4 5'],
    },
    {
      key: '07',
      title: 'Chia hết cho 3',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 3 thì in ra `CHIA HET`, ngược lại in ra `KHONG`.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra `CHIA HET` hoặc `KHONG`.',
      note: 'Dùng `if n % 3 == 0:`.',
      solve: (input) => (firstInt(input) % 3 === 0 ? 'CHIA HET' : 'KHONG'),
      inputs: ['9', '7', '0', '12', '14', '3', '100'],
    },
    {
      key: '08',
      title: 'Người lớn hay trẻ em',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tuổi của một người là số nguyên không âm `tuoi`. Nếu `tuoi >= 18` thì in ra `NGUOI LON`, ngược lại in ra `TRE EM`.',
      inputDesc: 'Một số nguyên không âm `tuoi`.',
      outputDesc: 'In ra `NGUOI LON` hoặc `TRE EM`.',
      note: 'Ranh giới: đúng 18 tuổi là `NGUOI LON`.',
      solve: (input) => (firstInt(input) >= 18 ? 'NGUOI LON' : 'TRE EM'),
      inputs: ['20', '10', '18', '5', '60', '17', '18'],
    },
    {
      key: '09',
      title: 'Số 0 hay khác 0',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` bằng 0 thì in ra `KHONG`, ngược lại in ra `KHAC KHONG`.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In ra `KHONG` hoặc `KHAC KHONG`.',
      note: 'Dùng `if n == 0:`.',
      solve: (input) => (firstInt(input) === 0 ? 'KHONG' : 'KHAC KHONG'),
      inputs: ['0', '5', '-3', '100', '0', '-1', '9'],
    },
    {
      key: '10',
      title: 'Từ nào dài hơn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai từ: từ thứ nhất ở dòng 1, từ thứ hai ở dòng 2. Nếu từ thứ nhất dài hơn (hoặc bằng) thì in ra `TU 1`, ngược lại in ra `TU 2`.\n\nLưu ý: nếu dài bằng nhau thì in `TU 1`.',
      inputDesc: 'Dòng 1: từ thứ nhất. Dòng 2: từ thứ hai.',
      outputDesc: 'In ra `TU 1` hoặc `TU 2`.',
      note: 'Dùng `len(tu1)` để đếm số ký tự. Ranh giới: dài bằng nhau in `TU 1`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const a = (lines[0] ?? '').trim();
        const b = (lines[1] ?? '').trim();
        return a.length >= b.length ? 'TU 1' : 'TU 2';
      },
      inputs: ['meo\nvoi', 'python\nan', 'abc\nabc', 'hi\nhello', 'cat\ndog', 'meo\nme', 'a\nbb'],
    },
    {
      key: '11',
      title: 'Lớn hơn 100 không',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n > 100` thì in ra `LON`, ngược lại in ra `NHO`.\n\nLưu ý: đúng 100 vẫn coi là `NHO`.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In ra `LON` hoặc `NHO`.',
      note: 'Ranh giới: `n > 100`. Đúng 100 là `NHO`.',
      solve: (input) => (firstInt(input) > 100 ? 'LON' : 'NHO'),
      inputs: ['150', '50', '100', '101', '0', '99', '1000'],
    },
    {
      key: '12',
      title: 'Năm nhuận đơn giản',
      difficulty: 'MEDIUM',
      story:
        'Một cách kiểm tra năm nhuận đơn giản (chưa đầy đủ như thực tế): nếu năm `n` chia hết cho 4 thì coi là năm nhuận và in ra `NHUAN`, ngược lại in ra `THUONG`.',
      inputDesc: 'Một số nguyên dương `n` (năm).',
      outputDesc: 'In ra `NHUAN` hoặc `THUONG`.',
      note: 'Dùng `if n % 4 == 0:`.',
      solve: (input) => (firstInt(input) % 4 === 0 ? 'NHUAN' : 'THUONG'),
      inputs: ['2024', '2023', '2000', '2021', '2016', '2100', '2026'],
    },
    {
      key: '13',
      title: 'Đủ tiền mua không',
      difficulty: 'EASY',
      story:
        'Bạn có `tien` đồng và món đồ giá `gia` đồng. Nếu `tien >= gia` thì mua được, in ra `MUA DUOC`, ngược lại in ra `KHONG DU`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm: `tien` và `gia`.',
      outputDesc: 'In ra `MUA DUOC` hoặc `KHONG DU`.',
      note: 'Ranh giới: tiền bằng đúng giá thì vẫn `MUA DUOC`.',
      solve: (input) => {
        const [tien, gia] = ints(input);
        return tien >= gia ? 'MUA DUOC' : 'KHONG DU';
      },
      inputs: ['100 80', '50 70', '60 60', '0 5', '200 199', '30 30', '10 100'],
    },
    {
      key: '14',
      title: 'Số dương lẻ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` vừa lớn hơn 0 vừa là số lẻ thì in ra `DUNG`, ngược lại in ra `SAI`.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In ra `DUNG` hoặc `SAI`.',
      note: 'Số lẻ dương: `n > 0 and n % 2 == 1`. Với số âm hãy kiểm tra `n > 0` trước.',
      solve: (input) => {
        const n = firstInt(input);
        return n > 0 && n % 2 === 1 ? 'DUNG' : 'SAI';
      },
      inputs: ['7', '8', '0', '-3', '15', '2', '1'],
    },
    {
      key: '15',
      title: 'Hạng nhất hay không',
      difficulty: 'EASY',
      story:
        'Trong một cuộc thi, bạn về đích ở vị trí `hang` (số nguyên dương). Nếu `hang == 1` thì in ra `VO DICH`, ngược lại in ra `CO GANG`.',
      inputDesc: 'Một số nguyên dương `hang`.',
      outputDesc: 'In ra `VO DICH` hoặc `CO GANG`.',
      note: 'Dùng `if hang == 1:`.',
      solve: (input) => (firstInt(input) === 1 ? 'VO DICH' : 'CO GANG'),
      inputs: ['1', '2', '5', '10', '1', '3', '100'],
    },
    {
      key: '16',
      title: 'Nhiệt độ nóng hay lạnh',
      difficulty: 'EASY',
      story:
        'Máy tính cho em nhiệt độ `t` là số nguyên (độ C). Nếu `t >= 25` thì in ra `NONG`, ngược lại in ra `LANH`.',
      inputDesc: 'Một số nguyên `t` (có thể âm).',
      outputDesc: 'In ra `NONG` hoặc `LANH`.',
      note: 'Ranh giới: đúng 25 độ là `NONG`.',
      solve: (input) => (firstInt(input) >= 25 ? 'NONG' : 'LANH'),
      inputs: ['30', '20', '25', '-5', '40', '24', '0'],
    },
    {
      key: '17',
      title: 'Số có một chữ số không',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` nhỏ hơn 10 (chỉ có một chữ số) thì in ra `MOT CHU SO`, ngược lại in ra `NHIEU CHU SO`.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra `MOT CHU SO` hoặc `NHIEU CHU SO`.',
      note: 'Ranh giới: `n < 10`. Số 9 là một chữ số, số 10 là nhiều chữ số.',
      solve: (input) => (firstInt(input) < 10 ? 'MOT CHU SO' : 'NHIEU CHU SO'),
      inputs: ['5', '10', '0', '9', '100', '23', '7'],
    },
    {
      key: '18',
      title: 'Tổng chẵn hay lẻ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Tính tổng của chúng. Nếu tổng là số chẵn thì in ra `CHAN`, ngược lại in ra `LE`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'In ra `CHAN` hoặc `LE`.',
      note: 'Tính `tong = a + b` rồi kiểm tra `tong % 2 == 0`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return (a + b) % 2 === 0 ? 'CHAN' : 'LE';
      },
      inputs: ['3 5', '2 3', '0 0', '4 6', '7 8', '1 0', '10 11'],
    },
    {
      key: '19',
      title: 'Tam giác cân hay không',
      difficulty: 'MEDIUM',
      story:
        'Một tam giác có ba cạnh là các số nguyên dương `a`, `b`, `c`. Nếu có ít nhất hai cạnh bằng nhau thì in ra `CAN`, ngược lại in ra `THUONG`.',
      inputDesc: 'Một dòng chứa ba số nguyên dương `a`, `b`, `c`.',
      outputDesc: 'In ra `CAN` hoặc `THUONG`.',
      note: 'Có hai cạnh bằng nhau: `a == b or b == c or a == c`.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return a === b || b === c || a === c ? 'CAN' : 'THUONG';
      },
      inputs: ['3 3 5', '4 5 6', '7 7 7', '2 3 2', '5 6 7', '8 9 8', '1 2 3'],
    },
    {
      key: '20',
      title: 'Số chia hết cho cả 2 và 5',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho cả 2 và 5 thì in ra `CHIA HET`, ngược lại in ra `KHONG`.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In ra `CHIA HET` hoặc `KHONG`.',
      note: 'Chia hết cho cả 2 và 5 nghĩa là chia hết cho 10: `n % 10 == 0`.',
      solve: (input) => {
        const n = firstInt(input);
        return n % 2 === 0 && n % 5 === 0 ? 'CHIA HET' : 'KHONG';
      },
      inputs: ['10', '15', '0', '20', '7', '100', '4'],
    },
    {
      key: '21',
      title: 'Bạn nào cao hơn',
      difficulty: 'EASY',
      story:
        'Hai bạn An và Binh có chiều cao là số nguyên (cm): An cao `a`, Binh cao `b`. Nếu An cao hơn (hoặc bằng) thì in ra `AN`, ngược lại in ra `BINH`.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'In ra `AN` hoặc `BINH`.',
      note: 'Ranh giới: cao bằng nhau in `AN`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return a >= b ? 'AN' : 'BINH';
      },
      inputs: ['150 140', '130 145', '140 140', '160 159', '120 125', '155 155', '100 200'],
    },
    {
      key: '22',
      title: 'Trong khoảng hay ngoài',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` nằm trong khoảng từ 1 đến 10 (kể cả 1 và 10) thì in ra `TRONG`, ngược lại in ra `NGOAI`.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In ra `TRONG` hoặc `NGOAI`.',
      note: 'Dùng `if 1 <= n <= 10:`. Cả 1 và 10 đều là `TRONG`.',
      solve: (input) => {
        const n = firstInt(input);
        return n >= 1 && n <= 10 ? 'TRONG' : 'NGOAI';
      },
      inputs: ['5', '0', '1', '10', '11', '-3', '7'],
    },
    {
      key: '23',
      title: 'Có chứa chữ a không',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một từ chỉ gồm chữ thường. Nếu trong từ có chứa ký tự `a` thì in ra `CO`, ngược lại in ra `KHONG`.',
      inputDesc: 'Một dòng chứa một từ chữ thường.',
      outputDesc: 'In ra `CO` hoặc `KHONG`.',
      note: "Trong Python dùng `if 'a' in tu:`.",
      solve: (input) => (firstLine(input).includes('a') ? 'CO' : 'KHONG'),
      inputs: ['banana', 'meo', 'cat', 'python', 'an', 'voi', 'lap'],
    },
    {
      key: '24',
      title: 'Hiệu là số âm không',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Tính `a - b`. Nếu kết quả nhỏ hơn 0 thì in ra `AM`, ngược lại in ra `KHONG AM`.\n\nLưu ý: nếu hiệu bằng 0 thì in `KHONG AM`.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b`.',
      outputDesc: 'In ra `AM` hoặc `KHONG AM`.',
      note: 'Tính `hieu = a - b` rồi so `hieu < 0`. Hiệu bằng 0 là `KHONG AM`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return a - b < 0 ? 'AM' : 'KHONG AM';
      },
      inputs: ['3 5', '8 2', '4 4', '0 7', '10 1', '5 5', '1 100'],
    },
    {
      key: '25',
      title: 'Số chính phương nhỏ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n` (không quá 100). Nếu `n` là số chính phương (bằng bình phương của một số nguyên) thì in ra `CHINH PHUONG`, ngược lại in ra `KHONG`.\n\nVí dụ: 0, 1, 4, 9, 16, 25 ... là số chính phương.',
      inputDesc: 'Một số nguyên không âm `n` (0 đến 100).',
      outputDesc: 'In ra `CHINH PHUONG` hoặc `KHONG`.',
      note: 'Tính căn nguyên `r = floor(sqrt(n))` rồi kiểm tra `r * r == n`.',
      solve: (input) => {
        const n = firstInt(input);
        const r = Math.floor(Math.sqrt(n));
        return r * r === n ? 'CHINH PHUONG' : 'KHONG';
      },
      inputs: ['9', '10', '0', '16', '15', '1', '100'],
    },
    {
      key: '26',
      title: 'Giờ sáng hay chiều',
      difficulty: 'EASY',
      story:
        'Máy tính cho em giờ trong ngày là số nguyên `h` (từ 0 đến 23). Nếu `h < 12` thì in ra `SANG`, ngược lại in ra `CHIEU`.\n\nLưu ý: đúng 12 giờ coi là `CHIEU`.',
      inputDesc: 'Một số nguyên `h` từ 0 đến 23.',
      outputDesc: 'In ra `SANG` hoặc `CHIEU`.',
      note: 'Ranh giới: `h < 12` là `SANG`. 12 giờ là `CHIEU`.',
      solve: (input) => (firstInt(input) < 12 ? 'SANG' : 'CHIEU'),
      inputs: ['8', '15', '12', '0', '23', '11', '20'],
    },
    {
      key: '27',
      title: 'Bội số của nhau',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `a` chia hết cho `b` thì in ra `CHIA HET`, ngược lại in ra `KHONG`.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'In ra `CHIA HET` hoặc `KHONG`.',
      note: 'Dùng `if a % b == 0:`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return a % b === 0 ? 'CHIA HET' : 'KHONG';
      },
      inputs: ['12 3', '10 4', '8 8', '20 5', '7 2', '100 10', '9 4'],
    },
    {
      key: '28',
      title: 'Tổng có lớn hơn 10 không',
      difficulty: 'EASY',
      story:
        'Máy tính cho em ba số nguyên không âm `a`, `b`, `c`. Tính tổng. Nếu tổng lớn hơn 10 thì in ra `LON`, ngược lại in ra `NHO`.\n\nLưu ý: tổng đúng bằng 10 thì in `NHO`.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `a`, `b`, `c`.',
      outputDesc: 'In ra `LON` hoặc `NHO`.',
      note: 'Ranh giới: tổng `> 10`. Tổng bằng 10 là `NHO`.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return a + b + c > 10 ? 'LON' : 'NHO';
      },
      inputs: ['5 4 3', '1 2 3', '4 3 3', '0 0 0', '10 10 10', '5 5 1', '2 2 2'],
    },
    {
      key: '29',
      title: 'Số đối xứng hai chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n` có đúng hai chữ số (từ 10 đến 99). Nếu hai chữ số giống nhau (như 11, 22, 33...) thì in ra `DOI XUNG`, ngược lại in ra `KHONG`.',
      inputDesc: 'Một số nguyên `n` từ 10 đến 99.',
      outputDesc: 'In ra `DOI XUNG` hoặc `KHONG`.',
      note: 'Chữ số hàng chục: `n // 10`. Chữ số hàng đơn vị: `n % 10`. So sánh hai chữ số.',
      solve: (input) => {
        const n = firstInt(input);
        const chuc = Math.floor(n / 10);
        const donvi = n % 10;
        return chuc === donvi ? 'DOI XUNG' : 'KHONG';
      },
      inputs: ['11', '23', '22', '55', '10', '99', '48'],
    },
    {
      key: '30',
      title: 'Đậu loại giỏi hay chưa',
      difficulty: 'MEDIUM',
      story:
        'Một bạn có điểm trung bình là số nguyên `diem` (từ 0 đến 10). Nếu `diem >= 8` thì in ra `GIOI`, ngược lại in ra `CHUA GIOI`.\n\nLưu ý: đúng 8 điểm là `GIOI`.',
      inputDesc: 'Một số nguyên `diem` từ 0 đến 10.',
      outputDesc: 'In ra `GIOI` hoặc `CHUA GIOI`.',
      note: 'Ranh giới: `diem >= 8`. Đúng 8 điểm là `GIOI`.',
      solve: (input) => (firstInt(input) >= 8 ? 'GIOI' : 'CHUA GIOI'),
      inputs: ['9', '6', '8', '10', '0', '7', '5'],
    },
  ],
};

export default course;

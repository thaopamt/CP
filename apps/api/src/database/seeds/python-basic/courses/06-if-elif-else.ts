import { CourseSpec } from '../types';

/**
 * Course 06 — Câu lệnh if - elif - else.
 * Mục tiêu: học sinh tiểu học làm quen với cấu trúc rẽ nhánh nhiều trường hợp
 * bằng if / elif / else: phân loại số, điểm, ngày, tháng, tuổi...
 *
 * NOTE for authors of sibling course files: mirror the exact shape of 01-print.ts.
 * Never write an expected output by hand — return it from `solve(input)`. The first
 * 3 inputs become visible samples. Every problem here uses if/elif/else with >= 3
 * branches; the `inputs[]` exercise EVERY branch and include boundary values.
 * NO FLOATS: all score/grade classification uses integer thresholds. % uses
 * non-negative operands only; integer division uses Math.floor.
 */
const course: CourseSpec = {
  code: 'PYTHON-BASIC-06',
  title: 'Câu lệnh if - elif - else',
  description:
    'Học cách cho chương trình tự quyết định giữa nhiều lựa chọn bằng if - elif - else: ' +
    'phân loại số, xếp loại điểm, đoán ngày trong tuần và nhiều điều thú vị khác!',
  tags: ['python', 'co-ban', 'if-elif-else', 'dieu-kien'],
  problems: [
    {
      key: '01',
      title: 'Dấu của một số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Hãy cho biết số đó dương, âm hay bằng không:\n\n' +
        '- Nếu `n > 0` in `DUONG`.\n- Nếu `n < 0` in `AM`.\n- Nếu `n = 0` in `KHONG`.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng: `DUONG`, `AM` hoặc `KHONG`.',
      note: 'Dùng `if n > 0: ... elif n < 0: ... else: ...`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n > 0) return 'DUONG';
        else if (n < 0) return 'AM';
        else return 'KHONG';
      },
      inputs: ['5', '-3', '0', '1', '-1', '100', '-250'],
    },
    {
      key: '02',
      title: 'So sánh hai số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số `a` và `b`. Hãy so sánh:\n\n' +
        '- Nếu `a > b` in `LON HON`.\n- Nếu `a < b` in `NHO HON`.\n- Nếu `a = b` in `BANG NHAU`.',
      inputDesc: 'Hai số nguyên `a` và `b` trên cùng một dòng, cách nhau dấu cách.',
      outputDesc: 'Một dòng: `LON HON`, `NHO HON` hoặc `BANG NHAU`.',
      note: 'So sánh `a` với `b` bằng if/elif/else.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        if (a > b) return 'LON HON';
        else if (a < b) return 'NHO HON';
        else return 'BANG NHAU';
      },
      inputs: ['5 3', '2 7', '4 4', '10 10', '0 1', '-2 -5', '100 99'],
    },
    {
      key: '03',
      title: 'Chẵn, lẻ hay không',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số tự nhiên `n` (không âm). Hãy cho biết:\n\n' +
        '- Nếu `n = 0` in `KHONG`.\n- Nếu `n` chia hết cho 2 in `CHAN`.\n- Còn lại in `LE`.',
      inputDesc: 'Một số tự nhiên `n` (>= 0).',
      outputDesc: 'Một dòng: `KHONG`, `CHAN` hoặc `LE`.',
      note: 'Số chia hết cho 2 khi `n % 2 == 0`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n === 0) return 'KHONG';
        else if (n % 2 === 0) return 'CHAN';
        else return 'LE';
      },
      inputs: ['0', '4', '7', '2', '1', '100', '99'],
    },
    {
      key: '04',
      title: 'Xếp loại học lực',
      difficulty: 'MEDIUM',
      story:
        'Cô giáo cho em điểm tổng kết là một số nguyên từ 0 đến 10. Hãy xếp loại theo các mốc:\n\n' +
        '- Từ 9 trở lên (`>= 9`): `GIOI`.\n- Từ 7 đến 8 (`>= 7`): `KHA`.\n- Từ 5 đến 6 (`>= 5`): `TRUNG BINH`.\n- Dưới 5: `YEU`.',
      inputDesc: 'Một số nguyên `diem` từ 0 đến 10.',
      outputDesc: 'Một dòng: `GIOI`, `KHA`, `TRUNG BINH` hoặc `YEU`.',
      note: 'Kiểm tra mốc cao nhất trước rồi đi xuống dần.',
      solve: (input) => {
        const d = parseInt(input.trim(), 10);
        if (d >= 9) return 'GIOI';
        else if (d >= 7) return 'KHA';
        else if (d >= 5) return 'TRUNG BINH';
        else return 'YEU';
      },
      inputs: ['10', '8', '6', '3', '9', '7', '5', '4', '0'],
    },
    {
      key: '05',
      title: 'Ngày trong tuần',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số `n` từ 1 đến 7 chỉ thứ trong tuần. Hãy in ra tên thứ tương ứng (không dấu):\n\n' +
        '1 → `Thu Hai`, 2 → `Thu Ba`, 3 → `Thu Tu`, 4 → `Thu Nam`, 5 → `Thu Sau`, 6 → `Thu Bay`, 7 → `Chu Nhat`.',
      inputDesc: 'Một số nguyên `n` từ 1 đến 7.',
      outputDesc: 'Một dòng: tên thứ tương ứng.',
      note: 'Dùng nhiều nhánh elif cho từng giá trị.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n === 1) return 'Thu Hai';
        else if (n === 2) return 'Thu Ba';
        else if (n === 3) return 'Thu Tu';
        else if (n === 4) return 'Thu Nam';
        else if (n === 5) return 'Thu Sau';
        else if (n === 6) return 'Thu Bay';
        else return 'Chu Nhat';
      },
      inputs: ['1', '2', '7', '3', '4', '5', '6'],
    },
    {
      key: '06',
      title: 'Đèn giao thông',
      difficulty: 'EASY',
      story:
        'Em được cho một số: 1, 2 hoặc 3 chỉ màu đèn giao thông. Hãy in hành động:\n\n' +
        '- 1 (đèn đỏ) → `DUNG LAI`.\n- 2 (đèn vàng) → `CHAM LAI`.\n- 3 (đèn xanh) → `DI TIEP`.',
      inputDesc: 'Một số nguyên: 1, 2 hoặc 3.',
      outputDesc: 'Một dòng: `DUNG LAI`, `CHAM LAI` hoặc `DI TIEP`.',
      note: 'Mỗi màu đèn là một nhánh.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n === 1) return 'DUNG LAI';
        else if (n === 2) return 'CHAM LAI';
        else return 'DI TIEP';
      },
      inputs: ['1', '2', '3', '1', '3', '2', '1'],
    },
    {
      key: '07',
      title: 'Phân nhóm tuổi',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tuổi của một người (số nguyên không âm). Hãy phân nhóm:\n\n' +
        '- Dưới 6 tuổi (`< 6`): `MAM NON`.\n- Từ 6 đến 10 (`<= 10`): `TIEU HOC`.\n- Từ 11 đến 14 (`<= 14`): `THCS`.\n- Còn lại (`>= 15`): `THPT`.',
      inputDesc: 'Một số nguyên `tuoi` (>= 0).',
      outputDesc: 'Một dòng: `MAM NON`, `TIEU HOC`, `THCS` hoặc `THPT`.',
      note: 'Kiểm tra từ mốc nhỏ nhất, hoặc từ lớn xuống — chỉ cần thứ tự nhất quán.',
      solve: (input) => {
        const t = parseInt(input.trim(), 10);
        if (t < 6) return 'MAM NON';
        else if (t <= 10) return 'TIEU HOC';
        else if (t <= 14) return 'THCS';
        else return 'THPT';
      },
      inputs: ['3', '8', '12', '16', '6', '10', '11', '14', '15'],
    },
    {
      key: '08',
      title: 'Giá vé theo độ tuổi',
      difficulty: 'MEDIUM',
      story:
        'Một khu vui chơi tính giá vé theo tuổi (số nguyên không âm):\n\n' +
        '- Dưới 5 tuổi (`< 5`): miễn phí, in `0`.\n- Từ 5 đến 12 (`<= 12`): vé trẻ em, in `20`.\n- Từ 13 đến 59 (`<= 59`): vé người lớn, in `50`.\n- Từ 60 trở lên: vé người cao tuổi, in `30`.',
      inputDesc: 'Một số nguyên `tuoi` (>= 0).',
      outputDesc: 'Một dòng: giá vé là một số (0, 20, 50 hoặc 30).',
      note: 'Mỗi nhóm tuổi cho một giá vé khác nhau.',
      solve: (input) => {
        const t = parseInt(input.trim(), 10);
        if (t < 5) return '0';
        else if (t <= 12) return '20';
        else if (t <= 59) return '50';
        else return '30';
      },
      inputs: ['3', '8', '30', '65', '5', '12', '13', '59', '60'],
    },
    {
      key: '09',
      title: 'Số ngày trong tháng',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em số tháng `m` (từ 1 đến 12) của một năm KHÔNG nhuận. Hãy in số ngày của tháng đó:\n\n' +
        '- Tháng 2: `28`.\n- Các tháng 4, 6, 9, 11: `30`.\n- Các tháng còn lại: `31`.',
      inputDesc: 'Một số nguyên `m` từ 1 đến 12.',
      outputDesc: 'Một dòng: số ngày (28, 30 hoặc 31).',
      note: 'Có thể dùng `if m == 2: ... elif m == 4 or m == 6 or ...`.',
      solve: (input) => {
        const m = parseInt(input.trim(), 10);
        if (m === 2) return '28';
        else if (m === 4 || m === 6 || m === 9 || m === 11) return '30';
        else return '31';
      },
      inputs: ['2', '4', '1', '6', '9', '11', '12', '7', '3'],
    },
    {
      key: '10',
      title: 'Mùa trong năm',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em số tháng `m` (từ 1 đến 12). Theo cách chia mùa đơn giản, hãy in tên mùa:\n\n' +
        '- Tháng 3, 4, 5: `XUAN`.\n- Tháng 6, 7, 8: `HE`.\n- Tháng 9, 10, 11: `THU`.\n- Tháng 12, 1, 2: `DONG`.',
      inputDesc: 'Một số nguyên `m` từ 1 đến 12.',
      outputDesc: 'Một dòng: `XUAN`, `HE`, `THU` hoặc `DONG`.',
      note: 'Dùng toán tử `or` để gộp nhiều tháng vào một mùa.',
      solve: (input) => {
        const m = parseInt(input.trim(), 10);
        if (m === 3 || m === 4 || m === 5) return 'XUAN';
        else if (m === 6 || m === 7 || m === 8) return 'HE';
        else if (m === 9 || m === 10 || m === 11) return 'THU';
        else return 'DONG';
      },
      inputs: ['3', '6', '9', '12', '1', '2', '5', '8', '11'],
    },
    {
      key: '11',
      title: 'Phân loại tam giác theo cạnh',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên là độ dài ba cạnh của một tam giác (đề bài đảm bảo tạo thành tam giác). Hãy phân loại:\n\n' +
        '- Cả ba cạnh bằng nhau: `DEU`.\n- Đúng hai cạnh bằng nhau: `CAN`.\n- Ba cạnh khác nhau: `THUONG`.',
      inputDesc: 'Ba số nguyên `a b c` trên một dòng, cách nhau dấu cách.',
      outputDesc: 'Một dòng: `DEU`, `CAN` hoặc `THUONG`.',
      note: 'Tam giác đều thì cũng coi là một dạng riêng — kiểm tra `DEU` trước.',
      solve: (input) => {
        const [a, b, c] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        if (a === b && b === c) return 'DEU';
        else if (a === b || b === c || a === c) return 'CAN';
        else return 'THUONG';
      },
      inputs: ['3 3 3', '3 3 5', '3 4 5', '7 7 7', '5 8 5', '6 7 8', '4 4 6'],
    },
    {
      key: '12',
      title: 'Lớn nhất trong ba số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c` (đề bài đảm bảo không có hai số nào bằng nhau). ' +
        'Hãy in ra số lớn nhất.',
      inputDesc: 'Ba số nguyên `a b c` trên một dòng.',
      outputDesc: 'Một dòng: số lớn nhất trong ba số.',
      note: 'Dùng if/elif so sánh `a` với `b` và `c`.',
      solve: (input) => {
        const [a, b, c] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        if (a > b && a > c) return String(a);
        else if (b > c) return String(b);
        else return String(c);
      },
      inputs: ['3 7 5', '9 2 4', '1 6 8', '10 5 3', '2 9 4', '5 1 7', '-3 -1 -2'],
    },
    {
      key: '13',
      title: 'Điểm thưởng đánh giá',
      difficulty: 'MEDIUM',
      story:
        'Một trò chơi tính số sao thưởng dựa trên điểm số nguyên từ 0 đến 100:\n\n' +
        '- Từ 90 trở lên (`>= 90`): `3`.\n- Từ 70 đến 89 (`>= 70`): `2`.\n- Từ 50 đến 69 (`>= 50`): `1`.\n- Dưới 50: `0`.',
      inputDesc: 'Một số nguyên `diem` từ 0 đến 100.',
      outputDesc: 'Một dòng: số sao (0, 1, 2 hoặc 3).',
      note: 'Dùng các mốc số nguyên, kiểm tra từ cao xuống thấp.',
      solve: (input) => {
        const d = parseInt(input.trim(), 10);
        if (d >= 90) return '3';
        else if (d >= 70) return '2';
        else if (d >= 50) return '1';
        else return '0';
      },
      inputs: ['95', '80', '60', '20', '90', '70', '50', '49', '100'],
    },
    {
      key: '14',
      title: 'Nhiệt độ thời tiết',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em nhiệt độ là một số nguyên (độ C). Hãy mô tả thời tiết:\n\n' +
        '- Dưới 10 độ (`< 10`): `LANH`.\n- Từ 10 đến 25 (`<= 25`): `MAT`.\n- Từ 26 đến 35 (`<= 35`): `AM`.\n- Trên 35: `NONG`.',
      inputDesc: 'Một số nguyên `nhiet_do` (có thể âm).',
      outputDesc: 'Một dòng: `LANH`, `MAT`, `AM` hoặc `NONG`.',
      note: 'Chú ý các mốc biên 10, 25, 35.',
      solve: (input) => {
        const t = parseInt(input.trim(), 10);
        if (t < 10) return 'LANH';
        else if (t <= 25) return 'MAT';
        else if (t <= 35) return 'AM';
        else return 'NONG';
      },
      inputs: ['5', '20', '30', '40', '10', '25', '26', '35', '-2'],
    },
    {
      key: '15',
      title: 'Phân loại chữ cái',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số `n` là mã của một ký tự. Quy ước đơn giản:\n\n' +
        '- Nếu `n` từ 65 đến 90 (`<= 90`): `HOA` (chữ in hoa).\n- Nếu `n` từ 97 đến 122 (`<= 122`): `THUONG` (chữ thường).\n- Nếu `n` từ 48 đến 57 (`<= 57`): `SO` (chữ số).\n- Còn lại: `KHAC`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 200).',
      outputDesc: 'Một dòng: `HOA`, `THUONG`, `SO` hoặc `KHAC`.',
      note: 'Dùng điều kiện kép như `if 65 <= n <= 90:`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n >= 65 && n <= 90) return 'HOA';
        else if (n >= 97 && n <= 122) return 'THUONG';
        else if (n >= 48 && n <= 57) return 'SO';
        else return 'KHAC';
      },
      inputs: ['65', '97', '48', '35', '90', '122', '57', '100', '200'],
    },
    {
      key: '16',
      title: 'Chia hết cho 3 và 5',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số tự nhiên `n` (>= 1). Hãy kiểm tra:\n\n' +
        '- Nếu `n` chia hết cho cả 3 và 5: `FIZZBUZZ`.\n- Nếu chỉ chia hết cho 3: `FIZZ`.\n- Nếu chỉ chia hết cho 5: `BUZZ`.\n- Còn lại: in lại số `n`.',
      inputDesc: 'Một số tự nhiên `n` (>= 1).',
      outputDesc: 'Một dòng: `FIZZBUZZ`, `FIZZ`, `BUZZ` hoặc số `n`.',
      note: 'Kiểm tra trường hợp chia hết cho cả hai TRƯỚC.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n % 3 === 0 && n % 5 === 0) return 'FIZZBUZZ';
        else if (n % 3 === 0) return 'FIZZ';
        else if (n % 5 === 0) return 'BUZZ';
        else return String(n);
      },
      inputs: ['15', '9', '10', '7', '30', '3', '5', '1', '20'],
    },
    {
      key: '17',
      title: 'Xếp hạng đua xe',
      difficulty: 'EASY',
      story:
        'Máy tính cho em thứ hạng `n` của một tay đua (số nguyên >= 1). Hãy in huy chương:\n\n' +
        '- Hạng 1: `VANG`.\n- Hạng 2: `BAC`.\n- Hạng 3: `DONG`.\n- Từ hạng 4 trở đi: `KHONG CO`.',
      inputDesc: 'Một số nguyên `n` (>= 1).',
      outputDesc: 'Một dòng: `VANG`, `BAC`, `DONG` hoặc `KHONG CO`.',
      note: 'Ba hạng đầu có huy chương, còn lại thì không.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n === 1) return 'VANG';
        else if (n === 2) return 'BAC';
        else if (n === 3) return 'DONG';
        else return 'KHONG CO';
      },
      inputs: ['1', '2', '3', '4', '10', '5', '1'],
    },
    {
      key: '18',
      title: 'Khoảng của con số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n` từ 0 đến 999. Hãy cho biết nó có mấy chữ số:\n\n' +
        '- Nếu `n <= 9`: `1 CHU SO`.\n- Nếu `n <= 99`: `2 CHU SO`.\n- Còn lại: `3 CHU SO`.',
      inputDesc: 'Một số nguyên `n` (0 <= n <= 999).',
      outputDesc: 'Một dòng: `1 CHU SO`, `2 CHU SO` hoặc `3 CHU SO`.',
      note: 'Kiểm tra mốc 9 rồi 99 rồi đến phần còn lại.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n <= 9) return '1 CHU SO';
        else if (n <= 99) return '2 CHU SO';
        else return '3 CHU SO';
      },
      inputs: ['5', '42', '700', '9', '10', '99', '100', '0', '999'],
    },
    {
      key: '19',
      title: 'Năm nhuận hay không',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một năm `y` (số nguyên dương). Một năm là năm NHUẬN nếu:\n\n' +
        '- Chia hết cho 400 → nhuận.\n- Hoặc chia hết cho 4 nhưng KHÔNG chia hết cho 100 → nhuận.\n- Các trường hợp còn lại → không nhuận.\n\n' +
        'In `NHUAN` nếu là năm nhuận, ngược lại in `KHONG`.',
      inputDesc: 'Một số nguyên dương `y`.',
      outputDesc: 'Một dòng: `NHUAN` hoặc `KHONG`.',
      note: 'Quy tắc: chia hết 400, hoặc (chia hết 4 và không chia hết 100).',
      solve: (input) => {
        const y = parseInt(input.trim(), 10);
        if (y % 400 === 0) return 'NHUAN';
        else if (y % 100 === 0) return 'KHONG';
        else if (y % 4 === 0) return 'NHUAN';
        else return 'KHONG';
      },
      inputs: ['2000', '1900', '2024', '2023', '2400', '2100', '2016', '2019', '1600'],
    },
    {
      key: '20',
      title: 'Phép tính theo lựa chọn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số phép `op` (1, 2 hoặc 3) rồi đến hai số nguyên `a` và `b`. Hãy tính:\n\n' +
        '- `op = 1`: in `a + b`.\n- `op = 2`: in `a - b`.\n- `op = 3`: in `a * b`.',
      inputDesc: 'Ba số nguyên `op a b` trên một dòng, cách nhau dấu cách.',
      outputDesc: 'Một dòng: kết quả phép tính.',
      note: 'Mỗi giá trị `op` ứng với một phép tính.',
      solve: (input) => {
        const [op, a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        if (op === 1) return String(a + b);
        else if (op === 2) return String(a - b);
        else return String(a * b);
      },
      inputs: ['1 3 4', '2 10 3', '3 5 6', '1 0 0', '2 2 9', '3 7 0', '1 -2 5'],
    },
    {
      key: '21',
      title: 'Phân loại BMI thiếu nhi (số nguyên)',
      difficulty: 'MEDIUM',
      story:
        'Để tránh số thập phân, ta dùng một chỉ số sức khỏe `chi_so` là số nguyên từ 0 đến 100. Phân loại:\n\n' +
        '- Dưới 18 (`< 18`): `GAY`.\n- Từ 18 đến 24 (`<= 24`): `BINH THUONG`.\n- Từ 25 đến 29 (`<= 29`): `THUA CAN`.\n- Từ 30 trở lên: `BEO PHI`.',
      inputDesc: 'Một số nguyên `chi_so` (0 <= chi_so <= 100).',
      outputDesc: 'Một dòng: `GAY`, `BINH THUONG`, `THUA CAN` hoặc `BEO PHI`.',
      note: 'Các mốc đều là số nguyên: 18, 24, 29.',
      solve: (input) => {
        const c = parseInt(input.trim(), 10);
        if (c < 18) return 'GAY';
        else if (c <= 24) return 'BINH THUONG';
        else if (c <= 29) return 'THUA CAN';
        else return 'BEO PHI';
      },
      inputs: ['15', '20', '27', '35', '18', '24', '25', '29', '30'],
    },
    {
      key: '22',
      title: 'Vùng của điểm trên trục số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `x`. Hãy cho biết nó thuộc vùng nào:\n\n' +
        '- `x < -10`: `RAT NHO`.\n- `-10 <= x < 0`: `NHO`.\n- `x == 0`: `GOC`.\n- `0 < x <= 10`: `LON`.\n- `x > 10`: `RAT LON`.',
      inputDesc: 'Một số nguyên `x`.',
      outputDesc: 'Một dòng: `RAT NHO`, `NHO`, `GOC`, `LON` hoặc `RAT LON`.',
      note: 'Năm nhánh — chú ý các mốc -10, 0 và 10.',
      solve: (input) => {
        const x = parseInt(input.trim(), 10);
        if (x < -10) return 'RAT NHO';
        else if (x < 0) return 'NHO';
        else if (x === 0) return 'GOC';
        else if (x <= 10) return 'LON';
        else return 'RAT LON';
      },
      inputs: ['-20', '-5', '0', '7', '15', '-10', '10', '1', '-1'],
    },
    {
      key: '23',
      title: 'Bội số chung',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số tự nhiên `n` (>= 1). Hãy kiểm tra tính chia hết:\n\n' +
        '- Nếu chia hết cho cả 2 và 3: `CA HAI`.\n- Nếu chỉ chia hết cho 2: `CHIA 2`.\n- Nếu chỉ chia hết cho 3: `CHIA 3`.\n- Còn lại: `KHONG`.',
      inputDesc: 'Một số tự nhiên `n` (>= 1).',
      outputDesc: 'Một dòng: `CA HAI`, `CHIA 2`, `CHIA 3` hoặc `KHONG`.',
      note: 'Kiểm tra chia hết cho cả hai trước tiên.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n % 2 === 0 && n % 3 === 0) return 'CA HAI';
        else if (n % 2 === 0) return 'CHIA 2';
        else if (n % 3 === 0) return 'CHIA 3';
        else return 'KHONG';
      },
      inputs: ['6', '4', '9', '7', '12', '8', '15', '1', '30'],
    },
    {
      key: '24',
      title: 'Tốc độ và mức phạt',
      difficulty: 'MEDIUM',
      story:
        'Một con đường giới hạn tốc độ 60. Máy tính cho em tốc độ `v` (số nguyên >= 0) của một xe. Hãy in mức:\n\n' +
        '- `v <= 60`: `AN TOAN`.\n- `61 <= v <= 80`: `CANH BAO`.\n- `81 <= v <= 100`: `PHAT NHE`.\n- `v > 100`: `PHAT NANG`.',
      inputDesc: 'Một số nguyên `v` (>= 0).',
      outputDesc: 'Một dòng: `AN TOAN`, `CANH BAO`, `PHAT NHE` hoặc `PHAT NANG`.',
      note: 'Các mốc 60, 80, 100 đều là biên.',
      solve: (input) => {
        const v = parseInt(input.trim(), 10);
        if (v <= 60) return 'AN TOAN';
        else if (v <= 80) return 'CANH BAO';
        else if (v <= 100) return 'PHAT NHE';
        else return 'PHAT NANG';
      },
      inputs: ['50', '70', '90', '120', '60', '80', '100', '61', '0'],
    },
    {
      key: '25',
      title: 'Quý trong năm',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em số tháng `m` (từ 1 đến 12). Một năm chia thành 4 quý. Hãy in:\n\n' +
        '- Tháng 1, 2, 3: `QUY 1`.\n- Tháng 4, 5, 6: `QUY 2`.\n- Tháng 7, 8, 9: `QUY 3`.\n- Tháng 10, 11, 12: `QUY 4`.',
      inputDesc: 'Một số nguyên `m` từ 1 đến 12.',
      outputDesc: 'Một dòng: `QUY 1`, `QUY 2`, `QUY 3` hoặc `QUY 4`.',
      note: 'Mỗi quý gồm 3 tháng. Có thể dùng `(m - 1) // 3` để gợi ý, nhưng ở đây hãy luyện if/elif.',
      solve: (input) => {
        const m = parseInt(input.trim(), 10);
        if (m <= 3) return 'QUY 1';
        else if (m <= 6) return 'QUY 2';
        else if (m <= 9) return 'QUY 3';
        else return 'QUY 4';
      },
      inputs: ['1', '4', '7', '10', '3', '6', '9', '12', '2'],
    },
    {
      key: '26',
      title: 'Đoán con vật theo số chân',
      difficulty: 'EASY',
      story:
        'Máy tính cho em số chân `n` của một con vật. Hãy đoán nhóm:\n\n' +
        '- 0 chân: `RAN`.\n- 2 chân: `CHIM`.\n- 4 chân: `THU`.\n- 6 chân: `CON TRUNG`.\n- Khác: `LA`.',
      inputDesc: 'Một số nguyên `n` (>= 0).',
      outputDesc: 'Một dòng: `RAN`, `CHIM`, `THU`, `CON TRUNG` hoặc `LA`.',
      note: 'Mỗi số chân ứng với một nhóm.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n === 0) return 'RAN';
        else if (n === 2) return 'CHIM';
        else if (n === 4) return 'THU';
        else if (n === 6) return 'CON TRUNG';
        else return 'LA';
      },
      inputs: ['0', '2', '4', '6', '8', '1', '100'],
    },
    {
      key: '27',
      title: 'Bậc thang giảm giá',
      difficulty: 'MEDIUM',
      story:
        'Một cửa hàng giảm giá theo số tiền mua `t` (số nguyên đồng, >= 0):\n\n' +
        '- `t < 100`: giảm `0`.\n- `100 <= t < 300`: giảm `5`.\n- `300 <= t < 500`: giảm `10`.\n- `t >= 500`: giảm `20`.\n\nIn ra phần trăm giảm giá (một số).',
      inputDesc: 'Một số nguyên `t` (>= 0).',
      outputDesc: 'Một dòng: phần trăm giảm (0, 5, 10 hoặc 20).',
      note: 'Chú ý mốc 100, 300, 500 là cận dưới của mỗi bậc.',
      solve: (input) => {
        const t = parseInt(input.trim(), 10);
        if (t < 100) return '0';
        else if (t < 300) return '5';
        else if (t < 500) return '10';
        else return '20';
      },
      inputs: ['50', '200', '400', '600', '100', '300', '500', '99', '0'],
    },
    {
      key: '28',
      title: 'Hướng la bàn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số `n` từ 1 đến 4 chỉ hướng. Hãy in tên hướng (không dấu):\n\n' +
        '1 → `BAC`, 2 → `NAM`, 3 → `DONG`, 4 → `TAY`.',
      inputDesc: 'Một số nguyên `n` từ 1 đến 4.',
      outputDesc: 'Một dòng: `BAC`, `NAM`, `DONG` hoặc `TAY`.',
      note: 'Bốn nhánh đơn giản cho bốn hướng.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        if (n === 1) return 'BAC';
        else if (n === 2) return 'NAM';
        else if (n === 3) return 'DONG';
        else return 'TAY';
      },
      inputs: ['1', '2', '3', '4', '1', '3', '2'],
    },
    {
      key: '29',
      title: 'Kết quả trận đấu',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em số bàn thắng của đội nhà `a` và đội khách `b` (số nguyên >= 0). Hãy in kết quả của ĐỘI NHÀ:\n\n' +
        '- Nếu `a > b`: `THANG`.\n- Nếu `a < b`: `THUA`.\n- Nếu `a == b`: `HOA`.',
      inputDesc: 'Hai số nguyên `a b` trên một dòng, cách nhau dấu cách.',
      outputDesc: 'Một dòng: `THANG`, `THUA` hoặc `HOA`.',
      note: 'So sánh số bàn thắng của hai đội.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        if (a > b) return 'THANG';
        else if (a < b) return 'THUA';
        else return 'HOA';
      },
      inputs: ['3 1', '0 2', '2 2', '5 5', '4 0', '1 3', '0 0'],
    },
    {
      key: '30',
      title: 'Tổng kết khóa điều kiện',
      difficulty: 'HARD',
      story:
        'Để tổng kết, máy tính cho em điểm trung bình là số nguyên từ 0 đến 100, và xếp loại hạnh kiểm bằng một chữ: `T` (tốt) hoặc `K` (khá). ' +
        'Quy tắc khen thưởng:\n\n' +
        '- Nếu hạnh kiểm là `T` và điểm `>= 90`: `XUAT SAC`.\n' +
        '- Ngược lại, nếu điểm `>= 80`: `GIOI`.\n' +
        '- Ngược lại, nếu điểm `>= 65`: `KHA`.\n' +
        '- Ngược lại, nếu điểm `>= 50`: `DAT`.\n' +
        '- Còn lại: `CHUA DAT`.',
      inputDesc: 'Dòng 1: số nguyên `diem` (0..100). Dòng 2: một chữ `T` hoặc `K`.',
      outputDesc: 'Một dòng: `XUAT SAC`, `GIOI`, `KHA`, `DAT` hoặc `CHUA DAT`.',
      note: 'Kết hợp điều kiện về hạnh kiểm và các mốc điểm số nguyên.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const d = parseInt((lines[0] ?? '').trim(), 10);
        const hk = (lines[1] ?? '').trim();
        if (hk === 'T' && d >= 90) return 'XUAT SAC';
        else if (d >= 80) return 'GIOI';
        else if (d >= 65) return 'KHA';
        else if (d >= 50) return 'DAT';
        else return 'CHUA DAT';
      },
      inputs: ['95\nT', '85\nK', '70\nT', '55\nK', '40\nT', '95\nK', '90\nT', '80\nT', '50\nK'],
    },
  ],
};

export default course;

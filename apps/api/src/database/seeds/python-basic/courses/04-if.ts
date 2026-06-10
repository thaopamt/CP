import { CourseSpec } from '../types';

/**
 * Course 04 — Câu lệnh if.
 * Mục tiêu: học sinh tiểu học làm quen với câu lệnh `if`: chỉ in ra một thông
 * báo KHI điều kiện đúng. Khi điều kiện sai, chương trình KHÔNG in gì cả
 * (kết quả rỗng là hợp lệ).
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. KHÓA NÀY CHỈ DÙNG `if` ĐƠN — KHÔNG dùng else/elif.
 * Mỗi solver trả về từ khóa khi điều kiện đúng, trả về '' khi điều kiện sai.
 */
const course: CourseSpec = {
  code: 'PYTHON-BASIC-04',
  title: 'Câu lệnh if',
  description:
    'Học cách dùng câu lệnh if: chỉ làm một việc KHI điều kiện đúng. ' +
    'Nếu điều kiện sai thì chương trình không in gì cả — và điều đó cũng đúng nhé!',
  tags: ['python', 'co-ban', 'if', 'dieu-kien'],
  problems: [
    {
      key: '01',
      title: 'Số dương',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` lớn hơn 0 thì in ra `DUONG`. Nếu không thì không in gì cả.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `DUONG` nếu `n > 0`, ngược lại không in gì.',
      note: 'Cú pháp: `if n > 0:` rồi xuống dòng, THỤT LỀ (4 dấu cách) `print("DUONG")`.',
      solve: (input) => (parseInt(input.trim(), 10) > 0 ? 'DUONG' : ''),
      inputs: ['5', '0', '-3', '100', '-1', '1'],
    },
    {
      key: '02',
      title: 'Số chẵn',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` là số chẵn thì in ra `CHAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `CHAN` nếu `n` chia hết cho 2, ngược lại không in gì.',
      note: 'Số chẵn là số chia cho 2 dư 0: `if n % 2 == 0:`.',
      solve: (input) => (parseInt(input.trim(), 10) % 2 === 0 ? 'CHAN' : ''),
      inputs: ['4', '7', '10', '3', '0', '5'],
    },
    {
      key: '03',
      title: 'Hai số bằng nhau',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số `a` và `b` trên cùng một dòng. Nếu `a` bằng `b` thì in ra `BANG NHAU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số `a` và `b` cách nhau dấu cách.',
      outputDesc: 'In `BANG NHAU` nếu `a == b`, ngược lại không in gì.',
      note: 'So sánh bằng dùng HAI dấu bằng: `if a == b:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a === b ? 'BANG NHAU' : '';
      },
      inputs: ['5 5', '3 7', '10 10', '8 2', '0 0', '4 9'],
    },
    {
      key: '04',
      title: 'Số lớn hơn 100',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` lớn hơn 100 thì in ra `LON`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `LON` nếu `n > 100`, ngược lại không in gì.',
      note: 'Dùng `if n > 100:` và nhớ thụt lề dòng print bên trong.',
      solve: (input) => (parseInt(input.trim(), 10) > 100 ? 'LON' : ''),
      inputs: ['150', '100', '99', '500', '50', '101'],
    },
    {
      key: '05',
      title: 'Chia hết',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `a` chia hết cho `b` thì in ra `CHIA HET`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'In `CHIA HET` nếu `a % b == 0`, ngược lại không in gì.',
      note: 'Chia hết nghĩa là phần dư bằng 0: `if a % b == 0:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a % b === 0 ? 'CHIA HET' : '';
      },
      inputs: ['10 5', '7 3', '12 4', '9 2', '20 5', '15 4'],
    },
    {
      key: '06',
      title: 'Số âm',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn 0 thì in ra `AM`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `AM` nếu `n < 0`, ngược lại không in gì.',
      note: 'Dùng `if n < 0:`. Số 0 không phải số âm nhé!',
      solve: (input) => (parseInt(input.trim(), 10) < 0 ? 'AM' : ''),
      inputs: ['-5', '3', '-1', '0', '-100', '7'],
    },
    {
      key: '07',
      title: 'Đậu môn học',
      difficulty: 'EASY',
      story: 'Máy tính cho em điểm số của em (một số nguyên). Nếu điểm từ 5 trở lên thì in ra `DAU`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm số.',
      outputDesc: 'In `DAU` nếu điểm `>= 5`, ngược lại không in gì.',
      note: 'Lớn hơn hoặc bằng dùng `>=`: `if diem >= 5:`.',
      solve: (input) => (parseInt(input.trim(), 10) >= 5 ? 'DAU' : ''),
      inputs: ['5', '4', '8', '2', '10', '3'],
    },
    {
      key: '08',
      title: 'Bằng không',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` bằng 0 thì in ra `BANG 0`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `BANG 0` nếu `n == 0`, ngược lại không in gì.',
      note: 'So sánh bằng dùng hai dấu bằng: `if n == 0:`.',
      solve: (input) => (parseInt(input.trim(), 10) === 0 ? 'BANG 0' : ''),
      inputs: ['0', '5', '-2', '0', '100', '1'],
    },
    {
      key: '09',
      title: 'Trời nóng',
      difficulty: 'EASY',
      story: 'Máy tính cho em nhiệt độ (một số nguyên độ C). Nếu nhiệt độ lớn hơn 37 thì in ra `NONG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là nhiệt độ.',
      outputDesc: 'In `NONG` nếu nhiệt độ `> 37`, ngược lại không in gì.',
      note: 'Dùng `if nhiet > 37:`. Đây là cảnh báo khi sốt cao!',
      solve: (input) => (parseInt(input.trim(), 10) > 37 ? 'NONG' : ''),
      inputs: ['38', '37', '40', '30', '36', '50'],
    },
    {
      key: '10',
      title: 'Số lẻ',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` là số lẻ thì in ra `LE`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `LE` nếu `n` chia 2 dư 1, ngược lại không in gì.',
      note: 'Số lẻ là số chia cho 2 dư 1: `if n % 2 == 1:`.',
      solve: (input) => (parseInt(input.trim(), 10) % 2 === 1 ? 'LE' : ''),
      inputs: ['3', '4', '7', '10', '1', '6'],
    },
    {
      key: '11',
      title: 'a lớn hơn b',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số `a` và `b`. Nếu `a` lớn hơn `b` thì in ra `A LON HON`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số `a` và `b`.',
      outputDesc: 'In `A LON HON` nếu `a > b`, ngược lại không in gì.',
      note: 'Dùng `if a > b:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a > b ? 'A LON HON' : '';
      },
      inputs: ['7 3', '2 9', '10 10', '5 4', '1 8', '6 6'],
    },
    {
      key: '12',
      title: 'Tuổi đi học',
      difficulty: 'EASY',
      story: 'Máy tính cho em tuổi của một bạn nhỏ. Nếu tuổi đúng bằng 6 thì in ra `VAO LOP 1`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'In `VAO LOP 1` nếu tuổi `== 6`, ngược lại không in gì.',
      note: 'Dùng `if tuoi == 6:`.',
      solve: (input) => (parseInt(input.trim(), 10) === 6 ? 'VAO LOP 1' : ''),
      inputs: ['6', '5', '7', '6', '10', '3'],
    },
    {
      key: '13',
      title: 'Số có một chữ số',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` nhỏ hơn 10 (có đúng một chữ số) thì in ra `MOT CHU SO`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `MOT CHU SO` nếu `n < 10`, ngược lại không in gì.',
      note: 'Dùng `if n < 10:`.',
      solve: (input) => (parseInt(input.trim(), 10) < 10 ? 'MOT CHU SO' : ''),
      inputs: ['5', '10', '9', '25', '0', '100'],
    },
    {
      key: '14',
      title: 'Chia hết cho 5',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 5 thì in ra `CHIA HET 5`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `CHIA HET 5` nếu `n % 5 == 0`, ngược lại không in gì.',
      note: 'Dùng `if n % 5 == 0:`.',
      solve: (input) => (parseInt(input.trim(), 10) % 5 === 0 ? 'CHIA HET 5' : ''),
      inputs: ['10', '7', '25', '12', '0', '13'],
    },
    {
      key: '15',
      title: 'Điểm xuất sắc',
      difficulty: 'EASY',
      story: 'Máy tính cho em điểm của em (một số nguyên). Nếu điểm bằng 10 thì in ra `XUAT SAC`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm.',
      outputDesc: 'In `XUAT SAC` nếu điểm `== 10`, ngược lại không in gì.',
      note: 'Dùng `if diem == 10:`.',
      solve: (input) => (parseInt(input.trim(), 10) === 10 ? 'XUAT SAC' : ''),
      inputs: ['10', '9', '8', '10', '5', '7'],
    },
    {
      key: '16',
      title: 'Số dư bằng 1',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `a` chia `b` dư đúng 1 thì in ra `DU 1`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'In `DU 1` nếu `a % b == 1`, ngược lại không in gì.',
      note: 'Phép chia lấy dư dùng dấu `%`: `if a % b == 1:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a % b === 1 ? 'DU 1' : '';
      },
      inputs: ['7 3', '10 5', '9 4', '8 2', '11 5', '6 3'],
    },
    {
      key: '17',
      title: 'Trời lạnh',
      difficulty: 'EASY',
      story: 'Máy tính cho em nhiệt độ (một số nguyên). Nếu nhiệt độ nhỏ hơn 15 thì in ra `LANH`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là nhiệt độ.',
      outputDesc: 'In `LANH` nếu nhiệt độ `< 15`, ngược lại không in gì.',
      note: 'Dùng `if nhiet < 15:`.',
      solve: (input) => (parseInt(input.trim(), 10) < 15 ? 'LANH' : ''),
      inputs: ['10', '15', '20', '5', '30', '14'],
    },
    {
      key: '18',
      title: 'Đủ tuổi mượn sách',
      difficulty: 'EASY',
      story: 'Thư viện cho mượn sách nếu bạn từ 7 tuổi trở lên. Máy tính cho em tuổi của một bạn. Nếu tuổi `>= 7` thì in ra `DUOC MUON`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'In `DUOC MUON` nếu tuổi `>= 7`, ngược lại không in gì.',
      note: 'Dùng `if tuoi >= 7:`.',
      solve: (input) => (parseInt(input.trim(), 10) >= 7 ? 'DUOC MUON' : ''),
      inputs: ['7', '6', '10', '5', '8', '3'],
    },
    {
      key: '19',
      title: 'Số nhỏ hơn hoặc bằng 50',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn hoặc bằng 50 thì in ra `NHO`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `NHO` nếu `n <= 50`, ngược lại không in gì.',
      note: 'Nhỏ hơn hoặc bằng dùng `<=`: `if n <= 50:`.',
      solve: (input) => (parseInt(input.trim(), 10) <= 50 ? 'NHO' : ''),
      inputs: ['30', '50', '51', '100', '1', '70'],
    },
    {
      key: '20',
      title: 'Hai số khác nhau',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số `a` và `b`. Nếu `a` khác `b` thì in ra `KHAC NHAU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số `a` và `b`.',
      outputDesc: 'In `KHAC NHAU` nếu `a != b`, ngược lại không in gì.',
      note: 'Khác nhau dùng `!=`: `if a != b:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a !== b ? 'KHAC NHAU' : '';
      },
      inputs: ['3 7', '5 5', '10 2', '8 8', '1 9', '4 4'],
    },
    {
      key: '21',
      title: 'Bội của 3',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` là bội của 3 (chia hết cho 3) thì in ra `BOI CUA 3`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `BOI CUA 3` nếu `n % 3 == 0`, ngược lại không in gì.',
      note: 'Dùng `if n % 3 == 0:`.',
      solve: (input) => (parseInt(input.trim(), 10) % 3 === 0 ? 'BOI CUA 3' : ''),
      inputs: ['9', '7', '12', '10', '0', '5'],
    },
    {
      key: '22',
      title: 'Còn hàng',
      difficulty: 'EASY',
      story: 'Một cửa hàng còn `n` món đồ. Máy tính cho em số `n`. Nếu vẫn còn hàng (`n` lớn hơn 0) thì in ra `CON HANG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `CON HANG` nếu `n > 0`, ngược lại không in gì.',
      note: 'Dùng `if n > 0:`. Lưu ý bài này từ in ra khác bài số dương.',
      solve: (input) => (parseInt(input.trim(), 10) > 0 ? 'CON HANG' : ''),
      inputs: ['3', '0', '10', '0', '1', '25'],
    },
    {
      key: '23',
      title: 'Tuổi thiếu niên',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em tuổi của một bạn. Nếu tuổi nằm trong khoảng từ 10 đến 15 (tính cả 10 và 15) thì in ra `THIEU NIEN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'In `THIEU NIEN` nếu `10 <= tuoi <= 15`, ngược lại không in gì.',
      note: 'Kết hợp hai điều kiện bằng `and`: `if tuoi >= 10 and tuoi <= 15:`.',
      solve: (input) => {
        const t = parseInt(input.trim(), 10);
        return t >= 10 && t <= 15 ? 'THIEU NIEN' : '';
      },
      inputs: ['12', '9', '15', '16', '10', '20'],
    },
    {
      key: '24',
      title: 'Chia hết cho cả 2 và 3',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho cả 2 VÀ 3 thì in ra `CHIA HET 2 VA 3`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `CHIA HET 2 VA 3` nếu `n` chia hết cho 2 và cho 3, ngược lại không in gì.',
      note: 'Dùng `and`: `if n % 2 == 0 and n % 3 == 0:`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return n % 2 === 0 && n % 3 === 0 ? 'CHIA HET 2 VA 3' : '';
      },
      inputs: ['6', '4', '12', '9', '0', '8'],
    },
    {
      key: '25',
      title: 'Số ở hai đầu',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn 0 HOẶC lớn hơn 100 thì in ra `NGOAI KHOANG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'In `NGOAI KHOANG` nếu `n < 0` hoặc `n > 100`, ngược lại không in gì.',
      note: 'Kết hợp bằng `or`: `if n < 0 or n > 100:`.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return n < 0 || n > 100 ? 'NGOAI KHOANG' : '';
      },
      inputs: ['-5', '50', '200', '0', '150', '100'],
    },
    {
      key: '26',
      title: 'Điểm trung bình khá',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em điểm (một số nguyên). Nếu điểm từ 7 đến 8 (tính cả 7 và 8) thì in ra `KHA`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm.',
      outputDesc: 'In `KHA` nếu `7 <= diem <= 8`, ngược lại không in gì.',
      note: 'Dùng `and`: `if diem >= 7 and diem <= 8:`.',
      solve: (input) => {
        const d = parseInt(input.trim(), 10);
        return d >= 7 && d <= 8 ? 'KHA' : '';
      },
      inputs: ['7', '6', '8', '9', '5', '10'],
    },
    {
      key: '27',
      title: 'Số tận cùng bằng 0',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu chữ số cuối cùng của `n` là 0 (tức `n` chia hết cho 10) thì in ra `TAN CUNG 0`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'In `TAN CUNG 0` nếu `n % 10 == 0`, ngược lại không in gì.',
      note: 'Lấy chữ số cuối bằng `n % 10`: `if n % 10 == 0:`.',
      solve: (input) => (parseInt(input.trim(), 10) % 10 === 0 ? 'TAN CUNG 0' : ''),
      inputs: ['10', '7', '100', '23', '0', '55'],
    },
    {
      key: '28',
      title: 'Cùng dương',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em hai số `a` và `b`. Nếu CẢ HAI số đều lớn hơn 0 thì in ra `CA HAI DUONG`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số `a` và `b`.',
      outputDesc: 'In `CA HAI DUONG` nếu `a > 0` và `b > 0`, ngược lại không in gì.',
      note: 'Dùng `and`: `if a > 0 and b > 0:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a > 0 && b > 0 ? 'CA HAI DUONG' : '';
      },
      inputs: ['3 5', '-1 4', '7 2', '0 9', '10 8', '-2 -3'],
    },
    {
      key: '29',
      title: 'Có ít nhất một số chẵn',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu có ÍT NHẤT MỘT trong hai số là số chẵn thì in ra `CO SO CHAN`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'In `CO SO CHAN` nếu `a` chẵn hoặc `b` chẵn, ngược lại không in gì.',
      note: 'Dùng `or`: `if a % 2 == 0 or b % 2 == 0:`.',
      solve: (input) => {
        const [a, b] = input.trim().split(/\s+/).map((x) => parseInt(x, 10));
        return a % 2 === 0 || b % 2 === 0 ? 'CO SO CHAN' : '';
      },
      inputs: ['4 7', '3 5', '2 8', '1 9', '6 3', '7 7'],
    },
    {
      key: '30',
      title: 'Năm nhuận đơn giản',
      difficulty: 'MEDIUM',
      story: 'Một cách đơn giản: máy tính cho em một số năm `n`. Nếu `n` chia hết cho 4 thì in ra `NAM NHUAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên dương `n` là năm.',
      outputDesc: 'In `NAM NHUAN` nếu `n % 4 == 0`, ngược lại không in gì.',
      note: 'Dùng `if n % 4 == 0:`. (Đây là cách rút gọn cho bạn nhỏ.)',
      solve: (input) => (parseInt(input.trim(), 10) % 4 === 0 ? 'NAM NHUAN' : ''),
      inputs: ['2024', '2023', '2020', '2025', '2000', '2019'],
    },
  ],
};

export default course;

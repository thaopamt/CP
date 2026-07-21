import { CourseSpec } from '../types';

/**
 * Course 04 — Câu lệnh if.
 * Mục tiêu: học sinh tiểu học làm quen với câu lệnh `if`: chỉ in ra một thông
 * báo KHI điều kiện đúng. Khi điều kiện sai, chương trình KHÔNG in gì cả
 * (kết quả rỗng là hợp lệ).
 *
 * KHÓA NÀY CHỈ DÙNG `if` ĐƠN — KHÔNG else/elif. Mỗi solver trả về từ khóa khi
 * điều kiện đúng, trả về '' khi điều kiện sai. Mỗi bài phải có ít nhất một test
 * đúng VÀ một test sai, nếu không học sinh không phân biệt được hai nhánh.
 *
 * MỖI BÀI MỘT ĐIỀU KIỆN KHÁC NHAU. Hai bài chỉ khác chữ in ra nhưng cùng điều
 * kiện (ví dụ `n > 0` in "DUONG" và `n > 0` in "CON HANG") là TRÙNG — người học
 * gõ đúng một dòng `if` cho cả hai bài thì không học thêm được gì.
 *
 * KHÔNG DÙNG LŨY THỪA `**` — học sinh tiểu học chưa học (xem course 03).
 * Phép `%` chỉ dùng với toán hạng KHÔNG ÂM để `%` của JS khớp với Python.
 *
 * GỢI Ý: cố ý viết ít `note`. Story PHẢI nêu rõ điều kiện (đó là đề bài), nhưng
 * note KHÔNG được cho sẵn dòng `if ...:` để học sinh chép. Chỉ bài đầu tiên của
 * khóa, bài đầu dùng `and` và bài đầu dùng `or` mới có note.
 *
 * Thứ tự bài trong mảng `problems` chính là thứ tự hiển thị (seeder gán
 * orderIndex theo vị trí mảng), đi từ dễ đến khó theo 11 chặng:
 *   A. So sánh với số 0          G. Điều kiện trên biểu thức
 *   B. So sánh với một số        H. Chữ số của một số
 *   C. Bằng và khác             I. Kết hợp bằng `and`
 *   D. Chia hết                  J. Kết hợp bằng `or`
 *   E. So sánh hai số            K. Ba số
 *   F. Chia hết giữa hai số
 * Độ khó tăng đơn điệu: EASY (A–H) → MEDIUM (I–J) → HARD (cuối K).
 *
 * `key` là định danh bền của bài (slug = pybasic-04-<key>), KHÔNG phải thứ tự
 * hiển thị — đổi chỗ bài trong mảng thì giữ nguyên key để tiến độ học sinh
 * không bị lệch sang bài khác.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples.
 */

/** Mọi số nguyên trên stdin, tách theo khoảng trắng hoặc xuống dòng. */
const ints = (input: string): number[] =>
  input
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((x) => parseInt(x, 10));
/** Số nguyên đầu tiên trên stdin. */
const one = (input: string): number => ints(input)[0];
/** In `word` khi điều kiện đúng, không in gì khi sai. */
const when = (cond: boolean, word: string): string => (cond ? word : '');

const course: CourseSpec = {
  code: 'PYTHON-BASIC-04',
  title: 'Câu lệnh if',
  description:
    'Học cách dùng câu lệnh if: chỉ làm một việc KHI điều kiện đúng. ' +
    'Nếu điều kiện sai thì chương trình không in gì cả — và điều đó cũng đúng nhé!',
  tags: ['python', 'co-ban', 'if', 'dieu-kien'],
  problems: [
    // ===================================================================
    // CHẶNG A — So sánh với số 0
    // ===================================================================
    {
      key: '01',
      title: 'Số dương',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` lớn hơn 0 thì in ra `DUONG`. Nếu không thì không in gì cả.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `DUONG`, hoặc không in gì.',
      note:
        'Câu lệnh `if` viết như sau: dòng điều kiện kết thúc bằng dấu hai chấm `:`, ' +
        'rồi dòng việc-cần-làm phải THỤT VÀO 4 dấu cách. Chính chỗ thụt lề đó cho Python biết ' +
        'lệnh nào nằm bên trong `if`.',
      solve: (input) => when(one(input) > 0, 'DUONG'),
      inputs: ['5', '0', '-3', '100', '-1', '1'],
    },
    {
      key: '06',
      title: 'Số âm',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn 0 thì in ra `AM`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `AM`, hoặc không in gì.',
      solve: (input) => when(one(input) < 0, 'AM'),
      inputs: ['-5', '3', '-1', '0', '-100', '7'],
    },
    {
      key: '08',
      title: 'Bằng không',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` bằng 0 thì in ra `BANG 0`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `BANG 0`, hoặc không in gì.',
      note: 'So sánh bằng dùng HAI dấu bằng `==`. Một dấu bằng `=` là để GÁN giá trị, không phải để so sánh.',
      solve: (input) => when(one(input) === 0, 'BANG 0'),
      inputs: ['0', '5', '-2', '0', '100', '1'],
    },
    {
      key: '33',
      title: 'Khác không',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` KHÁC 0 thì in ra `KHAC 0`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `KHAC 0`, hoặc không in gì.',
      solve: (input) => when(one(input) !== 0, 'KHAC 0'),
      inputs: ['5', '0', '-2', '0', '100', '1'],
    },
    {
      key: '31',
      title: 'Số không âm',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` lớn hơn HOẶC BẰNG 0 thì in ra `KHONG AM`. Nếu không thì không in gì.\n\nLưu ý: số 0 cũng là số không âm.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `KHONG AM`, hoặc không in gì.',
      solve: (input) => when(one(input) >= 0, 'KHONG AM'),
      inputs: ['5', '0', '-3', '100', '-1', '1'],
    },
    {
      key: '32',
      title: 'Không phải số dương',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn hoặc bằng 0 thì in ra `KHONG DUONG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `KHONG DUONG`, hoặc không in gì.',
      solve: (input) => when(one(input) <= 0, 'KHONG DUONG'),
      inputs: ['-5', '3', '0', '100', '-1', '0'],
    },

    // ===================================================================
    // CHẶNG B — So sánh với một số cho trước
    // ===================================================================
    {
      key: '13',
      title: 'Số có một chữ số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` nhỏ hơn 10 thì in ra `MOT CHU SO`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `MOT CHU SO`, hoặc không in gì.',
      solve: (input) => when(one(input) < 10, 'MOT CHU SO'),
      inputs: ['5', '10', '9', '25', '0', '100'],
    },
    {
      key: '42',
      title: 'Ít hơn năm cái kẹo',
      difficulty: 'EASY',
      story:
        'Em có một số cái kẹo. Nếu số kẹo ít hơn 5 thì in ra `IT QUA`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là số kẹo.',
      outputDesc: 'Một dòng chữ `IT QUA`, hoặc không in gì.',
      solve: (input) => when(one(input) < 5, 'IT QUA'),
      inputs: ['3', '5', '0', '10', '4', '100'],
    },
    {
      key: '37',
      title: 'Nhiều nhất mười bạn',
      difficulty: 'EASY',
      story:
        'Một chiếc thuyền chở được nhiều nhất 10 bạn. Máy tính cho em số bạn muốn lên thuyền. ' +
        'Nếu số bạn không vượt quá 10 thì in ra `LEN DUOC`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là số bạn.',
      outputDesc: 'Một dòng chữ `LEN DUOC`, hoặc không in gì.',
      solve: (input) => when(one(input) <= 10, 'LEN DUOC'),
      inputs: ['8', '10', '11', '0', '25', '3'],
    },
    {
      key: '19',
      title: 'Số nhỏ hơn hoặc bằng 50',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn hoặc bằng 50 thì in ra `NHO`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `NHO`, hoặc không in gì.',
      solve: (input) => when(one(input) <= 50, 'NHO'),
      inputs: ['30', '50', '51', '100', '1', '70'],
    },
    {
      key: '35',
      title: 'Chưa tới một trăm',
      difficulty: 'EASY',
      story:
        'Máy tính cho em số trang em đã đọc. Nếu số trang nhỏ hơn 100 thì in ra `CHUA XONG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Một dòng chữ `CHUA XONG`, hoặc không in gì.',
      solve: (input) => when(one(input) < 100, 'CHUA XONG'),
      inputs: ['80', '100', '99', '150', '0', '200'],
    },
    {
      key: '36',
      title: 'Đủ một trăm điểm',
      difficulty: 'EASY',
      story:
        'Máy tính cho em số điểm em kiếm được trong trò chơi. Nếu điểm từ 100 trở lên thì in ra `QUA MAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là điểm.',
      outputDesc: 'Một dòng chữ `QUA MAN`, hoặc không in gì.',
      solve: (input) => when(one(input) >= 100, 'QUA MAN'),
      inputs: ['120', '100', '99', '0', '500', '50'],
    },
    {
      key: '04',
      title: 'Số lớn hơn 100',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên `n`. Nếu `n` lớn hơn 100 thì in ra `LON`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `LON`, hoặc không in gì.',
      solve: (input) => when(one(input) > 100, 'LON'),
      inputs: ['150', '100', '99', '500', '50', '101'],
    },
    {
      key: '34',
      title: 'Quá nửa lớp',
      difficulty: 'EASY',
      story:
        'Một lớp có 50 bạn. Máy tính cho em số bạn đã nộp bài. Nếu số bạn nộp bài nhiều hơn 50 phần trăm ' +
        '(tức là lớn hơn 25 bạn) thì in ra `QUA NUA`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là số bạn đã nộp bài.',
      outputDesc: 'Một dòng chữ `QUA NUA`, hoặc không in gì.',
      solve: (input) => when(one(input) > 25, 'QUA NUA'),
      inputs: ['30', '25', '26', '0', '50', '10'],
    },
    {
      key: '41',
      title: 'Hơn một nghìn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em số lượt xem của một đoạn phim. Nếu số lượt xem lớn hơn 1000 thì in ra `NOI TIENG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Một dòng chữ `NOI TIENG`, hoặc không in gì.',
      solve: (input) => when(one(input) > 1000, 'NOI TIENG'),
      inputs: ['5000', '1000', '1001', '0', '999', '99999'],
    },
    {
      key: '07',
      title: 'Đậu môn học',
      difficulty: 'EASY',
      story: 'Máy tính cho em điểm số của em. Nếu điểm từ 5 trở lên thì in ra `DAU`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm số.',
      outputDesc: 'Một dòng chữ `DAU`, hoặc không in gì.',
      solve: (input) => when(one(input) >= 5, 'DAU'),
      inputs: ['5', '4', '8', '2', '10', '3'],
    },
    {
      key: '18',
      title: 'Đủ tuổi mượn sách',
      difficulty: 'EASY',
      story:
        'Thư viện cho mượn sách nếu bạn từ 7 tuổi trở lên. Máy tính cho em tuổi của một bạn. ' +
        'Nếu bạn đó đủ tuổi thì in ra `DUOC MUON`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'Một dòng chữ `DUOC MUON`, hoặc không in gì.',
      solve: (input) => when(one(input) >= 7, 'DUOC MUON'),
      inputs: ['7', '6', '10', '5', '8', '3'],
    },
    {
      key: '22',
      title: 'Còn nhiều hàng',
      difficulty: 'EASY',
      story:
        'Một cửa hàng còn `n` món đồ. Nếu còn từ 10 món trở lên thì in ra `CON NHIEU`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CON NHIEU`, hoặc không in gì.',
      solve: (input) => when(one(input) >= 10, 'CON NHIEU'),
      inputs: ['30', '10', '9', '0', '100', '5'],
    },
    {
      key: '17',
      title: 'Trời lạnh',
      difficulty: 'EASY',
      story: 'Máy tính cho em nhiệt độ. Nếu nhiệt độ nhỏ hơn 15 độ thì in ra `LANH`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là nhiệt độ.',
      outputDesc: 'Một dòng chữ `LANH`, hoặc không in gì.',
      solve: (input) => when(one(input) < 15, 'LANH'),
      inputs: ['10', '15', '20', '5', '30', '14'],
    },
    {
      key: '09',
      title: 'Bị sốt',
      difficulty: 'EASY',
      story:
        'Máy tính cho em nhiệt độ cơ thể của một bạn. Nếu nhiệt độ lớn hơn 37 độ thì in ra `SOT`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là nhiệt độ cơ thể.',
      outputDesc: 'Một dòng chữ `SOT`, hoặc không in gì.',
      solve: (input) => when(one(input) > 37, 'SOT'),
      inputs: ['38', '37', '40', '30', '36', '50'],
    },

    // ===================================================================
    // CHẶNG C — Bằng và khác một giá trị
    // ===================================================================
    {
      key: '12',
      title: 'Tuổi đi học',
      difficulty: 'EASY',
      story: 'Máy tính cho em tuổi của một bạn nhỏ. Nếu tuổi đúng bằng 6 thì in ra `VAO LOP 1`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'Một dòng chữ `VAO LOP 1`, hoặc không in gì.',
      solve: (input) => when(one(input) === 6, 'VAO LOP 1'),
      inputs: ['6', '5', '7', '6', '10', '3'],
    },
    {
      key: '15',
      title: 'Điểm xuất sắc',
      difficulty: 'EASY',
      story: 'Máy tính cho em điểm của em. Nếu điểm đúng bằng 10 thì in ra `XUAT SAC`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm.',
      outputDesc: 'Một dòng chữ `XUAT SAC`, hoặc không in gì.',
      solve: (input) => when(one(input) === 10, 'XUAT SAC'),
      inputs: ['10', '9', '8', '10', '5', '7'],
    },
    {
      key: '38',
      title: 'Về nhất',
      difficulty: 'EASY',
      story:
        'Máy tính cho em thứ hạng của một bạn trong cuộc thi. Nếu thứ hạng đúng bằng 1 thì in ra `VO DICH`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên dương là thứ hạng.',
      outputDesc: 'Một dòng chữ `VO DICH`, hoặc không in gì.',
      solve: (input) => when(one(input) === 1, 'VO DICH'),
      inputs: ['1', '2', '5', '1', '10', '3'],
    },
    {
      key: '39',
      title: 'Đúng một trăm',
      difficulty: 'EASY',
      story:
        'Máy tính cho em số điểm của em. Nếu điểm đúng bằng 100 thì in ra `TUYET DOI`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là điểm.',
      outputDesc: 'Một dòng chữ `TUYET DOI`, hoặc không in gì.',
      solve: (input) => when(one(input) === 100, 'TUYET DOI'),
      inputs: ['100', '99', '0', '100', '101', '50'],
    },
    {
      key: '40',
      title: 'Chưa được điểm mười',
      difficulty: 'EASY',
      story:
        'Máy tính cho em điểm của em. Nếu điểm KHÁC 10 thì in ra `CO GANG THEM`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm.',
      outputDesc: 'Một dòng chữ `CO GANG THEM`, hoặc không in gì.',
      solve: (input) => when(one(input) !== 10, 'CO GANG THEM'),
      inputs: ['9', '10', '8', '10', '5', '0'],
    },

    // ===================================================================
    // CHẶNG D — Chia hết
    // ===================================================================
    {
      key: '02',
      title: 'Số chẵn',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` là số chẵn thì in ra `CHAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CHAN`, hoặc không in gì.',
      solve: (input) => when(one(input) % 2 === 0, 'CHAN'),
      inputs: ['4', '7', '10', '3', '0', '5'],
    },
    {
      key: '10',
      title: 'Số lẻ',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên không âm `n`. Nếu `n` là số lẻ thì in ra `LE`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `LE`, hoặc không in gì.',
      solve: (input) => when(one(input) % 2 === 1, 'LE'),
      inputs: ['3', '4', '7', '10', '1', '6'],
    },
    {
      key: '21',
      title: 'Bội của 3',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 3 thì in ra `BOI CUA 3`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `BOI CUA 3`, hoặc không in gì.',
      solve: (input) => when(one(input) % 3 === 0, 'BOI CUA 3'),
      inputs: ['9', '7', '12', '10', '0', '5'],
    },
    {
      key: '14',
      title: 'Chia hết cho 5',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 5 thì in ra `CHIA HET 5`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CHIA HET 5`, hoặc không in gì.',
      solve: (input) => when(one(input) % 5 === 0, 'CHIA HET 5'),
      inputs: ['10', '7', '25', '12', '0', '13'],
    },
    {
      key: '45',
      title: 'Xếp đủ hàng tám',
      difficulty: 'EASY',
      story:
        'Các bạn xếp thành hàng, mỗi hàng đúng 8 bạn. Máy tính cho em tổng số bạn. ' +
        'Nếu xếp vừa khít không thừa ai thì in ra `VUA DU`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là số bạn.',
      outputDesc: 'Một dòng chữ `VUA DU`, hoặc không in gì.',
      solve: (input) => when(one(input) % 8 === 0, 'VUA DU'),
      inputs: ['16', '7', '24', '10', '0', '13'],
    },
    {
      key: '43',
      title: 'Tròn tuần',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số ngày. Nếu số ngày đó chia hết cho 7 (tức là tròn số tuần) thì in ra `TRON TUAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm là số ngày.',
      outputDesc: 'Một dòng chữ `TRON TUAN`, hoặc không in gì.',
      solve: (input) => when(one(input) % 7 === 0, 'TRON TUAN'),
      inputs: ['14', '10', '21', '8', '0', '100'],
    },
    {
      key: '44',
      title: 'Chia hết cho 9',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 9 thì in ra `CHIA HET 9`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CHIA HET 9`, hoặc không in gì.',
      solve: (input) => when(one(input) % 9 === 0, 'CHIA HET 9'),
      inputs: ['18', '10', '27', '20', '0', '100'],
    },
    {
      key: '30',
      title: 'Năm nhuận đơn giản',
      difficulty: 'EASY',
      story:
        'Một cách kiểm tra rút gọn: máy tính cho em một số năm `n`. Nếu `n` chia hết cho 4 thì in ra `NAM NHUAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên dương `n` là năm.',
      outputDesc: 'Một dòng chữ `NAM NHUAN`, hoặc không in gì.',
      solve: (input) => when(one(input) % 4 === 0, 'NAM NHUAN'),
      inputs: ['2024', '2023', '2020', '2025', '2000', '2019'],
    },
    {
      key: '27',
      title: 'Số tận cùng bằng 0',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu chữ số cuối cùng của `n` là 0 thì in ra `TAN CUNG 0`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `TAN CUNG 0`, hoặc không in gì.',
      solve: (input) => when(one(input) % 10 === 0, 'TAN CUNG 0'),
      inputs: ['10', '7', '100', '23', '0', '55'],
    },
    {
      key: '47',
      title: 'Số tận cùng bằng 5',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu chữ số cuối cùng của `n` là 5 thì in ra `TAN CUNG 5`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `TAN CUNG 5`, hoặc không in gì.',
      solve: (input) => when(one(input) % 10 === 5, 'TAN CUNG 5'),
      inputs: ['15', '10', '25', '23', '5', '50'],
    },
    {
      key: '46',
      title: 'Số tròn trăm',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 100 thì in ra `TRON TRAM`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `TRON TRAM`, hoặc không in gì.',
      solve: (input) => when(one(input) % 100 === 0, 'TRON TRAM'),
      inputs: ['200', '150', '100', '99', '0', '1000'],
    },
    {
      key: '48',
      title: 'Chia ba dư một',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia cho 3 dư đúng 1 thì in ra `DU 1`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `DU 1`, hoặc không in gì.',
      solve: (input) => when(one(input) % 3 === 1, 'DU 1'),
      inputs: ['7', '9', '10', '12', '1', '5'],
    },

    // ===================================================================
    // CHẶNG E — So sánh hai số
    // ===================================================================
    {
      key: '03',
      title: 'Hai số bằng nhau',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số `a` và `b` trên cùng một dòng. Nếu `a` bằng `b` thì in ra `BANG NHAU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `BANG NHAU`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a === b, 'BANG NHAU');
      },
      inputs: ['5 5', '3 7', '10 10', '8 2', '0 0', '4 9'],
    },
    {
      key: '20',
      title: 'Hai số khác nhau',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số `a` và `b`. Nếu `a` khác `b` thì in ra `KHAC NHAU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `KHAC NHAU`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a !== b, 'KHAC NHAU');
      },
      inputs: ['3 7', '5 5', '10 2', '8 8', '1 9', '4 4'],
    },
    {
      key: '11',
      title: 'a lớn hơn b',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số `a` và `b`. Nếu `a` lớn hơn `b` thì in ra `A LON HON`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `A LON HON`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a > b, 'A LON HON');
      },
      inputs: ['7 3', '2 9', '10 10', '5 4', '1 8', '6 6'],
    },
    {
      key: '50',
      title: 'a nhỏ hơn b',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số `a` và `b`. Nếu `a` nhỏ hơn `b` thì in ra `A NHO HON`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `A NHO HON`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a < b, 'A NHO HON');
      },
      inputs: ['3 7', '9 2', '10 10', '4 5', '8 1', '6 6'],
    },
    {
      key: '51',
      title: 'Không thua kém',
      difficulty: 'EASY',
      story:
        'Hai bạn thi chạy, bạn A được `a` điểm và bạn B được `b` điểm. Nếu điểm bạn A lớn hơn hoặc bằng bạn B thì in ra `A KHONG THUA`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `A KHONG THUA`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a >= b, 'A KHONG THUA');
      },
      inputs: ['7 3', '2 9', '10 10', '5 4', '1 8', '6 6'],
    },
    {
      key: '52',
      title: 'Đủ tiền mua',
      difficulty: 'EASY',
      story:
        'Món đồ giá `a` đồng, em có `b` đồng. Nếu giá món đồ không vượt quá số tiền em có thì in ra `MUA DUOC`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `MUA DUOC`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a <= b, 'MUA DUOC');
      },
      inputs: ['3 7', '9 2', '10 10', '5 4', '8 1', '6 6'],
    },
    {
      key: '58',
      title: 'Có ít nhất một số không',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu tích của chúng bằng 0 thì in ra `CO SO 0`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `CO SO 0`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a * b === 0, 'CO SO 0');
      },
      inputs: ['0 5', '3 7', '9 0', '1 1', '0 0', '4 2'],
    },
    {
      key: '59',
      title: 'Tổng bằng không',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu tổng của chúng bằng 0 thì in ra `CA HAI DEU 0`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `CA HAI DEU 0`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a + b === 0, 'CA HAI DEU 0');
      },
      inputs: ['0 0', '3 7', '0 5', '1 1', '0 0', '4 2'],
    },

    // ===================================================================
    // CHẶNG F — Chia hết giữa hai số
    // ===================================================================
    {
      key: '05',
      title: 'Chia hết',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `a` chia hết cho `b` thì in ra `CHIA HET`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Một dòng chữ `CHIA HET`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a % b === 0, 'CHIA HET');
      },
      inputs: ['10 5', '7 3', '12 4', '9 2', '20 5', '15 4'],
    },
    {
      key: '62',
      title: 'Chia còn thừa',
      difficulty: 'EASY',
      story:
        'Có `a` cái bánh chia cho `b` bạn. Nếu chia không hết (còn thừa bánh) thì in ra `CON THUA`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Một dòng chữ `CON THUA`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a % b !== 0, 'CON THUA');
      },
      inputs: ['7 3', '10 5', '9 2', '12 4', '15 4', '20 5'],
    },
    {
      key: '16',
      title: 'Số dư bằng 1',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `a` chia `b` dư đúng 1 thì in ra `DU 1`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Một dòng chữ `DU 1`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a % b === 1, 'DU 1');
      },
      inputs: ['7 3', '10 5', '9 4', '8 2', '11 5', '6 3'],
    },
    {
      key: '60',
      title: 'Số dư bằng 2',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `a` chia `b` dư đúng 2 thì in ra `DU 2`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Một dòng chữ `DU 2`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a % b === 2, 'DU 2');
      },
      inputs: ['8 3', '10 5', '9 4', '7 3', '12 5', '6 3'],
    },
    {
      key: '61',
      title: 'Số sau chia hết số trước',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên dương `a` và `b`. Nếu `b` chia hết cho `a` thì in ra `B CHIA HET A`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Một dòng chữ `B CHIA HET A`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(b % a === 0, 'B CHIA HET A');
      },
      inputs: ['5 10', '3 7', '4 12', '2 9', '5 20', '4 15'],
    },

    // ===================================================================
    // CHẶNG G — Điều kiện trên biểu thức
    // ===================================================================
    {
      key: '53',
      title: 'Tổng lớn hơn mười',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu TỔNG của chúng lớn hơn 10 thì in ra `TONG LON`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `TONG LON`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a + b > 10, 'TONG LON');
      },
      inputs: ['7 5', '3 4', '10 0', '5 5', '20 1', '0 0'],
    },
    {
      key: '54',
      title: 'Tổng đúng bằng mười',
      difficulty: 'EASY',
      story:
        'Hai bạn góp kẹo, bạn A có `a` cái và bạn B có `b` cái. Nếu tổng số kẹo đúng bằng 10 thì in ra `DU MUOI`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `DU MUOI`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a + b === 10, 'DU MUOI');
      },
      inputs: ['7 3', '3 4', '10 0', '5 5', '20 1', '0 0'],
    },
    {
      key: '57',
      title: 'Tổng chưa tới hai mươi',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu tổng của chúng nhỏ hơn 20 thì in ra `TONG NHO`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `TONG NHO`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a + b < 20, 'TONG NHO');
      },
      inputs: ['7 5', '15 5', '10 0', '19 1', '20 1', '0 0'],
    },
    {
      key: '55',
      title: 'Hơn nhau nhiều',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Nếu `a` lớn hơn `b` quá 5 đơn vị (tức hiệu `a - b` lớn hơn 5) thì in ra `HON NHIEU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b`.',
      outputDesc: 'Một dòng chữ `HON NHIEU`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a - b > 5, 'HON NHIEU');
      },
      inputs: ['10 3', '7 5', '20 1', '6 1', '5 5', '100 0'],
    },
    {
      key: '56',
      title: 'Tích lớn hơn một trăm',
      difficulty: 'EASY',
      story:
        'Một mảnh vườn hình chữ nhật dài `a` rộng `b`. Nếu diện tích lớn hơn 100 thì in ra `VUON RONG`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Một dòng chữ `VUON RONG`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a * b > 100, 'VUON RONG');
      },
      inputs: ['20 10', '5 5', '10 10', '11 10', '1 1', '50 4'],
    },

    // ===================================================================
    // CHẶNG H — Chữ số của một số
    // ===================================================================
    {
      key: '63',
      title: 'Số có hai chữ số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` có đúng hai chữ số (từ 10 đến 99) thì in ra `HAI CHU SO`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `HAI CHU SO`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n >= 10 && n <= 99, 'HAI CHU SO');
      },
      inputs: ['47', '5', '100', '10', '99', '1000'],
    },
    {
      key: '64',
      title: 'Số có ba chữ số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` có đúng ba chữ số (từ 100 đến 999) thì in ra `BA CHU SO`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `BA CHU SO`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n >= 100 && n <= 999, 'BA CHU SO');
      },
      inputs: ['347', '47', '1000', '100', '999', '5'],
    },
    {
      key: '65',
      title: 'Hai chữ số giống nhau',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số. Nếu hai chữ số của nó giống nhau (như 11, 22, 33...) thì in ra `GIONG NHAU`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên từ 10 đến 99.',
      outputDesc: 'Một dòng chữ `GIONG NHAU`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(Math.floor(n / 10) === n % 10, 'GIONG NHAU');
      },
      inputs: ['11', '23', '22', '55', '10', '99'],
    },
    {
      key: '66',
      title: 'Chữ số đầu lớn hơn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số. Nếu chữ số hàng chục lớn hơn chữ số hàng đơn vị thì in ra `GIAM DAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên từ 10 đến 99.',
      outputDesc: 'Một dòng chữ `GIAM DAN`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(Math.floor(n / 10) > n % 10, 'GIAM DAN');
      },
      inputs: ['74', '23', '22', '51', '19', '90'],
    },
    {
      key: '49',
      title: 'Tổng hai chữ số lớn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số. Nếu tổng hai chữ số của nó lớn hơn 10 thì in ra `TONG LON HON 10`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên từ 10 đến 99.',
      outputDesc: 'Một dòng chữ `TONG LON HON 10`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(Math.floor(n / 10) + (n % 10) > 10, 'TONG LON HON 10');
      },
      inputs: ['76', '23', '55', '91', '99', '10'],
    },

    // ===================================================================
    // CHẶNG I — Kết hợp hai điều kiện bằng `and`
    // ===================================================================
    {
      key: '23',
      title: 'Tuổi thiếu niên',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tuổi của một bạn. Nếu tuổi nằm trong khoảng từ 10 đến 15 (tính cả 10 và 15) thì in ra `THIEU NIEN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'Một dòng chữ `THIEU NIEN`, hoặc không in gì.',
      note:
        'Muốn CẢ HAI điều kiện cùng đúng thì nối chúng bằng từ khóa `and`. ' +
        'Cả hai vế của `and` đều phải là một phép so sánh hoàn chỉnh.',
      solve: (input) => {
        const t = one(input);
        return when(t >= 10 && t <= 15, 'THIEU NIEN');
      },
      inputs: ['12', '9', '15', '16', '10', '20'],
    },
    {
      key: '26',
      title: 'Điểm loại khá',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em điểm của một bạn. Nếu điểm từ 7 đến 8 (tính cả 7 và 8) thì in ra `KHA`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên là điểm.',
      outputDesc: 'Một dòng chữ `KHA`, hoặc không in gì.',
      solve: (input) => {
        const d = one(input);
        return when(d >= 7 && d <= 8, 'KHA');
      },
      inputs: ['7', '6', '8', '9', '5', '10'],
    },
    {
      key: '68',
      title: 'Trong khoảng một đến trăm',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` vừa lớn hơn 0 vừa nhỏ hơn 100 thì in ra `TRONG KHOANG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `TRONG KHOANG`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n > 0 && n < 100, 'TRONG KHOANG');
      },
      inputs: ['50', '0', '100', '-5', '99', '1'],
    },
    {
      key: '67',
      title: 'Số dương chẵn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` vừa lớn hơn 0 vừa là số chẵn thì in ra `DUONG CHAN`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `DUONG CHAN`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n > 0 && n % 2 === 0, 'DUONG CHAN');
      },
      inputs: ['4', '0', '7', '10', '1', '100'],
    },
    {
      key: '24',
      title: 'Chia hết cho cả 2 và 3',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho CẢ 2 và 3 thì in ra `CHIA HET 2 VA 3`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CHIA HET 2 VA 3`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n % 2 === 0 && n % 3 === 0, 'CHIA HET 2 VA 3');
      },
      inputs: ['6', '4', '12', '9', '0', '8'],
    },
    {
      key: '71',
      title: 'Chia hết cho cả 3 và 5',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho CẢ 3 và 5 thì in ra `CHIA HET 3 VA 5`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CHIA HET 3 VA 5`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n % 3 === 0 && n % 5 === 0, 'CHIA HET 3 VA 5');
      },
      inputs: ['15', '9', '30', '10', '0', '7'],
    },
    {
      key: '28',
      title: 'Cùng dương',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số `a` và `b`. Nếu CẢ HAI số đều lớn hơn 0 thì in ra `CA HAI DUONG`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `CA HAI DUONG`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a > 0 && b > 0, 'CA HAI DUONG');
      },
      inputs: ['3 5', '-1 4', '7 2', '0 9', '10 8', '-2 -3'],
    },
    {
      key: '70',
      title: 'Cả hai đều lẻ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu CẢ HAI đều là số lẻ thì in ra `CA HAI LE`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `CA HAI LE`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a % 2 === 1 && b % 2 === 1, 'CA HAI LE');
      },
      inputs: ['3 5', '2 4', '7 1', '0 9', '11 13', '6 3'],
    },
    {
      key: '69',
      title: 'Một dương một âm',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Nếu `a` lớn hơn 0 và `b` nhỏ hơn 0 thì in ra `TRAI DAU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `TRAI DAU`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a > 0 && b < 0, 'TRAI DAU');
      },
      inputs: ['3 -5', '-1 4', '7 -2', '0 -9', '10 8', '-2 -3'],
    },
    {
      key: '72',
      title: 'Bằng nhau và cùng dương',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`. Nếu hai số bằng nhau VÀ cùng lớn hơn 0 thì in ra `BANG VA DUONG`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `BANG VA DUONG`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a === b && a > 0, 'BANG VA DUONG');
      },
      inputs: ['5 5', '0 0', '3 7', '-2 -2', '10 10', '1 2'],
    },

    // ===================================================================
    // CHẶNG J — Kết hợp hai điều kiện bằng `or`
    // ===================================================================
    {
      key: '25',
      title: 'Số ở hai đầu',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn 0 HOẶC lớn hơn 100 thì in ra `NGOAI KHOANG`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `NGOAI KHOANG`, hoặc không in gì.',
      note:
        'Chỉ cần MỘT trong hai điều kiện đúng là đủ thì nối chúng bằng từ khóa `or`. ' +
        'Khác với `and` ở chỗ `and` bắt cả hai cùng đúng.',
      solve: (input) => {
        const n = one(input);
        return when(n < 0 || n > 100, 'NGOAI KHOANG');
      },
      inputs: ['-5', '50', '200', '0', '150', '100'],
    },
    {
      key: '73',
      title: 'Quá nhỏ hoặc quá lớn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên `n`. Nếu `n` nhỏ hơn 10 HOẶC lớn hơn 90 thì in ra `O RIA`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên `n`.',
      outputDesc: 'Một dòng chữ `O RIA`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n < 10 || n > 90, 'O RIA');
      },
      inputs: ['5', '50', '95', '10', '90', '100'],
    },
    {
      key: '77',
      title: 'Hạng nhất hoặc nhì',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em thứ hạng của một bạn. Nếu thứ hạng là 1 HOẶC 2 thì in ra `CO GIAI`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên dương là thứ hạng.',
      outputDesc: 'Một dòng chữ `CO GIAI`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n === 1 || n === 2, 'CO GIAI');
      },
      inputs: ['1', '3', '2', '10', '1', '5'],
    },
    {
      key: '75',
      title: 'Chia hết cho 3 hoặc 5',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Nếu `n` chia hết cho 3 HOẶC chia hết cho 5 thì in ra `CHIA HET 3 HOAC 5`. Nếu không thì không in gì.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Một dòng chữ `CHIA HET 3 HOAC 5`, hoặc không in gì.',
      solve: (input) => {
        const n = one(input);
        return when(n % 3 === 0 || n % 5 === 0, 'CHIA HET 3 HOAC 5');
      },
      inputs: ['9', '7', '10', '11', '15', '13'],
    },
    {
      key: '29',
      title: 'Có ít nhất một số chẵn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu có ÍT NHẤT MỘT trong hai số là số chẵn thì in ra `CO SO CHAN`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `CO SO CHAN`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a % 2 === 0 || b % 2 === 0, 'CO SO CHAN');
      },
      inputs: ['4 7', '3 5', '2 8', '1 9', '6 3', '7 7'],
    },
    {
      key: '74',
      title: 'Có bạn chưa có kẹo',
      difficulty: 'MEDIUM',
      story:
        'Bạn A có `a` cái kẹo, bạn B có `b` cái. Nếu có ít nhất một bạn chưa có cái kẹo nào thì in ra `CO BAN CHUA CO`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `CO BAN CHUA CO`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a === 0 || b === 0, 'CO BAN CHUA CO');
      },
      inputs: ['0 5', '3 7', '9 0', '1 1', '0 0', '4 2'],
    },
    {
      key: '76',
      title: 'Có số vượt trăm',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`. Nếu có ít nhất một số lớn hơn 100 thì in ra `CO SO LON`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`.',
      outputDesc: 'Một dòng chữ `CO SO LON`, hoặc không in gì.',
      solve: (input) => {
        const [a, b] = ints(input);
        return when(a > 100 || b > 100, 'CO SO LON');
      },
      inputs: ['150 5', '3 7', '9 200', '100 100', '0 0', '101 1'],
    },

    // ===================================================================
    // CHẶNG K — Ba số
    // ===================================================================
    {
      key: '78',
      title: 'Tổng ba số vượt hai mươi',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên không âm `a`, `b`, `c`. Nếu tổng của cả ba lớn hơn 20 thì in ra `TONG LON`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `TONG LON`, hoặc không in gì.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return when(a + b + c > 20, 'TONG LON');
      },
      inputs: ['10 8 5', '1 2 3', '7 7 7', '10 5 5', '0 0 0', '20 1 1'],
    },
    {
      key: '79',
      title: 'Ba số bằng nhau',
      difficulty: 'HARD',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Nếu cả ba số đều bằng nhau thì in ra `BA SO BANG NHAU`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `BA SO BANG NHAU`, hoặc không in gì.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return when(a === b && b === c, 'BA SO BANG NHAU');
      },
      inputs: ['5 5 5', '1 2 3', '7 7 8', '0 0 0', '4 4 5', '9 9 9'],
    },
    {
      key: '80',
      title: 'Ba số giảm dần',
      difficulty: 'HARD',
      story:
        'Bài cuối khóa! Máy tính cho em ba số nguyên `a`, `b`, `c`. ' +
        'Nếu ba số xếp theo thứ tự GIẢM DẦN (số trước luôn lớn hơn số sau) thì in ra `GIAM DAN`. Nếu không thì không in gì.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Một dòng chữ `GIAM DAN`, hoặc không in gì.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return when(a > b && b > c, 'GIAM DAN');
      },
      inputs: ['9 5 1', '1 2 3', '7 7 7', '10 5 5', '100 50 0', '3 2 5'],
    },
  ],
};

export default course;

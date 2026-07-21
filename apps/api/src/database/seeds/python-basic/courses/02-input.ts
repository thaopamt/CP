import { CourseSpec } from '../types';

/**
 * Course 02 — Biến và nhập dữ liệu.
 * Mục tiêu: học sinh tiểu học làm quen với việc khai báo biến, đọc dữ liệu từ
 * bàn phím bằng input(), chuyển chuỗi sang số nguyên bằng int(), tách nhiều giá
 * trị trên một dòng bằng split(), và dùng lại giá trị đã nhập để in ra.
 *
 * PHẠM VI: khóa này dạy NHẬP DỮ LIỆU VÀ DÙNG BIẾN, không dạy số học. Chỉ dùng
 * phép cộng/trừ đơn giản (n + 1, n - 1, a + b + c) để học sinh thấy giá trị đã
 * nhập có thể tính toán được. Nhân, chia, //, % thuộc về course 03 — đừng
 * thêm vào đây, sẽ trùng bài với course 03.
 *
 * GỢI Ý: cố ý viết ít `note`. Chỉ bài đầu tiên giới thiệu một cú pháp MỚI
 * (input(), int(), split(), đọc nhiều dòng) mới có note; các bài sau học sinh
 * phải tự nhớ. Story và outputDesc mô tả YÊU CẦU, không nêu công thức.
 *
 * Thứ tự bài trong mảng `problems` chính là thứ tự hiển thị (seeder gán
 * orderIndex theo vị trí mảng), đi từ dễ đến khó theo 9 chặng:
 *   A. Đọc và in lại              F. Tách dữ liệu bằng split()
 *   B. Ghép dữ liệu vào câu       G. Output có nhãn
 *   C. Đọc hai dòng               H. Bố cục có khung
 *   D. Đọc ba dòng trở lên        I. Tổng hợp
 *   E. Tính đơn giản với biến
 * Độ khó tăng đơn điệu: EASY (A–E) → MEDIUM (F–H) → HARD (cuối chặng I).
 *
 * `key` là định danh bền của bài (slug = pybasic-02-<key>), KHÔNG phải thứ tự
 * hiển thị — đổi chỗ bài trong mảng thì giữ nguyên key để tiến độ học sinh
 * không bị lệch sang bài khác.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. For "fixed output" problems use a single `['']` input.
 */

/** Tách stdin thành từng dòng, bỏ dòng trống thừa ở cuối. */
const lines = (input: string): string[] => input.replace(/\n+$/, '').split('\n');
/** Dòng thứ i (0-based), đã cắt khoảng trắng hai đầu. */
const line = (input: string, i = 0): string => (lines(input)[i] ?? '').trim();
/** Tách các giá trị cách nhau bởi khoảng trắng trên một dòng. */
const words = (input: string): string[] => input.trim().split(/\s+/);
/** Đọc số nguyên ở dòng thứ i. */
const num = (input: string, i = 0): number => parseInt(line(input, i), 10);

const course: CourseSpec = {
  code: 'PYTHON-BASIC-02',
  title: 'Biến và nhập dữ liệu',
  description:
    'Khóa học thứ hai: học cách tạo biến để cất giữ dữ liệu, và dùng input() ' +
    'để đọc dữ liệu bạn nhập từ bàn phím. Cùng làm cho chương trình biết lắng nghe nhé!',
  tags: ['python', 'co-ban', 'bien', 'input', 'nhap-du-lieu'],
  problems: [
    // ===================================================================
    // CHẶNG A — Đọc và in lại
    // ===================================================================
    {
      key: '31',
      title: 'In lại dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em một dòng chữ. Hãy in lại đúng dòng chữ đó.',
      inputDesc: 'Một dòng chữ bất kỳ.',
      outputDesc: 'In lại đúng dòng chữ đã nhận.',
      note: 'Lệnh `input()` đọc một dòng từ bàn phím. Cất nó vào biến: `s = input()`.',
      solve: (input) => lines(input)[0] ?? '',
      inputs: ['Xin chao', 'Python that thu vi', 'Lap trinh vui qua', 'ABC', 'Hello', 'Chao buoi sang'],
    },
    {
      key: '02',
      title: 'In lại số đã nhập',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in lại đúng số đó.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'In lại đúng số đã nhập.',
      note: '`input()` luôn cho về chữ. Muốn có SỐ để tính toán, bọc thêm `int()`: `n = int(input())`.',
      solve: (input) => String(num(input)),
      inputs: ['7', '42', '100', '0', '1000', '5'],
    },
    {
      key: '05',
      title: 'Đóng khung bằng dấu ngoặc',
      difficulty: 'EASY',
      story: 'Máy tính cho em một từ. Hãy in từ đó ra, có thêm dấu ngoặc vuông ở hai bên.\n\nVí dụ với từ `An` thì in ra `[An]`.',
      inputDesc: 'Một dòng chứa một từ.',
      outputDesc: 'Từ đã nhập, có dấu `[` ở trước và `]` ở sau.',
      solve: (input) => '[' + line(input) + ']',
      inputs: ['An', 'Python', 'Meo', 'X', 'Lap trinh', 'Hoa'],
    },
    {
      key: '44',
      title: 'Thêm dấu chấm than',
      difficulty: 'EASY',
      story: 'Máy tính cho em một dòng chữ. Hãy in lại dòng chữ đó và thêm một dấu chấm than ở cuối.\n\nVí dụ với `Hoan ho` thì in ra `Hoan ho!`.',
      inputDesc: 'Một dòng chữ.',
      outputDesc: 'Dòng chữ đã nhập, thêm dấu `!` ở cuối.',
      solve: (input) => line(input) + '!',
      inputs: ['Hoan ho', 'Tuyet voi', 'Co len', 'A', 'Chuc mung', 'Gioi qua'],
    },
    {
      key: '43',
      title: 'Nói hai lần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một từ. Hãy in từ đó ra hai lần trên CÙNG một dòng, cách nhau một dấu cách.\n\nVí dụ với `Meo` thì in ra `Meo Meo`.',
      inputDesc: 'Một dòng chứa một từ.',
      outputDesc: 'Từ đã nhập, lặp lại hai lần trên một dòng, cách nhau một dấu cách.',
      solve: (input) => {
        const s = line(input);
        return s + ' ' + s;
      },
      inputs: ['Meo', 'Ha', 'An', 'X', 'Python', 'Vui'],
    },
    {
      key: '12',
      title: 'In tên ba lần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in tên đó ra ba lần, mỗi lần trên một dòng.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Ba dòng, mỗi dòng là tên đã nhập.',
      solve: (input) => {
        const ten = line(input);
        return ten + '\n' + ten + '\n' + ten;
      },
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh', 'Bao'],
    },
    {
      key: '37',
      title: 'Số yêu thích năm lần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số. Hãy in số đó ra năm lần trên CÙNG một dòng, cách nhau một dấu cách.\n\nVí dụ với `7` thì in ra `7 7 7 7 7`.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'Một dòng gồm số đã nhập lặp lại năm lần, cách nhau dấu cách.',
      solve: (input) => Array(5).fill(String(num(input))).join(' '),
      inputs: ['7', '3', '99', '0', '12', '5'],
    },
    {
      key: '38',
      title: 'Đánh số cho dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em một dòng chữ. Hãy in lại dòng chữ đó, phía trước thêm `1. ` (số một, dấu chấm, một dấu cách).\n\nVí dụ với `Hoc bai` thì in ra `1. Hoc bai`.',
      inputDesc: 'Một dòng chữ.',
      outputDesc: 'Dòng chữ đã nhập, phía trước có `1. `.',
      solve: (input) => '1. ' + line(input),
      inputs: ['Hoc bai', 'An com', 'Doc sach', 'A', 'Choi the thao', 'Ngu som'],
    },

    // ===================================================================
    // CHẶNG B — Ghép dữ liệu vào câu
    // ===================================================================
    {
      key: '01',
      title: 'Chào theo tên em nhập',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một cái tên. Hãy in ra lời chào theo mẫu: `Xin chao <ten>`.\n\nVí dụ với tên `An` thì in ra `Xin chao An`.',
      inputDesc: 'Một dòng chứa tên của em.',
      outputDesc: 'Một dòng chào theo mẫu.',
      note: 'Dấu phẩy trong print tự thêm một dấu cách: `print("Xin chao", ten)`.',
      solve: (input) => 'Xin chao ' + line(input),
      inputs: ['An', 'Binh', 'Lan', 'Minh Khoi', 'Hoa', 'Bao'],
    },
    {
      key: '18',
      title: 'Em học lớp mấy',
      difficulty: 'EASY',
      story: 'Máy tính cho em số lớp em đang học. Hãy in ra: `Em hoc lop <lop>`.',
      inputDesc: 'Một số nguyên là lớp.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => 'Em hoc lop ' + String(num(input)),
      inputs: ['1', '5', '3', '12', '2', '4'],
    },
    {
      key: '45',
      title: 'Số em đã chọn',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số. Hãy in ra: `So ban chon la <so>`.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => 'So ban chon la ' + String(num(input)),
      inputs: ['7', '0', '100', '42', '9', '365'],
    },
    {
      key: '33',
      title: 'In lại tên rồi chào',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in tên đó ra ở dòng 1, và in `Chao mung!` ở dòng 2.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Dòng 1: tên. Dòng 2: `Chao mung!`',
      solve: (input) => line(input) + '\nChao mung!',
      inputs: ['An', 'Bao', 'Chi', 'Dung', 'Em', 'Gia Han'],
    },
    {
      key: '20',
      title: 'Tên và lời chúc',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một cái tên. Hãy in ra hai dòng:\n\n```\nXin chao <ten>\nChuc mung sinh nhat!\n```',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Dòng 1: chào theo tên. Dòng 2: `Chuc mung sinh nhat!`',
      solve: (input) => 'Xin chao ' + line(input) + '\nChuc mung sinh nhat!',
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh', 'Bao'],
    },
    {
      key: '15',
      title: 'Lời chào lịch sự',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in ra: `Chao ban <ten>, chuc ban hoc tot!`',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Một dòng chào theo mẫu.',
      solve: (input) => 'Chao ban ' + line(input) + ', chuc ban hoc tot!',
      inputs: ['An', 'Lan', 'Minh', 'Hoa', 'Bao Chau', 'Gia Han'],
    },
    {
      key: '39',
      title: 'Lời chào thân thiện',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in ra: `Chao ban <ten>, rat vui duoc gap ban!`',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Một dòng chào theo mẫu.',
      solve: (input) => 'Chao ban ' + line(input) + ', rat vui duoc gap ban!',
      inputs: ['An', 'Lan', 'Minh', 'Hoa', 'Bao', 'Gia Han'],
    },
    {
      key: '59',
      title: 'Món ăn em thích',
      difficulty: 'EASY',
      story: 'Máy tính cho em tên một món ăn. Hãy in ra: `Em thich an <mon>`.',
      inputDesc: 'Một dòng chứa tên món ăn.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => 'Em thich an ' + line(input),
      inputs: ['pho', 'com tam', 'banh mi', 'bun bo', 'xoi', 'cha gio'],
    },

    // ===================================================================
    // CHẶNG C — Đọc hai dòng
    // ===================================================================
    {
      key: '22',
      title: 'Hai bạn cùng một dòng',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tên hai bạn ở hai dòng. Hãy in ra hai tên đó trên CÙNG một dòng, cách nhau một dấu cách.\n\nVí dụ với `An` và `Binh` thì in `An Binh`.',
      inputDesc: 'Dòng 1: tên bạn thứ nhất. Dòng 2: tên bạn thứ hai.',
      outputDesc: 'Hai tên trên một dòng, cách nhau một dấu cách.',
      note: 'Muốn đọc hai dòng thì gọi `input()` hai lần, mỗi lần cất vào một biến.',
      solve: (input) => line(input, 0) + ' ' + line(input, 1),
      inputs: ['An\nBinh', 'Lan\nHoa', 'Minh\nBao', 'Chi\nDung', 'Em\nGiang', 'Ha\nIn'],
    },
    {
      key: '36',
      title: 'Tên trước họ sau',
      difficulty: 'EASY',
      story:
        'Máy tính cho em họ ở dòng 1 và tên ở dòng 2. Người nước ngoài hay gọi TÊN trước rồi mới đến HỌ. ' +
        'Hãy in ra tên trước, họ sau, trên một dòng, cách nhau một dấu cách.\n\nVí dụ: họ `Nguyen`, tên `An` → `An Nguyen`.',
      inputDesc: 'Dòng 1: họ. Dòng 2: tên.',
      outputDesc: 'Tên rồi đến họ, cách nhau một dấu cách.',
      solve: (input) => line(input, 1) + ' ' + line(input, 0),
      inputs: ['Nguyen\nAn', 'Tran\nBinh', 'Le\nLan', 'Pham\nHoa', 'Vo\nMinh', 'Dang\nBao Chau'],
    },
    {
      key: '21',
      title: 'Ghép liền không dấu cách',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai từ ở hai dòng. Hãy in ra hai từ đó DÍNH LIỀN nhau, không có dấu cách ở giữa.\n\nVí dụ với `Py` và `thon` thì in ra `Python`.',
      inputDesc: 'Dòng 1: từ thứ nhất. Dòng 2: từ thứ hai.',
      outputDesc: 'Hai từ dính liền nhau trên một dòng.',
      solve: (input) => line(input, 0) + line(input, 1),
      inputs: ['Py\nthon', 'lap\ntrinh', 'A\nB', 'meo\ncon', 'hoc\nsinh', 'may\ntinh'],
    },
    {
      key: '46',
      title: 'Nối bằng dấu gạch',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai từ ở hai dòng. Hãy in ra hai từ đó nối với nhau bằng một dấu gạch ngang, không có dấu cách.\n\nVí dụ với `hoc` và `sinh` thì in ra `hoc-sinh`.',
      inputDesc: 'Dòng 1: từ thứ nhất. Dòng 2: từ thứ hai.',
      outputDesc: 'Hai từ nối bằng dấu `-`.',
      solve: (input) => line(input, 0) + '-' + line(input, 1),
      inputs: ['hoc\nsinh', 'lap\ntrinh', 'A\nB', 'meo\ncon', 'ban\nhoc', 'may\ntinh'],
    },
    {
      key: '25',
      title: 'In số rồi in tên',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số ở dòng 1 và một tên ở dòng 2. Hãy in số ra trước (dòng 1) rồi in tên ra sau (dòng 2).',
      inputDesc: 'Dòng 1: một số nguyên. Dòng 2: một tên.',
      outputDesc: 'Dòng 1: số đã nhập. Dòng 2: tên đã nhập.',
      solve: (input) => String(num(input, 0)) + '\n' + line(input, 1),
      inputs: ['7\nAn', '0\nBinh', '100\nLan', '5\nHoa', '42\nMinh', '999\nBao'],
    },
    {
      key: '16',
      title: 'Đổi chỗ hai số',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số ở hai dòng. Hãy in chúng ra theo thứ tự ĐẢO LẠI: số ở dòng 2 in trước, số ở dòng 1 in sau, mỗi số một dòng.\n\nVí dụ với `3` và `5` thì in:\n\n```\n5\n3\n```',
      inputDesc: 'Dòng 1: số thứ nhất. Dòng 2: số thứ hai.',
      outputDesc: 'Dòng 1: số thứ hai. Dòng 2: số thứ nhất.',
      solve: (input) => String(num(input, 1)) + '\n' + String(num(input, 0)),
      inputs: ['3\n5', '10\n20', '0\n7', '100\n1', '7\n7', '500\n9'],
    },
    {
      key: '35',
      title: 'Chào hai bạn',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tên bạn thứ nhất ở dòng 1 và tên bạn thứ hai ở dòng 2. ' +
        'Hãy in ra lời chào cả hai theo mẫu: `Xin chao <ten1> va <ten2>`.\n\n' +
        'Ví dụ với `An` và `Binh` thì in ra `Xin chao An va Binh`.',
      inputDesc: 'Dòng 1: tên bạn thứ nhất. Dòng 2: tên bạn thứ hai.',
      outputDesc: 'Một dòng chào cả hai bạn theo mẫu.',
      solve: (input) => 'Xin chao ' + line(input, 0) + ' va ' + line(input, 1),
      inputs: ['An\nBinh', 'Lan\nHoa', 'Minh\nBao', 'Chi\nDung', 'Gia Han\nMinh Khoi', 'A\nB'],
    },
    {
      key: '23',
      title: 'Nhắc lại dòng thứ hai',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai dòng chữ. Hãy in dòng thứ HAI ra hai lần, mỗi lần trên một dòng. Dòng thứ nhất không in.',
      inputDesc: 'Dòng 1: dòng chữ thứ nhất. Dòng 2: dòng chữ thứ hai.',
      outputDesc: 'Hai dòng, cả hai đều là dòng chữ thứ hai.',
      solve: (input) => {
        const b = line(input, 1);
        return b + '\n' + b;
      },
      inputs: ['Mot\nHai', 'An\nBinh', 'bo qua\nlay cai nay', 'X\nY', 'Hello\nWorld', 'a\nb'],
    },
    {
      key: '60',
      title: 'Hai lần rồi một lần',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai dòng chữ. Hãy in dòng thứ nhất ra hai lần, rồi in dòng thứ hai một lần. Mỗi lần in trên một dòng.\n\nVí dụ với `A` và `B` thì in:\n\n```\nA\nA\nB\n```',
      inputDesc: 'Dòng 1: dòng chữ thứ nhất. Dòng 2: dòng chữ thứ hai.',
      outputDesc: 'Ba dòng theo mẫu.',
      solve: (input) => {
        const a = line(input, 0);
        return a + '\n' + a + '\n' + line(input, 1);
      },
      inputs: ['A\nB', 'Mot\nHai', 'meo\ncho', 'X\nY', 'Hoc\nChoi', 'a\nb'],
    },
    {
      key: '61',
      title: 'Hai buổi học',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tên môn học buổi sáng ở dòng 1 và buổi chiều ở dòng 2. Hãy in ra:\n\n```\nSang: <mon1>\nChieu: <mon2>\n```',
      inputDesc: 'Dòng 1: môn buổi sáng. Dòng 2: môn buổi chiều.',
      outputDesc: 'Hai dòng theo mẫu.',
      solve: (input) => 'Sang: ' + line(input, 0) + '\nChieu: ' + line(input, 1),
      inputs: ['Toan\nVan', 'Ly\nHoa', 'Tieng Anh\nThe duc', 'Su\nDia', 'Sinh\nTin', 'Nhac\nMy thuat'],
    },

    // ===================================================================
    // CHẶNG D — Đọc ba dòng trở lên
    // ===================================================================
    {
      key: '40',
      title: 'In lại ba dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em ba dòng chữ. Hãy in lại đúng cả ba dòng đó theo thứ tự.',
      inputDesc: 'Ba dòng chữ.',
      outputDesc: 'In lại đúng ba dòng đã nhận.',
      solve: (input) => lines(input).slice(0, 3).join('\n'),
      inputs: ['Mot\nHai\nBa', 'Python\nthat\nhay', 'a\nb\nc', 'Xin\nchao\nban', 'Hoc\nlap\ntrinh', 'X\nY\nZ'],
    },
    {
      key: '32',
      title: 'In lại ba số',
      difficulty: 'EASY',
      story: 'Máy tính cho em ba số nguyên, mỗi số một dòng. Hãy in lại đúng ba số đó theo thứ tự.',
      inputDesc: 'Ba dòng, mỗi dòng một số nguyên.',
      outputDesc: 'Ba dòng, in lại đúng ba số đã nhận.',
      solve: (input) =>
        lines(input)
          .slice(0, 3)
          .map((n) => String(parseInt(n, 10)))
          .join('\n'),
      inputs: ['1\n2\n3', '10\n20\n30', '0\n0\n0', '7\n42\n100', '5\n5\n5', '99\n1\n50'],
    },
    {
      key: '07',
      title: 'Ba dòng in ngược',
      difficulty: 'EASY',
      story:
        'Máy tính cho em ba dòng chữ. Hãy in lại cả ba dòng nhưng theo thứ tự NGƯỢC LẠI: dòng cuối in trước, dòng đầu in sau.\n\nVí dụ với `A`, `B`, `C` thì in:\n\n```\nC\nB\nA\n```',
      inputDesc: 'Ba dòng chữ.',
      outputDesc: 'Ba dòng đã nhận, in theo thứ tự ngược lại.',
      solve: (input) => lines(input).slice(0, 3).reverse().join('\n'),
      inputs: ['A\nB\nC', 'Mot\nHai\nBa', 'Xin\nchao\nban', 'x\ny\nz', 'Hoc\nlap\ntrinh', '1\n2\n3'],
    },
    {
      key: '08',
      title: 'Chỉ in dòng giữa',
      difficulty: 'EASY',
      story: 'Máy tính cho em ba dòng chữ. Hãy chỉ in ra dòng ở GIỮA (dòng thứ hai), bỏ qua hai dòng còn lại.',
      inputDesc: 'Ba dòng chữ.',
      outputDesc: 'Một dòng: dòng chữ thứ hai.',
      solve: (input) => line(input, 1),
      inputs: ['A\nB\nC', 'Mot\nHai\nBa', 'bo\nlay\nbo', 'x\ny\nz', 'Hoc\nlap\ntrinh', '1\n2\n3'],
    },
    {
      key: '47',
      title: 'Đầu và cuối',
      difficulty: 'EASY',
      story:
        'Máy tính cho em ba dòng chữ. Hãy in ra dòng ĐẦU và dòng CUỐI, mỗi dòng một dòng, bỏ qua dòng giữa.\n\nVí dụ với `A`, `B`, `C` thì in:\n\n```\nA\nC\n```',
      inputDesc: 'Ba dòng chữ.',
      outputDesc: 'Hai dòng: dòng thứ nhất và dòng thứ ba.',
      solve: (input) => line(input, 0) + '\n' + line(input, 2),
      inputs: ['A\nB\nC', 'Mot\nHai\nBa', 'lay\nbo\nlay', 'x\ny\nz', 'Hoc\nlap\ntrinh', '1\n2\n3'],
    },
    {
      key: '49',
      title: 'Ba bạn thành danh sách',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tên ba bạn ở ba dòng. Hãy in cả ba tên trên MỘT dòng, ngăn cách bằng dấu phẩy và một dấu cách.\n\nVí dụ với `An`, `Binh`, `Lan` thì in ra `An, Binh, Lan`.',
      inputDesc: 'Ba dòng, mỗi dòng một tên.',
      outputDesc: 'Một dòng gồm ba tên, ngăn cách bằng `, `. Cuối dòng không có dấu phẩy.',
      solve: (input) => lines(input).slice(0, 3).map((s) => s.trim()).join(', '),
      inputs: ['An\nBinh\nLan', 'Hoa\nMinh\nBao', 'A\nB\nC', 'Chi\nDung\nGiang', 'x\ny\nz', 'Mot\nHai\nBa'],
    },
    {
      key: '48',
      title: 'Đánh số ba việc',
      difficulty: 'EASY',
      story:
        'Máy tính cho em ba việc cần làm ở ba dòng. Hãy in lại cả ba, mỗi dòng có thêm số thứ tự ở phía trước.\n\nVí dụ với `An com`, `Hoc bai`, `Di ngu` thì in:\n\n```\n1. An com\n2. Hoc bai\n3. Di ngu\n```',
      inputDesc: 'Ba dòng, mỗi dòng một việc.',
      outputDesc: 'Ba dòng, mỗi dòng có `<số>. ` ở trước.',
      solve: (input) =>
        lines(input)
          .slice(0, 3)
          .map((s, i) => `${i + 1}. ${s.trim()}`)
          .join('\n'),
      inputs: [
        'An com\nHoc bai\nDi ngu',
        'Danh rang\nRua mat\nAn sang',
        'A\nB\nC',
        'Doc sach\nVe tranh\nChoi bong',
        'x\ny\nz',
        'Mot\nHai\nBa',
      ],
    },
    {
      key: '11',
      title: 'In lại bốn dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em bốn dòng chữ. Hãy in lại đúng cả bốn dòng đó theo thứ tự.',
      inputDesc: 'Bốn dòng chữ.',
      outputDesc: 'In lại đúng bốn dòng đã nhận.',
      solve: (input) => lines(input).slice(0, 4).join('\n'),
      inputs: [
        'Xuan\nHa\nThu\nDong',
        'A\nB\nC\nD',
        'Mot\nHai\nBa\nBon',
        'x\ny\nz\nt',
        'Hoc\nlap\ntrinh\nPython',
        '1\n2\n3\n4',
      ],
    },
    {
      key: '14',
      title: 'In lại năm dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em năm dòng chữ. Hãy in lại đúng cả năm dòng đó theo thứ tự.',
      inputDesc: 'Năm dòng chữ.',
      outputDesc: 'In lại đúng năm dòng đã nhận.',
      solve: (input) => lines(input).slice(0, 5).join('\n'),
      inputs: [
        'Thu hai\nThu ba\nThu tu\nThu nam\nThu sau',
        'A\nB\nC\nD\nE',
        'Mot\nHai\nBa\nBon\nNam',
        'x\ny\nz\nt\nu',
        '1\n2\n3\n4\n5',
        'Do\nRe\nMi\nFa\nSol',
      ],
    },
    {
      key: '62',
      title: 'Lấy dòng thứ ba',
      difficulty: 'EASY',
      story: 'Máy tính cho em năm dòng chữ. Hãy chỉ in ra dòng thứ BA, bỏ qua các dòng còn lại.',
      inputDesc: 'Năm dòng chữ.',
      outputDesc: 'Một dòng: dòng chữ thứ ba.',
      solve: (input) => line(input, 2),
      inputs: [
        'A\nB\nC\nD\nE',
        'Mot\nHai\nBa\nBon\nNam',
        'bo\nbo\nlay\nbo\nbo',
        'x\ny\nz\nt\nu',
        '1\n2\n3\n4\n5',
        'Do\nRe\nMi\nFa\nSol',
      ],
    },

    // ===================================================================
    // CHẶNG E — Tính đơn giản với dữ liệu đã nhập
    // ===================================================================
    {
      key: '03',
      title: 'Số tiếp theo',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in ra số liền sau nó.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số liền sau số đã nhập.',
      note: 'Nhớ dùng `int()` để đổi chữ thành số, nếu không máy sẽ nối chuỗi thay vì cộng!',
      solve: (input) => String(num(input) + 1),
      inputs: ['7', '0', '99', '10', '1000', '24'],
    },
    {
      key: '04',
      title: 'Số liền trước',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in ra số liền trước nó.',
      inputDesc: 'Một số nguyên dương.',
      outputDesc: 'Số liền trước số đã nhập.',
      solve: (input) => String(num(input) - 1),
      inputs: ['7', '1', '100', '50', '1000', '25'],
    },
    {
      key: '24',
      title: 'Tuổi hai năm nữa',
      difficulty: 'EASY',
      story: 'Máy tính cho em tuổi hiện tại của em. Hãy in ra tuổi của em sau hai năm nữa.',
      inputDesc: 'Một số nguyên là tuổi hiện tại.',
      outputDesc: 'Tuổi sau hai năm.',
      solve: (input) => String(num(input) + 2),
      inputs: ['10', '8', '0', '98', '12', '7'],
    },
    {
      key: '06',
      title: 'Gấp đôi con số',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in ra số đó gấp đôi.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số đã nhập gấp đôi.',
      solve: (input) => {
        const n = num(input);
        return String(n + n);
      },
      inputs: ['5', '0', '10', '50', '500', '3'],
    },
    {
      key: '13',
      title: 'Năm sinh từ tuổi',
      difficulty: 'EASY',
      story: 'Năm nay là 2026. Máy tính cho em tuổi của em. Hãy in ra năm sinh của em.',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'Năm sinh của em.',
      solve: (input) => String(2026 - num(input)),
      inputs: ['10', '8', '0', '26', '12', '7'],
    },
    {
      key: '64',
      title: 'Thêm mười đơn vị',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in ra số đó sau khi thêm 10 đơn vị.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số đã nhập cộng thêm 10.',
      solve: (input) => String(num(input) + 10),
      inputs: ['5', '0', '90', '100', '7', '1000'],
    },
    {
      key: '63',
      title: 'Năm ngoái và năm sau',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tuổi hiện tại của em. Hãy in ra hai dòng: dòng 1 là tuổi của em năm ngoái, dòng 2 là tuổi của em năm sau.',
      inputDesc: 'Một số nguyên là tuổi hiện tại.',
      outputDesc: 'Dòng 1: tuổi năm ngoái. Dòng 2: tuổi năm sau.',
      solve: (input) => {
        const n = num(input);
        return String(n - 1) + '\n' + String(n + 1);
      },
      inputs: ['10', '8', '1', '99', '12', '7'],
    },
    {
      key: '50',
      title: 'Ba số quanh nó',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên. Hãy in ra ba dòng: số liền trước, chính số đó, rồi số liền sau.\n\nVí dụ với `7` thì in:\n\n```\n6\n7\n8\n```',
      inputDesc: 'Một số nguyên dương.',
      outputDesc: 'Ba dòng: số liền trước, số đã nhập, số liền sau.',
      solve: (input) => {
        const n = num(input);
        return [n - 1, n, n + 1].join('\n');
      },
      inputs: ['7', '1', '100', '50', '1000', '25'],
    },
    {
      key: '51',
      title: 'Ba số liên tiếp',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên. Hãy in ra ba dòng: chính số đó, rồi hai số liên tiếp sau nó.\n\nVí dụ với `7` thì in:\n\n```\n7\n8\n9\n```',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Ba dòng: số đã nhập và hai số liền sau.',
      solve: (input) => {
        const n = num(input);
        return [n, n + 1, n + 2].join('\n');
      },
      inputs: ['7', '0', '99', '10', '1000', '24'],
    },

    // ===================================================================
    // CHẶNG F — Tách dữ liệu bằng split()
    // ===================================================================
    {
      key: '34',
      title: 'In lại hai số cùng dòng',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em hai số trên CÙNG một dòng, cách nhau một dấu cách. Hãy in lại đúng hai số đó, cách nhau một dấu cách.',
      inputDesc: 'Một dòng chứa hai số cách nhau dấu cách.',
      outputDesc: 'In lại hai số, cách nhau một dấu cách.',
      note: 'Khi nhiều giá trị nằm trên MỘT dòng, dùng `input().split()` để tách chúng ra: `a, b = input().split()`.',
      solve: (input) => {
        const p = words(input);
        return p[0] + ' ' + p[1];
      },
      inputs: ['3 5', '10 20', '7 1', '100 200', '0 9', '42 42'],
    },
    {
      key: '09',
      title: 'Đảo hai số cùng dòng',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số trên cùng một dòng. Hãy in lại hai số đó theo thứ tự ĐẢO LẠI, vẫn trên một dòng, cách nhau một dấu cách.\n\nVí dụ với `3 5` thì in ra `5 3`.',
      inputDesc: 'Một dòng chứa hai số cách nhau dấu cách.',
      outputDesc: 'Hai số theo thứ tự đảo lại, cách nhau một dấu cách.',
      solve: (input) => {
        const p = words(input);
        return p[1] + ' ' + p[0];
      },
      inputs: ['3 5', '10 20', '7 1', '100 200', '0 9', '42 43'],
    },
    {
      key: '65',
      title: 'Hai từ nối bằng chữ va',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai từ trên cùng một dòng. Hãy in ra hai từ đó nối với nhau bằng chữ `va`.\n\nVí dụ với `An Binh` thì in ra `An va Binh`.',
      inputDesc: 'Một dòng chứa hai từ cách nhau dấu cách.',
      outputDesc: 'Hai từ nối bằng ` va `.',
      solve: (input) => {
        const p = words(input);
        return p[0] + ' va ' + p[1];
      },
      inputs: ['An Binh', 'Nguyen Lan', 'meo cho', 'A B', 'hoc sinh', 'Python hay'],
    },
    {
      key: '52',
      title: 'Hai từ nối bằng gạch',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai từ trên cùng một dòng. Hãy in ra hai từ đó nối bằng một dấu gạch ngang, không có dấu cách.\n\nVí dụ với `hoc sinh` thì in ra `hoc-sinh`.',
      inputDesc: 'Một dòng chứa hai từ cách nhau dấu cách.',
      outputDesc: 'Hai từ nối bằng dấu `-`.',
      solve: (input) => {
        const p = words(input);
        return p[0] + '-' + p[1];
      },
      inputs: ['hoc sinh', 'lap trinh', 'A B', 'meo con', 'ban hoc', 'may tinh'],
    },
    {
      key: '26',
      title: 'Ba số thành ba dòng',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em ba số trên CÙNG một dòng. Hãy in mỗi số ra một dòng riêng, theo đúng thứ tự.',
      inputDesc: 'Một dòng chứa ba số cách nhau dấu cách.',
      outputDesc: 'Ba dòng, mỗi dòng một số theo thứ tự đã nhận.',
      solve: (input) => words(input).slice(0, 3).join('\n'),
      inputs: ['1 2 3', '10 20 30', '0 0 0', '7 42 100', '5 5 5', '99 1 50'],
    },
    {
      key: '27',
      title: 'Ba số đảo ngược',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số trên cùng một dòng. Hãy in lại cả ba số theo thứ tự ĐẢO LẠI, vẫn trên một dòng, cách nhau dấu cách.\n\nVí dụ với `1 2 3` thì in ra `3 2 1`.',
      inputDesc: 'Một dòng chứa ba số cách nhau dấu cách.',
      outputDesc: 'Ba số theo thứ tự đảo lại, trên một dòng, cách nhau dấu cách.',
      solve: (input) => words(input).slice(0, 3).reverse().join(' '),
      inputs: ['1 2 3', '10 20 30', '0 0 0', '7 42 100', '5 5 5', '99 1 50'],
    },
    {
      key: '66',
      title: 'Lấy số ở giữa',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em ba số trên cùng một dòng. Hãy chỉ in ra số ở GIỮA.',
      inputDesc: 'Một dòng chứa ba số cách nhau dấu cách.',
      outputDesc: 'Một dòng: số ở giữa.',
      solve: (input) => words(input)[1],
      inputs: ['1 2 3', '10 20 30', '0 7 0', '7 42 100', '5 6 5', '99 1 50'],
    },
    {
      key: '30',
      title: 'Số đầu và số cuối',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số trên cùng một dòng. Hãy in ra số ĐẦU và số CUỐI trên một dòng, cách nhau một dấu cách, bỏ qua số giữa.\n\nVí dụ với `1 2 3` thì in ra `1 3`.',
      inputDesc: 'Một dòng chứa ba số cách nhau dấu cách.',
      outputDesc: 'Số thứ nhất và số thứ ba, cách nhau một dấu cách.',
      solve: (input) => {
        const p = words(input);
        return p[0] + ' ' + p[2];
      },
      inputs: ['1 2 3', '10 20 30', '0 7 0', '7 42 100', '5 6 5', '99 1 50'],
    },
    {
      key: '53',
      title: 'Ba từ thành danh sách',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba từ trên cùng một dòng. Hãy in lại cả ba từ, ngăn cách bằng dấu phẩy và một dấu cách.\n\nVí dụ với `Cam Xoai Chuoi` thì in ra `Cam, Xoai, Chuoi`.',
      inputDesc: 'Một dòng chứa ba từ cách nhau dấu cách.',
      outputDesc: 'Một dòng gồm ba từ ngăn cách bằng `, `. Cuối dòng không có dấu phẩy.',
      solve: (input) => words(input).slice(0, 3).join(', '),
      inputs: ['Cam Xoai Chuoi', 'An Binh Lan', 'A B C', 'meo cho ga', 'Toan Van Anh', 'x y z'],
    },
    {
      key: '54',
      title: 'Bốn số thành bốn dòng',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em bốn số trên CÙNG một dòng. Hãy in mỗi số ra một dòng riêng, theo đúng thứ tự.',
      inputDesc: 'Một dòng chứa bốn số cách nhau dấu cách.',
      outputDesc: 'Bốn dòng, mỗi dòng một số theo thứ tự đã nhận.',
      solve: (input) => words(input).slice(0, 4).join('\n'),
      inputs: ['1 2 3 4', '10 20 30 40', '0 0 0 0', '7 42 100 5', '5 5 5 5', '99 1 50 8'],
    },

    // ===================================================================
    // CHẶNG G — Output có nhãn
    // ===================================================================
    {
      key: '67',
      title: 'Nhãn cho số đã nhập',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một số. Hãy in ra: `Ban da nhap so <so>`.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => 'Ban da nhap so ' + String(num(input)),
      inputs: ['7', '0', '100', '42', '9', '365'],
    },
    {
      key: '10',
      title: 'Giới thiệu bản thân',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một cái tên ở dòng 1 và tuổi ở dòng 2. Hãy in ra: `Toi ten <ten>` ở dòng 1 và `Toi <tuoi> tuoi` ở dòng 2.\n\nVí dụ với `An` và `10` thì in:\n\n```\nToi ten An\nToi 10 tuoi\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: tuổi (số nguyên).',
      outputDesc: 'Hai dòng giới thiệu theo mẫu.',
      solve: (input) => 'Toi ten ' + line(input, 0) + '\nToi ' + String(num(input, 1)) + ' tuoi',
      inputs: ['An\n10', 'Binh\n8', 'Lan\n12', 'Hoa\n7', 'Minh\n9', 'Bao\n11'],
    },
    {
      key: '19',
      title: 'Nhãn tên và lớp',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1 và lớp ở dòng 2. Hãy in ra:\n\n```\nTen: <ten>\nLop: <lop>\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp.',
      outputDesc: 'Hai dòng có nhãn theo mẫu.',
      solve: (input) => 'Ten: ' + line(input, 0) + '\nLop: ' + line(input, 1),
      inputs: ['An\n5A', 'Binh\n4B', 'Lan\n3C', 'Hoa\n1A', 'Minh Khoi\n2D', 'Bao\n5E'],
    },
    {
      key: '58',
      title: 'Hai nhãn trên một dòng',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1 và lớp ở dòng 2. Hãy in cả hai trên MỘT dòng theo mẫu: `Ten: <ten> | Lop: <lop>`.\n\nChú ý dấu `|` có một dấu cách ở mỗi bên.',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => 'Ten: ' + line(input, 0) + ' | Lop: ' + line(input, 1),
      inputs: ['An\n5A', 'Binh\n4B', 'Lan\n3C', 'Hoa\n1A', 'Minh Khoi\n2D', 'Bao\n5E'],
    },
    {
      key: '56',
      title: 'Điểm của bạn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một cái tên ở dòng 1 và một số điểm ở dòng 2. Hãy in ra: `<ten> co <diem> diem`.\n\nVí dụ với `An` và `10` thì in ra `An co 10 diem`.',
      inputDesc: 'Dòng 1: tên. Dòng 2: điểm (số nguyên).',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => line(input, 0) + ' co ' + String(num(input, 1)) + ' diem',
      inputs: ['An\n10', 'Binh\n8', 'Lan\n9', 'Hoa\n0', 'Minh Khoi\n7', 'Bao\n100'],
    },
    {
      key: '57',
      title: 'Câu có hai chỗ trống',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một cái tên ở dòng 1 và một nơi chốn ở dòng 2. Hãy in ra: `Hom nay <ten> di <noi>`.\n\nVí dụ với `An` và `hoc` thì in ra `Hom nay An di hoc`.',
      inputDesc: 'Dòng 1: tên. Dòng 2: nơi chốn.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => 'Hom nay ' + line(input, 0) + ' di ' + line(input, 1),
      inputs: ['An\nhoc', 'Binh\nchoi', 'Lan\ncho', 'Hoa\nboi', 'Minh Khoi\nda bong', 'Bao\nthu vien'],
    },
    {
      key: '68',
      title: 'Lời nhắn cho bạn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một cái tên ở dòng 1 và một môn học ở dòng 2. Hãy in ra: `<ten> oi, nho hoc bai <mon> nhe!`',
      inputDesc: 'Dòng 1: tên. Dòng 2: môn học.',
      outputDesc: 'Một dòng theo mẫu.',
      solve: (input) => line(input, 0) + ' oi, nho hoc bai ' + line(input, 1) + ' nhe!',
      inputs: ['An\nToan', 'Binh\nVan', 'Lan\nTieng Anh', 'Hoa\nSu', 'Minh Khoi\nDia', 'Bao\nTin hoc'],
    },
    {
      key: '28',
      title: 'Tổng số học sinh',
      difficulty: 'MEDIUM',
      story:
        'Lớp có một số bạn nam và một số bạn nữ. Máy tính cho em số bạn nam ở dòng 1 và số bạn nữ ở dòng 2. Hãy in ra: `Tong: <tong>` với tổng là tổng số học sinh của lớp.',
      inputDesc: 'Dòng 1: số bạn nam. Dòng 2: số bạn nữ.',
      outputDesc: 'Một dòng: `Tong: ` ghép với tổng số học sinh.',
      solve: (input) => 'Tong: ' + String(num(input, 0) + num(input, 1)),
      inputs: ['15\n20', '0\n0', '18\n18', '30\n1', '12\n13', '500\n500'],
    },
    {
      key: '17',
      title: 'Tổng ba số',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em ba số nguyên ở ba dòng. Hãy in ra tổng của cả ba số.',
      inputDesc: 'Mỗi dòng một số nguyên, tổng cộng ba dòng.',
      outputDesc: 'Tổng của ba số.',
      solve: (input) => String(num(input, 0) + num(input, 1) + num(input, 2)),
      inputs: ['1\n2\n3', '0\n0\n0', '10\n20\n30', '5\n5\n5', '100\n1\n1', '7\n8\n9'],
    },
    {
      key: '55',
      title: 'Ba nhãn thông tin',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1, lớp ở dòng 2 và điểm ở dòng 3. Hãy in ra:\n\n```\nTen: <ten>\nLop: <lop>\nDiem: <diem>\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp. Dòng 3: điểm (số nguyên).',
      outputDesc: 'Ba dòng có nhãn theo mẫu.',
      solve: (input) =>
        'Ten: ' + line(input, 0) + '\nLop: ' + line(input, 1) + '\nDiem: ' + String(num(input, 2)),
      inputs: ['An\n5A\n10', 'Binh\n4B\n8', 'Lan\n3C\n9', 'Hoa\n1A\n0', 'Minh Khoi\n2D\n7', 'Bao\n5E\n100'],
    },

    // ===================================================================
    // CHẶNG H — Bố cục có khung
    // ===================================================================
    {
      key: '69',
      title: 'Kẻ khung trên dưới',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một dòng chữ. Hãy in dòng chữ đó ra, phía trên và phía dưới đều có một đường kẻ gồm đúng 10 dấu gạch ngang.\n\nVí dụ với `Xin chao` thì in:\n\n```\n----------\nXin chao\n----------\n```',
      inputDesc: 'Một dòng chữ.',
      outputDesc: 'Ba dòng: đường kẻ, dòng chữ, đường kẻ.',
      solve: (input) => {
        const vien = '-'.repeat(10);
        return vien + '\n' + line(input) + '\n' + vien;
      },
      inputs: ['Xin chao', 'An', 'Python', 'Thong bao', 'X', 'Chao mung'],
    },
    {
      key: '41',
      title: 'Thẻ tên',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một cái tên. Hãy in ra thẻ tên có khung:\n\n```\n+------+\n| <ten>\n+------+\n```\n\nDòng giữa là dấu `|`, một dấu cách rồi đến tên.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Ba dòng: viền trên, dòng tên, viền dưới.',
      solve: (input) => '+------+\n| ' + line(input) + '\n+------+',
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh', 'Bao Chau'],
    },
    {
      key: '70',
      title: 'Thẻ có hai dòng',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1 và lớp ở dòng 2. Hãy in ra tấm thẻ:\n\n```\n+--------+\n| <ten>\n| <lop>\n+--------+\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp.',
      outputDesc: 'Bốn dòng: viền trên, dòng tên, dòng lớp, viền dưới.',
      solve: (input) => {
        const vien = '+' + '-'.repeat(8) + '+';
        return [vien, '| ' + line(input, 0), '| ' + line(input, 1), vien].join('\n');
      },
      inputs: ['An\n5A', 'Binh\n4B', 'Lan\n3C', 'Hoa\n1A', 'Minh Khoi\n2D', 'Bao\n5E'],
    },
    {
      key: '29',
      title: 'Phiếu thông tin',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1 và tuổi ở dòng 2. Hãy in ra phiếu thông tin:\n\n```\n=== PHIEU ===\nTen: <ten>\nTuoi: <tuoi>\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: tuổi (số nguyên).',
      outputDesc: 'Ba dòng phiếu thông tin theo mẫu.',
      solve: (input) => '=== PHIEU ===\nTen: ' + line(input, 0) + '\nTuoi: ' + String(num(input, 1)),
      inputs: ['An\n10', 'Binh\n8', 'Lan\n12', 'Hoa\n7', 'Minh Khoi\n9', 'Bao\n11'],
    },
    {
      key: '71',
      title: 'Thực đơn hai món',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên hai món ăn ở hai dòng. Hãy in ra thực đơn:\n\n```\n=== MENU ===\n1. <mon1>\n2. <mon2>\n```',
      inputDesc: 'Dòng 1: món thứ nhất. Dòng 2: món thứ hai.',
      outputDesc: 'Ba dòng thực đơn theo mẫu.',
      solve: (input) => '=== MENU ===\n1. ' + line(input, 0) + '\n2. ' + line(input, 1),
      inputs: ['Pho\nBun bo', 'Com tam\nBanh mi', 'Xoi\nCha gio', 'A\nB', 'Mi quang\nHu tieu', 'Banh xeo\nGoi cuon'],
    },
    {
      key: '72',
      title: 'Thời khóa biểu ba ngày',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba môn học ở ba dòng. Hãy in ra thời khóa biểu:\n\n```\nThu 2: <mon1>\nThu 3: <mon2>\nThu 4: <mon3>\n```',
      inputDesc: 'Ba dòng, mỗi dòng một môn học.',
      outputDesc: 'Ba dòng thời khóa biểu theo mẫu.',
      solve: (input) =>
        lines(input)
          .slice(0, 3)
          .map((mon, i) => `Thu ${i + 2}: ${mon.trim()}`)
          .join('\n'),
      inputs: [
        'Toan\nVan\nAnh',
        'Ly\nHoa\nSinh',
        'Su\nDia\nTin',
        'A\nB\nC',
        'The duc\nNhac\nMy thuat',
        'Toan\nToan\nToan',
      ],
    },
    {
      key: '73',
      title: 'Phiếu điểm',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1 và điểm ở dòng 2. Hãy in ra phiếu điểm:\n\n```\n--- PHIEU DIEM ---\nHo ten: <ten>\nDiem so: <diem>\n------------------\n```\n\nHai đường kẻ dưới cùng gồm đúng 18 dấu gạch ngang.',
      inputDesc: 'Dòng 1: tên. Dòng 2: điểm (số nguyên).',
      outputDesc: 'Bốn dòng phiếu điểm theo mẫu.',
      solve: (input) =>
        [
          '--- PHIEU DIEM ---',
          'Ho ten: ' + line(input, 0),
          'Diem so: ' + String(num(input, 1)),
          '-'.repeat(18),
        ].join('\n'),
      inputs: ['An\n10', 'Binh\n8', 'Lan\n9', 'Hoa\n0', 'Minh Khoi\n7', 'Bao\n100'],
    },
    {
      key: '74',
      title: 'Danh thiếp',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1, lớp ở dòng 2 và trường ở dòng 3. Hãy in ra tấm danh thiếp:\n\n```\n+============+\n| <ten>\n| Lop <lop>\n| Truong <truong>\n+============+\n```\n\nHai đường viền gồm dấu `+`, đúng 12 dấu `=`, rồi dấu `+`.',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp. Dòng 3: tên trường.',
      outputDesc: 'Năm dòng danh thiếp theo mẫu.',
      solve: (input) => {
        const vien = '+' + '='.repeat(12) + '+';
        return [
          vien,
          '| ' + line(input, 0),
          '| Lop ' + line(input, 1),
          '| Truong ' + line(input, 2),
          vien,
        ].join('\n');
      },
      inputs: [
        'An\n5A\nKim Dong',
        'Binh\n4B\nLe Loi',
        'Lan\n3C\nTran Phu',
        'Hoa\n1A\nNguyen Trai',
        'Minh Khoi\n2D\nHung Vuong',
        'Bao\n5E\nQuang Trung',
      ],
    },

    // ===================================================================
    // CHẶNG I — Tổng hợp
    // ===================================================================
    {
      key: '42',
      title: 'Tấm bằng khen',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một cái tên. Hãy in ra tấm bằng khen:\n\n```\n*** BANG KHEN ***\nTang ban: <ten>\nDa hoan thanh khoa input!\n```',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Ba dòng theo mẫu, dòng 2 ghép với tên.',
      solve: (input) => '*** BANG KHEN ***\nTang ban: ' + line(input) + '\nDa hoan thanh khoa input!',
      inputs: ['An', 'Lan', 'Minh Khoi', 'Bao Chau', 'Gia Han', 'Hoa'],
    },
    {
      key: '75',
      title: 'Thiệp mời sinh nhật',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên người được mời ở dòng 1, địa điểm ở dòng 2 và giờ ở dòng 3. Hãy in ra tấm thiệp:\n\n```\n*** THIEP MOI ***\nGui ban: <ten>\nDia diem: <noi>\nLuc: <gio> gio\nHen gap ban nhe!\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: địa điểm. Dòng 3: giờ (số nguyên).',
      outputDesc: 'Năm dòng thiệp mời theo mẫu.',
      solve: (input) =>
        [
          '*** THIEP MOI ***',
          'Gui ban: ' + line(input, 0),
          'Dia diem: ' + line(input, 1),
          'Luc: ' + String(num(input, 2)) + ' gio',
          'Hen gap ban nhe!',
        ].join('\n'),
      inputs: [
        'An\nNha van hoa\n18',
        'Binh\nCong vien\n9',
        'Lan\nNha rieng\n15',
        'Hoa\nTruong hoc\n7',
        'Minh Khoi\nQuan an\n20',
        'Bao\nSan bong\n16',
      ],
    },
    {
      key: '76',
      title: 'Bảng thông tin đầy đủ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em bốn dòng: tên, tuổi, lớp và môn học yêu thích. Hãy in ra:\n\n```\nHo ten: <ten>\nTuoi: <tuoi>\nLop: <lop>\nMon yeu thich: <mon>\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: tuổi (số nguyên). Dòng 3: lớp. Dòng 4: môn học.',
      outputDesc: 'Bốn dòng có nhãn theo mẫu.',
      solve: (input) =>
        [
          'Ho ten: ' + line(input, 0),
          'Tuoi: ' + String(num(input, 1)),
          'Lop: ' + line(input, 2),
          'Mon yeu thich: ' + line(input, 3),
        ].join('\n'),
      inputs: [
        'An\n10\n5A\nToan',
        'Binh\n8\n4B\nVan',
        'Lan\n12\n3C\nTieng Anh',
        'Hoa\n7\n1A\nMy thuat',
        'Minh Khoi\n9\n2D\nTin hoc',
        'Bao\n11\n5E\nThe duc',
      ],
    },
    {
      key: '77',
      title: 'Phiếu đăng ký câu lạc bộ',
      difficulty: 'HARD',
      story:
        'Máy tính cho em bốn dòng: tên, lớp, tên câu lạc bộ và số buổi mỗi tuần. Hãy in ra phiếu đăng ký:\n\n```\n+--------------------+\n| PHIEU DANG KY\n+--------------------+\n| Ho ten: <ten>\n| Lop: <lop>\n| CLB: <clb>\n| So buoi: <so> buoi/tuan\n+--------------------+\n```\n\nBa đường viền giống hệt nhau: dấu `+`, đúng 20 dấu gạch ngang, rồi dấu `+`.',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp. Dòng 3: tên câu lạc bộ. Dòng 4: số buổi (số nguyên).',
      outputDesc: 'Chín dòng phiếu đăng ký theo mẫu.',
      solve: (input) => {
        const vien = '+' + '-'.repeat(20) + '+';
        return [
          vien,
          '| PHIEU DANG KY',
          vien,
          '| Ho ten: ' + line(input, 0),
          '| Lop: ' + line(input, 1),
          '| CLB: ' + line(input, 2),
          '| So buoi: ' + String(num(input, 3)) + ' buoi/tuan',
          vien,
        ].join('\n');
      },
      inputs: [
        'An\n5A\nCo vua\n2',
        'Binh\n4B\nBong ro\n3',
        'Lan\n3C\nMua\n1',
        'Hoa\n1A\nVe tranh\n2',
        'Minh Khoi\n2D\nRobot\n4',
        'Bao\n5E\nBoi loi\n5',
      ],
    },
    {
      key: '78',
      title: 'Giấy khen có khung',
      difficulty: 'HARD',
      story:
        'Máy tính cho em ba dòng: tên, thành tích và năm học. Hãy in ra tờ giấy khen:\n\n```\n********************\n*    GIAY KHEN\n********************\n* Tang: <ten>\n* Thanh tich: <tt>\n* Nam hoc: <nam>\n********************\n```\n\nBa đường viền gồm đúng 20 dấu sao. Dòng tiêu đề là dấu `*`, BỐN dấu cách, rồi chữ `GIAY KHEN`.',
      inputDesc: 'Dòng 1: tên. Dòng 2: thành tích. Dòng 3: năm học.',
      outputDesc: 'Bảy dòng giấy khen theo mẫu.',
      solve: (input) => {
        const vien = '*'.repeat(20);
        return [
          vien,
          '*    GIAY KHEN',
          vien,
          '* Tang: ' + line(input, 0),
          '* Thanh tich: ' + line(input, 1),
          '* Nam hoc: ' + line(input, 2),
          vien,
        ].join('\n');
      },
      inputs: [
        'An\nHoc sinh gioi\n2025-2026',
        'Binh\nGiai nhi Toan\n2025-2026',
        'Lan\nVo dich co vua\n2024-2025',
        'Hoa\nHoc sinh tien tien\n2025-2026',
        'Minh Khoi\nGiai nhat Tin hoc\n2023-2024',
        'Bao\nCham ngoan\n2025-2026',
      ],
    },
    {
      key: '79',
      title: 'Hồ sơ học sinh',
      difficulty: 'HARD',
      story:
        'Máy tính cho em năm dòng: tên, tuổi, lớp, trường và sở thích. Hãy in ra hồ sơ:\n\n```\n===== HO SO =====\n1. Ho ten: <ten>\n2. Tuoi: <tuoi>\n3. Lop: <lop>\n4. Truong: <truong>\n5. So thich: <st>\n=================\n```\n\nDòng cuối gồm đúng 17 dấu bằng.',
      inputDesc: 'Dòng 1: tên. Dòng 2: tuổi (số nguyên). Dòng 3: lớp. Dòng 4: trường. Dòng 5: sở thích.',
      outputDesc: 'Bảy dòng hồ sơ theo mẫu.',
      solve: (input) =>
        [
          '===== HO SO =====',
          '1. Ho ten: ' + line(input, 0),
          '2. Tuoi: ' + String(num(input, 1)),
          '3. Lop: ' + line(input, 2),
          '4. Truong: ' + line(input, 3),
          '5. So thich: ' + line(input, 4),
          '='.repeat(17),
        ].join('\n'),
      inputs: [
        'An\n10\n5A\nKim Dong\nDoc sach',
        'Binh\n8\n4B\nLe Loi\nDa bong',
        'Lan\n12\n3C\nTran Phu\nVe tranh',
        'Hoa\n7\n1A\nNguyen Trai\nHat',
        'Minh Khoi\n9\n2D\nHung Vuong\nLap trinh',
        'Bao\n11\n5E\nQuang Trung\nBoi loi',
      ],
    },
    {
      key: '80',
      title: 'Thẻ thư viện',
      difficulty: 'HARD',
      story:
        'Bài cuối khóa! Máy tính cho em bốn dòng: tên, lớp, mã thẻ và số sách được mượn. ' +
        'Hãy in ra tấm thẻ thư viện:\n\n```\n+==================+\n|   THE THU VIEN\n+==================+\n| Ten: <ten>\n| Lop: <lop>\n| Ma the: TV-<ma>\n+------------------+\n| Duoc muon: <n> cuon\n| Chuc ban doc sach vui!\n+==================+\n```\n\nHai đường viền ngoài gồm dấu `+`, đúng 18 dấu `=`, rồi dấu `+`. ' +
        'Đường kẻ giữa gồm dấu `+`, đúng 18 dấu gạch ngang, rồi dấu `+`. ' +
        'Dòng tiêu đề là dấu `|`, BA dấu cách, rồi chữ `THE THU VIEN`. ' +
        'Mã thẻ luôn có `TV-` ở phía trước.',
      inputDesc: 'Dòng 1: tên. Dòng 2: lớp. Dòng 3: mã thẻ (số nguyên). Dòng 4: số sách (số nguyên).',
      outputDesc: 'Mười dòng thẻ thư viện theo mẫu.',
      solve: (input) => {
        const ngoai = '+' + '='.repeat(18) + '+';
        const giua = '+' + '-'.repeat(18) + '+';
        return [
          ngoai,
          '|   THE THU VIEN',
          ngoai,
          '| Ten: ' + line(input, 0),
          '| Lop: ' + line(input, 1),
          '| Ma the: TV-' + String(num(input, 2)),
          giua,
          '| Duoc muon: ' + String(num(input, 3)) + ' cuon',
          '| Chuc ban doc sach vui!',
          ngoai,
        ].join('\n');
      },
      inputs: [
        'An\n5A\n1024\n3',
        'Binh\n4B\n7\n5',
        'Lan\n3C\n999\n1',
        'Hoa\n1A\n42\n2',
        'Minh Khoi\n2D\n358\n10',
        'Bao\n5E\n1\n4',
      ],
    },
  ],
};

export default course;

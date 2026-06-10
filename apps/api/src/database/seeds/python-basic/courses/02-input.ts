import { CourseSpec } from '../types';

/**
 * Course 02 — Biến và nhập dữ liệu.
 * Mục tiêu: học sinh tiểu học làm quen với việc khai báo biến, đọc dữ liệu từ
 * bàn phím bằng input(), chuyển chuỗi sang số nguyên bằng int(), và dùng lại
 * giá trị đã nhập để in ra. Phần này dạy TRƯỚC các phép toán nâng cao nên chỉ
 * dùng nhiều nhất một phép cộng/trừ đơn giản, tập trung vào việc nhập và dùng biến.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. For "fixed output" problems use a single `['']` input.
 */
const course: CourseSpec = {
  code: 'PYTHON-BASIC-02',
  title: 'Biến và nhập dữ liệu',
  description:
    'Khóa học thứ hai: học cách tạo biến để cất giữ dữ liệu, và dùng input() ' +
    'để đọc dữ liệu bạn nhập từ bàn phím. Cùng làm cho chương trình biết lắng nghe nhé!',
  tags: ['python', 'co-ban', 'bien', 'input', 'nhap-du-lieu'],
  problems: [
    {
      key: '01',
      title: 'Chào theo tên em nhập',
      difficulty: 'EASY',
      story:
        'Máy tính sẽ hỏi tên em. Hãy đọc tên bằng `input()` rồi in ra lời chào theo mẫu: `Xin chao <ten>`.\n\nVí dụ với tên `An` thì in ra `Xin chao An`.',
      inputDesc: 'Một dòng chứa tên của em.',
      outputDesc: 'Dòng chữ `Xin chao ` ghép với tên đã nhập.',
      note: 'Đọc tên bằng `ten = input()` rồi `print("Xin chao", ten)`.',
      solve: (input) => 'Xin chao ' + (input.split('\n')[0] ?? '').trim(),
      inputs: ['An', 'Binh', 'Lan', 'Minh Khoi', 'Hoa', 'Bao'],
    },
    {
      key: '02',
      title: 'In lại số đã nhập',
      difficulty: 'EASY',
      story: 'Hãy đọc một số nguyên từ bàn phím, cất vào một biến, rồi in lại đúng số đó.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'In lại đúng số đã nhập.',
      note: 'Đọc số bằng `n = int(input())` rồi `print(n)`.',
      solve: (input) => String(parseInt(input.trim(), 10)),
      inputs: ['7', '42', '100', '0', '1000', '5'],
    },
    {
      key: '03',
      title: 'Số tiếp theo',
      difficulty: 'EASY',
      story: 'Hãy đọc một số nguyên rồi in ra số liền sau nó (số đó cộng thêm 1).',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số đã nhập cộng thêm 1.',
      note: 'Nhớ dùng `int(input())` để có số. Sau đó in ra `n + 1`.',
      solve: (input) => String(parseInt(input.trim(), 10) + 1),
      inputs: ['7', '0', '99', '10', '1000', '24'],
    },
    {
      key: '04',
      title: 'Số liền trước',
      difficulty: 'EASY',
      story: 'Hãy đọc một số nguyên rồi in ra số liền trước nó (số đó trừ đi 1).',
      inputDesc: 'Một số nguyên dương.',
      outputDesc: 'Số đã nhập trừ đi 1.',
      note: 'Dùng `int(input())` rồi in `n - 1`.',
      solve: (input) => String(parseInt(input.trim(), 10) - 1),
      inputs: ['7', '1', '100', '50', '1000', '25'],
    },
    {
      key: '05',
      title: 'Tuổi năm sau',
      difficulty: 'EASY',
      story: 'Hãy đọc tuổi của em rồi in ra tuổi của em vào năm sau (tuổi hiện tại cộng 1).',
      inputDesc: 'Một số nguyên là tuổi hiện tại.',
      outputDesc: 'Tuổi vào năm sau.',
      note: 'Tuổi năm sau = tuổi hiện tại + 1.',
      solve: (input) => String(parseInt(input.trim(), 10) + 1),
      inputs: ['10', '8', '12', '6', '99', '7'],
    },
    {
      key: '06',
      title: 'Gấp đôi con số',
      difficulty: 'EASY',
      story: 'Hãy đọc một số nguyên rồi in ra số đó gấp đôi (cộng chính nó với chính nó).',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số đã nhập nhân đôi.',
      note: 'Có thể tính `n + n` để được số gấp đôi.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(n + n);
      },
      inputs: ['5', '0', '10', '50', '500', '3'],
    },
    {
      key: '07',
      title: 'Tổng hai số',
      difficulty: 'EASY',
      story: 'Hãy đọc hai số nguyên ở hai dòng rồi in ra tổng của chúng.',
      inputDesc: 'Dòng 1: số thứ nhất. Dòng 2: số thứ hai.',
      outputDesc: 'Tổng hai số.',
      note: 'Đọc hai số bằng hai lệnh `int(input())`, rồi in ra `a + b`.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) + parseInt(b, 10));
      },
      inputs: ['3\n5', '10\n20', '0\n0', '100\n1', '7\n7', '500\n500'],
    },
    {
      key: '08',
      title: 'Hiệu hai số',
      difficulty: 'EASY',
      story: 'Hãy đọc hai số nguyên ở hai dòng rồi in ra hiệu (số thứ nhất trừ số thứ hai).',
      inputDesc: 'Dòng 1: số thứ nhất. Dòng 2: số thứ hai (số thứ nhất lớn hơn hoặc bằng số thứ hai).',
      outputDesc: 'Hiệu của hai số.',
      note: 'In ra `a - b`.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) - parseInt(b, 10));
      },
      inputs: ['9\n5', '10\n10', '20\n0', '100\n1', '7\n7', '1000\n500'],
    },
    {
      key: '09',
      title: 'Hai số trên một dòng',
      difficulty: 'EASY',
      story: 'Hãy đọc hai số nguyên nằm trên cùng một dòng, cách nhau dấu cách, rồi in ra tổng của chúng.',
      inputDesc: 'Một dòng chứa hai số cách nhau một dấu cách.',
      outputDesc: 'Tổng hai số.',
      note: 'Có thể đọc bằng `a, b = input().split()` rồi đổi sang số với `int(a)`, `int(b)`.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        return String(parseInt(parts[0], 10) + parseInt(parts[1], 10));
      },
      inputs: ['3 5', '10 20', '0 0', '100 1', '7 7', '500 500'],
    },
    {
      key: '10',
      title: 'Giới thiệu bản thân',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một cái tên ở dòng 1 và tuổi ở dòng 2. Hãy in ra: `Toi ten <ten>` ở dòng 1 và `Toi <tuoi> tuoi` ở dòng 2.\n\nVí dụ với `An` và `10` thì in:\n\n```\nToi ten An\nToi 10 tuoi\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: tuổi (số nguyên).',
      outputDesc: 'Hai dòng giới thiệu theo mẫu.',
      note: 'Đọc tên bằng `input()`, đọc tuổi bằng `int(input())`.',
      solve: (input) => {
        const [ten = '', tuoi = ''] = input.replace(/\n+$/, '').split('\n');
        return 'Toi ten ' + ten.trim() + '\nToi ' + String(parseInt(tuoi, 10)) + ' tuoi';
      },
      inputs: ['An\n10', 'Binh\n8', 'Lan\n12', 'Hoa\n7', 'Minh\n9', 'Bao\n11'],
    },
    {
      key: '11',
      title: 'Tổng giá tiền',
      difficulty: 'EASY',
      story:
        'Em mua một món hàng. Hãy đọc giá tiền một món ở dòng 1 và số lượng ở dòng 2, rồi in ra tổng số tiền phải trả.',
      inputDesc: 'Dòng 1: giá một món (số nguyên). Dòng 2: số lượng (số nguyên).',
      outputDesc: 'Tổng tiền = giá nhân số lượng.',
      note: 'Tổng tiền = giá * số lượng.',
      solve: (input) => {
        const [gia = '0', sl = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(gia, 10) * parseInt(sl, 10));
      },
      inputs: ['5\n3', '10\n0', '100\n2', '7\n7', '1000\n1', '20\n5'],
    },
    {
      key: '12',
      title: 'In tên ba lần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy cất tên đó vào một biến rồi in tên đó ra ba lần, mỗi lần một dòng.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Ba dòng, mỗi dòng là tên đã nhập.',
      note: 'Cất tên vào biến `ten = input()` rồi dùng lại biến đó ba lần.',
      solve: (input) => {
        const ten = (input.split('\n')[0] ?? '').trim();
        return ten + '\n' + ten + '\n' + ten;
      },
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh', 'Bao'],
    },
    {
      key: '13',
      title: 'Năm sinh từ tuổi',
      difficulty: 'EASY',
      story:
        'Năm nay là 2026. Hãy đọc tuổi của em rồi in ra năm sinh của em (lấy 2026 trừ đi tuổi).',
      inputDesc: 'Một số nguyên là tuổi.',
      outputDesc: 'Năm sinh = 2026 - tuổi.',
      note: 'Năm sinh = 2026 - tuoi.',
      solve: (input) => String(2026 - parseInt(input.trim(), 10)),
      inputs: ['10', '8', '0', '26', '12', '7'],
    },
    {
      key: '14',
      title: 'Còn bao nhiêu cái kẹo',
      difficulty: 'EASY',
      story:
        'Em có một số cái kẹo và đã cho bạn một số cái. Hãy đọc số kẹo ban đầu ở dòng 1 và số kẹo đã cho ở dòng 2, rồi in ra số kẹo còn lại.',
      inputDesc: 'Dòng 1: số kẹo ban đầu. Dòng 2: số kẹo đã cho (không lớn hơn số ban đầu).',
      outputDesc: 'Số kẹo còn lại.',
      note: 'Số còn lại = số ban đầu - số đã cho.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) - parseInt(b, 10));
      },
      inputs: ['10\n3', '5\n5', '20\n0', '100\n1', '7\n2', '1000\n999'],
    },
    {
      key: '15',
      title: 'Lời chào lịch sự',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in ra: `Chao ban <ten>, chuc ban hoc tot!`',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Một dòng chào theo mẫu.',
      note: 'Cất tên vào biến rồi ghép vào câu chào.',
      solve: (input) => {
        const ten = (input.split('\n')[0] ?? '').trim();
        return 'Chao ban ' + ten + ', chuc ban hoc tot!';
      },
      inputs: ['An', 'Lan', 'Minh', 'Hoa', 'Bao Chau', 'Gia Han'],
    },
    {
      key: '16',
      title: 'Đổi chỗ hai số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số ở hai dòng. Hãy in chúng ra theo thứ tự ĐẢO LẠI: số ở dòng 2 in trước, số ở dòng 1 in sau, mỗi số một dòng.\n\nVí dụ với `3` và `5` thì in:\n\n```\n5\n3\n```',
      inputDesc: 'Dòng 1: số thứ nhất. Dòng 2: số thứ hai.',
      outputDesc: 'Dòng 1: số thứ hai. Dòng 2: số thứ nhất.',
      note: 'Cất mỗi số vào một biến, rồi in biến thứ hai trước biến thứ nhất.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(b, 10)) + '\n' + String(parseInt(a, 10));
      },
      inputs: ['3\n5', '10\n20', '0\n7', '100\n1', '7\n7', '500\n9'],
    },
    {
      key: '17',
      title: 'Tổng ba số',
      difficulty: 'MEDIUM',
      story: 'Hãy đọc ba số nguyên ở ba dòng rồi in ra tổng của cả ba.',
      inputDesc: 'Mỗi dòng một số nguyên, tổng cộng ba dòng.',
      outputDesc: 'Tổng của ba số.',
      note: 'Đọc ba số bằng ba lệnh `int(input())`, rồi in `a + b + c`.',
      solve: (input) => {
        const [a = '0', b = '0', c = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) + parseInt(b, 10) + parseInt(c, 10));
      },
      inputs: ['1\n2\n3', '0\n0\n0', '10\n20\n30', '5\n5\n5', '100\n1\n1', '7\n8\n9'],
    },
    {
      key: '18',
      title: 'Em học lớp mấy',
      difficulty: 'EASY',
      story: 'Máy tính cho em số lớp em đang học. Hãy in ra: `Em hoc lop <lop>`.',
      inputDesc: 'Một số nguyên là lớp.',
      outputDesc: 'Một dòng theo mẫu.',
      note: 'Đọc số bằng `int(input())` rồi in `print("Em hoc lop", lop)`.',
      solve: (input) => 'Em hoc lop ' + String(parseInt(input.trim(), 10)),
      inputs: ['1', '5', '3', '12', '2', '4'],
    },
    {
      key: '19',
      title: 'Số trang còn lại',
      difficulty: 'EASY',
      story:
        'Cuốn sách có một số trang. Hãy đọc tổng số trang ở dòng 1 và số trang em đã đọc ở dòng 2, rồi in ra số trang còn lại phải đọc.',
      inputDesc: 'Dòng 1: tổng số trang. Dòng 2: số trang đã đọc (không lớn hơn tổng).',
      outputDesc: 'Số trang còn lại.',
      note: 'Số còn lại = tổng - đã đọc.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) - parseInt(b, 10));
      },
      inputs: ['100\n30', '50\n50', '200\n0', '10\n1', '999\n1', '64\n32'],
    },
    {
      key: '20',
      title: 'Tên và lời chúc',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một cái tên. Hãy in ra hai dòng:\n\n```\nXin chao <ten>\nChuc mung sinh nhat!\n```',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Dòng 1: chào theo tên. Dòng 2: `Chuc mung sinh nhat!`',
      note: 'Cất tên vào biến rồi dùng cho dòng đầu.',
      solve: (input) => {
        const ten = (input.split('\n')[0] ?? '').trim();
        return 'Xin chao ' + ten + '\nChuc mung sinh nhat!';
      },
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh', 'Bao'],
    },
    {
      key: '21',
      title: 'Tổng tiền hai món',
      difficulty: 'MEDIUM',
      story:
        'Em mua hai món hàng. Hãy đọc giá món thứ nhất ở dòng 1 và giá món thứ hai ở dòng 2, rồi in ra tổng số tiền phải trả.',
      inputDesc: 'Dòng 1: giá món 1. Dòng 2: giá món 2.',
      outputDesc: 'Tổng giá tiền hai món.',
      note: 'Cộng hai biến giá lại với nhau.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) + parseInt(b, 10));
      },
      inputs: ['10\n20', '0\n0', '100\n50', '7\n3', '1000\n1', '15\n25'],
    },
    {
      key: '22',
      title: 'Hai bạn cùng tên dòng',
      difficulty: 'EASY',
      story:
        'Máy tính cho em tên hai bạn ở hai dòng. Hãy in ra hai tên đó trên CÙNG một dòng, cách nhau một dấu cách.\n\nVí dụ với `An` và `Binh` thì in `An Binh`.',
      inputDesc: 'Dòng 1: tên bạn thứ nhất. Dòng 2: tên bạn thứ hai.',
      outputDesc: 'Hai tên trên một dòng, cách nhau một dấu cách.',
      note: 'Cất hai tên vào hai biến rồi `print(a, b)`.',
      solve: (input) => {
        const [a = '', b = ''] = input.replace(/\n+$/, '').split('\n');
        return a.trim() + ' ' + b.trim();
      },
      inputs: ['An\nBinh', 'Lan\nHoa', 'Minh\nBao', 'Chi\nDung', 'Em\nGiang', 'Ha\nIn'],
    },
    {
      key: '23',
      title: 'Số kẹo của hai bạn',
      difficulty: 'EASY',
      story:
        'Bạn A có một số kẹo, bạn B có một số kẹo khác. Hãy đọc số kẹo bạn A ở dòng 1 và bạn B ở dòng 2, rồi in ra tổng số kẹo của cả hai.',
      inputDesc: 'Dòng 1: số kẹo bạn A. Dòng 2: số kẹo bạn B.',
      outputDesc: 'Tổng số kẹo của hai bạn.',
      note: 'Tổng = kẹo A + kẹo B.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(a, 10) + parseInt(b, 10));
      },
      inputs: ['4\n6', '0\n0', '10\n10', '100\n1', '7\n8', '500\n500'],
    },
    {
      key: '24',
      title: 'Tuổi hai năm nữa',
      difficulty: 'EASY',
      story: 'Hãy đọc tuổi của em rồi in ra tuổi của em sau hai năm nữa (tuổi hiện tại cộng 2).',
      inputDesc: 'Một số nguyên là tuổi hiện tại.',
      outputDesc: 'Tuổi sau hai năm.',
      note: 'Tuổi sau hai năm = tuổi + 2.',
      solve: (input) => String(parseInt(input.trim(), 10) + 2),
      inputs: ['10', '8', '0', '98', '12', '7'],
    },
    {
      key: '25',
      title: 'In số rồi in tên',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số ở dòng 1 và một tên ở dòng 2. Hãy in số ra trước (dòng 1) rồi in tên ra sau (dòng 2).',
      inputDesc: 'Dòng 1: một số nguyên. Dòng 2: một tên.',
      outputDesc: 'Dòng 1: số đã nhập. Dòng 2: tên đã nhập.',
      note: 'Cất số và tên vào hai biến rồi in lần lượt.',
      solve: (input) => {
        const [so = '0', ten = ''] = input.replace(/\n+$/, '').split('\n');
        return String(parseInt(so, 10)) + '\n' + ten.trim();
      },
      inputs: ['7\nAn', '0\nBinh', '100\nLan', '5\nHoa', '42\nMinh', '999\nBao'],
    },
    {
      key: '26',
      title: 'Số chân của đàn gà',
      difficulty: 'EASY',
      story:
        'Mỗi con gà có 2 chân. Hãy đọc số con gà rồi in ra tổng số chân (số gà cộng số gà, vì mỗi con hai chân).',
      inputDesc: 'Một số nguyên là số con gà.',
      outputDesc: 'Tổng số chân của đàn gà.',
      note: 'Số chân = số gà + số gà.',
      solve: (input) => {
        const n = parseInt(input.trim(), 10);
        return String(n + n);
      },
      inputs: ['3', '0', '10', '1', '100', '7'],
    },
    {
      key: '27',
      title: 'Điểm sau khi cộng thưởng',
      difficulty: 'EASY',
      story:
        'Em được một số điểm và được cộng thêm 1 điểm thưởng. Hãy đọc điểm của em rồi in ra điểm sau khi cộng thưởng.',
      inputDesc: 'Một số nguyên là điểm hiện tại.',
      outputDesc: 'Điểm sau khi cộng 1.',
      note: 'Điểm mới = điểm + 1.',
      solve: (input) => String(parseInt(input.trim(), 10) + 1),
      inputs: ['8', '9', '0', '10', '5', '99'],
    },
    {
      key: '28',
      title: 'Tổng số học sinh',
      difficulty: 'MEDIUM',
      story:
        'Lớp có một số bạn nam và một số bạn nữ. Hãy đọc số bạn nam ở dòng 1 và số bạn nữ ở dòng 2, rồi in ra: `Tong: <tong>` với tổng là tổng số học sinh.',
      inputDesc: 'Dòng 1: số bạn nam. Dòng 2: số bạn nữ.',
      outputDesc: 'Một dòng: `Tong: ` ghép với tổng số học sinh.',
      note: 'Tính tổng rồi ghép vào chuỗi: `print("Tong:", tong)`.',
      solve: (input) => {
        const [a = '0', b = '0'] = input.replace(/\n+$/, '').split('\n');
        return 'Tong: ' + String(parseInt(a, 10) + parseInt(b, 10));
      },
      inputs: ['15\n20', '0\n0', '18\n18', '30\n1', '12\n13', '500\n500'],
    },
    {
      key: '29',
      title: 'Phiếu thông tin',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em tên ở dòng 1 và tuổi ở dòng 2. Hãy in ra phiếu thông tin:\n\n```\n=== PHIEU ===\nTen: <ten>\nTuoi: <tuoi>\n```',
      inputDesc: 'Dòng 1: tên. Dòng 2: tuổi (số nguyên).',
      outputDesc: 'Ba dòng phiếu thông tin theo mẫu.',
      note: 'Đọc tên bằng `input()`, tuổi bằng `int(input())`, rồi in ba dòng.',
      solve: (input) => {
        const [ten = '', tuoi = ''] = input.replace(/\n+$/, '').split('\n');
        return '=== PHIEU ===\nTen: ' + ten.trim() + '\nTuoi: ' + String(parseInt(tuoi, 10));
      },
      inputs: ['An\n10', 'Binh\n8', 'Lan\n12', 'Hoa\n7', 'Minh Khoi\n9', 'Bao\n11'],
    },
    {
      key: '30',
      title: 'Tổng tiền mua vở',
      difficulty: 'MEDIUM',
      story:
        'Em mua vở. Hãy đọc giá một quyển vở ở dòng 1 và số quyển ở dòng 2, rồi in ra: `Tong tien: <tong>` với tổng tiền bằng giá nhân số quyển.',
      inputDesc: 'Dòng 1: giá một quyển (số nguyên). Dòng 2: số quyển (số nguyên).',
      outputDesc: 'Một dòng: `Tong tien: ` ghép với tổng tiền.',
      note: 'Tổng tiền = giá * số quyển, rồi ghép vào chuỗi.',
      solve: (input) => {
        const [gia = '0', sl = '0'] = input.replace(/\n+$/, '').split('\n');
        return 'Tong tien: ' + String(parseInt(gia, 10) * parseInt(sl, 10));
      },
      inputs: ['5\n4', '10\n0', '100\n2', '7\n7', '1000\n1', '15\n3'],
    },
  ],
};

export default course;

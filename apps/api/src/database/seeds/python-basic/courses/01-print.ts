import { CourseSpec } from '../types';

/**
 * Course 01 — Làm quen lệnh print.
 * Mục tiêu: học sinh tiểu học làm quen với việc in dữ liệu ra màn hình bằng
 * lệnh print, in chữ, in số, in nhiều dòng và in lại dữ liệu được cho.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. For "fixed output" problems use a single `['']` input.
 */
const course: CourseSpec = {
  code: 'PYTHON-BASIC-01',
  title: 'Làm quen lệnh print',
  description:
    'Khóa học đầu tiên: làm quen với lệnh print để in chữ và số ra màn hình. ' +
    'Đây là viên gạch đầu tiên trên hành trình lập trình của em!',
  tags: ['python', 'co-ban', 'print', 'in-du-lieu'],
  problems: [
    {
      key: '01',
      title: 'Xin chào thế giới',
      difficulty: 'EASY',
      story: 'Bài tập kinh điển đầu tiên của mọi lập trình viên! Hãy in ra màn hình đúng dòng chữ: `Hello, World!`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra một dòng: `Hello, World!`',
      note: 'Dùng lệnh `print("Hello, World!")`. Chú ý viết hoa, dấu phẩy và dấu chấm than cho đúng nhé!',
      solve: () => 'Hello, World!',
      inputs: [''],
    },
    {
      key: '02',
      title: 'Lời chào của em',
      difficulty: 'EASY',
      story: 'Hãy in ra màn hình lời chào: `Xin chao cac ban!`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra một dòng: `Xin chao cac ban!`',
      solve: () => 'Xin chao cac ban!',
      inputs: [''],
    },
    {
      key: '03',
      title: 'In một con số',
      difficulty: 'EASY',
      story: 'Hãy in ra màn hình con số `2026` — năm em đang học lập trình.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra số `2026`.',
      note: 'Có thể viết `print(2026)` hoặc `print("2026")`.',
      solve: () => '2026',
      inputs: [''],
    },
    {
      key: '04',
      title: 'In ba dòng',
      difficulty: 'EASY',
      story: 'Hãy in ra màn hình 3 dòng theo đúng thứ tự:\n\n```\nMot\nHai\nBa\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Ba dòng: `Mot`, `Hai`, `Ba`.',
      note: 'Dùng 3 lệnh print, mỗi lệnh in một dòng.',
      solve: () => 'Mot\nHai\nBa',
      inputs: [''],
    },
    {
      key: '05',
      title: 'Đếm từ 1 đến 5',
      difficulty: 'EASY',
      story: 'Hãy in ra các số `1 2 3 4 5`, mỗi số trên một dòng.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Năm dòng, lần lượt là 1, 2, 3, 4, 5.',
      solve: () => '1\n2\n3\n4\n5',
      inputs: [''],
    },
    {
      key: '06',
      title: 'In tên ngôi trường',
      difficulty: 'EASY',
      story: 'Hãy in ra dòng chữ: `Em yeu lap trinh`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Em yeu lap trinh`',
      solve: () => 'Em yeu lap trinh',
      inputs: [''],
    },
    {
      key: '07',
      title: 'Hình tam giác nhỏ',
      difficulty: 'EASY',
      story: 'Hãy in ra hình tam giác bằng dấu sao:\n\n```\n*\n**\n***\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Ba dòng dấu sao như mô tả.',
      solve: () => '*\n**\n***',
      inputs: [''],
    },
    {
      key: '08',
      title: 'In lại dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em một dòng chữ. Hãy in lại đúng dòng chữ đó.',
      inputDesc: 'Một dòng chữ bất kỳ.',
      outputDesc: 'In lại đúng dòng chữ đã nhận.',
      note: 'Đọc dữ liệu bằng `s = input()` rồi `print(s)`.',
      solve: (input) => input.split('\n')[0] ?? '',
      inputs: ['Xin chao', 'Python that thu vi', 'Lap trinh vui qua', 'ABC', 'Hello'],
    },
    {
      key: '09',
      title: 'In lại một số',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in lại đúng số đó.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'In lại đúng số đã nhận.',
      solve: (input) => String(parseInt(input.trim(), 10)),
      inputs: ['7', '42', '100', '0', '999', '5'],
    },
    {
      key: '10',
      title: 'Chào bạn theo tên',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in ra lời chào theo mẫu: `Xin chao <ten>`.\n\nVí dụ với tên `An` thì in ra `Xin chao An`.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Dòng chữ `Xin chao ` ghép với tên.',
      solve: (input) => 'Xin chao ' + (input.split('\n')[0] ?? '').trim(),
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh'],
    },
    {
      key: '11',
      title: 'In hai số trên một dòng',
      difficulty: 'EASY',
      story: 'Hãy in ra hai số `3` và `5`, cách nhau bởi một dấu cách, trên cùng một dòng: `3 5`.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `3 5`',
      note: 'Có thể dùng `print(3, 5)` — dấu phẩy trong print tự thêm dấu cách.',
      solve: () => '3 5',
      inputs: [''],
    },
    {
      key: '12',
      title: 'Năm sinh và tuổi',
      difficulty: 'EASY',
      story: 'Hãy in ra đúng hai dòng:\n\n```\nNam sinh: 2016\nTuoi: 10\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Hai dòng như mô tả.',
      solve: () => 'Nam sinh: 2016\nTuoi: 10',
      inputs: [''],
    },
    {
      key: '13',
      title: 'In lại tên rồi chào',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in tên đó ra ở dòng 1, và in `Chao mung!` ở dòng 2.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Dòng 1: tên. Dòng 2: `Chao mung!`',
      solve: (input) => (input.split('\n')[0] ?? '').trim() + '\nChao mung!',
      inputs: ['An', 'Bao', 'Chi', 'Dung', 'Em'],
    },
    {
      key: '14',
      title: 'Khung chữ nhật',
      difficulty: 'EASY',
      story: 'Hãy in ra một khung chữ nhật 2x4 bằng dấu sao:\n\n```\n****\n****\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Hai dòng, mỗi dòng 4 dấu sao.',
      solve: () => '****\n****',
      inputs: [''],
    },
    {
      key: '15',
      title: 'Bảng chữ cái đầu',
      difficulty: 'EASY',
      story: 'Hãy in ra `A B C D E` trên cùng một dòng, các chữ cách nhau một dấu cách.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `A B C D E`',
      solve: () => 'A B C D E',
      inputs: [''],
    },
    {
      key: '16',
      title: 'In lại ba dòng chữ',
      difficulty: 'EASY',
      story: 'Máy tính cho em ba dòng chữ. Hãy in lại đúng cả ba dòng đó theo thứ tự.',
      inputDesc: 'Ba dòng chữ.',
      outputDesc: 'In lại đúng ba dòng đã nhận.',
      solve: (input) =>
        input
          .replace(/\n+$/, '')
          .split('\n')
          .slice(0, 3)
          .join('\n'),
      inputs: ['Mot\nHai\nBa', 'Python\nthat\nhay', 'a\nb\nc', 'Xin\nchao\nban', 'Hoc\nlap\ntrinh'],
    },
    {
      key: '17',
      title: 'Mặt cười',
      difficulty: 'EASY',
      story: 'Hãy in ra một mặt cười đơn giản: `:)`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `:)`',
      solve: () => ':)',
      inputs: [''],
    },
    {
      key: '18',
      title: 'In số có dấu',
      difficulty: 'EASY',
      story: 'Hãy in ra số âm `-15`.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Số `-15`.',
      solve: () => '-15',
      inputs: [''],
    },
    {
      key: '19',
      title: 'Ghép họ và tên',
      difficulty: 'EASY',
      story: 'Máy tính cho em họ ở dòng 1 và tên ở dòng 2. Hãy in ra họ tên đầy đủ trên một dòng, cách nhau một dấu cách.\n\nVí dụ: `Nguyen` và `An` → `Nguyen An`.',
      inputDesc: 'Dòng 1: họ. Dòng 2: tên.',
      outputDesc: 'Họ và tên ghép lại, cách nhau một dấu cách.',
      solve: (input) => {
        const [ho = '', ten = ''] = input.replace(/\n+$/, '').split('\n');
        return ho.trim() + ' ' + ten.trim();
      },
      inputs: ['Nguyen\nAn', 'Tran\nBinh', 'Le\nLan', 'Pham\nHoa', 'Vo\nMinh'],
    },
    {
      key: '20',
      title: 'Cây thông nhỏ',
      difficulty: 'MEDIUM',
      story: 'Hãy in ra một cây thông Noel bằng dấu sao, mỗi dòng dấu sao căn trái:\n\n```\n*\n**\n***\n****\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng dấu sao tăng dần từ 1 đến 4.',
      solve: () => '*\n**\n***\n****',
      inputs: [''],
    },
    {
      key: '21',
      title: 'In số em yêu thích ba lần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số. Hãy in số đó ra ba lần, mỗi lần trên một dòng.',
      inputDesc: 'Một số nguyên.',
      outputDesc: 'Ba dòng, mỗi dòng là số đã nhận.',
      solve: (input) => {
        const n = input.trim();
        return n + '\n' + n + '\n' + n;
      },
      inputs: ['7', '3', '99', '0', '12', '5'],
    },
    {
      key: '22',
      title: 'Lời chào lịch sự',
      difficulty: 'EASY',
      story: 'Máy tính cho em một cái tên. Hãy in ra: `Chao ban <ten>, rat vui duoc gap ban!`',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Một dòng chào theo mẫu.',
      solve: (input) => {
        const ten = (input.split('\n')[0] ?? '').trim();
        return 'Chao ban ' + ten + ', rat vui duoc gap ban!';
      },
      inputs: ['An', 'Lan', 'Minh', 'Hoa', 'Bao'],
    },
    {
      key: '23',
      title: 'In dấu cách đúng chỗ',
      difficulty: 'EASY',
      story: 'Hãy in ra đúng chuỗi sau (chú ý hai dấu cách giữa các từ): `Toi  yeu  Python`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Toi  yeu  Python` (hai dấu cách giữa các từ).',
      note: 'Lưu ý: giữa các từ có HAI dấu cách.',
      solve: () => 'Toi  yeu  Python',
      inputs: [''],
    },
    {
      key: '24',
      title: 'Thẻ tên',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một cái tên. Hãy in ra thẻ tên có khung:\n\n```\n+------+\n| <ten>\n+------+\n```\n\nDòng giữa là dấu `|`, một dấu cách rồi đến tên.',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Ba dòng: viền trên, dòng tên, viền dưới.',
      solve: (input) => {
        const ten = (input.split('\n')[0] ?? '').trim();
        return '+------+\n| ' + ten + '\n+------+';
      },
      inputs: ['An', 'Binh', 'Lan', 'Hoa', 'Minh'],
    },
    {
      key: '25',
      title: 'Đếm ngược',
      difficulty: 'EASY',
      story: 'Hãy in ra đếm ngược `5 4 3 2 1`, mỗi số một dòng.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Năm dòng: 5, 4, 3, 2, 1.',
      solve: () => '5\n4\n3\n2\n1',
      inputs: [''],
    },
    {
      key: '26',
      title: 'In lại hai số cùng dòng',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số trên cùng một dòng. Hãy in lại đúng hai số đó, cách nhau một dấu cách.',
      inputDesc: 'Một dòng chứa hai số cách nhau dấu cách.',
      outputDesc: 'In lại hai số, cách nhau một dấu cách.',
      solve: (input) => {
        const parts = input.trim().split(/\s+/);
        return parts[0] + ' ' + parts[1];
      },
      inputs: ['3 5', '10 20', '7 1', '100 200', '0 9'],
    },
    {
      key: '27',
      title: 'Bài thơ ngắn',
      difficulty: 'EASY',
      story: 'Hãy in ra đúng bài thơ sau:\n\n```\nCon meo con\nNgoi tren tham\nKeu meo meo\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Ba dòng của bài thơ.',
      solve: () => 'Con meo con\nNgoi tren tham\nKeu meo meo',
      inputs: [''],
    },
    {
      key: '28',
      title: 'In một dòng dài dấu bằng',
      difficulty: 'EASY',
      story: 'Hãy in ra một dòng gồm đúng 10 dấu bằng: `==========`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng gồm 10 dấu `=`.',
      note: 'Có thể dùng `print("=" * 10)`.',
      solve: () => '=========='.slice(0, 10),
      inputs: [''],
    },
    {
      key: '29',
      title: 'Nhắc lại lời chào ba lần',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một dòng chữ. Hãy in lại dòng chữ đó ba lần trên ba dòng.',
      inputDesc: 'Một dòng chữ.',
      outputDesc: 'Ba dòng, mỗi dòng là dòng chữ đã nhận.',
      solve: (input) => {
        const s = input.split('\n')[0] ?? '';
        return s + '\n' + s + '\n' + s;
      },
      inputs: ['Hoan ho', 'Python', 'Vui qua', 'A', 'Xin chao'],
    },
    {
      key: '30',
      title: 'Tấm bằng khen',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một cái tên. Hãy in ra tấm bằng khen:\n\n```\n*** BANG KHEN ***\nTang ban: <ten>\nDa hoan thanh khoa print!\n```',
      inputDesc: 'Một dòng chứa tên.',
      outputDesc: 'Ba dòng theo mẫu, dòng 2 ghép với tên.',
      solve: (input) => {
        const ten = (input.split('\n')[0] ?? '').trim();
        return '*** BANG KHEN ***\nTang ban: ' + ten + '\nDa hoan thanh khoa print!';
      },
      inputs: ['An', 'Lan', 'Minh Khoi', 'Bao Chau', 'Gia Han'],
    },
  ],
};

export default course;

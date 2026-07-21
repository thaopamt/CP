import { CourseSpec } from '../types';

/**
 * Course 01 — Làm quen lệnh print.
 * Mục tiêu: học sinh tiểu học làm quen với việc in dữ liệu ra màn hình bằng
 * lệnh print, in chữ, in số, in nhiều dòng, vẽ hình bằng ký tự, khai báo biến
 * và làm các phép tính đơn giản.
 *
 * KHÔNG bài nào trong khóa này dùng `input()` — toàn bộ dữ liệu là hằng số viết
 * sẵn trong chương trình. Việc nhập dữ liệu được dạy ở course 02.
 *
 * Thứ tự bài trong mảng `problems` chính là thứ tự hiển thị cho học sinh
 * (seeder gán orderIndex theo vị trí mảng), đi từ dễ đến khó theo 11 chặng.
 * Độ khó tăng đơn điệu: EASY (chặng A–H đầu) → MEDIUM → HARD.
 *   A. print một dòng chữ        G. Biến
 *   B. print số                  H. Phép tính số học
 *   C. In nhiều dòng             I. Vẽ hình nâng cao (có dấu cách đầu dòng)
 *   D. Nhiều giá trị một dòng    J. Nối chuỗi
 *   E. Nhân chuỗi                K. Ký tự xuống dòng \n
 *   F. Vẽ hình cơ bản            L. Tổng hợp
 *
 * `key` là định danh bền của bài (slug = pybasic-01-<key>), KHÔNG phải thứ tự
 * hiển thị — đổi chỗ bài trong mảng thì giữ nguyên key để tiến độ học sinh
 * không bị lệch sang bài khác.
 *
 * NOTE for authors of sibling course files: mirror this exact shape. Never write
 * an expected output by hand — return it from `solve(input)`. The first 3 inputs
 * become visible samples. For "fixed output" problems use a single `['']` input.
 */
const course: CourseSpec = {
  code: 'PYTHON-BASIC-01',
  title: 'Làm quen lệnh print',
  description:
    'Khóa học đầu tiên: làm quen với lệnh print để in chữ và số ra màn hình, ' +
    'vẽ hình bằng ký tự, khai báo biến và làm phép tính. ' +
    'Đây là viên gạch đầu tiên trên hành trình lập trình của em!',
  tags: ['python', 'co-ban', 'print', 'in-du-lieu'],
  problems: [
    // ===================================================================
    // CHẶNG A — In một dòng chữ
    // ===================================================================
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
      key: '31',
      title: 'Em tự giới thiệu',
      difficulty: 'EASY',
      story: 'Hãy in ra màn hình dòng chữ: `Em ten la An`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Em ten la An`',
      note: 'Đặt cả câu vào trong dấu nháy kép: `print("Em ten la An")`.',
      solve: () => 'Em ten la An',
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
      key: '32',
      title: 'Con vật em yêu',
      difficulty: 'EASY',
      story: 'Em có một chú mèo tên là Mun. Hãy in ra màn hình: `Con meo mun`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Con meo mun`',
      solve: () => 'Con meo mun',
      inputs: [''],
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
      key: '33',
      title: 'Trái tim nhỏ',
      difficulty: 'EASY',
      story: 'Trên máy tính, người ta hay vẽ trái tim bằng hai ký tự `<3`. Hãy in ra màn hình: `<3`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `<3`',
      note: 'Dấu `<` và số `3` đều nằm trong dấu nháy kép nhé.',
      solve: () => '<3',
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG B — In số
    // ===================================================================
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
      key: '34',
      title: 'Số không',
      difficulty: 'EASY',
      story: 'Số nhỏ nhất trong các số tự nhiên là số `0`. Hãy in ra màn hình số đó.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra số `0`.',
      solve: () => '0',
      inputs: [''],
    },
    {
      key: '35',
      title: 'Tuổi của em',
      difficulty: 'EASY',
      story: 'Năm nay em 10 tuổi. Hãy in ra màn hình số `10`.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra số `10`.',
      solve: () => '10',
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
      key: '36',
      title: 'Số rất lớn',
      difficulty: 'EASY',
      story: 'Một triệu được viết là `1000000`. Hãy in ra màn hình con số đó.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra số `1000000`.',
      note: 'Trong Python không viết dấu chấm ngăn cách hàng nghìn nhé — chỉ viết liền các chữ số.',
      solve: () => '1000000',
      inputs: [''],
    },
    {
      key: '37',
      title: 'Số thập phân',
      difficulty: 'EASY',
      story: 'Số Pi được làm tròn là `3.14`. Hãy in ra màn hình con số đó.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra số `3.14`.',
      note: 'Trong Python, phần thập phân ngăn cách bằng dấu CHẤM `.` chứ không phải dấu phẩy.',
      solve: () => '3.14',
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG C — In nhiều dòng
    // ===================================================================
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
      key: '38',
      title: 'Ba con vật',
      difficulty: 'EASY',
      story: 'Trong sân nhà bà có ba con vật. Hãy in tên chúng, mỗi con một dòng:\n\n```\nCho\nMeo\nGa\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Ba dòng: `Cho`, `Meo`, `Ga`.',
      solve: () => 'Cho\nMeo\nGa',
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
      key: '39',
      title: 'Các số chẵn',
      difficulty: 'EASY',
      story: 'Hãy in ra 5 số chẵn đầu tiên khác 0, mỗi số một dòng:\n\n```\n2\n4\n6\n8\n10\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Năm dòng: 2, 4, 6, 8, 10.',
      solve: () => '2\n4\n6\n8\n10',
      inputs: [''],
    },
    {
      key: '40',
      title: 'Bốn mùa',
      difficulty: 'EASY',
      story: 'Một năm có bốn mùa. Hãy in tên bốn mùa, mỗi mùa một dòng:\n\n```\nXuan\nHa\nThu\nDong\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng tên bốn mùa.',
      solve: () => 'Xuan\nHa\nThu\nDong',
      inputs: [''],
    },
    {
      key: '41',
      title: 'Bảy ngày trong tuần',
      difficulty: 'EASY',
      story:
        'Hãy in ra bảy ngày trong tuần, mỗi ngày một dòng:\n\n```\nThu hai\nThu ba\nThu tu\nThu nam\nThu sau\nThu bay\nChu nhat\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bảy dòng tên các ngày trong tuần.',
      note: 'Bài này cần 7 lệnh print. Kiên nhẫn gõ từng dòng nhé!',
      solve: () => 'Thu hai\nThu ba\nThu tu\nThu nam\nThu sau\nThu bay\nChu nhat',
      inputs: [''],
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

    // ===================================================================
    // CHẶNG D — Nhiều giá trị trên một dòng
    // ===================================================================
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
      key: '42',
      title: 'Ba số một dòng',
      difficulty: 'EASY',
      story: 'Hãy in ra ba số `1`, `2`, `3` trên cùng một dòng, cách nhau một dấu cách: `1 2 3`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `1 2 3`',
      note: 'Thử `print(1, 2, 3)` xem sao nhé!',
      solve: () => '1 2 3',
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
      key: '43',
      title: 'Lớp của em',
      difficulty: 'EASY',
      story: 'Hãy in ra một dòng gồm chữ và số: `Lop 5A`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Lop 5A`',
      solve: () => 'Lop 5A',
      inputs: [''],
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
      key: '44',
      title: 'Giỏ trái cây',
      difficulty: 'EASY',
      story: 'Trong giỏ có ba loại quả. Hãy in ra một dòng liệt kê chúng: `Cam, Xoai, Chuoi`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Cam, Xoai, Chuoi`',
      note: 'Chú ý: sau mỗi dấu phẩy có MỘT dấu cách, cuối dòng KHÔNG có dấu phẩy.',
      solve: () => 'Cam, Xoai, Chuoi',
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG E — Nhân chuỗi
    // ===================================================================
    {
      key: '28',
      title: 'In một dòng dài dấu bằng',
      difficulty: 'EASY',
      story: 'Hãy in ra một dòng gồm đúng 10 dấu bằng: `==========`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng gồm 10 dấu `=`.',
      note: 'Có thể dùng `print("=" * 10)`.',
      solve: () => '='.repeat(10),
      inputs: [''],
    },
    {
      key: '45',
      title: 'Đường kẻ ngang',
      difficulty: 'EASY',
      story: 'Hãy in ra một đường kẻ gồm đúng 20 dấu gạch ngang `-`.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng gồm 20 dấu `-`.',
      note: 'Dùng `print("-" * 20)` sẽ nhanh hơn gõ tay 20 lần!',
      solve: () => '-'.repeat(20),
      inputs: [''],
    },
    {
      key: '46',
      title: 'Tiếng cười',
      difficulty: 'EASY',
      story: 'Hãy in ra tiếng cười gồm chữ `ha` lặp lại đúng 5 lần liền nhau: `hahahahaha`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `hahahahaha`',
      note: 'Phép nhân cũng dùng được với cả một cụm chữ: `"ha" * 5`.',
      solve: () => 'ha'.repeat(5),
      inputs: [''],
    },
    {
      key: '47',
      title: 'Hàng rào',
      difficulty: 'EASY',
      story: 'Hãy vẽ một hàng rào bằng cách lặp cụm ký tự `|_` đúng 6 lần: `|_|_|_|_|_|_`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `|_|_|_|_|_|_`',
      solve: () => '|_'.repeat(6),
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG F — Vẽ hình bằng ký tự
    // ===================================================================
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
      key: '48',
      title: 'Hình vuông đặc',
      difficulty: 'EASY',
      story: 'Hãy in ra một hình vuông đặc 4x4 bằng dấu sao:\n\n```\n****\n****\n****\n****\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng, mỗi dòng 4 dấu sao.',
      note: 'Mỗi dòng đều giống nhau, em có thể dùng `print("*" * 4)` bốn lần.',
      solve: () => Array(4).fill('*'.repeat(4)).join('\n'),
      inputs: [''],
    },
    {
      key: '20',
      title: 'Cây thông nhỏ',
      difficulty: 'EASY',
      story:
        'Hãy in ra một cây thông Noel bằng dấu sao, mỗi dòng dấu sao căn trái:\n\n```\n*\n**\n***\n****\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng dấu sao tăng dần từ 1 đến 4.',
      solve: () => '*\n**\n***\n****',
      inputs: [''],
    },
    {
      key: '49',
      title: 'Tam giác ngược',
      difficulty: 'EASY',
      story: 'Hãy in ra hình tam giác ngược bằng dấu sao:\n\n```\n****\n***\n**\n*\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng dấu sao giảm dần từ 4 xuống 1.',
      solve: () => '****\n***\n**\n*',
      inputs: [''],
    },
    {
      key: '50',
      title: 'Chữ L bằng sao',
      difficulty: 'EASY',
      story: 'Hãy vẽ chữ cái `L` bằng dấu sao:\n\n```\n*\n*\n*\n****\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng tạo thành hình chữ L.',
      solve: () => '*\n*\n*\n****',
      inputs: [''],
    },
    {
      key: '52',
      title: 'Bậc thang số',
      difficulty: 'EASY',
      story:
        'Hãy in ra bậc thang bằng các chữ số, dòng thứ n gồm n chữ số n:\n\n```\n1\n22\n333\n4444\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng như mô tả.',
      solve: () =>
        [1, 2, 3, 4].map((n) => String(n).repeat(n)).join('\n'),
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG G — Biến
    // ===================================================================
    {
      key: '57',
      title: 'Chiếc hộp đựng số',
      difficulty: 'EASY',
      story:
        'Trong Python, em có thể đặt một giá trị vào "chiếc hộp" có tên gọi — gọi là **biến**.\n\n' +
        'Hãy tạo một biến tên `so` và gán cho nó giá trị `8`, rồi in giá trị của biến đó ra màn hình.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'In ra số `8`.',
      note: 'Viết `so = 8` rồi `print(so)`. Chú ý: trong `print(so)` KHÔNG có dấu nháy kép — nếu có nháy kép, máy sẽ in ra chữ "so" thay vì số 8!',
      solve: () => '8',
      inputs: [''],
    },
    {
      key: '58',
      title: 'Hai chiếc hộp',
      difficulty: 'EASY',
      story:
        'Hãy tạo hai biến: biến `a` mang giá trị `4` và biến `b` mang giá trị `9`. ' +
        'Sau đó in giá trị của `a` ở dòng 1 và giá trị của `b` ở dòng 2.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Hai dòng: `4` rồi `9`.',
      solve: () => '4\n9',
      inputs: [''],
    },
    {
      key: '12',
      title: 'Năm sinh và tuổi',
      difficulty: 'EASY',
      story: 'Hãy in ra đúng hai dòng:\n\n```\nNam sinh: 2016\nTuoi: 10\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Hai dòng như mô tả.',
      note: 'Em có thể tạo biến `nam = 2016` và `tuoi = 10` rồi dùng `print("Nam sinh:", nam)`.',
      solve: () => 'Nam sinh: 2016\nTuoi: 10',
      inputs: [''],
    },
    {
      key: '59',
      title: 'Thẻ thông tin',
      difficulty: 'EASY',
      story:
        'Hãy tạo hai biến `ten` mang giá trị `"An"` và `lop` mang giá trị `"5A"`, rồi in ra:\n\n' +
        '```\nTen: An\nLop: 5A\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Hai dòng như mô tả.',
      note: 'Dùng `print("Ten:", ten)` — dấu phẩy sẽ tự thêm một dấu cách.',
      solve: () => 'Ten: An\nLop: 5A',
      inputs: [''],
    },
    {
      key: '60',
      title: 'Đổi giá trị trong hộp',
      difficulty: 'EASY',
      story:
        'Biến giống chiếc hộp: em có thể lấy đồ cũ ra và bỏ đồ mới vào.\n\n' +
        'Hãy tạo biến `diem` mang giá trị `7`, in nó ra. Sau đó gán lại `diem` bằng `10` và in ra lần nữa.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Hai dòng: `7` rồi `10`.',
      note: 'Sau khi gán lại, giá trị cũ biến mất — biến chỉ nhớ giá trị mới nhất.',
      solve: () => '7\n10',
      inputs: [''],
    },
    {
      key: '61',
      title: 'Biến đựng chữ',
      difficulty: 'EASY',
      story:
        'Biến không chỉ đựng số, nó còn đựng được cả chữ!\n\n' +
        'Hãy tạo biến `mon` mang giá trị `"Toan"` và in giá trị đó ra màn hình.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Toan`',
      note: 'Khi gán chữ thì phải có dấu nháy kép: `mon = "Toan"`. Nhưng khi in thì không: `print(mon)`.',
      solve: () => 'Toan',
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG H — Phép tính số học
    // ===================================================================
    {
      key: '62',
      title: 'Phép cộng',
      difficulty: 'EASY',
      story: 'Hãy để máy tính tính giúp em phép cộng `25 + 17` và in ra kết quả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Kết quả của phép tính.',
      note: 'Viết `print(25 + 17)`. Máy sẽ tự tính chứ em không cần tính sẵn!',
      solve: () => String(25 + 17),
      inputs: [''],
    },
    {
      key: '63',
      title: 'Phép trừ',
      difficulty: 'EASY',
      story: 'Bạn An có 50 viên kẹo, cho bạn 23 viên. Hãy tính và in ra số kẹo còn lại.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Số kẹo còn lại.',
      solve: () => String(50 - 23),
      inputs: [''],
    },
    {
      key: '64',
      title: 'Phép nhân',
      difficulty: 'EASY',
      story: 'Mỗi hộp có 9 chiếc bút. Có 8 hộp như vậy. Hãy tính và in ra tổng số bút.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Tổng số bút.',
      note: 'Dấu nhân trong Python là dấu sao `*`, không phải dấu `x`.',
      solve: () => String(9 * 8),
      inputs: [''],
    },
    {
      key: '65',
      title: 'Phép chia',
      difficulty: 'EASY',
      story: 'Hãy tính `15` chia `4` và in ra kết quả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Kết quả của phép chia.',
      note: 'Dấu chia là `/`. Phép chia `/` trong Python luôn cho kết quả có phần thập phân.',
      solve: () => String(15 / 4),
      inputs: [''],
    },
    {
      key: '66',
      title: 'Chia lấy phần nguyên',
      difficulty: 'EASY',
      story:
        'Có 17 quả táo chia đều cho 5 bạn. Mỗi bạn được mấy quả (chỉ tính số quả nguyên)?\n\n' +
        'Hãy tính và in ra kết quả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Số quả mỗi bạn nhận được.',
      note: 'Dùng hai dấu gạch chéo `//` để chia lấy phần nguyên: `17 // 5`.',
      solve: () => String(Math.floor(17 / 5)),
      inputs: [''],
    },
    {
      key: '67',
      title: 'Chia lấy phần dư',
      difficulty: 'EASY',
      story: 'Vẫn 17 quả táo chia cho 5 bạn. Sau khi chia đều thì còn thừa lại mấy quả?',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Số quả còn thừa.',
      note: 'Dùng dấu phần trăm `%` để lấy phần dư: `17 % 5`.',
      solve: () => String(17 % 5),
      inputs: [''],
    },
    {
      key: '68',
      title: 'Bàn cờ ô vuông',
      difficulty: 'EASY',
      story: 'Một bàn cờ có 6 hàng, mỗi hàng có 6 ô vuông. Hãy tính và in ra tổng số ô của bàn cờ.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Tổng số ô của bàn cờ.',
      solve: () => String(6 * 6),
      inputs: [''],
    },
    {
      key: '69',
      title: 'Chu vi hình vuông',
      difficulty: 'EASY',
      story:
        'Một hình vuông có cạnh dài `7` cm. Hãy tạo biến `canh = 7`, tính chu vi (chu vi = cạnh nhân 4) và in ra kết quả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Chu vi hình vuông.',
      solve: () => String(7 * 4),
      inputs: [''],
    },
    {
      key: '70',
      title: 'Diện tích hình chữ nhật',
      difficulty: 'MEDIUM',
      story:
        'Một hình chữ nhật có chiều dài `8` cm, chiều rộng `5` cm.\n\n' +
        'Hãy tạo hai biến `dai` và `rong`, tính diện tích (dài nhân rộng) và in ra kết quả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Diện tích hình chữ nhật.',
      note: 'Em có thể lưu kết quả vào một biến nữa: `dien_tich = dai * rong` rồi `print(dien_tich)`.',
      solve: () => String(8 * 5),
      inputs: [''],
    },
    {
      key: '71',
      title: 'Tổng tiền mua đồ',
      difficulty: 'MEDIUM',
      story:
        'Em mua 3 quyển vở, mỗi quyển 5000 đồng, và 2 chiếc bút, mỗi chiếc 3000 đồng.\n\n' +
        'Hãy tính và in ra tổng số tiền em phải trả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Tổng số tiền.',
      note: 'Tổng tiền = 3 * 5000 + 2 * 3000. Trong Python, phép nhân được làm trước phép cộng giống như trong Toán.',
      solve: () => String(3 * 5000 + 2 * 3000),
      inputs: [''],
    },
    {
      key: '72',
      title: 'Đổi giờ ra phút',
      difficulty: 'MEDIUM',
      story:
        'Buổi học kéo dài `3` giờ `25` phút. Hãy tính xem buổi học đó dài bao nhiêu phút và in ra kết quả.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Tổng số phút.',
      note: 'Một giờ có 60 phút.',
      solve: () => String(3 * 60 + 25),
      inputs: [''],
    },
    {
      key: '73',
      title: 'Đếm chân trong sân',
      difficulty: 'MEDIUM',
      story:
        'Trong sân có `12` con gà (mỗi con 2 chân) và `5` con chó (mỗi con 4 chân).\n\n' +
        'Hãy tính và in ra tổng số chân của tất cả các con vật.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Tổng số chân.',
      solve: () => String(12 * 2 + 5 * 4),
      inputs: [''],
    },
    {
      key: '74',
      title: 'Chia kẹo cho cả lớp',
      difficulty: 'MEDIUM',
      story:
        'Cô giáo có `50` cái kẹo, chia đều cho `7` bạn.\n\n' +
        'Hãy in ra 2 dòng: dòng 1 là số kẹo mỗi bạn nhận được, dòng 2 là số kẹo còn thừa.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Dòng 1: số kẹo mỗi bạn. Dòng 2: số kẹo thừa.',
      note: 'Dùng `//` cho dòng 1 và `%` cho dòng 2.',
      solve: () => `${Math.floor(50 / 7)}\n${50 % 7}`,
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG I — Vẽ hình nâng cao (cần đếm dấu cách ở đầu dòng)
    // ===================================================================
    {
      key: '51',
      title: 'Chữ T bằng sao',
      difficulty: 'MEDIUM',
      story: 'Hãy vẽ chữ cái `T` bằng dấu sao:\n\n```\n*****\n  *\n  *\n  *\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng tạo thành hình chữ T.',
      note: 'Ba dòng dưới có HAI dấu cách trước dấu sao. Dấu cách cũng nằm trong dấu nháy kép nhé!',
      solve: () => '*****\n  *\n  *\n  *',
      inputs: [''],
    },
    {
      key: '53',
      title: 'Chữ H bằng sao',
      difficulty: 'MEDIUM',
      story: 'Hãy vẽ chữ cái `H` bằng dấu sao:\n\n```\n*   *\n*   *\n*****\n*   *\n*   *\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Năm dòng tạo thành hình chữ H.',
      note: 'Dòng 1, 2, 4, 5 giống hệt nhau: một dấu sao, BA dấu cách, một dấu sao.',
      solve: () => {
        const canh = '*   *';
        return [canh, canh, '*****', canh, canh].join('\n');
      },
      inputs: [''],
    },
    {
      key: '55',
      title: 'Khung rỗng',
      difficulty: 'MEDIUM',
      story: 'Hãy vẽ một khung vuông rỗng ở giữa:\n\n```\n*****\n*   *\n*   *\n*****\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Bốn dòng tạo thành khung vuông rỗng.',
      solve: () => ['*****', '*   *', '*   *', '*****'].join('\n'),
      inputs: [''],
    },
    {
      key: '56',
      title: 'Lá cờ',
      difficulty: 'MEDIUM',
      story: 'Hãy vẽ một lá cờ đang bay:\n\n```\n*****\n*****\n  |\n  |\n  |\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Năm dòng: hai dòng lá cờ và ba dòng cán cờ.',
      note: 'Ba dòng cuối có HAI dấu cách trước dấu `|`.',
      solve: () => ['*****', '*****', '  |', '  |', '  |'].join('\n'),
      inputs: [''],
    },
    {
      key: '54',
      title: 'Viên kim cương',
      difficulty: 'MEDIUM',
      story: 'Hãy vẽ một viên kim cương bằng dấu sao:\n\n```\n  *\n ***\n*****\n ***\n  *\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Năm dòng tạo thành hình viên kim cương.',
      note: 'Chú ý số dấu cách ở đầu mỗi dòng: 2, 1, 0, 1, 2.',
      solve: () => ['  *', ' ***', '*****', ' ***', '  *'].join('\n'),
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG J — Nối chuỗi
    // ===================================================================
    {
      key: '75',
      title: 'Ghép họ và tên',
      difficulty: 'MEDIUM',
      story:
        'Dấu `+` có thể ghép hai cụm chữ lại với nhau.\n\n' +
        'Hãy tạo biến `ho = "Nguyen"` và `ten = "An"`, rồi ghép chúng thành `Nguyen An` và in ra.',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Nguyen An`',
      note: 'Nhớ ghép cả dấu cách ở giữa: `ho + " " + ten`.',
      solve: () => 'Nguyen' + ' ' + 'An',
      inputs: [''],
    },
    {
      key: '76',
      title: 'Ghép chữ với số',
      difficulty: 'MEDIUM',
      story:
        'Dấu `+` chỉ ghép được chữ với chữ. Muốn ghép một con số vào câu, em phải đổi nó thành chữ bằng `str()`.\n\n' +
        'Hãy tạo biến `tuoi = 10` và in ra câu: `Em nam nay 10 tuoi`',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Một dòng: `Em nam nay 10 tuoi`',
      note: 'Viết `"Em nam nay " + str(tuoi) + " tuoi"`. Chú ý dấu cách hai bên số.',
      solve: () => 'Em nam nay ' + String(10) + ' tuoi',
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG K — Ký tự xuống dòng
    // ===================================================================
    {
      key: '77',
      title: 'Xuống dòng bằng ký tự đặc biệt',
      difficulty: 'MEDIUM',
      story:
        'Ký tự `\\n` nằm trong dấu nháy kép có nghĩa là "xuống dòng". Nhờ nó, MỘT lệnh print in được nhiều dòng!\n\n' +
        'Hãy dùng đúng **một** lệnh print để in ra thời khóa biểu sau:\n\n' +
        '```\nSang: Hoc toan\nTrua: An com\nToi: Doc sach\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Ba dòng như mô tả.',
      note: 'Viết `print("Sang: Hoc toan\\nTrua: An com\\nToi: Doc sach")`.',
      solve: () => 'Sang: Hoc toan\nTrua: An com\nToi: Doc sach',
      inputs: [''],
    },

    // ===================================================================
    // CHẶNG L — Tổng hợp
    // ===================================================================
    {
      key: '78',
      title: 'Bảng cửu chương 2',
      difficulty: 'MEDIUM',
      story:
        'Hãy in ra bảng cửu chương 2 đầy đủ:\n\n' +
        '```\n2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Mười dòng của bảng cửu chương 2.',
      note: 'Bài này cần 10 lệnh print. Sau này học vòng lặp `for`, em sẽ làm được chỉ với 2 dòng lệnh!',
      solve: () =>
        Array.from({ length: 10 }, (_, i) => `2 x ${i + 1} = ${2 * (i + 1)}`).join('\n'),
      inputs: [''],
    },
    {
      key: '79',
      title: 'Ngôi nhà nhỏ',
      difficulty: 'HARD',
      story:
        'Hãy vẽ một ngôi nhà bằng ký tự:\n\n' +
        '```\n   /\\\n  /  \\\n /____\\\n |    |\n | [] |\n |____|\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Sáu dòng tạo thành hình ngôi nhà.',
      note:
        'Đếm kỹ số dấu cách ở đầu mỗi dòng: 3, 2, 1, 1, 1, 1. ' +
        'Dấu `\\` là ký tự đặc biệt — muốn in ra MỘT dấu `\\` em phải gõ HAI dấu: `"\\\\"`.',
      solve: () =>
        ['   /\\', '  /  \\', ' /____\\', ' |    |', ' | [] |', ' |____|'].join('\n'),
      inputs: [''],
    },
    {
      key: '80',
      title: 'Phiếu bé ngoan',
      difficulty: 'HARD',
      story:
        'Cuối khóa học, hãy tự làm cho mình một tấm phiếu bé ngoan!\n\n' +
        'Tạo các biến `ten = "An"`, `lop = "5A"`, `diem = 10`, rồi in ra tấm phiếu sau ' +
        '(các dòng có chữ đều bắt đầu bằng dấu `|` và một dấu cách):\n\n' +
        '```\n+--------------------+\n|   PHIEU BE NGOAN\n+--------------------+\n| Ten: An\n| Lop: 5A\n| Diem: 10\n+--------------------+\n| Chuc mung em!\n+--------------------+\n```',
      inputDesc: 'Không có dữ liệu vào.',
      outputDesc: 'Chín dòng tạo thành tấm phiếu bé ngoan.',
      note:
        'Đường viền là `"+" + "-" * 20 + "+"`. Dòng tiêu đề có BA dấu cách trước chữ `PHIEU`. ' +
        'Dòng điểm cần đổi số thành chữ: `"| Diem: " + str(diem)`.',
      solve: () => {
        const vien = '+' + '-'.repeat(20) + '+';
        const ten = 'An';
        const lop = '5A';
        const diem = 10;
        return [
          vien,
          '|   PHIEU BE NGOAN',
          vien,
          '| Ten: ' + ten,
          '| Lop: ' + lop,
          '| Diem: ' + String(diem),
          vien,
          '| Chuc mung em!',
          vien,
        ].join('\n');
      },
      inputs: [''],
    },
  ],
};

export default course;

import { CourseSpec } from '../types';

/**
 * Course 03 — Phép toán số học.
 * Mục tiêu: học sinh tiểu học làm quen với các phép toán +, -, *, //, % và thứ
 * tự thực hiện phép tính.
 *
 * KHÔNG DÙNG PHÉP LŨY THỪA `**`. Học sinh tiểu học chưa học lũy thừa — khái niệm
 * này thuộc chương trình lớp 6. Cần nhân một số với chính nó thì viết `a * a`
 * và đặt trong bối cảnh hình học quen thuộc (diện tích hình vuông, thể tích khối
 * lập phương), tuyệt đối không dùng từ "lũy thừa", "bình phương", "mũ".
 *
 * TUYỆT ĐỐI KHÔNG DÙNG PHÉP `/`. Trong Python `10 / 2` cho `5.0` (số thực) chứ
 * không phải `5`, nên đáp án sinh từ solver JS (`String(10/2)` → `"5"`) sẽ lệch
 * với những gì học sinh in ra. Mọi phép chia trong khóa này dùng `//` (Math.floor).
 * Phép `%` chỉ dùng với toán hạng KHÔNG ÂM để `%` của JS khớp với Python.
 *
 * GỢI Ý: cố ý viết ít `note`. Chỉ bài đầu tiên giới thiệu một phép toán MỚI
 * (`//`, `%`, thứ tự ưu tiên) mới có note. Story mô tả TÌNH HUỐNG, không
 * nêu sẵn biểu thức cần gõ — học sinh phải tự nghĩ ra phép tính.
 *
 * Thứ tự bài trong mảng `problems` chính là thứ tự hiển thị (seeder gán
 * orderIndex theo vị trí mảng), đi từ dễ đến khó theo 11 chặng:
 *   A. Cộng và trừ                G. Trung bình
 *   B. Nhân                       H. Hai kết quả một dòng
 *   C. Chia nguyên và dư          I. Tách chữ số
 *   D. Nhân một số với chính nó   J. Thứ tự phép tính
 *   E. Hình học                   K. Bài toán tổng hợp
 *   F. Đổi đơn vị
 * Độ khó tăng đơn điệu: EASY (A–F) → MEDIUM (G–J) → HARD (cuối K).
 *
 * `key` là định danh bền của bài (slug = pybasic-03-<key>), KHÔNG phải thứ tự
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

const course: CourseSpec = {
  code: 'PYTHON-BASIC-03',
  title: 'Phép toán số học',
  description:
    'Khóa học về các phép toán số học trong Python: cộng, trừ, nhân, ' +
    'chia lấy phần nguyên (//), chia lấy phần dư (%) và thứ tự thực hiện phép tính. ' +
    'Cùng nhau biến máy tính thành chiếc máy tính bỏ túi nào!',
  tags: ['python', 'co-ban', 'phep-toan', 'so-hoc'],
  problems: [
    // ===================================================================
    // CHẶNG A — Cộng và trừ
    // ===================================================================
    {
      key: '01',
      title: 'Tổng hai số',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số nguyên `a` và `b`. Hãy in ra tổng của chúng.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'Một số là tổng của `a` và `b`.',
      note: 'Đọc hai số cùng dòng bằng `a, b = map(int, input().split())`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a + b);
      },
      inputs: ['3 5', '0 0', '10 20', '100 1', '99999 1', '50000 50000'],
    },
    {
      key: '02',
      title: 'Hiệu hai số',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số nguyên `a` và `b`, với `a` luôn lớn hơn hoặc bằng `b`. Hãy in ra hiệu của chúng.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'Một số là hiệu của `a` trừ `b`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a - b);
      },
      inputs: ['10 3', '5 5', '20 0', '100 99', '99999 1', '12345 2345'],
    },
    {
      key: '36',
      title: 'Hiệu đảo ngược',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`, với `b` luôn lớn hơn hoặc bằng `a`. Hãy in ra kết quả khi lấy số THỨ HAI trừ số THỨ NHẤT.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'Một số là hiệu của `b` trừ `a`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(b - a);
      },
      inputs: ['3 10', '5 5', '0 20', '99 100', '1 99999', '2345 12345'],
    },
    {
      key: '31',
      title: 'Cộng ba số',
      difficulty: 'EASY',
      story: 'Máy tính cho em ba số nguyên trên cùng một dòng. Hãy in ra tổng của cả ba.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Một số là tổng của ba số.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a + b + c);
      },
      inputs: ['1 2 3', '0 0 0', '10 20 30', '5 5 5', '100 1 1', '7 8 9'],
    },
    {
      key: '32',
      title: 'Cộng bốn số',
      difficulty: 'EASY',
      story: 'Máy tính cho em bốn số nguyên trên cùng một dòng. Hãy in ra tổng của cả bốn.',
      inputDesc: 'Một dòng chứa bốn số nguyên cách nhau dấu cách.',
      outputDesc: 'Một số là tổng của bốn số.',
      solve: (input) => {
        const [a, b, c, d] = ints(input);
        return String(a + b + c + d);
      },
      inputs: ['1 2 3 4', '0 0 0 0', '10 20 30 40', '5 5 5 5', '100 1 1 1', '7 8 9 10'],
    },
    {
      key: '33',
      title: 'Cộng rồi trừ',
      difficulty: 'EASY',
      story:
        'Sáng em nhặt được `a` viên sỏi, trưa nhặt thêm `b` viên, chiều làm rơi mất `c` viên. Hãy in ra số sỏi em còn lại.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `a`, `b`, `c` (với `c` không lớn hơn `a + b`).',
      outputDesc: 'Số sỏi còn lại.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a + b - c);
      },
      inputs: ['10 5 3', '0 0 0', '20 20 40', '7 8 1', '100 1 50', '3 4 7'],
    },
    {
      key: '34',
      title: 'Trừ liên tiếp',
      difficulty: 'EASY',
      story:
        'Em có `a` cái bánh, cho bạn thứ nhất `b` cái, cho bạn thứ hai `c` cái. Hãy in ra số bánh còn lại.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `a`, `b`, `c` (với `b + c` không lớn hơn `a`).',
      outputDesc: 'Số bánh còn lại.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a - b - c);
      },
      inputs: ['10 3 2', '5 5 0', '20 0 0', '100 50 49', '7 3 4', '1000 1 1'],
    },
    {
      key: '35',
      title: 'Cho đủ một trăm',
      difficulty: 'EASY',
      story:
        'Một bài kiểm tra có thang điểm 100. Máy tính cho em số điểm đã đạt. Hãy in ra số điểm còn thiếu để đạt điểm tối đa.',
      inputDesc: 'Một số nguyên từ 0 đến 100.',
      outputDesc: 'Số điểm còn thiếu.',
      solve: (input) => String(100 - one(input)),
      inputs: ['70', '0', '100', '99', '55', '1'],
    },

    // ===================================================================
    // CHẶNG B — Nhân
    // ===================================================================
    {
      key: '03',
      title: 'Tích hai số',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai số nguyên `a` và `b`. Hãy in ra tích của chúng.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b` cách nhau một dấu cách.',
      outputDesc: 'Một số là tích của `a` và `b`.',
      note: 'Dấu nhân trong Python là dấu sao `*`, không phải dấu `x`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a * b);
      },
      inputs: ['3 4', '0 9', '1 100', '12 12', '999 0', '300 300'],
    },
    {
      key: '37',
      title: 'Tích ba số',
      difficulty: 'EASY',
      story: 'Máy tính cho em ba số nguyên trên một dòng. Hãy in ra tích của cả ba.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Một số là tích của ba số.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a * b * c);
      },
      inputs: ['2 3 4', '1 1 1', '0 5 9', '10 10 10', '7 2 3', '100 2 5'],
    },
    {
      key: '38',
      title: 'Gấp mười lần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số nguyên. Hãy in ra số đó sau khi tăng lên gấp mười lần.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số đã cho nhân với 10.',
      solve: (input) => String(one(input) * 10),
      inputs: ['7', '0', '25', '100', '1', '999'],
    },
    {
      key: '40',
      title: 'Năm hộp bút',
      difficulty: 'EASY',
      story: 'Mỗi hộp có một số bút giống nhau. Máy tính cho em số bút trong một hộp. Hãy in ra tổng số bút của NĂM hộp.',
      inputDesc: 'Một số nguyên không âm là số bút mỗi hộp.',
      outputDesc: 'Tổng số bút của năm hộp.',
      solve: (input) => String(one(input) * 5),
      inputs: ['4', '0', '10', '12', '1', '200'],
    },
    {
      key: '12',
      title: 'Mua hai loại đồ',
      difficulty: 'EASY',
      story:
        'Em mua `a` quyển vở giá `b` đồng mỗi quyển, và `c` cây bút giá `d` đồng mỗi cây. Hãy in ra tổng số tiền phải trả.',
      inputDesc: 'Một dòng chứa bốn số nguyên không âm `a`, `b`, `c`, `d`.',
      outputDesc: 'Tổng số tiền.',
      solve: (input) => {
        const [a, b, c, d] = ints(input);
        return String(a * b + c * d);
      },
      inputs: ['3 5000 2 3000', '0 0 0 0', '1 1 1 1', '10 100 5 200', '2 7 3 4', '100 10 100 10'],
    },
    {
      key: '41',
      title: 'Diện tích tam giác vuông',
      difficulty: 'EASY',
      story:
        'Một tam giác vuông có hai cạnh góc vuông dài `a` và `b`. Diện tích của nó bằng nửa tích hai cạnh đó. ' +
        'Hãy in ra diện tích (đề bài đảm bảo tích `a * b` luôn là số chẵn).',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`, với `a * b` là số chẵn.',
      outputDesc: 'Diện tích tam giác vuông.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(Math.floor((a * b) / 2));
      },
      inputs: ['3 4', '2 2', '10 10', '5 6', '8 1', '100 50'],
    },

    // ===================================================================
    // CHẶNG C — Chia lấy phần nguyên và phần dư
    // ===================================================================
    {
      key: '04',
      title: 'Chia lấy phần nguyên',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`, với `b` khác 0. Hãy in ra kết quả khi chia `a` cho `b` và chỉ lấy phần nguyên (bỏ phần dư).\n\nVí dụ: 17 chia 5 được 3 (còn dư 2), nên kết quả là `3`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`, `b` khác 0.',
      outputDesc: 'Phần nguyên của phép chia `a` cho `b`.',
      note: 'Python có phép chia lấy phần nguyên riêng, viết bằng HAI dấu gạch chéo: `a // b`. Dùng một gạch `/` sẽ ra số thập phân!',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(Math.floor(a / b));
      },
      inputs: ['17 5', '10 2', '0 7', '100 3', '99999 100', '7 8'],
    },
    {
      key: '05',
      title: 'Chia lấy phần dư',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`, với `b` khác 0. Hãy in ra phần DƯ của phép chia `a` cho `b`.\n\nVí dụ: 17 chia 5 dư 2, nên kết quả là `2`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`, `b` khác 0.',
      outputDesc: 'Phần dư của phép chia `a` cho `b`.',
      note: 'Phép lấy phần dư trong Python là dấu phần trăm: `a % b`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a % b);
      },
      inputs: ['17 5', '10 2', '0 7', '100 3', '7 8', '99999 7'],
    },
    {
      key: '20',
      title: 'Số chẵn hay lẻ',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm. Hãy in ra `0` nếu số đó chẵn và `1` nếu số đó lẻ.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số `0` hoặc số `1`.',
      solve: (input) => String(one(input) % 2),
      inputs: ['4', '7', '0', '1', '100', '99999'],
    },
    {
      key: '42',
      title: 'Chia đôi',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số kẹo. Hai bạn chia đều nhau. Hãy in ra số kẹo MỖI BẠN nhận được.',
      inputDesc: 'Một số nguyên không âm là số kẹo.',
      outputDesc: 'Số kẹo mỗi bạn nhận được.',
      solve: (input) => String(Math.floor(one(input) / 2)),
      inputs: ['10', '7', '0', '1', '100', '99'],
    },
    {
      key: '44',
      title: 'Dư khi chia cho 5',
      difficulty: 'EASY',
      story:
        'Các bạn xếp thành hàng, mỗi hàng đúng 5 bạn. Máy tính cho em tổng số bạn. Hãy in ra số bạn LẺ RA không xếp đủ một hàng.',
      inputDesc: 'Một số nguyên không âm là tổng số bạn.',
      outputDesc: 'Số bạn lẻ ra.',
      solve: (input) => String(one(input) % 5),
      inputs: ['12', '10', '0', '4', '99', '100'],
    },
    {
      key: '45',
      title: 'Dư khi chia cho 3',
      difficulty: 'EASY',
      story:
        'Một bó hoa cần đúng 3 bông. Máy tính cho em tổng số bông hoa. Hãy in ra số bông còn THỪA sau khi bó hết mức có thể.',
      inputDesc: 'Một số nguyên không âm là số bông hoa.',
      outputDesc: 'Số bông hoa còn thừa.',
      solve: (input) => String(one(input) % 3),
      inputs: ['10', '9', '0', '2', '100', '99'],
    },
    {
      key: '16',
      title: 'Chữ số hàng đơn vị',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm. Hãy in ra chữ số CUỐI CÙNG của nó.\n\nVí dụ: với `327` thì chữ số cuối là `7`.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Chữ số cuối cùng.',
      solve: (input) => String(one(input) % 10),
      inputs: ['327', '5', '0', '10', '99999', '12340'],
    },
    {
      key: '17',
      title: 'Bỏ chữ số cuối',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm. Hãy in ra số nhận được sau khi XÓA đi chữ số cuối cùng.\n\nVí dụ: với `327` thì kết quả là `32`.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số sau khi bỏ chữ số cuối.',
      solve: (input) => String(Math.floor(one(input) / 10)),
      inputs: ['327', '5', '0', '10', '99999', '12340'],
    },
    {
      key: '26',
      title: 'Hai chữ số cuối',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm. Hãy in ra số tạo bởi HAI chữ số cuối cùng của nó.\n\nVí dụ: với `1327` thì hai chữ số cuối tạo thành `27`.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số tạo bởi hai chữ số cuối.',
      solve: (input) => String(one(input) % 100),
      inputs: ['1327', '45', '0', '100', '99999', '1005'],
    },
    {
      key: '43',
      title: 'Bỏ hai chữ số cuối',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số nguyên không âm. Hãy in ra số nhận được sau khi xóa đi HAI chữ số cuối cùng.\n\nVí dụ: với `1327` thì kết quả là `13`.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Số sau khi bỏ hai chữ số cuối.',
      solve: (input) => String(Math.floor(one(input) / 100)),
      inputs: ['1327', '45', '0', '100', '99999', '1005'],
    },
    {
      key: '25',
      title: 'Chữ số cuối của tích',
      difficulty: 'EASY',
      story:
        'Máy tính cho em hai số nguyên không âm. Hãy nhân chúng với nhau rồi in ra chữ số CUỐI CÙNG của kết quả.\n\nVí dụ: `7 * 8 = 56`, chữ số cuối là `6`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm.',
      outputDesc: 'Chữ số cuối cùng của tích.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String((a * b) % 10);
      },
      inputs: ['7 8', '0 9', '5 5', '12 12', '100 3', '999 2'],
    },

    // ===================================================================
    // CHẶNG D — Nhân một số với chính nó
    // (đặt trong bối cảnh hình học; KHÔNG dùng lũy thừa `**`)
    // ===================================================================
    {
      key: '06',
      title: 'Diện tích hình vuông',
      difficulty: 'EASY',
      story: 'Một hình vuông có cạnh dài `a`. Hãy in ra diện tích của nó.',
      inputDesc: 'Một dòng chứa một số nguyên dương `a`.',
      outputDesc: 'Diện tích hình vuông.',
      note: 'Diện tích hình vuông bằng cạnh nhân cạnh, viết là `a * a`.',
      solve: (input) => {
        const a = one(input);
        return String(a * a);
      },
      inputs: ['5', '1', '10', '12', '100', '316'],
    },
    {
      key: '07',
      title: 'Thể tích khối lập phương',
      difficulty: 'EASY',
      story:
        'Một khối lập phương có cạnh dài `a`. Thể tích của nó bằng cạnh nhân cạnh nhân cạnh. Hãy in ra thể tích.',
      inputDesc: 'Một dòng chứa một số nguyên dương `a`.',
      outputDesc: 'Thể tích khối lập phương.',
      solve: (input) => {
        const a = one(input);
        return String(a * a * a);
      },
      inputs: ['3', '1', '10', '12', '5', '100'],
    },
    {
      key: '13',
      title: 'Tổng diện tích hai hình vuông',
      difficulty: 'EASY',
      story:
        'Có hai hình vuông, một hình cạnh `a` và một hình cạnh `b`. Hãy in ra TỔNG diện tích của cả hai hình.\n\nVí dụ: với `3` và `4` thì tổng diện tích là `25`.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Tổng diện tích hai hình vuông.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(a * a + b * b);
      },
      inputs: ['3 4', '1 1', '2 2', '5 12', '10 10', '20 21'],
    },
    {
      key: '47',
      title: 'Diện tích hình thang',
      difficulty: 'EASY',
      story:
        'Một hình thang có đáy lớn `a`, đáy bé `b` và chiều cao `h`. Diện tích của nó bằng tổng hai đáy nhân chiều cao rồi chia đôi. ' +
        'Hãy in ra diện tích (chỉ lấy phần nguyên).',
      inputDesc: 'Một dòng chứa ba số nguyên dương `a`, `b`, `h`.',
      outputDesc: 'Diện tích hình thang, lấy phần nguyên.',
      solve: (input) => {
        const [a, b, h] = ints(input);
        return String(Math.floor(((a + b) * h) / 2));
      },
      inputs: ['5 3 4', '2 2 2', '10 6 5', '7 3 3', '100 50 10', '9 1 7'],
    },
    {
      key: '08',
      title: 'Chiều rộng hình chữ nhật',
      difficulty: 'EASY',
      story:
        'Một hình chữ nhật có chu vi `p` và chiều dài `a`. Hãy in ra chiều rộng của nó.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `p` và `a`, với `p` là số chẵn và `a` nhỏ hơn nửa chu vi.',
      outputDesc: 'Chiều rộng hình chữ nhật.',
      solve: (input) => {
        const [p, a] = ints(input);
        return String(Math.floor(p / 2) - a);
      },
      inputs: ['16 5', '20 8', '100 30', '10 4', '40 19', '1000 1'],
    },
    {
      key: '46',
      title: 'Số viên gạch lát nền',
      difficulty: 'EASY',
      story:
        'Một căn phòng hình chữ nhật dài `a` rộng `b`. Người ta lát nền bằng những viên gạch hình vuông cạnh `c`. ' +
        'Hãy in ra số viên gạch cần dùng (chỉ lấy phần nguyên).',
      inputDesc: 'Một dòng chứa ba số nguyên dương `a`, `b`, `c`.',
      outputDesc: 'Số viên gạch cần dùng, lấy phần nguyên.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(Math.floor((a * b) / (c * c)));
      },
      inputs: ['10 8 2', '6 6 3', '100 100 10', '9 5 2', '20 15 4', '7 7 1'],
    },

    // ===================================================================
    // CHẶNG E — Hình học
    // ===================================================================
    {
      key: '11',
      title: 'Chu vi hình chữ nhật',
      difficulty: 'EASY',
      story:
        'Một hình chữ nhật có chiều dài `a` và chiều rộng `b`. Hãy in ra chu vi của nó.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Chu vi hình chữ nhật.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String((a + b) * 2);
      },
      inputs: ['5 3', '10 10', '1 1', '100 50', '2 7', '999 1'],
    },
    {
      key: '39',
      title: 'Chu vi hình vuông',
      difficulty: 'EASY',
      story: 'Một hình vuông có cạnh dài `a`. Hãy in ra chu vi của nó.',
      inputDesc: 'Một dòng chứa một số nguyên dương `a`.',
      outputDesc: 'Chu vi hình vuông.',
      solve: (input) => String(one(input) * 4),
      inputs: ['5', '1', '10', '100', '7', '250'],
    },
    {
      key: '48',
      title: 'Cạnh hình vuông từ chu vi',
      difficulty: 'EASY',
      story:
        'Một hình vuông có chu vi là `p` (đề bài đảm bảo `p` chia hết cho 4). Hãy in ra độ dài MỘT cạnh của nó.',
      inputDesc: 'Một số nguyên dương `p` chia hết cho 4.',
      outputDesc: 'Độ dài một cạnh.',
      solve: (input) => String(Math.floor(one(input) / 4)),
      inputs: ['20', '4', '40', '400', '28', '1000'],
    },
    {
      key: '49',
      title: 'Diện tích toàn phần hình lập phương',
      difficulty: 'EASY',
      story:
        'Một khối lập phương có cạnh dài `a`. Nó có 6 mặt, mỗi mặt là một hình vuông cạnh `a`. Hãy in ra tổng diện tích cả 6 mặt.',
      inputDesc: 'Một số nguyên dương `a`.',
      outputDesc: 'Tổng diện tích 6 mặt.',
      solve: (input) => {
        const a = one(input);
        return String(a * a * 6);
      },
      inputs: ['2', '1', '10', '5', '100', '7'],
    },
    {
      key: '50',
      title: 'Phần đất còn lại',
      difficulty: 'EASY',
      story:
        'Một mảnh vườn hình chữ nhật dài `a` rộng `b`. Trong vườn có một cái ao hình chữ nhật dài `c` rộng `d`. ' +
        'Hãy in ra diện tích phần đất còn lại (không tính ao).',
      inputDesc: 'Một dòng chứa bốn số nguyên dương `a`, `b`, `c`, `d`, với ao luôn nhỏ hơn vườn.',
      outputDesc: 'Diện tích phần đất còn lại.',
      solve: (input) => {
        const [a, b, c, d] = ints(input);
        return String(a * b - c * d);
      },
      inputs: ['10 8 3 2', '5 5 1 1', '100 100 50 50', '20 10 10 10', '7 7 2 3', '1000 1000 1 1'],
    },
    {
      key: '51',
      title: 'Trồng cây quanh vườn',
      difficulty: 'EASY',
      story:
        'Một mảnh vườn hình chữ nhật dài `a` rộng `b`. Người ta trồng cây quanh vườn, hai cây liền nhau cách nhau `c` mét. ' +
        'Hãy in ra số cây trồng được (chỉ lấy phần nguyên của chu vi chia khoảng cách).',
      inputDesc: 'Một dòng chứa ba số nguyên dương `a`, `b`, `c`.',
      outputDesc: 'Số cây trồng được.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(Math.floor(((a + b) * 2) / c));
      },
      inputs: ['10 8 4', '5 5 2', '100 100 3', '20 10 7', '6 6 6', '1000 10 100'],
    },

    // ===================================================================
    // CHẶNG F — Đổi đơn vị
    // ===================================================================
    {
      key: '14',
      title: 'Đổi giây ra phút',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số giây. Hãy in ra số phút TRỌN VẸN có trong khoảng thời gian đó.\n\nVí dụ: 130 giây được 2 phút (còn dư 10 giây).',
      inputDesc: 'Một số nguyên không âm là số giây.',
      outputDesc: 'Số phút trọn vẹn.',
      solve: (input) => String(Math.floor(one(input) / 60)),
      inputs: ['130', '60', '59', '0', '3600', '12345'],
    },
    {
      key: '52',
      title: 'Đổi giờ ra ngày',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số giờ. Hãy in ra số NGÀY trọn vẹn có trong khoảng thời gian đó.',
      inputDesc: 'Một số nguyên không âm là số giờ.',
      outputDesc: 'Số ngày trọn vẹn.',
      solve: (input) => String(Math.floor(one(input) / 24)),
      inputs: ['50', '24', '23', '0', '240', '1000'],
    },
    {
      key: '53',
      title: 'Đổi ngày ra tuần',
      difficulty: 'EASY',
      story: 'Máy tính cho em một số ngày. Hãy in ra số TUẦN trọn vẹn có trong khoảng thời gian đó.',
      inputDesc: 'Một số nguyên không âm là số ngày.',
      outputDesc: 'Số tuần trọn vẹn.',
      solve: (input) => String(Math.floor(one(input) / 7)),
      inputs: ['10', '7', '6', '0', '365', '100'],
    },
    {
      key: '54',
      title: 'Đổi giờ phút ra phút',
      difficulty: 'EASY',
      story:
        'Máy tính cho em số giờ `h` và số phút `m`. Hãy in ra TỔNG số phút của khoảng thời gian đó.\n\nVí dụ: 2 giờ 10 phút là 130 phút.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `h` và `m`.',
      outputDesc: 'Tổng số phút.',
      solve: (input) => {
        const [h, m] = ints(input);
        return String(h * 60 + m);
      },
      inputs: ['2 10', '0 0', '1 0', '0 59', '24 0', '10 30'],
    },
    {
      key: '55',
      title: 'Đổi tuần ngày ra ngày',
      difficulty: 'EASY',
      story: 'Máy tính cho em số tuần `t` và số ngày lẻ `d`. Hãy in ra TỔNG số ngày.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `t` và `d`.',
      outputDesc: 'Tổng số ngày.',
      solve: (input) => {
        const [t, d] = ints(input);
        return String(t * 7 + d);
      },
      inputs: ['2 3', '0 0', '1 0', '0 6', '52 1', '10 5'],
    },
    {
      key: '56',
      title: 'Đổi giờ phút giây ra giây',
      difficulty: 'EASY',
      story: 'Máy tính cho em số giờ `h`, số phút `m` và số giây `s`. Hãy in ra TỔNG số giây.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `h`, `m`, `s`.',
      outputDesc: 'Tổng số giây.',
      solve: (input) => {
        const [h, m, s] = ints(input);
        return String(h * 3600 + m * 60 + s);
      },
      inputs: ['1 2 3', '0 0 0', '0 1 0', '2 0 0', '0 0 59', '10 30 15'],
    },
    {
      key: '57',
      title: 'Đổi tiền ra đồng',
      difficulty: 'EASY',
      story:
        'Em có `a` tờ mệnh giá 1000 đồng, `b` tờ mệnh giá 500 đồng và `c` tờ mệnh giá 100 đồng. Hãy in ra tổng số tiền.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `a`, `b`, `c`.',
      outputDesc: 'Tổng số tiền tính bằng đồng.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a * 1000 + b * 500 + c * 100);
      },
      inputs: ['2 3 4', '0 0 0', '1 0 0', '0 0 9', '10 10 10', '5 1 2'],
    },
    {
      key: '58',
      title: 'Số phút còn lẻ',
      difficulty: 'EASY',
      story:
        'Máy tính cho em một số phút. Sau khi đếm hết các giờ trọn vẹn, hãy in ra số phút CÒN LẺ.\n\nVí dụ: 130 phút là 2 giờ và còn lẻ 10 phút, nên kết quả là `10`.',
      inputDesc: 'Một số nguyên không âm là số phút.',
      outputDesc: 'Số phút còn lẻ sau khi trừ hết các giờ trọn vẹn.',
      solve: (input) => String(one(input) % 60),
      inputs: ['130', '60', '59', '0', '3661', '12345'],
    },

    // ===================================================================
    // CHẶNG G — Trung bình
    // ===================================================================
    {
      key: '09',
      title: 'Trung bình hai số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm. Hãy in ra trung bình cộng của chúng, chỉ lấy phần nguyên.\n\nVí dụ: trung bình của `4` và `7` là `5` (vì 11 chia 2 được 5, dư 1).',
      inputDesc: 'Một dòng chứa hai số nguyên không âm.',
      outputDesc: 'Trung bình cộng, lấy phần nguyên.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(Math.floor((a + b) / 2));
      },
      inputs: ['4 7', '10 10', '0 0', '3 8', '100 1', '99999 1'],
    },
    {
      key: '10',
      title: 'Trung bình ba số',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em ba số nguyên không âm. Hãy in ra trung bình cộng của chúng, chỉ lấy phần nguyên.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm.',
      outputDesc: 'Trung bình cộng, lấy phần nguyên.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(Math.floor((a + b + c) / 3));
      },
      inputs: ['3 5 7', '10 10 10', '0 0 0', '1 2 3', '100 200 300', '99 1 1'],
    },
    {
      key: '59',
      title: 'Trung bình bốn số',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em bốn điểm kiểm tra. Hãy in ra điểm trung bình, chỉ lấy phần nguyên.',
      inputDesc: 'Một dòng chứa bốn số nguyên không âm.',
      outputDesc: 'Trung bình cộng, lấy phần nguyên.',
      solve: (input) => {
        const [a, b, c, d] = ints(input);
        return String(Math.floor((a + b + c + d) / 4));
      },
      inputs: ['8 9 7 10', '10 10 10 10', '0 0 0 0', '1 2 3 4', '5 5 5 6', '100 0 100 0'],
    },
    {
      key: '27',
      title: 'Tổng dãy số liên tiếp',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra tổng của TẤT CẢ các số từ `1` đến `n`.\n\nVí dụ: với `5` thì tổng là `15` vì 1 + 2 + 3 + 4 + 5 = 15.',
      inputDesc: 'Một số nguyên không âm `n` (không quá 100000).',
      outputDesc: 'Tổng các số từ 1 đến `n`.',
      note: 'Khóa này chưa học vòng lặp. Nhà toán học Gauss đã tìm ra cách tính tổng này chỉ bằng MỘT phép tính — em thử nghĩ xem tổng của số đầu và số cuối có gì đặc biệt nhé!',
      solve: (input) => {
        const n = one(input);
        return String(Math.floor((n * (n + 1)) / 2));
      },
      inputs: ['5', '1', '0', '10', '100', '1000'],
    },
    {
      key: '60',
      title: 'Tổng dãy số chẵn',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm `n`. Hãy in ra tổng của `n` số chẵn đầu tiên: `2 + 4 + 6 + ...`\n\nVí dụ: với `3` thì tổng là `12` vì 2 + 4 + 6 = 12.',
      inputDesc: 'Một số nguyên không âm `n` (không quá 10000).',
      outputDesc: 'Tổng của `n` số chẵn đầu tiên.',
      solve: (input) => {
        const n = one(input);
        return String(n * (n + 1));
      },
      inputs: ['3', '1', '0', '5', '10', '100'],
    },
    {
      key: '61',
      title: 'Tổng các số từ a đến b',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`, với `a` không lớn hơn `b`. ' +
        'Hãy in ra tổng của TẤT CẢ các số nguyên từ `a` đến `b`, tính cả hai đầu.\n\nVí dụ: với `3` và `6` thì tổng là `18` vì 3 + 4 + 5 + 6 = 18.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`, với `a` không lớn hơn `b`.',
      outputDesc: 'Tổng các số từ `a` đến `b`.',
      solve: (input) => {
        const [a, b] = ints(input);
        return String(Math.floor(((a + b) * (b - a + 1)) / 2));
      },
      inputs: ['3 6', '1 10', '5 5', '0 0', '1 100', '10 20'],
    },

    // ===================================================================
    // CHẶNG H — Hai kết quả trên một dòng
    // ===================================================================
    {
      key: '21',
      title: 'Tổng và hiệu',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên `a` và `b`, với `a` lớn hơn hoặc bằng `b`. Hãy in ra tổng và hiệu của chúng trên cùng một dòng, cách nhau một dấu cách.',
      inputDesc: 'Một dòng chứa hai số nguyên `a` và `b`.',
      outputDesc: 'Hai số trên một dòng: tổng trước, hiệu sau.',
      solve: (input) => {
        const [a, b] = ints(input);
        return `${a + b} ${a - b}`;
      },
      inputs: ['10 3', '5 5', '20 0', '100 1', '99999 1', '12345 2345'],
    },
    {
      key: '62',
      title: 'Tổng và tích',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên. Hãy in ra tổng và tích của chúng trên cùng một dòng, cách nhau một dấu cách.',
      inputDesc: 'Một dòng chứa hai số nguyên.',
      outputDesc: 'Hai số trên một dòng: tổng trước, tích sau.',
      solve: (input) => {
        const [a, b] = ints(input);
        return `${a + b} ${a * b}`;
      },
      inputs: ['3 4', '0 0', '1 1', '10 10', '7 8', '100 2'],
    },
    {
      key: '22',
      title: 'Thương và dư',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em hai số nguyên không âm `a` và `b`, với `b` khác 0. Hãy in ra thương (phần nguyên) và phần dư trên cùng một dòng, cách nhau một dấu cách.\n\nVí dụ: với `17` và `5` thì in ra `3 2`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `a` và `b`, `b` khác 0.',
      outputDesc: 'Hai số trên một dòng: thương trước, dư sau.',
      solve: (input) => {
        const [a, b] = ints(input);
        return `${Math.floor(a / b)} ${a % b}`;
      },
      inputs: ['17 5', '10 2', '0 7', '100 3', '7 8', '99999 100'],
    },
    {
      key: '15',
      title: 'Phút và giây',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số giây. Hãy in ra số phút và số giây còn lại trên cùng một dòng, cách nhau một dấu cách.\n\nVí dụ: `130` giây là 2 phút 10 giây, nên in ra `2 10`.',
      inputDesc: 'Một số nguyên không âm là số giây.',
      outputDesc: 'Hai số trên một dòng: số phút trước, số giây còn lại sau.',
      solve: (input) => {
        const s = one(input);
        return `${Math.floor(s / 60)} ${s % 60}`;
      },
      inputs: ['130', '60', '59', '0', '3661', '12345'],
    },
    {
      key: '29',
      title: 'Tuần và ngày',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số ngày. Hãy in ra số tuần trọn vẹn và số ngày còn lẻ trên cùng một dòng, cách nhau một dấu cách.\n\nVí dụ: `10` ngày là 1 tuần 3 ngày, nên in ra `1 3`.',
      inputDesc: 'Một số nguyên không âm là số ngày.',
      outputDesc: 'Hai số trên một dòng: số tuần trước, số ngày lẻ sau.',
      solve: (input) => {
        const d = one(input);
        return `${Math.floor(d / 7)} ${d % 7}`;
      },
      inputs: ['10', '7', '6', '0', '365', '100'],
    },
    {
      key: '28',
      title: 'Đổi tiền ra tờ',
      difficulty: 'MEDIUM',
      story:
        'Em có `n` nghìn đồng và muốn đổi ra các tờ mệnh giá 10 nghìn. Hãy in ra số tờ đổi được và số tiền lẻ còn lại trên cùng một dòng, cách nhau một dấu cách.\n\nVí dụ: với `37` thì in ra `3 7`.',
      inputDesc: 'Một số nguyên không âm `n`.',
      outputDesc: 'Hai số trên một dòng: số tờ trước, tiền lẻ sau.',
      solve: (input) => {
        const n = one(input);
        return `${Math.floor(n / 10)} ${n % 10}`;
      },
      inputs: ['37', '10', '9', '0', '100', '99999'],
    },

    // ===================================================================
    // CHẶNG I — Tách chữ số
    // ===================================================================
    {
      key: '63',
      title: 'Chữ số hàng chục',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên không âm. Hãy in ra chữ số ở HÀNG CHỤC của nó.\n\nVí dụ: với `327` thì chữ số hàng chục là `2`.',
      inputDesc: 'Một số nguyên không âm.',
      outputDesc: 'Chữ số hàng chục.',
      solve: (input) => String(Math.floor(one(input) / 10) % 10),
      inputs: ['327', '45', '5', '0', '99999', '1005'],
    },
    {
      key: '18',
      title: 'Tổng hai chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có ĐÚNG hai chữ số. Hãy in ra tổng của hai chữ số đó.\n\nVí dụ: với `47` thì in ra `11` vì 4 + 7 = 11.',
      inputDesc: 'Một số nguyên từ 10 đến 99.',
      outputDesc: 'Tổng hai chữ số.',
      solve: (input) => {
        const n = one(input);
        return String(Math.floor(n / 10) + (n % 10));
      },
      inputs: ['47', '10', '99', '50', '23', '88'],
    },
    {
      key: '64',
      title: 'Tích hai chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số. Hãy in ra TÍCH của hai chữ số đó.\n\nVí dụ: với `47` thì in ra `28` vì 4 * 7 = 28.',
      inputDesc: 'Một số nguyên từ 10 đến 99.',
      outputDesc: 'Tích hai chữ số.',
      solve: (input) => {
        const n = one(input);
        return String(Math.floor(n / 10) * (n % 10));
      },
      inputs: ['47', '10', '99', '50', '23', '88'],
    },
    {
      key: '65',
      title: 'Hiệu hai chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số, trong đó chữ số hàng chục luôn lớn hơn hoặc bằng chữ số hàng đơn vị. ' +
        'Hãy in ra hiệu của chữ số hàng chục trừ chữ số hàng đơn vị.',
      inputDesc: 'Một số nguyên từ 10 đến 99, chữ số hàng chục không nhỏ hơn hàng đơn vị.',
      outputDesc: 'Hiệu hai chữ số.',
      solve: (input) => {
        const n = one(input);
        return String(Math.floor(n / 10) - (n % 10));
      },
      inputs: ['74', '10', '99', '50', '32', '88'],
    },
    {
      key: '19',
      title: 'Đảo ngược số hai chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có đúng hai chữ số. Hãy in ra số nhận được khi ĐỔI CHỖ hai chữ số đó.\n\nVí dụ: với `47` thì in ra `74`.',
      inputDesc: 'Một số nguyên từ 10 đến 99.',
      outputDesc: 'Số sau khi đảo ngược hai chữ số.',
      solve: (input) => {
        const n = one(input);
        return String((n % 10) * 10 + Math.floor(n / 10));
      },
      inputs: ['47', '10', '99', '50', '23', '88'],
    },
    {
      key: '30',
      title: 'Tổng ba chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có ĐÚNG ba chữ số. Hãy in ra tổng của ba chữ số đó.\n\nVí dụ: với `347` thì in ra `14` vì 3 + 4 + 7 = 14.',
      inputDesc: 'Một số nguyên từ 100 đến 999.',
      outputDesc: 'Tổng ba chữ số.',
      solve: (input) => {
        const n = one(input);
        return String(Math.floor(n / 100) + (Math.floor(n / 10) % 10) + (n % 10));
      },
      inputs: ['347', '100', '999', '500', '210', '888'],
    },
    {
      key: '66',
      title: 'Tích ba chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có đúng ba chữ số. Hãy in ra TÍCH của ba chữ số đó.\n\nVí dụ: với `347` thì in ra `84` vì 3 * 4 * 7 = 84.',
      inputDesc: 'Một số nguyên từ 100 đến 999.',
      outputDesc: 'Tích ba chữ số.',
      solve: (input) => {
        const n = one(input);
        return String(Math.floor(n / 100) * (Math.floor(n / 10) % 10) * (n % 10));
      },
      inputs: ['347', '100', '999', '512', '210', '888'],
    },
    {
      key: '67',
      title: 'Đảo ngược số ba chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có đúng ba chữ số. Hãy in ra số nhận được khi viết ba chữ số đó theo thứ tự NGƯỢC LẠI.\n\nVí dụ: với `347` thì in ra `743`.',
      inputDesc: 'Một số nguyên từ 100 đến 999.',
      outputDesc: 'Số sau khi đảo ngược ba chữ số.',
      solve: (input) => {
        const n = one(input);
        return String((n % 10) * 100 + (Math.floor(n / 10) % 10) * 10 + Math.floor(n / 100));
      },
      inputs: ['347', '100', '999', '512', '210', '888'],
    },
    {
      key: '68',
      title: 'Ba chữ số thành ba số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có đúng ba chữ số. Hãy in ra ba chữ số đó, cách nhau một dấu cách, theo đúng thứ tự từ trái sang phải.\n\nVí dụ: với `347` thì in ra `3 4 7`.',
      inputDesc: 'Một số nguyên từ 100 đến 999.',
      outputDesc: 'Ba chữ số trên một dòng, cách nhau dấu cách.',
      solve: (input) => {
        const n = one(input);
        return `${Math.floor(n / 100)} ${Math.floor(n / 10) % 10} ${n % 10}`;
      },
      inputs: ['347', '100', '999', '512', '210', '888'],
    },
    {
      key: '69',
      title: 'Tổng bốn chữ số',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em một số nguyên có ĐÚNG bốn chữ số. Hãy in ra tổng của bốn chữ số đó.\n\nVí dụ: với `2347` thì in ra `16`.',
      inputDesc: 'Một số nguyên từ 1000 đến 9999.',
      outputDesc: 'Tổng bốn chữ số.',
      solve: (input) => {
        const n = one(input);
        return String(
          Math.floor(n / 1000) +
            (Math.floor(n / 100) % 10) +
            (Math.floor(n / 10) % 10) +
            (n % 10),
        );
      },
      inputs: ['2347', '1000', '9999', '5050', '1234', '8888'],
    },

    // ===================================================================
    // CHẶNG J — Thứ tự phép tính
    // ===================================================================
    {
      key: '23',
      title: 'Thứ tự phép tính',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `a + b * c`.\n\nVí dụ: với `2 3 4` thì kết quả là `14`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Giá trị của biểu thức.',
      note: 'Giống như trong Toán, Python làm phép NHÂN trước phép CỘNG.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a + b * c);
      },
      inputs: ['2 3 4', '0 0 0', '1 1 1', '10 5 2', '100 10 10', '5 0 99'],
    },
    {
      key: '24',
      title: 'Dùng dấu ngoặc',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `(a + b) * c`.\n\nVí dụ: với `2 3 4` thì kết quả là `20`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Giá trị của biểu thức.',
      note: 'Dấu ngoặc bắt Python tính phần bên trong TRƯỚC. So kết quả với bài trên để thấy sự khác biệt!',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String((a + b) * c);
      },
      inputs: ['2 3 4', '0 0 0', '1 1 1', '10 5 2', '100 10 10', '5 5 99'],
    },
    {
      key: '70',
      title: 'Nhân trước trừ sau',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `a - b * c`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Giá trị của biểu thức.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a - b * c);
      },
      inputs: ['20 3 4', '0 0 0', '1 1 1', '100 5 2', '10 10 10', '5 0 99'],
    },
    {
      key: '71',
      title: 'Ngoặc ở phép trừ',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `(a - b) * c`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Giá trị của biểu thức.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String((a - b) * c);
      },
      inputs: ['20 3 4', '0 0 0', '1 1 1', '100 5 2', '10 10 10', '9 5 99'],
    },
    {
      key: '72',
      title: 'Ngoặc ở bên phải',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên `a`, `b`, `c`. Hãy tính và in ra giá trị của biểu thức `a * (b + c)`.',
      inputDesc: 'Một dòng chứa ba số nguyên cách nhau dấu cách.',
      outputDesc: 'Giá trị của biểu thức.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(a * (b + c));
      },
      inputs: ['2 3 4', '0 0 0', '1 1 1', '10 5 2', '100 10 10', '5 7 3'],
    },
    {
      key: '73',
      title: 'Hai cặp ngoặc',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em bốn số nguyên `a`, `b`, `c`, `d`. Hãy tính và in ra giá trị của biểu thức `(a + b) * (c + d)`.',
      inputDesc: 'Một dòng chứa bốn số nguyên cách nhau dấu cách.',
      outputDesc: 'Giá trị của biểu thức.',
      solve: (input) => {
        const [a, b, c, d] = ints(input);
        return String((a + b) * (c + d));
      },
      inputs: ['1 2 3 4', '0 0 0 0', '1 1 1 1', '10 5 2 3', '100 0 10 0', '7 3 2 8'],
    },
    {
      key: '74',
      title: 'Nhân rồi chia',
      difficulty: 'MEDIUM',
      story:
        'Máy tính cho em ba số nguyên không âm `a`, `b`, `c` với `c` khác 0. Hãy tính `a` nhân `b`, rồi chia kết quả cho `c` lấy phần nguyên, và in ra.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `a`, `b`, `c`, `c` khác 0.',
      outputDesc: 'Giá trị của biểu thức, lấy phần nguyên.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(Math.floor((a * b) / c));
      },
      inputs: ['10 6 4', '1 1 1', '0 5 3', '100 100 7', '9 9 2', '1000 2 3'],
    },

    // ===================================================================
    // CHẶNG K — Bài toán tổng hợp
    // ===================================================================
    {
      key: '75',
      title: 'Tiền thừa khi mua hàng',
      difficulty: 'MEDIUM',
      story:
        'Em đưa cho cô bán hàng `t` đồng để mua `n` món, mỗi món giá `g` đồng, và trả thêm `p` đồng tiền túi đựng. ' +
        'Hãy in ra số tiền cô phải trả lại cho em.',
      inputDesc: 'Một dòng chứa bốn số nguyên không âm `t`, `n`, `g`, `p`, với `t` luôn đủ trả.',
      outputDesc: 'Số tiền thừa.',
      solve: (input) => {
        const [t, n, g, p] = ints(input);
        return String(t - (n * g + p));
      },
      inputs: [
        '50000 3 12000 2000',
        '10000 1 10000 0',
        '100 0 5 0',
        '20000 4 5000 0',
        '1000 2 300 100',
        '99999 1 1 1',
      ],
    },
    {
      key: '76',
      title: 'Số hộp cần dùng',
      difficulty: 'MEDIUM',
      story:
        'Em có `n` cái bánh, mỗi hộp đựng được đúng `k` cái. Em phải xếp HẾT số bánh vào hộp, ' +
        'nên nếu còn thừa vài cái chưa đủ một hộp thì vẫn phải lấy thêm một hộp nữa.\n\n' +
        'Hãy in ra số hộp cần dùng và số chỗ TRỐNG còn lại trong hộp cuối, cách nhau một dấu cách.\n\n' +
        'Ví dụ: 23 cái bánh, hộp chứa 6 cái → cần 4 hộp, hộp cuối còn trống 1 chỗ, nên in ra `4 1`.',
      inputDesc: 'Một dòng chứa hai số nguyên không âm `n` và `k`, `k` khác 0.',
      outputDesc: 'Hai số trên một dòng: số hộp cần dùng trước, số chỗ trống sau.',
      solve: (input) => {
        const [n, k] = ints(input);
        const soHop = Math.floor((n + k - 1) / k);
        return `${soHop} ${soHop * k - n}`;
      },
      inputs: ['23 6', '12 4', '0 5', '7 7', '100 9', '5 11'],
    },
    {
      key: '77',
      title: 'Chu vi và diện tích',
      difficulty: 'MEDIUM',
      story:
        'Một hình chữ nhật có chiều dài `a` và chiều rộng `b`. Hãy in ra chu vi và diện tích của nó trên cùng một dòng, cách nhau một dấu cách.',
      inputDesc: 'Một dòng chứa hai số nguyên dương `a` và `b`.',
      outputDesc: 'Hai số trên một dòng: chu vi trước, diện tích sau.',
      solve: (input) => {
        const [a, b] = ints(input);
        return `${(a + b) * 2} ${a * b}`;
      },
      inputs: ['5 3', '10 10', '1 1', '100 50', '2 7', '999 1'],
    },
    {
      key: '78',
      title: 'Điểm sau khi nhân hệ số',
      difficulty: 'HARD',
      story:
        'Điểm tổng kết được tính như sau: điểm miệng `a` tính hệ số 1, điểm 15 phút `b` tính hệ số 2, điểm thi `c` tính hệ số 3. ' +
        'Hãy in ra tổng điểm đã nhân hệ số, rồi chia cho tổng các hệ số lấy phần nguyên.',
      inputDesc: 'Một dòng chứa ba số nguyên không âm `a`, `b`, `c` (mỗi số từ 0 đến 10).',
      outputDesc: 'Điểm tổng kết, lấy phần nguyên.',
      solve: (input) => {
        const [a, b, c] = ints(input);
        return String(Math.floor((a * 1 + b * 2 + c * 3) / 6));
      },
      inputs: ['8 9 10', '10 10 10', '0 0 0', '5 5 5', '10 0 0', '7 8 6'],
    },
    {
      key: '79',
      title: 'Đổi số giây ra giờ phút giây',
      difficulty: 'HARD',
      story:
        'Máy tính cho em một số giây. Hãy in ra số giờ, số phút và số giây tương ứng trên cùng một dòng, cách nhau dấu cách.\n\nVí dụ: `3661` giây là 1 giờ 1 phút 1 giây, nên in ra `1 1 1`.',
      inputDesc: 'Một số nguyên không âm là số giây.',
      outputDesc: 'Ba số trên một dòng: giờ, phút, giây.',
      solve: (input) => {
        const s = one(input);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h} ${m} ${s % 60}`;
      },
      inputs: ['3661', '0', '59', '3600', '86399', '7325'],
    },
    {
      key: '80',
      title: 'Hóa đơn cuối khóa',
      difficulty: 'HARD',
      story:
        'Bài cuối khóa! Em mua `n` món, mỗi món giá `g` đồng. Cửa hàng giảm giá `d` đồng trên tổng hóa đơn. ' +
        'Em đưa `t` đồng. Hãy in ra hai số trên một dòng: số tiền phải trả sau khi giảm, và số tiền được trả lại.',
      inputDesc: 'Một dòng chứa bốn số nguyên không âm `n`, `g`, `d`, `t`. Đề bài đảm bảo `d` không lớn hơn tổng tiền và `t` luôn đủ trả.',
      outputDesc: 'Hai số trên một dòng: tiền phải trả trước, tiền thừa sau.',
      solve: (input) => {
        const [n, g, d, t] = ints(input);
        const phaiTra = n * g - d;
        return `${phaiTra} ${t - phaiTra}`;
      },
      inputs: [
        '3 12000 6000 50000',
        '1 10000 0 10000',
        '0 5000 0 100',
        '4 5000 2000 20000',
        '2 300 100 1000',
        '10 1000 5000 10000',
      ],
    },
  ],
};

export default course;

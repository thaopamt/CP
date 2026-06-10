import { CourseSpec } from '../types';

/**
 * Course 09 — Chuỗi ký tự.
 * Mục tiêu: học sinh tiểu học làm quen với các thao tác cơ bản trên chuỗi:
 * độ dài (len), viết hoa/thường (upper/lower), ký tự đầu/cuối, đảo chuỗi,
 * đếm ký tự, lặp chuỗi, ghép chuỗi, thay thế, đếm nguyên âm, đếm từ, kiểm tra
 * chuỗi đối xứng (palindrome), lấy ký tự tại vị trí...
 *
 * QUY TẮC: input và output chỉ dùng ký tự ASCII (chữ Latin không dấu, chữ số,
 * dấu cách) để upper/lower/reverse rõ ràng. Không dùng dấu tiếng Việt trong
 * input/output. Không bao giờ viết tay đáp án — luôn tính trong solve().
 */

/** Lấy dòng đầu tiên của stdin, không cắt khoảng trắng bên trong. */
const firstLine = (input: string): string => input.split('\n')[0] ?? '';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

const course: CourseSpec = {
  code: 'PYTHON-BASIC-09',
  title: 'Chuỗi ký tự',
  description:
    'Khóa học về chuỗi ký tự: học cách đo độ dài, viết hoa, viết thường, đảo ngược, ' +
    'đếm ký tự và làm nhiều phép biến đổi thú vị với chữ trong Python!',
  tags: ['python', 'co-ban', 'chuoi', 'string'],
  problems: [
    {
      key: '01',
      title: 'Đếm độ dài chuỗi',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi ký tự. Hãy đếm xem chuỗi đó có bao nhiêu ký tự (kể cả dấu cách).',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra một số là số ký tự của chuỗi.',
      note: 'Dùng `len(s)` để lấy độ dài chuỗi.',
      solve: (input) => String(firstLine(input).length),
      inputs: ['hello', 'a', 'Python is fun', 'abc def', 'X', '12345'],
    },
    {
      key: '02',
      title: 'Viết hoa tất cả',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi. Hãy in ra chuỗi đó với TẤT CẢ các chữ cái được viết hoa.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra chuỗi đã viết hoa toàn bộ.',
      note: 'Dùng `s.upper()`.',
      solve: (input) => firstLine(input).toUpperCase(),
      inputs: ['hello', 'Python', 'abc def', 'a', 'MixEd CaSe', 'good job'],
    },
    {
      key: '03',
      title: 'Viết thường tất cả',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi. Hãy in ra chuỗi đó với TẤT CẢ các chữ cái được viết thường.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra chuỗi đã viết thường toàn bộ.',
      note: 'Dùng `s.lower()`.',
      solve: (input) => firstLine(input).toLowerCase(),
      inputs: ['HELLO', 'Python', 'ABC DEF', 'A', 'MixEd CaSe', 'GOOD JOB'],
    },
    {
      key: '04',
      title: 'Ký tự đầu tiên',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi. Hãy in ra ký tự ĐẦU TIÊN của chuỗi đó.',
      inputDesc: 'Một dòng chứa chuỗi (ít nhất 1 ký tự).',
      outputDesc: 'In ra ký tự đầu tiên.',
      note: 'Ký tự đầu là `s[0]`.',
      solve: (input) => firstLine(input)[0] ?? '',
      inputs: ['hello', 'Python', 'apple', 'X', 'banana', 'zoo'],
    },
    {
      key: '05',
      title: 'Ký tự cuối cùng',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi. Hãy in ra ký tự CUỐI CÙNG của chuỗi đó.',
      inputDesc: 'Một dòng chứa chuỗi (ít nhất 1 ký tự).',
      outputDesc: 'In ra ký tự cuối cùng.',
      note: 'Ký tự cuối là `s[-1]`.',
      solve: (input) => {
        const s = firstLine(input);
        return s[s.length - 1] ?? '';
      },
      inputs: ['hello', 'Python', 'apple', 'X', 'banana', 'zoo'],
    },
    {
      key: '06',
      title: 'Đảo ngược chuỗi',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi. Hãy in ra chuỗi đó nhưng theo thứ tự ĐẢO NGƯỢC (đọc từ phải sang trái).',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra chuỗi đã đảo ngược.',
      note: 'Dùng lát cắt `s[::-1]`.',
      solve: (input) => firstLine(input).split('').reverse().join(''),
      inputs: ['hello', 'abc', 'a', 'Python', 'racecar', '12345'],
    },
    {
      key: '07',
      title: 'Đếm chữ a',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi. Hãy đếm xem trong chuỗi có bao nhiêu chữ `a` thường.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra một số là số lần chữ `a` xuất hiện.',
      note: 'Dùng `s.count("a")`.',
      solve: (input) => {
        const s = firstLine(input);
        let c = 0;
        for (const ch of s) if (ch === 'a') c++;
        return String(c);
      },
      inputs: ['banana', 'apple', 'hello', 'aaaa', 'xyz', 'a man a plan'],
    },
    {
      key: '08',
      title: 'Hai từ có giống nhau không',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai từ trên hai dòng. Nếu hai từ GIỐNG HỆT nhau thì in `YES`, ngược lại in `NO`.',
      inputDesc: 'Dòng 1: từ thứ nhất. Dòng 2: từ thứ hai.',
      outputDesc: 'In ra `YES` nếu hai từ giống nhau, ngược lại in `NO`.',
      note: 'So sánh bằng `a == b`. Chú ý phân biệt chữ hoa/thường.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const a = lines[0] ?? '';
        const b = lines[1] ?? '';
        return a === b ? 'YES' : 'NO';
      },
      inputs: ['cat\ncat', 'cat\ndog', 'Hello\nhello', 'abc\nabc', 'a\nb', 'python\npython'],
    },
    {
      key: '09',
      title: 'Lặp lại chuỗi k lần',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi ở dòng 1 và một số `k` ở dòng 2. Hãy in ra chuỗi đó được nối lại `k` lần liền nhau.\n\nVí dụ chuỗi `ab` và `k = 3` thì in ra `ababab`.',
      inputDesc: 'Dòng 1: chuỗi. Dòng 2: số nguyên k (k >= 0).',
      outputDesc: 'In ra chuỗi được lặp lại k lần.',
      note: 'Dùng `s * k` trong Python.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const s = lines[0] ?? '';
        const k = parseInt((lines[1] ?? '0').trim(), 10);
        return s.repeat(k);
      },
      inputs: ['ab\n3', 'x\n5', 'hi\n1', 'abc\n0', 'go\n4', 'z\n10'],
    },
    {
      key: '10',
      title: 'Ghép hai chuỗi',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai chuỗi trên hai dòng. Hãy in ra chuỗi mới là hai chuỗi đó nối liền nhau (không có dấu cách ở giữa).',
      inputDesc: 'Dòng 1: chuỗi thứ nhất. Dòng 2: chuỗi thứ hai.',
      outputDesc: 'In ra hai chuỗi ghép liền nhau.',
      note: 'Dùng phép cộng chuỗi `a + b`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        return (lines[0] ?? '') + (lines[1] ?? '');
      },
      inputs: ['hello\nworld', 'Py\nthon', 'a\nb', 'foo\nbar', 'good\njob', 'x\nyz'],
    },
    {
      key: '11',
      title: 'Thay dấu cách bằng gạch nối',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một câu. Hãy in ra câu đó nhưng thay mỗi dấu cách bằng dấu gạch nối `-`.\n\nVí dụ `hello big world` → `hello-big-world`.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra chuỗi đã thay dấu cách bằng `-`.',
      note: 'Dùng `s.replace(" ", "-")`.',
      solve: (input) => firstLine(input).split(' ').join('-'),
      inputs: ['hello big world', 'a b c', 'python', 'one two', 'i love coding', 'x  y'],
    },
    {
      key: '12',
      title: 'Đếm nguyên âm',
      difficulty: 'HARD',
      story: 'Máy tính cho em một chuỗi. Hãy đếm số NGUYÊN ÂM trong chuỗi. Nguyên âm gồm các chữ `a`, `e`, `i`, `o`, `u` (cả chữ hoa lẫn chữ thường).',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra một số là số nguyên âm đếm được.',
      note: 'Duyệt từng ký tự, hạ về chữ thường rồi kiểm tra có thuộc {a,e,i,o,u} không.',
      solve: (input) => {
        const s = firstLine(input);
        let c = 0;
        for (const ch of s) if (VOWELS.has(ch.toLowerCase())) c++;
        return String(c);
      },
      inputs: ['hello', 'AEIOU', 'python', 'banana', 'xyz', 'I love Python'],
    },
    {
      key: '13',
      title: 'Viết hoa chữ cái đầu',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một từ viết thường. Hãy in ra từ đó với chữ cái ĐẦU TIÊN được viết hoa, các chữ còn lại giữ nguyên.\n\nVí dụ `hello` → `Hello`.',
      inputDesc: 'Một dòng chứa một từ (ít nhất 1 ký tự).',
      outputDesc: 'In ra từ với chữ cái đầu viết hoa.',
      note: 'Có thể dùng `s.capitalize()` hoặc `s[0].upper() + s[1:]`.',
      solve: (input) => {
        const s = firstLine(input);
        if (s.length === 0) return '';
        return s[0].toUpperCase() + s.slice(1);
      },
      inputs: ['hello', 'python', 'a', 'banana', 'world', 'kid'],
    },
    {
      key: '14',
      title: 'Đếm số từ',
      difficulty: 'HARD',
      story: 'Máy tính cho em một câu, các từ cách nhau đúng một dấu cách. Hãy đếm xem câu đó có bao nhiêu TỪ.',
      inputDesc: 'Một dòng chứa câu, các từ cách nhau một dấu cách.',
      outputDesc: 'In ra một số là số từ trong câu.',
      note: 'Dùng `len(s.split())`.',
      solve: (input) => {
        const s = firstLine(input).trim();
        if (s === '') return '0';
        return String(s.split(/\s+/).length);
      },
      inputs: ['hello world', 'a b c d', 'python', 'i love coding very much', 'one', 'go go go'],
    },
    {
      key: '15',
      title: 'Kiểm tra chuỗi đối xứng',
      difficulty: 'HARD',
      story: 'Một chuỗi gọi là ĐỐI XỨNG (palindrome) nếu đọc xuôi và đọc ngược đều giống nhau. Máy tính cho em một chuỗi, hãy in `YES` nếu nó đối xứng, ngược lại in `NO`.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra `YES` nếu chuỗi đối xứng, ngược lại in `NO`.',
      note: 'So sánh `s` với `s[::-1]`.',
      solve: (input) => {
        const s = firstLine(input);
        const rev = s.split('').reverse().join('');
        return s === rev ? 'YES' : 'NO';
      },
      inputs: ['racecar', 'hello', 'a', 'abba', 'abc', 'level'],
    },
    {
      key: '16',
      title: 'Lấy ký tự tại vị trí k',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi ở dòng 1 và một số `k` ở dòng 2. Hãy in ra ký tự tại vị trí thứ `k` (đếm từ 0).\n\nVí dụ chuỗi `hello` với `k = 1` thì in ra `e`.',
      inputDesc: 'Dòng 1: chuỗi. Dòng 2: số nguyên k (0 <= k < độ dài chuỗi).',
      outputDesc: 'In ra ký tự tại vị trí k.',
      note: 'Truy cập bằng `s[k]`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const s = lines[0] ?? '';
        const k = parseInt((lines[1] ?? '0').trim(), 10);
        return s[k] ?? '';
      },
      inputs: ['hello\n1', 'python\n0', 'world\n4', 'abc\n2', 'banana\n3', 'kid\n2'],
    },
    {
      key: '17',
      title: 'Đếm một ký tự bất kỳ',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi ở dòng 1 và một ký tự ở dòng 2. Hãy đếm xem ký tự đó xuất hiện bao nhiêu lần trong chuỗi.',
      inputDesc: 'Dòng 1: chuỗi. Dòng 2: một ký tự cần đếm.',
      outputDesc: 'In ra một số là số lần ký tự xuất hiện.',
      note: 'Dùng `s.count(c)`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const s = lines[0] ?? '';
        const c = lines[1] ?? '';
        let cnt = 0;
        for (const ch of s) if (ch === c) cnt++;
        return String(cnt);
      },
      inputs: ['banana\na', 'hello\nl', 'mississippi\ns', 'abc\nz', 'aaaa\na', 'python\np'],
    },
    {
      key: '18',
      title: 'Bỏ hết dấu cách',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một câu có nhiều dấu cách. Hãy in ra câu đó sau khi đã XÓA HẾT các dấu cách.\n\nVí dụ `a b c` → `abc`.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra chuỗi không còn dấu cách.',
      note: 'Dùng `s.replace(" ", "")`.',
      solve: (input) => firstLine(input).split(' ').join(''),
      inputs: ['a b c', 'hello world', 'python', 'i love you', 'x  y  z', 'one two three'],
    },
    {
      key: '19',
      title: 'Ghép hai từ có dấu cách',
      difficulty: 'EASY',
      story: 'Máy tính cho em hai từ trên hai dòng. Hãy in ra hai từ đó ghép lại, cách nhau đúng MỘT dấu cách.',
      inputDesc: 'Dòng 1: từ thứ nhất. Dòng 2: từ thứ hai.',
      outputDesc: 'In ra hai từ ghép, cách nhau một dấu cách.',
      note: 'Dùng `a + " " + b`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        return (lines[0] ?? '') + ' ' + (lines[1] ?? '');
      },
      inputs: ['hello\nworld', 'good\nmorning', 'a\nb', 'Py\nthon', 'happy\nday', 'x\nyz'],
    },
    {
      key: '20',
      title: 'Đảo hoa thường',
      difficulty: 'HARD',
      story: 'Máy tính cho em một chuỗi. Hãy in ra chuỗi với chữ hoa đổi thành chữ thường và chữ thường đổi thành chữ hoa.\n\nVí dụ `Hello` → `hELLO`.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra chuỗi đã đảo hoa/thường.',
      note: 'Có thể dùng `s.swapcase()`, hoặc duyệt từng ký tự.',
      solve: (input) => {
        const s = firstLine(input);
        let out = '';
        for (const ch of s) {
          if (ch >= 'a' && ch <= 'z') out += ch.toUpperCase();
          else if (ch >= 'A' && ch <= 'Z') out += ch.toLowerCase();
          else out += ch;
        }
        return out;
      },
      inputs: ['Hello', 'PyThOn', 'abc', 'ABC', 'Mix 123', 'a'],
    },
    {
      key: '21',
      title: 'Độ dài bỏ dấu cách',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một câu. Hãy đếm xem có bao nhiêu ký tự KHÔNG PHẢI dấu cách.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra một số là số ký tự không phải dấu cách.',
      note: 'Có thể dùng `len(s.replace(" ", ""))`.',
      solve: (input) => {
        const s = firstLine(input);
        let c = 0;
        for (const ch of s) if (ch !== ' ') c++;
        return String(c);
      },
      inputs: ['a b c', 'hello world', 'python', 'i am here', 'x  y', 'one'],
    },
    {
      key: '22',
      title: 'Lấy ba ký tự đầu',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi. Hãy in ra 3 ký tự ĐẦU TIÊN của chuỗi. Nếu chuỗi ngắn hơn 3 ký tự thì in ra cả chuỗi.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra tối đa 3 ký tự đầu của chuỗi.',
      note: 'Dùng lát cắt `s[:3]`.',
      solve: (input) => firstLine(input).slice(0, 3),
      inputs: ['hello', 'ab', 'python', 'x', 'banana', 'good'],
    },
    {
      key: '23',
      title: 'Lấy ba ký tự cuối',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi. Hãy in ra 3 ký tự CUỐI CÙNG của chuỗi. Nếu chuỗi ngắn hơn 3 ký tự thì in ra cả chuỗi.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra tối đa 3 ký tự cuối của chuỗi.',
      note: 'Dùng lát cắt `s[-3:]`.',
      solve: (input) => firstLine(input).slice(-3),
      inputs: ['hello', 'ab', 'python', 'x', 'banana', 'good'],
    },
    {
      key: '24',
      title: 'Đếm phụ âm',
      difficulty: 'HARD',
      story: 'Máy tính cho em một chuỗi chỉ gồm chữ cái thường và dấu cách. Hãy đếm số PHỤ ÂM (các chữ cái không phải nguyên âm a, e, i, o, u; dấu cách không tính).',
      inputDesc: 'Một dòng chứa chuỗi chữ thường và dấu cách.',
      outputDesc: 'In ra một số là số phụ âm.',
      note: 'Duyệt từng ký tự: là chữ cái và không phải nguyên âm thì đếm.',
      solve: (input) => {
        const s = firstLine(input);
        let c = 0;
        for (const ch of s) {
          if (ch >= 'a' && ch <= 'z' && !VOWELS.has(ch)) c++;
        }
        return String(c);
      },
      inputs: ['hello', 'python', 'aeiou', 'banana', 'i love you', 'xyz'],
    },
    {
      key: '25',
      title: 'Số lần xuất hiện một từ con',
      difficulty: 'HARD',
      story: 'Máy tính cho em một chuỗi ở dòng 1 và một từ con ở dòng 2. Hãy đếm số lần từ con đó xuất hiện trong chuỗi (các lần không chồng lấn).\n\nVí dụ chuỗi `ababab` và từ con `ab` thì xuất hiện 3 lần.',
      inputDesc: 'Dòng 1: chuỗi. Dòng 2: từ con cần đếm (khác rỗng).',
      outputDesc: 'In ra một số là số lần từ con xuất hiện.',
      note: 'Dùng `s.count(sub)`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const s = lines[0] ?? '';
        const sub = lines[1] ?? '';
        if (sub.length === 0) return '0';
        let count = 0;
        let pos = 0;
        while (true) {
          const idx = s.indexOf(sub, pos);
          if (idx === -1) break;
          count++;
          pos = idx + sub.length;
        }
        return String(count);
      },
      inputs: ['ababab\nab', 'mississippi\nss', 'hello\nl', 'aaaa\naa', 'abc\nx', 'banana\nana'],
    },
    {
      key: '26',
      title: 'Chuỗi rỗng hay không',
      difficulty: 'EASY',
      story: 'Máy tính cho em một chuỗi (có thể rỗng). Hãy in `YES` nếu chuỗi RỖNG (không có ký tự nào), ngược lại in `NO`.',
      inputDesc: 'Một dòng chứa chuỗi (có thể rỗng).',
      outputDesc: 'In ra `YES` nếu chuỗi rỗng, ngược lại in `NO`.',
      note: 'Kiểm tra `len(s) == 0`.',
      solve: (input) => (firstLine(input).length === 0 ? 'YES' : 'NO'),
      inputs: ['', 'a', 'hello', 'x', 'python', 'abc'],
    },
    {
      key: '27',
      title: 'Thay một ký tự bằng ký tự khác',
      difficulty: 'HARD',
      story: 'Máy tính cho em một chuỗi ở dòng 1, ký tự cũ ở dòng 2 và ký tự mới ở dòng 3. Hãy thay TẤT CẢ ký tự cũ trong chuỗi bằng ký tự mới rồi in ra.',
      inputDesc: 'Dòng 1: chuỗi. Dòng 2: ký tự cũ. Dòng 3: ký tự mới.',
      outputDesc: 'In ra chuỗi sau khi thay thế.',
      note: 'Dùng `s.replace(old, new)`.',
      solve: (input) => {
        const lines = input.replace(/\n+$/, '').split('\n');
        const s = lines[0] ?? '';
        const oldCh = lines[1] ?? '';
        const newCh = lines[2] ?? '';
        if (oldCh.length === 0) return s;
        return s.split(oldCh).join(newCh);
      },
      inputs: ['banana\na\no', 'hello\nl\nL', 'aaa\na\nb', 'python\nz\nx', 'mississippi\ns\nS', 'abc\nb\nB'],
    },
    {
      key: '28',
      title: 'Đầu và cuối giống nhau',
      difficulty: 'MEDIUM',
      story: 'Máy tính cho em một chuỗi. Hãy in `YES` nếu ký tự đầu và ký tự cuối GIỐNG nhau, ngược lại in `NO`. Chuỗi luôn có ít nhất 1 ký tự.',
      inputDesc: 'Một dòng chứa chuỗi (ít nhất 1 ký tự).',
      outputDesc: 'In ra `YES` nếu ký tự đầu và cuối giống nhau, ngược lại in `NO`.',
      note: 'So sánh `s[0]` với `s[-1]`.',
      solve: (input) => {
        const s = firstLine(input);
        return s[0] === s[s.length - 1] ? 'YES' : 'NO';
      },
      inputs: ['level', 'hello', 'a', 'abba', 'python', 'xyx'],
    },
    {
      key: '29',
      title: 'Viết hoa chữ đầu mỗi từ',
      difficulty: 'HARD',
      story: 'Máy tính cho em một câu gồm các từ viết thường cách nhau một dấu cách. Hãy in ra câu đó với chữ cái đầu của MỖI TỪ được viết hoa.\n\nVí dụ `hello big world` → `Hello Big World`.',
      inputDesc: 'Một dòng chứa câu, các từ cách nhau một dấu cách.',
      outputDesc: 'In ra câu với chữ đầu mỗi từ viết hoa.',
      note: 'Có thể dùng `s.title()`, hoặc tách `split()`, hoa từng từ rồi `join`.',
      solve: (input) => {
        const s = firstLine(input);
        return s
          .split(' ')
          .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
          .join(' ');
      },
      inputs: ['hello big world', 'i love python', 'a b c', 'one', 'good morning kid', 'x y'],
    },
    {
      key: '30',
      title: 'Chuỗi đối xứng bỏ qua hoa thường',
      difficulty: 'HARD',
      story: 'Một chuỗi gọi là ĐỐI XỨNG nếu đọc xuôi và đọc ngược giống nhau, KHÔNG phân biệt chữ hoa và chữ thường. Máy tính cho em một chuỗi, hãy in `YES` nếu nó đối xứng theo cách này, ngược lại in `NO`.\n\nVí dụ `Level` là đối xứng vì khi hạ về chữ thường thành `level`.',
      inputDesc: 'Một dòng chứa chuỗi ký tự.',
      outputDesc: 'In ra `YES` nếu đối xứng (bỏ qua hoa thường), ngược lại in `NO`.',
      note: 'Hạ chuỗi về chữ thường bằng `s.lower()` rồi so với bản đảo ngược.',
      solve: (input) => {
        const s = firstLine(input).toLowerCase();
        const rev = s.split('').reverse().join('');
        return s === rev ? 'YES' : 'NO';
      },
      inputs: ['Level', 'Hello', 'Racecar', 'Abba', 'Python', 'A'],
    },
  ],
};

export default course;

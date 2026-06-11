import { CourseSpec } from '../types';

/**
 * Chương 1 — Làm quen với DP 1 chiều.
 * Mục tiêu: học sinh nắm tư duy "trạng thái + công thức truy hồi" qua các bài
 * cổ điển: Fibonacci, leo cầu thang, chi phí nhỏ nhất, đếm số cách. Tất cả đều
 * là DP một chiều (mảng dp[i]).
 *
 * NOTE cho người viết: không bao giờ tự gõ đáp án — luôn trả về từ solve(input).
 * 3 input đầu là test mẫu hiển thị. Mọi kết quả nằm trong số nguyên an toàn của JS.
 */

// ---- helper dùng chung ----
const toInt = (s: string): number => parseInt(s.trim(), 10);
const readInts = (line: string): number[] =>
  line
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));
const lines = (input: string): string[] => input.replace(/\r/g, '').split('\n');

const course: CourseSpec = {
  code: 'DP-BASIC-01',
  title: 'Chương 1: Làm quen DP 1 chiều',
  description:
    'Bước đầu tiên với quy hoạch động: xây dựng công thức truy hồi một chiều ' +
    'qua các bài kinh điển như Fibonacci, leo cầu thang, chi phí nhỏ nhất và đếm số cách.',
  tags: ['quy-hoach-dong', 'co-ban', 'dp-1-chieu', 'fibonacci', 'leo-cau-thang'],
  problems: [
    {
      key: '01',
      title: 'Số Fibonacci thứ n',
      difficulty: 'EASY',
      story:
        'Dãy Fibonacci được định nghĩa: $F_0 = 0$, $F_1 = 1$, và $F_n = F_{n-1} + F_{n-2}$ với $n \\ge 2$.\n\n' +
        'Cho số $n$, hãy tính $F_n$. Đây là bài tập kinh điển mở đầu cho quy hoạch động: thay vì gọi đệ quy chồng chất, ta lưu lại kết quả các bước trước.',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 40)$.',
      outputDesc: 'In ra giá trị $F_n$.',
      note: 'Dùng một mảng dp[] hoặc chỉ hai biến để lưu hai số liền trước.',
      solve: (input) => {
        const n = toInt(input);
        let a = 0,
          b = 1;
        if (n === 0) return '0';
        for (let i = 2; i <= n; i++) {
          const c = a + b;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: ['0', '1', '10', '2', '20', '40', '7'],
    },
    {
      key: '02',
      title: 'Leo cầu thang',
      difficulty: 'EASY',
      story:
        'Một cầu thang có $n$ bậc. Mỗi bước em có thể bước lên $1$ bậc hoặc $2$ bậc.\n\n' +
        'Hỏi có bao nhiêu cách khác nhau để leo từ mặt đất lên đúng bậc thứ $n$?',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 45)$.',
      outputDesc: 'In ra số cách leo hết cầu thang.',
      note: 'Gọi dp[i] là số cách lên bậc i thì dp[i] = dp[i-1] + dp[i-2].',
      solve: (input) => {
        const n = toInt(input);
        let prev = 1,
          cur = 1; // dp[0]=1, dp[1]=1
        for (let i = 2; i <= n; i++) {
          const next = prev + cur;
          prev = cur;
          cur = next;
        }
        return String(cur);
      },
      inputs: ['1', '2', '3', '5', '10', '20', '45'],
    },
    {
      key: '03',
      title: 'Leo cầu thang ba bước',
      difficulty: 'EASY',
      story:
        'Vẫn là cầu thang $n$ bậc, nhưng lần này mỗi bước em có thể bước lên $1$, $2$ hoặc $3$ bậc.\n\n' +
        'Hỏi có bao nhiêu cách khác nhau để leo lên đúng bậc thứ $n$?',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 30)$.',
      outputDesc: 'In ra số cách leo hết cầu thang.',
      note: 'dp[i] = dp[i-1] + dp[i-2] + dp[i-3], với quy ước dp[0] = 1.',
      solve: (input) => {
        const n = toInt(input);
        const dp = [1, 1, 2];
        if (n <= 2) return String(dp[n]);
        for (let i = 3; i <= n; i++) {
          dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
        }
        return String(dp[n]);
      },
      inputs: ['1', '2', '3', '4', '10', '20', '30'],
    },
    {
      key: '04',
      title: 'Chi phí leo cầu thang nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Một cầu thang có $n$ bậc, đứng trên bậc thứ $i$ (đánh số từ $0$) phải trả chi phí $c_i$.\n\n' +
        'Em được phép bắt đầu từ bậc $0$ hoặc bậc $1$. Mỗi lần em bước lên $1$ hoặc $2$ bậc. ' +
        'Đích đến là điểm nằm ngay phía trên bậc cuối cùng (vượt qua bậc $n-1$).\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để lên tới đích.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(2 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $c_0, c_1, \\dots, c_{n-1}$ $(0 \\le c_i \\le 1000)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'Gọi dp[i] là chi phí ít nhất để tới bậc i, đích là dp[n].',
      solve: (input) => {
        const ls = lines(input);
        const cost = readInts(ls[1]);
        const n = cost.length;
        let a = 0,
          b = 0; // dp[0], dp[1]
        for (let i = 2; i <= n; i++) {
          const cur = Math.min(b + cost[i - 1], a + cost[i - 2]);
          a = b;
          b = cur;
        }
        return String(b);
      },
      inputs: [
        '2\n10 15',
        '3\n10 15 20',
        '10\n1 100 1 1 1 100 1 1 100 1',
        '5\n0 0 0 0 0',
        '4\n5 5 5 5',
        '6\n1 2 3 4 5 6',
      ],
    },
    {
      key: '05',
      title: 'Bộ ba Fibonacci (Tribonacci)',
      difficulty: 'EASY',
      story:
        'Dãy Tribonacci được định nghĩa: $T_0 = 0$, $T_1 = 1$, $T_2 = 1$, và $T_n = T_{n-1} + T_{n-2} + T_{n-3}$ với $n \\ge 3$.\n\n' +
        'Cho số $n$, hãy tính $T_n$.',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 30)$.',
      outputDesc: 'In ra giá trị $T_n$.',
      solve: (input) => {
        const n = toInt(input);
        const t = [0, 1, 1];
        if (n <= 2) return String(t[n]);
        for (let i = 3; i <= n; i++) {
          t[i] = t[i - 1] + t[i - 2] + t[i - 3];
        }
        return String(t[n]);
      },
      inputs: ['0', '1', '2', '3', '4', '10', '25', '30'],
    },
    {
      key: '06',
      title: 'Ếch nhảy qua đá',
      difficulty: 'MEDIUM',
      story:
        'Có $n$ hòn đá xếp thành hàng, hòn đá thứ $i$ cao $h_i$. Một chú ếch đang đứng ở hòn đá $1$ và muốn tới hòn đá $n$.\n\n' +
        'Khi đang ở hòn đá $i$, ếch có thể nhảy sang hòn đá $i+1$ hoặc $i+2$. Mỗi lần nhảy từ hòn đá $i$ sang hòn đá $j$ tốn chi phí $|h_i - h_j|$.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để ếch tới được hòn đá cuối cùng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(2 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $h_1, \\dots, h_n$ $(1 \\le h_i \\le 10^4)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp[i] = min(dp[i-1] + |h[i]-h[i-1]|, dp[i-2] + |h[i]-h[i-2]|).',
      solve: (input) => {
        const ls = lines(input);
        const h = readInts(ls[1]);
        const n = h.length;
        if (n === 1) return '0';
        const dp = new Array(n).fill(0);
        dp[0] = 0;
        dp[1] = Math.abs(h[1] - h[0]);
        for (let i = 2; i < n; i++) {
          dp[i] = Math.min(
            dp[i - 1] + Math.abs(h[i] - h[i - 1]),
            dp[i - 2] + Math.abs(h[i] - h[i - 2])
          );
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '4\n10 30 40 20',
        '2\n10 10',
        '6\n30 10 60 10 60 50',
        '5\n40 10 20 70 80',
        '3\n10 20 10',
        '2\n1 10000',
        '4\n5 5 5 5',
      ],
    },
    {
      key: '07',
      title: 'Hái nấm trên cầu thang',
      difficulty: 'MEDIUM',
      story:
        'Trên một dãy gồm $n$ ô (đánh số từ $0$ đến $n-1$), ô thứ $i$ có $a_i$ cây nấm.\n\n' +
        'Em bắt đầu ở ô $0$ và muốn tới ô $n-1$. Mỗi bước em đi tới ô kế tiếp ($+1$) hoặc nhảy cách một ô ($+2$). ' +
        'Khi dừng chân ở ô nào em hái toàn bộ nấm ở ô đó (kể cả ô đầu và ô cuối).\n\n' +
        'Hãy tính số nấm nhiều nhất em có thể hái được.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $a_0, \\dots, a_{n-1}$ $(0 \\le a_i \\le 1000)$.',
      outputDesc: 'In ra số nấm nhiều nhất hái được.',
      note: 'Tính ngược: dp[i] = a[i] + max(dp[i+1], dp[i+2]).',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const n = a.length;
        const dp = new Array(n + 2).fill(0);
        for (let i = n - 1; i >= 0; i--) {
          dp[i] = a[i] + Math.max(dp[i + 1], dp[i + 2]);
        }
        return String(dp[0]);
      },
      inputs: [
        '5\n1 2 9 4 5',
        '1\n7',
        '6\n10 1 1 10 1 10',
        '3\n5 100 5',
        '4\n1 1 1 1',
        '1\n0',
        '2\n3 8',
      ],
    },
    {
      key: '08',
      title: 'Dãy nhị phân không có hai số 1 liền nhau',
      difficulty: 'EASY',
      story:
        'Đếm số dãy nhị phân (chỉ gồm các chữ số $0$ và $1$) có độ dài $n$ sao cho không có hai số $1$ nào đứng cạnh nhau.\n\n' +
        'Ví dụ với $n = 3$: các dãy hợp lệ là $000, 001, 010, 100, 101$ — tổng cộng $5$ dãy.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 40)$.',
      outputDesc: 'In ra số dãy hợp lệ.',
      note: 'Tách trạng thái: số dãy kết thúc bằng 0 và số dãy kết thúc bằng 1.',
      solve: (input) => {
        const n = toInt(input);
        let end0 = 1,
          end1 = 1; // n = 1
        for (let i = 2; i <= n; i++) {
          const n0 = end0 + end1; // thêm 0 vào cuối bất kỳ dãy nào
          const n1 = end0; // thêm 1 chỉ sau một dãy kết thúc bằng 0
          end0 = n0;
          end1 = n1;
        }
        return String(end0 + end1);
      },
      inputs: ['1', '2', '3', '5', '10', '20', '40'],
    },
    {
      key: '09',
      title: 'Ếch nhảy xa',
      difficulty: 'MEDIUM',
      story:
        'Vẫn là $n$ hòn đá cao $h_1, \\dots, h_n$ và chú ếch muốn đi từ hòn đá $1$ tới hòn đá $n$.\n\n' +
        'Lần này, khi đang ở hòn đá $i$, ếch có thể nhảy tới một trong các hòn đá $i+1, i+2, \\dots, i+k$. ' +
        'Chi phí nhảy từ hòn đá $i$ sang hòn đá $j$ vẫn là $|h_i - h_j|$.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để ếch tới hòn đá cuối cùng.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $k$ $(2 \\le n \\le 1000,\\ 1 \\le k \\le 100)$. Dòng thứ hai chứa $n$ số nguyên $h_1, \\dots, h_n$ $(1 \\le h_i \\le 10^4)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp[i] = min với mọi j từ 1 đến k của dp[i-j] + |h[i]-h[i-j]|.',
      solve: (input) => {
        const ls = lines(input);
        const [n, k] = readInts(ls[0]);
        const h = readInts(ls[1]);
        const dp = new Array(n).fill(Infinity);
        dp[0] = 0;
        for (let i = 1; i < n; i++) {
          for (let j = 1; j <= k && i - j >= 0; j++) {
            dp[i] = Math.min(dp[i], dp[i - j] + Math.abs(h[i] - h[i - j]));
          }
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '5 3\n10 30 40 50 20',
        '3 1\n10 20 10',
        '2 100\n10 10',
        '6 2\n30 10 60 10 60 50',
        '7 4\n40 10 20 70 80 10 20',
        '2 1\n1 10000',
        '5 1\n10 20 30 40 50',
      ],
    },
    {
      key: '10',
      title: 'Leo cầu thang có bậc hỏng',
      difficulty: 'MEDIUM',
      story:
        'Cầu thang có $n$ bậc, đánh số từ $1$ đến $n$; em xuất phát từ mặt đất (bậc $0$). Mỗi bước em bước lên $1$ hoặc $2$ bậc.\n\n' +
        'Tiếc là một số bậc đã bị hỏng và em không được phép đặt chân lên đó.\n\n' +
        'Hỏi có bao nhiêu cách leo từ mặt đất lên đúng bậc thứ $n$ mà không bao giờ đặt chân vào bậc hỏng?',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 40)$. Dòng thứ hai chứa $n$ số, số thứ $i$ bằng $1$ nếu bậc $i$ còn tốt và bằng $0$ nếu bậc $i$ bị hỏng. (Mặt đất luôn an toàn.)',
      outputDesc: 'In ra số cách leo hợp lệ (có thể bằng $0$).',
      note: 'dp[i] = 0 nếu bậc i hỏng, ngược lại dp[i] = dp[i-1] + dp[i-2], với dp[0] = 1.',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0]);
        const ok = readInts(ls[1]); // ok[i-1] cho bậc i
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1; // mặt đất
        for (let i = 1; i <= n; i++) {
          if (ok[i - 1] === 0) {
            dp[i] = 0;
          } else {
            dp[i] = dp[i - 1] + (i >= 2 ? dp[i - 2] : 0);
          }
        }
        return String(dp[n]);
      },
      inputs: [
        '4\n1 1 0 1',
        '3\n1 1 1',
        '5\n1 0 1 0 1',
        '2\n0 1',
        '6\n1 1 1 1 1 1',
        '1\n0',
        '1\n1',
      ],
    },
    {
      key: '11',
      title: 'Lát nền 2×n bằng gạch domino',
      difficulty: 'EASY',
      story:
        'Em có một nền nhà hình chữ nhật kích thước $2 \\times n$ và những viên gạch domino kích thước $1 \\times 2$.\n\n' +
        'Mỗi viên gạch có thể đặt nằm ngang hoặc dựng đứng. Hỏi có bao nhiêu cách lát kín toàn bộ nền mà các viên gạch không chồng lên nhau?',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 70)$.',
      outputDesc: 'In ra số cách lát nền.',
      note: 'Đặt viên cuối dựng đứng (còn 2×(n-1)) hoặc hai viên nằm ngang (còn 2×(n-2)): dp[n] = dp[n-1] + dp[n-2].',
      solve: (input) => {
        const n = toInt(input);
        let a = 1,
          b = 1; // dp[0]=1, dp[1]=1
        if (n === 0) return '1';
        for (let i = 2; i <= n; i++) {
          const c = a + b;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: ['1', '2', '3', '0', '5', '10', '70'],
    },
    {
      key: '12',
      title: 'Leo cầu thang bốn bước (Tetranacci)',
      difficulty: 'EASY',
      story:
        'Cầu thang có $n$ bậc. Mỗi bước em có thể bước lên $1$, $2$, $3$ hoặc $4$ bậc.\n\n' +
        'Hỏi có bao nhiêu cách khác nhau để leo từ mặt đất lên đúng bậc thứ $n$?',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 30)$.',
      outputDesc: 'In ra số cách leo hết cầu thang.',
      note: 'dp[i] = dp[i-1] + dp[i-2] + dp[i-3] + dp[i-4], với dp[0] = 1.',
      solve: (input) => {
        const n = toInt(input);
        const dp = [1, 1, 2, 4];
        if (n <= 3) return String(dp[n]);
        for (let i = 4; i <= n; i++) {
          dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3] + dp[i - 4];
        }
        return String(dp[n]);
      },
      inputs: ['0', '1', '2', '3', '4', '10', '20', '30'],
    },
    {
      key: '13',
      title: 'Xâu nhị phân không có hai số 0 liền nhau',
      difficulty: 'EASY',
      story:
        'Đếm số xâu nhị phân (chỉ gồm các chữ số $0$ và $1$) có độ dài $n$ sao cho không có hai số $0$ nào đứng cạnh nhau.\n\n' +
        'Ví dụ với $n = 3$: các xâu hợp lệ là $010, 011, 101, 110, 111$ — tổng cộng $5$ xâu.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 40)$.',
      outputDesc: 'In ra số xâu hợp lệ.',
      note: 'Tách trạng thái theo ký tự cuối: end1 = end0 + end1; end0 = end1 (cũ).',
      solve: (input) => {
        const n = toInt(input);
        let end0 = 1,
          end1 = 1; // n = 1
        for (let i = 2; i <= n; i++) {
          const n1 = end0 + end1; // thêm 1 vào cuối bất kỳ xâu nào
          const n0 = end1; // thêm 0 chỉ sau xâu kết thúc bằng 1
          end0 = n0;
          end1 = n1;
        }
        return String(end0 + end1);
      },
      inputs: ['1', '2', '3', '4', '10', '20', '40'],
    },
    {
      key: '14',
      title: 'Xâu nhị phân không chứa ba số 1 liền nhau',
      difficulty: 'MEDIUM',
      story:
        'Đếm số xâu nhị phân có độ dài $n$ sao cho không chứa ba số $1$ liên tiếp (tức không xuất hiện đoạn con "$111$").\n\n' +
        'Ví dụ với $n = 3$: chỉ có $111$ là không hợp lệ, nên có $8 - 1 = 7$ xâu hợp lệ.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 50)$.',
      outputDesc: 'In ra số xâu hợp lệ.',
      note: 'Trạng thái = số số 1 liền kề ở cuối (0, 1 hoặc 2). Thêm 0 đưa về trạng thái 0; thêm 1 tăng đếm.',
      solve: (input) => {
        const n = toInt(input);
        // c[j] = số xâu hiện tại có đúng j số 1 ở cuối, j = 0,1,2
        let c0 = 1,
          c1 = 0,
          c2 = 0; // n = 0 (xâu rỗng)
        for (let i = 1; i <= n; i++) {
          const total = c0 + c1 + c2;
          const nc0 = total; // thêm 0
          const nc1 = c0; // thêm 1 sau trạng thái 0
          const nc2 = c1; // thêm 1 sau trạng thái 1
          c0 = nc0;
          c1 = nc1;
          c2 = nc2;
        }
        return String(c0 + c1 + c2);
      },
      inputs: ['1', '2', '3', '4', '10', '25', '50'],
    },
    {
      key: '15',
      title: 'Dãy không có hai phần tử liền kề bằng nhau',
      difficulty: 'EASY',
      story:
        'Đếm số dãy độ dài $n$ mà mỗi phần tử là một số nguyên trong khoảng từ $1$ đến $k$, ' +
        'sao cho không có hai phần tử đứng liền nhau nào bằng nhau.\n\n' +
        'Ví dụ với $n = 2$, $k = 3$: phần tử đầu có $3$ lựa chọn, phần tử sau có $2$ lựa chọn (khác phần tử trước), tổng cộng $6$ dãy.',
      inputDesc: 'Một dòng chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 40,\\ 1 \\le k \\le 1000)$.',
      outputDesc: 'In ra số dãy hợp lệ.',
      note: 'Phần tử đầu có k cách, mỗi phần tử sau có (k-1) cách: kết quả là $k \\cdot (k-1)^{n-1}$.',
      solve: (input) => {
        const [n, k] = readInts(input);
        let res = k; // phần tử đầu
        for (let i = 2; i <= n; i++) {
          res *= k - 1;
        }
        return String(res);
      },
      inputs: ['2 3', '1 5', '3 2', '1 1', '5 1', '10 2', '40 2'],
    },
    {
      key: '16',
      title: 'Viết n thành tổng có thứ tự của {1, 3, 4}',
      difficulty: 'EASY',
      story:
        'Đếm số cách viết số nguyên dương $n$ thành tổng CÓ THỨ TỰ của các số lấy trong tập $\\{1, 3, 4\\}$ ' +
        '(mỗi số có thể dùng nhiều lần, và thứ tự các số hạng được phân biệt).\n\n' +
        'Ví dụ với $n = 4$: các cách là $1+3,\\ 3+1,\\ 1+1+1+1,\\ 4$ — tổng cộng $4$ cách.',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 60)$.',
      outputDesc: 'In ra số cách viết.',
      note: 'dp[n] = dp[n-1] + dp[n-3] + dp[n-4], với dp[0] = 1 (cách rỗng).',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          if (i >= 1) dp[i] += dp[i - 1];
          if (i >= 3) dp[i] += dp[i - 3];
          if (i >= 4) dp[i] += dp[i - 4];
        }
        return String(dp[n]);
      },
      inputs: ['4', '1', '5', '0', '2', '10', '30', '60'],
    },
    {
      key: '17',
      title: 'Leo cầu thang với tập bước cho trước',
      difficulty: 'MEDIUM',
      story:
        'Cầu thang có $n$ bậc. Em được cho một tập hợp gồm $m$ độ dài bước khác nhau $s_1, s_2, \\dots, s_m$; ' +
        'mỗi bước em có thể bước lên một số bậc bằng đúng một trong các giá trị đó.\n\n' +
        'Hỏi có bao nhiêu cách khác nhau để leo từ mặt đất lên đúng bậc thứ $n$?',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $m$ $(1 \\le n \\le 40,\\ 1 \\le m \\le 10)$. ' +
        'Dòng thứ hai chứa $m$ số nguyên phân biệt $s_i$ $(1 \\le s_i \\le n)$.',
      outputDesc: 'In ra số cách leo hết cầu thang.',
      note: 'dp[i] = tổng dp[i - s] với mọi bước s ≤ i, dp[0] = 1.',
      solve: (input) => {
        const ls = lines(input);
        const [n] = readInts(ls[0]);
        const steps = readInts(ls[1]);
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          for (const s of steps) {
            if (s <= i) dp[i] += dp[i - s];
          }
        }
        return String(dp[n]);
      },
      inputs: [
        '4 2\n1 2',
        '5 3\n1 2 3',
        '3 1\n1',
        '1 1\n1',
        '40 2\n1 2',
        '10 2\n2 3',
        '7 3\n1 3 4',
      ],
    },
    {
      key: '18',
      title: 'Sơn hàng rào',
      difficulty: 'MEDIUM',
      story:
        'Một hàng rào gồm $n$ cọc thẳng hàng cần được sơn, em có $k$ màu để chọn.\n\n' +
        'Yêu cầu: không được để $3$ cọc liên tiếp nào cùng một màu. Hỏi có bao nhiêu cách sơn hàng rào?',
      inputDesc: 'Một dòng chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 30,\\ 1 \\le k \\le 100)$.',
      outputDesc: 'In ra số cách sơn.',
      note: 'same[i] (cọc i cùng màu cọc i-1) và diff[i] (khác màu): same = diff_cũ; diff = (same_cũ+diff_cũ)*(k-1).',
      solve: (input) => {
        const [n, k] = readInts(input);
        if (n === 1) return String(k);
        let same = k; // cọc 2 cùng màu cọc 1
        let diff = k * (k - 1); // cọc 2 khác màu cọc 1
        for (let i = 3; i <= n; i++) {
          const nSame = diff; // muốn cọc i cùng màu i-1 thì i-1 phải khác i-2
          const nDiff = (same + diff) * (k - 1);
          same = nSame;
          diff = nDiff;
        }
        return String(same + diff);
      },
      inputs: ['3 2', '1 5', '2 4', '1 1', '2 1', '10 2', '30 2'],
    },
    {
      key: '19',
      title: 'Sơn nhà chi phí nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Một dãy gồm $n$ ngôi nhà cần được sơn, mỗi nhà sơn bằng một trong $3$ màu: đỏ, xanh lá, xanh dương.\n\n' +
        'Sơn nhà thứ $i$ bằng màu thứ $j$ tốn một chi phí cho trước. Yêu cầu: không có hai nhà liền kề nào cùng màu.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để sơn tất cả các ngôi nhà.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Tiếp theo là $n$ dòng, dòng thứ $i$ chứa $3$ số nguyên ' +
        'là chi phí sơn nhà $i$ bằng màu $1$, $2$, $3$ $(0 \\le \\text{chi phí} \\le 1000)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp[i][j] = cost[i][j] + min(dp[i-1][j2]) với j2 ≠ j.',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0]);
        let r = 0,
          g = 0,
          b = 0; // chi phí tối thiểu khi nhà trước sơn màu r/g/b
        for (let i = 1; i <= n; i++) {
          const [c0, c1, c2] = readInts(ls[i]);
          const nr = c0 + Math.min(g, b);
          const ng = c1 + Math.min(r, b);
          const nb = c2 + Math.min(r, g);
          r = nr;
          g = ng;
          b = nb;
        }
        return String(Math.min(r, g, b));
      },
      inputs: [
        '3\n17 2 17\n16 16 5\n14 3 19',
        '1\n7 6 5',
        '2\n1 5 3\n2 9 4',
        '1\n0 0 0',
        '3\n10 10 10\n10 10 10\n10 10 10',
        '4\n1 100 100\n100 1 100\n100 100 1\n1 100 100',
      ],
    },
    {
      key: '20',
      title: 'Đưa n về 1 với ít phép biến đổi nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho số nguyên dương $n$. Mỗi bước em được thực hiện một trong các phép sau:\n\n' +
        '- Trừ đi $1$.\n' +
        '- Chia cho $2$ (nếu $n$ chia hết cho $2$).\n' +
        '- Chia cho $3$ (nếu $n$ chia hết cho $3$).\n\n' +
        'Hãy tìm số phép biến đổi ít nhất để đưa $n$ về $1$.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 10^6)$.',
      outputDesc: 'In ra số phép biến đổi ít nhất.',
      note: 'dp[i] = 1 + min(dp[i-1], dp[i/2] nếu chia hết, dp[i/3] nếu chia hết).',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(n + 1).fill(0);
        for (let i = 2; i <= n; i++) {
          let best = dp[i - 1];
          if (i % 2 === 0) best = Math.min(best, dp[i / 2]);
          if (i % 3 === 0) best = Math.min(best, dp[i / 3]);
          dp[i] = best + 1;
        }
        return String(dp[n]);
      },
      inputs: ['1', '10', '6', '2', '7', '100', '1000000'],
    },
    {
      key: '21',
      title: 'Số cách phân tích n thành tổng có thứ tự',
      difficulty: 'EASY',
      story:
        'Đếm số cách viết số nguyên dương $n$ thành tổng CÓ THỨ TỰ của một hay nhiều số nguyên dương ' +
        '(các cách khác nhau về thứ tự được tính riêng).\n\n' +
        'Ví dụ với $n = 3$: $3,\\ 1+2,\\ 2+1,\\ 1+1+1$ — tổng cộng $4$ cách.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 50)$.',
      outputDesc: 'In ra số cách phân tích.',
      note: 'Mỗi vị trí "khe" giữa các đơn vị 1 có thể cắt hoặc không: kết quả là $2^{n-1}$. dp[i] = 2·dp[i-1].',
      solve: (input) => {
        const n = toInt(input);
        let res = 1; // n = 1
        for (let i = 2; i <= n; i++) {
          res *= 2;
        }
        return String(res);
      },
      inputs: ['1', '2', '3', '4', '10', '30', '50'],
    },
    {
      key: '22',
      title: 'Tổng các số Fibonacci đầu tiên',
      difficulty: 'EASY',
      story:
        'Cho dãy Fibonacci $F_1 = 1$, $F_2 = 1$, $F_i = F_{i-1} + F_{i-2}$ với $i \\ge 3$.\n\n' +
        'Hãy tính tổng $S = F_1 + F_2 + \\dots + F_n$.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 70)$.',
      outputDesc: 'In ra tổng $S$.',
      note: 'Vừa tính dp[i] = dp[i-1] + dp[i-2] vừa cộng dồn vào tổng. (Thực ra $S = F_{n+2} - 1$.)',
      solve: (input) => {
        const n = toInt(input);
        let a = 1,
          b = 1; // F1, F2
        let sum = 0;
        for (let i = 1; i <= n; i++) {
          let f: number;
          if (i === 1) f = 1;
          else if (i === 2) f = 1;
          else {
            f = a + b;
            a = b;
            b = f;
          }
          sum += f;
        }
        return String(sum);
      },
      inputs: ['1', '2', '3', '5', '10', '40', '70'],
    },
    {
      key: '23',
      title: 'Dãy đệ quy tuyến tính tổng quát',
      difficulty: 'EASY',
      story:
        'Một dãy số được định nghĩa bởi: $a_0$, $a_1$ cho trước, và với $n \\ge 2$:\n\n' +
        '$$a_n = p \\cdot a_{n-1} + q \\cdot a_{n-2}.$$\n\n' +
        'Cho các tham số $a_0, a_1, p, q$ và số $n$, hãy tính $a_n$.',
      inputDesc:
        'Một dòng chứa năm số nguyên $a_0, a_1, p, q, n$ với $0 \\le a_0, a_1 \\le 5$, $0 \\le p, q \\le 2$, $0 \\le n \\le 30$.',
      outputDesc: 'In ra giá trị $a_n$.',
      note: 'dp[i] = p·dp[i-1] + q·dp[i-2]. Chỉ cần lưu hai số liền trước.',
      solve: (input) => {
        const [a0, a1, p, q, n] = readInts(input);
        if (n === 0) return String(a0);
        if (n === 1) return String(a1);
        let a = a0,
          b = a1;
        for (let i = 2; i <= n; i++) {
          const c = p * b + q * a;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: [
        '0 1 1 1 10',
        '2 3 1 0 5',
        '1 1 2 0 4',
        '0 0 2 2 30',
        '5 5 1 1 0',
        '5 5 1 1 1',
        '1 2 2 1 20',
      ],
    },
    {
      key: '24',
      title: 'Leo cầu thang chỉ bước 2 hoặc 3',
      difficulty: 'EASY',
      story:
        'Cầu thang có $n$ bậc. Lần này mỗi bước em chỉ được bước lên đúng $2$ hoặc $3$ bậc (không được bước $1$ bậc).\n\n' +
        'Hỏi có bao nhiêu cách khác nhau để leo từ mặt đất lên đúng bậc thứ $n$? (Có thể bằng $0$ nếu không tới được.)',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 60)$.',
      outputDesc: 'In ra số cách leo (có thể bằng $0$).',
      note: 'dp[i] = dp[i-2] + dp[i-3], với dp[0] = 1; dp[1] = 0.',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          if (i >= 2) dp[i] += dp[i - 2];
          if (i >= 3) dp[i] += dp[i - 3];
        }
        return String(dp[n]);
      },
      inputs: ['0', '1', '2', '3', '5', '10', '60'],
    },
    {
      key: '25',
      title: 'Thu hoạch trên đường thẳng',
      difficulty: 'MEDIUM',
      story:
        'Trên một dãy gồm $n$ ô (đánh số từ $0$ đến $n-1$), ô thứ $i$ có giá trị $a_i$ (CÓ THỂ ÂM).\n\n' +
        'Em xuất phát ở ô $0$ và muốn tới ô $n-1$. Mỗi bước em có thể nhảy tới ô $+1$, $+2$ hoặc $+3$. ' +
        'Khi dừng chân ở ô nào em nhận giá trị của ô đó (luôn tính cả ô đầu và ô cuối).\n\n' +
        'Hãy tìm tổng giá trị lớn nhất em có thể thu được.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $a_0, \\dots, a_{n-1}$ $(-1000 \\le a_i \\le 1000)$.',
      outputDesc: 'In ra tổng giá trị lớn nhất.',
      note: 'dp[i] = a[i] + max(dp[i-1], dp[i-2], dp[i-3]); đáp án là dp[n-1].',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const n = a.length;
        const dp = new Array(n).fill(0);
        dp[0] = a[0];
        for (let i = 1; i < n; i++) {
          let best = dp[i - 1];
          if (i >= 2) best = Math.max(best, dp[i - 2]);
          if (i >= 3) best = Math.max(best, dp[i - 3]);
          dp[i] = a[i] + best;
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '5\n1 2 9 4 5',
        '1\n7',
        '6\n10 -5 -5 10 -5 10',
        '4\n-1 -2 -3 -4',
        '1\n-100',
        '3\n5 -100 5',
        '2\n-3 -8',
      ],
    },
    {
      key: '26',
      title: 'Ếch nhảy bước 1 hoặc 3',
      difficulty: 'MEDIUM',
      story:
        'Có $n$ hòn đá cao $h_1, \\dots, h_n$ xếp thành hàng; chú ếch đứng ở hòn đá $1$ và muốn tới hòn đá $n$.\n\n' +
        'Khi đang ở hòn đá $i$, ếch có thể nhảy tới hòn đá $i+1$ hoặc $i+3$. Mỗi lần nhảy từ hòn đá $i$ sang hòn đá $j$ ' +
        'tốn chi phí $|h_i - h_j|$.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để ếch tới hòn đá cuối cùng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $h_1, \\dots, h_n$ $(1 \\le h_i \\le 10^4)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp[i] = min(dp[i-1] + |h[i]-h[i-1]|, dp[i-3] + |h[i]-h[i-3]|).',
      solve: (input) => {
        const ls = lines(input);
        const h = readInts(ls[1]);
        const n = h.length;
        const dp = new Array(n).fill(Infinity);
        dp[0] = 0;
        for (let i = 1; i < n; i++) {
          let best = dp[i - 1] + Math.abs(h[i] - h[i - 1]);
          if (i >= 3) best = Math.min(best, dp[i - 3] + Math.abs(h[i] - h[i - 3]));
          dp[i] = best;
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '4\n10 30 40 20',
        '1\n5',
        '6\n30 10 60 10 60 50',
        '2\n10 10',
        '3\n10 20 10',
        '5\n40 10 20 70 80',
        '2\n1 10000',
      ],
    },
    {
      key: '27',
      title: 'Leo cầu thang không dùng hai bước-1 liên tiếp',
      difficulty: 'MEDIUM',
      story:
        'Cầu thang có $n$ bậc. Mỗi bước em bước lên $1$ hoặc $2$ bậc, nhưng KHÔNG được thực hiện hai bước-$1$ liên tiếp.\n\n' +
        'Hỏi có bao nhiêu cách khác nhau để leo từ mặt đất lên đúng bậc thứ $n$?',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 60)$.',
      outputDesc: 'In ra số cách leo hợp lệ.',
      note: 'Gọi one[i]/two[i] là số cách tới bậc i với bước cuối là 1/2: one[i] = two[i-1] (bước 1 phải sau một bước 2); two[i] = one[i-2] + two[i-2].',
      solve: (input) => {
        const n = toInt(input);
        // one[i], two[i]: số cách hợp lệ tới đúng bậc i với bước cuối là 1 / 2
        const one = new Array(n + 1).fill(0);
        const two = new Array(n + 1).fill(0);
        // bậc 1: chỉ tới được bằng một bước 1 (từ mặt đất); coi như hợp lệ
        if (n >= 1) one[1] = 1;
        if (n >= 2) two[2] = 1; // bậc 2 bằng một bước 2 từ mặt đất
        for (let i = 2; i <= n; i++) {
          // bước 1 từ i-1: chỉ hợp lệ nếu bước tới i-1 là bước 2
          one[i] += two[i - 1];
          // bước 2 từ i-2: luôn hợp lệ
          two[i] += one[i - 2] + two[i - 2];
        }
        return String(one[n] + two[n]);
      },
      inputs: ['1', '2', '3', '4', '5', '10', '30', '60'],
    },
    {
      key: '28',
      title: 'Vé xe chi phí nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Em có lịch những ngày cần đi xe trong năm (các ngày được cho theo thứ tự tăng dần, đánh số từ $1$).\n\n' +
        'Có hai loại vé: vé $1$-ngày giá $A$ (chỉ dùng được đúng ngày mua) và vé $d$-ngày liên tiếp giá $B$ ' +
        '(dùng được cho mọi ngày trong khoảng $d$ ngày liên tiếp kể từ ngày mua).\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để đi được tất cả các ngày trong lịch.',
      inputDesc:
        'Dòng đầu chứa bốn số nguyên $m$, $A$, $B$, $d$ ($1 \\le m \\le 1000$, $1 \\le A, B \\le 1000$, ' +
        '$1 \\le d \\le 365$): số ngày cần đi, giá vé $1$-ngày, giá vé $d$-ngày và độ dài $d$. ' +
        'Dòng thứ hai chứa $m$ số nguyên là các ngày cần đi, tăng dần, mỗi ngày trong khoảng $[1, 365]$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp theo các ngày cần đi: với mỗi ngày, hoặc mua vé 1-ngày, hoặc mua vé d-ngày phủ tới ngày này.',
      solve: (input) => {
        const ls = lines(input);
        const [, A, B, d] = readInts(ls[0]);
        const days = readInts(ls[1]);
        const m = days.length;
        // dp[i] = chi phí nhỏ nhất để đi hết days[0..i-1]
        const dp = new Array(m + 1).fill(0);
        for (let i = 1; i <= m; i++) {
          const today = days[i - 1];
          // mua vé 1-ngày cho ngày này
          let best = dp[i - 1] + A;
          // mua vé d-ngày phủ ngày này: tìm j sao cho days[j] >= today - d + 1
          let j = i - 1;
          while (j > 0 && days[j - 1] >= today - d + 1) {
            j--;
          }
          best = Math.min(best, dp[j] + B);
          dp[i] = best;
        }
        return String(dp[m]);
      },
      inputs: [
        '3 2 7 7\n1 4 6',
        '1 5 10 7\n3',
        '4 2 7 30\n1 10 20 30',
        '5 3 3 1\n1 2 3 4 5',
        '5 1 100 30\n1 2 3 4 5',
        '2 1000 1 365\n1 365',
        '6 2 7 7\n1 4 6 7 8 365',
      ],
    },
    {
      key: '29',
      title: 'Xâu tam phân không có hai số 0 liền nhau',
      difficulty: 'MEDIUM',
      story:
        'Đếm số xâu độ dài $n$ gồm các chữ số trong $\\{0, 1, 2\\}$ sao cho không có hai số $0$ nào đứng cạnh nhau.\n\n' +
        'Ví dụ với $n = 2$: trong $9$ xâu chỉ có $00$ là không hợp lệ, nên có $8$ xâu hợp lệ.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 30)$.',
      outputDesc: 'In ra số xâu hợp lệ.',
      note: 'end0 = endNon0 (chỉ thêm 0 sau ký tự khác 0); endNon0 = 2·(end0 + endNon0).',
      solve: (input) => {
        const n = toInt(input);
        let end0 = 1, // n = 1: xâu "0"
          endN = 2; // n = 1: "1", "2"
        for (let i = 2; i <= n; i++) {
          const total = end0 + endN;
          const n0 = endN; // thêm 0 chỉ sau ký tự khác 0
          const nN = total * 2; // thêm 1 hoặc 2 sau bất kỳ
          end0 = n0;
          endN = nN;
        }
        return String(end0 + endN);
      },
      inputs: ['1', '2', '3', '4', '10', '20', '30'],
    },
    {
      key: '30',
      title: 'Ít bước nhất từ 1 tới n',
      difficulty: 'MEDIUM',
      story:
        'Em đang đứng tại vị trí $1$ trên trục số và muốn tới vị trí $n$. Tại vị trí $x$, mỗi bước em có thể:\n\n' +
        '- Đi tới $x + 1$, hoặc\n' +
        '- Đi tới $2x$ (nhân đôi),\n\n' +
        'với điều kiện không bao giờ vượt quá $n$. Hãy tìm số bước ít nhất để đi từ $1$ tới $n$.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 10^6)$.',
      outputDesc: 'In ra số bước ít nhất.',
      note: 'dp[x] = 1 + min(dp[x-1], dp[x/2] nếu x chẵn). dp[1] = 0.',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(n + 1).fill(0);
        for (let x = 2; x <= n; x++) {
          let best = dp[x - 1];
          if (x % 2 === 0) best = Math.min(best, dp[x / 2]);
          dp[x] = best + 1;
        }
        return String(dp[n]);
      },
      inputs: ['1', '2', '5', '8', '3', '100', '1000000'],
    },
    {
      key: '31',
      title: 'Vườn hoa nở',
      difficulty: 'MEDIUM',
      story:
        'Một luống hoa được trồng thành một hàng dài $n$ ô; mỗi ô trồng đúng một bông hoa màu đỏ (R) hoặc trắng (W).\n\n' +
        'Vì lý do thẩm mỹ, mỗi nhóm các bông hoa TRẮNG đứng liền nhau phải có số lượng chia hết cho $k$ (các nhóm đỏ thì tùy ý).\n\n' +
        'Hãy đếm số cách trồng hoa hợp lệ trên cả hàng $n$ ô.',
      inputDesc:
        'Một dòng chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 45,\\ 1 \\le k \\le 10)$.',
      outputDesc: 'In ra số cách trồng hợp lệ.',
      note: 'dp[i] = dp[i-1] (đặt R ở cuối) + dp[i-k] (đặt nguyên một khối k bông W); dp[0] = 1.',
      solve: (input) => {
        const [n, k] = readInts(input);
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          dp[i] = dp[i - 1];
          if (i >= k) dp[i] += dp[i - k];
        }
        return String(dp[n]);
      },
      inputs: ['3 2', '4 2', '5 3', '1 1', '1 5', '10 1', '45 2', '6 6'],
    },
    {
      key: '32',
      title: 'Kỳ nghỉ của Vy',
      difficulty: 'MEDIUM',
      story:
        'Vy có $n$ ngày nghỉ. Mỗi ngày, hoặc phòng gym mở, hoặc lớp học lập trình mở, hoặc cả hai, hoặc không có gì mở.\n\n' +
        'Mỗi ngày Vy chọn một trong ba việc: nghỉ ngơi, tập gym (chỉ khi gym mở), hoặc đi học (chỉ khi lớp mở). ' +
        'Để tránh nhàm chán, Vy KHÔNG làm cùng một hoạt động (tập gym hay đi học) trong hai ngày liên tiếp.\n\n' +
        'Hãy tìm số ngày NGHỈ NGƠI ít nhất mà Vy buộc phải chịu.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số, mỗi số trong $\\{0,1,2,3\\}$: ' +
        '$0$ — không gì mở; $1$ — chỉ lớp học mở; $2$ — chỉ gym mở; $3$ — cả hai mở.',
      outputDesc: 'In ra số ngày nghỉ ngơi ít nhất.',
      note: 'Trạng thái: hoạt động của ngày hôm trước (nghỉ / gym / học). dp giữ số ngày nghỉ tối thiểu.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const n = a.length;
        const INF = Infinity;
        // dp[last]: 0 = nghỉ, 1 = học, 2 = gym
        let rest = 0,
          study = INF,
          gym = INF;
        for (let i = 0; i < n; i++) {
          const v = a[i];
          const prevBest = Math.min(rest, study, gym);
          const nRest = prevBest + 1; // nghỉ luôn được, +1 ngày nghỉ
          // học: ngày trước không được học
          const canStudy = v === 1 || v === 3;
          const canGym = v === 2 || v === 3;
          const nStudy = canStudy ? Math.min(rest, gym) : INF;
          const nGym = canGym ? Math.min(rest, study) : INF;
          rest = nRest;
          study = nStudy;
          gym = nGym;
        }
        return String(Math.min(rest, study, gym));
      },
      inputs: [
        '4\n1 3 2 0',
        '7\n1 3 3 2 1 2 3',
        '2\n2 2',
        '1\n0',
        '1\n3',
        '5\n0 0 0 0 0',
        '6\n3 3 3 3 3 3',
        '3\n1 1 1',
      ],
    },
    {
      key: '33',
      title: 'Lát dải bằng ô đơn và ô đôi hai màu',
      difficulty: 'EASY',
      story:
        'Em cần lát kín một dải dài $1 \\times n$ bằng hai loại miếng: miếng đơn $1 \\times 1$ (chỉ một màu) và miếng đôi $1 \\times 2$ ' +
        'có $2$ màu để chọn (xanh hoặc vàng).\n\n' +
        'Hai cách lát được coi là khác nhau nếu khác nhau về vị trí miếng hoặc màu của miếng đôi. ' +
        'Hỏi có bao nhiêu cách lát kín dải?',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 45)$.',
      outputDesc: 'In ra số cách lát.',
      note: 'dp[i] = dp[i-1] (đặt miếng đơn) + 2·dp[i-2] (đặt miếng đôi, 2 màu); dp[0] = 1.',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(Math.max(n + 1, 2)).fill(0);
        dp[0] = 1;
        dp[1] = 1;
        for (let i = 2; i <= n; i++) {
          dp[i] = dp[i - 1] + 2 * dp[i - 2];
        }
        return String(dp[n]);
      },
      inputs: ['0', '1', '2', '3', '4', '10', '20', '45'],
    },
    {
      key: '34',
      title: 'Ếch nhảy chi phí bình phương',
      difficulty: 'MEDIUM',
      story:
        'Có $n$ hòn đá cao $h_1, \\dots, h_n$ xếp thành hàng. Chú ếch đứng ở hòn đá $1$ và muốn tới hòn đá $n$.\n\n' +
        'Khi đang ở hòn đá $i$, ếch có thể nhảy sang hòn đá $i+1$ hoặc $i+2$; chi phí nhảy từ hòn đá $i$ sang hòn đá $j$ ' +
        'là $(h_i - h_j)^2$.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để ếch tới hòn đá cuối cùng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $h_1, \\dots, h_n$ $(0 \\le h_i \\le 1000)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp[i] = min(dp[i-1] + (h[i]-h[i-1])^2, dp[i-2] + (h[i]-h[i-2])^2).',
      solve: (input) => {
        const ls = lines(input);
        const h = readInts(ls[1]);
        const n = h.length;
        if (n === 1) return '0';
        const sq = (x: number) => x * x;
        const dp = new Array(n).fill(0);
        dp[0] = 0;
        dp[1] = sq(h[1] - h[0]);
        for (let i = 2; i < n; i++) {
          dp[i] = Math.min(dp[i - 1] + sq(h[i] - h[i - 1]), dp[i - 2] + sq(h[i] - h[i - 2]));
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '4\n10 30 40 20',
        '1\n7',
        '5\n0 2 4 6 8',
        '2\n0 1000',
        '3\n5 5 5',
        '6\n1 100 1 100 1 100',
        '2\n10 10',
        '4\n0 0 0 0',
      ],
    },
    {
      key: '35',
      title: 'Xâu nhị phân không chứa mẫu "010"',
      difficulty: 'MEDIUM',
      story:
        'Đếm số xâu nhị phân (chỉ gồm $0$ và $1$) độ dài $n$ sao cho KHÔNG xuất hiện đoạn con liên tiếp "$010$".\n\n' +
        'Ví dụ với $n = 3$: trong $8$ xâu chỉ có $010$ là bị cấm, nên có $7$ xâu hợp lệ.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 45)$.',
      outputDesc: 'In ra số xâu hợp lệ.',
      note: 'Trạng thái = hai ký tự cuối cùng của xâu (00, 01, 10, 11); cấm chuyển sang "10" khi đang ở "01".',
      solve: (input) => {
        const n = toInt(input);
        if (n === 1) return '2';
        // số xâu hợp lệ theo hai ký tự cuối: 00,01,10,11
        let c00 = 1,
          c01 = 1,
          c10 = 1,
          c11 = 1; // n = 2
        for (let i = 3; i <= n; i++) {
          // thêm ký tự mới c vào cuối; trạng thái (a,b) -> (b,c), cấm (b,c) tạo "010" tức (a,b,c)=(0,1,0)
          const n00 = c00 + c10; // (_0) + thêm 0 => (00): từ 00 hoặc 10
          const n01 = c00 + c10; // (_0) + thêm 1 => (01)
          // (01)+thêm0 => "010" CẤM; (11)+thêm0 => (10) OK
          const n10 = c11; // chỉ từ 11 thêm 0
          const n11 = c01 + c11; // (_1)+thêm1 => (11): từ 01 hoặc 11
          c00 = n00;
          c01 = n01;
          c10 = n10;
          c11 = n11;
        }
        return String(c00 + c01 + c10 + c11);
      },
      inputs: ['1', '2', '3', '4', '5', '10', '20', '45'],
    },
    {
      key: '36',
      title: 'Phân tích n thành tổng có thứ tự các phần ≤ k',
      difficulty: 'EASY',
      story:
        'Đếm số cách viết số nguyên dương $n$ thành tổng CÓ THỨ TỰ của một hay nhiều số nguyên dương, ' +
        'trong đó mỗi số hạng không vượt quá $k$.\n\n' +
        'Ví dụ với $n = 3$, $k = 2$: các cách là $1+1+1,\\ 1+2,\\ 2+1$ — tổng cộng $3$ cách (riêng $3$ bị loại vì $3 > k$).',
      inputDesc: 'Một dòng chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 45,\\ 1 \\le k \\le 10)$.',
      outputDesc: 'In ra số cách phân tích.',
      note: 'dp[i] = tổng dp[i-j] với j chạy từ 1 đến min(i, k); dp[0] = 1.',
      solve: (input) => {
        const [n, k] = readInts(input);
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          for (let j = 1; j <= k && j <= i; j++) {
            dp[i] += dp[i - j];
          }
        }
        return String(dp[n]);
      },
      inputs: ['3 2', '4 3', '5 5', '1 1', '1 10', '45 1', '40 2', '10 10'],
    },
    {
      key: '37',
      title: 'Tích lớn nhất khi tách n',
      difficulty: 'MEDIUM',
      story:
        'Cho số nguyên $n \\ge 2$. Hãy tách $n$ thành tổng của ÍT NHẤT HAI số nguyên dương ' +
        '($n = a_1 + a_2 + \\dots + a_t$ với $t \\ge 2$) sao cho TÍCH $a_1 \\cdot a_2 \\cdots a_t$ lớn nhất.\n\n' +
        'Ví dụ với $n = 10$: cách tách $3 + 3 + 4$ cho tích $36$, là lớn nhất.',
      inputDesc: 'Một số nguyên $n$ $(2 \\le n \\le 58)$.',
      outputDesc: 'In ra tích lớn nhất.',
      note: 'dp[i] = max trên j của max(j, dp[j]) · max(i-j, dp[i-j]); dp[1] = 1.',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(n + 1).fill(0);
        dp[1] = 1;
        for (let i = 2; i <= n; i++) {
          let best = 0;
          for (let j = 1; j < i; j++) {
            // tách phần đầu là j (để nguyên), phần còn lại i-j có thể tách tiếp hoặc để nguyên
            const left = j;
            const right = Math.max(i - j, dp[i - j]);
            best = Math.max(best, left * right);
          }
          dp[i] = best;
        }
        return String(dp[n]);
      },
      inputs: ['2', '3', '4', '10', '8', '5', '58', '7'],
    },
    {
      key: '38',
      title: 'Sơn hàng rào k màu chi phí nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Một hàng rào gồm $n$ cọc thẳng hàng cần sơn, có $k$ màu để chọn. Sơn cọc $i$ bằng màu $j$ tốn chi phí cho trước.\n\n' +
        'Yêu cầu: hai cọc liền kề KHÔNG được cùng màu. Hãy tìm tổng chi phí nhỏ nhất để sơn toàn bộ hàng rào.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 1000,\\ 1 \\le k \\le 50)$. ' +
        'Tiếp theo là $n$ dòng, dòng thứ $i$ chứa $k$ số nguyên là chi phí sơn cọc $i$ bằng từng màu $(0 \\le \\text{chi phí} \\le 1000)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất (giả sử $k \\ge 2$ khi $n \\ge 2$).',
      note: 'dp[i][j] = cost[i][j] + min trên j2≠j của dp[i-1][j2]. Dùng giá trị nhỏ nhất và nhỏ nhì hàng trước để O(nk).',
      solve: (input) => {
        const ls = lines(input);
        const [n, k] = readInts(ls[0]);
        let prev = readInts(ls[1]).slice(0, k);
        for (let i = 2; i <= n; i++) {
          const cost = readInts(ls[i]).slice(0, k);
          // tìm min và min-nhì của prev cùng vị trí min
          let min1 = Infinity,
            min2 = Infinity,
            idx1 = -1;
          for (let j = 0; j < k; j++) {
            if (prev[j] < min1) {
              min2 = min1;
              min1 = prev[j];
              idx1 = j;
            } else if (prev[j] < min2) {
              min2 = prev[j];
            }
          }
          const cur = new Array(k);
          for (let j = 0; j < k; j++) {
            const best = j === idx1 ? min2 : min1;
            cur[j] = cost[j] + best;
          }
          prev = cur;
        }
        return String(Math.min(...prev));
      },
      inputs: [
        '3 3\n17 2 17\n16 16 5\n14 3 19',
        '1 4\n7 6 5 4',
        '2 2\n1 5\n2 9',
        '1 1\n0',
        '3 2\n1 100\n100 1\n1 100',
        '4 3\n10 10 10\n10 10 10\n10 10 10\n10 10 10',
        '2 3\n0 0 0\n0 0 0',
      ],
    },
    {
      key: '39',
      title: 'Kẻ trộm với hạn mức số nhà',
      difficulty: 'MEDIUM',
      story:
        'Trên một con phố có $n$ ngôi nhà, nhà thứ $i$ chứa $a_i$ đồng. Một tên trộm muốn lấy trộm nhiều tiền nhất, ' +
        'nhưng không được trộm HAI ngôi nhà liền kề (sẽ bị báo động), và vì sức chứa của túi, hắn chỉ trộm được TỐI ĐA $m$ nhà.\n\n' +
        'Hãy tìm tổng số tiền lớn nhất hắn có thể lấy.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $m$ $(1 \\le n \\le 1000,\\ 0 \\le m \\le n)$. ' +
        'Dòng thứ hai chứa $n$ số nguyên $a_i$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng số tiền lớn nhất.',
      note: 'dp[i][t] = số tiền lớn nhất xét tới nhà i, đã trộm t nhà. dp[i][t] = max(dp[i-1][t], dp[i-2][t-1] + a[i]).',
      solve: (input) => {
        const ls = lines(input);
        const [n, m] = readInts(ls[0]);
        const a = readInts(ls[1]);
        // dp theo i với chiều t = số nhà đã trộm (0..m)
        // best[t] = số tiền lớn nhất tới nhà hiện tại "không cấm" — dùng cách 2 mảng prev/prevPrev
        let pp = new Array(m + 1).fill(0); // dp[i-2]
        let p = new Array(m + 1).fill(0); // dp[i-1]
        for (let i = 0; i < n; i++) {
          const cur = new Array(m + 1).fill(0);
          for (let t = 0; t <= m; t++) {
            cur[t] = p[t]; // không trộm nhà i
            if (t >= 1) cur[t] = Math.max(cur[t], pp[t - 1] + a[i]); // trộm nhà i
          }
          pp = p;
          p = cur;
        }
        return String(Math.max(...p));
      },
      inputs: [
        '5 2\n3 2 5 10 7',
        '4 1\n1 2 9 4',
        '3 0\n5 5 5',
        '1 1\n100',
        '1 0\n100',
        '6 3\n1 1 1 1 1 1',
        '5 5\n10 10 10 10 10',
        '2 2\n5 8',
      ],
    },
    {
      key: '40',
      title: 'Vòng cổ không hai hạt liền kề cùng màu',
      difficulty: 'MEDIUM',
      story:
        'Em xâu một vòng cổ gồm $n$ hạt xếp thành VÒNG TRÒN ($n \\ge 2$), mỗi hạt một trong $k$ màu.\n\n' +
        'Vì vòng tròn, hai hạt liền nhau phải khác màu, VÀ hạt đầu tiên với hạt cuối cùng cũng liền nhau nên cũng phải khác màu.\n\n' +
        'Hỏi có bao nhiêu cách tô màu vòng cổ?',
      inputDesc: 'Một dòng chứa hai số nguyên $n$ và $k$ $(2 \\le n \\le 40,\\ 1 \\le k \\le 10)$.',
      outputDesc: 'In ra số cách tô màu.',
      note: 'Công thức vòng: $(k-1)^n + (-1)^n (k-1)$. Có thể tính bằng dp giữ hai trạng thái: kết thúc trùng / khác màu hạt đầu.',
      solve: (input) => {
        const [n, k] = readInts(input);
        // dp[i][s]: số cách tô i hạt thành dãy thẳng, s=0 nếu hạt i cùng màu hạt 1, s=1 nếu khác.
        // hạt 1: cố định ý niệm "màu hạt 1"; nhân k ở cuối.
        // same = số cách hạt cuối == hạt đầu; diff = số cách hạt cuối != hạt đầu
        let same = 1,
          diff = 0; // i = 1: hạt cuối chính là hạt đầu
        for (let i = 2; i <= n; i++) {
          // hạt mới khác hạt trước (k-1 lựa chọn), rồi xét nó so với hạt đầu
          const nSame = diff; // muốn cùng hạt đầu: hạt trước phải khác hạt đầu, đúng 1 cách trùng hạt đầu
          const nDiff = same * (k - 1) + diff * (k - 2); // khác hạt đầu
          same = nSame;
          diff = nDiff;
        }
        // điều kiện vòng: hạt cuối phải khác hạt đầu => lấy diff; nhân k cho màu hạt đầu
        return String(diff * k);
      },
      inputs: ['3 3', '4 2', '2 5', '2 1', '3 1', '4 3', '40 2', '5 3'],
    },
    {
      key: '41',
      title: 'Chi phí đi hết hàng ô bước 1 hoặc 2',
      difficulty: 'MEDIUM',
      story:
        'Một hàng có $n$ ô, đánh số từ $0$ đến $n-1$; đứng ở ô $i$ phải trả phí $c_i$. ' +
        'Em được bắt đầu ở ô $0$ HOẶC ô $1$, và mỗi bước tiến tới ô $+1$ hoặc $+2$. ' +
        'Em hoàn thành khi nhảy RA KHỎI hàng (tức từ ô cuối hoặc ô gần cuối nhảy vượt qua ô $n-1$).\n\n' +
        'Mỗi ô em ĐẶT CHÂN đều phải trả phí (kể cả ô xuất phát). Hãy tìm tổng phí nhỏ nhất để ra khỏi hàng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $c_0, \\dots, c_{n-1}$ $(0 \\le c_i \\le 1000)$.',
      outputDesc: 'In ra tổng phí nhỏ nhất để ra khỏi hàng.',
      note: 'Khác bài 04: ô xuất phát cũng tính phí. dp[i] = c[i] + min(dp[i-1], dp[i-2]); đáp án min(dp[n-1], dp[n-2]).',
      solve: (input) => {
        const ls = lines(input);
        const c = readInts(ls[1]);
        const n = c.length;
        const dp = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          let best = 0;
          if (i === 1) best = Math.min(dp[0], 0); // có thể bắt đầu ngay tại ô 1
          else if (i >= 2) best = Math.min(dp[i - 1], dp[i - 2]);
          dp[i] = c[i] + best;
        }
        // ra khỏi hàng từ ô n-1 (bước bất kỳ) hoặc từ ô n-2 (bước 2)
        if (n === 1) return String(dp[0]);
        return String(Math.min(dp[n - 1], dp[n - 2]));
      },
      inputs: [
        '5\n1 100 1 1 1',
        '1\n7',
        '2\n10 1',
        '3\n5 5 5',
        '4\n0 0 0 0',
        '6\n1 2 3 4 5 6',
        '2\n0 0',
        '5\n100 1 100 1 100',
      ],
    },
    {
      key: '42',
      title: 'Tô màu hàng trứng',
      difficulty: 'EASY',
      story:
        'Em xếp $n$ quả trứng thành một HÀNG NGANG và tô mỗi quả bằng một trong $3$ màu.\n\n' +
        'Yêu cầu: hai quả trứng đứng liền nhau phải khác màu. Hỏi có bao nhiêu cách tô?',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 30)$.',
      outputDesc: 'In ra số cách tô.',
      note: 'Quả đầu có 3 cách, mỗi quả sau có 2 cách: kết quả là $3 \\cdot 2^{n-1}$. dp[i] = 2·dp[i-1], dp[1] = 3.',
      solve: (input) => {
        const n = toInt(input);
        let res = 3; // n = 1
        for (let i = 2; i <= n; i++) {
          res *= 2;
        }
        return String(res);
      },
      inputs: ['1', '2', '3', '4', '5', '10', '20', '30'],
    },
    {
      key: '43',
      title: 'Dãy chia hết dây chuyền',
      difficulty: 'MEDIUM',
      story:
        'Đếm số dãy $a_1, a_2, \\dots, a_n$ thỏa mãn $1 \\le a_i \\le k$ với mọi $i$, và $a_i$ là ƯỚC của $a_{i+1}$ ' +
        '(tức $a_i$ chia hết $a_{i+1}$) với mọi $i$ từ $1$ đến $n-1$.\n\n' +
        'Ví dụ với $n = 2$, $k = 4$: các dãy hợp lệ gồm $(1,1),(1,2),(1,3),(1,4),(2,2),(2,4),(3,3),(4,4)$ — tổng cộng $8$ dãy.',
      inputDesc: 'Một dòng chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 30,\\ 1 \\le k \\le 50)$.',
      outputDesc: 'In ra số dãy hợp lệ.',
      note: 'dp[i][v] = số dãy độ dài i kết thúc bằng v = tổng dp[i-1][u] với u là ước của v.',
      solve: (input) => {
        const [n, k] = readInts(input);
        let prev = new Array(k + 1).fill(1); // i = 1: mỗi giá trị 1 dãy
        prev[0] = 0;
        for (let i = 2; i <= n; i++) {
          const cur = new Array(k + 1).fill(0);
          for (let v = 1; v <= k; v++) {
            // dp[i][v] cộng dp[i-1][u] với u là ƯỚC của v
            for (let u = 1; u <= v; u++) {
              if (v % u === 0) cur[v] += prev[u];
            }
          }
          prev = cur;
        }
        let total = 0;
        for (let v = 1; v <= k; v++) total += prev[v];
        return String(total);
      },
      inputs: ['2 4', '1 5', '3 2', '1 1', '5 1', '4 6', '30 1', '10 4'],
    },
    {
      key: '44',
      title: 'Xếp chồng đồng xu',
      difficulty: 'EASY',
      story:
        'Em có $n$ đồng xu xếp thành một hàng, gộp lại thành các chồng cạnh nhau. Mỗi chồng cao $1$ đồng (một đồng đứng) ' +
        'hoặc cao $2$ đồng; một chồng cao $2$ có thể nghiêng sang TRÁI hoặc sang PHẢI ($2$ kiểu).\n\n' +
        'Hai cách xếp khác nhau nếu khác về độ cao các chồng hoặc hướng nghiêng. Hỏi có bao nhiêu cách dùng hết $n$ đồng xu?',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 45)$.',
      outputDesc: 'In ra số cách xếp.',
      note: 'dp[i] = dp[i-1] (chồng cao 1) + 2·dp[i-2] (chồng cao 2, nghiêng trái/phải); dp[0] = 1.',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(Math.max(n + 1, 2)).fill(0);
        dp[0] = 1;
        dp[1] = 1;
        for (let i = 2; i <= n; i++) {
          dp[i] = dp[i - 1] + 2 * dp[i - 2];
        }
        return String(dp[n]);
      },
      inputs: ['0', '1', '2', '3', '4', '6', '10', '45'],
    },
    {
      key: '45',
      title: 'Kẻ trộm giữ khoảng cách 2',
      difficulty: 'MEDIUM',
      story:
        'Trên một con phố có $n$ ngôi nhà, nhà thứ $i$ chứa $a_i$ đồng (có thể bằng $0$). ' +
        'Một tên trộm muốn chọn một số nhà để trộm sao cho hai nhà được chọn bất kỳ cách nhau ÍT NHẤT $2$ ô ' +
        '(nếu trộm nhà $i$ và $j$ với $i < j$ thì $j - i \\ge 2$).\n\n' +
        'Hãy tìm tổng số tiền lớn nhất tên trộm có thể lấy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $a_i$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng số tiền lớn nhất.',
      note: 'dp[i] = max(dp[i-1], dp[i-2] + a[i]); chính là house robber cổ điển (khoảng cách ≥ 2).',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const n = a.length;
        let pp = 0,
          p = 0; // dp[i-2], dp[i-1]
        for (let i = 0; i < n; i++) {
          const cur = Math.max(p, pp + a[i]);
          pp = p;
          p = cur;
        }
        return String(p);
      },
      inputs: [
        '5\n3 2 5 10 7',
        '1\n9',
        '4\n2 7 9 3',
        '3\n0 0 0',
        '2\n5 8',
        '6\n5 5 5 5 5 5',
        '1\n0',
        '7\n1 2 3 4 5 6 7',
      ],
    },
    {
      key: '46',
      title: 'Ít phép nhất từ 0 tới n',
      difficulty: 'EASY',
      story:
        'Em bắt đầu với số $0$ và muốn đạt tới số nguyên dương $n$. Mỗi phép em được làm một trong hai việc:\n\n' +
        '- Cộng thêm $1$, hoặc\n' +
        '- Nhân đôi (chỉ áp dụng khi số hiện tại lớn hơn $0$).\n\n' +
        'Hãy tìm số phép ít nhất để biến $0$ thành $n$.',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 10^6)$.',
      outputDesc: 'In ra số phép ít nhất.',
      note: 'dp[x] = 1 + min(dp[x-1], dp[x/2] nếu x chẵn và x/2 ≥ 1); dp[0] = 0.',
      solve: (input) => {
        const n = toInt(input);
        const dp = new Array(n + 1).fill(0);
        for (let x = 1; x <= n; x++) {
          let best = dp[x - 1]; // +1
          if (x % 2 === 0 && x / 2 >= 1) best = Math.min(best, dp[x / 2]); // nhân đôi từ x/2 (>0)
          dp[x] = best + 1;
        }
        return String(dp[n]);
      },
      inputs: ['0', '1', '2', '3', '10', '7', '1000000', '15'],
    },
    {
      key: '47',
      title: 'Xâu tam phân không "00" và không "11"',
      difficulty: 'MEDIUM',
      story:
        'Đếm số xâu độ dài $n$ gồm các chữ số trong $\\{0, 1, 2\\}$ sao cho KHÔNG xuất hiện hai số $0$ liền nhau ' +
        '("$00$") VÀ không xuất hiện hai số $1$ liền nhau ("$11$"). Hai số $2$ liền nhau thì được phép.\n\n' +
        'Ví dụ với $n = 2$: các xâu bị cấm là $00$ và $11$, nên có $9 - 2 = 7$ xâu hợp lệ.',
      inputDesc: 'Một số nguyên $n$ $(1 \\le n \\le 30)$.',
      outputDesc: 'In ra số xâu hợp lệ.',
      note: 'Trạng thái = ký tự cuối (0, 1, 2). Cấm 0→0 và 1→1; mọi chuyển khác đều được.',
      solve: (input) => {
        const n = toInt(input);
        let e0 = 1,
          e1 = 1,
          e2 = 1; // n = 1
        for (let i = 2; i <= n; i++) {
          const n0 = e1 + e2; // thêm 0: trước không được là 0
          const n1 = e0 + e2; // thêm 1: trước không được là 1
          const n2 = e0 + e1 + e2; // thêm 2: tùy ý
          e0 = n0;
          e1 = n1;
          e2 = n2;
        }
        return String(e0 + e1 + e2);
      },
      inputs: ['1', '2', '3', '4', '5', '10', '20', '30'],
    },
    {
      key: '48',
      title: 'Leo cầu thang với số bước-2 chẵn',
      difficulty: 'MEDIUM',
      story:
        'Cầu thang có $n$ bậc. Mỗi bước em bước lên $1$ hoặc $2$ bậc.\n\n' +
        'Hãy đếm số cách leo từ mặt đất lên đúng bậc thứ $n$ sao cho tổng số bước-$2$ đã dùng là một số CHẴN ' +
        '(kể cả $0$ bước-$2$).',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 45)$.',
      outputDesc: 'In ra số cách leo hợp lệ.',
      note: 'Hai trạng thái parity: even[i]/odd[i] = số cách tới bậc i với số bước-2 chẵn/lẻ; bước-2 đổi parity.',
      solve: (input) => {
        const n = toInt(input);
        // even[i], odd[i]: số cách tới bậc i với số bước-2 chẵn / lẻ
        const even = new Array(n + 1).fill(0);
        const odd = new Array(n + 1).fill(0);
        even[0] = 1; // chưa đi bước nào: 0 bước-2 (chẵn)
        for (let i = 1; i <= n; i++) {
          // bước 1 từ i-1: giữ nguyên parity
          even[i] += even[i - 1];
          odd[i] += odd[i - 1];
          // bước 2 từ i-2: đổi parity
          if (i >= 2) {
            even[i] += odd[i - 2];
            odd[i] += even[i - 2];
          }
        }
        return String(even[n]);
      },
      inputs: ['0', '1', '2', '3', '4', '5', '10', '45'],
    },
    {
      key: '49',
      title: 'Dãy Padovan',
      difficulty: 'EASY',
      story:
        'Dãy Padovan được định nghĩa: $P_0 = P_1 = P_2 = 1$, và với $n \\ge 3$:\n\n' +
        '$$P_n = P_{n-2} + P_{n-3}.$$\n\n' +
        'Cho số $n$, hãy tính $P_n$.',
      inputDesc: 'Một số nguyên $n$ $(0 \\le n \\le 70)$.',
      outputDesc: 'In ra giá trị $P_n$.',
      note: 'dp[i] = dp[i-2] + dp[i-3]; chỉ cần lưu ba số liền trước.',
      solve: (input) => {
        const n = toInt(input);
        const p = [1, 1, 1];
        if (n <= 2) return String(p[n]);
        for (let i = 3; i <= n; i++) {
          p[i] = p[i - 2] + p[i - 3];
        }
        return String(p[n]);
      },
      inputs: ['0', '1', '2', '3', '4', '5', '10', '70'],
    },
    {
      key: '50',
      title: 'Trò chơi xúc xắc đường thẳng',
      difficulty: 'MEDIUM',
      story:
        'Một đường có $n$ ô đánh số từ $0$ đến $n-1$, ô thứ $i$ có điểm $a_i$ (CÓ THỂ ÂM). ' +
        'Em đứng ở ô $0$ và muốn tới ô $n-1$. Mỗi lượt em tung được một bước có độ dài từ $1$ đến $k$ ' +
        '(em tự chọn độ dài bước trong khoảng đó), nhảy về phía trước đúng số ô đó.\n\n' +
        'Khi dừng chân ở ô nào em nhận điểm của ô đó (luôn tính cả ô đầu và ô cuối). ' +
        'Hãy tìm tổng điểm lớn nhất em có thể thu được khi tới ô $n-1$.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 1000,\\ 1 \\le k \\le 100)$. ' +
        'Dòng thứ hai chứa $n$ số nguyên $a_0, \\dots, a_{n-1}$ $(-1000 \\le a_i \\le 1000)$.',
      outputDesc: 'In ra tổng điểm lớn nhất.',
      note: 'dp[i] = a[i] + max trên j từ 1 đến k của dp[i-j]; đáp án dp[n-1].',
      solve: (input) => {
        const ls = lines(input);
        const [, k] = readInts(ls[0]);
        const a = readInts(ls[1]);
        const n = a.length;
        const dp = new Array(n).fill(0);
        dp[0] = a[0];
        for (let i = 1; i < n; i++) {
          let best = -Infinity;
          for (let j = 1; j <= k && i - j >= 0; j++) {
            best = Math.max(best, dp[i - j]);
          }
          dp[i] = a[i] + best;
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '5 2\n1 2 9 4 5',
        '1 3\n7',
        '6 3\n10 -5 -5 10 -5 10',
        '4 1\n-1 -2 -3 -4',
        '5 4\n-10 -1 -1 -1 -10',
        '1 1\n-100',
        '3 2\n5 -100 5',
        '2 1\n-3 -8',
      ],
    },
  ],
};

export default course;

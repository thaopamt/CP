import { CourseSpec } from '../types';

/**
 * Chương 2 — DP trên mảng.
 * Mục tiêu: áp dụng quy hoạch động lên một mảng số: đoạn con lớn nhất, chọn phần
 * tử không kề nhau, dãy con tăng, mua bán cổ phiếu, trò chơi nhảy.
 *
 * NOTE cho người viết: không bao giờ tự gõ đáp án — luôn trả về từ solve(input).
 * 3 input đầu là test mẫu hiển thị. Mọi giá trị nằm trong số nguyên an toàn của JS.
 */

const toInt = (s: string): number => parseInt(s.trim(), 10);
const readInts = (line: string): number[] =>
  line
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));
const lines = (input: string): string[] => input.replace(/\r/g, '').split('\n');

const course: CourseSpec = {
  code: 'DP-BASIC-02',
  title: 'Chương 2: DP trên mảng',
  description:
    'Quy hoạch động trên một dãy số: đoạn con có tổng lớn nhất, chọn phần tử ' +
    'không kề nhau (kẻ trộm), dãy con tăng dài nhất, mua bán cổ phiếu và trò chơi nhảy.',
  tags: ['quy-hoach-dong', 'co-ban', 'dp-mang', 'kadane', 'house-robber', 'lis'],
  problems: [
    {
      key: '01',
      title: 'Đoạn con có tổng lớn nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm). Một "đoạn con liền nhau" là một dãy các phần tử đứng kề nhau trong mảng.\n\n' +
        'Hãy tìm tổng lớn nhất của một đoạn con liền nhau không rỗng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất tìm được.',
      note: 'Thuật toán Kadane: cur = max(a[i], cur + a[i]); cập nhật đáp án theo cur.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let cur = a[0],
          best = a[0];
        for (let i = 1; i < a.length; i++) {
          cur = Math.max(a[i], cur + a[i]);
          best = Math.max(best, cur);
        }
        return String(best);
      },
      inputs: [
        '9\n-2 1 -3 4 -1 2 1 -5 4',
        '1\n-5',
        '5\n1 2 3 4 5',
        '4\n-1 -2 -3 -4',
        '6\n5 -2 5 -2 5 -100',
        '1\n7',
        '4\n3 3 3 3',
        '5\n-1 -1 -1 -1 -1',
        '6\n0 0 0 0 0 0',
      ],
    },
    {
      key: '02',
      title: 'Kẻ trộm nhà',
      difficulty: 'EASY',
      story:
        'Trên một con phố có $n$ ngôi nhà xếp thành hàng, nhà thứ $i$ cất giữ $a_i$ đồng.\n\n' +
        'Một tên trộm muốn lấy càng nhiều tiền càng tốt, nhưng nếu hắn trộm hai ngôi nhà **kề nhau** thì hệ thống báo động sẽ kêu.\n\n' +
        'Hãy tính số tiền lớn nhất tên trộm có thể lấy mà không làm báo động kêu.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra số tiền lớn nhất.',
      note: 'dp[i] = max(dp[i-1], dp[i-2] + a[i]).',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let skip = 0,
          take = 0; // best không lấy nhà trước, best có thể lấy nhà trước
        for (const x of a) {
          const newTake = skip + x;
          const newSkip = Math.max(skip, take);
          take = newTake;
          skip = newSkip;
        }
        return String(Math.max(skip, take));
      },
      inputs: [
        '4\n1 2 3 1',
        '5\n2 7 9 3 1',
        '1\n10',
        '3\n5 5 5',
        '6\n6 1 1 6 1 6',
        '2\n4 9',
        '6\n0 0 0 0 0 0',
        '5\n5 4 3 2 1',
      ],
    },
    {
      key: '03',
      title: 'Kẻ trộm khu phố vòng tròn',
      difficulty: 'MEDIUM',
      story:
        'Vẫn là tên trộm ở bài trước, nhưng lần này $n$ ngôi nhà được xếp thành một **vòng tròn**: nhà đầu tiên và nhà cuối cùng cũng được coi là kề nhau.\n\n' +
        'Tên trộm vẫn không được trộm hai nhà kề nhau. Hãy tính số tiền lớn nhất hắn có thể lấy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra số tiền lớn nhất.',
      note: 'Xét hai trường hợp: bỏ nhà đầu, hoặc bỏ nhà cuối; mỗi trường hợp là bài kẻ trộm thẳng.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        if (n === 1) return String(a[0]);
        const rob = (lo: number, hi: number): number => {
          let skip = 0,
            take = 0;
          for (let i = lo; i <= hi; i++) {
            const newTake = skip + a[i];
            const newSkip = Math.max(skip, take);
            take = newTake;
            skip = newSkip;
          }
          return Math.max(skip, take);
        };
        return String(Math.max(rob(0, n - 2), rob(1, n - 1)));
      },
      inputs: [
        '3\n2 3 2',
        '4\n1 2 3 1',
        '1\n5',
        '5\n5 1 1 5 1',
        '2\n3 7',
        '4\n4 4 4 4',
        '6\n0 0 0 0 0 0',
        '5\n5 4 3 2 1',
      ],
    },
    {
      key: '04',
      title: 'Dãy con tăng dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một "dãy con tăng" là một dãy thu được bằng cách xóa bớt một số phần tử (giữ nguyên thứ tự) sao cho các phần tử còn lại tăng dần nghiêm ngặt.\n\n' +
        'Hãy tìm độ dài của dãy con tăng dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 2000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài của dãy con tăng dài nhất.',
      note: 'dp[i] = 1 + max(dp[j]) với mọi j < i mà a[j] < a[i].',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const dp = new Array(n).fill(1);
        let best = 1;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
          }
          if (dp[i] > best) best = dp[i];
        }
        return String(best);
      },
      inputs: [
        '8\n10 9 2 5 3 7 101 18',
        '6\n0 1 0 3 2 3',
        '4\n7 7 7 7',
        '1\n5',
        '5\n5 4 3 2 1',
        '6\n1 2 3 4 5 6',
        '5\n-3 -2 -1 -2 -3',
        '7\n2 2 2 5 5 1 9',
      ],
    },
    {
      key: '05',
      title: 'Đoạn tăng liên tiếp dài nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên. Hãy tìm độ dài của đoạn **liền nhau** dài nhất sao cho các phần tử trong đoạn tăng dần nghiêm ngặt.\n\n' +
        'Khác với dãy con tăng, ở bài này các phần tử phải đứng kề nhau trong mảng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$.',
      outputDesc: 'In ra độ dài đoạn tăng liên tiếp dài nhất.',
      note: 'Nếu a[i] > a[i-1] thì độ dài hiện tại tăng 1, ngược lại đặt lại về 1.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let cur = 1,
          best = 1;
        for (let i = 1; i < a.length; i++) {
          cur = a[i] > a[i - 1] ? cur + 1 : 1;
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '5\n1 3 5 4 7',
        '4\n2 2 2 2',
        '6\n1 2 3 1 2 3',
        '1\n9',
        '7\n5 6 7 8 1 2 3',
        '5\n5 4 3 2 1',
        '6\n1 2 3 4 5 6',
        '4\n-3 -2 -1 0',
      ],
    },
    {
      key: '06',
      title: 'Tích đoạn con lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm). Hãy tìm tích lớn nhất của một đoạn con liền nhau không rỗng.\n\n' +
        'Lưu ý: hai số âm nhân nhau cho kết quả dương, nên cần theo dõi cả tích lớn nhất lẫn nhỏ nhất tới mỗi vị trí.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10 \\le a_i \\le 10)$.',
      outputDesc: 'In ra tích lớn nhất.',
      note: 'Giữ đồng thời maxCur và minCur; khi gặp số âm thì vai trò của chúng đổi chỗ.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let maxCur = a[0],
          minCur = a[0],
          best = a[0];
        for (let i = 1; i < a.length; i++) {
          const x = a[i];
          const cand = [x, maxCur * x, minCur * x];
          maxCur = Math.max(...cand);
          minCur = Math.min(...cand);
          best = Math.max(best, maxCur);
        }
        return String(best);
      },
      inputs: [
        '4\n2 3 -2 4',
        '3\n-2 0 -1',
        '5\n-2 3 -4 1 2',
        '1\n-3',
        '6\n2 -5 -2 -4 3 1',
        '1\n5',
        '4\n2 2 2 2',
        '5\n-1 -1 -1 -1 -1',
        '4\n0 0 0 0',
      ],
    },
    {
      key: '07',
      title: 'Mua bán cổ phiếu một lần',
      difficulty: 'EASY',
      story:
        'Giá của một cổ phiếu trong $n$ ngày liên tiếp được cho bởi dãy $p_1, \\dots, p_n$.\n\n' +
        'Em được phép mua một lần và bán một lần (phải mua trước khi bán). Hãy tìm lợi nhuận lớn nhất có thể đạt được. ' +
        'Nếu không có cách nào có lãi, lợi nhuận là $0$.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra lợi nhuận lớn nhất.',
      note: 'Duyệt mảng, lưu giá thấp nhất đã thấy và cập nhật lợi nhuận tốt nhất.',
      solve: (input) => {
        const p = readInts(lines(input)[1]);
        let minPrice = p[0],
          best = 0;
        for (let i = 1; i < p.length; i++) {
          best = Math.max(best, p[i] - minPrice);
          minPrice = Math.min(minPrice, p[i]);
        }
        return String(best);
      },
      inputs: [
        '6\n7 1 5 3 6 4',
        '5\n7 6 4 3 1',
        '1\n5',
        '4\n1 2 3 4',
        '3\n2 4 1',
        '4\n5 5 5 5',
        '6\n0 0 0 0 0 0',
        '2\n1 100',
      ],
    },
    {
      key: '08',
      title: 'Mua bán cổ phiếu nhiều lần',
      difficulty: 'EASY',
      story:
        'Vẫn là giá cổ phiếu trong $n$ ngày, nhưng lần này em được mua và bán bao nhiêu lần cũng được (mỗi thời điểm chỉ giữ tối đa một cổ phiếu, phải bán xong mới được mua lại).\n\n' +
        'Hãy tìm tổng lợi nhuận lớn nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lợi nhuận lớn nhất.',
      note: 'Cộng dồn mọi đoạn tăng giá: nếu p[i] > p[i-1] thì cộng phần chênh lệch.',
      solve: (input) => {
        const p = readInts(lines(input)[1]);
        let profit = 0;
        for (let i = 1; i < p.length; i++) {
          if (p[i] > p[i - 1]) profit += p[i] - p[i - 1];
        }
        return String(profit);
      },
      inputs: [
        '6\n7 1 5 3 6 4',
        '5\n1 2 3 4 5',
        '5\n7 6 4 3 1',
        '1\n5',
        '4\n3 3 5 0',
        '4\n4 4 4 4',
        '6\n0 0 0 0 0 0',
        '5\n5 4 3 2 1',
      ],
    },
    {
      key: '09',
      title: 'Trò chơi nhảy',
      difficulty: 'MEDIUM',
      story:
        'Em đứng ở ô đầu tiên của một dãy $n$ ô. Ô thứ $i$ ghi số $a_i$ — nghĩa là từ ô $i$ em có thể nhảy tới bất kỳ ô nào trong khoảng từ $i+1$ đến $i+a_i$.\n\n' +
        'Hỏi em có thể tới được ô cuối cùng hay không?',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^5)$.',
      outputDesc: 'In ra `YES` nếu tới được ô cuối, ngược lại in ra `NO`.',
      note: 'Lưu vị trí xa nhất có thể tới; nếu có ô vượt quá tầm với thì thất bại.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let reach = 0;
        for (let i = 0; i < n; i++) {
          if (i > reach) return 'NO';
          reach = Math.max(reach, i + a[i]);
        }
        return 'YES';
      },
      inputs: [
        '5\n2 3 1 1 4',
        '5\n3 2 1 0 4',
        '1\n0',
        '3\n2 0 0',
        '4\n1 1 0 1',
        '5\n0 1 1 1 1',
        '4\n3 3 3 3',
        '6\n1 1 1 1 1 0',
      ],
    },
    {
      key: '10',
      title: 'Số bước nhảy ít nhất',
      difficulty: 'MEDIUM',
      story:
        'Vẫn là dãy $n$ ô với luật nhảy như bài trước (từ ô $i$ nhảy được tới các ô $i+1, \\dots, i+a_i$). Lần này đảm bảo luôn tới được ô cuối cùng.\n\n' +
        'Hãy tìm số bước nhảy **ít nhất** để đi từ ô đầu tới ô cuối.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^4)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$, đảm bảo luôn tới được ô cuối.',
      outputDesc: 'In ra số bước nhảy ít nhất (bằng $0$ nếu chỉ có một ô).',
      note: 'dp[i] = số bước ít nhất tới ô i; dp[i] = min(dp[j] + 1) với j có thể nhảy tới i.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const dp = new Array(n).fill(Infinity);
        dp[0] = 0;
        for (let i = 0; i < n; i++) {
          if (dp[i] === Infinity) continue;
          const far = Math.min(i + a[i], n - 1);
          for (let j = i + 1; j <= far; j++) {
            if (dp[i] + 1 < dp[j]) dp[j] = dp[i] + 1;
          }
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '5\n2 3 1 1 4',
        '5\n2 3 0 1 4',
        '1\n0',
        '3\n1 1 1',
        '6\n1 2 1 1 1 1',
        '2\n1 0',
        '5\n4 1 1 1 1',
        '7\n1 1 1 1 1 1 1',
      ],
    },
    {
      key: '11',
      title: 'Đếm số dãy con tăng dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Xét các dãy con tăng nghiêm ngặt (thu được bằng cách xóa bớt phần tử, giữ nguyên thứ tự) có độ dài lớn nhất.\n\n' +
        'Hãy đếm xem có bao nhiêu dãy con tăng dài nhất như vậy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 2000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$. Đảm bảo số lượng đếm được không vượt quá số nguyên an toàn.',
      outputDesc: 'In ra số lượng dãy con tăng dài nhất.',
      note: 'Giữ thêm cnt[i] = số dãy con tăng dài nhất kết thúc tại i; cộng dồn từ các j hợp lệ.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const len = new Array(n).fill(1);
        const cnt = new Array(n).fill(1);
        let best = 1;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] < a[i]) {
              if (len[j] + 1 > len[i]) {
                len[i] = len[j] + 1;
                cnt[i] = cnt[j];
              } else if (len[j] + 1 === len[i]) {
                cnt[i] += cnt[j];
              }
            }
          }
          if (len[i] > best) best = len[i];
        }
        let total = 0;
        for (let i = 0; i < n; i++) if (len[i] === best) total += cnt[i];
        return String(total);
      },
      inputs: [
        '5\n1 3 5 4 7',
        '5\n2 2 2 2 2',
        '4\n1 2 3 4',
        '1\n5',
        '5\n5 4 3 2 1',
        '6\n1 1 1 2 2 2',
        '4\n3 3 3 3',
        '7\n1 2 4 3 5 4 6',
      ],
    },
    {
      key: '12',
      title: 'Dãy con không giảm dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một "dãy con không giảm" là dãy thu được bằng cách xóa bớt một số phần tử (giữ nguyên thứ tự) sao cho các phần tử còn lại không giảm (cho phép hai phần tử liền nhau bằng nhau).\n\n' +
        'Hãy tìm độ dài của dãy con không giảm dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 2000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài dãy con không giảm dài nhất.',
      note: 'Giống LIS nhưng dùng điều kiện a[j] <= a[i].',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const dp = new Array(n).fill(1);
        let best = 1;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] <= a[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
          }
          if (dp[i] > best) best = dp[i];
        }
        return String(best);
      },
      inputs: [
        '6\n1 3 2 2 5 4',
        '5\n2 2 2 2 2',
        '4\n1 2 3 4',
        '1\n7',
        '5\n5 4 3 2 1',
        '6\n3 3 1 1 2 2',
        '7\n1 1 2 2 3 3 0',
        '4\n-2 -2 -1 -3',
      ],
    },
    {
      key: '13',
      title: 'Dãy con lồi-lõm dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một dãy con (giữ nguyên thứ tự) được gọi là **lồi** (bitonic) nếu nó tăng nghiêm ngặt tới một đỉnh rồi giảm nghiêm ngặt. Dãy chỉ tăng hoặc chỉ giảm cũng được coi là lồi.\n\n' +
        'Hãy tìm độ dài của dãy con lồi dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 2000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài dãy con lồi dài nhất.',
      note: 'Tính inc[i] (LIS kết thúc tại i) và dec[i] (LIS từ phải sang trái); đáp án là max(inc[i] + dec[i] - 1).',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const inc = new Array(n).fill(1);
        const dec = new Array(n).fill(1);
        for (let i = 0; i < n; i++)
          for (let j = 0; j < i; j++)
            if (a[j] < a[i] && inc[j] + 1 > inc[i]) inc[i] = inc[j] + 1;
        for (let i = n - 1; i >= 0; i--)
          for (let j = n - 1; j > i; j--)
            if (a[j] < a[i] && dec[j] + 1 > dec[i]) dec[i] = dec[j] + 1;
        let best = 1;
        for (let i = 0; i < n; i++)
          if (inc[i] + dec[i] - 1 > best) best = inc[i] + dec[i] - 1;
        return String(best);
      },
      inputs: [
        '8\n1 11 2 10 4 5 2 1',
        '6\n1 2 3 4 5 6',
        '5\n5 4 3 2 1',
        '1\n9',
        '4\n7 7 7 7',
        '7\n1 3 5 4 2 6 1',
        '5\n2 2 2 2 2',
        '9\n1 2 3 2 1 2 3 2 1',
      ],
    },
    {
      key: '14',
      title: 'Dãy con zigzag dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một dãy con (giữ nguyên thứ tự) được gọi là **zigzag** nếu hiệu giữa các phần tử liên tiếp đổi dấu xen kẽ: lớn hơn rồi nhỏ hơn rồi lớn hơn... (không có hiệu nào bằng $0$). Một dãy chỉ có một phần tử cũng là zigzag.\n\n' +
        'Hãy tìm độ dài của dãy con zigzag dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài dãy con zigzag dài nhất.',
      note: 'Giữ up = độ dài dãy zigzag kết thúc bằng bước tăng, down = kết thúc bằng bước giảm.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let up = 1,
          down = 1;
        for (let i = 1; i < n; i++) {
          if (a[i] > a[i - 1]) up = down + 1;
          else if (a[i] < a[i - 1]) down = up + 1;
        }
        return String(Math.max(up, down));
      },
      inputs: [
        '6\n1 7 4 9 2 5',
        '5\n1 2 3 4 5',
        '4\n7 7 7 7',
        '1\n5',
        '5\n5 4 3 2 1',
        '8\n3 3 3 2 5 1 7 7',
        '6\n0 0 0 0 0 0',
        '7\n1 5 3 3 3 8 2',
      ],
    },
    {
      key: '15',
      title: 'Dãy con tăng có tổng lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Xét các dãy con tăng nghiêm ngặt (giữ nguyên thứ tự, các phần tử tăng dần).\n\n' +
        'Hãy tìm tổng lớn nhất có thể đạt được của một dãy con tăng nghiêm ngặt không rỗng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 2000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất của một dãy con tăng nghiêm ngặt.',
      note: 'dp[i] = a[i] + max(0, max dp[j]) với j < i và a[j] < a[i].',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const dp = a.slice();
        let best = dp[0];
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] < a[i] && dp[j] + a[i] > dp[i]) dp[i] = dp[j] + a[i];
          }
          if (dp[i] > best) best = dp[i];
        }
        return String(best);
      },
      inputs: [
        '5\n1 101 2 3 100',
        '6\n1 2 3 4 5 6',
        '5\n5 4 3 2 1',
        '1\n-7',
        '4\n4 4 4 4',
        '6\n-3 -2 -1 -5 -4 -6',
        '5\n10 -1 -2 -3 11',
        '7\n3 1 4 1 5 9 2',
      ],
    },
    {
      key: '16',
      title: 'Mua bán cổ phiếu có phí giao dịch',
      difficulty: 'MEDIUM',
      story:
        'Giá cổ phiếu trong $n$ ngày được cho bởi dãy $p_1, \\dots, p_n$. Em được mua bán không giới hạn số lần (mỗi thời điểm giữ tối đa một cổ phiếu), nhưng **mỗi lần bán** phải trả một khoản phí giao dịch $f$.\n\n' +
        'Hãy tìm lợi nhuận lớn nhất.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $f$ $(1 \\le n \\le 10^5,\\ 0 \\le f \\le 10^4)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra lợi nhuận lớn nhất.',
      note: 'hold = max(hold, cash - p[i]); cash = max(cash, hold + p[i] - f).',
      solve: (input) => {
        const ls = lines(input);
        const f = readInts(ls[0])[1];
        const p = readInts(ls[1]);
        let cash = 0,
          hold = -p[0];
        for (let i = 1; i < p.length; i++) {
          const newCash = Math.max(cash, hold + p[i] - f);
          const newHold = Math.max(hold, cash - p[i]);
          cash = newCash;
          hold = newHold;
        }
        return String(cash);
      },
      inputs: [
        '6 2\n1 3 2 8 4 9',
        '5 0\n1 2 3 4 5',
        '5 3\n5 4 3 2 1',
        '1 1\n5',
        '4 0\n4 4 4 4',
        '6 100\n1 3 2 8 4 9',
        '6 0\n0 0 0 0 0 0',
        '5 2\n1 4 6 2 8',
      ],
    },
    {
      key: '17',
      title: 'Mua bán cổ phiếu có ngày nghỉ',
      difficulty: 'MEDIUM',
      story:
        'Giá cổ phiếu trong $n$ ngày được cho bởi dãy $p_1, \\dots, p_n$. Em được mua bán không giới hạn số lần (mỗi thời điểm giữ tối đa một cổ phiếu), nhưng **sau mỗi lần bán** phải nghỉ đúng $1$ ngày rồi mới được mua lại.\n\n' +
        'Hãy tìm lợi nhuận lớn nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra lợi nhuận lớn nhất.',
      note: 'Ba trạng thái: hold (đang giữ), sold (vừa bán hôm nay), rest (đang nghỉ/rảnh).',
      solve: (input) => {
        const p = readInts(lines(input)[1]);
        let hold = -p[0],
          sold = -Infinity,
          rest = 0;
        for (let i = 1; i < p.length; i++) {
          const prevSold = sold;
          sold = hold + p[i];
          hold = Math.max(hold, rest - p[i]);
          rest = Math.max(rest, prevSold);
        }
        return String(Math.max(sold, rest));
      },
      inputs: [
        '5\n1 2 3 0 2',
        '5\n1 2 3 4 5',
        '5\n5 4 3 2 1',
        '1\n5',
        '4\n4 4 4 4',
        '6\n0 0 0 0 0 0',
        '6\n1 4 2 8 1 9',
        '2\n1 100',
      ],
    },
    {
      key: '18',
      title: 'Mua bán cổ phiếu tối đa hai lần',
      difficulty: 'MEDIUM',
      story:
        'Giá cổ phiếu trong $n$ ngày được cho bởi dãy $p_1, \\dots, p_n$. Em được thực hiện **tối đa hai** giao dịch (mỗi giao dịch là một lần mua rồi bán; không được giữ hai cổ phiếu cùng lúc, phải bán xong mới được mua lại).\n\n' +
        'Hãy tìm lợi nhuận lớn nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra lợi nhuận lớn nhất.',
      note: 'Bốn trạng thái: buy1, sell1, buy2, sell2 cập nhật lần lượt qua từng ngày.',
      solve: (input) => {
        const p = readInts(lines(input)[1]);
        let buy1 = -Infinity,
          sell1 = 0,
          buy2 = -Infinity,
          sell2 = 0;
        for (const price of p) {
          buy1 = Math.max(buy1, -price);
          sell1 = Math.max(sell1, buy1 + price);
          buy2 = Math.max(buy2, sell1 - price);
          sell2 = Math.max(sell2, buy2 + price);
        }
        return String(sell2);
      },
      inputs: [
        '8\n3 3 5 0 0 3 1 4',
        '5\n1 2 3 4 5',
        '5\n7 6 4 3 1',
        '1\n5',
        '4\n4 4 4 4',
        '6\n0 0 0 0 0 0',
        '6\n1 2 4 2 5 7',
        '7\n6 1 3 2 4 7 1',
      ],
    },
    {
      key: '19',
      title: 'Xóa và cộng điểm',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên dương. Em thực hiện nhiều lượt; mỗi lượt chọn một giá trị $x$ đang còn trong dãy, được cộng $x$ điểm, sau đó **phải xóa toàn bộ** các phần tử bằng $x-1$ và bằng $x+1$ (mọi phần tử bằng $x$ cũng bị tiêu thụ).\n\n' +
        'Hãy tìm tổng điểm lớn nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(1 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng điểm lớn nhất.',
      note: 'Gọi sum[v] = tổng mọi phần tử bằng v; rồi chạy house robber trên trục giá trị: dp[v] = max(dp[v-1], dp[v-2] + sum[v]).',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let maxV = 0;
        for (const x of a) if (x > maxV) maxV = x;
        const sum = new Array(maxV + 1).fill(0);
        for (const x of a) sum[x] += x;
        let skip = 0,
          take = 0;
        for (let v = 1; v <= maxV; v++) {
          const newTake = skip + sum[v];
          const newSkip = Math.max(skip, take);
          take = newTake;
          skip = newSkip;
        }
        return String(Math.max(skip, take));
      },
      inputs: [
        '4\n3 4 2 3',
        '6\n2 2 3 3 3 4',
        '3\n1 1 1',
        '1\n7',
        '5\n5 5 5 5 5',
        '5\n1 2 3 4 5',
        '6\n10 10 1 1 1 1',
        '7\n1 2 2 3 3 3 4',
      ],
    },
    {
      key: '20',
      title: 'Tổng đoạn con liền nhau lớn nhất khi được xóa một phần tử',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm). Em được phép **xóa nhiều nhất một** phần tử trong đoạn con liền nhau đã chọn (hoặc không xóa phần tử nào).\n\n' +
        'Hãy tìm tổng lớn nhất của một đoạn con liền nhau không rỗng sau khi có thể xóa tối đa một phần tử (đoạn còn lại phải không rỗng).',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất.',
      note: 'noDel[i] = đoạn không xóa kết thúc tại i (Kadane); oneDel[i] = max(noDel[i-1], oneDel[i-1] + a[i]).',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let noDel = a[0],
          oneDel = a[0],
          best = a[0];
        for (let i = 1; i < n; i++) {
          oneDel = Math.max(noDel, oneDel + a[i]);
          noDel = Math.max(a[i], noDel + a[i]);
          best = Math.max(best, noDel, oneDel);
        }
        return String(best);
      },
      inputs: [
        '5\n1 -2 0 3 0',
        '5\n1 -2 -2 3 0',
        '1\n-5',
        '4\n-1 -1 -1 -1',
        '6\n5 -2 5 -2 5 -100',
        '3\n2 2 2',
        '4\n0 0 0 0',
        '7\n-1 4 -1 -1 4 -1 -1',
      ],
    },
    {
      key: '21',
      title: 'Tổng đoạn con liền nhau nhỏ nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm). Hãy tìm tổng **nhỏ nhất** của một đoạn con liền nhau không rỗng.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng nhỏ nhất tìm được.',
      note: 'Kadane ngược dấu: cur = min(a[i], cur + a[i]); cập nhật theo cur.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let cur = a[0],
          best = a[0];
        for (let i = 1; i < a.length; i++) {
          cur = Math.min(a[i], cur + a[i]);
          best = Math.min(best, cur);
        }
        return String(best);
      },
      inputs: [
        '6\n3 -4 2 -3 -1 7',
        '5\n1 2 3 4 5',
        '1\n-5',
        '4\n-1 -2 -3 -4',
        '5\n-1 -1 -1 -1 -1',
        '4\n2 2 2 2',
        '4\n0 0 0 0',
        '6\n4 -100 4 -100 4 4',
      ],
    },
    {
      key: '22',
      title: 'Tổng đoạn con lớn nhất trên mảng vòng tròn',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm) xếp thành **vòng tròn**: sau phần tử cuối lại tới phần tử đầu. Một đoạn con liền nhau có thể vòng qua đầu mảng, nhưng mỗi phần tử chỉ được dùng nhiều nhất một lần.\n\n' +
        'Hãy tìm tổng lớn nhất của một đoạn con liền nhau không rỗng trên vòng tròn.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất.',
      note: 'Đáp án = max(maxKadane, total - minKadane); nếu tất cả đều âm thì lấy maxKadane.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let total = 0;
        let maxCur = a[0],
          maxBest = a[0];
        let minCur = a[0],
          minBest = a[0];
        for (let i = 0; i < n; i++) {
          total += a[i];
          if (i > 0) {
            maxCur = Math.max(a[i], maxCur + a[i]);
            maxBest = Math.max(maxBest, maxCur);
            minCur = Math.min(a[i], minCur + a[i]);
            minBest = Math.min(minBest, minCur);
          }
        }
        if (maxBest < 0) return String(maxBest);
        return String(Math.max(maxBest, total - minBest));
      },
      inputs: [
        '5\n1 -2 3 -2 5',
        '3\n5 -3 5',
        '1\n-5',
        '4\n-1 -2 -3 -4',
        '5\n-3 -2 -3 -2 -3',
        '4\n3 3 3 3',
        '4\n0 0 0 0',
        '6\n8 -1 -8 8 -1 -8',
      ],
    },
    {
      key: '23',
      title: 'Đoạn núi liền nhau dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một "đoạn núi" là một đoạn **liền nhau** có độ dài ít nhất $3$, trong đó dãy tăng nghiêm ngặt tới một đỉnh duy nhất rồi giảm nghiêm ngặt.\n\n' +
        'Hãy tìm độ dài đoạn núi liền nhau dài nhất; in ra $0$ nếu không có đoạn núi nào.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$.',
      outputDesc: 'In ra độ dài đoạn núi dài nhất, hoặc $0$.',
      note: 'Tính up[i] (độ dài dốc lên tới i) và down[i] (độ dài dốc xuống từ i); với đỉnh i lấy up[i] + down[i] - 1 khi cả hai > 1.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        if (n < 3) return '0';
        const up = new Array(n).fill(1);
        const down = new Array(n).fill(1);
        for (let i = 1; i < n; i++) if (a[i] > a[i - 1]) up[i] = up[i - 1] + 1;
        for (let i = n - 2; i >= 0; i--)
          if (a[i] > a[i + 1]) down[i] = down[i + 1] + 1;
        let best = 0;
        for (let i = 0; i < n; i++) {
          if (up[i] > 1 && down[i] > 1) {
            const len = up[i] + down[i] - 1;
            if (len > best) best = len;
          }
        }
        return String(best);
      },
      inputs: [
        '9\n2 1 4 7 3 2 5 0 1',
        '4\n2 2 2 2',
        '5\n1 2 3 4 5',
        '1\n5',
        '3\n1 3 2',
        '5\n5 4 3 2 1',
        '7\n0 1 2 3 2 1 0',
        '6\n1 3 1 3 1 3',
      ],
    },
    {
      key: '24',
      title: 'Đoạn cấp số cộng liền nhau dài nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một đoạn **liền nhau** là cấp số cộng nếu hiệu giữa hai phần tử liên tiếp trong đoạn luôn bằng nhau. Mọi đoạn độ dài $1$ hoặc $2$ đều được coi là cấp số cộng.\n\n' +
        'Hãy tìm độ dài đoạn cấp số cộng liền nhau dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$.',
      outputDesc: 'In ra độ dài đoạn cấp số cộng liền nhau dài nhất.',
      note: 'Nếu a[i] - a[i-1] == a[i-1] - a[i-2] thì độ dài hiện tại tăng 1, ngược lại đặt lại về 2.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        if (n === 1) return '1';
        let cur = 2,
          best = 2;
        for (let i = 2; i < n; i++) {
          if (a[i] - a[i - 1] === a[i - 1] - a[i - 2]) cur++;
          else cur = 2;
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '6\n1 3 5 7 2 4',
        '4\n10 7 4 1',
        '1\n9',
        '2\n3 8',
        '5\n5 5 5 5 5',
        '5\n1 2 4 7 11',
        '7\n2 4 6 1 2 3 4',
        '4\n4 4 4 4',
      ],
    },
    {
      key: '25',
      title: 'Dãy con cấp số cộng dài nhất với công sai cho trước',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên và một số nguyên $d$. Một "dãy con" (giữ nguyên thứ tự, xóa bớt phần tử) là cấp số cộng công sai $d$ nếu mỗi phần tử lớn hơn phần tử đứng trước nó trong dãy con đúng $d$ đơn vị.\n\n' +
        'Hãy tìm độ dài dãy con cấp số cộng công sai $d$ dài nhất.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $d$ $(1 \\le n \\le 10^5,\\ -10^4 \\le d \\le 10^4)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra độ dài dãy con dài nhất.',
      note: 'Với mỗi a[i], dp[a[i]] = dp[a[i] - d] + 1; dùng map theo giá trị.',
      solve: (input) => {
        const ls = lines(input);
        const d = readInts(ls[0])[1];
        const a = readInts(ls[1]);
        const dp = new Map<number, number>();
        let best = 1;
        for (const x of a) {
          const prev = dp.get(x - d) ?? 0;
          const cur = prev + 1;
          dp.set(x, cur);
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '6 1\n1 2 3 4 5 6',
        '5 2\n1 3 5 2 4',
        '1 3\n7',
        '5 0\n4 4 4 4 4',
        '5 -1\n5 4 3 2 1',
        '6 2\n1 2 4 6 8 3',
        '4 5\n1 1 1 1',
        '7 1\n3 1 2 3 4 1 5',
      ],
    },
    {
      key: '26',
      title: 'Số phép xóa ít nhất để mảng không giảm',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Mỗi phép xóa loại bỏ một phần tử khỏi dãy (các phần tử còn lại giữ nguyên thứ tự).\n\n' +
        'Hãy tìm số phép xóa **ít nhất** để dãy còn lại là dãy không giảm (mỗi phần tử không nhỏ hơn phần tử đứng trước).',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 2000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra số phép xóa ít nhất.',
      note: 'Đáp án = n - độ dài dãy con không giảm dài nhất.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const dp = new Array(n).fill(1);
        let best = 1;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (a[j] <= a[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
          }
          if (dp[i] > best) best = dp[i];
        }
        return String(n - best);
      },
      inputs: [
        '6\n5 1 2 2 3 1',
        '4\n1 2 3 4',
        '1\n9',
        '5\n5 4 3 2 1',
        '4\n7 7 7 7',
        '6\n3 3 1 1 2 2',
        '5\n1 2 1 2 1',
        '7\n9 1 2 3 4 5 0',
      ],
    },
    {
      key: '27',
      title: 'Tổng dãy con xen kẽ lớn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Em chọn một dãy con không rỗng (giữ nguyên thứ tự). Giá trị của dãy con là phần tử đầu **trừ** phần tử thứ hai **cộng** phần tử thứ ba **trừ** phần tử thứ tư... (dấu cộng/trừ xen kẽ theo thứ tự được chọn).\n\n' +
        'Hãy tìm giá trị lớn nhất có thể đạt được.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra giá trị lớn nhất.',
      note: 'Hai trạng thái: odd = tổng tốt nhất kết thúc ở vị trí lẻ (sắp cộng số tiếp), even = kết thúc ở vị trí chẵn (sắp trừ).',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let odd = -Infinity, // dãy con có độ dài lẻ (giá trị cuối được cộng)
          even = -Infinity; // dãy con có độ dài chẵn (giá trị cuối bị trừ)
        for (const x of a) {
          const newOdd = Math.max(odd, (even === -Infinity ? 0 : even) + x, x);
          const newEven = odd === -Infinity ? even : Math.max(even, odd - x);
          odd = newOdd;
          even = newEven;
        }
        return String(Math.max(odd, even));
      },
      inputs: [
        '5\n1 2 3 4 5',
        '4\n4 2 5 3',
        '1\n7',
        '5\n5 4 3 2 1',
        '4\n4 4 4 4',
        '5\n-1 -2 -3 -4 -5',
        '4\n0 0 0 0',
        '6\n1 9 2 8 3 7',
      ],
    },
    {
      key: '28',
      title: 'Tích đoạn con liền nhau nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm). Hãy tìm tích **nhỏ nhất** của một đoạn con liền nhau không rỗng.\n\n' +
        'Lưu ý: tích có thể âm; cần theo dõi cả tích lớn nhất lẫn nhỏ nhất tới mỗi vị trí.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10 \\le a_i \\le 10)$.',
      outputDesc: 'In ra tích nhỏ nhất.',
      note: 'Giữ đồng thời maxCur và minCur; đáp án bám theo minCur.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let maxCur = a[0],
          minCur = a[0],
          best = a[0];
        for (let i = 1; i < a.length; i++) {
          const x = a[i];
          const cand = [x, maxCur * x, minCur * x];
          maxCur = Math.max(...cand);
          minCur = Math.min(...cand);
          best = Math.min(best, minCur);
        }
        return String(best);
      },
      inputs: [
        '4\n2 3 -2 4',
        '3\n-2 0 -1',
        '5\n-2 3 -4 1 2',
        '1\n-3',
        '4\n2 2 2 2',
        '5\n-1 -1 -1 -1 -1',
        '4\n0 0 0 0',
        '6\n1 -2 3 -4 5 -6',
      ],
    },
    {
      key: '29',
      title: 'Kẻ trộm giãn cách',
      difficulty: 'MEDIUM',
      story:
        'Trên một con phố có $n$ ngôi nhà xếp thành hàng, nhà thứ $i$ cất giữ $a_i$ đồng. Một tên trộm cẩn thận: nếu hắn trộm hai ngôi nhà thì hai nhà đó phải cách nhau **ít nhất $3$ vị trí** (tức nếu chọn vị trí $i$ và $j$ với $i < j$ thì $j - i \\ge 3$).\n\n' +
        'Hãy tính số tiền lớn nhất tên trộm có thể lấy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra số tiền lớn nhất.',
      note: 'dp[i] = max(dp[i-1], a[i] + best của dp tới i-3); giữ tiền tố lớn nhất của dp tới i-3.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const dp = new Array(n).fill(0);
        // bestUpTo[i] = max dp[0..i]
        let best3 = 0; // max dp[j] với j <= i - 3
        for (let i = 0; i < n; i++) {
          if (i >= 3) best3 = Math.max(best3, dp[i - 3]);
          dp[i] = Math.max(i > 0 ? dp[i - 1] : 0, a[i] + best3);
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '6\n5 1 1 5 1 5',
        '4\n2 7 9 3',
        '1\n10',
        '3\n5 5 5',
        '5\n5 4 3 2 1',
        '4\n0 0 0 0',
        '7\n9 9 9 9 9 9 9',
        '6\n1 2 3 4 5 6',
      ],
    },
    {
      key: '30',
      title: 'Đếm bộ ba tăng nghiêm ngặt',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Hãy đếm số bộ ba chỉ số $(i, j, k)$ với $i < j < k$ sao cho $a_i < a_j < a_k$ (đây chính là số dãy con tăng nghiêm ngặt độ dài đúng $3$).',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 3000)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$. Đảm bảo kết quả nằm trong số nguyên an toàn.',
      outputDesc: 'In ra số bộ ba thỏa mãn.',
      note: 'Với mỗi j làm phần tử giữa, đếm số phần tử nhỏ hơn a[j] bên trái và lớn hơn a[j] bên phải rồi nhân lại.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let total = 0;
        for (let j = 0; j < n; j++) {
          let left = 0,
            right = 0;
          for (let i = 0; i < j; i++) if (a[i] < a[j]) left++;
          for (let k = j + 1; k < n; k++) if (a[k] > a[j]) right++;
          total += left * right;
        }
        return String(total);
      },
      inputs: [
        '5\n1 2 3 4 5',
        '4\n3 1 2 4',
        '1\n5',
        '3\n3 2 1',
        '4\n7 7 7 7',
        '5\n5 4 3 2 1',
        '6\n1 1 2 2 3 3',
        '6\n2 1 4 3 6 5',
      ],
    },
    {
      key: '31',
      title: 'Tổng đoạn con lớn nhất khi được nhân đôi một phần tử',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm). Trước khi chọn đoạn con, em được phép **nhân đôi giá trị của đúng một phần tử** bất kỳ trong mảng (bắt buộc nhân đôi đúng một phần tử).\n\n' +
        'Hãy tìm tổng lớn nhất của một đoạn con liền nhau không rỗng sau khi đã nhân đôi một phần tử.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất sau khi nhân đôi một phần tử.',
      note: 'Hai trạng thái Kadane: noDouble[i] = đoạn chưa nhân đôi; oneDouble[i] = đoạn đã nhân đôi đúng một phần tử. Phần tử nhân đôi có thể nằm ngoài đoạn được chọn nên đáp án cũng so với Kadane thường.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        if (n === 1) return String(2 * a[0]); // bắt buộc nhân đôi phần tử duy nhất
        let noDouble = a[0]; // Kadane thường, kết thúc tại i
        let oneDouble = 2 * a[0]; // đã nhân đôi một phần tử, kết thúc tại i
        // best so với Kadane thường (nhân đôi một phần tử bất kỳ ngoài đoạn, hợp lệ khi n>=2)
        let best = Math.max(noDouble, oneDouble);
        for (let i = 1; i < n; i++) {
          const x = a[i];
          // đã nhân đôi: hoặc nhân đôi phần tử x ngay tại i, hoặc x bình thường nối vào đoạn đã nhân đôi
          oneDouble = Math.max(2 * x, noDouble + 2 * x, oneDouble + x);
          noDouble = Math.max(x, noDouble + x);
          if (oneDouble > best) best = oneDouble;
          if (noDouble > best) best = noDouble;
        }
        return String(best);
      },
      inputs: [
        '5\n1 -2 3 -2 5',
        '4\n1 2 3 4',
        '1\n-5',
        '5\n-1 -1 -1 -1 -1',
        '4\n-3 -2 -1 -4',
        '1\n7',
        '4\n0 0 0 0',
        '6\n5 -10 5 5 -10 5',
      ],
    },
    {
      key: '32',
      title: 'Đoạn tăng liền nhau dài nhất khi được sửa một phần tử',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Em được phép thay đổi giá trị của **nhiều nhất một** phần tử thành một số nguyên bất kỳ (hoặc không thay đổi gì).\n\n' +
        'Sau khi (có thể) thay đổi, hãy tìm độ dài đoạn **liền nhau** tăng nghiêm ngặt dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài đoạn tăng liền nhau dài nhất sau khi sửa nhiều nhất một phần tử.',
      note: 'left[i] = độ dài đoạn tăng kết thúc tại i; right[i] = độ dài đoạn tăng bắt đầu tại i. Thử bỏ/sửa từng vị trí; nếu a[i+1] - a[i-1] >= 2 thì nối được hai bên.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const left = new Array(n).fill(1);
        const right = new Array(n).fill(1);
        for (let i = 1; i < n; i++) if (a[i] > a[i - 1]) left[i] = left[i - 1] + 1;
        for (let i = n - 2; i >= 0; i--) if (a[i] < a[i + 1]) right[i] = right[i + 1] + 1;
        let best = 1;
        for (let i = 0; i < n; i++) if (left[i] > best) best = left[i];
        for (let i = 0; i < n; i++) {
          // sửa phần tử i: nối left[i-1] và right[i+1]
          let cand = 1;
          const l = i > 0 ? left[i - 1] : 0;
          const r = i < n - 1 ? right[i + 1] : 0;
          if (i > 0 && i < n - 1) {
            if (a[i + 1] - a[i - 1] >= 2) cand = l + 1 + r;
            else cand = Math.max(l, r) + 1;
          } else {
            cand = l + r + 1;
          }
          if (cand > best) best = cand;
        }
        return String(Math.min(best, n));
      },
      inputs: [
        '5\n1 2 5 3 5',
        '6\n1 2 3 4 5 6',
        '1\n5',
        '5\n5 4 3 2 1',
        '4\n7 7 7 7',
        '3\n1 1 1',
        '7\n2 3 1 5 6 1 2',
        '5\n1 3 2 4 6',
      ],
    },
    {
      key: '33',
      title: 'Đếm đoạn cấp số cộng liền nhau',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Hãy đếm số đoạn **liền nhau** có độ dài ít nhất $3$ tạo thành một cấp số cộng (hiệu giữa hai phần tử liên tiếp trong đoạn luôn bằng nhau).\n\n' +
        'Hai đoạn được coi là khác nhau nếu chúng bắt đầu hoặc kết thúc ở vị trí khác nhau.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$. Đảm bảo kết quả nằm trong số nguyên an toàn.',
      outputDesc: 'In ra số đoạn cấp số cộng liền nhau có độ dài $\\ge 3$.',
      note: 'Đếm chuỗi liên tiếp có cùng hiệu; mỗi khi chuỗi kéo dài thêm, cộng số đoạn mới kết thúc tại vị trí hiện tại.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let total = 0;
        let cur = 0; // số đoạn (>=3) kết thúc tại i
        for (let i = 2; i < n; i++) {
          if (a[i] - a[i - 1] === a[i - 1] - a[i - 2]) {
            cur += 1;
            total += cur;
          } else {
            cur = 0;
          }
        }
        return String(total);
      },
      inputs: [
        '5\n1 2 3 4 5',
        '4\n1 3 5 7',
        '1\n5',
        '5\n5 5 5 5 5',
        '6\n1 2 4 7 11 16',
        '3\n1 2 4',
        '2\n3 8',
        '7\n7 7 7 1 2 3 4',
      ],
    },
    {
      key: '34',
      title: 'Đoạn con liền nhau có tích dương dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm, có thể bằng $0$). Hãy tìm độ dài của đoạn **liền nhau** dài nhất sao cho tích các phần tử trong đoạn là số **dương** (lớn hơn $0$).\n\n' +
        'Nếu không có đoạn nào có tích dương, in ra $0$.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra độ dài đoạn liền nhau có tích dương dài nhất.',
      note: 'Giữ pos = độ dài đoạn kết thúc tại i có tích dương, neg = độ dài đoạn có tích âm; số 0 đặt lại cả hai về 0.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let pos = 0,
          neg = 0,
          best = 0;
        for (let i = 0; i < n; i++) {
          if (a[i] === 0) {
            pos = 0;
            neg = 0;
          } else if (a[i] > 0) {
            pos = pos + 1;
            neg = neg > 0 ? neg + 1 : 0;
          } else {
            const newPos = neg > 0 ? neg + 1 : 0;
            const newNeg = pos + 1;
            pos = newPos;
            neg = newNeg;
          }
          if (pos > best) best = pos;
        }
        return String(best);
      },
      inputs: [
        '5\n1 -2 -3 4 5',
        '4\n1 2 3 4',
        '1\n-5',
        '4\n0 0 0 0',
        '5\n-1 -1 -1 -1 -1',
        '1\n3',
        '6\n-1 2 0 3 -4 -5',
        '5\n0 1 -2 -3 4',
      ],
    },
    {
      key: '35',
      title: 'Tổng lớn nhất của hai đoạn con liền nhau rời nhau',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên (có thể âm) với $n \\ge 2$. Hãy chọn **hai** đoạn con liền nhau không rỗng, **không giao nhau** (đoạn thứ nhất hoàn toàn nằm trước đoạn thứ hai).\n\n' +
        'Hãy tìm tổng lớn nhất của tổng hai đoạn đó.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(2 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất của hai đoạn con rời nhau.',
      note: 'prefBest[i] = tổng đoạn con lớn nhất nằm hoàn toàn trong a[0..i]; sufStart[i] = tổng đoạn con lớn nhất BẮT ĐẦU tại i; ghép sufStart[i] với prefBest[i-1].',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        // prefBest[i] = tổng đoạn con lớn nhất nằm hoàn toàn trong a[0..i]
        const prefBest = new Array(n).fill(0);
        let cur = a[0];
        prefBest[0] = a[0];
        for (let i = 1; i < n; i++) {
          cur = Math.max(a[i], cur + a[i]);
          prefBest[i] = Math.max(prefBest[i - 1], cur);
        }
        // sufStart[i] = tổng đoạn con lớn nhất bắt đầu chính xác tại i
        const sufStart = new Array(n).fill(0);
        sufStart[n - 1] = a[n - 1];
        for (let i = n - 2; i >= 0; i--) {
          sufStart[i] = a[i] + Math.max(0, sufStart[i + 1]);
        }
        // đoạn thứ hai bắt đầu tại i (>=1), đoạn thứ nhất nằm hoàn toàn trong a[0..i-1]
        let ans = -Infinity;
        for (let i = 1; i < n; i++) {
          ans = Math.max(ans, sufStart[i] + prefBest[i - 1]);
        }
        return String(ans);
      },
      inputs: [
        '5\n1 2 -1 3 4',
        '4\n1 2 3 4',
        '2\n-1 -2',
        '5\n-1 -2 -3 -4 -5',
        '6\n5 -100 5 5 -100 5',
        '2\n7 8',
        '4\n0 0 0 0',
        '7\n3 -1 4 -1 5 -1 2',
      ],
    },
    {
      key: '36',
      title: 'Mua bán cổ phiếu tối đa K lần',
      difficulty: 'MEDIUM',
      story:
        'Giá cổ phiếu trong $n$ ngày được cho bởi dãy $p_1, \\dots, p_n$. Em được thực hiện **tối đa $K$** giao dịch (mỗi giao dịch gồm một lần mua rồi một lần bán; phải bán xong mới được mua lại).\n\n' +
        'Hãy tìm lợi nhuận lớn nhất.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $K$ $(1 \\le n \\le 1000,\\ 0 \\le K \\le 100)$. Dòng thứ hai chứa $n$ số nguyên $p_1, \\dots, p_n$ $(0 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra lợi nhuận lớn nhất.',
      note: 'Với mỗi giao dịch t, giữ buy[t] = max(buy[t], sell[t-1] - p) và sell[t] = max(sell[t], buy[t] + p).',
      solve: (input) => {
        const ls = lines(input);
        const K = readInts(ls[0])[1];
        const p = readInts(ls[1]);
        if (K === 0) return '0';
        const buy = new Array(K + 1).fill(-Infinity);
        const sell = new Array(K + 1).fill(0);
        for (const price of p) {
          for (let t = 1; t <= K; t++) {
            buy[t] = Math.max(buy[t], sell[t - 1] - price);
            sell[t] = Math.max(sell[t], buy[t] + price);
          }
        }
        return String(sell[K]);
      },
      inputs: [
        '6 2\n7 1 5 3 6 4',
        '5 2\n2 4 1 7 9',
        '1 3\n5',
        '5 0\n1 2 3 4 5',
        '5 10\n5 4 3 2 1',
        '4 1\n4 4 4 4',
        '6 3\n0 0 0 0 0 0',
        '6 2\n1 2 4 2 5 7',
      ],
    },
    {
      key: '37',
      title: 'Phân hoạch thành ít đoạn tăng nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên. Em cần chia dãy thành các đoạn **liền nhau**, mỗi đoạn là một dãy tăng nghiêm ngặt.\n\n' +
        'Hãy tìm số đoạn **ít nhất** cần dùng để phân hoạch toàn bộ dãy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra số đoạn tăng nghiêm ngặt ít nhất.',
      note: 'Tham lam: bắt đầu một đoạn mới mỗi khi a[i] <= a[i-1]; đếm số đoạn.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let segments = 1;
        for (let i = 1; i < n; i++) {
          if (a[i] <= a[i - 1]) segments++;
        }
        return String(segments);
      },
      inputs: [
        '6\n1 2 3 1 2 1',
        '5\n1 2 3 4 5',
        '1\n7',
        '5\n5 4 3 2 1',
        '4\n7 7 7 7',
        '3\n1 1 1',
        '6\n1 3 2 4 3 5',
        '7\n5 6 7 1 2 3 4',
      ],
    },
    {
      key: '38',
      title: 'Chọn phần tử không kề nhau với số lượng giới hạn',
      difficulty: 'MEDIUM',
      story:
        'Trên một con phố có $n$ ngôi nhà, nhà thứ $i$ cất giữ $a_i$ đồng. Tên trộm không được trộm hai nhà **kề nhau**, và vì cảnh giác nên hắn chỉ trộm **nhiều nhất $m$** nhà.\n\n' +
        'Hãy tính số tiền lớn nhất tên trộm có thể lấy.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $m$ $(1 \\le n \\le 1000,\\ 0 \\le m \\le n)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra số tiền lớn nhất.',
      note: 'dp[i][j][s]: xét tới nhà i, đã trộm j nhà, s = có trộm nhà i hay không. Có thể ép gọn theo hàng.',
      solve: (input) => {
        const ls = lines(input);
        const m = readInts(ls[0])[1];
        const a = readInts(ls[1]);
        const n = a.length;
        const NEG = -Infinity;
        // skip[j] = tiền lớn nhất xét tới i, dùng j nhà, nhà i KHÔNG trộm
        // take[j] = ..., nhà i CÓ trộm
        let skip = new Array(m + 1).fill(NEG);
        let take = new Array(m + 1).fill(NEG);
        skip[0] = 0;
        for (let i = 0; i < n; i++) {
          const nSkip = new Array(m + 1).fill(NEG);
          const nTake = new Array(m + 1).fill(NEG);
          for (let j = 0; j <= m; j++) {
            const prevBest = Math.max(skip[j], take[j]);
            if (prevBest > nSkip[j]) nSkip[j] = prevBest; // không trộm nhà i
            if (j >= 1 && skip[j - 1] !== NEG) {
              // trộm nhà i: nhà trước phải không trộm
              const v = skip[j - 1] + a[i];
              if (v > nTake[j]) nTake[j] = v;
            }
          }
          skip = nSkip;
          take = nTake;
        }
        let best = 0;
        for (let j = 0; j <= m; j++) {
          best = Math.max(best, skip[j], take[j]);
        }
        return String(best);
      },
      inputs: [
        '5 2\n2 7 9 3 1',
        '4 1\n1 2 3 1',
        '1 0\n10',
        '5 0\n5 4 3 2 1',
        '6 3\n6 1 1 6 1 6',
        '3 3\n5 5 5',
        '4 4\n0 0 0 0',
        '6 2\n10 1 10 1 10 1',
      ],
    },
    {
      key: '39',
      title: 'Dãy con xen kẽ chẵn lẻ dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một "dãy con xen kẽ chẵn lẻ" là dãy con (giữ nguyên thứ tự, xóa bớt phần tử) sao cho hai phần tử liên tiếp luôn khác tính chẵn/lẻ (một chẵn một lẻ).\n\n' +
        'Hãy tìm độ dài của dãy con xen kẽ chẵn lẻ dài nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài dãy con xen kẽ chẵn lẻ dài nhất.',
      note: 'Giữ best kết thúc bằng số chẵn và best kết thúc bằng số lẻ; mỗi phần tử nối vào dãy có parity ngược lại.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        let evenLen = 0,
          oddLen = 0;
        for (const x of a) {
          const par = ((x % 2) + 2) % 2;
          if (par === 0) {
            evenLen = Math.max(evenLen, oddLen + 1);
          } else {
            oddLen = Math.max(oddLen, evenLen + 1);
          }
        }
        return String(Math.max(evenLen, oddLen));
      },
      inputs: [
        '5\n1 2 3 4 5',
        '4\n2 4 6 8',
        '1\n7',
        '5\n1 3 5 7 9',
        '4\n2 2 2 2',
        '1\n4',
        '6\n1 1 2 2 3 3',
        '7\n-1 -2 -3 -4 -5 -6 -7',
      ],
    },
    {
      key: '40',
      title: 'Tổng lớn nhất của đoạn con liền nhau độ dài đúng L',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên và một số nguyên $L$ với $1 \\le L \\le n$. Hãy tìm tổng lớn nhất của một đoạn con **liền nhau** có độ dài **đúng** $L$.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $L$ $(1 \\le L \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^4 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lớn nhất của đoạn độ dài đúng $L$.',
      note: 'Cửa sổ trượt: tính tổng L phần tử đầu, rồi trượt cộng phần tử mới trừ phần tử cũ.',
      solve: (input) => {
        const ls = lines(input);
        const L = readInts(ls[0])[1];
        const a = readInts(ls[1]);
        const n = a.length;
        let sum = 0;
        for (let i = 0; i < L; i++) sum += a[i];
        let best = sum;
        for (let i = L; i < n; i++) {
          sum += a[i] - a[i - L];
          if (sum > best) best = sum;
        }
        return String(best);
      },
      inputs: [
        '5 2\n1 2 3 4 5',
        '6 3\n2 1 5 1 3 2',
        '1 1\n7',
        '5 5\n5 4 3 2 1',
        '4 1\n-1 -2 -3 -4',
        '4 4\n0 0 0 0',
        '5 2\n-5 -1 -1 -5 -2',
        '6 3\n3 -2 5 -1 4 -3',
      ],
    },
    {
      key: '41',
      title: 'Dãy con liền nhau hơn kém nhau đúng một đơn vị dài nhất',
      difficulty: 'EASY',
      story:
        'Cho một dãy gồm $n$ số nguyên. Hãy tìm độ dài đoạn **liền nhau** dài nhất sao cho hai phần tử kề nhau trong đoạn hơn kém nhau **đúng $1$ đơn vị** (tức $|a_i - a_{i-1}| = 1$).',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài đoạn liền nhau dài nhất thỏa điều kiện.',
      note: 'Nếu |a[i] - a[i-1]| == 1 thì độ dài hiện tại tăng 1, ngược lại đặt lại về 1.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let cur = 1,
          best = 1;
        for (let i = 1; i < n; i++) {
          if (Math.abs(a[i] - a[i - 1]) === 1) cur++;
          else cur = 1;
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '6\n1 2 3 2 1 5',
        '4\n5 6 7 8',
        '1\n9',
        '5\n5 5 5 5 5',
        '5\n1 3 5 7 9',
        '4\n0 0 0 0',
        '7\n3 2 3 4 3 2 0',
        '5\n-2 -1 0 1 2',
      ],
    },
    {
      key: '42',
      title: 'Kẻ trộm với thời gian nghỉ thay đổi',
      difficulty: 'MEDIUM',
      story:
        'Trên một con phố có $n$ ngôi nhà. Nhà thứ $i$ cất giữ $a_i$ đồng; nếu tên trộm trộm nhà $i$ thì hệ thống báo động khiến hắn phải **bỏ qua $b_i$ nhà kế tiếp** (tức nếu trộm nhà $i$ thì nhà kế tiếp có thể trộm là nhà $i + b_i + 1$).\n\n' +
        'Hãy tính số tiền lớn nhất tên trộm có thể lấy.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$. Dòng thứ ba chứa $n$ số nguyên $b_1, \\dots, b_n$ $(0 \\le b_i \\le n)$.',
      outputDesc: 'In ra số tiền lớn nhất.',
      note: 'dp[i] = số tiền lớn nhất khi xét từ nhà i tới cuối; dp[i] = max(dp[i+1], a[i] + dp[i + b[i] + 1]).',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1]);
        const b = readInts(ls[2]);
        const n = a.length;
        const dp = new Array(n + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) {
          const next = Math.min(n, i + b[i] + 1);
          dp[i] = Math.max(dp[i + 1], a[i] + dp[next]);
        }
        return String(dp[0]);
      },
      inputs: [
        '4\n1 2 3 1\n1 1 1 1',
        '3\n5 5 5\n0 0 0',
        '1\n10\n0',
        '5\n2 7 9 3 1\n2 2 2 2 2',
        '4\n4 4 4 4\n3 3 3 3',
        '3\n0 0 0\n1 1 1',
        '5\n5 4 3 2 1\n0 0 0 0 0',
        '6\n6 1 1 6 1 6\n1 0 1 0 1 0',
      ],
    },
    {
      key: '43',
      title: 'Trò chơi nhảy chi phí nhỏ nhất',
      difficulty: 'MEDIUM',
      story:
        'Em đứng ở ô $0$ của một dãy $n$ ô (đánh số từ $0$ tới $n-1$). Từ ô $i$ em được nhảy tới một trong các ô $i+1, i+2, \\dots, i+k$ (không vượt quá ô cuối); khi nhảy tới ô $j$ em phải trả chi phí $a_j$.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để đi từ ô $0$ tới ô $n-1$ (chi phí của ô $0$ không tính).',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $k$ $(1 \\le n \\le 10^5,\\ 1 \\le k \\le n)$. Dòng thứ hai chứa $n$ số nguyên $a_0, \\dots, a_{n-1}$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng chi phí nhỏ nhất.',
      note: 'dp[j] = a[j] + min(dp[j-k..j-1]); dùng hàng đợi đơn điệu hoặc duyệt trực tiếp khi k nhỏ.',
      solve: (input) => {
        const ls = lines(input);
        const k = readInts(ls[0])[1];
        const a = readInts(ls[1]);
        const n = a.length;
        const dp = new Array(n).fill(Infinity);
        dp[0] = 0;
        for (let j = 1; j < n; j++) {
          let best = Infinity;
          for (let i = Math.max(0, j - k); i < j; i++) {
            if (dp[i] < best) best = dp[i];
          }
          dp[j] = best + a[j];
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '5 2\n0 3 2 5 1',
        '4 1\n0 1 2 3',
        '1 1\n5',
        '5 4\n0 9 9 9 1',
        '4 4\n0 0 0 0',
        '3 1\n0 7 7',
        '6 2\n0 100 1 100 1 100',
        '5 3\n0 5 4 3 2',
      ],
    },
    {
      key: '44',
      title: 'Đếm số cách tới ô cuối trong trò chơi nhảy',
      difficulty: 'MEDIUM',
      story:
        'Em đứng ở ô $0$ của một dãy $n$ ô. Ô thứ $i$ ghi số $a_i$ — từ ô $i$ em được nhảy tới bất kỳ ô nào trong khoảng $i+1, \\dots, i+a_i$ (không vượt quá ô cuối).\n\n' +
        'Hãy đếm số **cách** (số đường đi khác nhau) để đi từ ô $0$ tới ô $n-1$.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 25)$. Dòng thứ hai chứa $n$ số nguyên $a_0, \\dots, a_{n-1}$ $(0 \\le a_i \\le n)$. Đảm bảo kết quả nằm trong số nguyên an toàn.',
      outputDesc: 'In ra số đường đi khác nhau tới ô cuối.',
      note: 'ways[0] = 1; với mỗi i cộng ways[i] vào ways[i+1..i+a[i]]. Đáp án là ways[n-1].',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        const ways = new Array(n).fill(0);
        ways[0] = 1;
        for (let i = 0; i < n; i++) {
          if (ways[i] === 0) continue;
          const far = Math.min(i + a[i], n - 1);
          for (let j = i + 1; j <= far; j++) {
            ways[j] += ways[i];
          }
        }
        return String(ways[n - 1]);
      },
      inputs: [
        '5\n2 3 1 1 4',
        '4\n2 1 1 1',
        '1\n0',
        '5\n1 1 1 1 0',
        '4\n3 2 1 0',
        '3\n0 1 1',
        '6\n2 2 2 2 2 0',
        '5\n4 1 1 1 0',
      ],
    },
    {
      key: '45',
      title: 'Đoạn con liền nhau zigzag dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một đoạn **liền nhau** được gọi là **zigzag** nếu hiệu giữa các phần tử liên tiếp đổi dấu xen kẽ (lớn hơn rồi nhỏ hơn rồi lớn hơn..., không có hiệu nào bằng $0$). Đoạn độ dài $1$ luôn là zigzag.\n\n' +
        'Hãy tìm độ dài đoạn liền nhau zigzag dài nhất. (Khác bài "dãy con zigzag": ở đây các phần tử phải đứng kề nhau trong mảng.)',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$.',
      outputDesc: 'In ra độ dài đoạn liền nhau zigzag dài nhất.',
      note: 'up[i] = độ dài đoạn zigzag kết thúc tại i bằng bước tăng; down[i] tương tự bằng bước giảm; cập nhật theo dấu của a[i]-a[i-1].',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let up = 1,
          down = 1,
          best = 1;
        for (let i = 1; i < n; i++) {
          if (a[i] > a[i - 1]) {
            up = down + 1;
            down = 1;
          } else if (a[i] < a[i - 1]) {
            down = up + 1;
            up = 1;
          } else {
            up = 1;
            down = 1;
          }
          best = Math.max(best, up, down);
        }
        return String(best);
      },
      inputs: [
        '6\n1 7 4 9 2 5',
        '5\n1 2 3 4 5',
        '1\n5',
        '5\n5 5 5 5 5',
        '5\n5 4 3 2 1',
        '4\n0 0 0 0',
        '7\n1 3 2 4 3 5 5',
        '6\n3 1 4 1 5 9',
      ],
    },
    {
      key: '46',
      title: 'Đoạn thung lũng liền nhau dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên. Một "đoạn thung lũng" là một đoạn **liền nhau** có độ dài ít nhất $3$, trong đó dãy **giảm nghiêm ngặt** tới một đáy duy nhất rồi **tăng nghiêm ngặt**.\n\n' +
        'Hãy tìm độ dài đoạn thung lũng liền nhau dài nhất; in ra $0$ nếu không có đoạn thung lũng nào.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$.',
      outputDesc: 'In ra độ dài đoạn thung lũng dài nhất, hoặc $0$.',
      note: 'down[i] = độ dài dốc xuống tới i; up[i] = độ dài dốc lên từ i; với đáy i lấy down[i] + up[i] - 1 khi cả hai > 1.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        if (n < 3) return '0';
        const down = new Array(n).fill(1);
        const up = new Array(n).fill(1);
        for (let i = 1; i < n; i++) if (a[i] < a[i - 1]) down[i] = down[i - 1] + 1;
        for (let i = n - 2; i >= 0; i--) if (a[i] < a[i + 1]) up[i] = up[i + 1] + 1;
        let best = 0;
        for (let i = 0; i < n; i++) {
          if (down[i] > 1 && up[i] > 1) {
            const len = down[i] + up[i] - 1;
            if (len > best) best = len;
          }
        }
        return String(best);
      },
      inputs: [
        '9\n5 6 3 2 4 5 1 2 0',
        '4\n2 2 2 2',
        '5\n5 4 3 2 1',
        '1\n5',
        '3\n3 1 3',
        '5\n1 2 3 4 5',
        '7\n9 5 1 2 6 7 8',
        '6\n3 1 3 1 3 1',
      ],
    },
    {
      key: '47',
      title: 'Hứng nước mưa',
      difficulty: 'MEDIUM',
      story:
        'Cho dãy $n$ cột nước, cột thứ $i$ có độ cao $a_i$ và chiều rộng $1$. Khi trời mưa, nước đọng lại trong các "hố" giữa các cột cao hơn.\n\n' +
        'Hãy tính tổng lượng nước đọng lại được (đơn vị diện tích).',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 10^5)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lượng nước đọng lại.',
      note: 'leftMax[i] và rightMax[i]; nước tại cột i là min(leftMax[i], rightMax[i]) - a[i] (nếu dương).',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        if (n < 3) return '0';
        const leftMax = new Array(n).fill(0);
        const rightMax = new Array(n).fill(0);
        leftMax[0] = a[0];
        for (let i = 1; i < n; i++) leftMax[i] = Math.max(leftMax[i - 1], a[i]);
        rightMax[n - 1] = a[n - 1];
        for (let i = n - 2; i >= 0; i--) rightMax[i] = Math.max(rightMax[i + 1], a[i]);
        let total = 0;
        for (let i = 0; i < n; i++) {
          const water = Math.min(leftMax[i], rightMax[i]) - a[i];
          if (water > 0) total += water;
        }
        return String(total);
      },
      inputs: [
        '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        '6\n4 2 0 3 2 5',
        '1\n5',
        '5\n5 4 3 2 1',
        '4\n0 0 0 0',
        '5\n1 2 3 4 5',
        '3\n3 0 3',
        '7\n5 0 5 0 5 0 5',
      ],
    },
    {
      key: '48',
      title: 'Lập lịch công việc có trọng số',
      difficulty: 'MEDIUM',
      story:
        'Có $n$ công việc; việc thứ $i$ bắt đầu tại thời điểm $s_i$, kết thúc tại $e_i$ và đem lại lợi nhuận $p_i$. Hai việc được coi là **không chồng nhau** nếu việc này kết thúc trước hoặc đúng lúc việc kia bắt đầu.\n\n' +
        'Hãy chọn một tập các việc không chồng nhau sao cho tổng lợi nhuận lớn nhất.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 1000)$. Mỗi dòng trong $n$ dòng tiếp theo chứa ba số nguyên $s_i$, $e_i$, $p_i$ $(0 \\le s_i < e_i \\le 10^9,\\ 1 \\le p_i \\le 10^4)$.',
      outputDesc: 'In ra tổng lợi nhuận lớn nhất.',
      note: 'Sắp các việc theo thời điểm kết thúc; dp[i] = max(bỏ việc i, p_i + dp của việc cuối kết thúc <= s_i).',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0]);
        const jobs: { s: number; e: number; p: number }[] = [];
        for (let i = 1; i <= n; i++) {
          const [s, e, p] = readInts(ls[i]);
          jobs.push({ s, e, p });
        }
        jobs.sort((x, y) => x.e - y.e);
        const dp = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          let take = jobs[i].p;
          // tìm việc j cuối cùng có e <= jobs[i].s (tìm kiếm nhị phân)
          let lo = 0,
            hi = i - 1,
            idx = -1;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (jobs[mid].e <= jobs[i].s) {
              idx = mid;
              lo = mid + 1;
            } else {
              hi = mid - 1;
            }
          }
          if (idx >= 0) take += dp[idx];
          dp[i] = Math.max(i > 0 ? dp[i - 1] : 0, take);
        }
        return String(dp[n - 1]);
      },
      inputs: [
        '4\n1 2 50\n3 5 20\n6 19 100\n2 100 200',
        '3\n0 1 5\n1 2 6\n2 3 7',
        '1\n0 5 10',
        '3\n0 10 5\n0 10 5\n0 10 5',
        '4\n0 3 10\n3 6 10\n6 9 10\n0 9 25',
        '2\n0 1 100\n0 1 1',
        '3\n0 2 3\n1 3 4\n2 4 5',
        '5\n0 1 1\n1 2 1\n2 3 1\n3 4 1\n0 4 3',
      ],
    },
    {
      key: '49',
      title: 'Trò chơi lấy số từ hai đầu',
      difficulty: 'MEDIUM',
      story:
        'Có một dãy $n$ số nguyên. Hai người chơi luân phiên nhau; ở mỗi lượt người chơi lấy phần tử ở **đầu trái** hoặc **đầu phải** của dãy còn lại và cộng giá trị đó vào điểm của mình. Người đi trước đi đầu tiên. Cả hai chơi **tối ưu** để tối đa điểm của bản thân.\n\n' +
        'Hãy in ra điểm của người **đi trước** khi cả hai chơi tối ưu.',
      inputDesc:
        'Dòng đầu chứa số nguyên $n$ $(1 \\le n \\le 60)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(0 \\le a_i \\le 10^4)$.',
      outputDesc: 'In ra điểm của người đi trước.',
      note: 'dp[l][r] = chênh lệch (điểm người đang đi - đối thủ) tốt nhất trên đoạn [l,r]; điểm người đi trước = (tổng + dp[0][n-1]) / 2.',
      solve: (input) => {
        const a = readInts(lines(input)[1]);
        const n = a.length;
        let total = 0;
        for (const x of a) total += x;
        // diff[l][r] = chênh lệch tối ưu của người đang đi trên đoạn [l,r]
        const diff: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) diff[i][i] = a[i];
        for (let len = 2; len <= n; len++) {
          for (let l = 0; l + len - 1 < n; l++) {
            const r = l + len - 1;
            diff[l][r] = Math.max(a[l] - diff[l + 1][r], a[r] - diff[l][r - 1]);
          }
        }
        const d = diff[0][n - 1];
        return String((total + d) / 2);
      },
      inputs: [
        '4\n1 5 2 4',
        '3\n1 2 3',
        '1\n7',
        '4\n2 2 2 2',
        '5\n5 4 3 2 1',
        '2\n9 1',
        '6\n1 1 1 1 1 1',
        '5\n10 1 1 1 10',
      ],
    },
    {
      key: '50',
      title: 'Đếm dãy con tăng nghiêm ngặt độ dài L',
      difficulty: 'MEDIUM',
      story:
        'Cho một dãy gồm $n$ số nguyên và một số nguyên $L$. Hãy đếm số dãy con tăng nghiêm ngặt (giữ nguyên thứ tự, xóa bớt phần tử) có độ dài **đúng** $L$.\n\n' +
        'Đây là tổng quát hóa của bài đếm bộ ba tăng nghiêm ngặt.',
      inputDesc:
        'Dòng đầu chứa hai số nguyên $n$ và $L$ $(1 \\le L \\le n \\le 100)$. Dòng thứ hai chứa $n$ số nguyên $a_1, \\dots, a_n$ $(-10^9 \\le a_i \\le 10^9)$. Đảm bảo kết quả nằm trong số nguyên an toàn.',
      outputDesc: 'In ra số dãy con tăng nghiêm ngặt độ dài đúng $L$.',
      note: 'dp[i][t] = số dãy con tăng độ dài t kết thúc tại i; dp[i][t] = tổng dp[j][t-1] với j < i và a[j] < a[i].',
      solve: (input) => {
        const ls = lines(input);
        const L = readInts(ls[0])[1];
        const a = readInts(ls[1]);
        const n = a.length;
        // dp[i][t] = số dãy con tăng độ dài t kết thúc tại i
        const dp: number[][] = Array.from({ length: n }, () =>
          new Array(L + 1).fill(0)
        );
        for (let i = 0; i < n; i++) {
          dp[i][1] = 1;
          for (let t = 2; t <= L; t++) {
            for (let j = 0; j < i; j++) {
              if (a[j] < a[i]) dp[i][t] += dp[j][t - 1];
            }
          }
        }
        let total = 0;
        for (let i = 0; i < n; i++) total += dp[i][L];
        return String(total);
      },
      inputs: [
        '5 3\n1 2 3 4 5',
        '4 2\n3 1 2 4',
        '1 1\n5',
        '5 3\n5 4 3 2 1',
        '4 4\n7 7 7 7',
        '6 1\n1 2 3 4 5 6',
        '6 3\n1 1 2 2 3 3',
        '6 2\n2 1 4 3 6 5',
      ],
    },
  ],
};

export default course;

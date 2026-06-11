import { CourseSpec } from '../types';

/**
 * Chương 4 — DP trên chuỗi.
 * Mục tiêu: bảng dp hai chiều trên các ký tự: dãy con chung dài nhất, khoảng cách
 * chỉnh sửa, xâu đối xứng, đếm số cách giải mã/tạo chuỗi.
 *
 * NOTE cho người viết: không bao giờ tự gõ đáp án — luôn trả về từ solve(input).
 * 3 input đầu là test mẫu hiển thị. Chuỗi giữ ngắn để mọi giá trị (kể cả số đếm)
 * nằm trong số nguyên an toàn của JS.
 */

const lines = (input: string): string[] => input.replace(/\r/g, '').split('\n');
const firstLine = (input: string): string => lines(input)[0] ?? '';

const lcsLen = (s: string, t: string): number => {
  const m = s.length,
    n = t.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s[i - 1] === t[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
};

/** Độ dài dãy con đối xứng dài nhất (longest palindromic subsequence). */
const lpsLen = (s: string): number => {
  const n = s.length;
  if (n === 0) return 0;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      dp[i][j] = s[i] === s[j] ? dp[i + 1][j - 1] + 2 : Math.max(dp[i + 1][j], dp[i][j - 1]);
    }
  }
  return dp[0][n - 1];
};

const course: CourseSpec = {
  code: 'DP-BASIC-04',
  title: 'Chương 4: DP trên chuỗi',
  description:
    'Quy hoạch động trên các ký tự: dãy con chung dài nhất, khoảng cách chỉnh ' +
    'sửa, xâu đối xứng, đếm số cách giải mã và tạo chuỗi.',
  tags: ['quy-hoach-dong', 'co-ban', 'dp-chuoi', 'lcs', 'palindrome', 'edit-distance'],
  problems: [
    {
      key: '01',
      title: 'Dãy con chung dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho hai chuỗi $s$ và $t$. Một "dãy con chung" là chuỗi thu được bằng cách xóa bớt một số ký tự (giữ nguyên thứ tự) từ cả hai chuỗi sao cho kết quả giống nhau.\n\n' +
        'Hãy tìm độ dài của dãy con chung dài nhất.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài dãy con chung dài nhất.',
      note: 'dp[i][j] = dp[i-1][j-1] + 1 nếu s[i]=t[j], ngược lại max(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const ls = lines(input);
        return String(lcsLen(ls[0] ?? '', ls[1] ?? ''));
      },
      inputs: ['abcde\nace', 'abc\nabc', 'abc\ndef', 'aggtab\ngxtxayb', 'a\na', 'a\n', 'aaaa\naa', '\n'],
    },
    {
      key: '02',
      title: 'Khoảng cách chỉnh sửa',
      difficulty: 'MEDIUM',
      story:
        'Cho hai chuỗi $s$ và $t$. Mỗi thao tác em được phép: chèn một ký tự, xóa một ký tự, hoặc thay một ký tự bằng ký tự khác.\n\n' +
        'Hãy tìm số thao tác ít nhất để biến chuỗi $s$ thành chuỗi $t$.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 500$).',
      outputDesc: 'In ra số thao tác ít nhất.',
      note: 'dp[i][j] = dp[i-1][j-1] nếu ký tự bằng nhau, ngược lại 1 + min(xóa, chèn, thay).',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        const m = s.length,
          n = t.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] =
              s[i - 1] === t[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
        return String(dp[m][n]);
      },
      inputs: ['horse\nros', 'intention\nexecution', 'abc\nabc', 'abc\n', 'sunday\nsaturday', '\nabc', '\n', 'aaaa\nbbbb'],
    },
    {
      key: '03',
      title: 'Dãy con đối xứng dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Một "dãy con đối xứng" là dãy con (xóa bớt ký tự, giữ thứ tự) đọc xuôi và đọc ngược đều giống nhau.\n\n' +
        'Hãy tìm độ dài của dãy con đối xứng dài nhất.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài dãy con đối xứng dài nhất.',
      note: 'Chính là dãy con chung dài nhất của $s$ và chuỗi đảo ngược của $s$.',
      solve: (input) => String(lpsLen(firstLine(input))),
      inputs: ['bbbab', 'cbbd', 'abc', 'agbdba', 'aaaa', 'a', '', 'level'],
    },
    {
      key: '04',
      title: 'Đếm xâu con đối xứng',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Một "xâu con" là một đoạn các ký tự liền nhau. Hãy đếm số xâu con đối xứng (đọc xuôi ngược giống nhau) của $s$.\n\n' +
        'Hai xâu con xuất hiện ở vị trí khác nhau được tính là khác nhau, kể cả khi nội dung giống nhau. Mỗi ký tự đơn lẻ cũng là một xâu con đối xứng.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số xâu con đối xứng.',
      note: 'Mở rộng quanh mỗi tâm (cả tâm lẻ và tâm chẵn) và đếm.',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        let count = 0;
        const expand = (l: number, r: number) => {
          while (l >= 0 && r < n && s[l] === s[r]) {
            count++;
            l--;
            r++;
          }
        };
        for (let c = 0; c < n; c++) {
          expand(c, c); // tâm lẻ
          expand(c, c + 1); // tâm chẵn
        }
        return String(count);
      },
      inputs: ['abc', 'aaa', 'abba', 'a', 'abacd', '', 'aaaa', 'abcdef'],
    },
    {
      key: '05',
      title: 'Xâu con đối xứng dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy tìm độ dài của **xâu con liền nhau** đối xứng dài nhất.\n\n' +
        'Khác với bài dãy con đối xứng, ở đây các ký tự phải đứng kề nhau.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài xâu con đối xứng dài nhất.',
      note: 'Mở rộng quanh mỗi tâm và lưu độ dài lớn nhất tìm được.',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        if (n === 0) return '0';
        let best = 1;
        const expand = (l: number, r: number) => {
          while (l >= 0 && r < n && s[l] === s[r]) {
            if (r - l + 1 > best) best = r - l + 1;
            l--;
            r++;
          }
        };
        for (let c = 0; c < n; c++) {
          expand(c, c);
          expand(c, c + 1);
        }
        return String(best);
      },
      inputs: ['babad', 'cbbd', 'abc', 'forgeeksskeegfor', 'aaaa', 'a', '', 'abcde'],
    },
    {
      key: '06',
      title: 'Xâu con chung dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho hai chuỗi $s$ và $t$. Một "xâu con chung" là một đoạn các ký tự **liền nhau** xuất hiện trong cả hai chuỗi.\n\n' +
        'Hãy tìm độ dài của xâu con chung dài nhất. (Khác với dãy con chung, ở đây các ký tự phải kề nhau.)',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài xâu con chung dài nhất (bằng $0$ nếu không có).',
      note: 'dp[i][j] = dp[i-1][j-1] + 1 nếu s[i]=t[j], ngược lại 0; lưu giá trị lớn nhất.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        const m = s.length,
          n = t.length;
        let prev = new Array(n + 1).fill(0);
        let best = 0;
        for (let i = 1; i <= m; i++) {
          const cur = new Array(n + 1).fill(0);
          for (let j = 1; j <= n; j++) {
            if (s[i - 1] === t[j - 1]) {
              cur[j] = prev[j - 1] + 1;
              if (cur[j] > best) best = cur[j];
            }
          }
          prev = cur;
        }
        return String(best);
      },
      inputs: ['abcde\nabfce', 'aaa\naa', 'abc\ndef', 'geeksforgeeks\ngeeksquiz', 'abcdef\nzabcf', 'abc\nabc', 'a\n', 'aaaa\naa'],
    },
    {
      key: '07',
      title: 'Đếm cách tạo chuỗi đích',
      difficulty: 'MEDIUM',
      story:
        'Cho chuỗi nguồn $s$ và chuỗi đích $t$. Hãy đếm xem có bao nhiêu cách chọn một **dãy con** của $s$ (xóa bớt ký tự, giữ thứ tự) sao cho dãy con đó đúng bằng $t$.\n\n' +
        'Hai cách chọn được coi là khác nhau nếu tập vị trí được giữ lại khác nhau.',
      inputDesc:
        'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái, độ dài $s \\le 30$, độ dài $t \\le 15$). Kết quả đảm bảo nằm trong phạm vi số nguyên an toàn.',
      outputDesc: 'In ra số cách tạo chuỗi đích.',
      note: 'dp[i][j] = số cách tạo t[0..j) từ s[0..i); nếu s[i]=t[j] thì cộng cả lấy lẫn không lấy.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        const m = s.length,
          n = t.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = 1; // chuỗi đích rỗng: 1 cách
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] = dp[i - 1][j] + (s[i - 1] === t[j - 1] ? dp[i - 1][j - 1] : 0);
          }
        }
        return String(dp[m][n]);
      },
      inputs: ['rabbbit\nrabbit', 'babgbag\nbag', 'abc\nabc', 'aaa\na', 'abc\nd', 'abc\n', 'aaaa\naa', 'abc\ndef'],
    },
    {
      key: '08',
      title: 'Đếm số cách giải mã',
      difficulty: 'MEDIUM',
      story:
        'Một thông điệp gồm các chữ cái $A$–$Z$ được mã hóa thành số theo quy tắc $A \\to 1$, $B \\to 2$, $\\dots$, $Z \\to 26$, rồi nối lại thành một chuỗi chữ số.\n\n' +
        'Cho chuỗi chữ số, hãy đếm số cách giải mã nó trở lại thành chữ cái. Lưu ý: số $0$ không đứng một mình được, và chỉ các số từ $10$ đến $26$ mới ghép được hai chữ số.\n\n' +
        'Ví dụ `12` có thể là `AB` ($1,2$) hoặc `L` ($12$) — tức $2$ cách.',
      inputDesc: 'Một dòng chứa chuỗi chữ số (độ dài $\\le 50$).',
      outputDesc: 'In ra số cách giải mã (bằng $0$ nếu không giải mã được).',
      note: 'dp[i] = dp[i-1] (nếu chữ số thứ i hợp lệ) + dp[i-2] (nếu hai chữ số cuối tạo số 10..26).',
      solve: (input) => {
        const s = firstLine(input).trim();
        const n = s.length;
        if (n === 0) return '0';
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        dp[1] = s[0] === '0' ? 0 : 1;
        for (let i = 2; i <= n; i++) {
          const one = s[i - 1];
          const two = parseInt(s.slice(i - 2, i), 10);
          if (one !== '0') dp[i] += dp[i - 1];
          if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
        return String(dp[n]);
      },
      inputs: ['12', '226', '06', '11106', '10', '1', '0', '27'],
    },
    {
      key: '09',
      title: 'Số ký tự cần xóa để hai chuỗi bằng nhau',
      difficulty: 'EASY',
      story:
        'Cho hai chuỗi $s$ và $t$. Mỗi thao tác em được xóa một ký tự ở một trong hai chuỗi.\n\n' +
        'Hãy tìm số thao tác ít nhất để hai chuỗi trở nên giống hệt nhau.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số ký tự ít nhất cần xóa.',
      note: 'Đáp án = độ dài s + độ dài t − 2 × (dãy con chung dài nhất).',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        return String(s.length + t.length - 2 * lcsLen(s, t));
      },
      inputs: ['sea\neat', 'leetcode\netco', 'abc\nabc', 'abc\ndef', 'a\n', '\n', 'aaaa\naa', 'abcd\n'],
    },
    {
      key: '10',
      title: 'Số ký tự thêm vào để thành xâu đối xứng',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Mỗi thao tác em được chèn một ký tự bất kỳ vào một vị trí bất kỳ trong chuỗi.\n\n' +
        'Hãy tìm số ký tự ít nhất cần chèn để $s$ trở thành một xâu đối xứng (đọc xuôi ngược giống nhau).',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số ký tự ít nhất cần chèn.',
      note: 'Đáp án = độ dài chuỗi − độ dài dãy con đối xứng dài nhất.',
      solve: (input) => {
        const s = firstLine(input);
        return String(s.length - lpsLen(s));
      },
      inputs: ['ab', 'aa', 'abcd', 'race', 'level', 'a', '', 'aaaa'],
    },
    {
      key: '11',
      title: 'Độ dài chuỗi cái chung ngắn nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho hai chuỗi $s$ và $t$. Một "chuỗi cái chung" (supersequence) là chuỗi mà cả $s$ lẫn $t$ đều là dãy con của nó.\n\n' +
        'Hãy tìm độ dài của chuỗi cái chung **ngắn nhất** chứa cả hai chuỗi.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài chuỗi cái chung ngắn nhất.',
      note: 'Đáp án = độ dài s + độ dài t − độ dài dãy con chung dài nhất (LCS).',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        return String(s.length + t.length - lcsLen(s, t));
      },
      inputs: ['abac\ncab', 'geek\neke', 'abc\nabc', 'abc\ndef', 'a\n', '\n', 'aaaa\naa', 'abcd\nbd'],
    },
    {
      key: '12',
      title: 'Dãy con lặp dài nhất',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy tìm độ dài của **dãy con dài nhất** xuất hiện ít nhất hai lần trong $s$, sao cho hai lần xuất hiện đó không dùng chung ký tự ở cùng một vị trí (mỗi vị trí chỉ thuộc về một lần xuất hiện).\n\n' +
        'Đây là dãy con chung dài nhất của $s$ với chính nó, nhưng yêu cầu các chỉ số được ghép phải khác nhau ($i \\ne j$).',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài dãy con lặp dài nhất.',
      note: 'dp[i][j] = dp[i-1][j-1] + 1 nếu s[i]=s[j] và i≠j, ngược lại max(dp[i-1][j], dp[i][j-1]).',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 1; i <= n; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] =
              s[i - 1] === s[j - 1] && i !== j ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
        return String(dp[n][n]);
      },
      inputs: ['aabebcdd', 'aab', 'abc', 'aaaa', 'a', '', 'abab', 'aabb'],
    },
    {
      key: '13',
      title: 'Kiểm tra dãy con',
      difficulty: 'EASY',
      story:
        'Cho hai chuỗi $s$ và $t$. Hãy kiểm tra xem $s$ có phải là **dãy con** của $t$ hay không, tức là có thể thu được $s$ bằng cách xóa bớt một số ký tự của $t$ (giữ nguyên thứ tự) hay không.\n\n' +
        'In ra `YES` nếu có, ngược lại in ra `NO`.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra `YES` hoặc `NO`.',
      note: 'dp[i][j] = số ký tự của s khớp được trong t[0..j); s là dãy con khi LCS(s,t) = độ dài s.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        let i = 0;
        for (let j = 0; j < t.length && i < s.length; j++) {
          if (s[i] === t[j]) i++;
        }
        return i === s.length ? 'YES' : 'NO';
      },
      inputs: ['ace\nabcde', 'aec\nabcde', 'abc\nabc', '\nabc', 'a\n', '\n', 'abc\ndef', 'aaa\naa'],
    },
    {
      key: '14',
      title: 'Tách từ',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$ và một danh sách từ điển gồm các từ. Hãy kiểm tra xem có thể tách $s$ thành dãy các từ (không nhất thiết khác nhau) đều nằm trong từ điển hay không.\n\n' +
        'In ra `YES` nếu tách được, ngược lại in ra `NO`.',
      inputDesc:
        'Dòng đầu chứa chuỗi $s$. Dòng thứ hai chứa số nguyên $k$ — số từ trong từ điển. Dòng thứ ba chứa $k$ từ cách nhau bởi dấu cách (chỉ gồm chữ cái thường).',
      outputDesc: 'In ra `YES` hoặc `NO`.',
      note: 'dp[i] = true nếu s[0..i) tách được; dp[i] = ∃ j: dp[j] và s[j..i) thuộc từ điển.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '';
        const k = parseInt((ls[1] ?? '0').trim(), 10) || 0;
        const words = (ls[2] ?? '').trim().length ? (ls[2] ?? '').trim().split(/\s+/).slice(0, k) : [];
        const dict = new Set(words);
        const n = s.length;
        const dp = new Array(n + 1).fill(false);
        dp[0] = true;
        for (let i = 1; i <= n; i++) {
          for (let j = 0; j < i; j++) {
            if (dp[j] && dict.has(s.slice(j, i))) {
              dp[i] = true;
              break;
            }
          }
        }
        return dp[n] ? 'YES' : 'NO';
      },
      inputs: [
        'leetcode\n2\nleet code',
        'applepenapple\n2\napple pen',
        'catsandog\n5\ncats dog sand and cat',
        '\n1\na',
        'aaaa\n1\na',
        'abc\n3\na b c',
        'abcd\n3\na b c',
        'aaa\n2\naa aaa',
      ],
    },
    {
      key: '15',
      title: 'Đếm số cách tách từ',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$ và một danh sách từ điển gồm các từ. Hãy đếm số **cách khác nhau** để tách $s$ thành dãy các từ đều nằm trong từ điển.\n\n' +
        'Hai cách được coi là khác nhau nếu dãy các vị trí cắt khác nhau.',
      inputDesc:
        'Dòng đầu chứa chuỗi $s$. Dòng thứ hai chứa số nguyên $k$ — số từ trong từ điển. Dòng thứ ba chứa $k$ từ cách nhau bởi dấu cách (chỉ gồm chữ cái thường). Kết quả đảm bảo nằm trong phạm vi số nguyên an toàn.',
      outputDesc: 'In ra số cách tách.',
      note: 'dp[i] = số cách tách s[0..i); dp[i] = Σ dp[j] với s[j..i) thuộc từ điển.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '';
        const k = parseInt((ls[1] ?? '0').trim(), 10) || 0;
        const words = (ls[2] ?? '').trim().length ? (ls[2] ?? '').trim().split(/\s+/).slice(0, k) : [];
        const dict = new Set(words);
        const n = s.length;
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          for (let j = 0; j < i; j++) {
            if (dp[j] > 0 && dict.has(s.slice(j, i))) dp[i] += dp[j];
          }
        }
        return String(dp[n]);
      },
      inputs: [
        'pineapplepenapple\n4\napple pen applepen pine',
        'catsanddog\n5\ncat cats and sand dog',
        'aaa\n2\na aa',
        '\n1\na',
        'abcd\n3\na b c',
        'aaaa\n1\na',
        'abab\n2\na ab',
        'xyz\n3\nx y z',
      ],
    },
    {
      key: '16',
      title: 'So khớp ký tự đại diện',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$ và một mẫu $p$ có thể chứa ký tự đại diện. Trong mẫu, dấu `?` khớp với đúng một ký tự bất kỳ, còn dấu `*` khớp với một chuỗi bất kỳ (kể cả chuỗi rỗng).\n\n' +
        'Hãy kiểm tra xem mẫu $p$ có khớp với **toàn bộ** chuỗi $s$ hay không. In ra `YES` hoặc `NO`.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$ (chỉ gồm chữ cái thường). Dòng thứ hai chứa mẫu $p$ (gồm chữ cái thường, `?` và `*`).',
      outputDesc: 'In ra `YES` hoặc `NO`.',
      note: 'dp[i][j] = s[0..i) khớp p[0..j); với `*`: dp[i][j] = dp[i-1][j] hoặc dp[i][j-1].',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          p = ls[1] ?? '';
        const m = s.length,
          n = p.length;
        const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
        dp[0][0] = true;
        for (let j = 1; j <= n; j++) {
          if (p[j - 1] === '*') dp[0][j] = dp[0][j - 1];
        }
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            if (p[j - 1] === '*') dp[i][j] = dp[i - 1][j] || dp[i][j - 1];
            else if (p[j - 1] === '?' || p[j - 1] === s[i - 1]) dp[i][j] = dp[i - 1][j - 1];
          }
        }
        return dp[m][n] ? 'YES' : 'NO';
      },
      inputs: ['aa\na', 'aa\n*', 'cb\n?a', 'adceb\n*a*b', '\n*', '\n', 'abc\nabc', 'abc\na?c'],
    },
    {
      key: '17',
      title: 'Đếm số dãy con đối xứng',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy đếm số **dãy con đối xứng** (không rỗng) của $s$. Một dãy con thu được bằng cách xóa bớt ký tự và giữ nguyên thứ tự; nó đối xứng nếu đọc xuôi ngược giống nhau.\n\n' +
        'Hai dãy con được tính riêng nếu chúng được tạo từ các tập vị trí khác nhau, kể cả khi nội dung giống nhau.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 30$). Kết quả đảm bảo nằm trong phạm vi số nguyên an toàn.',
      outputDesc: 'In ra số dãy con đối xứng.',
      note: 'dp[i][j] = dp[i+1][j] + dp[i][j-1] − dp[i+1][j-1], cộng dp[i+1][j-1]+1 nếu s[i]=s[j].',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        if (n === 0) return '0';
        const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) dp[i][i] = 1;
        for (let len = 2; len <= n; len++) {
          for (let i = 0; i + len - 1 < n; i++) {
            const j = i + len - 1;
            if (s[i] === s[j]) dp[i][j] = dp[i + 1][j] + dp[i][j - 1] + 1;
            else dp[i][j] = dp[i + 1][j] + dp[i][j - 1] - dp[i + 1][j - 1];
          }
        }
        return String(dp[0][n - 1]);
      },
      inputs: ['bccb', 'aaa', 'abc', 'a', '', 'aaaa', 'abcba', 'abcd'],
    },
    {
      key: '18',
      title: 'Tổng mã ASCII nhỏ nhất phải xóa',
      difficulty: 'MEDIUM',
      story:
        'Cho hai chuỗi $s$ và $t$. Mỗi thao tác em được xóa một ký tự ở một trong hai chuỗi, và chi phí của thao tác bằng **mã ASCII** của ký tự bị xóa.\n\n' +
        'Hãy tìm tổng chi phí nhỏ nhất để hai chuỗi trở nên giống hệt nhau.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra tổng mã ASCII nhỏ nhất của các ký tự phải xóa.',
      note: 'dp[i][j] = chi phí nhỏ nhất để s[0..i) và t[0..j) bằng nhau; nếu khác ký tự thì xóa ký tự nhỏ hơn theo tổng.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        const m = s.length,
          n = t.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] + s.charCodeAt(i - 1);
        for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] + t.charCodeAt(j - 1);
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] =
              s[i - 1] === t[j - 1]
                ? dp[i - 1][j - 1]
                : Math.min(dp[i - 1][j] + s.charCodeAt(i - 1), dp[i][j - 1] + t.charCodeAt(j - 1));
          }
        }
        return String(dp[m][n]);
      },
      inputs: ['sea\neat', 'delete\nleet', 'abc\nabc', 'abc\ndef', 'a\n', '\n', 'aaaa\naa', 'ab\nbc'],
    },
    {
      key: '19',
      title: 'Kiểm tra chuỗi xen kẽ',
      difficulty: 'MEDIUM',
      story:
        'Cho ba chuỗi $s_1$, $s_2$ và $s_3$. Hãy kiểm tra xem $s_3$ có được tạo ra bằng cách **trộn xen kẽ** $s_1$ và $s_2$ hay không, sao cho thứ tự các ký tự trong $s_1$ và trong $s_2$ vẫn được giữ nguyên.\n\n' +
        'In ra `YES` nếu được, ngược lại in ra `NO`.',
      inputDesc: 'Ba dòng lần lượt chứa $s_1$, $s_2$, $s_3$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra `YES` hoặc `NO`.',
      note: 'dp[i][j] = true nếu s3[0..i+j) là trộn của s1[0..i) và s2[0..j).',
      solve: (input) => {
        const ls = lines(input);
        const s1 = ls[0] ?? '',
          s2 = ls[1] ?? '',
          s3 = ls[2] ?? '';
        const m = s1.length,
          n = s2.length;
        if (m + n !== s3.length) return 'NO';
        const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
        dp[0][0] = true;
        for (let i = 0; i <= m; i++) {
          for (let j = 0; j <= n; j++) {
            if (i > 0 && s1[i - 1] === s3[i + j - 1] && dp[i - 1][j]) dp[i][j] = true;
            if (j > 0 && s2[j - 1] === s3[i + j - 1] && dp[i][j - 1]) dp[i][j] = true;
          }
        }
        return dp[m][n] ? 'YES' : 'NO';
      },
      inputs: [
        'aabcc\ndbbca\naadbbcbcac',
        'aabcc\ndbbca\naadbbbaccc',
        'abc\n\nabc',
        '\n\n',
        'a\nb\nab',
        'a\nb\nba',
        'aa\naa\naaaa',
        'abc\ndef\nabd',
      ],
    },
    {
      key: '20',
      title: 'Dãy con chung dài nhất của ba chuỗi',
      difficulty: 'MEDIUM',
      story:
        'Cho ba chuỗi $s_1$, $s_2$ và $s_3$. Hãy tìm độ dài của **dãy con chung** dài nhất xuất hiện trong cả ba chuỗi (xóa bớt ký tự, giữ nguyên thứ tự).',
      inputDesc: 'Ba dòng lần lượt chứa $s_1$, $s_2$, $s_3$ (chỉ gồm chữ cái thường, độ dài $\\le 100$).',
      outputDesc: 'In ra độ dài dãy con chung dài nhất của ba chuỗi.',
      note: 'dp[i][j][k] = dp[i-1][j-1][k-1] + 1 nếu ba ký tự bằng nhau, ngược lại max ba hướng.',
      solve: (input) => {
        const ls = lines(input);
        const a = ls[0] ?? '',
          b = ls[1] ?? '',
          c = ls[2] ?? '';
        const p = a.length,
          q = b.length,
          r = c.length;
        const dp: number[][][] = Array.from({ length: p + 1 }, () =>
          Array.from({ length: q + 1 }, () => new Array(r + 1).fill(0)),
        );
        for (let i = 1; i <= p; i++) {
          for (let j = 1; j <= q; j++) {
            for (let k = 1; k <= r; k++) {
              dp[i][j][k] =
                a[i - 1] === b[j - 1] && b[j - 1] === c[k - 1]
                  ? dp[i - 1][j - 1][k - 1] + 1
                  : Math.max(dp[i - 1][j][k], dp[i][j - 1][k], dp[i][j][k - 1]);
            }
          }
        }
        return String(dp[p][q][r]);
      },
      inputs: [
        'abcd1e2\nbc12ea\nbd1ea',
        'geeks\ngeeksfor\ngeeksforgeeks',
        'abc\nabc\nabc',
        'abc\ndef\nghi',
        '\nabc\nabc',
        '\n\n',
        'aaaa\naaa\naa',
        'xyz\nxyz\nxyw',
      ],
    },
    {
      key: '21',
      title: 'Số lần cắt ít nhất chia chuỗi thành đối xứng',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Em muốn cắt $s$ thành các đoạn liền nhau sao cho **mỗi đoạn đều là một xâu đối xứng** (đọc xuôi ngược giống nhau).\n\n' +
        'Hãy tìm **số lần cắt ít nhất** cần thực hiện. (Một chuỗi đã đối xứng cần $0$ lần cắt.)',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số lần cắt ít nhất.',
      note: 'dp[i] = số cắt ít nhất cho s[0..i); nếu s[j..i) đối xứng thì dp[i] = min(dp[i], dp[j] + 1).',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        if (n === 0) return '0';
        const pal: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
        for (let i = n - 1; i >= 0; i--) {
          for (let j = i; j < n; j++) {
            if (s[i] === s[j] && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = true;
          }
        }
        const dp = new Array(n + 1).fill(0);
        for (let i = 1; i <= n; i++) {
          if (pal[0][i - 1]) {
            dp[i] = 0;
            continue;
          }
          let best = Infinity;
          for (let j = 1; j < i; j++) {
            if (pal[j][i - 1] && dp[j] + 1 < best) best = dp[j] + 1;
          }
          dp[i] = best;
        }
        return String(dp[n]);
      },
      inputs: ['aab', 'ababbbabbababa', 'abc', 'aaaa', 'a', '', 'racecar', 'abcba'],
    },
    {
      key: '22',
      title: 'Đếm xâu con đối xứng độ dài chẵn',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy đếm số **xâu con liền nhau** đối xứng có **độ dài chẵn** của $s$.\n\n' +
        'Hai xâu con ở vị trí khác nhau được tính là khác nhau, kể cả khi nội dung giống nhau.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số xâu con đối xứng độ dài chẵn.',
      note: 'Mở rộng quanh mỗi tâm chẵn (giữa hai ký tự) và đếm số lần khớp.',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        let count = 0;
        for (let c = 0; c < n; c++) {
          let l = c,
            r = c + 1;
          while (l >= 0 && r < n && s[l] === s[r]) {
            count++;
            l--;
            r++;
          }
        }
        return String(count);
      },
      inputs: ['abba', 'aaaa', 'abc', 'a', '', 'abccba', 'aabb', 'noon'],
    },
    {
      key: '23',
      title: 'Khoảng cách chỉnh sửa chỉ chèn và xóa',
      difficulty: 'EASY',
      story:
        'Cho hai chuỗi $s$ và $t$. Khác với bài khoảng cách chỉnh sửa thông thường, ở đây em **chỉ được phép chèn hoặc xóa** một ký tự (không có phép thay thế).\n\n' +
        'Hãy tìm số thao tác ít nhất để biến $s$ thành $t$.',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số thao tác ít nhất.',
      note: 'Đáp án = độ dài s + độ dài t − 2 × (dãy con chung dài nhất). Vì không có phép thay, phải xóa và chèn riêng.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        return String(s.length + t.length - 2 * lcsLen(s, t));
      },
      inputs: ['heap\npea', 'sunday\nsaturday', 'abc\nabc', 'abc\ndef', 'a\n', '\n', 'aaaa\naa', 'cat\nact'],
    },
    {
      key: '24',
      title: 'Xâu con chung dài nhất với chuỗi đảo ngược',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Gọi $s^R$ là chuỗi $s$ viết theo thứ tự ngược lại. Hãy tìm độ dài của **xâu con liền nhau** dài nhất xuất hiện trong cả $s$ và $s^R$.\n\n' +
        'Lưu ý: kết quả **không** nhất thiết là một xâu đối xứng.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài xâu con chung dài nhất của $s$ và chuỗi đảo của nó.',
      note: 'Áp dụng xâu con chung dài nhất (longest common substring) giữa s và reverse(s).',
      solve: (input) => {
        const s = firstLine(input);
        const t = s.split('').reverse().join('');
        const m = s.length,
          n = t.length;
        let prev = new Array(n + 1).fill(0);
        let best = 0;
        for (let i = 1; i <= m; i++) {
          const cur = new Array(n + 1).fill(0);
          for (let j = 1; j <= n; j++) {
            if (s[i - 1] === t[j - 1]) {
              cur[j] = prev[j - 1] + 1;
              if (cur[j] > best) best = cur[j];
            }
          }
          prev = cur;
        }
        return String(best);
      },
      inputs: ['abcba', 'forgeeksskeegfor', 'abc', 'aaaa', 'a', '', 'abcdef', 'level'],
    },
    {
      key: '25',
      title: 'Đếm xâu con đối xứng độ dài lẻ',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy đếm số **xâu con liền nhau** đối xứng có **độ dài lẻ** của $s$.\n\n' +
        'Hai xâu con ở vị trí khác nhau được tính là khác nhau. Mỗi ký tự đơn lẻ là một xâu con đối xứng độ dài lẻ.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra số xâu con đối xứng độ dài lẻ.',
      note: 'Mở rộng quanh mỗi tâm lẻ (một ký tự) và đếm số lần khớp.',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        let count = 0;
        for (let c = 0; c < n; c++) {
          let l = c,
            r = c;
          while (l >= 0 && r < n && s[l] === s[r]) {
            count++;
            l--;
            r++;
          }
        }
        return String(count);
      },
      inputs: ['aba', 'aaa', 'abc', 'a', '', 'racecar', 'abcba', 'abcd'],
    },
    {
      key: '26',
      title: 'Dãy con tăng dài nhất theo bảng chữ cái',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy tìm độ dài của **dãy con tăng nghiêm ngặt** dài nhất theo thứ tự bảng chữ cái, tức là dãy con (xóa bớt ký tự, giữ thứ tự) mà mỗi ký tự đứng sau lớn hơn (theo bảng chữ cái) ký tự đứng trước.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài dãy con tăng dài nhất.',
      note: 'dp[i] = độ dài dãy tăng kết thúc tại i; dp[i] = 1 + max(dp[j]) với j<i và s[j]<s[i].',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        if (n === 0) return '0';
        const dp = new Array(n).fill(1);
        let best = 1;
        for (let i = 1; i < n; i++) {
          for (let j = 0; j < i; j++) {
            if (s[j] < s[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
          }
          if (dp[i] > best) best = dp[i];
        }
        return String(best);
      },
      inputs: ['abcabc', 'zyx', 'aebdc', 'aaaa', 'a', '', 'abcd', 'dcba'],
    },
    {
      key: '27',
      title: 'Đếm cách phân tích chuỗi số',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi chữ số và một số nguyên $K$. Hãy đếm số cách cắt chuỗi thành các nhóm chữ số liền nhau sao cho **mỗi nhóm là một số nguyên từ $1$ đến $K$** (không có số $0$ đứng đầu, trừ khi nhóm chỉ là một chữ số và chữ số đó không phải $0$).\n\n' +
        'Nói cách khác, mỗi nhóm không được bắt đầu bằng `0`, và giá trị của nhóm phải nằm trong khoảng $[1, K]$.',
      inputDesc: 'Dòng đầu chứa chuỗi chữ số (độ dài $\\le 30$). Dòng thứ hai chứa số nguyên $K$ ($1 \\le K \\le 1000$). Kết quả đảm bảo nằm trong phạm vi số nguyên an toàn.',
      outputDesc: 'In ra số cách phân tích.',
      note: 'dp[i] = Σ dp[j] với nhóm s[j..i) không bắt đầu bằng 0 và giá trị nằm trong [1, K].',
      solve: (input) => {
        const ls = lines(input);
        const s = (ls[0] ?? '').trim();
        const K = parseInt((ls[1] ?? '0').trim(), 10) || 0;
        const n = s.length;
        if (n === 0) return '0';
        const maxLen = String(K).length;
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        for (let i = 1; i <= n; i++) {
          for (let len = 1; len <= maxLen && len <= i; len++) {
            const j = i - len;
            const piece = s.slice(j, i);
            if (piece[0] === '0') continue;
            const val = parseInt(piece, 10);
            if (val >= 1 && val <= K) dp[i] += dp[j];
          }
        }
        return String(dp[n]);
      },
      inputs: ['1234\n26', '12\n9', '11106\n26', '100\n100', '0\n5', '7\n10', '999\n9', '111\n100'],
    },
    {
      key: '28',
      title: 'Kiểm tra khác nhau đúng một phép chỉnh sửa',
      difficulty: 'EASY',
      story:
        'Cho hai chuỗi $s$ và $t$. Hãy kiểm tra xem chúng có khác nhau **đúng một phép chỉnh sửa** hay không. Một phép chỉnh sửa là: chèn một ký tự, xóa một ký tự, hoặc thay một ký tự.\n\n' +
        'In ra `YES` nếu khoảng cách chỉnh sửa giữa $s$ và $t$ đúng bằng $1$, ngược lại in ra `NO` (hai chuỗi giống hệt nhau cũng in `NO`).',
      inputDesc: 'Dòng đầu chứa chuỗi $s$, dòng thứ hai chứa chuỗi $t$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra `YES` hoặc `NO`.',
      note: 'Nếu độ dài bằng nhau: đúng một vị trí khác. Nếu lệch 1: chuỗi ngắn là dãy con bỏ đúng 1 ký tự của chuỗi dài.',
      solve: (input) => {
        const ls = lines(input);
        const s = ls[0] ?? '',
          t = ls[1] ?? '';
        const m = s.length,
          n = t.length;
        if (Math.abs(m - n) > 1) return 'NO';
        if (m === n) {
          let diff = 0;
          for (let i = 0; i < m; i++) if (s[i] !== t[i]) diff++;
          return diff === 1 ? 'YES' : 'NO';
        }
        const a = m < n ? s : t;
        const b = m < n ? t : s;
        let i = 0,
          j = 0,
          skipped = false;
        while (i < a.length && j < b.length) {
          if (a[i] === b[j]) {
            i++;
            j++;
          } else {
            if (skipped) return 'NO';
            skipped = true;
            j++;
          }
        }
        return 'YES';
      },
      inputs: ['cat\ncats', 'cat\ncut', 'abc\nabc', 'abc\nadc', 'a\n', '\n', 'abc\nabcd', 'abc\nxyz'],
    },
    {
      key: '29',
      title: 'Đếm số dãy con riêng biệt',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy đếm số **dãy con riêng biệt không rỗng** của $s$. Một dãy con thu được bằng cách xóa bớt ký tự và giữ nguyên thứ tự; hai dãy con có **nội dung giống nhau** chỉ được tính một lần.\n\n' +
        'Ví dụ chuỗi `aba` có các dãy con riêng biệt: `a`, `b`, `ab`, `aa`, `ba`, `aba` — tức $6$ dãy.',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 30$). Kết quả đảm bảo nằm trong phạm vi số nguyên an toàn.',
      outputDesc: 'In ra số dãy con riêng biệt không rỗng.',
      note: 'dp[i] = 2·dp[i-1] (lấy hoặc không lấy ký tự i), trừ đi dp[last-1] nếu ký tự đã xuất hiện trước.',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1; // chuỗi rỗng
        const last: Record<string, number> = {};
        for (let i = 1; i <= n; i++) {
          dp[i] = 2 * dp[i - 1];
          const ch = s[i - 1];
          if (last[ch] !== undefined) dp[i] -= dp[last[ch] - 1];
          last[ch] = i;
        }
        return String(dp[n] - 1); // bỏ chuỗi rỗng
      },
      inputs: ['aba', 'abc', 'aaa', 'a', '', 'aaaa', 'abab', 'aab'],
    },
    {
      key: '30',
      title: 'Xâu con lặp dài nhất không chồng lấp',
      difficulty: 'MEDIUM',
      story:
        'Cho một chuỗi $s$. Hãy tìm độ dài của **xâu con liền nhau** dài nhất xuất hiện **ít nhất hai lần** trong $s$, sao cho hai lần xuất hiện đó **không chồng lấp** lên nhau (không dùng chung vị trí nào).',
      inputDesc: 'Một dòng chứa chuỗi $s$ (chỉ gồm chữ cái thường, độ dài $\\le 1000$).',
      outputDesc: 'In ra độ dài xâu con lặp dài nhất không chồng lấp (bằng $0$ nếu không có).',
      note: 'dp[i][j] = dp[i-1][j-1] + 1 nếu s[i]=s[j] và i<j và dp[i-1][j-1] < j−i (tránh chồng lấp).',
      solve: (input) => {
        const s = firstLine(input);
        const n = s.length;
        const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
        let best = 0;
        for (let i = 1; i <= n; i++) {
          for (let j = i + 1; j <= n; j++) {
            if (s[i - 1] === s[j - 1] && dp[i - 1][j - 1] < j - i) {
              dp[i][j] = dp[i - 1][j - 1] + 1;
              if (dp[i][j] > best) best = dp[i][j];
            } else {
              dp[i][j] = 0;
            }
          }
        }
        return String(best);
      },
      inputs: ['aabaabaaba', 'abcd', 'aaaa', 'banana', 'a', '', 'abab', 'aa'],
    },
  ],
};

export default course;

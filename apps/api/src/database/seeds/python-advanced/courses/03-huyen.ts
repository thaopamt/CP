import { CourseSpec } from '../../python-basic/types';

/**
 * Course PYTHON-ADV-03 — Cap Huyen (rural-district level).
 * Muc tieu: luyen thi Tin hoc tre cap huyen. Do kho MEDIUM-HARD: tim kiem nhi
 * phan (tren mang / tren dap an), tham lam co sap xep, quy hoach dong 1 chieu,
 * lap lich khoang, de quy nho, duyet ma tran, so hoc, mo phong, cua so truot.
 *
 * NOTE for authors: mirror the python-basic shape exactly. Never hand-write an
 * expected output — return it from `solve(input)`. The first 3 inputs become
 * visible samples. Outputs are ASCII only. All results stay within JS safe
 * integers; recursion/permutation problems keep n small so solvers terminate.
 */

// ---- small reusable helpers (Python-faithful integer semantics) ----
const toInt = (s: string) => parseInt(s.trim(), 10);
const firstLine = (input: string) => (input.split('\n')[0] ?? '').trim();
const readInts = (input: string): number[] =>
  input
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));
const lines = (input: string): string[] => input.replace(/\n+$/, '').split('\n');

const course: CourseSpec = {
  code: 'PYTHON-ADV-03',
  title: 'Cap Huyen',
  description:
    'Khoa hoc luyen thi Tin hoc tre cap huyen: tim kiem nhi phan, tham lam, ' +
    'quy hoach dong, de quy va nhieu ky thuat nang cao khac. Em hay co len nhe!',
  tags: ['python', 'nang-cao', 'tin-hoc-tre', 'cap-huyen'],
  problems: [
    {
      key: '01',
      title: 'Tim kiem nhi phan',
      difficulty: 'MEDIUM',
      story:
        'Cho mot mang `n` so nguyen DA SAP XEP tang dan va mot so can tim `x`. ' +
        'Hay dung tim kiem nhi phan de tim vi tri (danh so tu 1) cua `x`. ' +
        'Neu co nhieu vi tri, in vi tri dau tien tim thay bang tim kiem nhi phan; neu khong co in `-1`.\n\n' +
        'Dong 1 chua `n` va `x`. Dong 2 chua `n` so nguyen tang dan (1 <= n <= 100000).',
      inputDesc: 'Dong 1: hai so `n` va `x`. Dong 2: `n` so nguyen tang dan, cach nhau dau cach.',
      outputDesc: 'In ra vi tri 1-based ma tim kiem nhi phan tim thay `x`, hoac `-1` neu khong co.',
      note: 'Lap lo, hi; mid = (lo+hi)//2; so sanh a[mid] voi x de thu hep mot nua.',
      solve: (input) => {
        const ls = lines(input);
        const [, x] = readInts(ls[0] ?? '');
        const a = readInts(ls[1] ?? '');
        let lo = 0;
        let hi = a.length - 1;
        let ans = -1;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (a[mid] === x) {
            ans = mid + 1;
            break;
          } else if (a[mid] < x) {
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        return String(ans);
      },
      inputs: [
        '5 3\n1 2 3 4 5',
        '4 9\n1 2 3 4',
        '1 7\n7',
        '6 6\n1 3 5 6 8 10',
        '7 1\n1 1 1 1 1 1 1',
        '5 -2\n-5 -2 0 3 9',
        '8 100\n10 20 30 40 50 60 70 80',
        '6 10\n2 4 6 8 10 12',
      ],
    },
    {
      key: '02',
      title: 'Chia keo cho be',
      difficulty: 'HARD',
      story:
        'Co `m` goi keo, goi thu `i` co `a[i]` chiec keo. Can chia het keo cho `k` ban, ' +
        'moi ban duoc lay tu DUY NHAT mot goi (mot goi co the bi cat nho de chia cho nhieu ban, ' +
        'phan thua bi bo). Hay tim so keo NHIEU NHAT moi ban co the nhan duoc, sao cho du chia cho `k` ban ' +
        '(moi ban nhan dung so do, lay tu mot goi). Neu khong the chia (vi du moi goi deu rong) in `0`.\n\n' +
        'Dong 1 chua `m` va `k`. Dong 2 chua `m` so nguyen `a[i]` (1 <= m <= 1000, 1 <= a[i] <= 1000000, 1 <= k <= 10^9).',
      inputDesc: 'Dong 1: hai so `m` va `k`. Dong 2: `m` so nguyen, so keo moi goi.',
      outputDesc: 'In ra so keo nhieu nhat moi ban co the nhan, hoac `0` neu khong the.',
      note: 'Tim kiem nhi phan tren dap an: voi luong v, dem sum(a[i]//v); chia duoc neu tong >= k.',
      solve: (input) => {
        const ls = lines(input);
        const [, k] = readInts(ls[0] ?? '');
        const a = readInts(ls[1] ?? '');
        const can = (v: number): boolean => {
          if (v <= 0) return true;
          let cnt = 0;
          for (const x of a) {
            cnt += Math.floor(x / v);
            if (cnt >= k) return true;
          }
          return cnt >= k;
        };
        let lo = 1;
        let hi = 0;
        for (const x of a) if (x > hi) hi = x;
        let ans = 0;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (can(mid)) {
            ans = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        return String(ans);
      },
      inputs: [
        '4 7\n5 8 6 10',
        '3 5\n1 1 1',
        '1 1\n10',
        '5 10\n2 2 2 2 2',
        '3 100\n1 1 1',
        '2 3\n9 6',
        '4 4\n7 7 7 7',
        '3 2\n1000000 1 1',
      ],
    },
    {
      key: '03',
      title: 'Chia mang thanh k phan',
      difficulty: 'HARD',
      story:
        'Cho mang `n` so nguyen duong, hay chia mang thanh DUNG `k` doan lien tiep khong rong. ' +
        'Chi phi cua mot cach chia la tong LON NHAT trong cac doan. Hay tim chi phi NHO NHAT co the.\n\n' +
        'Dong 1 chua `n` va `k`. Dong 2 chua `n` so nguyen (1 <= k <= n <= 1000, 1 <= a[i] <= 10^6).',
      inputDesc: 'Dong 1: hai so `n` va `k`. Dong 2: `n` so nguyen duong.',
      outputDesc: 'In ra tong lon nhat NHO NHAT co the cua mot doan khi chia thanh `k` phan.',
      note: 'Nhi phan tren dap an trong [max(a), sum(a)]; dem so doan tao duoc khi gioi han la mid.',
      solve: (input) => {
        const ls = lines(input);
        const [, k] = readInts(ls[0] ?? '');
        const a = readInts(ls[1] ?? '');
        const segments = (limit: number): number => {
          let segs = 1;
          let cur = 0;
          for (const x of a) {
            if (cur + x > limit) {
              segs++;
              cur = x;
            } else {
              cur += x;
            }
          }
          return segs;
        };
        let lo = 0;
        let hi = 0;
        for (const x of a) {
          if (x > lo) lo = x;
          hi += x;
        }
        let ans = hi;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (segments(mid) <= k) {
            ans = mid;
            hi = mid - 1;
          } else {
            lo = mid + 1;
          }
        }
        return String(ans);
      },
      inputs: [
        '5 2\n7 2 5 10 8',
        '4 4\n1 2 3 4',
        '1 1\n9',
        '6 3\n1 1 1 1 1 1',
        '5 1\n3 1 4 1 5',
        '7 2\n1 2 3 4 5 6 7',
        '4 2\n10 10 10 10',
        '6 2\n5 5 5 5 5 5',
      ],
    },
    {
      key: '04',
      title: 'Hop tac thue thuyen',
      difficulty: 'HARD',
      story:
        'Co `n` nguoi, nguoi thu `i` nang `w[i]` kg. Moi chiec thuyen cho toi da 2 nguoi va ' +
        'tong trong luong khong vuot qua `limit`. Hay tim SO THUYEN IT NHAT can thue de cho het moi nguoi. ' +
        '(Dam bao moi nguoi deu <= limit.)\n\n' +
        'Dong 1 chua `n` va `limit`. Dong 2 chua `n` so nguyen `w[i]` (1 <= n <= 1000, 1 <= w[i] <= limit <= 10^6).',
      inputDesc: 'Dong 1: hai so `n` va `limit`. Dong 2: `n` so nguyen trong luong.',
      outputDesc: 'In ra so thuyen it nhat can dung.',
      note: 'Tham lam: sap xep tang dan, hai con tro. Ghep nguoi nhe nhat voi nguoi nang nhat neu vua.',
      solve: (input) => {
        const ls = lines(input);
        const [, limit] = readInts(ls[0] ?? '');
        const w = readInts(ls[1] ?? '').sort((a, b) => a - b);
        let i = 0;
        let j = w.length - 1;
        let boats = 0;
        while (i <= j) {
          if (w[i] + w[j] <= limit) {
            i++;
            j--;
          } else {
            j--;
          }
          boats++;
        }
        return String(boats);
      },
      inputs: [
        '4 100\n50 60 40 30',
        '1 50\n50',
        '3 10\n10 10 10',
        '5 5\n1 2 3 4 5',
        '6 6\n3 3 3 3 3 3',
        '4 200\n100 100 100 100',
        '2 10\n4 6',
        '7 8\n1 2 3 4 5 6 7',
      ],
    },
    {
      key: '05',
      title: 'Lap lich hoat dong',
      difficulty: 'HARD',
      story:
        'Co `n` hoat dong, hoat dong thu `i` bat dau luc `s[i]` va ket thuc luc `f[i]`. ' +
        'Mot ban chi tham gia duoc cac hoat dong KHONG GIAO NHAU (hoat dong sau bat dau >= hoat dong truoc ket thuc). ' +
        'Hay tim SO HOAT DONG NHIEU NHAT co the tham gia.\n\n' +
        'Dong 1 chua `n`. `n` dong tiep theo, moi dong chua `s[i]` va `f[i]` (1 <= n <= 1000, 0 <= s < f <= 10^6).',
      inputDesc: 'Dong 1: so luong `n`. Moi dong tiep theo: hai so `s[i]` va `f[i]`.',
      outputDesc: 'In ra so hoat dong toi da co the tham gia.',
      note: 'Tham lam: sap xep theo thoi diem ket thuc tang dan, chon hoat dong neu bat dau >= ket thuc cuoi.',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0] ?? '0');
        const iv: Array<[number, number]> = [];
        for (let i = 1; i <= n; i++) {
          const [s, f] = readInts(ls[i] ?? '');
          iv.push([s, f]);
        }
        iv.sort((p, q) => p[1] - q[1]);
        let count = 0;
        let lastEnd = -1;
        for (const [s, f] of iv) {
          if (s >= lastEnd) {
            count++;
            lastEnd = f;
          }
        }
        return String(count);
      },
      inputs: [
        '3\n1 3\n2 5\n4 6',
        '1\n0 10',
        '4\n1 2\n2 3\n3 4\n4 5',
        '3\n1 10\n2 3\n4 5',
        '5\n0 6\n1 2\n3 4\n5 7\n8 9',
        '2\n1 5\n1 5',
        '4\n5 9\n1 2\n3 4\n0 6',
        '6\n1 2\n1 2\n1 2\n2 3\n2 3\n3 4',
      ],
    },
    {
      key: '06',
      title: 'Doan con co tong lon nhat',
      difficulty: 'HARD',
      story:
        'Cho mang `n` so nguyen (co the am), hay tim tong LON NHAT cua mot doan con lien tiep KHONG RONG ' +
        '(thuat toan Kadane). Vi du mang `-2 1 -3 4 -1 2 1 -5 4` co tong lon nhat la 6 (doan `4 -1 2 1`).\n\n' +
        'Dong 1 chua `n`. Dong 2 chua `n` so nguyen (1 <= n <= 100000, -10^6 <= a[i] <= 10^6).',
      inputDesc: 'Dong 1: so luong `n`. Dong 2: `n` so nguyen cach nhau dau cach.',
      outputDesc: 'In ra tong lon nhat cua mot doan con lien tiep khong rong.',
      note: 'Kadane: cur = max(a[i], cur+a[i]); best = max(best, cur). Khoi tao bang phan tu dau.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1] ?? '');
        let cur = a[0];
        let best = a[0];
        for (let i = 1; i < a.length; i++) {
          cur = Math.max(a[i], cur + a[i]);
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '9\n-2 1 -3 4 -1 2 1 -5 4',
        '1\n-7',
        '5\n-1 -2 -3 -4 -5',
        '4\n1 2 3 4',
        '6\n-2 -3 4 -1 -2 1',
        '1\n5',
        '5\n5 -9 6 -2 3',
        '3\n-1 -1 -1',
      ],
    },
    {
      key: '07',
      title: 'Leo cau thang',
      difficulty: 'MEDIUM',
      story:
        'Mot cau thang co `n` bac. Moi buoc em co the buoc len 1 hoac 2 bac. ' +
        'Hoi co bao nhieu CACH khac nhau de leo het `n` bac?\n\n' +
        'Cho `n` (1 <= n <= 40, gioi han nho de ket qua an toan).',
      inputDesc: 'Mot so nguyen `n`.',
      outputDesc: 'In ra so cach leo het cau thang.',
      note: 'Quy hoach dong: ways(n) = ways(n-1) + ways(n-2), ways(0)=1, ways(1)=1.',
      solve: (input) => {
        const n = toInt(input);
        let a = 1;
        let b = 1;
        for (let i = 2; i <= n; i++) {
          const c = a + b;
          a = b;
          b = c;
        }
        return String(b);
      },
      inputs: ['1', '2', '3', '5', '10', '40', '20', '7'],
    },
    {
      key: '08',
      title: 'Doi tien it dong nhat',
      difficulty: 'HARD',
      story:
        'Co cac loai dong xu menh gia khac nhau (khong gioi han so luong moi loai). ' +
        'Hay doi mot so tien `S` bang SO DONG XU IT NHAT. Neu khong the doi dung `S`, in `-1`.\n\n' +
        'Dong 1 chua `c` (so loai xu) va `S`. Dong 2 chua `c` menh gia ' +
        '(1 <= c <= 20, 1 <= menh gia <= 1000, 0 <= S <= 10000).',
      inputDesc: 'Dong 1: hai so `c` va `S`. Dong 2: `c` menh gia cach nhau dau cach.',
      outputDesc: 'In ra so dong xu it nhat de doi `S`, hoac `-1` neu khong the.',
      note: 'Quy hoach dong: dp[v] = so xu it nhat doi v; dp[v] = min(dp[v-coin]+1). dp[0]=0.',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0] ?? '');
        const coins = readInts(ls[1] ?? '');
        const INF = Infinity;
        const dp = new Array(S + 1).fill(INF);
        dp[0] = 0;
        for (let v = 1; v <= S; v++) {
          for (const coin of coins) {
            if (coin <= v && dp[v - coin] + 1 < dp[v]) {
              dp[v] = dp[v - coin] + 1;
            }
          }
        }
        return String(dp[S] === INF ? -1 : dp[S]);
      },
      inputs: [
        '3 11\n1 2 5',
        '1 3\n2',
        '2 0\n3 7',
        '3 6\n1 3 4',
        '2 7\n3 5',
        '4 10000\n1 5 10 25',
        '1 7\n7',
        '3 23\n5 7 11',
      ],
    },
    {
      key: '09',
      title: 'Doan tang dan dai nhat',
      difficulty: 'MEDIUM',
      story:
        'Cho mang `n` so nguyen, hay tim do dai cua doan con LIEN TIEP tang dan ngat (moi phan tu lon hon phan tu lien truoc) DAI NHAT.\n\n' +
        'Dong 1 chua `n`. Dong 2 chua `n` so nguyen (1 <= n <= 100000).',
      inputDesc: 'Dong 1: so luong `n`. Dong 2: `n` so nguyen cach nhau dau cach.',
      outputDesc: 'In ra do dai doan lien tiep tang dan ngat dai nhat.',
      note: 'Duyet 1 lan: neu a[i] > a[i-1] tang do dai hien tai, nguoc lai reset ve 1; giu lai max.',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1] ?? '');
        let cur = 1;
        let best = 1;
        for (let i = 1; i < a.length; i++) {
          if (a[i] > a[i - 1]) cur++;
          else cur = 1;
          if (cur > best) best = cur;
        }
        return String(best);
      },
      inputs: [
        '6\n1 2 1 2 3 1',
        '1\n5',
        '5\n5 4 3 2 1',
        '4\n1 2 3 4',
        '6\n3 3 3 3 3 3',
        '7\n1 2 3 1 2 3 4',
        '5\n-2 -1 0 1 2',
        '4\n10 5 6 7',
      ],
    },
    {
      key: '10',
      title: 'Dem hoan vi',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 8), hay dem so hoan vi khac nhau cua day `1 2 ... n`. ' +
        'Day du nho de em co the dung de quy sinh tat ca hoan vi roi dem.\n\n' +
        'Cho `n`.',
      inputDesc: 'Mot so nguyen `n` (1 <= n <= 8).',
      outputDesc: 'In ra so luong hoan vi cua day `1..n`.',
      note: 'De quy sinh hoan vi: dem moi khi xay dung xong mot hoan vi du do dai. (Ket qua = n!.)',
      solve: (input) => {
        const n = toInt(input);
        const used = new Array(n + 1).fill(false);
        let count = 0;
        const rec = (depth: number) => {
          if (depth === n) {
            count++;
            return;
          }
          for (let v = 1; v <= n; v++) {
            if (!used[v]) {
              used[v] = true;
              rec(depth + 1);
              used[v] = false;
            }
          }
        };
        rec(0);
        return String(count);
      },
      inputs: ['1', '2', '3', '4', '5', '6', '7', '8'],
    },
    {
      key: '11',
      title: 'Chon tong bang S',
      difficulty: 'HARD',
      story:
        'Cho `n` so nguyen duong (1 <= n <= 8) va mot so `S`. Hoi co the chon mot tap con (co the rong) ' +
        'cac so sao cho tong dung bang `S` hay khong?\n\n' +
        'Dong 1 chua `n` va `S`. Dong 2 chua `n` so nguyen (1 <= a[i] <= 1000, 0 <= S <= 8000).',
      inputDesc: 'Dong 1: hai so `n` va `S`. Dong 2: `n` so nguyen cach nhau dau cach.',
      outputDesc: 'In `YES` neu ton tai tap con co tong bang `S`, nguoc lai in `NO`.',
      note: 'De quy: voi moi phan tu, thu chon hoac khong chon (n nho nen 2^n cach la du nhanh).',
      solve: (input) => {
        const ls = lines(input);
        const [, S] = readInts(ls[0] ?? '');
        const a = readInts(ls[1] ?? '');
        let found = false;
        const rec = (i: number, sum: number) => {
          if (found) return;
          if (i === a.length) {
            if (sum === S) found = true;
            return;
          }
          rec(i + 1, sum);
          rec(i + 1, sum + a[i]);
        };
        rec(0, 0);
        return found ? 'YES' : 'NO';
      },
      inputs: [
        '3 9\n2 3 5',
        '3 100\n2 3 5',
        '1 0\n7',
        '4 0\n1 2 3 4',
        '5 15\n1 2 3 4 5',
        '4 8\n4 4 4 4',
        '3 7\n3 4 5',
        '6 21\n1 2 4 8 16 32',
      ],
    },
    {
      key: '12',
      title: 'Tong cac hang ma tran',
      difficulty: 'MEDIUM',
      story:
        'Cho mot ma tran `r` hang `c` cot cac so nguyen. Hay in ra tong moi hang, theo thu tu tu hang dau den hang cuoi, cach nhau dau cach tren mot dong.\n\n' +
        'Dong 1 chua `r` va `c`. `r` dong tiep theo, moi dong chua `c` so nguyen ' +
        '(1 <= r, c <= 100, |a[i][j]| <= 10^6).',
      inputDesc: 'Dong 1: hai so `r` va `c`. Sau do `r` dong, moi dong `c` so nguyen.',
      outputDesc: 'In ra `r` tong hang, cach nhau dau cach, tren mot dong.',
      note: 'Voi moi hang, cong tat ca phan tu trong hang do roi luu lai.',
      solve: (input) => {
        const ls = lines(input);
        const [r] = readInts(ls[0] ?? '');
        const out: number[] = [];
        for (let i = 1; i <= r; i++) {
          const row = readInts(ls[i] ?? '');
          let s = 0;
          for (const v of row) s += v;
          out.push(s);
        }
        return out.join(' ');
      },
      inputs: [
        '2 3\n1 2 3\n4 5 6',
        '1 1\n7',
        '3 2\n1 1\n2 2\n3 3',
        '2 2\n-1 -2\n-3 -4',
        '1 4\n10 20 30 40',
        '4 1\n5\n6\n7\n8',
        '3 3\n0 0 0\n1 1 1\n2 2 2',
        '2 4\n1 1 1 1\n2 2 2 2',
      ],
    },
    {
      key: '13',
      title: 'Cot co tong lon nhat',
      difficulty: 'MEDIUM',
      story:
        'Cho mot ma tran `r` hang `c` cot, hay tim chi so cot (danh so tu 1) co TONG LON NHAT. ' +
        'Neu co nhieu cot cung tong lon nhat, in cot co chi so nho nhat.\n\n' +
        'Dong 1 chua `r` va `c`. `r` dong tiep theo, moi dong chua `c` so nguyen ' +
        '(1 <= r, c <= 100, |a[i][j]| <= 10^6).',
      inputDesc: 'Dong 1: hai so `r` va `c`. Sau do `r` dong, moi dong `c` so nguyen.',
      outputDesc: 'In ra chi so 1-based cua cot co tong lon nhat (chi so nho nhat neu bang nhau).',
      note: 'Tinh tong tung cot bang cach cong a[i][j] qua moi hang, roi chon cot co tong lon nhat.',
      solve: (input) => {
        const ls = lines(input);
        const [r, c] = readInts(ls[0] ?? '');
        const colSum = new Array(c).fill(0);
        for (let i = 1; i <= r; i++) {
          const row = readInts(ls[i] ?? '');
          for (let j = 0; j < c; j++) colSum[j] += row[j];
        }
        let bestIdx = 0;
        for (let j = 1; j < c; j++) {
          if (colSum[j] > colSum[bestIdx]) bestIdx = j;
        }
        return String(bestIdx + 1);
      },
      inputs: [
        '2 3\n1 2 3\n4 5 6',
        '1 1\n7',
        '3 2\n1 5\n1 5\n1 5',
        '2 2\n-1 -2\n-3 -4',
        '2 4\n5 5 5 5\n5 5 5 5',
        '3 3\n9 0 0\n0 9 0\n0 0 9',
        '1 4\n3 1 4 1',
        '2 3\n10 1 1\n1 1 10',
      ],
    },
    {
      key: '14',
      title: 'Duong cheo ma tran vuong',
      difficulty: 'MEDIUM',
      story:
        'Cho mot ma tran VUONG `n` x `n`, hay tinh tong duong cheo chinh va tong duong cheo phu. ' +
        'Duong cheo chinh la cac o (i, i), duong cheo phu la cac o (i, n-1-i).\n\n' +
        'Dong 1 chua `n`. `n` dong tiep theo, moi dong chua `n` so nguyen (1 <= n <= 100).',
      inputDesc: 'Dong 1: so `n`. Sau do `n` dong, moi dong `n` so nguyen.',
      outputDesc: 'In ra hai so tren mot dong: tong duong cheo chinh roi tong duong cheo phu.',
      note: 'Voi i tu 0 toi n-1: cong a[i][i] cho cheo chinh va a[i][n-1-i] cho cheo phu.',
      solve: (input) => {
        const ls = lines(input);
        const n = toInt(ls[0] ?? '0');
        let main = 0;
        let anti = 0;
        for (let i = 0; i < n; i++) {
          const row = readInts(ls[i + 1] ?? '');
          main += row[i];
          anti += row[n - 1 - i];
        }
        return main + ' ' + anti;
      },
      inputs: [
        '3\n1 2 3\n4 5 6\n7 8 9',
        '1\n7',
        '2\n1 2\n3 4',
        '3\n-1 0 0\n0 -2 0\n0 0 -3',
        '4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1',
        '2\n5 5\n5 5',
        '3\n0 0 1\n0 1 0\n1 0 0',
        '4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16',
      ],
    },
    {
      key: '15',
      title: 'Dem uoc cua so',
      difficulty: 'MEDIUM',
      story:
        'Cho `n` (1 <= n <= 10^12 nhung trong cac test gioi han <= 10^12 chi danh cho minh hoa; thuc te ' +
        '1 <= n <= 10^9), hay dem so luong uoc duong cua `n`. ' +
        'De an toan, gioi han `1 <= n <= 1000000000`.',
      inputDesc: 'Mot so nguyen duong `n` (1 <= n <= 10^9).',
      outputDesc: 'In ra so luong uoc duong cua `n`.',
      note: 'Duyet i tu 1 toi can n: neu n chia het i, dem ca i va n/i (tru truong hop i = n/i).',
      solve: (input) => {
        const n = toInt(input);
        let count = 0;
        for (let i = 1; i * i <= n; i++) {
          if (n % i === 0) {
            count++;
            if (i !== n / i) count++;
          }
        }
        return String(count);
      },
      inputs: ['12', '1', '7', '36', '100', '999983', '1000000000', '49'],
    },
    {
      key: '16',
      title: 'Phan tich thua so nguyen to',
      difficulty: 'HARD',
      story:
        'Cho `n` (2 <= n <= 10^9), hay in ra phan tich thua so nguyen to dang `p^e` ghep bang dau cach, ' +
        'cac thua so nguyen to theo thu tu tang dan. Vi du 360 = `2^3 3^2 5^1`.\n\n' +
        'Cho `n`.',
      inputDesc: 'Mot so nguyen `n` (2 <= n <= 10^9).',
      outputDesc: 'In ra cac thua so dang `p^e` cach nhau dau cach, theo p tang dan.',
      note: 'Chia n lien tuc cho moi uoc d tu 2 toi can n, dem so mu; neu con lai > 1 thi do la mot nguyen to.',
      solve: (input) => {
        let n = toInt(input);
        const parts: string[] = [];
        for (let d = 2; d * d <= n; d++) {
          if (n % d === 0) {
            let e = 0;
            while (n % d === 0) {
              e++;
              n = Math.floor(n / d);
            }
            parts.push(d + '^' + e);
          }
        }
        if (n > 1) parts.push(n + '^1');
        return parts.join(' ');
      },
      inputs: ['360', '2', '97', '12', '64', '1000000000', '999983', '100'],
    },
    {
      key: '17',
      title: 'Cua so truot tong k phan tu',
      difficulty: 'HARD',
      story:
        'Cho mang `n` so nguyen va so `k`, hay tim TONG LON NHAT cua `k` phan tu LIEN TIEP. ' +
        '(Dam bao 1 <= k <= n.)\n\n' +
        'Dong 1 chua `n` va `k`. Dong 2 chua `n` so nguyen ' +
        '(1 <= k <= n <= 100000, -10^6 <= a[i] <= 10^6).',
      inputDesc: 'Dong 1: hai so `n` va `k`. Dong 2: `n` so nguyen cach nhau dau cach.',
      outputDesc: 'In ra tong lon nhat cua `k` phan tu lien tiep.',
      note: 'Cua so truot: tinh tong k phan tu dau, roi truot cong them phan tu moi va bo phan tu cu.',
      solve: (input) => {
        const ls = lines(input);
        const [, k] = readInts(ls[0] ?? '');
        const a = readInts(ls[1] ?? '');
        let win = 0;
        for (let i = 0; i < k; i++) win += a[i];
        let best = win;
        for (let i = k; i < a.length; i++) {
          win += a[i] - a[i - k];
          if (win > best) best = win;
        }
        return String(best);
      },
      inputs: [
        '5 2\n1 2 3 4 5',
        '1 1\n7',
        '5 5\n1 2 3 4 5',
        '6 3\n-1 -2 -3 -4 -5 -6',
        '4 2\n10 -5 10 -5',
        '7 3\n2 1 5 1 3 2 0',
        '5 1\n3 -1 4 -1 5',
        '6 2\n-5 -1 -3 -2 -4 -6',
      ],
    },
    {
      key: '18',
      title: 'Mo phong robot tren luoi',
      difficulty: 'HARD',
      story:
        'Mot robot dung tai goc (0, 0) tren luoi vo han, ban dau quay huong BAC. ' +
        'Em nhap mot chuoi lenh gom cac ky tu: `F` di thang 1 buoc theo huong dang quay, ' +
        '`L` quay trai 90 do, `R` quay phai 90 do. Huong BAC tang toa do y, DONG tang toa do x. ' +
        'Hay in ra toa do `x y` cuoi cung cua robot.\n\n' +
        'Mot dong chua chuoi lenh (do dai 1..1000, chi gom `F`, `L`, `R`).',
      inputDesc: 'Mot dong chua chuoi lenh gom cac ky tu F, L, R.',
      outputDesc: 'In ra hai so `x y` la toa do cuoi cung, cach nhau dau cach.',
      note: 'Luu huong bang vector (dx, dy). L/R xoay vector. F cong vector vao toa do hien tai.',
      solve: (input) => {
        const cmd = firstLine(input);
        let x = 0;
        let y = 0;
        // dir 0=N,1=E,2=S,3=W
        const dx = [0, 1, 0, -1];
        const dy = [1, 0, -1, 0];
        let dir = 0;
        for (const ch of cmd) {
          if (ch === 'F') {
            x += dx[dir];
            y += dy[dir];
          } else if (ch === 'R') {
            dir = (dir + 1) % 4;
          } else if (ch === 'L') {
            dir = (dir + 3) % 4;
          }
        }
        return x + ' ' + y;
      },
      inputs: [
        'FF',
        'FRFRFRF',
        'FLFLFLF',
        'F',
        'RRFF',
        'FRRF',
        'LFLFLFLF',
        'FFFRFFFRFFFRFFF',
      ],
    },
    {
      key: '19',
      title: 'Tham lam doi xu le',
      difficulty: 'HARD',
      story:
        'Co `n` cong viec, cong viec thu `i` co thoi luong `t[i]`. Cac cong viec duoc lam tuan tu tren mot may. ' +
        'Thoi gian cho cua mot cong viec la tong thoi luong cac cong viec lam truoc no (ke ca cho ban than no). ' +
        'Hay sap xep thu tu lam de TONG THOI GIAN HOAN THANH (tong cac thoi diem ket thuc) la NHO NHAT, ' +
        'roi in tong nho nhat do.\n\n' +
        'Dong 1 chua `n`. Dong 2 chua `n` so nguyen `t[i]` (1 <= n <= 1000, 1 <= t[i] <= 1000).',
      inputDesc: 'Dong 1: so luong `n`. Dong 2: `n` so nguyen thoi luong.',
      outputDesc: 'In ra tong cac thoi diem hoan thanh nho nhat co the.',
      note: 'Tham lam: lam cong viec ngan truoc (sap xep tang dan). Tong = sum cua tong tien to.',
      solve: (input) => {
        const ls = lines(input);
        const t = readInts(ls[1] ?? '').sort((a, b) => a - b);
        let prefix = 0;
        let total = 0;
        for (const x of t) {
          prefix += x;
          total += prefix;
        }
        return String(total);
      },
      inputs: [
        '3\n3 1 2',
        '1\n5',
        '4\n4 3 2 1',
        '5\n1 1 1 1 1',
        '3\n10 10 10',
        '4\n1 2 3 4',
        '2\n1000 1',
        '6\n6 5 4 3 2 1',
      ],
    },
    {
      key: '20',
      title: 'Day con khong giam dai nhat (LIS)',
      difficulty: 'HARD',
      story:
        'Cho mang `n` so nguyen, hay tim do dai cua DAY CON tang dan ngat dai nhat (LIS). ' +
        'Day con khong nhat thiet lien tiep, nhung phai giu thu tu va moi phan tu lon hon phan tu truoc trong day con.\n\n' +
        'Dong 1 chua `n`. Dong 2 chua `n` so nguyen (1 <= n <= 1000, |a[i]| <= 10^6).',
      inputDesc: 'Dong 1: so luong `n`. Dong 2: `n` so nguyen cach nhau dau cach.',
      outputDesc: 'In ra do dai day con tang dan ngat dai nhat.',
      note: 'Quy hoach dong O(n^2): dp[i] = 1 + max(dp[j]) voi j < i va a[j] < a[i]. Dap an la max dp[i].',
      solve: (input) => {
        const ls = lines(input);
        const a = readInts(ls[1] ?? '');
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
        '6\n10 9 2 5 3 7',
        '1\n7',
        '5\n5 4 3 2 1',
        '4\n1 2 3 4',
        '8\n0 8 4 12 2 10 6 14',
        '5\n3 3 3 3 3',
        '6\n-2 -1 0 -3 1 2',
        '7\n1 3 2 4 3 5 4',
      ],
    },
  ],
};

export default course;

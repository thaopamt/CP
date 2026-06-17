import { CourseSpec, ProblemSpec, TestInputSpec } from '../types';

const row = (a: number[]) => a.join(' ');
const rows = (m: number[][]) => m.map(row).join('\n');
const nums = (input: string) => input.trim().split(/\s+/).filter(Boolean).map(Number);
const outLines = (values: Array<number | string>) => values.join('\n');

const TAGS_BY_CASE: TestInputSpec['tags'][] = [
  ['smallest', 'query_start', 'query_end', 'whole_range'],
  ['largest'],
  ['all_negative'],
  ['all_positive'],
  ['has_zero'],
  ['duplicates'],
  ['query_start'],
  ['query_end'],
  ['whole_range'],
  ['index_trap'],
];

function cases(inputs: string[]): TestInputSpec[] {
  if (inputs.length !== 10) {
    throw new Error(`Expected exactly 10 inputs, got ${inputs.length}`);
  }
  return inputs.map((input, i) => ({ input, tags: TAGS_BY_CASE[i] }));
}

function editorial(
  solutionIdea: string,
  timeComplexity: string,
  memoryComplexity: string,
  sampleCode: string,
): ProblemSpec['editorial'] {
  return {
    solutionIdea,
    timeComplexity,
    memoryComplexity,
    sampleCodeLanguage: 'cpp17',
    sampleCode,
  };
}

const oneRange = (a: number[], l: number, r: number) => `${a.length}\n${row(a)}\n${l} ${r}`;
const rangeQueries = (a: number[], qs: Array<[number, number]>) =>
  `${a.length} ${qs.length}\n${row(a)}\n${qs.map(([l, r]) => `${l} ${r}`).join('\n')}`;
const rangeQueriesK = (k: number, a: number[], qs: Array<[number, number]>) =>
  `${a.length} ${qs.length} ${k}\n${row(a)}\n${qs.map(([l, r]) => `${l} ${r}`).join('\n')}`;
const arrayWithK = (k: number, a: number[]) => `${a.length} ${k}\n${row(a)}`;
const arrayOnly = (a: number[]) => `${a.length}\n${row(a)}`;
const circularQueries = (a: number[], qs: Array<[number, number]>) =>
  `${a.length} ${qs.length}\n${row(a)}\n${qs.map(([start, len]) => `${start} ${len}`).join('\n')}`;
const matrixQueries = (m: number[][], qs: Array<[number, number, number, number]>) =>
  `${m.length} ${m[0].length} ${qs.length}\n${rows(m)}\n${qs.map((q) => q.join(' ')).join('\n')}`;
const squareCase = (k: number, m: number[][]) => `${m.length} ${m[0].length} ${k}\n${rows(m)}`;
const pointUpdates = (a: number[], updates: Array<[number, number, number]>, qs: number[]) =>
  `${a.length} ${updates.length} ${qs.length}\n${row(a)}\n${updates.map((u) => u.join(' ')).join('\n')}\n${qs.join('\n')}`;
const rangeAddPrint = (a: number[], updates: Array<[number, number, number]>) =>
  `${a.length} ${updates.length}\n${row(a)}\n${updates.map((u) => u.join(' ')).join('\n')}`;
const rangeAddSum = (a: number[], updates: Array<[number, number, number]>, qs: Array<[number, number]>) =>
  `${a.length} ${updates.length} ${qs.length}\n${row(a)}\n${updates.map((u) => u.join(' ')).join('\n')}\n${qs.map((q) => q.join(' ')).join('\n')}`;
const coverCase = (n: number, segments: Array<[number, number]>) =>
  `${n} ${segments.length}\n${segments.map((s) => s.join(' ')).join('\n')}`;
const rectAddPrint = (m: number[][], updates: Array<[number, number, number, number, number]>) =>
  `${m.length} ${m[0].length} ${updates.length}\n${rows(m)}\n${updates.map((u) => u.join(' ')).join('\n')}`;
const rectAddSum = (
  m: number[][],
  updates: Array<[number, number, number, number, number]>,
  qs: Array<[number, number, number, number]>,
) =>
  `${m.length} ${m[0].length} ${updates.length} ${qs.length}\n${rows(m)}\n${updates.map((u) => u.join(' ')).join('\n')}\n${qs.map((q) => q.join(' ')).join('\n')}`;

function solveOneRange(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++];
  const arr = a.slice(p, p + n);
  p += n;
  const l = a[p++],
    r = a[p++];
  return String(arr.slice(l - 1, r).reduce((s, x) => s + x, 0));
}

function solveRangeSum(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const arr = a.slice(p, p + n);
  p += n;
  const pref = [0];
  for (const x of arr) pref.push(pref[pref.length - 1] + x);
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    ans.push(pref[r] - pref[l - 1]);
  }
  return outLines(ans);
}

function solveOutside(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const arr = a.slice(p, p + n);
  p += n;
  const pref = [0];
  for (const x of arr) pref.push(pref[pref.length - 1] + x);
  const total = pref[n];
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    ans.push(total - (pref[r] - pref[l - 1]));
  }
  return outLines(ans);
}

function solveCountSigns(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const neg = [0],
    zero = [0],
    pos = [0];
  for (let i = 0; i < n; i++) {
    const x = a[p++];
    neg.push(neg[i] + (x < 0 ? 1 : 0));
    zero.push(zero[i] + (x === 0 ? 1 : 0));
    pos.push(pos[i] + (x > 0 ? 1 : 0));
  }
  const ans: string[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    ans.push(`${neg[r] - neg[l - 1]} ${zero[r] - zero[l - 1]} ${pos[r] - pos[l - 1]}`);
  }
  return outLines(ans);
}

function solveEvenSum(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const pref = [0];
  for (let i = 0; i < n; i++) {
    const x = a[p++];
    pref.push(pref[i] + (x % 2 === 0 ? x : 0));
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    ans.push(pref[r] - pref[l - 1]);
  }
  return outLines(ans);
}

function solveDivisibleSum(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++],
    k = a[p++];
  const pref = [0];
  for (let i = 0; i < n; i++) {
    const x = a[p++];
    pref.push(pref[i] + (x % k === 0 ? x : 0));
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    ans.push(pref[r] - pref[l - 1]);
  }
  return outLines(ans);
}

function solveAlternating(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const pref = [0];
  for (let i = 1; i <= n; i++) {
    const x = a[p++];
    pref.push(pref[i - 1] + (i % 2 ? x : -x));
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    const raw = pref[r] - pref[l - 1];
    ans.push(l % 2 ? raw : -raw);
  }
  return outLines(ans);
}

function solveWeighted(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const pref = [0],
    prefI = [0];
  for (let i = 1; i <= n; i++) {
    const x = a[p++];
    pref.push(pref[i - 1] + x);
    prefI.push(prefI[i - 1] + i * x);
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    const sum = pref[r] - pref[l - 1];
    const sumI = prefI[r] - prefI[l - 1];
    ans.push(sumI - (l - 1) * sum);
  }
  return outLines(ans);
}

function solveEquilibrium(input: string): string {
  const a = nums(input);
  const n = a[0];
  const arr = a.slice(1, 1 + n);
  const total = arr.reduce((s, x) => s + x, 0);
  let left = 0;
  for (let i = 0; i < n; i++) {
    if (left === total - left - arr[i]) return String(i + 1);
    left += arr[i];
  }
  return '-1';
}

function solveFixedWindow(input: string, pickMax: boolean): string {
  const a = nums(input);
  const n = a[0],
    k = a[1];
  const arr = a.slice(2, 2 + n);
  let cur = arr.slice(0, k).reduce((s, x) => s + x, 0);
  let best = cur;
  for (let i = k; i < n; i++) {
    cur += arr[i] - arr[i - k];
    best = pickMax ? Math.max(best, cur) : Math.min(best, cur);
  }
  return String(best);
}

function solveCountSubarraySum(input: string, target: number | null): string {
  const a = nums(input);
  const n = a[0];
  const k = target ?? a[1];
  const arr = a.slice(target === null ? 2 : 1, (target === null ? 2 : 1) + n);
  const cnt = new Map<number, number>([[0, 1]]);
  let pref = 0,
    ans = 0;
  for (const x of arr) {
    pref += x;
    ans += cnt.get(pref - k) ?? 0;
    cnt.set(pref, (cnt.get(pref) ?? 0) + 1);
  }
  return String(ans);
}

function solveCountDivisible(input: string): string {
  const a = nums(input);
  const n = a[0],
    k = a[1];
  const arr = a.slice(2, 2 + n);
  const cnt = new Array(k).fill(0);
  cnt[0] = 1;
  let pref = 0,
    ans = 0;
  for (const x of arr) {
    pref = (((pref + x) % k) + k) % k;
    ans += cnt[pref];
    cnt[pref]++;
  }
  return String(ans);
}

function solveLongestSum(input: string): string {
  const a = nums(input);
  const n = a[0],
    k = a[1];
  const arr = a.slice(2, 2 + n);
  const first = new Map<number, number>([[0, 0]]);
  let pref = 0,
    best = 0;
  for (let i = 1; i <= n; i++) {
    pref += arr[i - 1];
    if (first.has(pref - k)) best = Math.max(best, i - (first.get(pref - k) as number));
    if (!first.has(pref)) first.set(pref, i);
  }
  return String(best);
}

function solveLongestDivisible(input: string): string {
  const a = nums(input);
  const n = a[0],
    k = a[1];
  const arr = a.slice(2, 2 + n);
  const first = new Array(k).fill(-1);
  first[0] = 0;
  let pref = 0,
    best = 0;
  for (let i = 1; i <= n; i++) {
    pref = (((pref + arr[i - 1]) % k) + k) % k;
    if (first[pref] !== -1) best = Math.max(best, i - first[pref]);
    else first[pref] = i;
  }
  return String(best);
}

function solveBestSubarray(input: string, pickMax: boolean): string {
  const a = nums(input);
  const n = a[0];
  const arr = a.slice(1, 1 + n);
  let pref = 0;
  if (pickMax) {
    let minPref = 0,
      best = -Infinity;
    for (const x of arr) {
      pref += x;
      best = Math.max(best, pref - minPref);
      minPref = Math.min(minPref, pref);
    }
    return String(best);
  }
  let maxPref = 0,
    best = Infinity;
  for (const x of arr) {
    pref += x;
    best = Math.min(best, pref - maxPref);
    maxPref = Math.max(maxPref, pref);
  }
  return String(best);
}

function solveSplitThree(input: string): string {
  const a = nums(input);
  const n = a[0];
  const arr = a.slice(1, 1 + n);
  const total = arr.reduce((s, x) => s + x, 0);
  if (n < 3 || total % 3 !== 0) return 'NO';
  const target = total / 3;
  let pref = 0,
    firstCuts = 0;
  for (let i = 0; i < n - 1; i++) {
    pref += arr[i];
    if (pref === 2 * target && firstCuts > 0) return 'YES';
    if (pref === target) firstCuts++;
  }
  return 'NO';
}

function solveTwoSegments(input: string): string {
  const a = nums(input);
  const n = a[0];
  const arr = a.slice(1, 1 + n);
  const left = new Array(n);
  let cur = arr[0],
    best = arr[0];
  left[0] = best;
  for (let i = 1; i < n; i++) {
    cur = Math.max(arr[i], cur + arr[i]);
    best = Math.max(best, cur);
    left[i] = best;
  }
  const right = new Array(n);
  cur = arr[n - 1];
  best = arr[n - 1];
  right[n - 1] = best;
  for (let i = n - 2; i >= 0; i--) {
    cur = Math.max(arr[i], cur + arr[i]);
    best = Math.max(best, cur);
    right[i] = best;
  }
  let ans = -Infinity;
  for (let i = 0; i + 1 < n; i++) ans = Math.max(ans, left[i] + right[i + 1]);
  return String(ans);
}

function solvePointUpdates(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    q = a[p++];
  const base = a.slice(p, p + n);
  p += n;
  const diff = new Array(n + 2).fill(0);
  for (let i = 0; i < m; i++) {
    const l = a[p++],
      r = a[p++],
      x = a[p++];
    diff[l] += x;
    diff[r + 1] -= x;
  }
  const final = [0];
  let add = 0;
  for (let i = 1; i <= n; i++) {
    add += diff[i];
    final[i] = base[i - 1] + add;
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) ans.push(final[a[p++]]);
  return outLines(ans);
}

function solveRangeAddPrint(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++];
  const base = a.slice(p, p + n);
  p += n;
  const diff = new Array(n + 2).fill(0);
  for (let i = 0; i < m; i++) {
    const l = a[p++],
      r = a[p++],
      x = a[p++];
    diff[l] += x;
    diff[r + 1] -= x;
  }
  const ans: number[] = [];
  let add = 0;
  for (let i = 1; i <= n; i++) {
    add += diff[i];
    ans.push(base[i - 1] + add);
  }
  return row(ans);
}

function solveRangeAddSum(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    q = a[p++];
  const base = a.slice(p, p + n);
  p += n;
  const diff = new Array(n + 2).fill(0);
  for (let i = 0; i < m; i++) {
    const l = a[p++],
      r = a[p++],
      x = a[p++];
    diff[l] += x;
    diff[r + 1] -= x;
  }
  const pref = [0];
  let add = 0;
  for (let i = 1; i <= n; i++) {
    add += diff[i];
    pref[i] = pref[i - 1] + base[i - 1] + add;
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const l = a[p++],
      r = a[p++];
    ans.push(pref[r] - pref[l - 1]);
  }
  return outLines(ans);
}

function solveCoverage(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++];
  const diff = new Array(n + 2).fill(0);
  for (let i = 0; i < m; i++) {
    const l = a[p++],
      r = a[p++];
    diff[l]++;
    diff[r + 1]--;
  }
  let cur = 0,
    best = 0;
  for (let i = 1; i <= n; i++) {
    cur += diff[i];
    best = Math.max(best, cur);
  }
  return String(best);
}

function solveCircular(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    q = a[p++];
  const arr = a.slice(p, p + n);
  p += n;
  const b = arr.concat(arr);
  const pref = [0];
  for (const x of b) pref.push(pref[pref.length - 1] + x);
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const start = a[p++],
      len = a[p++];
    ans.push(pref[start + len - 1] - pref[start - 1]);
  }
  return outLines(ans);
}

function solveMatrixSum(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    q = a[p++];
  const pref = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const x = a[p++];
      pref[i][j] = x + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1];
    }
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const x1 = a[p++],
      y1 = a[p++],
      x2 = a[p++],
      y2 = a[p++];
    ans.push(pref[x2][y2] - pref[x1 - 1][y2] - pref[x2][y1 - 1] + pref[x1 - 1][y1 - 1]);
  }
  return outLines(ans);
}

function solveMatrixSigns(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    q = a[p++];
  const neg = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const zero = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const pos = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const x = a[p++];
      neg[i][j] = (x < 0 ? 1 : 0) + neg[i - 1][j] + neg[i][j - 1] - neg[i - 1][j - 1];
      zero[i][j] = (x === 0 ? 1 : 0) + zero[i - 1][j] + zero[i][j - 1] - zero[i - 1][j - 1];
      pos[i][j] = (x > 0 ? 1 : 0) + pos[i - 1][j] + pos[i][j - 1] - pos[i - 1][j - 1];
    }
  }
  const get = (pref: number[][], x1: number, y1: number, x2: number, y2: number) =>
    pref[x2][y2] - pref[x1 - 1][y2] - pref[x2][y1 - 1] + pref[x1 - 1][y1 - 1];
  const ans: string[] = [];
  for (let i = 0; i < q; i++) {
    const x1 = a[p++],
      y1 = a[p++],
      x2 = a[p++],
      y2 = a[p++];
    ans.push(`${get(neg, x1, y1, x2, y2)} ${get(zero, x1, y1, x2, y2)} ${get(pos, x1, y1, x2, y2)}`);
  }
  return outLines(ans);
}

function solveMaxSquare(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    k = a[p++];
  const pref = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const x = a[p++];
      pref[i][j] = x + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1];
    }
  }
  let best = -Infinity;
  for (let i = k; i <= n; i++) {
    for (let j = k; j <= m; j++) {
      best = Math.max(best, pref[i][j] - pref[i - k][j] - pref[i][j - k] + pref[i - k][j - k]);
    }
  }
  return String(best);
}

function solveRectAddPrint(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    u = a[p++];
  const base = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) base[i][j] = a[p++];
  const diff = Array.from({ length: n + 2 }, () => new Array(m + 2).fill(0));
  for (let i = 0; i < u; i++) {
    const x1 = a[p++],
      y1 = a[p++],
      x2 = a[p++],
      y2 = a[p++],
      v = a[p++];
    diff[x1][y1] += v;
    diff[x2 + 1][y1] -= v;
    diff[x1][y2 + 1] -= v;
    diff[x2 + 1][y2 + 1] += v;
  }
  const ans: string[] = [];
  for (let i = 1; i <= n; i++) {
    const line: number[] = [];
    for (let j = 1; j <= m; j++) {
      diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
      line.push(base[i][j] + diff[i][j]);
    }
    ans.push(row(line));
  }
  return outLines(ans);
}

function solveRectAddSum(input: string): string {
  const a = nums(input);
  let p = 0;
  const n = a[p++],
    m = a[p++],
    u = a[p++],
    q = a[p++];
  const base = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) base[i][j] = a[p++];
  const diff = Array.from({ length: n + 2 }, () => new Array(m + 2).fill(0));
  for (let i = 0; i < u; i++) {
    const x1 = a[p++],
      y1 = a[p++],
      x2 = a[p++],
      y2 = a[p++],
      v = a[p++];
    diff[x1][y1] += v;
    diff[x2 + 1][y1] -= v;
    diff[x1][y2 + 1] -= v;
    diff[x2 + 1][y2 + 1] += v;
  }
  const pref = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
      const v = base[i][j] + diff[i][j];
      pref[i][j] = v + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1];
    }
  }
  const ans: number[] = [];
  for (let i = 0; i < q; i++) {
    const x1 = a[p++],
      y1 = a[p++],
      x2 = a[p++],
      y2 = a[p++];
    ans.push(pref[x2][y2] - pref[x1 - 1][y2] - pref[x2][y1 - 1] + pref[x1 - 1][y1 - 1]);
  }
  return outLines(ans);
}

const code01 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + x;
    }
    int l, r;
    cin >> l >> r;
    cout << pref[r] - pref[l - 1] << '\n';
    return 0;
}
`;

const code02 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + x;
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << pref[r] - pref[l - 1] << '\n';
    }
    return 0;
}
`;

const code03 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + x;
    }
    long long total = pref[n];
    while (q--) {
        int l, r;
        cin >> l >> r;
        long long removed = pref[r] - pref[l - 1];
        cout << total - removed << '\n';
    }
    return 0;
}
`;

const code04 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<int> neg(n + 1), zero(n + 1), pos(n + 1);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        neg[i] = neg[i - 1] + (x < 0);
        zero[i] = zero[i - 1] + (x == 0);
        pos[i] = pos[i - 1] + (x > 0);
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << neg[r] - neg[l - 1] << ' '
             << zero[r] - zero[l - 1] << ' '
             << pos[r] - pos[l - 1] << '\n';
    }
    return 0;
}
`;

const code05 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + (x % 2 == 0 ? x : 0);
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << pref[r] - pref[l - 1] << '\n';
    }
    return 0;
}
`;

const code06 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    long long k;
    cin >> n >> q >> k;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + (x % k == 0 ? x : 0);
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << pref[r] - pref[l - 1] << '\n';
    }
    return 0;
}
`;

const code07 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + (i % 2 ? x : -x);
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        long long ans = pref[r] - pref[l - 1];
        if (l % 2 == 0) ans = -ans;
        cout << ans << '\n';
    }
    return 0;
}
`;

const code08 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<long long> pref(n + 1, 0), prefIndex(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + x;
        prefIndex[i] = prefIndex[i - 1] + 1LL * i * x;
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        long long sum = pref[r] - pref[l - 1];
        long long sumIndex = prefIndex[r] - prefIndex[l - 1];
        cout << sumIndex - 1LL * (l - 1) * sum << '\n';
    }
    return 0;
}
`;

const code09 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n);
    long long total = 0;
    for (long long &x : a) {
        cin >> x;
        total += x;
    }
    long long left = 0;
    for (int i = 0; i < n; ++i) {
        if (left == total - left - a[i]) {
            cout << i + 1 << '\n';
            return 0;
        }
        left += a[i];
    }
    cout << -1 << '\n';
    return 0;
}
`;

const code10 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<long long> a(n + 1), pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        pref[i] = pref[i - 1] + a[i];
    }
    long long best = LLONG_MIN;
    for (int r = k; r <= n; ++r) {
        best = max(best, pref[r] - pref[r - k]);
    }
    cout << best << '\n';
    return 0;
}
`;

const code11 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<long long> pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref[i] = pref[i - 1] + x;
    }
    long long best = LLONG_MAX;
    for (int r = k; r <= n; ++r) {
        best = min(best, pref[r] - pref[r - k]);
    }
    cout << best << '\n';
    return 0;
}
`;

const code12 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long k;
    cin >> n >> k;
    unordered_map<long long, long long> cnt;
    cnt[0] = 1;
    long long pref = 0, ans = 0;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        pref += x;
        if (cnt.count(pref - k)) ans += cnt[pref - k];
        cnt[pref]++;
    }
    cout << ans << '\n';
    return 0;
}
`;

const code13 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    unordered_map<long long, long long> cnt;
    cnt[0] = 1;
    long long pref = 0, ans = 0;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        pref += x;
        ans += cnt[pref];
        cnt[pref]++;
    }
    cout << ans << '\n';
    return 0;
}
`;

const code14 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<long long> cnt(k, 0);
    cnt[0] = 1;
    long long pref = 0, ans = 0;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        pref = (pref + x) % k;
        if (pref < 0) pref += k;
        ans += cnt[pref];
        cnt[pref]++;
    }
    cout << ans << '\n';
    return 0;
}
`;

const code15 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long k;
    cin >> n >> k;
    unordered_map<long long, int> first;
    first[0] = 0;
    long long pref = 0;
    int best = 0;
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref += x;
        if (first.count(pref - k)) best = max(best, i - first[pref - k]);
        if (!first.count(pref)) first[pref] = i;
    }
    cout << best << '\n';
    return 0;
}
`;

const code16 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<int> first(k, -1);
    first[0] = 0;
    long long pref = 0;
    int best = 0;
    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;
        pref = (pref + x) % k;
        if (pref < 0) pref += k;
        if (first[pref] != -1) best = max(best, i - first[pref]);
        else first[pref] = i;
    }
    cout << best << '\n';
    return 0;
}
`;

const code17 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long pref = 0, minPref = 0, best = LLONG_MIN;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        pref += x;
        best = max(best, pref - minPref);
        minPref = min(minPref, pref);
    }
    cout << best << '\n';
    return 0;
}
`;

const code18 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long pref = 0, maxPref = 0, best = LLONG_MAX;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        pref += x;
        best = min(best, pref - maxPref);
        maxPref = max(maxPref, pref);
    }
    cout << best << '\n';
    return 0;
}
`;

const code19 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n);
    long long total = 0;
    for (long long &x : a) {
        cin >> x;
        total += x;
    }
    if (n < 3 || total % 3 != 0) {
        cout << "NO\n";
        return 0;
    }
    long long target = total / 3, pref = 0;
    int firstCuts = 0;
    for (int i = 0; i < n - 1; ++i) {
        pref += a[i];
        if (pref == 2 * target && firstCuts > 0) {
            cout << "YES\n";
            return 0;
        }
        if (pref == target) firstCuts++;
    }
    cout << "NO\n";
    return 0;
}
`;

const code20 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> a(n), leftBest(n), rightBest(n);
    for (long long &x : a) cin >> x;
    long long cur = a[0], best = a[0];
    leftBest[0] = best;
    for (int i = 1; i < n; ++i) {
        cur = max(a[i], cur + a[i]);
        best = max(best, cur);
        leftBest[i] = best;
    }
    cur = best = a[n - 1];
    rightBest[n - 1] = best;
    for (int i = n - 2; i >= 0; --i) {
        cur = max(a[i], cur + a[i]);
        best = max(best, cur);
        rightBest[i] = best;
    }
    long long ans = LLONG_MIN;
    for (int i = 0; i + 1 < n; ++i) ans = max(ans, leftBest[i] + rightBest[i + 1]);
    cout << ans << '\n';
    return 0;
}
`;

const code21 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, q;
    cin >> n >> m >> q;
    vector<long long> a(n + 1), diff(n + 2, 0);
    for (int i = 1; i <= n; ++i) cin >> a[i];
    while (m--) {
        int l, r;
        long long x;
        cin >> l >> r >> x;
        diff[l] += x;
        diff[r + 1] -= x;
    }
    for (int i = 1; i <= n; ++i) {
        diff[i] += diff[i - 1];
        a[i] += diff[i];
    }
    while (q--) {
        int p;
        cin >> p;
        cout << a[p] << '\n';
    }
    return 0;
}
`;

const code22 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    vector<long long> a(n + 1), diff(n + 2, 0);
    for (int i = 1; i <= n; ++i) cin >> a[i];
    while (m--) {
        int l, r;
        long long x;
        cin >> l >> r >> x;
        diff[l] += x;
        diff[r + 1] -= x;
    }
    for (int i = 1; i <= n; ++i) {
        diff[i] += diff[i - 1];
        if (i > 1) cout << ' ';
        cout << a[i] + diff[i];
    }
    cout << '\n';
    return 0;
}
`;

const code23 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, q;
    cin >> n >> m >> q;
    vector<long long> a(n + 1), diff(n + 2, 0), pref(n + 1, 0);
    for (int i = 1; i <= n; ++i) cin >> a[i];
    while (m--) {
        int l, r;
        long long x;
        cin >> l >> r >> x;
        diff[l] += x;
        diff[r + 1] -= x;
    }
    for (int i = 1; i <= n; ++i) {
        diff[i] += diff[i - 1];
        pref[i] = pref[i - 1] + a[i] + diff[i];
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << pref[r] - pref[l - 1] << '\n';
    }
    return 0;
}
`;

const code24 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    vector<int> diff(n + 2, 0);
    while (m--) {
        int l, r;
        cin >> l >> r;
        diff[l]++;
        diff[r + 1]--;
    }
    int cur = 0, best = 0;
    for (int i = 1; i <= n; ++i) {
        cur += diff[i];
        best = max(best, cur);
    }
    cout << best << '\n';
    return 0;
}
`;

const code25 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<long long> b(2 * n + 1), pref(2 * n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        cin >> b[i];
        b[i + n] = b[i];
    }
    for (int i = 1; i <= 2 * n; ++i) pref[i] = pref[i - 1] + b[i];
    while (q--) {
        int start, len;
        cin >> start >> len;
        cout << pref[start + len - 1] - pref[start - 1] << '\n';
    }
    return 0;
}
`;

const code26 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<long long>> pref(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            long long x;
            cin >> x;
            pref[i][j] = x + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1];
        }
    }
    while (q--) {
        int x1, y1, x2, y2;
        cin >> x1 >> y1 >> x2 >> y2;
        cout << pref[x2][y2] - pref[x1 - 1][y2] - pref[x2][y1 - 1] + pref[x1 - 1][y1 - 1] << '\n';
    }
    return 0;
}
`;

const code27 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int get(const vector<vector<int>>& pref, int x1, int y1, int x2, int y2) {
    return pref[x2][y2] - pref[x1 - 1][y2] - pref[x2][y1 - 1] + pref[x1 - 1][y1 - 1];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<int>> neg(n + 1, vector<int>(m + 1, 0));
    vector<vector<int>> zero(n + 1, vector<int>(m + 1, 0));
    vector<vector<int>> pos(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            long long x;
            cin >> x;
            neg[i][j] = (x < 0) + neg[i - 1][j] + neg[i][j - 1] - neg[i - 1][j - 1];
            zero[i][j] = (x == 0) + zero[i - 1][j] + zero[i][j - 1] - zero[i - 1][j - 1];
            pos[i][j] = (x > 0) + pos[i - 1][j] + pos[i][j - 1] - pos[i - 1][j - 1];
        }
    }
    while (q--) {
        int x1, y1, x2, y2;
        cin >> x1 >> y1 >> x2 >> y2;
        cout << get(neg, x1, y1, x2, y2) << ' '
             << get(zero, x1, y1, x2, y2) << ' '
             << get(pos, x1, y1, x2, y2) << '\n';
    }
    return 0;
}
`;

const code28 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, k;
    cin >> n >> m >> k;
    vector<vector<long long>> pref(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            long long x;
            cin >> x;
            pref[i][j] = x + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1];
        }
    }
    long long best = LLONG_MIN;
    for (int i = k; i <= n; ++i) {
        for (int j = k; j <= m; ++j) {
            best = max(best, pref[i][j] - pref[i - k][j] - pref[i][j - k] + pref[i - k][j - k]);
        }
    }
    cout << best << '\n';
    return 0;
}
`;

const code29 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, u;
    cin >> n >> m >> u;
    vector<vector<long long>> a(n + 1, vector<long long>(m + 1, 0));
    vector<vector<long long>> diff(n + 2, vector<long long>(m + 2, 0));
    for (int i = 1; i <= n; ++i) for (int j = 1; j <= m; ++j) cin >> a[i][j];
    while (u--) {
        int x1, y1, x2, y2;
        long long v;
        cin >> x1 >> y1 >> x2 >> y2 >> v;
        diff[x1][y1] += v;
        diff[x2 + 1][y1] -= v;
        diff[x1][y2 + 1] -= v;
        diff[x2 + 1][y2 + 1] += v;
    }
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
            if (j > 1) cout << ' ';
            cout << a[i][j] + diff[i][j];
        }
        cout << '\n';
    }
    return 0;
}
`;

const code30 = String.raw`#include <algorithm>
#include <climits>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, u, q;
    cin >> n >> m >> u >> q;
    vector<vector<long long>> a(n + 1, vector<long long>(m + 1, 0));
    vector<vector<long long>> diff(n + 2, vector<long long>(m + 2, 0));
    vector<vector<long long>> pref(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; ++i) for (int j = 1; j <= m; ++j) cin >> a[i][j];
    while (u--) {
        int x1, y1, x2, y2;
        long long v;
        cin >> x1 >> y1 >> x2 >> y2 >> v;
        diff[x1][y1] += v;
        diff[x2 + 1][y1] -= v;
        diff[x1][y2 + 1] -= v;
        diff[x2 + 1][y2 + 1] += v;
    }
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
            long long value = a[i][j] + diff[i][j];
            pref[i][j] = value + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1];
        }
    }
    while (q--) {
        int x1, y1, x2, y2;
        cin >> x1 >> y1 >> x2 >> y2;
        cout << pref[x2][y2] - pref[x1 - 1][y2] - pref[x2][y1 - 1] + pref[x1 - 1][y1 - 1] << '\n';
    }
    return 0;
}
`;

const bigArray = Array.from({ length: 40 }, (_, i) => (i % 3 === 0 ? i + 1 : -(i + 2)));
const bigPositive = Array.from({ length: 40 }, (_, i) => i + 1);
const bigMatrix = Array.from({ length: 8 }, (_, i) =>
  Array.from({ length: 8 }, (_, j) => ((i + j) % 2 === 0 ? i + j + 1 : -(i + j + 2))),
);
const bigPositiveMatrix = Array.from({ length: 8 }, (_, i) =>
  Array.from({ length: 8 }, (_, j) => i * 8 + j + 1),
);

const standardRangeInputs = [
  oneRange([7], 1, 1),
  oneRange(bigArray, 2, 39),
  oneRange([-5, -4, -3, -2], 1, 4),
  oneRange([1, 2, 3, 4, 5], 2, 5),
  oneRange([0, 5, 0, -2, 3], 1, 3),
  oneRange([4, 4, 4, 4, 4], 2, 4),
  oneRange([9, -1, 2, 3], 1, 2),
  oneRange([9, -1, 2, 3], 3, 4),
  oneRange([6, -2, 5, -1], 1, 4),
  oneRange([10, 20, 30, 40], 2, 3),
];

const standardQueryInputs = [
  rangeQueries([7], [[1, 1]]),
  rangeQueries(bigArray, [
    [1, 40],
    [2, 39],
    [17, 23],
    [40, 40],
    [1, 1],
  ]),
  rangeQueries(
    [-5, -4, -3, -2],
    [
      [1, 4],
      [2, 3],
      [4, 4],
    ],
  ),
  rangeQueries(
    [1, 2, 3, 4, 5],
    [
      [1, 5],
      [2, 4],
      [5, 5],
    ],
  ),
  rangeQueries(
    [0, 5, 0, -2, 3],
    [
      [1, 3],
      [3, 5],
      [2, 2],
    ],
  ),
  rangeQueries(
    [4, 4, 4, 4, 4],
    [
      [2, 4],
      [1, 5],
      [3, 3],
    ],
  ),
  rangeQueries(
    [9, -1, 2, 3],
    [
      [1, 1],
      [1, 2],
    ],
  ),
  rangeQueries(
    [9, -1, 2, 3],
    [
      [4, 4],
      [3, 4],
    ],
  ),
  rangeQueries([6, -2, 5, -1], [[1, 4]]),
  rangeQueries(
    [10, 20, 30, 40],
    [
      [2, 3],
      [1, 2],
      [3, 4],
    ],
  ),
];

const problems: ProblemSpec[] = [
  {
    key: '01',
    title: 'Tổng đoạn cơ bản',
    difficulty: 'EASY',
    story:
      'Cho mảng $A$ gồm $N$ phần tử và một đoạn $[l, r]$. Hãy tính tổng các phần tử từ vị trí $l$ đến vị trí $r$ (đánh số từ 1).',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa $N$ số nguyên. Dòng 3 chứa hai số $l, r$.',
    outputDesc: 'In ra tổng của đoạn $[l, r]$.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$, $-10^9 \\le A_i \\le 10^9$, $1 \\le l \\le r \\le N$.',
    editorial: editorial(
      'Tạo mảng tiền tố `pref[i] = A1 + ... + Ai`. Tổng đoạn bằng `pref[r] - pref[l-1]`, giúp tránh cộng lại từng phần tử.',
      'O(N)',
      'O(N)',
      code01,
    ),
    solve: solveOneRange,
    inputs: cases(standardRangeInputs),
  },
  {
    key: '02',
    title: 'Tổng tiền tố nhiều truy vấn',
    difficulty: 'EASY',
    story: 'Cho mảng $A$ và $Q$ truy vấn, mỗi truy vấn hỏi tổng đoạn $[l, r]$.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi dòng trong $Q$ dòng sau chứa $l, r$.',
    outputDesc: 'Với mỗi truy vấn, in tổng đoạn trên một dòng.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$, $-10^9 \\le A_i \\le 10^9$.',
    editorial: editorial(
      'Tiền xử lý prefix sum một lần. Mỗi truy vấn trả lời bằng hiệu hai prefix, đặc biệt cẩn thận dùng `pref[0] = 0` cho đoạn bắt đầu tại 1.',
      'O(N + Q)',
      'O(N)',
      code02,
    ),
    solve: solveRangeSum,
    inputs: cases(standardQueryInputs),
  },
  {
    key: '03',
    title: 'Tổng ngoài đoạn bị xóa',
    difficulty: 'EASY',
    story: 'Mỗi truy vấn chọn một đoạn $[l, r]$ bị xóa khỏi mảng. Hãy tính tổng các phần tử còn lại.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $l, r$.',
    outputDesc: 'In tổng ngoài đoạn bị xóa cho từng truy vấn.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$. Giá trị và tổng dùng kiểu `long long`.',
    editorial: editorial(
      'Tính tổng toàn mảng bằng `pref[N]`. Với mỗi truy vấn, tổng còn lại là `pref[N] - (pref[r] - pref[l-1])`.',
      'O(N + Q)',
      'O(N)',
      code03,
    ),
    solve: solveOutside,
    inputs: cases(standardQueryInputs),
  },
  {
    key: '04',
    title: 'Đếm số âm, số 0, số dương trong đoạn',
    difficulty: 'EASY',
    story:
      'Với mỗi truy vấn $[l, r]$, hãy đếm trong đoạn có bao nhiêu số âm, bao nhiêu số bằng 0 và bao nhiêu số dương.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $l, r$.',
    outputDesc: 'Mỗi truy vấn in ba số: số âm, số 0, số dương.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Xây ba mảng tiền tố đếm: âm, bằng 0, dương. Số lượng trong đoạn cũng lấy bằng hiệu prefix như tổng đoạn.',
      'O(N + Q)',
      'O(N)',
      code04,
    ),
    solve: solveCountSigns,
    inputs: cases(standardQueryInputs),
  },
  {
    key: '05',
    title: 'Tổng các số chẵn trong đoạn',
    difficulty: 'EASY',
    story: 'Với mỗi truy vấn $[l, r]$, hãy tính tổng các phần tử chẵn nằm trong đoạn đó.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $l, r$.',
    outputDesc: 'In tổng các số chẵn trong từng đoạn.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Khi xây prefix, chỉ cộng `A[i]` nếu nó chẵn, ngược lại cộng 0. Trả lời truy vấn bằng hiệu prefix.',
      'O(N + Q)',
      'O(N)',
      code05,
    ),
    solve: solveEvenSum,
    inputs: cases(standardQueryInputs),
  },
  {
    key: '06',
    title: 'Tổng các số chia hết cho K trong đoạn',
    difficulty: 'EASY',
    story:
      'Cho thêm số $K$. Với mỗi truy vấn $[l, r]$, hãy tính tổng các phần tử trong đoạn chia hết cho $K$.',
    inputDesc: 'Dòng 1 chứa $N, Q, K$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $l, r$.',
    outputDesc: 'In tổng các số chia hết cho $K$ trong từng truy vấn.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$, $1 \\le K \\le 10^9$.',
    editorial: editorial(
      'Tương tự tổng số chẵn: prefix lưu tổng các phần tử thỏa điều kiện `A[i] % K == 0`.',
      'O(N + Q)',
      'O(N)',
      code06,
    ),
    solve: solveDivisibleSum,
    inputs: cases([
      rangeQueriesK(3, [6], [[1, 1]]),
      rangeQueriesK(5, bigArray, [
        [1, 40],
        [2, 39],
        [40, 40],
      ]),
      rangeQueriesK(
        2,
        [-6, -4, -3, -2],
        [
          [1, 4],
          [2, 3],
        ],
      ),
      rangeQueriesK(
        2,
        [2, 4, 6, 8, 10],
        [
          [1, 5],
          [2, 4],
        ],
      ),
      rangeQueriesK(
        4,
        [0, 4, 5, 8, 0],
        [
          [1, 5],
          [2, 4],
        ],
      ),
      rangeQueriesK(
        7,
        [7, 7, 7, 7],
        [
          [1, 4],
          [2, 3],
        ],
      ),
      rangeQueriesK(
        3,
        [9, 1, 2, 3],
        [
          [1, 1],
          [1, 4],
        ],
      ),
      rangeQueriesK(
        3,
        [9, 1, 2, 3],
        [
          [4, 4],
          [2, 4],
        ],
      ),
      rangeQueriesK(3, [3, 5, 6, 7], [[1, 4]]),
      rangeQueriesK(
        10,
        [10, 20, 30, 40],
        [
          [2, 3],
          [1, 1],
        ],
      ),
    ]),
  },
  {
    key: '07',
    title: 'Tổng xen kẽ trong đoạn',
    difficulty: 'MEDIUM',
    story:
      'Với truy vấn $[l, r]$, tính $A_l - A_{l+1} + A_{l+2} - A_{l+3} + ...$. Dấu cộng luôn bắt đầu tại vị trí $l$.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $l, r$.',
    outputDesc: 'In tổng xen kẽ của từng đoạn.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Tạo prefix có dấu theo vị trí toàn cục: vị trí lẻ cộng, vị trí chẵn trừ. Nếu truy vấn bắt đầu ở vị trí chẵn thì đổi dấu kết quả.',
      'O(N + Q)',
      'O(N)',
      code07,
    ),
    solve: solveAlternating,
    inputs: cases(standardQueryInputs),
  },
  {
    key: '08',
    title: 'Tổng có trọng số trong đoạn',
    difficulty: 'MEDIUM',
    story: 'Với truy vấn $[l, r]$, tính $1 \\cdot A_l + 2 \\cdot A_{l+1} + ... + (r-l+1) \\cdot A_r$.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $l, r$.',
    outputDesc: 'In tổng có trọng số của từng đoạn.',
    constraints: '$1 \\le N, Q \\le 2 \\cdot 10^5$. Kết quả dùng `long long`.',
    editorial: editorial(
      'Lưu hai prefix: tổng `A[i]` và tổng `i*A[i]`. Công thức đoạn là `sum(i*A[i]) - (l-1)*sum(A[i])`.',
      'O(N + Q)',
      'O(N)',
      code08,
    ),
    solve: solveWeighted,
    inputs: cases(standardQueryInputs),
  },
  {
    key: '09',
    title: 'Điểm cân bằng của mảng',
    difficulty: 'EASY',
    story:
      'Tìm vị trí nhỏ nhất $i$ sao cho tổng các phần tử bên trái bằng tổng các phần tử bên phải. Nếu không tồn tại, in `-1`.',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In vị trí cân bằng nhỏ nhất hoặc `-1`.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Biết tổng toàn mảng. Duyệt từ trái sang phải, giữ tổng bên trái; tổng bên phải là `total - left - A[i]`.',
      'O(N)',
      'O(1)',
      code09,
    ),
    solve: solveEquilibrium,
    inputs: cases([
      arrayOnly([0]),
      arrayOnly(bigArray),
      arrayOnly([-3, -2, -5]),
      arrayOnly([1, 2, 3, 3]),
      arrayOnly([0, 1, -1, 0]),
      arrayOnly([2, 2, 2, 2, 2]),
      arrayOnly([0, 5, 5]),
      arrayOnly([5, 5, 0]),
      arrayOnly([1, 2, 3, 0, 3, 2, 1]),
      arrayOnly([1, -1, 0, 2, -2]),
    ]),
  },
  {
    key: '10',
    title: 'Tổng lớn nhất của đoạn dài đúng K',
    difficulty: 'MEDIUM',
    story: 'Cho mảng $A$ và số $K$. Hãy tìm tổng lớn nhất của một đoạn con liên tiếp có đúng $K$ phần tử.',
    inputDesc: 'Dòng 1 chứa $N, K$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In tổng lớn nhất tìm được.',
    constraints: '$1 \\le K \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Dùng prefix sum để lấy tổng mọi đoạn dài K trong O(1), rồi duyệt điểm kết thúc của đoạn.',
      'O(N)',
      'O(N)',
      code10,
    ),
    solve: (input) => solveFixedWindow(input, true),
    inputs: cases([
      arrayWithK(1, [7]),
      arrayWithK(10, bigArray),
      arrayWithK(2, [-8, -1, -3, -4]),
      arrayWithK(3, [1, 2, 3, 4, 5]),
      arrayWithK(2, [0, 5, 0, -2, 3]),
      arrayWithK(3, [4, 4, 4, 4, 4]),
      arrayWithK(1, [9, -1, 2, 3]),
      arrayWithK(2, [9, -1, 2, 3]),
      arrayWithK(4, [6, -2, 5, -1]),
      arrayWithK(2, [10, 20, 30, 40]),
    ]),
  },
  {
    key: '11',
    title: 'Tổng nhỏ nhất của đoạn dài đúng K',
    difficulty: 'MEDIUM',
    story: 'Cho mảng $A$ và số $K$. Hãy tìm tổng nhỏ nhất của một đoạn con liên tiếp có đúng $K$ phần tử.',
    inputDesc: 'Dòng 1 chứa $N, K$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In tổng nhỏ nhất tìm được.',
    constraints: '$1 \\le K \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Tương tự bài tổng lớn nhất, nhưng lấy `min` trên các tổng đoạn dài K.',
      'O(N)',
      'O(N)',
      code11,
    ),
    solve: (input) => solveFixedWindow(input, false),
    inputs: cases([
      arrayWithK(1, [7]),
      arrayWithK(10, bigArray),
      arrayWithK(2, [-8, -1, -3, -4]),
      arrayWithK(3, [1, 2, 3, 4, 5]),
      arrayWithK(2, [0, 5, 0, -2, 3]),
      arrayWithK(3, [4, 4, 4, 4, 4]),
      arrayWithK(1, [9, -1, 2, 3]),
      arrayWithK(2, [9, -1, 2, 3]),
      arrayWithK(4, [6, -2, 5, -1]),
      arrayWithK(2, [10, 20, 30, 40]),
    ]),
  },
  {
    key: '12',
    title: 'Đếm đoạn con có tổng bằng K',
    difficulty: 'MEDIUM',
    story: 'Đếm số đoạn con liên tiếp có tổng đúng bằng $K$.',
    inputDesc: 'Dòng 1 chứa $N, K$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In số đoạn con thỏa mãn.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$. Kết quả có thể lớn, dùng `long long`.',
    editorial: editorial(
      'Nếu prefix hiện tại là `S`, cần biết đã có bao nhiêu prefix trước đó bằng `S-K`. Dùng bảng tần suất prefix.',
      'O(N)',
      'O(N)',
      code12,
    ),
    solve: (input) => solveCountSubarraySum(input, null),
    inputs: cases([
      arrayWithK(7, [7]),
      arrayWithK(5, bigArray),
      arrayWithK(-5, [-2, -3, -5, -1]),
      arrayWithK(6, [1, 2, 3, 4, 5]),
      arrayWithK(0, [0, 5, 0, -5, 0]),
      arrayWithK(8, [4, 4, 4, 4, 4]),
      arrayWithK(9, [9, -1, 2, 3]),
      arrayWithK(5, [9, -1, 2, 3]),
      arrayWithK(8, [6, -2, 5, -1]),
      arrayWithK(50, [10, 20, 30, 40]),
    ]),
  },
  {
    key: '13',
    title: 'Đếm đoạn con có tổng bằng 0',
    difficulty: 'MEDIUM',
    story: 'Đếm số đoạn con liên tiếp có tổng bằng 0.',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In số đoạn con có tổng bằng 0.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Hai prefix bằng nhau tạo ra một đoạn con tổng 0. Duyệt prefix và cộng số lần prefix hiện tại đã xuất hiện.',
      'O(N)',
      'O(N)',
      code13,
    ),
    solve: (input) => solveCountSubarraySum(input, 0),
    inputs: cases([
      arrayOnly([0]),
      arrayOnly(bigArray),
      arrayOnly([-1, -2, -3, -4]),
      arrayOnly([1, 2, 3, 4]),
      arrayOnly([0, 5, 0, -5, 0]),
      arrayOnly([4, 4, 4, 4]),
      arrayOnly([9, -9, 2, 3]),
      arrayOnly([9, -1, -8, 0]),
      arrayOnly([6, -2, 5, -9]),
      arrayOnly([10, -10, 20, -20, 0]),
    ]),
  },
  {
    key: '14',
    title: 'Đếm đoạn con có tổng chia hết cho K',
    difficulty: 'MEDIUM',
    story: 'Đếm số đoạn con liên tiếp có tổng chia hết cho $K$.',
    inputDesc: 'Dòng 1 chứa $N, K$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In số đoạn con thỏa mãn.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$, $1 \\le K \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Hai prefix có cùng phần dư khi chia cho K thì hiệu của chúng chia hết cho K. Cần chuẩn hóa phần dư âm về `[0, K-1]`.',
      'O(N + K)',
      'O(K)',
      code14,
    ),
    solve: solveCountDivisible,
    inputs: cases([
      arrayWithK(1, [7]),
      arrayWithK(7, bigArray),
      arrayWithK(3, [-1, -2, -3, -4]),
      arrayWithK(5, [1, 2, 3, 4, 5]),
      arrayWithK(4, [0, 5, 0, -5, 0]),
      arrayWithK(4, [4, 4, 4, 4]),
      arrayWithK(9, [9, -1, 2, 3]),
      arrayWithK(3, [9, -1, -8, 0]),
      arrayWithK(8, [6, -2, 5, -1]),
      arrayWithK(10, [10, 20, 30, 40]),
    ]),
  },
  {
    key: '15',
    title: 'Đoạn con dài nhất có tổng bằng K',
    difficulty: 'HARD',
    story: 'Tìm độ dài lớn nhất của một đoạn con liên tiếp có tổng bằng $K$. Nếu không có đoạn nào, in 0.',
    inputDesc: 'Dòng 1 chứa $N, K$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In độ dài lớn nhất.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Lưu vị trí xuất hiện sớm nhất của mỗi prefix. Với prefix hiện tại `S` tại i, đoạn tổng K bắt đầu sau vị trí đầu tiên có prefix `S-K`.',
      'O(N)',
      'O(N)',
      code15,
    ),
    solve: solveLongestSum,
    inputs: cases([
      arrayWithK(7, [7]),
      arrayWithK(5, bigArray),
      arrayWithK(-6, [-1, -2, -3, -4]),
      arrayWithK(6, [1, 2, 3, 4, 5]),
      arrayWithK(0, [0, 5, 0, -5, 0]),
      arrayWithK(8, [4, 4, 4, 4]),
      arrayWithK(9, [9, -1, 2, 3]),
      arrayWithK(5, [9, -1, -3, 0]),
      arrayWithK(8, [6, -2, 5, -1]),
      arrayWithK(50, [10, 20, 30, 40]),
    ]),
  },
  {
    key: '16',
    title: 'Đoạn con dài nhất có tổng chia hết cho K',
    difficulty: 'HARD',
    story: 'Tìm độ dài lớn nhất của đoạn con liên tiếp có tổng chia hết cho $K$.',
    inputDesc: 'Dòng 1 chứa $N, K$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In độ dài lớn nhất.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$, $1 \\le K \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Với mỗi phần dư prefix, lưu vị trí xuất hiện đầu tiên. Khi gặp lại cùng phần dư, đoạn giữa hai vị trí có tổng chia hết cho K.',
      'O(N + K)',
      'O(K)',
      code16,
    ),
    solve: solveLongestDivisible,
    inputs: cases([
      arrayWithK(1, [7]),
      arrayWithK(7, bigArray),
      arrayWithK(3, [-1, -2, -3, -4]),
      arrayWithK(5, [1, 2, 3, 4, 5]),
      arrayWithK(4, [0, 5, 0, -5, 0]),
      arrayWithK(4, [4, 4, 4, 4]),
      arrayWithK(9, [9, -1, 2, 3]),
      arrayWithK(3, [9, -1, -8, 0]),
      arrayWithK(8, [6, -2, 5, -1]),
      arrayWithK(10, [10, 20, 30, 40]),
    ]),
  },
  {
    key: '17',
    title: 'Tổng đoạn con lớn nhất bằng prefix minimum',
    difficulty: 'MEDIUM',
    story: 'Tìm tổng lớn nhất của một đoạn con liên tiếp không rỗng trong mảng.',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In tổng đoạn con lớn nhất.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Tổng đoạn kết thúc tại vị trí hiện tại bằng prefix hiện tại trừ một prefix nhỏ nhất trước đó. Duy trì `minPrefix` khi duyệt.',
      'O(N)',
      'O(1)',
      code17,
    ),
    solve: (input) => solveBestSubarray(input, true),
    inputs: cases([
      arrayOnly([7]),
      arrayOnly(bigArray),
      arrayOnly([-8, -1, -3, -4]),
      arrayOnly([1, 2, 3, 4, 5]),
      arrayOnly([0, 5, 0, -2, 3]),
      arrayOnly([4, 4, 4, 4]),
      arrayOnly([9, -1, 2, 3]),
      arrayOnly([-9, -1, 2, 3]),
      arrayOnly([6, -2, 5, -1]),
      arrayOnly([10, -20, 30, -40]),
    ]),
  },
  {
    key: '18',
    title: 'Tổng đoạn con nhỏ nhất bằng prefix maximum',
    difficulty: 'MEDIUM',
    story: 'Tìm tổng nhỏ nhất của một đoạn con liên tiếp không rỗng trong mảng.',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In tổng đoạn con nhỏ nhất.',
    constraints: '$1 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Đối xứng với tổng lớn nhất: đoạn nhỏ nhất kết thúc tại hiện tại bằng prefix hiện tại trừ prefix lớn nhất trước đó.',
      'O(N)',
      'O(1)',
      code18,
    ),
    solve: (input) => solveBestSubarray(input, false),
    inputs: cases([
      arrayOnly([7]),
      arrayOnly(bigArray),
      arrayOnly([-8, -1, -3, -4]),
      arrayOnly([1, 2, 3, 4, 5]),
      arrayOnly([0, 5, 0, -2, 3]),
      arrayOnly([4, 4, 4, 4]),
      arrayOnly([9, -1, 2, 3]),
      arrayOnly([-9, -1, 2, 3]),
      arrayOnly([6, -2, 5, -1]),
      arrayOnly([10, -20, 30, -40]),
    ]),
  },
  {
    key: '19',
    title: 'Chia mảng thành 3 phần có tổng bằng nhau',
    difficulty: 'HARD',
    story:
      'Hãy kiểm tra có thể chia mảng thành 3 đoạn liên tiếp không rỗng sao cho tổng của ba đoạn bằng nhau hay không.',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In `YES` nếu chia được, ngược lại in `NO`.',
    constraints: '$3 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Tổng toàn mảng phải chia hết cho 3. Duyệt prefix, cần có một điểm cắt đạt `target` trước khi gặp điểm cắt đạt `2*target`.',
      'O(N)',
      'O(1)',
      code19,
    ),
    solve: solveSplitThree,
    inputs: cases([
      arrayOnly([0, 0, 0]),
      arrayOnly(bigArray.concat([0, 0])),
      arrayOnly([-3, -3, -3]),
      arrayOnly([1, 2, 3, 3, 2, 1]),
      arrayOnly([0, 1, -1, 0, 0]),
      arrayOnly([2, 2, 2, 2, 2, 2]),
      arrayOnly([1, 0, 0, 2, 3]),
      arrayOnly([3, 2, 1, 0, 6]),
      arrayOnly([1, 1, 1]),
      arrayOnly([1, -1, 1, -1, 0]),
    ]),
  },
  {
    key: '20',
    title: 'Hai đoạn không giao nhau có tổng lớn nhất',
    difficulty: 'HARD',
    story: 'Chọn hai đoạn con liên tiếp không rỗng và không giao nhau sao cho tổng của hai đoạn là lớn nhất.',
    inputDesc: 'Dòng 1 chứa $N$. Dòng 2 chứa mảng $A$.',
    outputDesc: 'In tổng lớn nhất có thể đạt được.',
    constraints: '$2 \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Tính `leftBest[i]` là tổng đoạn con lớn nhất trong prefix `1..i`, và `rightBest[i]` tương tự trong suffix `i..N`. Thử mọi ranh giới giữa hai đoạn.',
      'O(N)',
      'O(N)',
      code20,
    ),
    solve: solveTwoSegments,
    inputs: cases([
      arrayOnly([1, 2]),
      arrayOnly(bigArray),
      arrayOnly([-8, -1, -3, -4]),
      arrayOnly([1, 2, 3, 4, 5]),
      arrayOnly([0, 5, 0, -2, 3]),
      arrayOnly([4, 4, 4, 4]),
      arrayOnly([9, -1, 2, 3]),
      arrayOnly([-9, -1, 2, 3]),
      arrayOnly([6, -2, 5, -1]),
      arrayOnly([10, -20, 30, -40, 50]),
    ]),
  },
  {
    key: '21',
    title: 'Cộng đoạn, hỏi giá trị một điểm',
    difficulty: 'MEDIUM',
    story:
      'Cho mảng ban đầu, thực hiện nhiều thao tác cộng $x$ vào mọi phần tử trong đoạn $[l, r]$. Sau tất cả thao tác, trả lời các truy vấn hỏi giá trị tại vị trí $p$.',
    inputDesc:
      'Dòng 1 chứa $N, M, Q$. Dòng 2 chứa mảng ban đầu. $M$ dòng tiếp theo chứa $l, r, x$. $Q$ dòng cuối chứa vị trí $p$.',
    outputDesc: 'In giá trị cuối cùng tại mỗi vị trí được hỏi.',
    constraints: '$1 \\le N, M, Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Dùng mảng hiệu: cộng x vào đoạn bằng `diff[l]+=x`, `diff[r+1]-=x`. Lấy prefix của diff để biết lượng cộng tại từng điểm.',
      'O(N + M + Q)',
      'O(N)',
      code21,
    ),
    solve: solvePointUpdates,
    inputs: cases([
      pointUpdates([0], [[1, 1, 5]], [1]),
      pointUpdates(
        bigArray,
        [
          [1, 40, 2],
          [2, 39, -1],
          [10, 20, 5],
        ],
        [1, 20, 40],
      ),
      pointUpdates([-5, -4, -3], [[1, 3, -2]], [1, 3]),
      pointUpdates(
        [1, 2, 3, 4],
        [
          [2, 4, 3],
          [1, 1, 2],
        ],
        [1, 4],
      ),
      pointUpdates(
        [0, 5, 0],
        [
          [1, 2, 0],
          [2, 3, -5],
        ],
        [1, 3],
      ),
      pointUpdates(
        [4, 4, 4, 4],
        [
          [1, 4, 1],
          [2, 3, 1],
        ],
        [2, 3],
      ),
      pointUpdates([9, -1, 2, 3], [[1, 2, 5]], [1, 2]),
      pointUpdates([9, -1, 2, 3], [[3, 4, -2]], [4, 3]),
      pointUpdates([6, -2, 5, -1], [[1, 4, 3]], [1, 4]),
      pointUpdates([10, 20, 30, 40], [[2, 3, 7]], [2, 3]),
    ]),
  },
  {
    key: '22',
    title: 'Cộng đoạn, in mảng cuối cùng',
    difficulty: 'MEDIUM',
    story:
      'Cho mảng ban đầu và nhiều thao tác cộng đoạn. Hãy in toàn bộ mảng sau khi thực hiện tất cả thao tác.',
    inputDesc: 'Dòng 1 chứa $N, M$. Dòng 2 chứa mảng ban đầu. $M$ dòng tiếp theo chứa $l, r, x$.',
    outputDesc: 'In mảng cuối cùng trên một dòng.',
    constraints: '$1 \\le N, M \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Cộng đoạn bằng difference array. Sau khi xử lý mọi update, prefix của `diff` cho biết lượng cộng vào từng vị trí.',
      'O(N + M)',
      'O(N)',
      code22,
    ),
    solve: solveRangeAddPrint,
    inputs: cases([
      rangeAddPrint([0], [[1, 1, 5]]),
      rangeAddPrint(bigArray, [
        [1, 40, 2],
        [2, 39, -1],
        [10, 20, 5],
      ]),
      rangeAddPrint([-5, -4, -3], [[1, 3, -2]]),
      rangeAddPrint(
        [1, 2, 3, 4],
        [
          [2, 4, 3],
          [1, 1, 2],
        ],
      ),
      rangeAddPrint(
        [0, 5, 0],
        [
          [1, 2, 0],
          [2, 3, -5],
        ],
      ),
      rangeAddPrint(
        [4, 4, 4, 4],
        [
          [1, 4, 1],
          [2, 3, 1],
        ],
      ),
      rangeAddPrint([9, -1, 2, 3], [[1, 2, 5]]),
      rangeAddPrint([9, -1, 2, 3], [[3, 4, -2]]),
      rangeAddPrint([6, -2, 5, -1], [[1, 4, 3]]),
      rangeAddPrint([10, 20, 30, 40], [[2, 3, 7]]),
    ]),
  },
  {
    key: '23',
    title: 'Cộng đoạn, hỏi tổng đoạn sau cập nhật',
    difficulty: 'HARD',
    story:
      'Sau khi thực hiện tất cả thao tác cộng đoạn, hãy trả lời nhiều truy vấn tổng đoạn trên mảng cuối cùng.',
    inputDesc:
      'Dòng 1 chứa $N, M, Q$. Dòng 2 chứa mảng ban đầu. $M$ dòng update chứa $l, r, x$. $Q$ dòng truy vấn chứa $l, r$.',
    outputDesc: 'In tổng đoạn sau cập nhật cho từng truy vấn.',
    constraints: '$1 \\le N, M, Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Dùng difference array để dựng mảng cuối. Sau đó xây prefix sum của mảng cuối để trả lời tổng đoạn.',
      'O(N + M + Q)',
      'O(N)',
      code23,
    ),
    solve: solveRangeAddSum,
    inputs: cases([
      rangeAddSum([0], [[1, 1, 5]], [[1, 1]]),
      rangeAddSum(
        bigArray,
        [
          [1, 40, 2],
          [2, 39, -1],
          [10, 20, 5],
        ],
        [
          [1, 40],
          [2, 39],
          [10, 20],
        ],
      ),
      rangeAddSum(
        [-5, -4, -3],
        [[1, 3, -2]],
        [
          [1, 3],
          [2, 2],
        ],
      ),
      rangeAddSum(
        [1, 2, 3, 4],
        [
          [2, 4, 3],
          [1, 1, 2],
        ],
        [
          [1, 4],
          [2, 4],
        ],
      ),
      rangeAddSum(
        [0, 5, 0],
        [
          [1, 2, 0],
          [2, 3, -5],
        ],
        [
          [1, 3],
          [2, 3],
        ],
      ),
      rangeAddSum(
        [4, 4, 4, 4],
        [
          [1, 4, 1],
          [2, 3, 1],
        ],
        [
          [1, 4],
          [2, 3],
        ],
      ),
      rangeAddSum(
        [9, -1, 2, 3],
        [[1, 2, 5]],
        [
          [1, 1],
          [1, 2],
        ],
      ),
      rangeAddSum(
        [9, -1, 2, 3],
        [[3, 4, -2]],
        [
          [4, 4],
          [3, 4],
        ],
      ),
      rangeAddSum([6, -2, 5, -1], [[1, 4, 3]], [[1, 4]]),
      rangeAddSum(
        [10, 20, 30, 40],
        [[2, 3, 7]],
        [
          [2, 3],
          [1, 2],
        ],
      ),
    ]),
  },
  {
    key: '24',
    title: 'Độ phủ lớn nhất của các đoạn',
    difficulty: 'MEDIUM',
    story:
      'Trên trục gồm các vị trí từ 1 đến N có M đoạn được tô. Hãy tìm số đoạn tô phủ nhiều nhất lên một vị trí.',
    inputDesc: 'Dòng 1 chứa $N, M$. Mỗi dòng trong M dòng sau chứa đoạn $l, r$.',
    outputDesc: 'In độ phủ lớn nhất.',
    constraints: '$1 \\le N, M \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Mỗi đoạn tăng độ phủ trong `[l,r]` thêm 1. Dùng difference array rồi quét prefix để lấy độ phủ từng điểm và giá trị lớn nhất.',
      'O(N + M)',
      'O(N)',
      code24,
    ),
    solve: solveCoverage,
    inputs: cases([
      coverCase(1, [[1, 1]]),
      coverCase(40, [
        [1, 40],
        [2, 39],
        [10, 20],
        [20, 40],
        [1, 1],
      ]),
      coverCase(4, [
        [1, 4],
        [2, 3],
      ]),
      coverCase(5, [
        [1, 2],
        [2, 5],
        [3, 4],
      ]),
      coverCase(5, [
        [1, 1],
        [3, 3],
        [5, 5],
      ]),
      coverCase(5, [
        [2, 4],
        [2, 4],
        [2, 4],
      ]),
      coverCase(4, [
        [1, 2],
        [1, 1],
      ]),
      coverCase(4, [
        [3, 4],
        [4, 4],
      ]),
      coverCase(4, [[1, 4]]),
      coverCase(4, [
        [2, 3],
        [3, 4],
      ]),
    ]),
  },
  {
    key: '25',
    title: 'Tổng vòng tròn với prefix sum nhân đôi',
    difficulty: 'MEDIUM',
    story:
      'Mảng được xem như vòng tròn. Mỗi truy vấn cho vị trí bắt đầu $s$ và độ dài $len$, hãy tính tổng $len$ phần tử liên tiếp theo chiều tăng chỉ số.',
    inputDesc: 'Dòng 1 chứa $N, Q$. Dòng 2 chứa mảng $A$. Mỗi truy vấn chứa $s, len$.',
    outputDesc: 'In tổng của từng đoạn vòng tròn.',
    constraints: '$1 \\le len \\le N \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Nhân đôi mảng thành `A+A`, xây prefix trên mảng nhân đôi. Mỗi đoạn vòng tròn độ dài không quá N trở thành đoạn thẳng trong mảng nhân đôi.',
      'O(N + Q)',
      'O(N)',
      code25,
    ),
    solve: solveCircular,
    inputs: cases([
      circularQueries([7], [[1, 1]]),
      circularQueries(bigArray, [
        [1, 40],
        [2, 39],
        [40, 2],
      ]),
      circularQueries(
        [-5, -4, -3, -2],
        [
          [1, 4],
          [3, 2],
        ],
      ),
      circularQueries(
        [1, 2, 3, 4, 5],
        [
          [1, 5],
          [4, 3],
        ],
      ),
      circularQueries(
        [0, 5, 0, -2, 3],
        [
          [1, 3],
          [5, 2],
        ],
      ),
      circularQueries(
        [4, 4, 4, 4],
        [
          [2, 4],
          [4, 2],
        ],
      ),
      circularQueries(
        [9, -1, 2, 3],
        [
          [1, 1],
          [1, 2],
        ],
      ),
      circularQueries(
        [9, -1, 2, 3],
        [
          [4, 1],
          [4, 2],
        ],
      ),
      circularQueries([6, -2, 5, -1], [[1, 4]]),
      circularQueries(
        [10, 20, 30, 40],
        [
          [2, 3],
          [3, 4],
        ],
      ),
    ]),
  },
  {
    key: '26',
    title: 'Tổng hình chữ nhật trong ma trận',
    difficulty: 'MEDIUM',
    story:
      'Cho ma trận $N \\times M$ và nhiều truy vấn hình chữ nhật. Hãy tính tổng các ô trong mỗi hình chữ nhật.',
    inputDesc: 'Dòng 1 chứa $N, M, Q$. Tiếp theo là ma trận. Mỗi truy vấn chứa $x1, y1, x2, y2$.',
    outputDesc: 'In tổng hình chữ nhật cho từng truy vấn.',
    constraints: '$1 \\le N, M \\le 1000$, $1 \\le Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Xây prefix sum 2D: `pref[i][j]` là tổng hình chữ nhật từ `(1,1)` tới `(i,j)`. Dùng công thức cộng trừ bốn góc.',
      'O(NM + Q)',
      'O(NM)',
      code26,
    ),
    solve: solveMatrixSum,
    inputs: cases([
      matrixQueries([[7]], [[1, 1, 1, 1]]),
      matrixQueries(bigMatrix, [
        [1, 1, 8, 8],
        [2, 2, 7, 7],
        [8, 8, 8, 8],
      ]),
      matrixQueries(
        [
          [-1, -2],
          [-3, -4],
        ],
        [
          [1, 1, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 1, 2, 2],
          [1, 2, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [0, 5],
          [0, -2],
        ],
        [
          [1, 1, 2, 1],
          [1, 1, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [4, 4],
          [4, 4],
        ],
        [
          [1, 1, 2, 2],
          [1, 2, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [9, -1],
          [2, 3],
        ],
        [
          [1, 1, 1, 1],
          [1, 1, 1, 2],
        ],
      ),
      matrixQueries(
        [
          [9, -1],
          [2, 3],
        ],
        [
          [2, 2, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [6, -2],
          [5, -1],
        ],
        [[1, 1, 2, 2]],
      ),
      matrixQueries(
        [
          [10, 20],
          [30, 40],
        ],
        [
          [1, 2, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
    ]),
  },
  {
    key: '27',
    title: 'Đếm ô âm, 0, dương trong hình chữ nhật',
    difficulty: 'MEDIUM',
    story: 'Với mỗi truy vấn hình chữ nhật trong ma trận, đếm số ô âm, số ô bằng 0 và số ô dương.',
    inputDesc: 'Dòng 1 chứa $N, M, Q$. Tiếp theo là ma trận. Mỗi truy vấn chứa $x1, y1, x2, y2$.',
    outputDesc: 'Mỗi truy vấn in ba số: âm, 0, dương.',
    constraints: '$1 \\le N, M \\le 1000$, $1 \\le Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Xây ba prefix 2D cho ba loại ô. Mỗi loại được trả lời bằng công thức hình chữ nhật 2D.',
      'O(NM + Q)',
      'O(NM)',
      code27,
    ),
    solve: solveMatrixSigns,
    inputs: cases([
      matrixQueries([[0]], [[1, 1, 1, 1]]),
      matrixQueries(bigMatrix, [
        [1, 1, 8, 8],
        [2, 2, 7, 7],
        [8, 8, 8, 8],
      ]),
      matrixQueries(
        [
          [-1, -2],
          [-3, -4],
        ],
        [
          [1, 1, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 1, 2, 2],
          [1, 2, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [0, 5],
          [0, -2],
        ],
        [
          [1, 1, 2, 1],
          [1, 1, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [4, 4],
          [4, 4],
        ],
        [
          [1, 1, 2, 2],
          [1, 2, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [9, -1],
          [2, 3],
        ],
        [
          [1, 1, 1, 1],
          [1, 1, 1, 2],
        ],
      ),
      matrixQueries(
        [
          [9, -1],
          [2, 3],
        ],
        [
          [2, 2, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
      matrixQueries(
        [
          [6, -2],
          [5, -1],
        ],
        [[1, 1, 2, 2]],
      ),
      matrixQueries(
        [
          [10, 20],
          [30, 40],
        ],
        [
          [1, 2, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
    ]),
  },
  {
    key: '28',
    title: 'Tổng lớn nhất của hình vuông K x K',
    difficulty: 'HARD',
    story: 'Cho ma trận và số $K$. Hãy tìm tổng lớn nhất của một hình vuông con kích thước $K \\times K$.',
    inputDesc: 'Dòng 1 chứa $N, M, K$. Tiếp theo là ma trận $N \\times M$.',
    outputDesc: 'In tổng lớn nhất của hình vuông $K \\times K$.',
    constraints: '$1 \\le K \\le \\min(N, M)$, $N, M \\le 1000$.',
    editorial: editorial(
      'Sau khi có prefix sum 2D, tổng mọi hình vuông KxK được tính O(1). Duyệt tất cả góc phải dưới để lấy max.',
      'O(NM)',
      'O(NM)',
      code28,
    ),
    solve: solveMaxSquare,
    inputs: cases([
      squareCase(1, [[7]]),
      squareCase(3, bigMatrix),
      squareCase(1, [
        [-1, -2],
        [-3, -4],
      ]),
      squareCase(2, [
        [1, 2],
        [3, 4],
      ]),
      squareCase(1, [
        [0, 5],
        [0, -2],
      ]),
      squareCase(2, [
        [4, 4],
        [4, 4],
      ]),
      squareCase(1, [
        [9, -1],
        [2, 3],
      ]),
      squareCase(1, [
        [9, -1],
        [2, 3],
      ]),
      squareCase(2, [
        [6, -2],
        [5, -1],
      ]),
      squareCase(1, [
        [10, 20],
        [30, 40],
      ]),
    ]),
  },
  {
    key: '29',
    title: 'Cộng hình chữ nhật, in ma trận cuối',
    difficulty: 'HARD',
    story:
      'Cho ma trận ban đầu và nhiều thao tác cộng $v$ vào mọi ô trong một hình chữ nhật. Hãy in ma trận sau tất cả thao tác.',
    inputDesc: 'Dòng 1 chứa $N, M, U$. Tiếp theo là ma trận. Mỗi update chứa $x1, y1, x2, y2, v$.',
    outputDesc: 'In ma trận cuối cùng.',
    constraints: '$1 \\le N, M \\le 1000$, $1 \\le U \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Dùng difference array 2D. Mỗi update tác động lên bốn góc của diff, sau đó lấy prefix 2D của diff để biết lượng cộng từng ô.',
      'O(NM + U)',
      'O(NM)',
      code29,
    ),
    solve: solveRectAddPrint,
    inputs: cases([
      rectAddPrint([[0]], [[1, 1, 1, 1, 5]]),
      rectAddPrint(bigMatrix, [
        [1, 1, 8, 8, 2],
        [2, 2, 7, 7, -1],
        [8, 8, 8, 8, 5],
      ]),
      rectAddPrint(
        [
          [-1, -2],
          [-3, -4],
        ],
        [[1, 1, 2, 2, -2]],
      ),
      rectAddPrint(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2, 2, 2, 3],
          [1, 1, 1, 1, 2],
        ],
      ),
      rectAddPrint(
        [
          [0, 5],
          [0, -2],
        ],
        [
          [1, 1, 2, 1, 0],
          [2, 1, 2, 2, -5],
        ],
      ),
      rectAddPrint(
        [
          [4, 4],
          [4, 4],
        ],
        [
          [1, 1, 2, 2, 1],
          [1, 2, 2, 2, 1],
        ],
      ),
      rectAddPrint(
        [
          [9, -1],
          [2, 3],
        ],
        [[1, 1, 1, 2, 5]],
      ),
      rectAddPrint(
        [
          [9, -1],
          [2, 3],
        ],
        [[2, 1, 2, 2, -2]],
      ),
      rectAddPrint(
        [
          [6, -2],
          [5, -1],
        ],
        [[1, 1, 2, 2, 3]],
      ),
      rectAddPrint(
        [
          [10, 20],
          [30, 40],
        ],
        [[1, 2, 2, 2, 7]],
      ),
    ]),
  },
  {
    key: '30',
    title: 'Cộng hình chữ nhật, hỏi tổng hình chữ nhật sau cập nhật',
    difficulty: 'HARD',
    story:
      'Sau nhiều thao tác cộng hình chữ nhật, hãy trả lời các truy vấn tổng hình chữ nhật trên ma trận cuối cùng.',
    inputDesc:
      'Dòng 1 chứa $N, M, U, Q$. Tiếp theo là ma trận. $U$ update chứa $x1, y1, x2, y2, v$. $Q$ truy vấn chứa $x1, y1, x2, y2$.',
    outputDesc: 'In tổng hình chữ nhật sau cập nhật cho từng truy vấn.',
    constraints: '$1 \\le N, M \\le 1000$, $1 \\le U, Q \\le 2 \\cdot 10^5$.',
    editorial: editorial(
      'Kết hợp hai lớp prefix: dùng diff 2D để dựng ma trận cuối, rồi xây prefix sum 2D trên ma trận cuối để trả lời truy vấn.',
      'O(NM + U + Q)',
      'O(NM)',
      code30,
    ),
    solve: solveRectAddSum,
    inputs: cases([
      rectAddSum([[0]], [[1, 1, 1, 1, 5]], [[1, 1, 1, 1]]),
      rectAddSum(
        bigMatrix,
        [
          [1, 1, 8, 8, 2],
          [2, 2, 7, 7, -1],
          [8, 8, 8, 8, 5],
        ],
        [
          [1, 1, 8, 8],
          [2, 2, 7, 7],
          [8, 8, 8, 8],
        ],
      ),
      rectAddSum(
        [
          [-1, -2],
          [-3, -4],
        ],
        [[1, 1, 2, 2, -2]],
        [
          [1, 1, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
      rectAddSum(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2, 2, 2, 3],
          [1, 1, 1, 1, 2],
        ],
        [
          [1, 1, 2, 2],
          [1, 2, 2, 2],
        ],
      ),
      rectAddSum(
        [
          [0, 5],
          [0, -2],
        ],
        [
          [1, 1, 2, 1, 0],
          [2, 1, 2, 2, -5],
        ],
        [
          [1, 1, 2, 1],
          [1, 1, 2, 2],
        ],
      ),
      rectAddSum(
        [
          [4, 4],
          [4, 4],
        ],
        [
          [1, 1, 2, 2, 1],
          [1, 2, 2, 2, 1],
        ],
        [
          [1, 1, 2, 2],
          [1, 2, 2, 2],
        ],
      ),
      rectAddSum(
        [
          [9, -1],
          [2, 3],
        ],
        [[1, 1, 1, 2, 5]],
        [
          [1, 1, 1, 1],
          [1, 1, 1, 2],
        ],
      ),
      rectAddSum(
        [
          [9, -1],
          [2, 3],
        ],
        [[2, 1, 2, 2, -2]],
        [
          [2, 2, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
      rectAddSum(
        [
          [6, -2],
          [5, -1],
        ],
        [[1, 1, 2, 2, 3]],
        [[1, 1, 2, 2]],
      ),
      rectAddSum(
        [
          [10, 20],
          [30, 40],
        ],
        [[1, 2, 2, 2, 7]],
        [
          [1, 2, 2, 2],
          [2, 1, 2, 2],
        ],
      ),
    ]),
  },
];

const course: CourseSpec = {
  code: 'CPP-ADV-01',
  title: 'Chương 1: Mảng tiền tố / Prefix Sum',
  description:
    'Luyện tập kỹ thuật prefix sum trong C++17: tổng đoạn, đếm theo điều kiện, prefix kết hợp hashmap, difference array và prefix sum 2D.',
  tags: ['cpp17', 'cpp-nang-cao', 'prefix-sum', 'difference-array', '2d-prefix-sum'],
  problems,
};

export default course;

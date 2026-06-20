/**
 * Generator script: creates 10 testcases (incl. edge/boundary) per BASIC_B problem.
 * Run from the repo root: node database/BASIC_B/generate-testcases.js
 */
'use strict';
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname);

// ─── helpers ───────────────────────────────────────────────────────────────
const gcd = (a, b) => (b === 0n ? a : gcd(b, a % b));
const gcdNum = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randArr = (n, lo, hi) => Array.from({length: n}, () => randInt(lo, hi));

async function writeZip(dir, name, cases) {
  // cases: [{input, output}, ...]  (up to 10)
  const zip = new JSZip();
  cases.forEach((c, i) => {
    zip.file(`${i+1}.inp`, c.input.trimEnd() + '\n');
    zip.file(`${i+1}.out`, c.output.trimEnd() + '\n');
  });
  const buf = await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'});
  const zipPath = path.join(dir, `${name}.zip`);
  fs.writeFileSync(zipPath, buf);
  console.log(`  ✓ ${name}.zip (${cases.length} testcases)`);
}

// ─── Topic 01 ──────────────────────────────────────────────────────────────
// A. Tiền tố lớn nhất
function solveA01a(n, arr, queries) {
  const pre = [arr[0]];
  for (let i = 1; i < n; i++) pre.push(Math.max(pre[i-1], arr[i]));
  return queries.map(x => pre[x-1]).join('\n');
}
function genA01a() {
  const cases = [];
  // given example
  cases.push({ input: '5\n-2 5 4 6 3\n3\n1\n3\n5', output: '-2\n5\n6' });
  // n=1 q=1
  cases.push({ input: '1\n42\n1\n1', output: '42' });
  // all negative
  { const arr = [-5,-3,-9,-1,-7]; const q = [1,2,3,4,5];
    cases.push({ input: `5\n${arr.join(' ')}\n5\n${q.join('\n')}`,
      output: solveA01a(5, arr, q) }); }
  // all equal
  { const arr = [7,7,7,7,7]; const q = [1,3,5];
    cases.push({ input: `5\n${arr.join(' ')}\n3\n${q.join('\n')}`,
      output: solveA01a(5, arr, q) }); }
  // increasing
  { const arr = [1,2,3,4,5,6,7,8]; const q = [1,4,8];
    cases.push({ input: `8\n${arr.join(' ')}\n3\n${q.join('\n')}`,
      output: solveA01a(8, arr, q) }); }
  // decreasing
  { const arr = [8,6,4,2,1]; const q = [2,3,5];
    cases.push({ input: `5\n${arr.join(' ')}\n3\n${q.join('\n')}`,
      output: solveA01a(5, arr, q) }); }
  // single query x=1 negative array
  { const arr = [-100,-50,-30,-20,-10]; const q = [1];
    cases.push({ input: `5\n${arr.join(' ')}\n1\n1`,
      output: solveA01a(5, arr, q) }); }
  // large values
  { const n=6; const arr=[1000000000,-1000000000,999999999,0,-999999999,500000000]; const q=[1,2,4,6];
    cases.push({ input: `${n}\n${arr.join(' ')}\n4\n${q.join('\n')}`,
      output: solveA01a(n, arr, q) }); }
  // random large
  { const n=10; const arr=randArr(n,-1000,1000); const q=randArr(5,1,n).sort((a,b)=>a-b);
    cases.push({ input: `${n}\n${arr.join(' ')}\n5\n${q.join('\n')}`,
      output: solveA01a(n, arr, q) }); }
  // q=n, query every position
  { const n=7; const arr=randArr(n,-50,50); const q=[1,2,3,4,5,6,7];
    cases.push({ input: `${n}\n${arr.join(' ')}\n7\n${q.join('\n')}`,
      output: solveA01a(n, arr, q) }); }
  return cases.slice(0,10);
}

// B. Hậu tố nhỏ nhất
function solveA01b(n, arr, queries) {
  const suf = new Array(n); suf[n-1] = arr[n-1];
  for (let i = n-2; i >= 0; i--) suf[i] = Math.min(suf[i+1], arr[i]);
  return queries.map(x => suf[x-1]).join('\n');
}
function genA01b() {
  const cases = [];
  cases.push({ input: '5\n-2 5 4 6 3\n3\n1\n3\n5', output: '-2\n3\n3' });
  // n=1
  cases.push({ input: '1\n-7\n1\n1', output: '-7' });
  // all positive decreasing
  { const arr=[9,7,5,3,1]; const q=[1,3,5];
    cases.push({ input:`5\n${arr.join(' ')}\n3\n${q.join('\n')}`, output: solveA01b(5,arr,q) }); }
  // all equal
  { const arr=[4,4,4,4,4]; const q=[1,2,5];
    cases.push({ input:`5\n${arr.join(' ')}\n3\n${q.join('\n')}`, output: solveA01b(5,arr,q) }); }
  // mixed positive negative
  { const arr=[5,-3,8,-1,0,2]; const n=6; const q=[1,2,4,6];
    cases.push({ input:`${n}\n${arr.join(' ')}\n4\n${q.join('\n')}`, output: solveA01b(n,arr,q) }); }
  // query only last element
  { const arr=[3,1,4,1,5,9,2,6]; const n=8; const q=[8];
    cases.push({ input:`${n}\n${arr.join(' ')}\n1\n8`, output: solveA01b(n,arr,q) }); }
  // large values extreme
  { const arr=[-1000000000,1000000000,-999999999,999999999]; const n=4; const q=[1,2,3,4];
    cases.push({ input:`${n}\n${arr.join(' ')}\n4\n${q.join('\n')}`, output: solveA01b(n,arr,q) }); }
  // random
  { const n=8; const arr=randArr(n,-100,100); const q=randArr(4,1,n).sort((a,b)=>a-b);
    cases.push({ input:`${n}\n${arr.join(' ')}\n4\n${q.join('\n')}`, output: solveA01b(n,arr,q) }); }
  // increasing array, suffix min at any position = last element
  { const arr=[1,2,3,4,5,6]; const n=6; const q=[1,3,6];
    cases.push({ input:`${n}\n${arr.join(' ')}\n3\n${q.join('\n')}`, output: solveA01b(n,arr,q) }); }
  // n=2
  { const arr=[10,-5]; const q=[1,2];
    cases.push({ input:`2\n${arr.join(' ')}\n2\n${q.join('\n')}`, output: solveA01b(2,arr,q) }); }
  return cases.slice(0,10);
}

// C. Tổng lớn nhất (Kadane)
function solveA01c(arr) {
  let maxSum = arr[0], cur = arr[0];
  for (let i = 1; i < arr.length; i++) {
    cur = Math.max(arr[i], cur + arr[i]);
    maxSum = Math.max(maxSum, cur);
  }
  return String(maxSum);
}
function genA01c() {
  const cases = [];
  cases.push({ input: '6\n-2 11 -4 13 -5 2', output: '20' });
  // all negative: answer = max element
  cases.push({ input: '5\n-3 -1 -4 -1 -5', output: solveA01c([-3,-1,-4,-1,-5]) });
  // all positive: answer = sum
  cases.push({ input: '4\n1 2 3 4', output: '10' });
  // n=1 negative
  cases.push({ input: '1\n-7', output: '-7' });
  // n=1 positive
  cases.push({ input: '1\n100', output: '100' });
  // alternating
  { const a=[5,-3,4,-2,6,-1,3]; cases.push({ input:`7\n${a.join(' ')}`, output: solveA01c(a) }); }
  // best is single element in middle
  { const a=[-10,-5,50,-5,-10]; cases.push({ input:`5\n${a.join(' ')}`, output: '50' }); }
  // big values
  { const a=[200,-100,200,-100,200]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01c(a) }); }
  // prefix is best
  { const a=[10,9,8,-100,-100]; cases.push({ input:`5\n${a.join(' ')}`, output: '27' }); }
  // suffix is best
  { const a=[-100,-100,5,6,7]; cases.push({ input:`5\n${a.join(' ')}`, output: '18' }); }
  return cases.slice(0,10);
}

// D. Help Conan 12!
function buildConanSeq(maxN) {
  const A = new Array(maxN+1).fill(0);
  A[0] = 0; if(maxN >= 1) A[1] = 1;
  for (let i = 2; i <= maxN; i++) {
    if (i % 2 === 0) A[i] = A[i/2];
    else A[i] = A[(i-1)/2] + A[(i-1)/2+1];
  }
  const pre = new Array(maxN+1).fill(0);
  for (let i = 1; i <= maxN; i++) pre[i] = Math.max(pre[i-1], A[i]);
  return pre;
}
function solveA01d(queries) {
  const maxN = Math.max(...queries);
  const pre = buildConanSeq(maxN);
  return queries.map(n => pre[n]).join('\n');
}
function genA01d() {
  const cases = [];
  cases.push({ input: '2\n5\n10', output: '3\n4' });
  // T=1, N=1
  cases.push({ input: '1\n1', output: solveA01d([1]) });
  // N=2
  cases.push({ input: '1\n2', output: solveA01d([2]) });
  // N=3
  cases.push({ input: '1\n3', output: solveA01d([3]) });
  // small queries
  { const q=[1,2,3,4,5]; cases.push({ input:`5\n${q.join('\n')}`, output: solveA01d(q) }); }
  // medium queries
  { const q=[10,20,50,100]; cases.push({ input:`4\n${q.join('\n')}`, output: solveA01d(q) }); }
  // N=100000
  cases.push({ input: '1\n100000', output: solveA01d([100000]) });
  // T=5, various
  { const q=[1,7,15,31,63]; cases.push({ input:`5\n${q.join('\n')}`, output: solveA01d(q) }); }
  // repeated same N
  cases.push({ input: '3\n1\n1\n1', output: `${solveA01d([1])}\n${solveA01d([1])}\n${solveA01d([1])}` });
  // N=99999
  cases.push({ input: '2\n99999\n100000', output: solveA01d([99999,100000]) });
  return cases.slice(0,10);
}

// E. Biểu thức lớn nhất: max a_i - a_j + a_k with i<j<k
function solveA01e(arr) {
  const n = arr.length;
  const preMax = [arr[0]];
  for (let i = 1; i < n; i++) preMax.push(Math.max(preMax[i-1], arr[i]));
  const sufMax = new Array(n); sufMax[n-1] = arr[n-1];
  for (let i = n-2; i >= 0; i--) sufMax[i] = Math.max(sufMax[i+1], arr[i]);
  let ans = -Infinity;
  for (let j = 1; j < n-1; j++) {
    ans = Math.max(ans, preMax[j-1] - arr[j] + sufMax[j+1]);
  }
  return String(ans);
}
function genA01e() {
  const cases = [];
  cases.push({ input: '5\n1 2 3 4 5', output: '4' });
  // n=3 minimum
  { const a=[1,100,1]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA01e(a) }); }
  // all equal
  { const a=[5,5,5,5]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA01e(a) }); }
  // middle is very large (minimize a_j)
  { const a=[10,1,10,10]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA01e(a) }); }
  // decreasing
  { const a=[10,8,6,4,2]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01e(a) }); }
  // negative values
  { const a=[-10,-5,-1,-8,-3]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01e(a) }); }
  // large range
  { const a=[-1000000000,0,1000000000]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA01e(a) }); }
  // random
  { const a=randArr(8,-100,100); cases.push({ input:`8\n${a.join(' ')}`, output: solveA01e(a) }); }
  // best is a_1 - a_2 + a_n (endpoints)
  { const a=[100,1,50,50,200]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01e(a) }); }
  // a_k at end is best
  { const a=[1,2,3,1,1000]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01e(a) }); }
  return cases.slice(0,10);
}

// F. Hiệu lớn nhất: max a_j - a_i with i<j
function solveA01f(arr) {
  let minSoFar = arr[0], ans = -Infinity;
  for (let j = 1; j < arr.length; j++) {
    ans = Math.max(ans, arr[j] - minSoFar);
    minSoFar = Math.min(minSoFar, arr[j]);
  }
  return String(ans);
}
function genA01f() {
  const cases = [];
  cases.push({ input: '3\n1 2 3', output: '2' });
  // n=2
  cases.push({ input: '2\n5 3', output: '-2' });
  // all same
  cases.push({ input: '4\n7 7 7 7', output: '0' });
  // decreasing: answer is negative
  { const a=[10,8,6,4,2]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01f(a) }); }
  // best pair is not first and last
  { const a=[1,10,2,5,3]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01f(a) }); }
  // negative values
  { const a=[-5,-3,-8,-1,-6]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01f(a) }); }
  // large values
  { const a=[-1000000000,1000000000]; cases.push({ input:`2\n${a.join(' ')}`, output: '2000000000' }); }
  // min is at end
  { const a=[5,4,3,2,1]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01f(a) }); }
  // random
  { const a=randArr(8,-200,200); cases.push({ input:`8\n${a.join(' ')}`, output: solveA01f(a) }); }
  // single peak in middle
  { const a=[3,1,7,2,4]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01f(a) }); }
  return cases.slice(0,10);
}

// G. Một lần sửa GCD: remove one element, maximize GCD of rest
function solveA01g(arr) {
  const n = arr.length;
  const pre = [arr[0]];
  for (let i = 1; i < n; i++) pre.push(gcdNum(pre[i-1], arr[i]));
  const suf = new Array(n); suf[n-1] = arr[n-1];
  for (let i = n-2; i >= 0; i--) suf[i] = gcdNum(suf[i+1], arr[i]);
  let ans = 1;
  for (let i = 0; i < n; i++) {
    let g = 0;
    if (i > 0) g = gcdNum(g, pre[i-1]);
    if (i < n-1) g = gcdNum(g, suf[i+1]);
    ans = Math.max(ans, g);
  }
  return String(ans);
}
function genA01g() {
  const cases = [];
  cases.push({ input: '3\n7 6 8', output: '2' });
  cases.push({ input: '3\n12 15 18', output: '6' });
  // n=2: remove one, remaining = single element (GCD = that element)
  cases.push({ input: '2\n6 9', output: '9' });
  // all multiples of 6, but one disrupts
  { const a=[6,6,6,5,6]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01g(a) }); }
  // all same
  { const a=[12,12,12]; cases.push({ input:`3\n${a.join(' ')}`, output: '12' }); }
  // GCD of all is 1, but removing one can help
  { const a=[4,6,9,15]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA01g(a) }); }
  // large primes
  { const a=[7,11,13,7]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA01g(a) }); }
  // all 1
  cases.push({ input: '3\n1 1 1', output: '1' });
  // remove the large outlier
  { const a=[2,4,6,8,1000000000]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA01g(a) }); }
  // random
  { const a=randArr(6,1,100); cases.push({ input:`6\n${a.join(' ')}`, output: solveA01g(a) }); }
  return cases.slice(0,10);
}

// H. Hai nửa đồng nhất: longest valid segment (two equal-length runs of same value)
function solveA01h(arr) {
  // Run-length encode
  const runs = [];
  let i = 0;
  while (i < arr.length) {
    let j = i;
    while (j < arr.length && arr[j] === arr[i]) j++;
    runs.push({ val: arr[i], len: j - i });
    i = j;
  }
  let ans = 0;
  for (let k = 0; k < runs.length - 1; k++) {
    if (runs[k].len === runs[k+1].len) {
      ans = Math.max(ans, 2 * runs[k].len);
    }
  }
  return String(ans);
}
function genA01h() {
  const cases = [];
  cases.push({ input: '9\n2 2 2 1 1 1 2 2 2', output: '6' });
  // minimum: n=2, one of each
  cases.push({ input: '2\n1 2', output: '2' });
  // two halves
  cases.push({ input: '4\n1 1 2 2', output: '4' });
  // unequal runs
  cases.push({ input: '5\n1 1 1 2 2', output: '4' });
  // alternating single elements
  { const a=[1,2,1,2,1,2]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA01h(a) }); }
  // all 1s then all 2s
  cases.push({ input: '6\n1 1 1 2 2 2', output: '6' });
  // multiple valid segments, pick longest
  { const a=[2,2,1,1,2,2,2,1,1,1]; cases.push({ input:`10\n${a.join(' ')}`, output: solveA01h(a) }); }
  // no valid segment (asymmetric runs)
  { const a=[1,1,1,2,2,1,1,2,2,2]; cases.push({ input:`10\n${a.join(' ')}`, output: solveA01h(a) }); }
  // large equal halves
  { const a=[...Array(5).fill(1),...Array(5).fill(2)]; cases.push({ input:`10\n${a.join(' ')}`, output: '10' }); }
  // pattern: 1 2 2 1 (no valid: runs 1,2,1 not adjacent equal)
  { const a=[1,2,2,1,1,2]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA01h(a) }); }
  return cases.slice(0,10);
}

// I. Hai đoạn quà liên tiếp: two non-overlapping windows of size k, max sum
function solveA01i(n, k, arr) {
  const w = [];
  let s = 0;
  for (let i = 0; i < k; i++) s += arr[i];
  w.push(s);
  for (let i = k; i < n; i++) { s += arr[i] - arr[i-k]; w.push(s); }
  // w[i] = sum arr[i..i+k-1], length = n-k+1
  const m = w.length;
  const prefBest = [w[0]];
  for (let i = 1; i < m; i++) prefBest.push(Math.max(prefBest[i-1], w[i]));
  const sufBest = new Array(m); sufBest[m-1] = w[m-1];
  for (let i = m-2; i >= 0; i--) sufBest[i] = Math.min(sufBest[i+1], -w[i]);
  // sufBest[i] = min(-w) from i onwards → negate to get max w
  // Re-do suffix max:
  const sufMax = new Array(m); sufMax[m-1] = w[m-1];
  for (let i = m-2; i >= 0; i--) sufMax[i] = Math.max(sufMax[i+1], w[i]);
  let ans = -Infinity;
  // first window ends at i+k-1, second window starts at >= i+k (index j >= i+1 in w)
  for (let i = 0; i < m-1; i++) {
    ans = Math.max(ans, prefBest[i] + sufMax[i+1]);
  }
  return String(ans);
}
function genA01i() {
  const cases = [];
  cases.push({ input: '9 3\n2 6 1 5 3 8 1 9 1', output: '30' });
  // k=1 n=2
  cases.push({ input: '2 1\n3 7', output: '10' });
  // k=n/2
  cases.push({ input: '4 2\n1 2 3 4', output: solveA01i(4,2,[1,2,3,4]) });
  // all same elements
  cases.push({ input: '6 2\n5 5 5 5 5 5', output: solveA01i(6,2,[5,5,5,5,5,5]) });
  // best windows at ends
  { const a=[10,10,1,1,1,10,10]; cases.push({ input:`7 2\n${a.join(' ')}`, output: solveA01i(7,2,a) }); }
  // k=1
  { const a=[3,1,4,1,5,9,2,6]; cases.push({ input:`8 1\n${a.join(' ')}`, output: solveA01i(8,1,a) }); }
  // large k
  { const a=[1,2,3,4,5,6,7,8,9,10]; cases.push({ input:`10 4\n${a.join(' ')}`, output: solveA01i(10,4,a) }); }
  // n = 2k (exactly fits two windows)
  { const a=[5,4,3,2,1,10]; cases.push({ input:`6 3\n${a.join(' ')}`, output: solveA01i(6,3,a) }); }
  // negative values
  { const a=[-1,-2,-3,-4,-5,-6]; cases.push({ input:`6 2\n${a.join(' ')}`, output: solveA01i(6,2,a) }); }
  // random
  { const n=8,k=2; const a=randArr(n,1,20); cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA01i(n,k,a) }); }
  return cases.slice(0,10);
}

// J. Gọi món ăn: for each k=1..n, min cost
function solveA01j(dishes) {
  const n = dishes.length;
  // sort by B ascending
  const sorted = [...dishes].sort((x,y) => x[1]-y[1]);
  const B = sorted.map(d=>d[1]);
  const A = sorted.map(d=>d[0]);
  const d = sorted.map(d=>d[0]-d[1]); // A-B
  const prefixB = [0];
  for (let i = 0; i < n; i++) prefixB.push(prefixB[i]+B[i]);
  const prefixMinD = [Infinity];
  for (let i = 0; i < n; i++) prefixMinD.push(Math.min(prefixMinD[i], d[i]));
  const suffixMinA = new Array(n+1).fill(Infinity);
  for (let i = n-1; i >= 0; i--) suffixMinA[i] = Math.min(suffixMinA[i+1], A[i]);
  const ans = [];
  for (let k = 1; k <= n; k++) {
    // opt1: first dish among cheapest k by B
    const opt1 = prefixB[k] + prefixMinD[k];
    // opt2: first dish not among cheapest k-1 by B
    const opt2 = prefixB[k-1] + suffixMinA[k-1];
    ans.push(Math.min(opt1, opt2));
  }
  return ans.join('\n');
}
function genA01j() {
  const cases = [];
  cases.push({ input: '3\n14 5\n9 3\n5 8', output: '5\n8\n13' });
  cases.push({ input: '5\n1000 1000\n1000 1000\n1000 1000\n1000 1000\n1000 1000', output: '1000\n2000\n3000\n4000\n5000' });
  // n=1
  cases.push({ input: '1\n10 3', output: '10' });
  // n=2, A < B for both
  { const d=[[2,10],[3,10]]; cases.push({ input:`2\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  // B always 0 (impossible from constraints B>=1... actually B>=1 from the problem)
  // one dish has huge A, tiny B; rest are reverse
  { const d=[[100,1],[1,100],[1,100]]; cases.push({ input:`3\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  // All A < B: always better to NOT be first (but must have a first)
  { const d=[[1,10],[1,10],[1,10]]; cases.push({ input:`3\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  // All A > B: best to always be first, but only one can be first
  { const d=[[100,1],[100,1],[100,1]]; cases.push({ input:`3\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  // n=4, mixed
  { const d=[[5,3],[8,2],[1,9],[4,4]]; cases.push({ input:`4\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  // large n=6
  { const d=randArr(6,1,20).map(v=>[randInt(1,20),randInt(1,20)]);
    cases.push({ input:`6\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  // n=5 edge: A_i >> B_i for one dish
  { const d=[[1000000000,1],[1,1000000000],[500000000,500000000],[2,3],[3,2]];
    cases.push({ input:`5\n${d.map(x=>x.join(' ')).join('\n')}`, output: solveA01j(d) }); }
  return cases.slice(0,10);
}

// ─── Topic 02 ──────────────────────────────────────────────────────────────
// A. LMHT: sort desc, pick m-th
function solveA02a(n, m, heroes) {
  const sorted = [...heroes].sort((a,b) => b[0]-a[0] || b[1]-a[1]);
  return sorted[m-1].join(' ');
}
function genA02a() {
  const cases = [];
  cases.push({ input: '3 2\n1 2\n3 2\n1 3', output: '1 3' });
  // m=1
  cases.push({ input: '3 1\n5 5\n3 3\n1 1', output: '5 5' });
  // m=n
  { const h=[[10,5],[8,9],[3,7]]; cases.push({ input:`3 3\n${h.map(x=>x.join(' ')).join('\n')}`, output: solveA02a(3,3,h) }); }
  // all same physical, different magic
  { const h=[[5,1],[5,3],[5,2]]; cases.push({ input:`3 2\n${h.map(x=>x.join(' ')).join('\n')}`, output: solveA02a(3,2,h) }); }
  // n=1
  cases.push({ input: '1 1\n7 8', output: '7 8' });
  // large n
  { const h=Array.from({length:5},(_,i)=>[10-i,i]); const m=3;
    cases.push({ input:`5 ${m}\n${h.map(x=>x.join(' ')).join('\n')}`, output: solveA02a(5,m,h) }); }
  // all zero physical, sorted by magic
  { const h=[[0,10],[0,5],[0,8]]; cases.push({ input:`3 1\n${h.map(x=>x.join(' ')).join('\n')}`, output: solveA02a(3,1,h) }); }
  // ties in both: stable sort by definition
  { const h=[[5,5],[5,5],[5,5]]; cases.push({ input:`3 2\n${h.map(x=>x.join(' ')).join('\n')}`, output: '5 5' }); }
  // random
  { const h=randArr(4,0,100).map(v=>[randInt(0,10000),randInt(0,10000)]); const m=2;
    cases.push({ input:`4 ${m}\n${h.map(x=>x.join(' ')).join('\n')}`, output: solveA02a(4,m,h) }); }
  // edge: m=n=1
  cases.push({ input: '1 1\n0 0', output: '0 0' });
  return cases.slice(0,10);
}

// B. Lì xì: greedy simulation (try each start)
function solveA02b(bags) {
  const n = bags.length;
  let best = 0;
  for (let start = 0; start < n; start++) {
    const used = new Uint8Array(n);
    used[start] = 1;
    let money = bags[start][0], picks = bags[start][1];
    while (picks > 0) {
      let bestIdx = -1;
      for (let i = 0; i < n; i++) {
        if (!used[i]) {
          if (bestIdx === -1 || bags[i][1] > bags[bestIdx][1] ||
              (bags[i][1] === bags[bestIdx][1] && bags[i][0] > bags[bestIdx][0])) {
            bestIdx = i;
          }
        }
      }
      if (bestIdx === -1) break;
      used[bestIdx] = 1;
      money += bags[bestIdx][0];
      picks = picks - 1 + bags[bestIdx][1];
    }
    best = Math.max(best, money);
  }
  return String(best);
}
function genA02b() {
  const cases = [];
  cases.push({ input: '2\n1 0\n2 0', output: '2' });
  cases.push({ input: '3\n1 0\n2 0\n0 2', output: '3' });
  cases.push({ input: '5\n0 0\n2 0\n2 0\n3 0\n5 1', output: '8' });
  // n=1
  cases.push({ input: '1\n50 0', output: '50' });
  // n=1, b=1 but no more bags
  cases.push({ input: '1\n10 5', output: '10' });
  // chain: 0->0->0->big
  { const b=[[0,1],[0,1],[0,1],[100,0]]; cases.push({ input:`4\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02b(b) }); }
  // all b=0
  { const b=[[5,0],[3,0],[8,0],[1,0]]; cases.push({ input:`4\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02b(b) }); }
  // all b=1: can pick all
  { const b=[[2,1],[3,1],[4,1],[5,1]]; cases.push({ input:`4\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02b(b) }); }
  // mixed: one bag opens all others
  { const b=[[1,3],[10,0],[10,0],[10,0],[10,0]]; cases.push({ input:`5\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02b(b) }); }
  // large a, b=0 for best bag
  { const b=[[0,2],[0,0],[1000,0]]; cases.push({ input:`3\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02b(b) }); }
  return cases.slice(0,10);
}

// C. Luyện tập: greedy
function solveA02c(n, c, tasks) {
  const sorted = [...tasks].sort((a,b) => a[0]-b[0]);
  let skill = c, count = 0;
  for (const [a, b] of sorted) {
    if (skill >= a) { skill += b; count++; }
  }
  return String(count);
}
function genA02c() {
  const cases = [];
  cases.push({ input: '4 1\n1 10\n21 5\n1 10\n100 100', output: '3' });
  // c=0
  cases.push({ input: '3 0\n1 1\n2 1\n3 1', output: '0' });
  // can do all
  cases.push({ input: '3 10\n1 5\n2 3\n3 1', output: '3' });
  // n=1, can do it
  cases.push({ input: '1 5\n5 10', output: '1' });
  // n=1, cannot do it
  cases.push({ input: '1 4\n5 10', output: '0' });
  // chain: each unlocks next
  { const tasks=[[1,1],[2,1],[3,1],[4,1],[5,1]]; cases.push({ input:`5 1\n${tasks.map(t=>t.join(' ')).join('\n')}`, output: '5' }); }
  // some tasks unreachable even after others
  { const tasks=[[1,1],[5,1],[3,2],[100,1]]; cases.push({ input:`4 2\n${tasks.map(t=>t.join(' ')).join('\n')}`, output: solveA02c(4,2,tasks) }); }
  // large skill, all tasks accessible
  { const tasks=randArr(5,1,10).map(v=>[v,randInt(1,5)]); cases.push({ input:`5 100\n${tasks.map(t=>t.join(' ')).join('\n')}`, output: '5' }); }
  // c=0, tasks require high skill
  cases.push({ input: '3 0\n100 1\n200 1\n300 1', output: '0' });
  // exactly one task feasible
  { const tasks=[[1,0],[5,0],[10,0]]; cases.push({ input:`3 3\n${tasks.map(t=>t.join(' ')).join('\n')}`, output: solveA02c(3,3,tasks) }); }
  return cases.slice(0,10);
}

// D. Bé hơn: count elements strictly less than each
function solveA02d(arr) {
  const sorted = [...arr].sort((a,b)=>a-b);
  return arr.map(v => {
    let lo=0,hi=sorted.length;
    while(lo<hi){const m=(lo+hi)>>1;if(sorted[m]<v)lo=m+1;else hi=m;}
    return lo;
  }).join(' ');
}
function genA02d() {
  const cases = [];
  cases.push({ input: '5\n3 2 1 1 2', output: '4 2 0 0 2' });
  // n=2
  cases.push({ input: '2\n1 2', output: '0 1' });
  // all same
  cases.push({ input: '4\n5 5 5 5', output: '0 0 0 0' });
  // increasing
  cases.push({ input: '5\n1 2 3 4 5', output: '0 1 2 3 4' });
  // decreasing
  cases.push({ input: '5\n5 4 3 2 1', output: '4 3 2 1 0' });
  // one unique, rest same
  { const a=[1,1,1,1,10]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA02d(a) }); }
  // large values
  { const a=[1000000000,1,1000000000,1]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA02d(a) }); }
  // n=2 same
  cases.push({ input: '2\n7 7', output: '0 0' });
  // random
  { const a=randArr(7,1,10); cases.push({ input:`7\n${a.join(' ')}`, output: solveA02d(a) }); }
  // single element
  cases.push({ input: '1\n42', output: '0' });
  return cases.slice(0,10);
}

// E. SWORD: greedy sort by power, kill sequentially
function solveA02e(n, S, bosses) {
  const sorted = [...bosses].sort((a,b)=>a[0]-b[0]);
  let strength = S, count = 0;
  for (const [p,g] of sorted) {
    if (p < strength) { strength += g; count++; }
  }
  return String(count);
}
function genA02e() {
  const cases = [];
  cases.push({ input: '5 2\n6 1\n7 3\n4 2\n10 5\n12 4', output: '0' });
  cases.push({ input: '5 3\n10 7\n5 3\n14 10\n1 2\n2 1', output: '3' });
  // S=1, all killable in chain
  { const b=[[1,1],[2,1],[3,1],[4,1]]; cases.push({ input:`4 1\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02e(4,1,b) }); }
  // S=1000000000, kill all
  { const b=[[1,1],[2,1],[3,1]]; cases.push({ input:`3 1000000000\n${b.map(x=>x.join(' ')).join('\n')}`, output: '3' }); }
  // no boss killable
  cases.push({ input: '3 1\n2 5\n3 5\n4 5', output: '0' });
  // one boss
  cases.push({ input: '1 5\n4 10', output: '1' });
  // chain: g increases strength to kill next
  { const b=[[3,5],[8,3],[11,2],[13,1]]; cases.push({ input:`4 4\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02e(4,4,b) }); }
  // g=0: killing doesn't help
  { const b=[[1,0],[2,0],[3,0]]; cases.push({ input:`3 2\n${b.map(x=>x.join(' ')).join('\n')}`, output: '1' }); }
  // random
  { const n=5,S=randInt(1,10); const b=randArr(n,1,20).map(v=>[v,randInt(1,5)]);
    cases.push({ input:`${n} ${S}\n${b.map(x=>x.join(' ')).join('\n')}`, output: solveA02e(n,S,b) }); }
  // all same power
  { const b=[[5,3],[5,3],[5,3]]; cases.push({ input:`3 5\n${b.map(x=>x.join(' ')).join('\n')}`, output: '0' }); }
  return cases.slice(0,10);
}

// F. Sắp xếp học sinh
function solveA02f(students) {
  const byName = [...students].sort((a,b)=>a[0].localeCompare(b[0]));
  const byMath = [...students].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const byAvg = [...students].sort((a,b)=>(a[1]+a[2]+a[3])-(b[1]+b[2]+b[3])||a[0].localeCompare(b[0]));
  return [byName.map(s=>s[0]).join(' '), byMath.map(s=>s[0]).join(' '), byAvg.map(s=>s[0]).join(' ')].join('\n');
}
function genA02f() {
  const cases = [];
  cases.push({ input: '4\nTan 10 2 3\nKhang 6 9 10\nHieu 4 8 7\nKhoi 3 2 1', output: 'Hieu Khang Khoi Tan\nTan Khang Hieu Khoi\nKhoi Tan Hieu Khang' });
  // n=1
  cases.push({ input: '1\nAn 5 5 5', output: 'An\nAn\nAn' });
  // n=2 tied math
  { const s=[['Bob',8,5,5],['Alice',8,3,3]]; cases.push({ input:`2\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // n=3 all same scores
  { const s=[['Charlie',5,5,5],['Alice',5,5,5],['Bob',5,5,5]]; cases.push({ input:`3\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // perfect scores
  { const s=[['Yen',10,10,10],['Xuan',10,10,10]]; cases.push({ input:`2\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // zero scores
  { const s=[['Binh',0,0,0],['An',0,0,0]]; cases.push({ input:`2\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // one perfect math scorer
  { const s=[['Nam',10,0,0],['Duc',9,10,10],['Mai',8,5,5]]; cases.push({ input:`3\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // avg tie broken by name
  { const s=[['Tung',3,3,3],['Son',3,3,3],['Lan',3,3,3]]; cases.push({ input:`3\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // n=5
  { const s=[['E',2,3,1],['D',5,0,5],['C',8,2,0],['B',1,9,1],['A',10,10,10]]; cases.push({ input:`5\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  // sorted already by name
  { const s=[['Aa',5,5,5],['Bb',4,6,4],['Cc',3,7,3]]; cases.push({ input:`3\n${s.map(x=>[x[0],...x.slice(1)].join(' ')).join('\n')}`, output: solveA02f(s) }); }
  return cases.slice(0,10);
}

// G. Tập cạnh kề
function solveA02g(n, edges) {
  const adj = Array.from({length:n+1},()=>new Set());
  for (const [u,v] of edges) { adj[u].add(v); adj[v].add(u); }
  return Array.from({length:n},(_,i)=>[...adj[i+1]].sort((a,b)=>a-b).join(' ')).join('\n');
}
function genA02g() {
  const cases = [];
  cases.push({ input: '3 3\n1 2\n1 3\n1 3', output: '2 3\n1\n1' });
  // no edges
  cases.push({ input: '3 0', output: '\n\n' });
  // complete graph n=3
  { const e=[[1,2],[1,3],[2,3]]; cases.push({ input:`3 3\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(3,e) }); }
  // chain 1-2-3-4
  { const e=[[1,2],[2,3],[3,4]]; cases.push({ input:`4 3\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(4,e) }); }
  // self-loop? (u!=v from problem) star topology
  { const e=[[1,2],[1,3],[1,4],[1,5]]; cases.push({ input:`5 4\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(5,e) }); }
  // duplicate edges
  { const e=[[1,2],[1,2],[2,3]]; cases.push({ input:`3 3\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(3,e) }); }
  // n=1 (no edges possible)
  cases.push({ input: '1 0', output: '' });
  // n=4, cycle
  { const e=[[1,2],[2,3],[3,4],[4,1]]; cases.push({ input:`4 4\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(4,e) }); }
  // random
  { const e=[[1,3],[2,4],[1,2],[3,4],[2,3]]; cases.push({ input:`4 5\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(4,e) }); }
  // node with no connections in middle
  { const e=[[1,3],[3,4]]; cases.push({ input:`4 2\n${e.map(x=>x.join(' ')).join('\n')}`, output: solveA02g(4,e) }); }
  return cases.slice(0,10);
}

// H. Chạy bộ: for each required item, find min cost shop of that type
function solveA02h(n, m, shops, needed) {
  // Count how many of each item is needed
  const cnt = new Map();
  for (const t of needed) cnt.set(t, (cnt.get(t)||0)+1);
  // For each type, collect costs
  const typeCosts = new Map();
  for (const [a,c] of shops) {
    if (!typeCosts.has(a)) typeCosts.set(a,[]);
    typeCosts.get(a).push(c);
  }
  let total = 0;
  for (const [t, count] of cnt) {
    if (!typeCosts.has(t) || typeCosts.get(t).length < count) return '-1';
    const costs = typeCosts.get(t).sort((a,b)=>a-b);
    for (let i = 0; i < count; i++) total += costs[i];
  }
  return String(total);
}
function genA02h() {
  const cases = [];
  cases.push({ input: '6 4\n1 2\n1 3\n1 4\n1 5\n2 2\n2 3\n1 1 2 1', output: '11' });
  // impossible: required type not in shops
  cases.push({ input: '2 1\n1 5\n2 3\n3', output: '-1' });
  // single shop, single need
  cases.push({ input: '1 1\n1 10\n1', output: '10' });
  // exactly enough shops
  cases.push({ input: '3 3\n1 5\n1 3\n1 7\n1 1 1', output: '15' });
  // need more than available
  cases.push({ input: '2 3\n1 5\n1 3\n1 1 1', output: '-1' });
  // all same type, pick cheapest
  { const shops=[[1,10],[1,3],[1,7],[1,1]]; const n=4;
    cases.push({ input:`${n} 2\n${shops.map(x=>x.join(' ')).join('\n')}\n1 1`, output: solveA02h(n,2,shops,[1,1]) }); }
  // multiple types, each needed once
  { const shops=[[1,5],[2,3],[3,8]]; const n=3;
    cases.push({ input:`${n} 3\n${shops.map(x=>x.join(' ')).join('\n')}\n1 2 3`, output: '16' }); }
  // m=0
  cases.push({ input: '3 0\n1 5\n2 3\n3 8\n', output: '0' });
  // large cost
  { const shops=[[1,1000000000]]; cases.push({ input:`1 1\n${shops.map(x=>x.join(' ')).join('\n')}\n1`, output: '1000000000' }); }
  // need 2 of type 1, only 1 available
  { const shops=[[1,5],[2,3]];
    cases.push({ input:`2 2\n${shops.map(x=>x.join(' ')).join('\n')}\n1 1`, output: '-1' }); }
  return cases.slice(0,10);
}

// ─── Topic 03 ──────────────────────────────────────────────────────────────
// A. MINI CANDY
function solveA03a(arr) {
  const n = arr.length;
  let prefix = 0, total = arr.reduce((s,v)=>s+v,0), ans = Infinity;
  for (let i = 0; i < n-1; i++) {
    prefix += arr[i];
    ans = Math.min(ans, Math.abs(2*prefix - total));
  }
  return String(ans);
}
function genA03a() {
  const cases = [];
  cases.push({ input: '5\n5 1 3 2 6', output: '1' });
  cases.push({ input: '6\n4 5 3 6 1 2', output: '3' });
  cases.push({ input: '2\n100 100', output: '0' });
  // n=2 unequal
  cases.push({ input: '2\n1 10', output: '9' });
  // all same
  { const a=[3,3,3,3]; cases.push({ input:`4\n${a.join(' ')}`, output: '0' }); }
  // increasing
  { const a=[1,2,3,4,5,6]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA03a(a) }); }
  // large values
  { const a=[1000000000,1000000000]; cases.push({ input:`2\n${a.join(' ')}`, output: '0' }); }
  // all same odd count
  { const a=[1,1,1]; cases.push({ input:`3\n${a.join(' ')}`, output: '1' }); }
  // random
  { const a=randArr(6,1,100); cases.push({ input:`6\n${a.join(' ')}`, output: solveA03a(a) }); }
  // one huge element
  { const a=[1,1,1,1,1000000000]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03a(a) }); }
  return cases.slice(0,10);
}

// B. Dải số
function solveA03b(arr) {
  const total = arr.reduce((s,v)=>s+v,0);
  let prefix = 0, count = 0;
  for (let i = 0; i < arr.length-1; i++) {
    prefix += arr[i];
    if (2*prefix === total) count++;
  }
  return String(count);
}
function genA03b() {
  const cases = [];
  cases.push({ input: '4\n1 2 2 1', output: '1' });
  cases.push({ input: '6\n1 1 1 3 -3 3', output: '2' });
  // no valid cut
  cases.push({ input: '3\n1 2 3', output: '0' });
  // all zeros
  cases.push({ input: '4\n0 0 0 0', output: '3' });
  // n=2 equal
  cases.push({ input: '2\n5 5', output: '1' });
  // n=2 unequal
  cases.push({ input: '2\n1 2', output: '0' });
  // symmetric array
  { const a=[1,2,3,3,2,1]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA03b(a) }); }
  // multiple cuts
  { const a=[1,-1,1,-1,1,-1]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA03b(a) }); }
  // negative total
  { const a=[-3,-3,-3,-3]; cases.push({ input:`4\n${a.join(' ')}`, output: '3' }); }
  // random
  { const a=randArr(7,-5,5); cases.push({ input:`7\n${a.join(' ')}`, output: solveA03b(a) }); }
  return cases.slice(0,10);
}

// D. Đoạn con dài nhất chia hết cho K
function solveA03d(n, k, arr) {
  const first = new Map([[0,0]]);
  let prefix = 0, ans = 0;
  for (let i = 1; i <= n; i++) {
    prefix = ((prefix + arr[i-1]) % k + k) % k;
    if (first.has(prefix)) ans = Math.max(ans, i - first.get(prefix));
    else first.set(prefix, i);
  }
  return String(ans);
}
function genA03d() {
  const cases = [];
  cases.push({ input: '9 4\n3 9 9 5 1 1 10 3 5', output: '6' });
  // entire array divisible by k
  cases.push({ input: '3 3\n3 6 9', output: '3' });
  // no subarray
  cases.push({ input: '3 7\n1 2 3', output: '0' });
  // k=1 (everything divisible)
  cases.push({ input: '5 1\n1 2 3 4 5', output: '5' });
  // single element divisible
  cases.push({ input: '4 5\n1 2 5 3', output: '1' });
  // zeros in array (trivially divisible)
  cases.push({ input: '4 3\n0 0 0 0', output: '4' });
  // negative prefix trick
  { const a=[1,2,1,2,1]; cases.push({ input:`5 3\n${a.join(' ')}`, output: solveA03d(5,3,a) }); }
  // k=2
  { const a=[1,3,5,7,2]; cases.push({ input:`5 2\n${a.join(' ')}`, output: solveA03d(5,2,a) }); }
  // random
  { const n=8,k=randInt(2,5); const a=randArr(n,0,20); cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA03d(n,k,a) }); }
  // all elements = k (each element is divisible)
  { const a=[4,4,4,4]; cases.push({ input:`4 4\n${a.join(' ')}`, output: '4' }); }
  return cases.slice(0,10);
}

// D0. Count subarrays with sum divisible by K
function solveA03d0(n, k, arr) {
  const cnt = new Map([[0,1]]);
  let prefix = 0, ans = 0;
  for (let i = 0; i < n; i++) {
    prefix = ((prefix + arr[i]) % k + k) % k;
    const c = cnt.get(prefix) || 0;
    ans += c;
    cnt.set(prefix, c+1);
  }
  return String(ans);
}
function genA03d0() {
  const cases = [];
  cases.push({ input: '9 4\n3 9 9 5 1 1 10 3 5', output: '8' });
  // k=1: all subarrays
  cases.push({ input: '3 1\n1 2 3', output: '6' }); // n*(n+1)/2 = 6
  // no subarray
  cases.push({ input: '3 7\n1 2 3', output: '0' });
  // all zeros, k=3
  cases.push({ input: '4 3\n0 0 0 0', output: '10' }); // C(4+1,2) = 10
  // k=n
  { const n=5,k=5; const a=[1,2,3,4,5]; cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA03d0(n,k,a) }); }
  // random
  { const n=7,k=3; const a=randArr(n,0,10); cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA03d0(n,k,a) }); }
  // large k
  { const n=5,k=100; const a=[10,20,30,40,50]; cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA03d0(n,k,a) }); }
  // n=1 divisible
  cases.push({ input: '1 3\n9', output: '1' });
  // n=1 not divisible
  cases.push({ input: '1 3\n7', output: '0' });
  // all elements = k
  { const n=4,k=3; const a=[3,3,3,3]; cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA03d0(n,k,a) }); }
  return cases.slice(0,10);
}

// E. Bộ ba số: max 3*a_i + 2*a_j - 5*a_k with i<j<k
function solveA03e(arr) {
  const n = arr.length;
  const preMax = [arr[0]*3];
  for (let i=1;i<n;i++) preMax.push(Math.max(preMax[i-1], arr[i]*3));
  const sufMin = new Array(n); sufMin[n-1]=arr[n-1];
  for (let i=n-2;i>=0;i--) sufMin[i]=Math.min(sufMin[i+1],arr[i]);
  let ans=-Infinity;
  for (let j=1;j<n-1;j++) {
    ans=Math.max(ans, preMax[j-1]+2*arr[j]-5*sufMin[j+1]);
  }
  return String(ans);
}
function genA03e() {
  const cases = [];
  cases.push({ input: '10\n4 9 7 9 4 3 2 9 15 6', output: '35' });
  // n=3 minimum
  { const a=[1,2,3]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03e(a) }); }
  // all same
  { const a=[5,5,5,5]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03e(a) }); }
  // large a_k penalty
  { const a=[10,1,1,1,100000]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03e(a) }); }
  // monotone increasing
  { const a=[1,2,3,4,5,6]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA03e(a) }); }
  // want max a_i, min a_j, min a_k
  { const a=[100,1,1]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03e(a) }); }
  // random
  { const a=randArr(8,1,100); cases.push({ input:`8\n${a.join(' ')}`, output: solveA03e(a) }); }
  // boundary: a_k at end is 1
  { const a=[10,10,10,10,1]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03e(a) }); }
  // all 1s
  { const a=[1,1,1,1,1]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03e(a) }); }
  // n=3 max values
  { const a=[100000,100000,1]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03e(a) }); }
  return cases.slice(0,10);
}

// F. Dãy số: max sum subarray with A[l]=A[r]
function solveA03f(arr) {
  const n = arr.length;
  const prefix = [0];
  for (let i=0;i<n;i++) prefix.push(prefix[i]+arr[i]);
  const firstPrefixForVal = new Map();
  let ans = -Infinity;
  for (let r=0;r<n;r++) {
    const v = arr[r];
    if (firstPrefixForVal.has(v)) {
      const minPre = firstPrefixForVal.get(v);
      ans = Math.max(ans, prefix[r+1] - minPre);
    }
    const pre = prefix[r]; // prefix[r] = sum up to r-1, i.e., prefix[l-1] with l=r+1... wait
    // for subarray [l..r+1] with l-1=r (so l=r+1), but we need l<=r for the pair.
    // Actually: for pair (l,r) with l<r: sum = prefix[r+1] - prefix[l]
    // We want min(prefix[l]) for all l where arr[l-1]=arr[r-1] (0-indexed) and l < r
    // Re-index: r is 0-indexed, subarray [l..r], sum = prefix[r+1] - prefix[l]
    // For value v=arr[r], as we process r, we want min(prefix[l]) for all l<r with arr[l]=v
    // = min prefix[l] = prefix[l] where l=first occurrence of v
    const curPre = prefix[r]; // this is prefix up to r (sum of arr[0..r-1])
    if (!firstPrefixForVal.has(v)) firstPrefixForVal.set(v, curPre);
    else firstPrefixForVal.set(v, Math.min(firstPrefixForVal.get(v), curPre));
  }
  return String(ans === -Infinity ? 0 : ans);
}
function genA03f() {
  const cases = [];
  cases.push({ input: '7\n3 3 3 3 1 11 1', output: '13' });
  // n=2 same elements
  cases.push({ input: '2\n5 5', output: '10' });
  // n=2 different (no valid subarray)
  cases.push({ input: '2\n1 2', output: '0' });
  // all same
  { const a=[3,3,3,3]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03f(a) }); }
  // negative values
  { const a=[-1,2,-1,3]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03f(a) }); }
  // pair at ends
  { const a=[5,1,2,3,5]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03f(a) }); }
  // best pair skips negatives
  { const a=[1,-100,-100,-100,1]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03f(a) }); }
  // large values
  { const a=[1000000000,-1,1000000000]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03f(a) }); }
  // multiple same value pairs
  { const a=[2,3,2,3,2]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03f(a) }); }
  // random
  { const a=randArr(7,-5,5); cases.push({ input:`7\n${a.join(' ')}`, output: solveA03f(a) }); }
  return cases.slice(0,10);
}

// I. Dãy Tăng Giảm: longest bitonic subarray (strict increase then strict decrease)
function solveA03i(arr) {
  const n = arr.length;
  if (n < 3) return String(n);
  const inc = new Array(n).fill(1);
  for (let i=1;i<n;i++) if(arr[i]>arr[i-1]) inc[i]=inc[i-1]+1;
  const dec = new Array(n).fill(1);
  for (let i=n-2;i>=0;i--) if(arr[i]>arr[i+1]) dec[i]=dec[i+1]+1;
  let ans = 0;
  for (let i=1;i<n-1;i++) {
    if (inc[i]>1 && dec[i]>1) ans=Math.max(ans,inc[i]+dec[i]-1);
  }
  return String(ans);
}
function genA03i() {
  const cases = [];
  cases.push({ input: '4\n1 3 2 4', output: '3' });
  // perfect mountain
  cases.push({ input: '5\n1 2 3 2 1', output: '5' });
  // no bitonic (monotone increasing)
  cases.push({ input: '5\n1 2 3 4 5', output: '0' });
  // no bitonic (monotone decreasing)
  cases.push({ input: '5\n5 4 3 2 1', output: '0' });
  // n=3 mountain
  cases.push({ input: '3\n1 3 2', output: '3' });
  // n=3 no peak
  cases.push({ input: '3\n1 2 3', output: '0' });
  // multiple peaks, one longer
  { const a=[1,3,2,1,2,5,3,2,1]; cases.push({ input:`9\n${a.join(' ')}`, output: solveA03i(a) }); }
  // plateau in middle (not strict)
  { const a=[1,2,2,1]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03i(a) }); }
  // negative values
  { const a=[-5,-2,-1,-3,-6]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03i(a) }); }
  // random
  { const a=randArr(8,-10,10); cases.push({ input:`8\n${a.join(' ')}`, output: solveA03i(a) }); }
  return cases.slice(0,10);
}

// J. Dãy số OLPCĐ 2014: max weight subarray with length divisible by 3
function solveA03j(arr) {
  const n = arr.length;
  const prefix = [0];
  for (let i=0;i<n;i++) prefix.push(prefix[i]+arr[i]);
  // For pair (j,i) with j-i divisible by 3, j>i, maximize prefix[j]-prefix[i]
  const minPre = [Infinity,Infinity,Infinity]; // indexed by mod
  for (let i=0;i<=n;i++) {
    const r = i%3;
    if (prefix[i] < minPre[r]) minPre[r] = prefix[i];
  }
  let ans = -Infinity;
  const localMin = [Infinity,Infinity,Infinity];
  for (let j=1;j<=n;j++) {
    const r = j%3;
    if (localMin[r] < Infinity) ans = Math.max(ans, prefix[j]-localMin[r]);
    if (prefix[j-1] < localMin[r]) localMin[r] = prefix[j-1]; // update i before considering j+1
    // Wait: we need i < j and (j-i) % 3 == 0
    // Let's redo: process prefix positions 0..n
    // At position j, for each seen i < j with i%3 == j%3, candidate = prefix[j]-prefix[i]
  }
  // Redo properly:
  let ans2 = -Infinity;
  const minByMod = [Infinity,Infinity,Infinity];
  for (let j=0;j<=n;j++) {
    const r = j%3;
    if (j>=3 && minByMod[r]<Infinity) ans2=Math.max(ans2, prefix[j]-minByMod[r]);
    // Update minByMod[r] with prefix[j] for future j' = j+3,j+6,...
    // But we want i < j, so update after candidate check:
    // Actually: we want i < j, so we check candidate first, then update min.
    // But we also need j-i >= 3 (length >= 3 and divisible by 3).
    // Hmm: j-i = length, divisible by 3, j>i means j >= i+3. So minByMod should be updated with i = j-3...
    // Let me use straightforward: update min with prefix[j-3] when j>=3.
  }
  // Actually simplest correct: check all pairs (i,j) with i<j and (j-i)%3==0
  let ans3 = -Infinity;
  const mn = [new Array(n+1).fill(Infinity), new Array(n+1).fill(Infinity), new Array(n+1).fill(Infinity)];
  for (let j=3;j<=n;j++) {
    const r=j%3;
    // i must satisfy i%3==r and i < j, so i <= j-3
    // maintain rolling min of prefix[i] for each mod class as we increase j
    const imatch = j-3;
    mn[r][j] = Math.min(j>3 ? mn[r][j-1] : Infinity, prefix[imatch]);
    // Wait this is off - let me just track running min
  }
  // Simpler: running min per mod class
  let ans4 = -Infinity;
  const runMin = [Infinity,Infinity,Infinity];
  runMin[0] = prefix[0]; // i=0
  for (let j=3;j<=n;j++) {
    const r=j%3;
    // update runMin with prefix[j-3] (i = j-3)
    runMin[(j-3)%3] = Math.min(runMin[(j-3)%3], prefix[j-3]);
    // Wait we're updating the same slot as what we query
    // i = j-3, i%3 = (j-3)%3 = (j%3 - 0 + 3)%3... hmm this is confusing.
    // Let me just do it cleanly:
    // For j, candidate i ranges from 0 to j-3 with i%3 == j%3.
    // We update with prefix[j-3] before querying for j.
    ans4 = Math.max(ans4, prefix[j] - runMin[r]);
    // We also need to add prefix[j-3] to the min pool for future use:
    // (done at next iteration when j becomes j+3, i.e., when we handle j' = j+3 and i = j)
  }
  // Initialize: for j=3 (r=0), need min of prefix[i] for i%3==0, i<=0. So runMin[0] = prefix[0].
  //             for j=4 (r=1), need i%3==1, i<=1. None → skip.
  //             Actually let me re-init:
  const finalAns = brute03j(arr);
  return String(finalAns);
}
function brute03j(arr) {
  const n = arr.length;
  const prefix = [0];
  for (let i=0;i<n;i++) prefix.push(prefix[i]+arr[i]);
  let ans = -Infinity;
  for (let i=0;i<=n-3;i++) {
    for (let j=i+3;j<=n;j+=3) {
      ans = Math.max(ans, prefix[j]-prefix[i]);
    }
  }
  return ans;
}
function genA03j() {
  const cases = [];
  cases.push({ input: '11\n1 1 1 -9 1 1 1 1 -1 1 -9', output: '4' });
  // entire array divisible by 3
  { const a=[1,2,3]; cases.push({ input:`3\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  // all negative: answer = least negative subarray of len 3
  { const a=[-1,-1,-1,-2,-2,-2]; cases.push({ input:`6\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  // n=3
  { const a=[5,-1,3]; cases.push({ input:`3\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  // best is length 6
  { const a=[1,1,1,1,1,1]; cases.push({ input:`6\n${a.join(' ')}`, output: '6' }); }
  // zeros
  { const a=[0,0,0,0,0,0]; cases.push({ input:`6\n${a.join(' ')}`, output: '0' }); }
  { const a=[-1,-1,-1,5,5,5]; cases.push({ input:`6\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  { const a=[1,-100,1,1,-100,1,1,1,1]; cases.push({ input:`9\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  { const a=randArr(9,-5,10); cases.push({ input:`9\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  // large values
  { const a=[1000000000-1,1000000000-1,1000000000-1]; cases.push({ input:`3\n${a.join(' ')}`, output: String(brute03j(a)) }); }
  return cases.slice(0,10);
}

// K. Max sum subarray length >= L
function solveA03k(n, L, arr) {
  const prefix = [0];
  for (let i=0;i<n;i++) prefix.push(prefix[i]+arr[i]);
  // For each r (right end), need min prefix[l] for l <= r-L (so length >= L)
  let minPre = Infinity, ans = -Infinity;
  for (let r=L;r<=n;r++) {
    minPre = Math.min(minPre, prefix[r-L]);
    ans = Math.max(ans, prefix[r]-minPre);
  }
  return String(ans);
}
function genA03k() {
  const cases = [];
  cases.push({ input: '5 2\n1 3 -1 5 -1', output: '8' });
  // L=n: only full array
  { const a=[1,2,3,4,5]; cases.push({ input:`5 5\n${a.join(' ')}`, output: '15' }); }
  // L=1: standard Kadane-like
  { const a=[-1,2,-1,3,-1]; cases.push({ input:`5 1\n${a.join(' ')}`, output: solveA03k(5,1,a) }); }
  // all negative, L=1
  { const a=[-3,-1,-4,-1,-5]; cases.push({ input:`5 1\n${a.join(' ')}`, output: solveA03k(5,1,a) }); }
  // L=2, best is just full sum
  { const a=[1,1,1,1,1]; cases.push({ input:`5 2\n${a.join(' ')}`, output: '5' }); }
  // n=2 L=2
  cases.push({ input: '2 2\n3 4', output: '7' });
  // large positive + large negative
  { const a=[100,-50,100,-50,100]; cases.push({ input:`5 3\n${a.join(' ')}`, output: solveA03k(5,3,a) }); }
  // L=n-1
  { const a=[1,2,3,4,5]; cases.push({ input:`5 4\n${a.join(' ')}`, output: solveA03k(5,4,a) }); }
  // random
  { const n=7,L=randInt(1,4); const a=randArr(n,-5,10); cases.push({ input:`${n} ${L}\n${a.join(' ')}`, output: solveA03k(n,L,a) }); }
  // zeros
  { const a=[0,0,0,0,0]; cases.push({ input:`5 2\n${a.join(' ')}`, output: '0' }); }
  return cases.slice(0,10);
}

// L. CSES Subarray Divisibility: count subarrays with sum divisible by n
function solveA03l(arr) {
  const n = arr.length;
  const cnt = new Map([[0,1]]);
  let prefix = 0, ans = 0;
  for (let i=0;i<n;i++) {
    prefix = ((prefix + arr[i]) % n + n) % n;
    ans += (cnt.get(prefix)||0);
    cnt.set(prefix, (cnt.get(prefix)||0)+1);
  }
  return String(ans);
}
function genA03l() {
  const cases = [];
  cases.push({ input: '5\n3 1 2 7 4', output: '1' });
  // all zeros divisible by any n
  cases.push({ input: '3\n0 0 0', output: '6' });
  // n=1 (any sum divisible by 1)
  cases.push({ input: '1\n5', output: '1' });
  // array sums to n
  { const a=[1,2,3]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03l(a) }); }
  // all same
  { const a=[2,2,2,2]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03l(a) }); }
  // negative values
  { const a=[1,-1,2,-2,3]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03l(a) }); }
  // n=2
  { const a=[1,1]; cases.push({ input:`2\n${a.join(' ')}`, output: solveA03l(a) }); }
  // large n
  { const a=[5,10,15,20]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03l(a) }); }
  // random
  { const n=6; const a=randArr(n,-10,10); cases.push({ input:`${n}\n${a.join(' ')}`, output: solveA03l(a) }); }
  { const a=[4,4,4,4,4]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03l(a) }); }
  return cases.slice(0,10);
}

// M. Đắp núi: min cost to make mountain
function solveA03m(arr) {
  const n = arr.length;
  let best = Infinity;
  for (let peak = 1; peak < n-1; peak++) {
    // compute needed values on each side
    let cost = 0;
    // Left: strictly increasing up to peak
    const left = [...arr];
    for (let i = 1; i <= peak; i++) {
      if (left[i] <= left[i-1]) { cost += left[i-1]+1-left[i]; left[i] = left[i-1]+1; }
    }
    // Right: strictly decreasing from peak
    const right = [...left];
    for (let i = peak+1; i < n; i++) {
      if (right[i] >= right[i-1]) { cost += right[i]-right[i-1]+1; right[i] = right[i-1]-1; }
    }
    best = Math.min(best, cost);
  }
  return String(best);
}
function genA03m() {
  const cases = [];
  cases.push({ input: '5\n1 1 1 1 1', output: '4' });
  cases.push({ input: '6\n3 4 5 6 5 1', output: '0' });
  // already perfect mountain
  cases.push({ input: '5\n1 2 3 2 1', output: '0' });
  // n=3
  cases.push({ input: '3\n1 1 1', output: '2' });
  // n=3 decreasing
  cases.push({ input: '3\n3 2 1', output: solveA03m([3,2,1]) });
  // flat array needs significant work
  { const a=[5,5,5,5,5]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03m(a) }); }
  // reverse mountain (valley) needs work
  { const a=[5,3,1,3,5]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03m(a) }); }
  // already increasing then sudden drop
  { const a=[1,2,3,4,1]; cases.push({ input:`5\n${a.join(' ')}`, output: '0' }); }
  // all same large
  { const a=[1000000000,1000000000,1000000000]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03m(a) }); }
  // random
  { const a=randArr(5,1,20); cases.push({ input:`5\n${a.join(' ')}`, output: solveA03m(a) }); }
  return cases.slice(0,10);
}

// N. Tổng xen kẽ lớn nhất
function solveA03n(arr) {
  // d[i] = (-1)^(i+1) * arr[i] (1-indexed → 0-indexed: d[i] = (-1)^i * arr[i] for 0-indexed)
  // Wait: 1-indexed: d[i] = (-1)^i * arr[i-1]
  // S(l,r) with l odd (1-indexed) = -sum(d[l..r]) where d[i]=(-1)^i*a[i]
  // S(l,r) with l even = +sum(d[l..r])
  // Let's define d for 0-indexed: d[i] = arr[i] if i is even (0-indexed), -arr[i] if i is odd
  // But the problem uses 1-indexed, so:
  // 1-indexed: d[i] = arr[i-1]*(-1)^i
  const n = arr.length;
  const d = arr.map((v,i) => v * (i%2===0 ? -1 : 1)); // d[i] = (-1)^(i+1) * arr[i] (0-indexed)
  // prefix[j] = d[0]+...+d[j-1], prefix[0]=0
  const prefix = [0];
  for (let i=0;i<n;i++) prefix.push(prefix[i]+d[i]);

  // Case 1 (l even in 1-indexed = l-1 even in 0-indexed = l odd in 0-indexed):
  // S = prefix[r+1] - prefix[l] where l is 0-indexed even (l even → l-1 odd → 0-indexed l is... confusing)
  // Let me redefine: subarray [l..r] (0-indexed), l,r in [0..n-1]
  // S(l,r) = sum arr[i]*(-1)^(i-l) for i=l..r
  // If l is even (0-indexed): S = sum arr[i]*(-1)^i / (-1)^0... hmm
  // (-1)^(i-l) = (-1)^i * (-1)^(-l). If l even: (-1)^(-l)=1. So S = sum arr[i]*(-1)^i = sum d'[i]
  // where d'[i] = arr[i]*(-1)^i (0-indexed)
  // If l odd: (-1)^(-l)=-1. S = -sum arr[i]*(-1)^i = -sum d'[i]
  // So use d'[i] = arr[i]*(-1)^i (0-indexed)
  const dp = arr.map((v,i) => v*(i%2===0 ? 1 : -1));
  const pre2 = [0];
  for (let i=0;i<n;i++) pre2.push(pre2[i]+dp[i]);

  let ans = -Infinity;
  // Case 1: l even, maximize sum(dp[l..r]) = pre2[r+1]-pre2[l]
  // for each r, want min pre2[l] for even l <= r
  let minEven = Infinity;
  for (let r=0;r<n;r++) {
    if (r%2===0) minEven=Math.min(minEven,pre2[r]); // l=r (even) → sum of empty? No: subarray [r..r] has sum dp[r].
    // Actually subarray [l..r] with l<=r even. Min pre2[l] for even l in [0..r].
    if (minEven<Infinity) ans=Math.max(ans, pre2[r+1]-minEven);
  }
  // Wait: we should update minEven with pre2[l] for even l BEFORE using it for this r.
  // Let me redo:
  let minE = Infinity;
  let ans1 = -Infinity;
  for (let r=0;r<n;r++) {
    if (r%2===0) minE=Math.min(minE,pre2[r]);
    if (minE<Infinity) ans1=Math.max(ans1,pre2[r+1]-minE);
  }

  // Case 2: l odd, maximize -sum(dp[l..r]) = pre2[l]-pre2[r+1]
  // for each r, want max pre2[l] for odd l <= r
  let maxO = -Infinity;
  let ans2 = -Infinity;
  for (let r=0;r<n;r++) {
    if (r%2===1) maxO=Math.max(maxO,pre2[r]);
    if (maxO>-Infinity) ans2=Math.max(ans2,maxO-pre2[r+1]);
  }

  return String(Math.max(ans1,ans2));
}
function genA03n() {
  const cases = [];
  cases.push({ input: '4\n3 7 1 5', output: '11' });
  // n=1
  cases.push({ input: '1\n5', output: '5' });
  // n=1 negative
  cases.push({ input: '1\n-3', output: '-3' });
  // alternating positive
  { const a=[5,1,5,1,5]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03n(a) }); }
  // all same
  { const a=[4,4,4,4]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03n(a) }); }
  // increasing
  { const a=[1,2,3,4,5]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03n(a) }); }
  // decreasing
  { const a=[5,4,3,2,1]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03n(a) }); }
  // all negative
  { const a=[-5,-4,-3,-2,-1]; cases.push({ input:`5\n${a.join(' ')}`, output: solveA03n(a) }); }
  // large values
  { const a=[1000000000,1,1000000000,1]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03n(a) }); }
  // random
  { const a=randArr(7,-10,10); cases.push({ input:`7\n${a.join(' ')}`, output: solveA03n(a) }); }
  return cases.slice(0,10);
}

// G (topic 03). Ghép đội: min max-diff of team sums
function solveA03g(arr) {
  const n = arr.length;
  const sorted = [...arr].sort((a,b)=>a-b);
  const m = Math.floor(n/2);
  // For even n: pair i with n-1-i
  if (n % 2 === 0) {
    const sums = Array.from({length:m},(_,i)=>sorted[i]+sorted[n-1-i]);
    return String(Math.max(...sums)-Math.min(...sums));
  }
  // Odd n: try removing each element, find min over all removals
  let best = Infinity;
  for (let skip=0;skip<n;skip++) {
    const rem = sorted.filter((_,i)=>i!==skip);
    const sums = Array.from({length:m},(_,i)=>rem[i]+rem[2*m-1-i]);
    best = Math.min(best, Math.max(...sums)-Math.min(...sums));
  }
  return String(best);
}
function genA03g() {
  const cases = [];
  cases.push({ input: '6\n1 1 1 2 2 3', output: '1' });
  // n=2
  cases.push({ input: '2\n3 7', output: '0' });
  // all same even
  cases.push({ input: '4\n5 5 5 5', output: '0' });
  // all same odd (remove one)
  cases.push({ input: '5\n3 3 3 3 3', output: '0' });
  // sorted already good
  { const a=[1,2,3,4,5,6]; cases.push({ input:`6\n${a.join(' ')}`, output: solveA03g(a) }); }
  // n=3 (remove middle)
  { const a=[1,5,9]; cases.push({ input:`3\n${a.join(' ')}`, output: solveA03g(a) }); }
  // large spread
  { const a=[1,100,1,100]; cases.push({ input:`4\n${a.join(' ')}`, output: '0' }); }
  // n=4 uneven
  { const a=[1,2,5,10]; cases.push({ input:`4\n${a.join(' ')}`, output: solveA03g(a) }); }
  // random even
  { const a=randArr(6,0,20); cases.push({ input:`6\n${a.join(' ')}`, output: solveA03g(a) }); }
  // all zeros
  { const a=[0,0,0,0]; cases.push({ input:`4\n${a.join(' ')}`, output: '0' }); }
  return cases.slice(0,10);
}

// H. GCD-sequence: remove exactly one, check if GCD sequence is non-decreasing
function gcdH(a,b){while(b){[a,b]=[b,a%b];}return a;}
function gcdSeqNonDecr(arr) {
  const n = arr.length;
  const b = [];
  for (let i=0;i<n-1;i++) b.push(gcdH(arr[i],arr[i+1]));
  for (let i=0;i<b.length-1;i++) if(b[i]>b[i+1]) return false;
  return true;
}
function solveA03h(arr) {
  const n = arr.length;
  for (let skip=0;skip<n;skip++) {
    const rem = arr.filter((_,i)=>i!==skip);
    if (gcdSeqNonDecr(rem)) return 'YES';
  }
  return 'NO';
}
function genA03h() {
  const rawInput = `12
6
20 6 12 3 48 36
4
12 6 3 4
3
10 12 3
5
32 16 8 4 2
5
100 50 2 10 20
4
2 4 8 1
10
7 4 6 2 4 5 1 4 2 8
7
5 9 6 8 5 9 2
6
11 14 8 12 9 3
9
5 7 3 10 6 3 12 6 3
3
4 2 4
8
1 6 11 12 6 12 3 6`;
  const rawOutput = `YES
NO
YES
NO
YES
YES
NO
YES
YES
YES
YES
YES`;
  const cases = [{ input: rawInput, output: rawOutput }];
  // t=1, already non-decreasing GCD seq
  cases.push({ input: '1\n3\n2 4 8', output: 'YES' });
  // t=1, must remove specific one
  cases.push({ input: '1\n4\n6 2 4 8', output: 'YES' });
  // t=1, no solution
  cases.push({ input: '1\n4\n6 4 2 8', output: 'NO' });
  // t=1, n=3 always YES
  cases.push({ input: '1\n3\n7 5 3', output: 'YES' });
  // multiple test cases
  { const inp='3\n4\n4 2 6 3\n5\n10 5 20 4 40\n3\n3 3 3';
    // compute manually
    const t1=solveA03h([4,2,6,3]);
    const t2=solveA03h([10,5,20,4,40]);
    const t3=solveA03h([3,3,3]);
    cases.push({ input:inp, output:`${t1}\n${t2}\n${t3}` }); }
  // large values
  { const arr=[1000000000,500000000,250000000,125000000];
    cases.push({ input:`1\n4\n${arr.join(' ')}`, output: solveA03h(arr) }); }
  // random
  { const arr=randArr(5,1,20);
    cases.push({ input:`1\n5\n${arr.join(' ')}`, output: solveA03h(arr) }); }
  // GCD seq already fine (remove last)
  { const arr=[2,4,8,16,3];
    cases.push({ input:`1\n5\n${arr.join(' ')}`, output: solveA03h(arr) }); }
  // all same
  cases.push({ input: '1\n4\n5 5 5 5', output: 'YES' });
  return cases.slice(0,10);
}

// F1. Two non-overlapping subarrays with sum divisible by k, max total length
function solveA03f1(n, k, arr) {
  const prefix = [0];
  for (let i=0;i<n;i++) prefix.push(prefix[i]+arr[i]);
  const mod = prefix.map(v=>((v%k)+k)%k);
  // leftLongest[i] = longest subarray in [0..i] with sum div k
  const firstOcc = new Map([[0,0]]);
  const leftLongest = new Array(n+1).fill(0);
  for (let i=1;i<=n;i++) {
    leftLongest[i] = leftLongest[i-1];
    const r=mod[i];
    if (firstOcc.has(r)) leftLongest[i]=Math.max(leftLongest[i],i-firstOcc.get(r));
    if (!firstOcc.has(r)) firstOcc.set(r,i);
  }
  // rightLongest[i] = longest subarray in [i..n] with sum div k
  const lastOcc = new Map([[0,n]]);
  const rightLongest = new Array(n+2).fill(0);
  for (let i=n-1;i>=0;i--) {
    rightLongest[i] = rightLongest[i+1];
    const r=mod[i];
    if (lastOcc.has(r)) rightLongest[i]=Math.max(rightLongest[i],lastOcc.get(r)-i);
    if (!lastOcc.has(r)||i<lastOcc.get(r)) lastOcc.set(r,i);
  }
  let ans = 0;
  for (let split=1;split<n;split++) {
    if (leftLongest[split]>0 && rightLongest[split]>0) {
      ans=Math.max(ans,leftLongest[split]+rightLongest[split]);
    }
  }
  return String(ans);
}
function genA03f1() {
  const cases = [];
  cases.push({ input: '3 2\n1 2 3', output: '0' });
  cases.push({ input: '4 2\n1 2 3 4', output: '4' });
  // both halves divisible
  cases.push({ input: '6 3\n3 6 9 1 2 3', output: solveA03f1(6,3,[3,6,9,1,2,3]) });
  // k=1 all subarrays valid, answer=n
  cases.push({ input: '6 1\n1 2 3 4 5 6', output: '6' });
  // no valid subarray
  cases.push({ input: '5 7\n1 2 3 4 5', output: '0' });
  // only one valid subarray
  { const a=[1,2,3,4,5]; cases.push({ input:`5 3\n${a.join(' ')}`, output: solveA03f1(5,3,a) }); }
  // large k
  { const a=[5,5,5,5,5,5]; cases.push({ input:`6 5\n${a.join(' ')}`, output: solveA03f1(6,5,a) }); }
  // zeros
  { const a=[0,0,0,0]; cases.push({ input:`4 3\n${a.join(' ')}`, output: solveA03f1(4,3,a) }); }
  // random
  { const n=8,k=randInt(2,5); const a=randArr(n,0,10); cases.push({ input:`${n} ${k}\n${a.join(' ')}`, output: solveA03f1(n,k,a) }); }
  // overlapping prevented
  { const a=[1,2,3,1,2,3]; cases.push({ input:`6 3\n${a.join(' ')}`, output: solveA03f1(6,3,a) }); }
  return cases.slice(0,10);
}

// C. Loong Tracking: dragon body queries
function solveA03c(N, queries) {
  // Initial positions: part i at (i, 0), i = 1..N
  // Use a ring buffer of size N + Q (enough to hold all head positions)
  const MAX = N + queries.length + 2;
  const hx = new Int32Array(MAX);
  const hy = new Int32Array(MAX);
  // Fill initial positions: head is part 1 at (1,0), part 2 at (2,0), ..., part N at (N,0)
  // In the ring buffer, headPtr points to current head; headPtr+k is part k+1
  // Initially: buffer[MAX-1] = (1,0), buffer[MAX-2] = (2,0), ..., buffer[MAX-N] = (N,0)
  let headPtr = MAX - N;
  for (let i = 0; i < N; i++) {
    hx[headPtr + i] = i + 1;
    hy[headPtr + i] = 0;
  }
  // headPtr points to head (part 1), headPtr+1 is part 2, etc.
  const output = [];
  for (const q of queries) {
    if (q[0] === 1) {
      const dir = q[1];
      headPtr--;
      if (headPtr < 0) headPtr = MAX - 1;
      hx[headPtr] = hx[(headPtr + 1) % MAX] + (dir==='R'?1:dir==='L'?-1:0);
      hy[headPtr] = hy[(headPtr + 1) % MAX] + (dir==='U'?1:dir==='D'?-1:0);
    } else {
      const p = q[1];
      const idx = (headPtr + p - 1) % MAX;
      output.push(`${hx[idx]} ${hy[idx]}`);
    }
  }
  return output.join('\n');
}
function genA03c() {
  const cases = [];
  // Given example
  const exIn = '5 9\n2 3\n1 U\n2 3\n1 R\n1 D\n2 3\n1 L\n2 1\n2 5';
  cases.push({ input: exIn, output: '3 0\n2 0\n1 1\n1 0\n1 0' });
  // N=2, query body parts
  cases.push({ input: '2 3\n1 R\n2 1\n2 2', output: '2 0\n1 0' });
  // N=3, move up 3 times then query
  { const qs = [['1','U'],['1','U'],['1','U'],['2',1],['2',2],['2',3]];
    const out = solveA03c(3, qs.map(q=>[parseInt(q[0])||q[0], isNaN(parseInt(q[1]))?q[1]:parseInt(q[1])]));
    cases.push({ input:`3 6\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  // N=5, query part 5 (tail always lags)
  { const qs=[[1,'R'],[1,'R'],[2,5],[1,'U'],[2,5]];
    const out=solveA03c(5,qs);
    cases.push({ input:`5 5\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  // N=2 only queries (no moves)
  cases.push({ input: '2 2\n2 1\n2 2', output: '1 0\n2 0' });
  // move right then left (come back)
  { const qs=[[1,'R'],[1,'L'],[2,1],[2,2]];
    const out=solveA03c(4,qs);
    cases.push({ input:`4 4\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  // long chain of moves
  { const qs=[[1,'U'],[1,'U'],[1,'R'],[1,'D'],[1,'D'],[1,'L'],[2,1],[2,3],[2,5]];
    const out=solveA03c(5,qs);
    cases.push({ input:`5 9\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  // N=3, mixed direction
  { const qs=[[1,'U'],[2,1],[1,'R'],[2,2],[1,'D'],[2,3]];
    const out=solveA03c(3,qs);
    cases.push({ input:`3 6\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  // many queries for head only
  { const qs=[[1,'R'],[1,'U'],[1,'L'],[1,'D'],[2,1]];
    const out=solveA03c(2,qs);
    cases.push({ input:`2 5\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  // N=4, query all parts
  { const qs=[[1,'U'],[1,'R'],[2,1],[2,2],[2,3],[2,4]];
    const out=solveA03c(4,qs);
    cases.push({ input:`4 6\n${qs.map(q=>q.join(' ')).join('\n')}`, output: out }); }
  return cases.slice(0,10);
}

// D2. Độ đẹp: rotation + point update + sum query
function solveA03d2(n, initArr, ops) {
  const arr = [...initArr];
  let offset = 0; // number of right-shifts accumulated
  let sum = arr.reduce((s,v)=>s+v,0);
  const output = [];
  for (const op of ops) {
    if (op[0] === 2) {
      offset = (offset + op[1]) % n;
    } else { // op[0] === 1
      const logicalPos = op[1]; // 1-indexed
      const x = op[2];
      // After offset right-shifts, logical position i contains what was originally at:
      // physical = ((logicalPos - 1) - offset + n * 10000) % n (0-indexed)
      const physical = ((logicalPos - 1 - offset) % n + n) % n;
      sum = sum - arr[physical] + x;
      arr[physical] = x;
      output.push(String(sum));
    }
  }
  return output.join('\n');
}
function genA03d2() {
  const cases = [];
  // Given example
  cases.push({ input: '4 4\n5 3 2 7\n2 2\n1 3 8\n2 1\n1 2 -6', output: '20\n12' });
  // Only updates, no rotations
  cases.push({ input: '3 3\n1 2 3\n1 1 10\n1 2 20\n1 3 30', output: '35\n53\n63' }); // 10+2+3=15? wait: after 1 1 10: arr=[10,2,3] sum=15. After 1 2 20: arr=[10,20,3] sum=33. After 1 3 30: sum=60. Let me recompute.
  // n=3, arr=[1,2,3], sum=6
  // 1 1 10: physical=0 (no offset), arr[0]=10, sum=6-1+10=15. output: 15
  // 1 2 20: physical=1, arr[1]=20, sum=15-2+20=33. output: 33
  // 1 3 30: physical=2, arr[2]=30, sum=33-3+30=60. output: 60
  cases[1] = { input: '3 3\n1 2 3\n1 1 10\n1 2 20\n1 3 30', output: '15\n33\n60' };
  // Only rotations then one update
  cases.push({ input: '4 2\n1 2 3 4\n2 2\n1 1 10', output: String(10 + 2 + 3 + 4 - 3) });
  // After rotate right 2: logical 1 = physical (0-2+4)%4 = 2 → arr[2]=3. update to 10. sum=1+2+10+4=17? wait
  // arr=[1,2,3,4], sum=10. After rotate 2: offset=2. Update logical 1: physical=(0-2+4)%4=2. arr[2] was 3. sum=10-3+10=17.
  cases[2] = { input: '4 2\n1 2 3 4\n2 2\n1 1 10', output: '17' };
  // n=1
  cases.push({ input: '1 2\n5\n1 1 10\n1 1 -3', output: '10\n-3' });
  // Negative values
  cases.push({ input: '3 3\n-1 -2 -3\n1 1 5\n2 1\n1 1 -1', output: solveA03d2(3,[-1,-2,-3],[[1,1,5],[2,1],[1,1,-1]]) });
  // Multiple rotations
  { const arr=[1,2,3,4,5]; const ops=[[2,3],[2,2],[1,1,100],[1,3,50]];
    cases.push({ input:`5 4\n${arr.join(' ')}\n${ops.map(o=>o.join(' ')).join('\n')}`, output: solveA03d2(5,arr,ops) }); }
  // Rotate then update all
  { const arr=[10,20,30]; const ops=[[2,1],[1,1,1],[1,2,2],[1,3,3]];
    cases.push({ input:`3 4\n${arr.join(' ')}\n${ops.map(o=>o.join(' ')).join('\n')}`, output: solveA03d2(3,arr,ops) }); }
  // Large values
  { const arr=[1000000000,-1000000000,0]; const ops=[[1,1,-1000000000],[1,2,1000000000]];
    cases.push({ input:`3 2\n${arr.join(' ')}\n${ops.map(o=>o.join(' ')).join('\n')}`, output: solveA03d2(3,arr,ops) }); }
  // Full rotation (offset=n → same as 0)
  { const arr=[5,3,8,2]; const ops=[[2,4],[1,1,0]];
    cases.push({ input:`4 2\n${arr.join(' ')}\n${ops.map(o=>o.join(' ')).join('\n')}`, output: solveA03d2(4,arr,ops) }); }
  // Many alternating ops
  { const arr=[1,2,3,4,5]; const ops=[[2,1],[1,1,10],[2,2],[1,2,20],[2,3],[1,3,30]];
    cases.push({ input:`5 6\n${arr.join(' ')}\n${ops.map(o=>o.join(' ')).join('\n')}`, output: solveA03d2(5,arr,ops) }); }
  return cases.slice(0,10);
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Generating BASIC_B testcases...\n');

  const topic01 = path.join(BASE, '01. Chuyên đề: Tiền tố, hậu tố');
  const topic02 = path.join(BASE, '02. Chuyên đề: Pair, Struct, viết operator cho struct, hoặc hàm so sánh cho hàm sort');
  const topic03 = path.join(BASE, '03. Chuyên đề: Ôn tập mảng cộng dồn, tiền tố, hậu tố(nâng cao)');

  console.log('📁 Topic 01');
  await writeZip(topic01, 'A. Tiền tố lớn nhất', genA01a());
  await writeZip(topic01, 'B. Hậu tố nhỏ nhất', genA01b());
  await writeZip(topic01, 'C. Tổng lớn nhất trong mảng', genA01c());
  await writeZip(topic01, 'D. Help Conan 12!', genA01d());
  await writeZip(topic01, 'E. Biểu thức lớn nhất (THTB Sơn Trà 2022)', genA01e());
  await writeZip(topic01, 'F. Hiệu lớn nhất', genA01f());
  await writeZip(topic01, 'G. Một lần sửa GCD', genA01g());
  await writeZip(topic01, 'H. Hai nửa đồng nhất', genA01h());
  await writeZip(topic01, 'I. Hai đoạn quà liên tiếp', genA01i());
  await writeZip(topic01, 'J. Gọi món ăn', genA01j());

  console.log('\n📁 Topic 02');
  await writeZip(topic02, 'A. LMHT', genA02a());
  await writeZip(topic02, 'B. Lì xì', genA02b());
  await writeZip(topic02, 'C. Luyện tập', genA02c());
  await writeZip(topic02, 'D. Bé hơn', genA02d());
  await writeZip(topic02, 'E. SWORD (OLP MT&TN 2023 Sơ Loại Không Chuyên)', genA02e());
  await writeZip(topic02, 'F. Sắp xếp học sinh', genA02f());
  await writeZip(topic02, 'G. Tập cạnh kề', genA02g());
  await writeZip(topic02, 'H. Chạy bộ', genA02h());

  console.log('\n📁 Topic 03');
  await writeZip(topic03, 'A. MINI CANDY', genA03a());
  await writeZip(topic03, 'B. Dải số', genA03b());
  await writeZip(topic03, 'C. Loong Tracking', genA03c());
  await writeZip(topic03, 'D2. Độ đẹp', genA03d2());
  await writeZip(topic03, 'D. Đoạn con dài nhất chia hết cho K', genA03d());
  await writeZip(topic03, 'D0. Tổng đoạn con chia hết cho K', genA03d0());
  await writeZip(topic03, 'D1. LMHT', genA02a()); // same problem as topic02 A
  await writeZip(topic03, 'E. Bộ ba số (THT C2 Đà Nẵng 2022)', genA03e());
  await writeZip(topic03, 'F. Dãy số (THTB Vòng Khu vực 2021)', genA03f());
  await writeZip(topic03, 'F1. Dãy Chia Hết', genA03f1());
  await writeZip(topic03, 'G. Ghép đội (GL THT 23-24)', genA03g());
  await writeZip(topic03, 'H. GCD-sequence', genA03h());
  await writeZip(topic03, 'I. Dãy Tăng Giảm', genA03i());
  await writeZip(topic03, 'J. Dãy số (OLPCĐ 2014)', genA03j());
  await writeZip(topic03, 'K. Dãy số', genA03k());
  await writeZip(topic03, 'L. CSES - Subarray Divisibility', genA03l());
  await writeZip(topic03, 'M. Đắp núi', genA03m());
  await writeZip(topic03, 'N. Tổng xen kẽ lớn nhất', genA03n());

  console.log('\n✅ Done! All testcase zips generated.');
}

main().catch(e => { console.error(e); process.exit(1); });

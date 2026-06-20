/**
 * Generator for the MEDIUM "Tiền tố - Hậu tố" curriculum.
 *
 * Single source of truth = the C++ reference solutions in _solutions/<id>.cpp.
 * For each problem we build 10 input cases (basic / boundary / negative /
 * smallest n / near-limit / many queries / tricky), compile the matching .cpp,
 * run it on every input, and capture stdout as the expected output. The zip is
 * written next to the problem's .md so seed-medium.ts can pick it up.
 *
 * Run from repo root:  node database/MEDIUM/generate-testcases.js
 */
'use strict';
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const BASE = __dirname;
const SOL = path.join(BASE, '_solutions');
const BIN = fs.mkdtempSync(path.join(os.tmpdir(), 'medium-'));

// ─── helpers ────────────────────────────────────────────────────────────────
const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randArr = (n, lo, hi) => Array.from({ length: n }, () => randInt(lo, hi));
const line = (...xs) => xs.join(' ');
const lines = (xs) => xs.join('\n');

function compile(id) {
  const src = path.join(SOL, `${id}.cpp`);
  const out = path.join(BIN, id);
  const inc = path.join(SOL, 'include');
  execSync(`g++ -O2 -std=c++17 -I "${inc}" -o "${out}" "${src}"`, { stdio: 'pipe' });
  return out;
}

function run(bin, input) {
  return execSync(`"${bin}"`, { input, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
}

async function build(folder, file, id, inputs) {
  const bin = compile(id);
  const zip = new JSZip();
  const capped = inputs.slice(0, 10);
  capped.forEach((inp, i) => {
    const input = inp.trimEnd() + '\n';
    const output = run(bin, input).trimEnd() + '\n';
    zip.file(`${i + 1}.inp`, input);
    zip.file(`${i + 1}.out`, output);
  });
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(path.join(BASE, folder, `${file}.zip`), buf);
  console.log(`  ✓ ${file}.zip (${capped.length} tests)`);
}

// helper: build a "N / array / Q / Q lines l r" range-query input
const rangeQ = (arr, queries) =>
  lines([arr.length, line(...arr), queries.length, ...queries.map((q) => line(...q))]);

// ─── Chuyên đề (gộp 30 bài vào một thư mục / một course) ──────────────────────
const F = '01. Chuyên đề: Tiền tố - Hậu tố';

// ─── input generators ────────────────────────────────────────────────────────
const G = {};

// 01A. Mảng cộng dồn — input: N \n A
G['01A'] = () => [
  lines([5, line(3, -1, 4, 1, 5)]),
  lines([1, 0]),
  lines([1, -1000000000]),
  lines([6, line(-2, -2, -2, -2, -2, -2)]),
  lines([4, line(7, 7, 7, 7)]),
  lines([8, line(1, 2, 3, 4, 5, 6, 7, 8)]),
  lines([5, line(5, -4, 3, -2, 1)]),
  lines([5, line(1000000000, 1000000000, 1000000000, 1000000000, 1000000000)]),
  (() => { const a = randArr(10, -1000, 1000); return lines([10, line(...a)]); })(),
  (() => { const a = randArr(1000, -1000000, 1000000); return lines([1000, line(...a)]); })(),
];

// 01B. Truy vấn tổng đoạn — N \n A \n Q \n queries
G['01B'] = () => [
  rangeQ([3, -1, 4, 1, 5], [[1, 5], [2, 3], [4, 4]]),
  rangeQ([42], [[1, 1]]),
  rangeQ([-5, -3, -9, -1, -7], [[1, 5], [2, 4], [3, 3]]),
  rangeQ([1, 2, 3, 4, 5, 6, 7, 8], [[1, 8], [1, 1], [8, 8], [3, 6]]),
  rangeQ([1000000000, 1000000000, 1000000000, 1000000000], [[1, 4]]),
  rangeQ([5, -4, 3, -2, 1, 0], [[2, 5], [1, 6], [6, 6]]),
  rangeQ([7, 7, 7, 7, 7], [[1, 5], [2, 4]]),
  (() => { const a = randArr(20, -1000, 1000); const q = Array.from({ length: 5 }, () => { let l = randInt(1, 20), r = randInt(1, 20); if (l > r)[l, r] = [r, l]; return [l, r]; }); return rangeQ(a, q); })(),
  (() => { const a = randArr(2, -100, 100); return rangeQ(a, [[1, 2], [1, 1], [2, 2]]); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const q = Array.from({ length: 50 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return rangeQ(a, q); })(),
];

// 01C. Tổng tiền tố lớn nhất — N \n A
G['01C'] = () => [
  lines([5, line(2, -3, 4, -1, 2)]),
  lines([1, -7]),
  lines([1, 1000000000]),
  lines([5, line(-5, -3, -9, -1, -7)]),
  lines([4, line(7, 7, 7, 7)]),
  lines([6, line(-1, -2, 10, -3, -4, -5)]),
  lines([5, line(1000000000, 1000000000, 1000000000, 1000000000, 1000000000)]),
  lines([6, line(3, -10, 3, -10, 3, -10)]),
  (() => { const a = randArr(10, -1000, 1000); return lines([10, line(...a)]); })(),
  (() => { const a = randArr(1000, -1000000, 1000000); return lines([1000, line(...a)]); })(),
];

// 01D. Tổng đoạn theo modulo — N \n A \n M \n Q \n queries
const modQ = (arr, M, queries) =>
  lines([arr.length, line(...arr), M, queries.length, ...queries.map((q) => line(...q))]);
G['01D'] = () => [
  modQ([3, -1, 4, 1, 5], 7, [[1, 5], [2, 3], [4, 4]]),
  modQ([10], 3, [[1, 1]]),
  modQ([-5, -3, -9, -1, -7], 4, [[1, 5], [2, 4]]),
  modQ([1000000000, 1000000000, 1000000000], 1000000000, [[1, 3], [1, 1]]),
  modQ([6, 6, 6, 6, 6], 6, [[1, 5], [1, 2]]),
  modQ([2, 3, 5, 7, 11], 1000000007, [[1, 5], [3, 5]]),
  modQ([-1, -1, -1, -1], 2, [[1, 4], [1, 1], [2, 3]]),
  modQ([100, -50, 25, -75], 13, [[1, 4], [2, 3]]),
  (() => { const a = randArr(15, -1000, 1000); const q = [[1, 15], [3, 9], [7, 7]]; return modQ(a, 17, q); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const q = Array.from({ length: 30 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return modQ(a, 1000000007, q); })(),
];

// 01E. Đếm số chẵn trong đoạn — N \n A \n Q \n queries
G['01E'] = () => [
  rangeQ([3, 2, 4, 1, 6], [[1, 5], [2, 3], [4, 4]]),
  rangeQ([2], [[1, 1]]),
  rangeQ([1], [[1, 1]]),
  rangeQ([-2, -4, -6, -8], [[1, 4], [2, 3]]),
  rangeQ([1, 3, 5, 7, 9], [[1, 5]]),
  rangeQ([2, 4, 6, 8, 10], [[1, 5], [3, 5]]),
  rangeQ([0, 1, 0, 1, 0, 1], [[1, 6], [2, 5]]),
  rangeQ([-1, 2, -3, 4, -5, 6], [[1, 6], [1, 1], [6, 6]]),
  (() => { const a = randArr(20, -50, 50); const q = [[1, 20], [5, 15], [10, 10]]; return rangeQ(a, q); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const q = Array.from({ length: 40 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return rangeQ(a, q); })(),
];

// 02A. Mảng hậu tố — N \n A
G['02A'] = G['01A']; // cùng định dạng input

// 02B. Truy vấn tổng hậu tố — N \n A \n Q \n x...
const sufQ = (arr, xs) => lines([arr.length, line(...arr), xs.length, ...xs]);
G['02B'] = () => [
  sufQ([3, -1, 4, 1, 5], [1, 3, 5]),
  sufQ([42], [1]),
  sufQ([-5, -3, -9, -1, -7], [1, 2, 5]),
  sufQ([1, 2, 3, 4, 5, 6, 7, 8], [1, 4, 8]),
  sufQ([1000000000, 1000000000, 1000000000, 1000000000], [1, 2]),
  sufQ([7, 7, 7, 7, 7], [1, 3, 5]),
  sufQ([5, -4, 3, -2, 1, 0], [2, 6, 1]),
  sufQ([2, -100], [1, 2]),
  (() => { const a = randArr(20, -1000, 1000); const xs = [1, 10, 20, 5, 15]; return sufQ(a, xs); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const xs = Array.from({ length: 50 }, () => randInt(1, n)); return sufQ(a, xs); })(),
];

// 02C. Tổng hậu tố lớn nhất — N \n A
G['02C'] = () => [
  lines([5, line(2, -3, 4, -1, 2)]),
  lines([1, -7]),
  lines([1, 1000000000]),
  lines([5, line(-5, -3, -9, -1, -7)]),
  lines([4, line(7, 7, 7, 7)]),
  lines([6, line(-5, -4, -3, 10, -1, -2)]),
  lines([5, line(1000000000, 1000000000, 1000000000, 1000000000, 1000000000)]),
  lines([6, line(-10, 3, -10, 3, -10, 3)]),
  (() => { const a = randArr(10, -1000, 1000); return lines([10, line(...a)]); })(),
  (() => { const a = randArr(1000, -1000000, 1000000); return lines([1000, line(...a)]); })(),
];

// 02D. So sánh tiền tố và hậu tố — N \n A
G['02D'] = () => [
  lines([5, line(3, 1, 4, 1, 5)]),
  lines([1, 0]),
  lines([2, line(5, 5)]),
  lines([5, line(-1, -1, -1, -1, -1)]),
  lines([4, line(10, 0, 0, 0)]),
  lines([6, line(1, 1, 1, 1, 1, 1)]),
  lines([5, line(-3, 2, -1, 4, -2)]),
  lines([3, line(1000000000, -1000000000, 1000000000)]),
  (() => { const a = randArr(15, -100, 100); return lines([15, line(...a)]); })(),
  (() => { const a = randArr(1000, -1000000, 1000000); return lines([1000, line(...a)]); })(),
];

// 02E. Đếm số dương ở hậu tố — N \n A \n Q \n x...
G['02E'] = () => [
  sufQ([3, -1, 4, 0, 5], [1, 3, 5]),
  sufQ([7], [1]),
  sufQ([-2], [1]),
  sufQ([-1, -2, -3, -4], [1, 2, 4]),
  sufQ([1, 2, 3, 4, 5], [1, 3, 5]),
  sufQ([0, 0, 0, 0], [1, 2]),
  sufQ([5, -3, 2, -1, 0, 4], [1, 4, 6]),
  sufQ([-1000000000, 1000000000], [1, 2]),
  (() => { const a = randArr(20, -50, 50); const xs = [1, 10, 20, 5]; return sufQ(a, xs); })(),
  (() => { const n = 1000; const a = randArr(n, -1000, 1000); const xs = Array.from({ length: 50 }, () => randInt(1, n)); return sufQ(a, xs); })(),
];

// 03A. Điểm chia cân bằng — N \n A
G['03A'] = () => [
  lines([6, line(1, 2, 3, 3, 2, 1)]),
  lines([1, 5]),
  lines([2, line(4, 4)]),
  lines([4, line(1, 2, 3, 4)]),
  lines([5, line(0, 0, 0, 0, 0)]),
  lines([6, line(2, -2, 2, -2, 2, -2)]),
  lines([4, line(-3, -3, -3, -3)]),
  lines([7, line(10, 0, 10, 0, 10, 0, 0)]),
  (() => { const a = randArr(12, -10, 10); return lines([12, line(...a)]); })(),
  (() => { const a = randArr(1000, -100, 100); return lines([1000, line(...a)]); })(),
];

// 03B. Xóa một phần tử — N \n A
G['03B'] = () => [
  lines([5, line(2, 3, 1, 2, 3)]),
  lines([1, 0]),
  lines([1, 7]),
  lines([3, line(1, 5, 1)]),
  lines([5, line(0, 0, 0, 0, 0)]),
  lines([4, line(1, 2, 3, 4)]),
  lines([6, line(3, -1, 2, 2, -1, 3)]),
  lines([5, line(-2, -2, -8, -2, -2)]),
  (() => { const a = randArr(12, -10, 10); return lines([12, line(...a)]); })(),
  (() => { const a = randArr(1000, -100, 100); return lines([1000, line(...a)]); })(),
];

// 03C. Lợi nhuận lớn nhất — N \n A
G['03C'] = () => [
  lines([6, line(7, 1, 5, 3, 6, 4)]),
  lines([2, line(1, 1)]),
  lines([2, line(5, 1)]),
  lines([5, line(5, 4, 3, 2, 1)]),
  lines([5, line(1, 2, 3, 4, 5)]),
  lines([4, line(-5, -1, -3, -2)]),
  lines([3, line(-1000000000, 0, 1000000000)]),
  lines([6, line(3, 3, 3, 3, 3, 3)]),
  (() => { const a = randArr(15, -1000, 1000); return lines([15, line(...a)]); })(),
  (() => { const a = randArr(1000, -1000000, 1000000); return lines([1000, line(...a)]); })(),
];

// 03D. Mảng tích trừ phần tử — N \n A (1..1000)
G['03D'] = () => [
  lines([4, line(1, 2, 3, 4)]),
  lines([1, 5]),
  lines([2, line(7, 9)]),
  lines([5, line(1, 1, 1, 1, 1)]),
  lines([3, line(1000, 1000, 1000)]),
  lines([5, line(2, 3, 4, 5, 6)]),
  lines([6, line(1, 2, 1, 2, 1, 2)]),
  lines([4, line(10, 1, 10, 1)]),
  (() => { const a = randArr(10, 1, 1000); return lines([10, line(...a)]); })(),
  (() => { const a = randArr(1000, 1, 1000); return lines([1000, line(...a)]); })(),
];

// 03E. Chia đôi chênh lệch nhỏ nhất — N \n A
G['03E'] = () => [
  lines([5, line(1, 2, 3, 4, 10)]),
  lines([2, line(3, 8)]),
  lines([2, line(5, 5)]),
  lines([6, line(1, 1, 1, 1, 1, 1)]),
  lines([4, line(-2, 3, -1, 4)]),
  lines([5, line(10, 1, 1, 1, 1)]),
  lines([3, line(1000000000, 1, 1000000000)]),
  lines([4, line(-5, -5, -5, -5)]),
  (() => { const a = randArr(15, -1000, 1000); return lines([15, line(...a)]); })(),
  (() => { const a = randArr(1000, -1000000, 1000000); return lines([1000, line(...a)]); })(),
];

// 04A. Hiệu tổng hai mảng — N \n A \n B \n Q \n queries
const twoArrQ = (a, b, queries) =>
  lines([a.length, line(...a), line(...b), queries.length, ...queries.map((q) => line(...q))]);
G['04A'] = () => [
  twoArrQ([3, 1, 4, 1, 5], [2, 2, 2, 2, 2], [[1, 5], [2, 3], [4, 4]]),
  twoArrQ([10], [3], [[1, 1]]),
  twoArrQ([-5, -3, -1], [5, 3, 1], [[1, 3], [2, 2]]),
  twoArrQ([1, 2, 3, 4], [4, 3, 2, 1], [[1, 4], [1, 2], [3, 4]]),
  twoArrQ([1000000000, 1000000000], [-1000000000, -1000000000], [[1, 2]]),
  twoArrQ([0, 0, 0, 0], [0, 0, 0, 0], [[1, 4], [2, 3]]),
  twoArrQ([5, 5, 5, 5, 5], [1, 2, 3, 4, 5], [[1, 5], [3, 5]]),
  twoArrQ([7, 7], [7, 7], [[1, 2], [1, 1], [2, 2]]),
  (() => { const n = 20; const a = randArr(n, -1000, 1000); const b = randArr(n, -1000, 1000); const q = [[1, 20], [5, 15], [10, 10]]; return twoArrQ(a, b, q); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const b = randArr(n, -1000000, 1000000); const q = Array.from({ length: 40 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return twoArrQ(a, b, q); })(),
];

// 04B. Đếm chia hết cho K trong đoạn — N \n A \n K \n Q \n queries
const divQ = (arr, K, queries) =>
  lines([arr.length, line(...arr), K, queries.length, ...queries.map((q) => line(...q))]);
G['04B'] = () => [
  divQ([3, 6, 4, 9, 5], 3, [[1, 5], [2, 4], [3, 3]]),
  divQ([6], 2, [[1, 1]]),
  divQ([5], 2, [[1, 1]]),
  divQ([2, 4, 6, 8, 10], 2, [[1, 5], [2, 4]]),
  divQ([1, 3, 5, 7, 9], 2, [[1, 5]]),
  divQ([10, 20, 30, 40, 50], 10, [[1, 5], [3, 5]]),
  divQ([7, 14, 3, 21, 5, 28], 7, [[1, 6], [1, 1], [6, 6]]),
  divQ([100, 99, 98, 97, 96], 4, [[1, 5], [2, 3]]),
  (() => { const a = randArr(20, 1, 100); const q = [[1, 20], [5, 15], [10, 10]]; return divQ(a, 5, q); })(),
  (() => { const n = 1000; const a = randArr(n, 1, 1000000); const q = Array.from({ length: 40 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return divQ(a, 7, q); })(),
];

// 04C. So sánh hai đoạn — N \n A \n Q \n l1 r1 l2 r2
const cmpQ = (arr, queries) =>
  lines([arr.length, line(...arr), queries.length, ...queries.map((q) => line(...q))]);
G['04C'] = () => [
  cmpQ([1, 2, 3, 4, 5], [[1, 2, 4, 5], [1, 5, 3, 3], [2, 2, 4, 4]]),
  cmpQ([5], [[1, 1, 1, 1]]),
  cmpQ([-1, -2, -3, -4], [[1, 2, 3, 4], [1, 1, 4, 4]]),
  cmpQ([3, 3, 3, 3, 3], [[1, 2, 3, 4], [1, 3, 2, 4]]),
  cmpQ([10, -5, 3, 8, -2], [[1, 2, 3, 5], [1, 5, 1, 5]]),
  cmpQ([1000000000, 1000000000, -1000000000], [[1, 2, 3, 3]]),
  cmpQ([2, 4, 6, 8], [[1, 1, 4, 4], [1, 2, 3, 4]]),
  cmpQ([0, 0, 0, 0, 0], [[1, 3, 2, 4], [1, 1, 5, 5]]),
  (() => { const n = 20; const a = randArr(n, -1000, 1000); const q = Array.from({ length: 6 }, () => { let l1 = randInt(1, n), r1 = randInt(1, n); if (l1 > r1)[l1, r1] = [r1, l1]; let l2 = randInt(1, n), r2 = randInt(1, n); if (l2 > r2)[l2, r2] = [r2, l2]; return [l1, r1, l2, r2]; }); return cmpQ(a, q); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const q = Array.from({ length: 40 }, () => { let l1 = randInt(1, n), r1 = randInt(1, n); if (l1 > r1)[l1, r1] = [r1, l1]; let l2 = randInt(1, n), r2 = randInt(1, n); if (l2 > r2)[l2, r2] = [r2, l2]; return [l1, r1, l2, r2]; }); return cmpQ(a, q); })(),
];

// 04D. Mảng hiệu cập nhật đoạn — N M \n M lines "l r v"
const diffOps = (n, ops) => lines([line(n, ops.length), ...ops.map((o) => line(...o))]);
G['04D'] = () => [
  diffOps(5, [[1, 3, 2], [2, 5, 1], [4, 4, 10]]),
  diffOps(1, [[1, 1, 5]]),
  diffOps(4, [[1, 4, 1]]),
  diffOps(5, [[1, 1, 100], [5, 5, -100]]),
  diffOps(6, [[1, 6, 1], [1, 6, 1], [1, 6, 1]]),
  diffOps(5, [[2, 4, 5], [1, 3, -2], [3, 5, 7]]),
  diffOps(3, [[1, 3, 1000000000]]),
  diffOps(4, [[1, 2, -5], [3, 4, -5]]),
  (() => { const n = 50; const ops = Array.from({ length: 20 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r, randInt(-100, 100)]; }); return diffOps(n, ops); })(),
  (() => { const n = 1000; const ops = Array.from({ length: 500 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r, randInt(-1000000, 1000000)]; }); return diffOps(n, ops); })(),
];

// 04E. Cập nhật đoạn rồi truy vấn — N \n U \n U updates \n Q \n Q queries
const updQ = (n, ups, qs) =>
  lines([n, ups.length, ...ups.map((o) => line(...o)), qs.length, ...qs.map((q) => line(...q))]);
G['04E'] = () => [
  updQ(5, [[1, 3, 2], [2, 5, 1]], [[1, 5], [2, 4], [3, 3]]),
  updQ(1, [[1, 1, 7]], [[1, 1]]),
  updQ(4, [[1, 4, 3]], [[1, 4], [2, 3]]),
  updQ(5, [[1, 1, 10], [5, 5, 20]], [[1, 5], [1, 1], [5, 5]]),
  updQ(6, [[1, 6, 1], [1, 3, 5]], [[1, 6], [1, 3], [4, 6]]),
  updQ(5, [[2, 4, -3], [1, 5, 4]], [[1, 5], [2, 4]]),
  updQ(3, [[1, 3, 1000000000]], [[1, 3]]),
  updQ(4, [], [[1, 4], [2, 2]]),
  (() => { const n = 50; const ups = Array.from({ length: 15 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r, randInt(-100, 100)]; }); const qs = Array.from({ length: 10 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return updQ(n, ups, qs); })(),
  (() => { const n = 1000; const ups = Array.from({ length: 300 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r, randInt(-1000000, 1000000)]; }); const qs = Array.from({ length: 40 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return updQ(n, ups, qs); })(),
];

// 05A. Tiền tố nhỏ nhất — N \n A \n Q \n x...
G['05A'] = () => [
  sufQ([4, 2, 5, 1, 3], [1, 3, 5]),
  sufQ([7], [1]),
  sufQ([-1000000000], [1]),
  sufQ([5, 4, 3, 2, 1], [1, 3, 5]),
  sufQ([1, 2, 3, 4, 5], [1, 3, 5]),
  sufQ([3, 3, 3, 3], [1, 2, 4]),
  sufQ([-2, 5, -8, 1, -3], [1, 2, 3, 5]),
  sufQ([1000000000, -1000000000], [1, 2]),
  (() => { const a = randArr(20, -1000, 1000); const xs = [1, 10, 20, 5, 15]; return sufQ(a, xs); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const xs = Array.from({ length: 50 }, () => randInt(1, n)); return sufQ(a, xs); })(),
];

// 05B. Hậu tố lớn nhất — N \n A \n Q \n x...
G['05B'] = () => [
  sufQ([4, 2, 5, 1, 3], [1, 3, 5]),
  sufQ([7], [1]),
  sufQ([-1000000000], [1]),
  sufQ([1, 2, 3, 4, 5], [1, 3, 5]),
  sufQ([5, 4, 3, 2, 1], [1, 3, 5]),
  sufQ([3, 3, 3, 3], [1, 2, 4]),
  sufQ([-2, 5, -8, 1, -3], [1, 2, 4, 5]),
  sufQ([-1000000000, 1000000000], [1, 2]),
  (() => { const a = randArr(20, -1000, 1000); const xs = [1, 10, 20, 5, 15]; return sufQ(a, xs); })(),
  (() => { const n = 1000; const a = randArr(n, -1000000, 1000000); const xs = Array.from({ length: 50 }, () => randInt(1, n)); return sufQ(a, xs); })(),
];

// 05C. Đếm cặp tiền tố bằng nhau — N \n A
G['05C'] = () => [
  lines([5, line(1, -1, 2, -2, 3)]),
  lines([1, 0]),
  lines([1, 5]),
  lines([4, line(0, 0, 0, 0)]),
  lines([6, line(1, -1, 1, -1, 1, -1)]),
  lines([5, line(1, 2, 3, 4, 5)]),
  lines([4, line(3, -3, 3, -3)]),
  lines([6, line(2, -2, 2, -2, 4, -4)]),
  (() => { const a = randArr(15, -5, 5); return lines([15, line(...a)]); })(),
  (() => { const a = randArr(1000, -3, 3); return lines([1000, line(...a)]); })(),
];

// 05D. Tiền tố mảng nhị phân — N \n A(0/1) \n Q \n queries
G['05D'] = () => [
  rangeQ([1, 0, 1, 1, 0], [[1, 5], [2, 4], [3, 3]]),
  rangeQ([1], [[1, 1]]),
  rangeQ([0], [[1, 1]]),
  rangeQ([1, 1, 1, 1, 1], [[1, 5], [2, 4]]),
  rangeQ([0, 0, 0, 0, 0], [[1, 5]]),
  rangeQ([1, 0, 1, 0, 1, 0], [[1, 6], [2, 5]]),
  rangeQ([0, 1, 1, 0, 1, 1], [[1, 6], [1, 1], [6, 6]]),
  rangeQ([1, 1, 0, 0, 1], [[2, 5], [1, 3]]),
  (() => { const a = randArr(20, 0, 1); const q = [[1, 20], [5, 15], [10, 10]]; return rangeQ(a, q); })(),
  (() => { const n = 1000; const a = randArr(n, 0, 1); const q = Array.from({ length: 40 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r]; }); return rangeQ(a, q); })(),
];

// 05E. Đếm ký tự trong đoạn — N \n S \n Q \n l r c
const strQ = (s, queries) => lines([s.length, s, queries.length, ...queries.map((q) => line(...q))]);
G['05E'] = () => [
  strQ('ababc', [[1, 5, 'a'], [2, 4, 'b'], [5, 5, 'c']]),
  strQ('a', [[1, 1, 'a']]),
  strQ('a', [[1, 1, 'b']]),
  strQ('zzzzz', [[1, 5, 'z'], [2, 4, 'a']]),
  strQ('abcde', [[1, 5, 'a'], [1, 5, 'e']]),
  strQ('aaabbb', [[1, 6, 'a'], [4, 6, 'a'], [1, 3, 'b']]),
  strQ('mississippi', [[1, 11, 's'], [2, 5, 'i'], [1, 11, 'p']]),
  strQ('abcabcabc', [[1, 9, 'a'], [4, 9, 'b'], [1, 3, 'c']]),
  (() => { const n = 30; let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(97 + randInt(0, 3)); const q = [[1, n, 'a'], [10, 20, 'b'], [n, n, 'c']]; return strQ(s, q); })(),
  (() => { const n = 1000; let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(97 + randInt(0, 25)); const q = Array.from({ length: 40 }, () => { let l = randInt(1, n), r = randInt(1, n); if (l > r)[l, r] = [r, l]; return [l, r, String.fromCharCode(97 + randInt(0, 25))]; }); return strQ(s, q); })(),
];

// 06A. Đoạn con tổng bằng K — N K \n A
const sumK = (arr, K) => lines([line(arr.length, K), line(...arr)]);
G['06A'] = () => [
  sumK([1, 2, 3, -3, 3], 3),
  sumK([5], 5),
  sumK([5], 3),
  sumK([0, 0, 0, 0], 0),
  sumK([1, -1, 1, -1, 1], 0),
  sumK([2, 2, 2, 2, 2], 4),
  sumK([1000000000, 1000000000, -1000000000], 1000000000),
  sumK([3, 1, -1, 2, -2, 3], 3),
  (() => { const a = randArr(20, -5, 5); return sumK(a, 0); })(),
  (() => { const a = randArr(1000, -10, 10); return sumK(a, 5); })(),
];

// 06B. Đoạn con chia hết cho K — N K \n A
G['06B'] = () => [
  sumK([2, 1, 2, 1, 3], 3),
  sumK([5], 5),
  sumK([4], 3),
  sumK([3, 3, 3, 3], 3),
  sumK([-1, -1, -1, -1], 2),
  sumK([2, 4, 6, 8], 2),
  sumK([1000000000, -1000000000, 1000000000], 7),
  sumK([5, -5, 10, -10, 7], 5),
  (() => { const a = randArr(20, -10, 10); return sumK(a, 4); })(),
  (() => { const a = randArr(1000, -1000, 1000); return sumK(a, 7); })(),
];

// 06C. Tổng hình chữ nhật 2D — R C \n matrix \n Q \n r1 c1 r2 c2
const mat2D = (m, queries) => {
  const R = m.length, C = m[0].length;
  return lines([line(R, C), ...m.map((row) => line(...row)), queries.length, ...queries.map((q) => line(...q))]);
};
G['06C'] = () => [
  mat2D([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[1, 1, 2, 2], [2, 2, 3, 3], [1, 1, 3, 3]]),
  mat2D([[42]], [[1, 1, 1, 1]]),
  mat2D([[-1, -2], [-3, -4]], [[1, 1, 2, 2], [1, 1, 1, 1]]),
  mat2D([[1, 1, 1, 1]], [[1, 1, 1, 4], [1, 2, 1, 3]]),
  mat2D([[1], [2], [3], [4]], [[1, 1, 4, 1], [2, 1, 3, 1]]),
  mat2D([[1000000000, 1000000000], [1000000000, 1000000000]], [[1, 1, 2, 2]]),
  mat2D([[5, -3, 2], [-1, 4, -6], [7, 0, 1]], [[1, 1, 3, 3], [2, 1, 3, 2], [1, 3, 2, 3]]),
  mat2D([[0, 0, 0], [0, 0, 0]], [[1, 1, 2, 3]]),
  (() => { const R = 8, C = 8; const m = Array.from({ length: R }, () => randArr(C, -100, 100)); const q = [[1, 1, R, C], [2, 3, 5, 6], [4, 4, 4, 4]]; return mat2D(m, q); })(),
  (() => { const R = 50, C = 50; const m = Array.from({ length: R }, () => randArr(C, -1000, 1000)); const q = Array.from({ length: 30 }, () => { let r1 = randInt(1, R), r2 = randInt(1, R); if (r1 > r2)[r1, r2] = [r2, r1]; let c1 = randInt(1, C), c2 = randInt(1, C); if (c1 > c2)[c1, c2] = [c2, c1]; return [r1, c1, r2, c2]; }); return mat2D(m, q); })(),
];

// 06D. Đoạn con dài nhất tổng bằng K — N K \n A
G['06D'] = () => [
  sumK([1, 2, 3, -3, 3], 3),
  sumK([5], 5),
  sumK([5], 3),
  sumK([0, 0, 0, 0], 0),
  sumK([1, -1, 1, -1, 1, -1], 0),
  sumK([2, 2, 2, 2, 2], 6),
  sumK([1, 2, 3, 4, 5], 9),
  sumK([-2, 3, 1, -1, 2, -3, 4], 3),
  (() => { const a = randArr(30, -5, 5); return sumK(a, 0); })(),
  (() => { const a = randArr(1000, -10, 10); return sumK(a, 5); })(),
];

// 06E. Chia ba phần bằng nhau — N \n A
G['06E'] = () => [
  lines([6, line(1, 2, 3, 0, 3, 3)]),
  lines([3, line(1, 1, 1)]),
  lines([2, line(1, 1)]),
  lines([6, line(0, 0, 0, 0, 0, 0)]),
  lines([4, line(3, 3, 3, 1)]),
  lines([9, line(1, 1, 1, 1, 1, 1, 1, 1, 1)]),
  lines([6, line(2, -2, 2, -2, 2, -2)]),
  lines([5, line(3, 3, 6, 5, 1)]),
  (() => { const a = randArr(20, -3, 3); return lines([20, line(...a)]); })(),
  (() => { const a = randArr(1000, -2, 2); return lines([1000, line(...a)]); })(),
];

// ─── Build everything ─────────────────────────────────────────────────────────
const PROBLEMS = [
  [F, '01. Mảng cộng dồn', '01A'],
  [F, '02. Truy vấn tổng đoạn', '01B'],
  [F, '03. Tổng tiền tố lớn nhất', '01C'],
  [F, '04. Tổng đoạn theo modulo', '01D'],
  [F, '05. Đếm số chẵn trong đoạn', '01E'],
  [F, '06. Mảng hậu tố', '02A'],
  [F, '07. Truy vấn tổng hậu tố', '02B'],
  [F, '08. Tổng hậu tố lớn nhất', '02C'],
  [F, '09. So sánh tiền tố và hậu tố', '02D'],
  [F, '10. Đếm số dương ở hậu tố', '02E'],
  [F, '11. Điểm chia cân bằng', '03A'],
  [F, '12. Xóa một phần tử', '03B'],
  [F, '13. Lợi nhuận lớn nhất', '03C'],
  [F, '14. Mảng tích trừ phần tử', '03D'],
  [F, '15. Chia đôi chênh lệch nhỏ nhất', '03E'],
  [F, '16. Hiệu tổng hai mảng', '04A'],
  [F, '17. Đếm chia hết trong đoạn', '04B'],
  [F, '18. So sánh hai đoạn', '04C'],
  [F, '19. Mảng hiệu cập nhật đoạn', '04D'],
  [F, '20. Cập nhật đoạn rồi truy vấn', '04E'],
  [F, '21. Tiền tố nhỏ nhất', '05A'],
  [F, '22. Hậu tố lớn nhất', '05B'],
  [F, '23. Đếm cặp tiền tố bằng nhau', '05C'],
  [F, '24. Tiền tố mảng nhị phân', '05D'],
  [F, '25. Đếm ký tự trong đoạn', '05E'],
  [F, '26. Đoạn con tổng bằng K', '06A'],
  [F, '27. Đoạn con chia hết cho K', '06B'],
  [F, '28. Tổng hình chữ nhật 2D', '06C'],
  [F, '29. Đoạn con dài nhất tổng bằng K', '06D'],
  [F, '30. Chia ba phần bằng nhau', '06E'],
];

async function main() {
  console.log('🚀 Generating MEDIUM Prefix/Suffix testcases...\n');
  let lastFolder = '';
  for (const [folder, file, id] of PROBLEMS) {
    if (folder !== lastFolder) { console.log(`📁 ${folder}`); lastFolder = folder; }
    await build(folder, file, id, G[id]());
  }
  fs.rmSync(BIN, { recursive: true, force: true });
  console.log('\n✅ Done! All MEDIUM testcase zips generated.');
}

main().catch((e) => { console.error(e); process.exit(1); });

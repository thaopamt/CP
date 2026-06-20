/**
 * Build GIAO_TRINH.md — tài liệu giảng dạy đầy đủ cho chuyên đề Tiền tố - Hậu tố.
 * Ghép: đề bài (.md) + lời giải C++ (_solutions/*.cpp) + bộ test (.zip) thành một
 * giáo trình duy nhất, đảm bảo nội dung khớp 100% với dữ liệu được seed.
 *
 * Chạy từ thư mục gốc:  node database/MEDIUM/build-giaotrinh.js
 */
'use strict';
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const SOL = path.join(BASE, '_solutions');

const F = '01. Chuyên đề: Tiền tố - Hậu tố';
const G1 = 'Phần 1 — Tổng tiền tố cơ bản';
const G2 = 'Phần 2 — Tổng hậu tố cơ bản';
const G3 = 'Phần 3 — Kết hợp tiền tố và hậu tố';
const G4 = 'Phần 4 — Truy vấn đoạn và mảng hiệu';
const G5 = 'Phần 5 — Điều kiện, min/max, đếm';
const G6 = 'Phần 6 — Ứng dụng nâng cao (subarray, chuỗi, ma trận 2D)';

// [file (không .md), id, mức độ, kiến thức trọng tâm, ý tưởng, độ phức tạp, nhóm]
const PROBLEMS = [
  ['01. Mảng cộng dồn', '01A', 'Dễ', 'Mảng tiền tố (prefix sum)',
    'Duyệt một lần, cộng dồn `sum += A[i]` và in ngay `sum` chính là `P[i]`.', 'O(N)', G1],
  ['02. Truy vấn tổng đoạn', '01B', 'Dễ', 'Tổng đoạn bằng hiệu hai tiền tố',
    'Dựng `pre[i]=pre[i-1]+A[i]`, tổng đoạn `[l,r] = pre[r]-pre[l-1]`, mỗi truy vấn O(1).', 'O(N + Q)', G1],
  ['03. Tổng tiền tố lớn nhất', '01C', 'Dễ', 'Prefix sum với số âm',
    'Cộng dồn tiền tố, giữ giá trị lớn nhất gặp được. Khởi tạo `best` rất nhỏ vì đáp án có thể âm.', 'O(N)', G1],
  ['04. Tổng đoạn theo modulo', '01D', 'Trung bình', 'Prefix sum kết hợp số học modulo',
    'Tính tiền tố thật bằng `long long`, lấy tổng đoạn rồi chuẩn hóa `((s%M)+M)%M` để tránh dư âm.', 'O(N + Q)', G1],
  ['05. Đếm số chẵn trong đoạn', '01E', 'Dễ', 'Prefix count theo điều kiện',
    'Mảng đếm tiền tố `cnt[i]` = số phần tử chẵn trong `A[1..i]`; đáp số = `cnt[r]-cnt[l-1]`.', 'O(N + Q)', G1],

  ['06. Mảng hậu tố', '02A', 'Dễ', 'Mảng hậu tố (suffix sum)',
    'Duyệt từ phải sang trái: `suf[i]=suf[i+1]+A[i]`.', 'O(N)', G2],
  ['07. Truy vấn tổng hậu tố', '02B', 'Dễ', 'Tổng hậu tố từ vị trí x',
    'Dựng sẵn mảng hậu tố, mỗi truy vấn trả `suf[x]` trong O(1).', 'O(N + Q)', G2],
  ['08. Tổng hậu tố lớn nhất', '02C', 'Dễ', 'Suffix sum với số âm',
    'Cộng dồn hậu tố từ phải sang trái, giữ giá trị lớn nhất. Đáp án có thể âm.', 'O(N)', G2],
  ['09. So sánh tiền tố và hậu tố', '02D', 'Trung bình', 'Kết hợp tiền tố và tổng tổng thể',
    'Giữ tiền tố `pre`, phần phải = `total - pre`; đếm vị trí có `pre > total-pre`.', 'O(N)', G2],
  ['10. Đếm số dương ở hậu tố', '02E', 'Dễ', 'Suffix count theo điều kiện',
    'Mảng đếm hậu tố `pos[i]` = số phần tử > 0 trong `A[i..N]`.', 'O(N + Q)', G2],

  ['11. Điểm chia cân bằng', '03A', 'Trung bình', 'Tiền tố + tổng tổng thể',
    'Với mỗi điểm cắt k, kiểm tra `pre == total - pre`. Đếm số điểm thỏa mãn.', 'O(N)', G3],
  ['12. Xóa một phần tử', '03B', 'Trung bình', 'Tiền tố trái và hậu tố phải',
    'Left = `pre[i-1]`, right = `total - pre[i-1] - A[i]`; đếm vị trí có left == right.', 'O(N)', G3],
  ['13. Lợi nhuận lớn nhất', '03C', 'Trung bình', 'Prefix min',
    'Duyệt j, giữ giá nhỏ nhất trước đó `minLeft`; cập nhật `A[j]-minLeft`.', 'O(N)', G3],
  ['14. Mảng tích trừ phần tử', '03D', 'Trung bình', 'Tích tiền tố × tích hậu tố',
    '`B[i] = preProd[i-1] * sufProd[i+1] % MOD`, tránh phép chia.', 'O(N)', G3],
  ['15. Chia đôi chênh lệch nhỏ nhất', '03E', 'Trung bình', 'Tiền tố + tổng tổng thể',
    'Với mỗi điểm cắt k, tính `|pre - (total-pre)|`, lấy nhỏ nhất.', 'O(N)', G3],

  ['16. Hiệu tổng hai mảng', '04A', 'Trung bình', 'Hai mảng tiền tố song song',
    'Dựng tiền tố cho A và B, kết quả = `(PA_r-PA_{l-1}) - (PB_r-PB_{l-1})`.', 'O(N + Q)', G4],
  ['17. Đếm chia hết trong đoạn', '04B', 'Trung bình', 'Prefix count theo điều kiện chia hết',
    'Mảng đếm tiền tố các phần tử chia hết K; đáp số = `cnt[r]-cnt[l-1]`.', 'O(N + Q)', G4],
  ['18. So sánh hai đoạn', '04C', 'Trung bình', 'Truy vấn tổng đoạn nhiều lần',
    'Tính tổng hai đoạn bằng tiền tố rồi so sánh, in 0/1/2.', 'O(N + Q)', G4],
  ['19. Mảng hiệu cập nhật đoạn', '04D', 'Trung bình', 'Difference array',
    '`diff[l]+=v; diff[r+1]-=v`; mảng cuối = tiền tố của `diff`.', 'O(N + M)', G4],
  ['20. Cập nhật đoạn rồi truy vấn', '04E', 'Trung bình', 'Difference array + prefix sum',
    'Dựng mảng cuối bằng mảng hiệu, rồi lấy tiền tố để trả lời truy vấn tổng.', 'O(N + U + Q)', G4],

  ['21. Tiền tố nhỏ nhất', '05A', 'Trung bình', 'Prefix min truy vấn',
    '`pmin[i]=min(pmin[i-1],A[i])`; trả lời `pmin[x]`.', 'O(N + Q)', G5],
  ['22. Hậu tố lớn nhất', '05B', 'Trung bình', 'Suffix max truy vấn',
    '`smax[i]=max(smax[i+1],A[i])`; trả lời `smax[x]`.', 'O(N + Q)', G5],
  ['23. Đếm cặp tiền tố bằng nhau', '05C', 'Khó', 'Đếm cặp dựa trên tiền tố (map)',
    'Số cặp `(i<j)` có `P[i]==P[j]` = tổng `C(freq[v],2)`; duyệt cộng `freq[pre]` trước khi tăng.', 'O(N log N)', G5],
  ['24. Tiền tố mảng nhị phân', '05D', 'Trung bình', 'Prefix count trên mảng 0/1',
    'Tiền tố số bit 1; đáp số = `ones[r]-ones[l-1]`.', 'O(N + Q)', G5],
  ['25. Đếm ký tự trong đoạn', '05E', 'Trung bình', 'Prefix trên chuỗi (26 mảng)',
    '`pre[i][c]` = số lần ký tự c trong `S[1..i]`; đáp số = `pre[r][c]-pre[l-1][c]`.', 'O(26N + Q)', G5],

  ['26. Đoạn con tổng bằng K', '06A', 'Khó', 'Hashmap tiền tố',
    'Với mỗi r, cộng số lần tiền tố `pre-K` đã xuất hiện. Khởi tạo `freq[0]=1`.', 'O(N)', G6],
  ['27. Đoạn con chia hết cho K', '06B', 'Khó', 'Tiền tố theo số dư',
    'Hai tiền tố cùng số dư mod K tạo đoạn chia hết; đếm theo từng số dư.', 'O(N + K)', G6],
  ['28. Tổng hình chữ nhật 2D', '06C', 'Khó', 'Prefix sum 2 chiều',
    '`P[i][j]` theo bao-trừ-bù; truy vấn = `P[r2][c2]-P[r1-1][c2]-P[r2][c1-1]+P[r1-1][c1-1]`.', 'O(R·C + Q)', G6],
  ['29. Đoạn con dài nhất tổng bằng K', '06D', 'Khó', 'Hashmap lưu vị trí tiền tố đầu tiên',
    'Lưu vị trí xuất hiện đầu tiên của mỗi tiền tố; với mỗi r tìm `pre-K` sớm nhất.', 'O(N)', G6],
  ['30. Chia ba phần bằng nhau', '06E', 'Nâng cao', 'Tiền tố + đếm cộng dồn',
    'Cần total chia hết 3; đếm điểm cắt 1 có tiền tố = part, cộng vào mỗi điểm cắt 2 có tiền tố = 2·part.', 'O(N)', G6],
];

function statementBody(folder, file) {
  const md = fs.readFileSync(path.join(BASE, folder, `${file}.md`), 'utf-8');
  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (i === 0 && l.startsWith('# ')) continue;          // bỏ tiêu đề H1
    if (/time limit per test/i.test(l)) continue;
    if (/memory limit per test/i.test(l)) continue;
    out.push(l);
  }
  return out.join('\n').trim();
}

async function testBlock(folder, file) {
  const zipPath = path.join(BASE, folder, `${file}.zip`);
  const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
  const names = Object.keys(zip.files).filter((n) => n.endsWith('.inp'))
    .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  const rows = [];
  for (let i = 0; i < names.length; i++) {
    const inp = (await zip.files[names[i]].async('text')).trimEnd();
    const out = (await zip.files[names[i].replace('.inp', '.out')].async('text')).trimEnd();
    const big = inp.length > 360 || out.length > 360;
    const role = i === 0 ? 'ví dụ mẫu / cơ bản'
      : i <= 2 ? 'cơ bản (công khai)'
      : i <= 7 ? 'biên / số âm / n nhỏ / trường hợp dễ sai'
      : 'n lớn gần giới hạn / ngẫu nhiên (ẩn)';
    if (big) {
      rows.push(`| ${i + 1} | _(test lớn — ${inp.split('\n')[0]} …)_ | _(đối chiếu khi chấm)_ | ${role} |`);
    } else {
      const fmt = (s) => '`' + s.replace(/\n/g, '` `') + '`';
      rows.push(`| ${i + 1} | ${fmt(inp)} | ${fmt(out)} | ${role} |`);
    }
  }
  return ['| # | Input | Output | Vai trò |', '| :-- | :-- | :-- | :-- |', ...rows].join('\n');
}

async function main() {
  const parts = [];
  parts.push('# Giáo trình Tiền tố - Hậu tố trong C++ (Lộ trình MEDIUM)\n');
  parts.push('> Tài liệu giảng dạy gồm **30 bài** đi từ cơ bản đến nâng cao, kèm lời giải C++17 và bộ test.');
  parts.push('> Đề bài (không kèm lời giải) được nạp vào hệ thống qua `pnpm seed:medium`; bộ test sinh bởi `node database/MEDIUM/generate-testcases.js`.\n');
  parts.push('Toàn bộ **30 bài** thuộc **một chuyên đề duy nhất** "Tiền tố - Hậu tố", chia làm 6 phần kiến thức:');
  parts.push('1. **Tổng tiền tố cơ bản** (Bài 1–5, Dễ) — prefix sum, truy vấn đoạn, modulo, đếm điều kiện.');
  parts.push('2. **Tổng hậu tố cơ bản** (Bài 6–10, Dễ) — suffix sum, so sánh hai phía.');
  parts.push('3. **Kết hợp tiền tố và hậu tố** (Bài 11–15, Trung bình) — điểm cân bằng, prefix min, tích trừ phần tử.');
  parts.push('4. **Truy vấn đoạn và mảng hiệu** (Bài 16–20, Trung bình) — nhiều truy vấn, difference array.');
  parts.push('5. **Điều kiện, min/max, đếm** (Bài 21–25, Trung bình–Khó) — prefix/suffix min-max, đếm cặp, chuỗi.');
  parts.push('6. **Ứng dụng nâng cao** (Bài 26–30, Khó–Nâng cao) — subarray tổng K, chia hết, prefix 2D, chia ba phần.\n');
  parts.push('---\n');

  let lastGroup = '';
  for (let idx = 0; idx < PROBLEMS.length; idx++) {
    const [file, id, level, knowledge, idea, complexity, group] = PROBLEMS[idx];
    if (group !== lastGroup) {
      parts.push(`\n# ${group}\n`);
      lastGroup = group;
    }
    const cpp = fs.readFileSync(path.join(SOL, `${id}.cpp`), 'utf-8').trimEnd();
    parts.push(`## Bài ${idx + 1}: ${file}`);
    parts.push(`- **Mức độ:** ${level}`);
    parts.push(`- **Kiến thức trọng tâm:** ${knowledge}`);
    parts.push('');
    parts.push(statementBody(F, file));
    parts.push('');
    parts.push(`**Ý tưởng:** ${idea}`);
    parts.push('');
    parts.push(`**Độ phức tạp:** ${complexity}`);
    parts.push('');
    parts.push('**Code C++17:**');
    parts.push('```cpp');
    parts.push(cpp);
    parts.push('```');
    parts.push('');
    parts.push('**Bộ test (10 test):**');
    parts.push(await testBlock(F, file));
    parts.push('\n---\n');
  }

  fs.writeFileSync(path.join(BASE, 'GIAO_TRINH.md'), parts.join('\n'));
  console.log('✅ Wrote GIAO_TRINH.md');
}

main().catch((e) => { console.error(e); process.exit(1); });

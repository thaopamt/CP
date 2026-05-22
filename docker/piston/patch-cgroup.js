/**
 * Patches Piston's job.js to remove cgroup (--cg) flags from isolate commands.
 * Required for Docker Desktop on macOS/Windows which uses cgroup v2,
 * but isolate expects cgroup v1.
 *
 * This disables per-sandbox memory tracking but allows code execution to work.
 */
const fs = require('fs');

const JOB_FILE = '/piston_api/src/job.js';

let code = fs.readFileSync(JOB_FILE, 'utf8');

// 1. Remove --cg from inline isolate commands:
//    `isolate --init --cg -b${box_id}` → `isolate --init -b${box_id}`
//    `isolate --cleanup --cg -b${box.id}` → `isolate --cleanup -b${box.id}`
code = code.replace(/ --cg /g, ' ');

// 2. Remove '--cg', from the args array in safe_call
code = code.replace(/^\s*'--cg',\s*$/gm, '');

// 3. Replace the cg-mem ternary with an empty array spread:
//    ...(memory_limit >= 0
//        ? [`--cg-mem=${Math.floor(memory_limit / 1000)}`]
//        : []),
//    → (removed entirely)
code = code.replace(
  /\.\.\.\(memory_limit\s*>=\s*0\s*\n\s*\?\s*\[`--cg-mem=\$\{Math\.floor\(memory_limit\s*\/\s*1000\)\}`\]\s*\n\s*:\s*\[\]\),?/g,
  ''
);

// 4. Remove cg-mem metadata parsing case:
//    case 'cg-mem':
//        memory = parse_int(value) * 1000;
//        break;
code = code.replace(
  /case\s*'cg-mem':\s*\n\s*memory\s*=\s*parse_int\(value\)\s*\*\s*1000;\s*\n\s*break;\s*\n/g,
  ''
);

fs.writeFileSync(JOB_FILE, code, 'utf8');

// Verify no --cg remains
const verify = fs.readFileSync(JOB_FILE, 'utf8');
const remaining = (verify.match(/--cg/g) || []).length;
if (remaining > 0) {
  console.warn(`[patch-cgroup] WARNING: ${remaining} --cg references still remain`);
} else {
  console.log('[patch-cgroup] All --cg references removed successfully');
}

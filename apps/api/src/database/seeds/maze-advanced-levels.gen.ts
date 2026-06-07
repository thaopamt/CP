/* eslint-disable */
// Offline generator: builds ~100 advanced maze levels (mixed item types, all
// monster skills, mystery boxes) and finds+verifies a primitive solution for
// each via BFS over the REAL engine. Writes a static data module the seed imports.
import * as fs from 'fs';
import {
  simulate, monsterViewsAt,
  BlockType as B, Command, Direction, GridConfig, ItemTheme, Cell, Monster,
} from '@cp/shared';

// ── seeded RNG (mulberry32) for reproducible generation ─────────────────────
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260607);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const at = (x: number, y: number): Cell => ({ x, y });
const E = Direction.EAST, S = Direction.SOUTH, N = Direction.NORTH, W = Direction.WEST;

// ── BFS solver over the real engine ─────────────────────────────────────────
type Prim = 'move' | 'left' | 'right' | 'pick' | 'wait';
const CMD: Record<Prim, Command> = {
  move: { type: B.MOVE_FORWARD }, left: { type: B.TURN_LEFT }, right: { type: B.TURN_RIGHT },
  pick: { type: B.PICK }, wait: { type: B.WAIT },
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
function monsterPeriod(grid: GridConfig): number {
  let p = 1;
  for (const m of grid.monsters ?? []) {
    const kind = m.kind ?? (m.path.length > 1 ? 'patrol' : 'static');
    let cyc = 1;
    if (kind === 'patrol') cyc = m.path.length <= 1 ? 1 : (m.mode ?? 'pingpong') === 'loop' ? m.path.length : 2 * (m.path.length - 1);
    else if (kind === 'sleeper') cyc = (m.sleep ?? 2) + (m.awake ?? 2);
    p = lcm(p, Math.max(1, cyc));
  }
  return p;
}
function evalState(grid: GridConfig, seq: Prim[], period: number) {
  const res = simulate(grid, seq.map((p) => CMD[p]));
  if (res.failReason) return { dead: true } as const;
  const last = res.steps[res.steps.length - 1];
  const items = last?.itemsLeft ?? grid.items ?? [];
  const boxes = last?.boxes ?? (grid.boxes ?? []).map((b) => ({ x: b.x, y: b.y }));
  const mon = last?.monsters ?? monsterViewsAt(grid, 0);
  const sortKey = (cs: { x: number; y: number }[]) => cs.map((c) => `${c.x},${c.y}`).sort().join(';');
  const key = `${res.finalPos.x},${res.finalPos.y}|${res.finalDir}|M${sortKey(mon)}|I${sortKey(items)}|B${sortKey(boxes)}|T${seq.length % period}`;
  return { dead: false, won: res.reachedGoal, key } as const;
}
function solve(grid: GridConfig, prims: Prim[], maxLen = 26, maxNodes = 26000): Prim[] | null {
  const period = monsterPeriod(grid);
  const start = evalState(grid, [], period);
  if (start.dead) return null;
  if (start.won) return [];
  const visited = new Set([start.key]);
  let queue: Prim[][] = [[]];
  let nodes = 0;
  while (queue.length) {
    const next: Prim[][] = [];
    for (const seq of queue) {
      if (++nodes > maxNodes) return null;
      for (const p of prims) {
        const cand = [...seq, p];
        const ev = evalState(grid, cand, period);
        if (ev.dead) continue;
        if (ev.won) return cand;
        if (cand.length >= maxLen || visited.has(ev.key)) continue;
        visited.add(ev.key);
        next.push(cand);
      }
    }
    queue = next;
  }
  return null;
}

// ── level shape ─────────────────────────────────────────────────────────────
interface Gen {
  category: string;
  title: string; description: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  grid: GridConfig; allowedBlocks: B[]; blockSlack: number; prims: Prim[];
}
interface OutLevel {
  title: string; description: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  grid: GridConfig; allowedBlocks: B[]; blockSlack: number; intendedSolution: Command[];
}

const ITEM_KINDS: ItemTheme[] = ['star', 'gem', 'coin', 'fruit', 'key'];
const GARDEN = [B.MOVE_FORWARD, B.TURN_LEFT, B.TURN_RIGHT, B.PICK, B.REPEAT];
const GARDEN2 = [...GARDEN, B.IF, B.WHILE, B.CONDITION, B.LOGIC];
const DODGE = [B.MOVE_FORWARD, B.TURN_LEFT, B.TURN_RIGHT, B.WAIT, B.REPEAT];
const DODGE2 = [...DODGE, B.IF, B.WHILE, B.CONDITION];
const BOXSET = [B.MOVE_FORWARD, B.TURN_LEFT, B.TURN_RIGHT, B.PICK, B.REPEAT, B.IF, B.CONDITION, B.WHILE];

function emptyGrid(w: number, h: number, start: Cell, dir: Direction, goal: Cell): GridConfig {
  return { width: w, height: h, walls: [], start, startDir: dir, goal };
}
function inBounds(g: GridConfig, c: Cell) { return c.x >= 0 && c.x < g.width && c.y >= 0 && c.y < g.height; }
function openCellsExcept(g: GridConfig, exclude: Cell[]): Cell[] {
  const ex = new Set(exclude.map((c) => `${c.x},${c.y}`));
  const wall = new Set((g.walls ?? []).map((c) => `${c.x},${c.y}`));
  const out: Cell[] = [];
  for (let y = 0; y < g.height; y++) for (let x = 0; x < g.width; x++) {
    const k = `${x},${y}`; if (!ex.has(k) && !wall.has(k)) out.push({ x, y });
  }
  return out;
}

const gens: Gen[] = [];

// ── 1. Mixed-type collect gardens (collectAll, nested-loop friendly) ─────────
let gi = 0;
for (const [w, h] of [[3, 1], [4, 1], [3, 2], [4, 2], [3, 3], [4, 3], [5, 2], [4, 4], [5, 3], [5, 4], [6, 3], [6, 4], [5, 5]] as [number, number][]) {
  for (const v of [0, 1, 2]) {
    gi++;
    const start = at(0, 0);
    const goal = at(w - 1, h - 1);
    const cells = openCellsExcept(emptyGrid(w, h, start, E, goal), []);
    // choose a subset of cells to hold items, vary kinds, occasionally double one
    const count = Math.min(cells.length, 3 + Math.floor(rand() * Math.min(4, cells.length - 1)));
    const shuffled = [...cells].sort(() => rand() - 0.5).slice(0, count);
    const items: Cell[] = [];
    const itemKindAt: Record<string, ItemTheme> = {};
    shuffled.forEach((c, idx) => {
      const kind = ITEM_KINDS[(idx + v) % ITEM_KINDS.length];
      itemKindAt[`${c.x},${c.y}`] = kind;
      const qty = idx === 0 && v === 1 && cells.length > 3 ? 2 : 1;
      for (let q = 0; q < qty; q++) items.push({ ...c });
    });
    const grid: GridConfig = { ...emptyGrid(w, h, start, E, goal), items, itemKindAt, collectAll: true };
    const hard = w * h >= 12;
    gens.push({
      category: 'garden',
      title: `Vườn kho báu ${w}×${h}`,
      description: 'Thu thập HẾT các báu vật đủ loại (⭐💎🪙🍎🔑) trên bản đồ. Có ô chứa nhiều hơn một — nhớ thu đủ số lần!',
      difficulty: hard ? 'HARD' : w * h >= 6 ? 'MEDIUM' : 'EASY',
      grid, allowedBlocks: hard ? GARDEN2 : GARDEN, blockSlack: 3, prims: ['move', 'left', 'right', 'pick'],
    });
  }
}

// ── 2. Patrol-dodge timing ───────────────────────────────────────────────────
for (let seed = 1; seed <= 18; seed++) {
  const w = 3 + (seed % 3), h = 2 + (seed % 2);
  const start = at(0, 0), goal = at(w - 1, 0);
  // a vertical patrol bobbing into row 0 on a middle column
  const col = 1 + (seed % Math.max(1, w - 2));
  const monsters: Monster[] = [{ kind: 'patrol', mode: 'loop', path: [at(col, Math.min(1, h - 1)), at(col, 0)] }];
  const grid: GridConfig = { ...emptyGrid(w, h, start, E, goal), monsters };
  gens.push({
    category: 'patrol',
    title: `Lối tuần tra ${w}×${h}`,
    description: 'Quái 👹 tuần tra lên-xuống chắn lối. Canh nhịp bằng "đứng yên ⏳" rồi băng qua.',
    difficulty: 'MEDIUM', grid, allowedBlocks: DODGE, blockSlack: 3, prims: ['move', 'wait', 'left', 'right'],
  });
}

// ── 3. Chaser (half speed) ───────────────────────────────────────────────────
for (let seed = 1; seed <= 18; seed++) {
  const w = 4 + (seed % 3), h = 3 + (seed % 2);
  const start = at(0, h - 1), goal = at(w - 1, 0);
  // chaser starts in a far corner, half speed → outrun + corner with detours
  const monsters: Monster[] = [{ kind: 'chaser', speed: 2, path: [at(w - 1, h - 1)] }];
  const grid: GridConfig = { ...emptyGrid(w, h, start, N, goal), monsters };
  gens.push({
    category: 'chaser',
    title: `Cắt đuôi quái đuổi ${w}×${h}`,
    description: 'Quái đuổi 👾 bám theo (đi chậm nửa nhịp). Chạy khéo, vòng tránh để cắt đuôi rồi tới ⭐.',
    difficulty: 'HARD', grid, allowedBlocks: DODGE2, blockSlack: 4, prims: ['move', 'left', 'right', 'wait'],
  });
}

// ── 4. Guard (line of sight) with cover ──────────────────────────────────────
for (let seed = 1; seed <= 26; seed++) {
  const w = 4 + (seed % 3), h = 3 + (seed % 2);
  const start = at(0, 0), goal = at(w - 1, h - 1);
  // a guard mid-board + a cover wall so the player can break line of sight
  const gx = Math.min(w - 2, 1 + (seed % 2)), gy = Math.min(h - 1, 1 + (seed % Math.max(1, h - 1)));
  const walls: Cell[] = [];
  const wx = Math.min(w - 2, gx + 1 + (seed % 2));
  const wy = (gy + 1) % h;
  const wcell = at(wx, wy);
  if (!(wcell.x === start.x && wcell.y === start.y) && !(wcell.x === goal.x && wcell.y === goal.y) && !(wcell.x === gx && wcell.y === gy)) walls.push(wcell);
  const monsters: Monster[] = [{ kind: 'guard', path: [at(gx, gy)] }];
  const grid: GridConfig = { ...emptyGrid(w, h, start, E, goal), walls, monsters };
  gens.push({
    category: 'guard',
    title: `Qua mặt lính canh ${w}×${h}`,
    description: 'Lính canh 💂 sẽ lao tới khi em vào cùng hàng/cột với nó. Nấp sau tường, tránh "lộ diện" rồi vòng tới ⭐.',
    difficulty: 'HARD', grid, allowedBlocks: DODGE2, blockSlack: 4, prims: ['move', 'left', 'right', 'wait'],
  });
}

// ── 5. Sleeper timing ─────────────────────────────────────────────────────────
for (let seed = 1; seed <= 16; seed++) {
  const w = 3 + (seed % 4);
  const start = at(0, 0), goal = at(w - 1, 0);
  const sleep = 2 + (seed % 2), awake = 2 + ((seed + 1) % 2);
  const col = 1 + (seed % Math.max(1, w - 2));
  const monsters: Monster[] = [{ kind: 'sleeper', sleep, awake, path: [at(col, 0)] }];
  const grid: GridConfig = { ...emptyGrid(w, 1, start, E, goal), monsters };
  gens.push({
    category: 'sleeper',
    title: `Băng qua quái ngủ ${w}×1`,
    description: 'Quái ngủ 😴 lúc ngủ thì vô hại, lúc thức 👹 thì nguy hiểm. Canh đúng lúc nó ngủ để băng qua!',
    difficulty: 'MEDIUM', grid, allowedBlocks: DODGE, blockSlack: 3, prims: ['move', 'wait', 'left', 'right'],
  });
}
// (fix stray h above)

// ── 6. Mystery boxes: treasure or monster, sensor-friendly ───────────────────
for (let seed = 1; seed <= 24; seed++) {
  const w = 3 + (seed % 3), h = 2 + (seed % 2);
  const start = at(0, 0), goal = at(w - 1, h - 1);
  const cells = openCellsExcept(emptyGrid(w, h, start, E, goal), [start, goal]);
  const shuffled = [...cells].sort(() => rand() - 0.5);
  const boxes = [] as { x: number; y: number; content: 'treasure' | 'monster' }[];
  const nBoxes = Math.min(shuffled.length, 2 + (seed % 3));
  for (let i = 0; i < nBoxes; i++) {
    boxes.push({ ...shuffled[i], content: i % 2 === 0 ? 'treasure' : 'monster' });
  }
  const collectAll = boxes.some((b) => b.content === 'treasure') && (seed % 2 === 0);
  const grid: GridConfig = { ...emptyGrid(w, h, start, E, goal), boxes, ...(collectAll ? { collectAll: true, itemTheme: 'star' as ItemTheme } : {}) };
  gens.push({
    category: 'box',
    title: `Hộp bí ẩn ${w}×${h}`,
    description: collectAll
      ? 'Mở hết hộp báu vật 🎁 (đi vào để mở) và TRÁNH hộp quái. Dùng cảm biến "hộp phía trước an toàn" để chọn.'
      : 'Có hộp "?" là báu vật, có hộp là quái vật. Dùng cảm biến "hộp phía trước an toàn" để né hộp quái rồi tới ⭐.',
    difficulty: 'HARD', grid, allowedBlocks: BOXSET, blockSlack: 3, prims: ['move', 'left', 'right', 'pick'],
  });
}

// ── 7. Combo: items + a monster + a box ──────────────────────────────────────
for (let seed = 1; seed <= 14; seed++) {
  const w = 4 + (seed % 2), h = 3;
  const start = at(0, 0), goal = at(w - 1, h - 1);
  const cells = openCellsExcept(emptyGrid(w, h, start, E, goal), [start]);
  const sh = [...cells].sort(() => rand() - 0.5);
  const items = [sh[0], sh[1]].map((c) => ({ ...c }));
  const itemKindAt: Record<string, ItemTheme> = {};
  itemKindAt[`${sh[0].x},${sh[0].y}`] = 'gem';
  itemKindAt[`${sh[1].x},${sh[1].y}`] = 'coin';
  const monsters: Monster[] = [{ kind: 'patrol', mode: 'pingpong', path: [at(w - 1, 0), at(w - 1, h - 1)] }];
  const grid: GridConfig = { ...emptyGrid(w, h, start, E, goal), items, itemKindAt, collectAll: true, monsters };
  gens.push({
    category: 'combo',
    title: `Kho báu có quái ${w}×${h}`,
    description: 'Thu thập hết báu vật 💎🪙 trong khi né quái tuần tra 👹. Canh nhịp và lập kế hoạch đường đi!',
    difficulty: 'HARD', grid, allowedBlocks: [...GARDEN2, B.WAIT], blockSlack: 4, prims: ['move', 'left', 'right', 'pick', 'wait'],
  });
}

// Interleave categories (round-robin) so the first 100 solvable stay balanced.
const byCat = new Map<string, Gen[]>();
for (const g of gens) (byCat.get(g.category) ?? byCat.set(g.category, []).get(g.category)!).push(g);
const order = ['garden', 'patrol', 'chaser', 'guard', 'sleeper', 'box', 'combo'];
const interleaved: Gen[] = [];
for (let i = 0; ; i++) {
  let added = false;
  for (const c of order) {
    const list = byCat.get(c);
    if (list && i < list.length) { interleaved.push(list[i]); added = true; }
  }
  if (!added) break;
}

// ── solve + verify, keep solvable ones up to 100 ─────────────────────────────
const out: OutLevel[] = [];
const stats: Record<string, number> = {};
for (const g of interleaved) {
  if (out.length >= 100) break;
  const sol = solve(g.grid, g.prims);
  const cat = g.category;
  if (!sol) { stats[`drop:${cat}`] = (stats[`drop:${cat}`] ?? 0) + 1; continue; }
  // double-confirm with the engine
  const res = simulate(g.grid, sol.map((p) => CMD[p]));
  if (!res.reachedGoal) { stats[`badverify:${cat}`] = (stats[`badverify:${cat}`] ?? 0) + 1; continue; }
  stats[cat] = (stats[cat] ?? 0) + 1;
  out.push({
    title: g.title, description: g.description, difficulty: g.difficulty,
    grid: g.grid, allowedBlocks: g.allowedBlocks, blockSlack: g.blockSlack,
    intendedSolution: sol.map((p) => CMD[p]),
  });
}

console.log(`Generated ${out.length} solvable levels of ${gens.length} candidates.`);
console.log('By category:', JSON.stringify(stats, null, 0));

// ── emit data module ─────────────────────────────────────────────────────────
const numbered = out.map((lv, i) => ({ ...lv, title: `Mê cung ${149 + i} — ${lv.title}` }));
const header = `/* eslint-disable */
// AUTO-GENERATED by maze-advanced-levels.gen.ts — do not edit by hand.
// Regenerate: npx tsx --tsconfig tsconfig.base.json apps/api/src/database/seeds/maze-advanced-levels.gen.ts
// ${numbered.length} advanced levels: mixed item types, monster skills
// (patrol/static/chaser/guard/sleeper), and mystery boxes. Every intendedSolution
// is BFS-found and engine-verified at generation time.
import { BlockType, Command, GridConfig } from '@cp/shared';

export interface GenLevel {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  grid: GridConfig;
  allowedBlocks: BlockType[];
  blockSlack: number;
  intendedSolution: Command[];
}

export const ADVANCED_GEN_LEVELS: GenLevel[] = ${JSON.stringify(numbered, null, 2)} as unknown as GenLevel[];
`;
fs.writeFileSync('apps/api/src/database/seeds/maze-advanced-levels.ts', header);
console.log(`Wrote apps/api/src/database/seeds/maze-advanced-levels.ts (${numbered.length} levels).`);

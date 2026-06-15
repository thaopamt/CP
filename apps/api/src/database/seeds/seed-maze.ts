import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { MazeLevel } from '../../modules/maze/maze-level.entity';
import {
  BlockType,
  Cell,
  countBlocks,
  CourseContentKind,
  Direction,
  Expr,
  GridConfig,
  PublishStatus,
  SensorType,
  simulate,
  Command,
} from '@cp/shared';

/**
 * Seeds the maze learning path — a HAND-CURATED progression of ~66 levels grouped
 * into 10 themed "worlds" (mỗi thế giới = một khóa học). Designed from scratch so
 * that EVERY level introduces a new shape, mechanic or twist: there is no bulk
 * procedural padding, so two consecutive levels never feel like the same puzzle.
 *
 * Pedagogy (cơ bản → nâng cao):
 *   1. Khởi hành        — đi thẳng & rẽ (sequencing)
 *   2. Vòng lặp         — repeat / lặp lồng nhau
 *   3. Cảm biến & rẽ    — if + cảm biến đường/tường
 *   4. Lặp có điều kiện — while / until / forever + break (men theo tường)
 *   5. Vườn thu hoạch   — pick + collect-all
 *   6. Né quái canh nhịp— wait + quái đứng yên/tuần tra
 *   7. Quái tinh ranh   — quái đuổi / lính canh / quái ngủ
 *   8. Hộp bí ẩn        — box sensors (báu vật vs quái)
 *   9. Logic & biến     — logic/and-or, biến, toán trong điều kiện
 *  10. Thử thách tổng hợp — gom mọi cơ chế + mê cung lớn
 *
 * Solvability is GUARANTEED two ways:
 *  • Pure wall mazes are authored as ASCII maps and solved automatically by BFS
 *    (mapLevel) — the solution proves the path exists AND that the allowed blocks
 *    suffice.
 *  • Mechanic levels (loops/harvest/monsters/boxes/variables) carry a hand-written
 *    `intendedSolution`. Each one is replayed through the shared `simulate()` at
 *    seed time and the run aborts if any level is unsolvable.
 *
 * Idempotent: levels are matched by title and updated in place; levels no longer
 * present in the seed are removed (cascading only THEIR submissions).
 */

interface LevelSeed {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  grid: GridConfig;
  allowedBlocks: BlockType[];
  maxBlocks: number | null;
  /** Assign directly to BASIC-A (true) or leave visible to everyone (false). */
  assignToBasicA: boolean;
  intendedSolution: Command[];
  /** Override the difficulty-tier block slack (keeps twisty levels fair). */
  blockSlack?: number;
}

/** A level before it is given its global "Mê cung N — …" title. */
type Draft = Omit<LevelSeed, 'title'> & { name: string };

interface World {
  code: string;
  title: string;
  description: string;
  levels: Draft[];
}

// ── Command / expression helpers ────────────────────────────────────────────
const move: Command = { type: BlockType.MOVE_FORWARD };
const left: Command = { type: BlockType.TURN_LEFT };
const right: Command = { type: BlockType.TURN_RIGHT };
const pick: Command = { type: BlockType.PICK };
const wait: Command = { type: BlockType.WAIT };
const brk: Command = { type: BlockType.BREAK };

const repeat = (times: number | Expr, body: Command[]): Command => ({ type: BlockType.REPEAT, times, body });
const forever = (body: Command[]): Command => ({ type: BlockType.FOREVER, body });
const whileDo = (cond: Expr, body: Command[]): Command => ({ type: BlockType.WHILE, mode: 'while', cond, body });
const untilDo = (cond: Expr, body: Command[]): Command => ({ type: BlockType.WHILE, mode: 'until', cond, body });
const ifDo = (cond: Expr, body: Command[], elseBody?: Command[]): Command => ({
  type: BlockType.IF,
  branches: [{ cond, body }],
  ...(elseBody ? { elseBody } : {}),
});

const sense = (s: SensorType): Expr => ({ kind: 'sensor', sensor: s });
const num = (value: number): Expr => ({ kind: 'num', value });
const vget = (name: string): Expr => ({ kind: 'var', name });
const vset = (name: string, value: Expr): Command => ({ type: 'var_set', name, value });
const vchange = (name: string, delta: Expr): Command => ({ type: 'var_change', name, delta });
const andE = (a: Expr, b: Expr): Expr => ({ kind: 'logic', op: 'and', a, b });
const mul = (a: Expr, b: Expr): Expr => ({ kind: 'arith', op: 'mul', a, b });

// Common sensors used by the curated solutions.
const PA = sense(SensorType.PATH_AHEAD);
const PR = sense(SensorType.PATH_RIGHT);
const AT_GOAL = sense(SensorType.AT_GOAL);
const NOT_AT_GOAL = sense(SensorType.NOT_AT_GOAL);
const ON = sense(SensorType.ON_ITEM);
const DONE = sense(SensorType.NO_ITEMS_LEFT);
const AHEAD = sense(SensorType.PATH_AHEAD);

const at = (x: number, y: number): Cell => ({ x, y });

// ── Allowed-block presets (focused per mechanic, kept small for clarity) ─────
const SEQ: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT];
const LOOP: BlockType[] = [...SEQ, BlockType.REPEAT];
const IFC: BlockType[] = [...LOOP, BlockType.IF, BlockType.CONDITION];
const WH: BlockType[] = [...IFC, BlockType.WHILE, BlockType.FOREVER, BlockType.BREAK];
const HARVEST: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.REPEAT];
const HARVEST_C: BlockType[] = [...HARVEST, BlockType.WHILE, BlockType.FOREVER, BlockType.IF, BlockType.BREAK, BlockType.CONDITION];
const DODGE: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.WAIT, BlockType.REPEAT];
const DODGE_C: BlockType[] = [...DODGE, BlockType.IF, BlockType.WHILE, BlockType.CONDITION];
const BOXC: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.REPEAT, BlockType.IF, BlockType.CONDITION, BlockType.WHILE];
const VARS: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.REPEAT, BlockType.VARIABLE, BlockType.MATH];
const LOGICB: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.WHILE, BlockType.LOGIC, BlockType.CONDITION];
const FULL: BlockType[] = [
  BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.WAIT,
  BlockType.REPEAT, BlockType.FOREVER, BlockType.WHILE, BlockType.IF, BlockType.BREAK,
  BlockType.CONDITION, BlockType.LOGIC, BlockType.MATH, BlockType.VARIABLE,
];

const E = Direction.EAST;
const S = Direction.SOUTH;
const N = Direction.NORTH;

// ── ASCII-map → GridConfig ──────────────────────────────────────────────────
// Legend: '#' wall · '.' open · 'S' start · 'G' goal · '*' item.
function parseMap(rows: string[]): {
  width: number;
  height: number;
  walls: Cell[];
  start: Cell;
  goal: Cell;
  items: Cell[];
} {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const walls: Cell[] = [];
  const items: Cell[] = [];
  let start: Cell | null = null;
  let goal: Cell | null = null;
  for (let y = 0; y < height; y++) {
    if (rows[y].length !== width) {
      throw new Error(`Bản đồ không vuông: dòng ${y} dài ${rows[y].length}, cần ${width}`);
    }
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (ch === '#') walls.push({ x, y });
      else if (ch === 'S') start = { x, y };
      else if (ch === 'G') goal = { x, y };
      else if (ch === '*') items.push({ x, y });
    }
  }
  if (!start || !goal) throw new Error('Bản đồ thiếu S hoặc G');
  return { width, height, walls, start, goal, items };
}

// BFS shortest path → move/turn command list. Proves solvability and that the
// allowed blocks are enough to walk it. (Ignores monsters — only used for pure
// wall mazes; mechanic levels carry their own hand-written solution.)
function bfsSolve(grid: GridConfig): Command[] {
  const k = (x: number, y: number) => `${x},${y}`;
  const wallSet = new Set(grid.walls.map((c) => k(c.x, c.y)));
  const open = (x: number, y: number) =>
    x >= 0 && x < grid.width && y >= 0 && y < grid.height && !wallSet.has(k(x, y));
  const sKey = k(grid.start.x, grid.start.y);
  const gKey = k(grid.goal.x, grid.goal.y);
  const prev = new Map<string, Cell>();
  const seen = new Set([sKey]);
  const q: Cell[] = [grid.start];
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];
  while (q.length) {
    const cur = q.shift()!;
    if (k(cur.x, cur.y) === gKey) break;
    for (const d of dirs) {
      const nx = cur.x + d.dx;
      const ny = cur.y + d.dy;
      const nk = k(nx, ny);
      if (open(nx, ny) && !seen.has(nk)) {
        seen.add(nk);
        prev.set(nk, cur);
        q.push({ x: nx, y: ny });
      }
    }
  }
  if (!seen.has(gKey)) throw new Error('Không tìm được đường đi từ S tới G');

  const path: Cell[] = [grid.goal];
  let cur: Cell = grid.goal;
  while (k(cur.x, cur.y) !== sKey) {
    cur = prev.get(k(cur.x, cur.y))!;
    path.unshift(cur);
  }

  const dirOf = (a: Cell, b: Cell): Direction => {
    if (b.x - a.x === 1) return Direction.EAST;
    if (b.x - a.x === -1) return Direction.WEST;
    if (b.y - a.y === 1) return Direction.SOUTH;
    return Direction.NORTH;
  };

  const cmds: Command[] = [];
  let dir = grid.startDir;
  for (let i = 1; i < path.length; i++) {
    const need = dirOf(path[i - 1], path[i]);
    let guard = 0;
    while (dir !== need && guard++ < 4) {
      if (((dir + 1) % 4) === need) {
        cmds.push(right);
        dir = ((dir + 1) % 4) as Direction;
      } else {
        cmds.push(left);
        dir = ((dir + 3) % 4) as Direction;
      }
    }
    cmds.push(move);
  }
  return cmds;
}

interface MapSpec {
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  startDir: Direction;
  map: string[];
  allowedBlocks: BlockType[];
  blockSlack?: number;
}

/** Turn an ASCII map spec into a BFS-verified Draft. */
function mapLevel(spec: MapSpec): Draft {
  let p: ReturnType<typeof parseMap>;
  try {
    p = parseMap(spec.map);
  } catch (err) {
    throw new Error(`Level "${spec.name}": ${(err as Error).message}`);
  }
  const grid: GridConfig = {
    width: p.width,
    height: p.height,
    walls: p.walls,
    start: p.start,
    startDir: spec.startDir,
    goal: p.goal,
    items: p.items.length ? p.items : undefined,
  };
  const solution = bfsSolve(grid);
  const allow = new Set(spec.allowedBlocks);
  for (const c of solution) {
    if (!allow.has(c.type as BlockType)) {
      throw new Error(`Level "${spec.name}" cần khối ${c.type} nhưng không nằm trong allowedBlocks`);
    }
  }
  return {
    name: spec.name,
    description: spec.description,
    difficulty: spec.difficulty,
    grid,
    allowedBlocks: spec.allowedBlocks,
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: solution,
    blockSlack: spec.blockSlack,
  };
}

/** Build a mechanic Draft with a hand-written solution. */
function lvl(
  name: string,
  description: string,
  difficulty: Draft['difficulty'],
  grid: GridConfig,
  allowedBlocks: BlockType[],
  intendedSolution: Command[],
  blockSlack?: number,
): Draft {
  return { name, description, difficulty, grid, allowedBlocks, maxBlocks: null, assignToBasicA: false, intendedSolution, blockSlack };
}

// ── Map shape generators (each used only a FEW times across the whole path) ──
const setCh = (row: string, x: number, ch: string): string => row.slice(0, x) + ch + row.slice(x + 1);

function lShape(width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let r = y === 0 ? '.'.repeat(width) : '#'.repeat(width);
    r = setCh(r, width - 1, '.');
    rows.push(r);
  }
  rows[0] = setCh(rows[0], 0, 'S');
  rows[height - 1] = setCh(rows[height - 1], width - 1, 'G');
  return rows;
}

function uShape(width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    if (y === height - 1) rows.push('.'.repeat(width));
    else {
      let r = '#'.repeat(width);
      r = setCh(r, 0, '.');
      r = setCh(r, width - 1, '.');
      rows.push(r);
    }
  }
  rows[0] = setCh(rows[0], 0, 'S');
  rows[0] = setCh(rows[0], width - 1, 'G');
  return rows;
}

function staircase(n: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < n; y++) {
    let r = '#'.repeat(n + 1);
    r = setCh(r, y, '.');
    r = setCh(r, y + 1, '.');
    rows.push(r);
  }
  rows[0] = setCh(rows[0], 0, 'S');
  rows[n - 1] = setCh(rows[n - 1], n, 'G');
  return rows;
}

function comb(width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    if (y === 0 || y === height - 1) {
      rows.push('.'.repeat(width));
      continue;
    }
    let r = '.'.repeat(width);
    for (let x = 1; x < width - 1; x++) if (x % 2 === 1) r = setCh(r, x, '#');
    rows.push(r);
  }
  rows[0] = setCh(rows[0], 0, 'S');
  rows[height - 1] = setCh(rows[height - 1], width - 1, 'G');
  return rows;
}

// Horizontal boustrophedon ("rắn bò"): even rows open, odd rows a wall with a
// single gap that flips side each time. `height` must be odd.
function snakeH(width: number, height: number): string[] {
  const rows: string[] = [];
  let connector = 0;
  let lastGapRight = true;
  for (let y = 0; y < height; y++) {
    if (y % 2 === 0) rows.push('.'.repeat(width));
    else {
      const gapRight = connector % 2 === 0;
      lastGapRight = gapRight;
      rows.push(setCh('#'.repeat(width), gapRight ? width - 1 : 0, '.'));
      connector++;
    }
  }
  rows[0] = setCh(rows[0], 0, 'S');
  rows[height - 1] = setCh(rows[height - 1], lastGapRight ? 0 : width - 1, 'G');
  return rows;
}

function pillars(width: number, height: number): string[] {
  const g: string[][] = Array.from({ length: height }, () => Array(width).fill('.'));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (x % 2 === 0 && y % 2 === 0 && !(x === 0 && y === 0)) g[y][x] = '#';
  g[0][0] = 'S';
  g[height - 1][width - 1] = 'G';
  return g.map((r) => r.join(''));
}

function ringBox(n: number): string[] {
  const g: string[][] = Array.from({ length: n }, () => Array(n).fill('.'));
  for (let inset = 2; inset <= (n - 1) / 2; inset += 2) {
    const lo = inset;
    const hi = n - 1 - inset;
    if (lo > hi) break;
    for (let x = lo; x <= hi; x++) {
      g[lo][x] = '#';
      g[hi][x] = '#';
    }
    for (let y = lo; y <= hi; y++) {
      g[y][lo] = '#';
      g[y][hi] = '#';
    }
  }
  g[0][0] = 'S';
  g[n - 1][n - 1] = 'G';
  return g.map((r) => r.join(''));
}

// Deterministic PRNG (mulberry32) — fixed seed ⇒ identical maze on every reseed.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// "Perfect maze" (spanning tree → exactly ONE path to the goal, every other
// corridor a dead-end decoy). Optional `braid` opens a few dead-ends into loops.
function perfectMaze(cols: number, rows: number, seed: number, braid = 0): string[] {
  const rand = rng(seed);
  const W = 2 * cols + 1;
  const H = 2 * rows + 1;
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill('#'));
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const dirs: Array<[number, number]> = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const active: Array<[number, number]> = [[0, 0]];
  visited[0][0] = true;
  g[1][1] = '.';
  while (active.length) {
    const idx = Math.floor(rand() * active.length);
    const [cx, cy] = active[idx];
    const nbrs: Array<[number, number, number, number]> = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) nbrs.push([nx, ny, dx, dy]);
    }
    if (!nbrs.length) {
      active.splice(idx, 1);
      continue;
    }
    const [nx, ny, dx, dy] = nbrs[Math.floor(rand() * nbrs.length)];
    visited[ny][nx] = true;
    g[2 * cy + 1 + dy][2 * cx + 1 + dx] = '.';
    g[2 * ny + 1][2 * nx + 1] = '.';
    active.push([nx, ny]);
  }
  if (braid > 0) {
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const cellX = 2 * cx + 1;
        const cellY = 2 * cy + 1;
        let openSides = 0;
        const closed: Array<[number, number]> = [];
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          if (g[cellY + dy][cellX + dx] === '.') openSides++;
          else closed.push([dx, dy]);
        }
        if (openSides === 1 && closed.length && rand() < braid) {
          const [dx, dy] = closed[Math.floor(rand() * closed.length)];
          g[cellY + dy][cellX + dx] = '.';
        }
      }
    }
  }
  g[1][1] = 'S';
  g[2 * rows - 1][2 * cols - 1] = 'G';
  return g.map((r) => r.join(''));
}

// ════════════════════════════════════════════════════════════════════════════
// WORLD 1 — Khởi hành: đi thẳng & rẽ hướng (sequencing)
// ════════════════════════════════════════════════════════════════════════════
const WORLD1: Draft[] = [
  mapLevel({
    name: 'Đường thẳng đầu tiên',
    description: 'Giúp robot đi thẳng tới ngôi sao. Chỉ cần khối "đi tới"!',
    difficulty: 'EASY', startDir: E, allowedBlocks: SEQ,
    map: ['S...G'],
  }),
  mapLevel({
    name: 'Khúc cua chữ L',
    description: 'Đi tới cuối đường rồi rẽ xuống. Dùng khối "quay phải".',
    difficulty: 'EASY', startDir: E, allowedBlocks: SEQ,
    map: ['S##', '.##', '..G'],
  }),
  mapLevel({
    name: 'Rẽ sang trái',
    description: 'Lần này đích nằm bên trái — hãy "quay trái" đúng lúc.',
    difficulty: 'EASY', startDir: N, allowedBlocks: SEQ,
    map: ['G..', '##.', '##S'],
  }),
  mapLevel({
    name: 'Bậc thang nhỏ',
    description: 'Leo xuống từng bậc một, nhớ quay đúng hướng mỗi bậc.',
    difficulty: 'EASY', startDir: E, allowedBlocks: SEQ,
    map: staircase(3),
  }),
  mapLevel({
    name: 'Đi vòng chữ U',
    description: 'Đi xuống, sang ngang rồi đi lên để tới đích bên kia.',
    difficulty: 'EASY', startDir: S, allowedBlocks: SEQ,
    map: uShape(4, 4),
  }),
  mapLevel({
    name: 'Con rắn nhỏ',
    description: 'Bò theo hình rắn: hết hàng này lại quay sang hàng kia.',
    difficulty: 'EASY', startDir: E, allowedBlocks: SEQ,
    map: snakeH(5, 3),
  }),
  mapLevel({
    name: 'Đường vòng vèo',
    description: 'Một lối đi quanh co với nhiều khúc cua — quan sát thật kỹ!',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: SEQ,
    map: ['S...#', '###.#', '#...#', '#.###', '#...G'],
  }),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 2 — Vòng lặp: lặp lại để viết gọn (repeat / nested repeat)
// ════════════════════════════════════════════════════════════════════════════
const WORLD2: Draft[] = [
  mapLevel({
    name: 'Đường dài — dùng lặp',
    description: 'Quãng đường rất dài. Thử "lặp lại" thay vì xếp nhiều khối "đi tới".',
    difficulty: 'EASY', startDir: E, allowedBlocks: LOOP,
    map: ['S........G'],
  }),
  lvl(
    'Bắt buộc phải lặp',
    'Em chỉ được dùng tối đa 2 khối! Bắt buộc dùng "lặp lại" mới đủ.',
    'MEDIUM',
    { width: 8, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(7, 0) },
    LOOP,
    [repeat(7, [move])],
    0,
  ),
  mapLevel({
    name: 'Lược răng',
    description: 'Lách qua các răng lược lặp đi lặp lại — vòng lặp giúp rất nhiều.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: LOOP,
    map: comb(7, 5),
  }),
  mapLevel({
    name: 'Cầu thang dài',
    description: 'Bậc thang dài hơn — tìm quy luật lặp của mỗi bậc.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: LOOP,
    map: staircase(6),
  }),
  mapLevel({
    name: 'Rắn bò 6×5',
    description: 'Con rắn nhiều hàng. Mỗi hàng là một lần lặp giống nhau.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: LOOP,
    map: snakeH(6, 5),
  }),
  mapLevel({
    name: 'Rắn bò 7×7',
    description: 'Rắn dài hơn nữa — vòng lặp lồng trong vòng lặp sẽ gọn nhất.',
    difficulty: 'HARD', startDir: E, allowedBlocks: LOOP,
    map: snakeH(7, 7),
  }),
  mapLevel({
    name: 'Rừng cột bàn cờ',
    description: 'Lách qua rừng cột xen kẽ như bàn cờ.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: LOOP,
    map: pillars(6, 5),
  }),
  mapLevel({
    name: 'Mê cung hộp',
    description: 'Men theo viền ngoài để vượt qua lớp tường ở giữa.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: LOOP,
    map: ringBox(7),
  }),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 3 — Cảm biến & rẽ nhánh: "nếu phía trước có đường…" (if + sensors)
// ════════════════════════════════════════════════════════════════════════════
// Pattern: repeat(K)[ if(path_ahead) move ] drives forward until a wall, where
// extra iterations are harmless no-ops — robust to over-counting.
const drive = (k: number): Command => repeat(k, [ifDo(PA, [move])]);

const WORLD3: Draft[] = [
  lvl(
    'Đi đến khi gặp tường',
    'Dùng cảm biến "phía trước có đường": cứ đi tới chừng nào còn đường.',
    'EASY',
    { width: 6, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(5, 0) },
    IFC,
    [drive(10)],
    1,
  ),
  lvl(
    'Gặp tường thì rẽ phải',
    'Đi tới khi gặp tường, quay phải, rồi lại đi tới đích.',
    'MEDIUM',
    parseGrid(lShape(6, 5), E),
    IFC,
    [drive(10), right, drive(10)],
    2,
  ),
  lvl(
    'Tự chọn hướng rẽ',
    'Tới góc tường, dùng "nếu bên phải có đường" để chọn quay phải hay quay trái.',
    'MEDIUM',
    parseGrid(lShape(6, 5), E),
    IFC,
    [drive(10), ifDo(PR, [right], [left]), drive(10)],
    2,
  ),
  lvl(
    'Đường chữ Z',
    'Hai khúc cua ngược chiều. Đi tới — rẽ — đi tới — rẽ — tới đích.',
    'HARD',
    parseGrid(['S.....', '#####.', '......', '.#####', 'G.....'], E),
    IFC,
    [drive(10), right, drive(10), right, drive(10), left, drive(10)],
    2,
  ),
  mapLevel({
    name: 'Mê cung nhỏ nhiều ngõ cụt',
    description: 'Một mê cung thật sự: chỉ một lối đúng, còn lại là ngõ cụt đánh lừa.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: IFC,
    map: perfectMaze(3, 3, 71),
  }),
  mapLevel({
    name: 'Mê cung cảm biến',
    description: 'Mê cung lớn hơn — vừa đi vừa "đọc" tường để không lạc.',
    difficulty: 'HARD', startDir: E, allowedBlocks: IFC,
    map: perfectMaze(4, 4, 137),
  }),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 4 — Lặp có điều kiện: while / until / forever + break (men theo tường)
// ════════════════════════════════════════════════════════════════════════════
const WORLD4: Draft[] = [
  lvl(
    'Lặp đến khi tới đích',
    'Dùng "lặp đến khi tới đích": cứ đi tới cho tới khi chạm ngôi sao.',
    'EASY',
    { width: 8, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(7, 0) },
    WH,
    [untilDo(AT_GOAL, [move])],
    1,
  ),
  lvl(
    'Trong khi còn đường',
    'Dùng "trong khi phía trước có đường": đi cho tới khi hết đường.',
    'EASY',
    { width: 11, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(10, 0) },
    WH,
    [whileDo(PA, [move])],
    1,
  ),
  lvl(
    'Men theo tường (rẽ phải)',
    'Một thuật toán cho mọi mê cung: nếu phía trước có đường thì đi, không thì quay phải — lặp đến khi tới đích.',
    'MEDIUM',
    parseGrid(lShape(6, 5), E),
    WH,
    [untilDo(AT_GOAL, [ifDo(PA, [move], [right])])],
    2,
  ),
  lvl(
    'Men tường chữ U',
    'Cùng một thuật toán men tường, nhưng bản đồ bắt em rẽ phải tới hai lần.',
    'MEDIUM',
    parseGrid(['S....', '####.', 'G....'], E),
    WH,
    [untilDo(AT_GOAL, [ifDo(PA, [move], [right])])],
    2,
  ),
  lvl(
    'Lặp mãi rồi dừng',
    'Dùng "lặp mãi mãi": nếu tới đích thì DỪNG, còn lại men theo tường.',
    'MEDIUM',
    parseGrid(lShape(5, 4), E),
    WH,
    [forever([ifDo(AT_GOAL, [brk]), ifDo(PA, [move], [right])])],
    2,
  ),
  lvl(
    'Men theo tường bên trái',
    'Đổi tay: nếu phía trước có đường thì đi, không thì quay TRÁI — vẫn tới đích.',
    'MEDIUM',
    parseGrid(['####G', '####.', 'S....'], E),
    WH,
    [untilDo(AT_GOAL, [ifDo(PA, [move], [left])])],
    2,
  ),
  lvl(
    'Men tường đường dài',
    'Bản đồ lớn hẳn ra, nhưng vẫn đúng một thuật toán men tường — sức mạnh của vòng lặp!',
    'HARD',
    parseGrid(lShape(9, 7), E),
    WH,
    [untilDo(AT_GOAL, [ifDo(PA, [move], [right])])],
    1,
  ),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 5 — Vườn thu hoạch: nhặt vật phẩm + collect-all (pick)
// ════════════════════════════════════════════════════════════════════════════
const WORLD5: Draft[] = [
  lvl(
    'Vườn thẳng',
    'Đi dọc luống và "thu hoạch 🌾" từng cây ở mỗi ô có cây.',
    'EASY',
    {
      width: 4, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(3, 0),
      items: [at(0, 0), at(1, 0), at(2, 0), at(3, 0)], collectAll: true,
    },
    [BlockType.MOVE_FORWARD, BlockType.PICK],
    [pick, move, pick, move, pick, move, pick],
    2,
  ),
  lvl(
    'Vườn dùng vòng lặp',
    'Luống dài hơn — dùng "lặp lại" để thu hoạch cho gọn.',
    'EASY',
    {
      width: 5, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(4, 0),
      items: [at(0, 0), at(1, 0), at(2, 0), at(3, 0), at(4, 0)], collectAll: true,
    },
    HARVEST,
    [pick, repeat(4, [move, pick])],
    2,
  ),
  lvl(
    'Vườn có ô trống',
    'Không phải ô nào cũng có cây — chỉ thu hoạch ở ô có cây thôi.',
    'EASY',
    {
      width: 6, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(5, 0),
      items: [at(0, 0), at(2, 0), at(4, 0), at(5, 0)], collectAll: true,
    },
    HARVEST,
    [pick, move, move, pick, move, move, pick, move, pick],
    2,
  ),
  lvl(
    'Thu hoạch khi còn đường',
    'Dùng "trong khi phía trước có đường": cứ đi tới rồi thu hoạch tới hết luống.',
    'MEDIUM',
    {
      width: 6, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(5, 0),
      items: [0, 1, 2, 3, 4, 5].map((x) => at(x, 0)), collectAll: true,
    },
    HARVEST_C,
    [pick, whileDo(AHEAD, [move, pick])],
    2,
  ),
  lvl(
    'Vườn thông minh',
    'Lặp mãi mãi: nếu ô có cây thì thu hoạch, nếu vườn sạch cây thì dừng, ngược lại đi tới.',
    'MEDIUM',
    {
      width: 7, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(6, 0),
      items: [0, 1, 2, 3, 4, 5, 6].map((x) => at(x, 0)), collectAll: true,
    },
    HARVEST_C,
    [forever([ifDo(ON, [pick]), ifDo(DONE, [brk]), move])],
    2,
  ),
  lvl(
    'Vườn chữ L',
    'Vườn gấp khúc! Thu hoạch nếu có cây, dừng khi sạch vườn, có đường thì đi, không thì quay phải.',
    'HARD',
    {
      width: 4, height: 3,
      walls: [at(0, 1), at(1, 1), at(2, 1), at(0, 2), at(1, 2), at(2, 2)],
      start: at(0, 0), startDir: E, goal: at(3, 2),
      items: [at(0, 0), at(1, 0), at(2, 0), at(3, 0), at(3, 1), at(3, 2)], collectAll: true,
    },
    HARVEST_C,
    [forever([ifDo(ON, [pick]), ifDo(DONE, [brk]), ifDo(AHEAD, [move], [right])])],
    3,
  ),
  lvl(
    'Ô nhiều cây — hút sạch',
    'Có ô chứa cả chùm cây. Dùng "trong khi ô này còn cây thì thu hoạch" để hút sạch một ô trước khi đi tiếp.',
    'HARD',
    {
      width: 5, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(4, 0),
      items: [at(0, 0), at(0, 0), at(2, 0), at(2, 0), at(2, 0), at(4, 0)],
      collectAll: true, itemTheme: 'star',
    },
    HARVEST_C,
    [forever([whileDo(ON, [pick]), ifDo(DONE, [brk]), move])],
    2,
  ),
  lvl(
    'Vườn rắn',
    'Vườn uốn lượn hai khúc cua. Vẫn một thuật toán: thu hoạch, dừng khi sạch, đi khi có đường, quay phải khi gặp tường.',
    'HARD',
    {
      width: 4, height: 3,
      walls: [at(0, 1), at(1, 1), at(2, 1)],
      start: at(0, 0), startDir: E, goal: at(0, 2),
      items: [at(0, 0), at(1, 0), at(2, 0), at(3, 0), at(3, 1), at(3, 2), at(2, 2), at(1, 2), at(0, 2)],
      collectAll: true,
    },
    HARVEST_C,
    [forever([ifDo(ON, [pick]), ifDo(DONE, [brk]), ifDo(AHEAD, [move], [right])])],
    3,
  ),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 6 — Né quái canh nhịp: wait + quái đứng yên / tuần tra
// ════════════════════════════════════════════════════════════════════════════
const WORLD6: Draft[] = [
  lvl(
    'Né quái đứng yên',
    'Một con quái 👹 chặn giữa đường. Chạm vào là thua — hãy đi vòng để né rồi tới ngôi sao.',
    'EASY',
    {
      width: 3, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(2, 2),
      monsters: [{ path: [at(1, 1)] }],
    },
    SEQ,
    [move, move, right, move, move],
    2,
  ),
  lvl(
    'Canh nhịp tuần tra',
    'Quái 👹 tuần tra lên-xuống chắn lối. Dùng "đứng yên ⏳" để chờ đúng nhịp rồi băng qua.',
    'MEDIUM',
    {
      width: 3, height: 2, walls: [], start: at(0, 0), startDir: E, goal: at(2, 0),
      monsters: [{ path: [at(1, 1), at(1, 0)], mode: 'loop' }],
    },
    DODGE,
    [wait, move, move],
    2,
  ),
  lvl(
    'Tuần tra dài hơn',
    'Lối đi dài hơn, vẫn một con quái tuần tra. Canh đúng nhịp đứng yên để vượt.',
    'MEDIUM',
    {
      width: 4, height: 2, walls: [], start: at(0, 0), startDir: E, goal: at(3, 0),
      monsters: [{ path: [at(1, 1), at(1, 0)], mode: 'loop' }],
    },
    DODGE,
    [wait, move, move, move],
    3,
  ),
  lvl(
    'Quái tuần tra 5 ô',
    'Quái tuần tra ở giữa đường dài 5 ô. Đi một đoạn, đứng yên một nhịp, rồi đi nốt.',
    'MEDIUM',
    {
      width: 5, height: 2, walls: [], start: at(0, 0), startDir: E, goal: at(4, 0),
      monsters: [{ kind: 'patrol', mode: 'loop', path: [at(3, 1), at(3, 0)] }],
    },
    DODGE,
    [move, move, wait, move, move],
    3,
  ),
  lvl(
    'Hai quái canh cửa',
    'Hai con quái 👹 tuần tra so le nhau. Đứng yên chờ rồi băng một mạch qua khe trống.',
    'HARD',
    {
      width: 4, height: 2, walls: [], start: at(0, 0), startDir: E, goal: at(3, 0),
      monsters: [
        { path: [at(1, 1), at(1, 0)], mode: 'loop' },
        { path: [at(2, 0), at(2, 1)], mode: 'loop' },
      ],
    },
    DODGE,
    [wait, move, move, move],
    2,
  ),
  lvl(
    'Băng qua quái ngủ',
    'Quái ngủ 😴 lúc ngủ vô hại, lúc thức 👹 thì nguy hiểm. Canh đúng lúc nó ngủ để băng qua!',
    'MEDIUM',
    {
      width: 4, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(3, 0),
      monsters: [{ kind: 'sleeper', sleep: 3, awake: 2, path: [at(2, 0)] }],
    },
    DODGE,
    [move, move, move],
    3,
  ),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 7 — Quái tinh ranh: quái đuổi / lính canh / quái ngủ patrol
// ════════════════════════════════════════════════════════════════════════════
const WORLD7: Draft[] = [
  lvl(
    'Cắt đuôi quái đuổi',
    'Quái đuổi 👾 bám theo (đi chậm nửa nhịp). Chạy khéo, vòng tránh để cắt đuôi rồi tới ⭐.',
    'HARD',
    {
      width: 5, height: 4, walls: [], start: at(0, 3), startDir: N, goal: at(4, 0),
      monsters: [{ kind: 'chaser', speed: 2, path: [at(4, 3)] }],
    },
    DODGE_C,
    [move, move, move, right, move, move, move, move],
    4,
  ),
  lvl(
    'Quái đuổi đường dài',
    'Quái đuổi 👾 trên bản đồ rộng hơn. Đừng để bị dồn vào góc — luôn chừa đường thoát.',
    'HARD',
    {
      width: 6, height: 3, walls: [], start: at(0, 2), startDir: N, goal: at(5, 0),
      monsters: [{ kind: 'chaser', speed: 2, path: [at(5, 2)] }],
    },
    DODGE_C,
    [move, move, right, move, move, move, move, move],
    4,
  ),
  lvl(
    'Qua mặt lính canh',
    'Lính canh 💂 sẽ lao tới khi em vào cùng hàng/cột với nó. Nấp sau tường, tránh "lộ diện" rồi vòng tới ⭐.',
    'HARD',
    {
      width: 5, height: 4, walls: [at(3, 3)], start: at(0, 0), startDir: E, goal: at(4, 3),
      monsters: [{ kind: 'guard', path: [at(2, 2)] }],
    },
    DODGE_C,
    [move, move, move, move, right, move, move, move],
    4,
  ),
  lvl(
    'Lính canh trong phòng',
    'Một lính canh 💂 khác và một bức tường che. Tính đường để không bao giờ lọt vào tầm nhìn của nó.',
    'HARD',
    {
      width: 4, height: 4, walls: [at(2, 2)], start: at(0, 0), startDir: E, goal: at(3, 3),
      monsters: [{ kind: 'guard', path: [at(2, 1)] }],
    },
    DODGE_C,
    [right, move, move, move, left, move, move, move],
    4,
  ),
  lvl(
    'Quái ngủ tuần tra',
    'Quái ngủ 😴 khi thức sẽ đi tuần. Canh nhịp ngủ/thức để băng qua đúng lúc an toàn.',
    'MEDIUM',
    {
      width: 5, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(4, 0),
      monsters: [{ kind: 'sleeper', sleep: 2, awake: 3, path: [at(3, 0)] }],
    },
    DODGE,
    [move, move, wait, wait, move, move],
    3,
  ),
  lvl(
    'Lính canh & lối vòng',
    'Lính canh 💂 giữa phòng rộng, có tường chắn ở trên. Vòng xuống dưới để giữ an toàn rồi tới đích.',
    'HARD',
    {
      width: 6, height: 4, walls: [at(4, 0)], start: at(0, 0), startDir: E, goal: at(5, 3),
      monsters: [{ kind: 'guard', path: [at(2, 3)] }],
    },
    DODGE_C,
    [move, move, move, right, move, left, move, move, right, move, move],
    4,
  ),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 8 — Hộp bí ẩn: báu vật vs quái (box sensors)
// ════════════════════════════════════════════════════════════════════════════
const WORLD8: Draft[] = [
  lvl(
    'Hộp bí ẩn đầu tiên',
    'Có hộp "?" là báu vật, có hộp là quái vật. Tránh hộp quái, đi an toàn tới ⭐.',
    'MEDIUM',
    {
      width: 3, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(2, 2),
      boxes: [
        { x: 2, y: 0, content: 'treasure' },
        { x: 1, y: 0, content: 'monster' },
      ],
    },
    BOXC,
    [right, move, move, left, move, move],
    3,
  ),
  lvl(
    'Né hộp quái',
    'Dùng cảm biến "hộp phía trước an toàn" để biết hộp nào nên tránh, rồi vòng tới đích.',
    'HARD',
    {
      width: 4, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(3, 2),
      boxes: [
        { x: 3, y: 1, content: 'treasure' },
        { x: 1, y: 2, content: 'monster' },
        { x: 2, y: 2, content: 'treasure' },
      ],
    },
    BOXC,
    [move, move, move, right, move, move],
    3,
  ),
  lvl(
    'Mê lộ hộp',
    'Nhiều hộp hơn, có cả hộp quái nằm chắn. Lập đường đi chỉ chạm hộp an toàn.',
    'HARD',
    {
      width: 5, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(4, 2),
      boxes: [
        { x: 3, y: 2, content: 'treasure' },
        { x: 0, y: 1, content: 'monster' },
        { x: 2, y: 2, content: 'treasure' },
        { x: 2, y: 0, content: 'monster' },
      ],
    },
    BOXC,
    [move, right, move, move, left, move, move, move],
    3,
  ),
  lvl(
    'Né hộp giữa đường',
    'Hộp quái nằm ngay lối thẳng. Đổi làn, đi vòng qua hàng dưới rồi tới đích.',
    'HARD',
    {
      width: 4, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(3, 2),
      boxes: [
        { x: 1, y: 1, content: 'treasure' },
        { x: 0, y: 1, content: 'monster' },
        { x: 1, y: 2, content: 'treasure' },
      ],
    },
    BOXC,
    [move, move, move, right, move, move],
    3,
  ),
  lvl(
    'Mở hết hộp báu vật',
    'Lần này phải MỞ HẾT hộp báu vật 🎁 (đi vào để mở) và TRÁNH hộp quái thì mới thắng.',
    'HARD',
    {
      width: 4, height: 2, walls: [], start: at(0, 0), startDir: E, goal: at(3, 1),
      boxes: [
        { x: 1, y: 0, content: 'treasure' },
        { x: 2, y: 0, content: 'monster' },
        { x: 3, y: 0, content: 'treasure' },
      ],
      collectAll: true, itemTheme: 'star',
    },
    BOXC,
    [move, right, move, left, move, move, left, move],
    3,
  ),
  lvl(
    'Hộp báu vật góc xa',
    'Mở cả hai hộp báu vật ở hai góc và né hộp quái ở giữa.',
    'HARD',
    {
      width: 3, height: 2, walls: [], start: at(0, 0), startDir: E, goal: at(2, 1),
      boxes: [
        { x: 2, y: 0, content: 'treasure' },
        { x: 1, y: 0, content: 'monster' },
      ],
      collectAll: true, itemTheme: 'star',
    },
    BOXC,
    [right, move, left, move, move, left, move],
    3,
  ),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 9 — Logic & biến: and/or, biến đếm, toán trong điều kiện
// ════════════════════════════════════════════════════════════════════════════
const WORLD9: Draft[] = [
  lvl(
    'Biến đếm bước',
    'Tạo một biến "số bước" = 7, rồi "lặp lại (số bước) lần" khối đi tới.',
    'MEDIUM',
    { width: 8, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(7, 0) },
    VARS,
    [vset('buoc', num(7)), repeat(vget('buoc'), [move])],
    2,
  ),
  lvl(
    'Biến cộng thêm',
    'Đặt biến = 3, rồi "tăng biến thêm 4". Dùng biến đó cho số lần lặp.',
    'MEDIUM',
    { width: 8, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(7, 0) },
    VARS,
    [vset('buoc', num(3)), vchange('buoc', num(4)), repeat(vget('buoc'), [move])],
    2,
  ),
  lvl(
    'Phép nhân',
    'Số bước = 2 × 3. Dùng khối toán "nhân" làm số lần lặp.',
    'MEDIUM',
    { width: 7, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(6, 0) },
    VARS,
    [repeat(mul(num(2), num(3)), [move])],
    2,
  ),
  lvl(
    'Dừng đúng ngôi sao',
    'Đường đi VƯỢT QUA ngôi sao. Dùng logic "VÀ": đi trong khi (phía trước có đường) VÀ (chưa tới đích).',
    'HARD',
    { width: 7, height: 1, walls: [], start: at(0, 0), startDir: E, goal: at(4, 0) },
    LOGICB,
    [whileDo(andE(PA, NOT_AT_GOAL), [move])],
    2,
  ),
];

// ════════════════════════════════════════════════════════════════════════════
// WORLD 10 — Thử thách tổng hợp: gom mọi cơ chế + mê cung lớn
// ════════════════════════════════════════════════════════════════════════════
const WORLD10: Draft[] = [
  lvl(
    'Kho báu canh nhịp',
    'Thu thập hết báu vật 💎🪙 trong khi né quái tuần tra 👹.',
    'HARD',
    {
      width: 5, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(4, 2),
      items: [at(2, 1), at(2, 0)], itemKindAt: { '2,1': 'gem', '2,0': 'coin' }, collectAll: true,
      monsters: [{ kind: 'patrol', mode: 'pingpong', path: [at(4, 0), at(4, 2)] }],
    },
    [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.REPEAT, BlockType.IF, BlockType.WHILE, BlockType.CONDITION, BlockType.WAIT],
    [move, move, right, pick, move, pick],
    4,
  ),
  lvl(
    'Kho báu hai góc',
    'Hai báu vật nằm hai hướng, một con quái tuần tra dọc bên phải. Lượm đủ rồi thoát.',
    'HARD',
    {
      width: 4, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(3, 2),
      items: [at(1, 0), at(2, 1)], itemKindAt: { '1,0': 'gem', '2,1': 'coin' }, collectAll: true,
      monsters: [{ kind: 'patrol', mode: 'pingpong', path: [at(3, 0), at(3, 2)] }],
    },
    [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.REPEAT, BlockType.IF, BlockType.WHILE, BlockType.CONDITION, BlockType.WAIT],
    [move, pick, move, right, move, pick],
    4,
  ),
  lvl(
    'Kho sao có quái',
    'Thử thách: thu thập HẾT ngôi sao ⭐ (có ô chứa 2 sao) trong khi né hai con quái 👹 đứng canh.',
    'HARD',
    {
      width: 5, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(4, 2),
      items: [at(4, 0), at(4, 0), at(0, 2), at(2, 2)], collectAll: true, itemTheme: 'star',
      monsters: [{ path: [at(2, 1)] }, { path: [at(1, 1)] }],
    },
    [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.REPEAT],
    [right, move, move, left, pick, move, move, pick, move, move, left, move, move, pick, pick],
    3,
  ),
  lvl(
    'Kho báu trong mê cung',
    'Báu vật nấp trong khúc cua, quái tuần tra rình rập. Lập kế hoạch đường đi thật cẩn thận.',
    'HARD',
    {
      width: 4, height: 3, walls: [], start: at(0, 0), startDir: E, goal: at(3, 2),
      items: [at(1, 1), at(1, 2)], itemKindAt: { '1,1': 'gem', '1,2': 'coin' }, collectAll: true,
      monsters: [{ kind: 'patrol', mode: 'pingpong', path: [at(3, 0), at(3, 2)] }],
    },
    [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT, BlockType.PICK, BlockType.REPEAT, BlockType.IF, BlockType.WHILE, BlockType.CONDITION, BlockType.WAIT],
    [move, right, move, pick, move, pick],
    4,
  ),
  mapLevel({
    name: 'Mê lộ lớn 5×5',
    description: 'Mê cung dày đặc ngõ cụt — chỉ một lối đúng dẫn tới ngôi sao. Dùng vòng lặp men tường.',
    difficulty: 'HARD', startDir: E, allowedBlocks: FULL,
    map: perfectMaze(5, 5, 101), blockSlack: 3,
  }),
  mapLevel({
    name: 'Mê lộ lớn 6×6',
    description: 'Lớn hơn nữa và nhiều cạm bẫy ngõ cụt hơn.',
    difficulty: 'HARD', startDir: E, allowedBlocks: FULL,
    map: perfectMaze(6, 6, 211), blockSlack: 3,
  }),
  mapLevel({
    name: 'Mê lộ vòng lặp 7×7',
    description: 'Mê cung rộng có cả vòng lặp đánh lừa — bám đúng một lối tới đích.',
    difficulty: 'HARD', startDir: E, allowedBlocks: FULL,
    map: perfectMaze(7, 7, 307, 0.15), blockSlack: 3,
  }),
  mapLevel({
    name: 'Vô địch mê lộ 8×8',
    description: 'Thử thách cuối cùng của cả lộ trình: mê cung khổng lồ, nhiều ngõ cụt và vòng lặp nhiễu.',
    difficulty: 'HARD', startDir: E, allowedBlocks: FULL,
    map: perfectMaze(8, 8, 409, 0.18), blockSlack: 4,
  }),
];

/** Build a GridConfig from an ASCII map (walls/start/goal) with a start dir. */
function parseGrid(map: string[], startDir: Direction): GridConfig {
  const p = parseMap(map);
  return {
    width: p.width, height: p.height, walls: p.walls,
    start: p.start, startDir, goal: p.goal,
    items: p.items.length ? p.items : undefined,
  };
}

// ── Worlds → courses + numbered levels ──────────────────────────────────────
const WORLDS: World[] = [
  { code: 'MAZE-W01', title: 'Mê cung 1: Khởi hành', description: 'Làm quen di chuyển và rẽ hướng qua những bản đồ nhỏ.', levels: WORLD1 },
  { code: 'MAZE-W02', title: 'Mê cung 2: Vòng lặp', description: 'Dùng "lặp lại" và vòng lặp lồng nhau để viết chương trình gọn.', levels: WORLD2 },
  { code: 'MAZE-W03', title: 'Mê cung 3: Cảm biến & rẽ nhánh', description: 'Đọc cảm biến đường/tường và dùng "nếu…" để quyết định.', levels: WORLD3 },
  { code: 'MAZE-W04', title: 'Mê cung 4: Lặp có điều kiện', description: 'while / đến khi / lặp mãi + dừng — thuật toán men theo tường.', levels: WORLD4 },
  { code: 'MAZE-W05', title: 'Mê cung 5: Vườn thu hoạch', description: 'Thu hoạch vật phẩm và chiến lược thu thập sạch bản đồ.', levels: WORLD5 },
  { code: 'MAZE-W06', title: 'Mê cung 6: Né quái canh nhịp', description: 'Đứng yên canh nhịp để né quái đứng yên và quái tuần tra.', levels: WORLD6 },
  { code: 'MAZE-W07', title: 'Mê cung 7: Quái tinh ranh', description: 'Quái đuổi, lính canh và quái ngủ — mỗi loại một mẹo riêng.', levels: WORLD7 },
  { code: 'MAZE-W08', title: 'Mê cung 8: Hộp bí ẩn', description: 'Phân biệt hộp báu vật và hộp quái bằng cảm biến.', levels: WORLD8 },
  { code: 'MAZE-W09', title: 'Mê cung 9: Logic & biến', description: 'Biến đếm, phép toán và logic và/hoặc trong điều kiện.', levels: WORLD9 },
  { code: 'MAZE-W10', title: 'Mê cung 10: Thử thách tổng hợp', description: 'Gom mọi cơ chế và chinh phục các mê cung lớn nhất.', levels: WORLD10 },
];

interface MazeCourseSpec {
  code: string;
  title: string;
  description: string;
}

const MAZE_COURSE_SPECS: MazeCourseSpec[] = WORLDS.map((w) => ({
  code: w.code,
  title: w.title,
  description: w.description,
}));

// Flatten worlds into globally-numbered levels, remembering each level's course.
const ALL_LEVELS: LevelSeed[] = [];
const courseCodeOfLevel: string[] = [];
{
  let n = 0;
  for (const world of WORLDS) {
    for (const d of world.levels) {
      n += 1;
      const { name, ...rest } = d;
      ALL_LEVELS.push({ ...rest, title: `Mê cung ${n} — ${name}` });
      courseCodeOfLevel.push(world.code);
    }
  }
}

// ── Difficulty: tighten the block budget on every level ─────────────────────
const PRIMITIVE = new Set<string>([BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT]);
const SLACK: Record<LevelSeed['difficulty'], number> = { EASY: 2, MEDIUM: 1, HARD: 0 };

/** Run-length-encode consecutive identical primitive commands into `repeat`. */
function compress(cmds: Command[], allowRepeat: boolean): Command[] {
  if (!allowRepeat) return cmds;
  const out: Command[] = [];
  let i = 0;
  while (i < cmds.length) {
    const head = cmds[i];
    let j = i + 1;
    while (j < cmds.length && cmds[j].type === head.type && PRIMITIVE.has(head.type)) j++;
    const run = j - i;
    if (run >= 3 && PRIMITIVE.has(head.type)) out.push(repeat(run, [head]));
    else for (let q = 0; q < run; q++) out.push(head);
    i = j;
  }
  return out;
}

/** Replace each level's solution with its compact form and set a tight maxBlocks. */
function applyBlockLimits(levels: LevelSeed[]): void {
  for (const lv of levels) {
    const allowRepeat = lv.allowedBlocks.includes(BlockType.REPEAT);
    const compact = compress(lv.intendedSolution, allowRepeat);
    const base = countBlocks(compact);
    const limit = base + (lv.blockSlack ?? SLACK[lv.difficulty]);
    lv.maxBlocks = lv.maxBlocks != null ? Math.min(lv.maxBlocks, limit) : limit;
    lv.intendedSolution = compact;
    if (countBlocks(compact) > (lv.maxBlocks ?? Infinity)) {
      throw new Error(`Level "${lv.title}" không có lời giải vừa giới hạn ${lv.maxBlocks} khối`);
    }
  }
}

applyBlockLimits(ALL_LEVELS);

export { ALL_LEVELS, MAZE_COURSE_SPECS };

/** Seed/sync the curated maze path using an already-initialized DataSource. */
export async function seedMaze(ds: DataSource): Promise<void> {
  console.log('🧩 Seeding maze levels (curated path)…');

  const classRepo = ds.getRepository(ClassEntity);
  const courseRepo = ds.getRepository(Course);
  const classCourseRepo = ds.getRepository(ClassCourse);
  const levelRepo = ds.getRepository(MazeLevel);

  // Sanity-check every level is solvable with its intended solution.
  for (const lv of ALL_LEVELS) {
    const res = simulate(lv.grid, lv.intendedSolution);
    if (!res.reachedGoal) {
      throw new Error(`❌ Level "${lv.title}" không giải được bằng lời giải mẫu (failReason=${res.failReason}).`);
    }
  }
  console.log(`✅ All ${ALL_LEVELS.length} sample solutions verified solvable.`);

  // Find BASIC-A class (optional — created by seed-basic-a).
  const basicA = await classRepo.findOneBy({ code: 'BASIC-A' });
  if (!basicA) {
    console.warn('⚠️ Class BASIC-A not found; levels will be visible to all students instead.');
  }

  // Maze courses ("khóa học") grouping levels into a long-term learning path.
  const coursesByCode = new Map<string, Course>();
  for (const [idx, spec] of MAZE_COURSE_SPECS.entries()) {
    let course = await courseRepo.findOneBy({ code: spec.code });
    if (!course) {
      course = new Course();
      course.code = spec.code;
      console.log(`✅ Course ${spec.code} created.`);
    }
    course.title = spec.title;
    course.description = spec.description;
    course.status = PublishStatus.PUBLISHED;
    course.contentKind = CourseContentKind.MAZE;
    course.totalPoints = 0;
    course.assignmentCount = 0;
    course = await courseRepo.save(course);
    coursesByCode.set(spec.code, course);

    if (basicA) {
      const existingLink = await classCourseRepo.findOneBy({ classId: basicA.id, courseId: course.id });
      const link = existingLink ?? new ClassCourse();
      link.classId = basicA.id;
      link.courseId = course.id;
      link.orderIndex = 99 + idx;
      link.isRequired = false;
      await classCourseRepo.save(link);
    }
  }

  // Archive any legacy maze courses from previous seeds so they leave the path.
  const legacyCodes = [
    'MAZE-101', 'MAZE-FOUNDATION', 'MAZE-LAB-01', 'MAZE-LAB-02', 'MAZE-LAB-03', 'MAZE-LAB-04',
    'MAZE-HARVEST', 'MAZE-MONSTERS', 'MAZE-ADVANCED-01', 'MAZE-ADVANCED-02', 'MAZE-ADVANCED-03',
  ];
  for (const code of legacyCodes) {
    const legacy = await courseRepo.findOneBy({ code });
    if (!legacy) continue;
    legacy.status = PublishStatus.ARCHIVED;
    legacy.assignmentCount = 0;
    legacy.totalPoints = 0;
    legacy.contentKind = CourseContentKind.MAZE;
    await courseRepo.save(legacy);
    if (basicA) await classCourseRepo.delete({ classId: basicA.id, courseId: legacy.id });
  }

  // Idempotent upsert keyed by title. Existing rows are UPDATED in place so their
  // primary key (and student submissions, via ON DELETE CASCADE) survive a reseed.
  // Levels whose titles disappeared from the seed set are removed (cascading only
  // THEIR submissions). Because this is a full redesign, most old "Mê cung N — …"
  // titles change, so the old levels are cleaned up here.
  const existingLevels = await levelRepo
    .createQueryBuilder('l')
    .where("l.title LIKE 'Mê cung %'")
    .getMany();
  const existingByTitle = new Map(existingLevels.map((l) => [l.title, l]));

  const seededTitles = new Set<string>();
  const courseCounts = new Map<string, number>();
  let created = 0;
  let updated = 0;
  for (let i = 0; i < ALL_LEVELS.length; i++) {
    const lv = ALL_LEVELS[i];
    const courseCode = courseCodeOfLevel[i];
    const course = coursesByCode.get(courseCode);
    if (!course) throw new Error(`Không tìm thấy course seed ${courseCode}`);

    seededTitles.add(lv.title);
    const existing = existingByTitle.get(lv.title);
    const entity = existing ?? new MazeLevel();
    entity.title = lv.title;
    entity.description = lv.description;
    entity.gridConfig = lv.grid;
    entity.allowedBlocks = lv.allowedBlocks;
    entity.maxBlocks = lv.maxBlocks;
    entity.difficulty = lv.difficulty;
    entity.status = PublishStatus.PUBLISHED;
    entity.courseId = course.id;
    entity.order = i + 1;
    entity.classIds = lv.assignToBasicA && basicA ? [basicA.id] : null;
    await levelRepo.save(entity);
    courseCounts.set(course.id, (courseCounts.get(course.id) ?? 0) + 1);
    if (existing) updated++;
    else created++;
  }

  for (const course of coursesByCode.values()) {
    course.assignmentCount = courseCounts.get(course.id) ?? 0;
    course.totalPoints = 0;
    await courseRepo.save(course);
  }

  const obsolete = existingLevels.filter((l) => !seededTitles.has(l.title));
  if (obsolete.length) await levelRepo.remove(obsolete);

  console.log(
    `🎉 Maze path synced: ${created} created, ${updated} updated, ${obsolete.length} removed.`,
  );
}

async function runCli(): Promise<void> {
  // Seeds never need DDL (the tables already exist), so connect with a dedicated
  // DataSource that has synchronize OFF. This keeps a maze reseed working even if
  // an unrelated schema drift elsewhere would otherwise make synchronize fail.
  const ds = new DataSource({ ...AppDataSource.options, synchronize: false });
  await ds.initialize();
  console.log('📂 Database connected.');
  try {
    await seedMaze(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error('❌ Error during maze seed:', err);
    process.exit(1);
  });
}

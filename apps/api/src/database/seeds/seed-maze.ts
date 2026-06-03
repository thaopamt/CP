import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { MazeLevel } from '../../modules/maze/maze-level.entity';
import { BlockType, Cell, Direction, GridConfig, PublishStatus, SensorType, simulate, Command } from '@cp/shared';

/**
 * Seeds maze levels (basic → advanced) under a "Lập trình kéo-thả" course
 * attached to the BASIC-A class. Idempotent: levels are matched by title and
 * re-created on each run (FK cascade removes old submissions).
 *
 * The first six levels carry hand-written `intendedSolution`s. The remaining
 * levels are authored as ASCII maps and solved automatically by BFS — the
 * solution proves the level is reachable AND that the allowed blocks suffice.
 * Every solution is run through the shared engine at seed time as a guard.
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
}

const move: Command = { type: BlockType.MOVE_FORWARD };
const left: Command = { type: BlockType.TURN_LEFT };
const right: Command = { type: BlockType.TURN_RIGHT };
const repeat = (times: number, body: Command[]): Command => ({ type: BlockType.REPEAT, times, body });

// ── Allowed-block presets (cumulative difficulty tiers) ─────────────────────
const A1: BlockType[] = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT];
const A2: BlockType[] = [...A1, BlockType.REPEAT];
const A3: BlockType[] = [...A2, BlockType.CONDITION, BlockType.IF];
const A4: BlockType[] = [...A3, BlockType.WHILE, BlockType.BREAK, BlockType.FOREVER];
const A5: BlockType[] = [...A4, BlockType.LOGIC, BlockType.MATH, BlockType.VARIABLE];

const E = Direction.EAST;
const S = Direction.SOUTH;

// ── ASCII-map → GridConfig ─────────────────────────────────────────────────
// Legend: '#' wall · '.' open · 'S' start · 'G' goal · '*' item (open).
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
// allowed blocks are enough to walk it.
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
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  startDir: Direction;
  map: string[];
  allowedBlocks: BlockType[];
}

/** Turn an ASCII map spec into a verified LevelSeed (BFS provides the solution). */
function mapLevel(spec: MapSpec): LevelSeed {
  const p = parseMap(spec.map);
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
      throw new Error(`Level "${spec.title}" cần khối ${c.type} nhưng không nằm trong allowedBlocks`);
    }
  }
  return {
    title: spec.title,
    description: spec.description,
    difficulty: spec.difficulty,
    grid,
    allowedBlocks: spec.allowedBlocks,
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: solution,
  };
}

// ── Levels 1–6: curated, hand-written solutions ─────────────────────────────
const LEVELS: LevelSeed[] = [
  {
    title: 'Mê cung 1 — Đường thẳng',
    description: 'Hãy giúp chú robot đi thẳng tới ngôi sao. Chỉ cần dùng khối "đi tới"!',
    difficulty: 'EASY',
    grid: { width: 5, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: E, goal: { x: 4, y: 0 } },
    allowedBlocks: [BlockType.MOVE_FORWARD],
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: [move, move, move, move],
  },
  {
    title: 'Mê cung 2 — Khúc quanh',
    description: 'Đi tới rồi rẽ để tới đích. Em sẽ cần khối "quay phải" nhé!',
    difficulty: 'EASY',
    grid: { width: 4, height: 4, walls: [], start: { x: 0, y: 0 }, startDir: E, goal: { x: 3, y: 3 } },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT],
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: [move, move, move, right, move, move, move],
  },
  {
    title: 'Mê cung 3 — Đường zigzag',
    description: 'Vượt qua các bức tường bằng cách đi vòng. Hãy quan sát kỹ lối đi!',
    difficulty: 'MEDIUM',
    grid: {
      width: 5,
      height: 5,
      walls: [
        { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
        { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
      ],
      start: { x: 0, y: 0 },
      startDir: E,
      goal: { x: 4, y: 4 },
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT],
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: [right, move, move, left, move, move, move, move, right, move, move],
  },
  {
    title: 'Mê cung 4 — Đường dài',
    description: 'Quãng đường rất dài! Thử dùng khối "lặp lại" để viết gọn hơn nhé.',
    difficulty: 'MEDIUM',
    grid: { width: 8, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: E, goal: { x: 7, y: 0 } },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.REPEAT],
    maxBlocks: null,
    assignToBasicA: true,
    intendedSolution: [repeat(7, [move])],
  },
  {
    title: 'Mê cung 5 — Phải dùng vòng lặp',
    description: 'Em chỉ được dùng tối đa 2 khối. Bắt buộc phải dùng "lặp lại" mới giải được!',
    difficulty: 'HARD',
    grid: { width: 6, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: E, goal: { x: 5, y: 0 } },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.REPEAT],
    maxBlocks: 2,
    assignToBasicA: true,
    intendedSolution: [repeat(5, [move])],
  },
  {
    title: 'Mê cung 6 — Đi men theo tường',
    description:
      'Dùng khối điều kiện: lặp cho đến khi tới đích — nếu phía trước có đường thì đi tới, ngược lại thì quay phải.',
    difficulty: 'HARD',
    grid: {
      width: 4,
      height: 4,
      walls: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 },
      ],
      start: { x: 0, y: 0 },
      startDir: E,
      goal: { x: 3, y: 3 },
    },
    allowedBlocks: [
      BlockType.MOVE_FORWARD,
      BlockType.TURN_RIGHT,
      BlockType.WHILE,
      BlockType.IF,
      BlockType.CONDITION,
    ],
    maxBlocks: null,
    assignToBasicA: true,
    intendedSolution: [
      {
        type: BlockType.WHILE,
        mode: 'until',
        cond: { kind: 'sensor', sensor: SensorType.AT_GOAL },
        body: [
          {
            type: BlockType.IF,
            branches: [{ cond: { kind: 'sensor', sensor: SensorType.PATH_AHEAD }, body: [move] }],
            elseBody: [right],
          },
        ],
      },
    ],
  },
];

// ── Levels 7–36: ASCII maps, auto-solved & verified ─────────────────────────
const MAP_LEVELS: LevelSeed[] = [
  // ----- EASY -----
  mapLevel({
    title: 'Mê cung 7 — Bước đầu tiên',
    description: 'Đi thẳng một mạch tới ngôi sao.',
    difficulty: 'EASY', startDir: E, allowedBlocks: A1,
    map: ['S....G'],
  }),
  mapLevel({
    title: 'Mê cung 8 — Rẽ xuống',
    description: 'Đi tới cuối hàng rồi rẽ xuống.',
    difficulty: 'EASY', startDir: E, allowedBlocks: A1,
    map: [
      'S....',
      '....G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 9 — Chữ L',
    description: 'Một khúc quanh nhỏ. Nhớ quay đúng hướng nhé!',
    difficulty: 'EASY', startDir: E, allowedBlocks: A1,
    map: [
      'S.',
      '#.',
      'G.',
    ],
  }),
  mapLevel({
    title: 'Mê cung 10 — Đường dài',
    description: 'Quãng đường khá dài — thử dùng khối "lặp lại" cho gọn.',
    difficulty: 'EASY', startDir: E, allowedBlocks: A2,
    map: ['S........G'],
  }),
  mapLevel({
    title: 'Mê cung 11 — Chữ U',
    description: 'Đi vòng chữ U để tới đích.',
    difficulty: 'EASY', startDir: S, allowedBlocks: A1,
    map: [
      'S#G',
      '.#.',
      '...',
    ],
  }),
  mapLevel({
    title: 'Mê cung 12 — Bậc thang',
    description: 'Leo từng bậc một.',
    difficulty: 'EASY', startDir: E, allowedBlocks: A2,
    map: [
      'S.###',
      '#..##',
      '##..#',
      '###.G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 13 — Răng lược',
    description: 'Bò theo hình rắn qua các khe.',
    difficulty: 'EASY', startDir: E, allowedBlocks: A2,
    map: [
      'S...',
      '###.',
      '....',
      '.###',
      '...G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 14 — Khe hẹp',
    description: 'Len lỏi qua các bức tường.',
    difficulty: 'EASY', startDir: E, allowedBlocks: A2,
    map: [
      'S.#..',
      '..#.#',
      '.....',
      '#.#.#',
      '..#.G',
    ],
  }),

  // ----- MEDIUM -----
  mapLevel({
    title: 'Mê cung 15 — Rắn bò 5×5',
    description: 'Đường ngoằn ngoèo dài hơn — lặp lại sẽ giúp ích.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A2,
    map: [
      'S....',
      '####.',
      '.....',
      '.####',
      '....G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 16 — Zigzag 6×6',
    description: 'Bò rắn qua sáu hàng.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A2,
    map: [
      'S.....',
      '#####.',
      '......',
      '.#####',
      '......',
      '#####G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 17 — Vòng quanh cột',
    description: 'Đi vòng qua bức tường ở giữa.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A3,
    map: [
      'S.#..',
      '..#..',
      '..#.G',
      '.....',
    ],
  }),
  mapLevel({
    title: 'Mê cung 18 — Hành lang chữ chi',
    description: 'Hành lang dài bảy ô — quan sát kỹ lối rẽ.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A3,
    map: [
      'S......',
      '######.',
      '.......',
      '.######',
      '.......',
      '######.',
      '......G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 19 — Cửa hẹp',
    description: 'Tìm cửa để xuống đích.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A3,
    map: [
      'S....',
      '.###.',
      '...#.',
      '##.#.',
      '....G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 20 — Rắn bò 7×7',
    description: 'Con rắn dài hơn nữa.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A3,
    map: [
      'S......',
      '.######',
      '.......',
      '######.',
      '.......',
      '.######',
      '......G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 21 — Rắn bò ngược',
    description: 'Đích nằm ở góc dưới bên trái.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A3,
    map: [
      'S.....',
      '#####.',
      '......',
      '.#####',
      '......',
      'G#####',
    ],
  }),
  mapLevel({
    title: 'Mê cung 22 — Khung viền',
    description: 'Men theo viền của mê cung.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A3,
    map: [
      'S.....',
      '.####.',
      '.#..#.',
      '.#..#.',
      '.####.',
      '.....G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 23 — Mê cung 6×6',
    description: 'Mê cung thật sự — bắt đầu thử dùng "trong khi".',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A4,
    map: [
      'S....#',
      '####.#',
      '#....#',
      '#.####',
      '#....#',
      '####.G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 24 — Rắn bò 8×8',
    description: 'Con rắn tám hàng — vòng lặp là bạn của em.',
    difficulty: 'MEDIUM', startDir: E, allowedBlocks: A4,
    map: [
      'S.......',
      '#######.',
      '........',
      '.#######',
      '........',
      '#######.',
      '........',
      '#######G',
    ],
  }),

  // ----- HARD -----
  mapLevel({
    title: 'Mê cung 25 — Đi men tường',
    description: 'Áp dụng luật bàn tay phải để vượt mê cung.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A4,
    map: [
      'S...#',
      '###.#',
      '#...#',
      '#.###',
      '#...G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 26 — Mê cung 8×8',
    description: 'Mê cung rộng theo hình rắn ngược.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A4,
    map: [
      'S.......',
      '.#######',
      '........',
      '#######.',
      '........',
      '.#######',
      '........',
      'G#######',
    ],
  }),
  mapLevel({
    title: 'Mê cung 27 — Xoắn ốc',
    description: 'Đi vòng theo viền tới đích.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A4,
    map: [
      'S......',
      '.#####.',
      '.#...#.',
      '.#.#.#.',
      '.#...#.',
      '.#####.',
      '......G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 28 — Đường ngọc',
    description: 'Đi qua các viên ngọc 💎 trên đường tới đích.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A4,
    map: [
      'S*..#',
      '###*#',
      '#.*.#',
      '#*###',
      '#..*G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 29 — Hành lang 10 ô',
    description: 'Hành lang rất dài — dùng biến để đếm số bước nếu em muốn.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S.........',
      '#########.',
      '..........',
      '.#########',
      '..........',
      '#########G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 30 — Mê cung 7×7',
    description: 'Thử thách: vận dụng vòng lặp và điều kiện.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S.....#',
      '#####.#',
      '#.....#',
      '#.###.#',
      '#.#...#',
      '#.###.#',
      '#.....G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 31 — Rắn bò 9×9',
    description: 'Con rắn chín hàng — vòng lặp lồng nhau sẽ rất gọn.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S........',
      '########.',
      '.........',
      '.########',
      '.........',
      '########.',
      '.........',
      '.########',
      '........G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 32 — Bàn cờ',
    description: 'Lách qua các cột xen kẽ như bàn cờ.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S.#.#.#.',
      '........',
      '.#.#.#.#',
      '........',
      '#.#.#.#.',
      '........',
      '.#.#.#.#',
      '.......G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 33 — Rắn bò 9×9 (ngược)',
    description: 'Con rắn chín hàng theo chiều ngược lại.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S........',
      '.########',
      '.........',
      '########.',
      '.........',
      '.########',
      '.........',
      '########.',
      '........G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 34 — Rắn bò 10×10',
    description: 'Mê cung dài nhất — hãy lập kế hoạch cẩn thận.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S.........',
      '#########.',
      '..........',
      '.#########',
      '..........',
      '#########.',
      '..........',
      '.#########',
      '..........',
      '#########G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 35 — Kho báu',
    description: 'Thu thập các viên ngọc 💎 rồi tới đích.',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S....#',
      '.###.#',
      '.#*#..',
      '.#.##.',
      '.#..*.',
      '....#G',
    ],
  }),
  mapLevel({
    title: 'Mê cung 36 — Vô địch',
    description: 'Thử thách cuối cùng — tổng hợp mọi kỹ năng!',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S........G',
      '.########.',
      '.#......#.',
      '.#.####.#.',
      '.#.#..#.#.',
      '.#.#.##.#.',
      '.#.#....#.',
      '.#.######.',
      '.#........',
      '.#########',
    ],
  }),
];

const ALL_LEVELS: LevelSeed[] = [...LEVELS, ...MAP_LEVELS];

async function run() {
  console.log('🧩 Seeding maze levels...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const classRepo = AppDataSource.getRepository(ClassEntity);
  const courseRepo = AppDataSource.getRepository(Course);
  const classCourseRepo = AppDataSource.getRepository(ClassCourse);
  const levelRepo = AppDataSource.getRepository(MazeLevel);

  // Sanity-check every level is solvable with its intended solution.
  for (const lvl of ALL_LEVELS) {
    const res = simulate(lvl.grid, lvl.intendedSolution);
    if (!res.reachedGoal) {
      throw new Error(`❌ Level "${lvl.title}" không giải được bằng lời giải mẫu (failReason=${res.failReason}).`);
    }
  }
  console.log(`✅ All ${ALL_LEVELS.length} sample solutions verified solvable.`);

  // Find BASIC-A class (optional — created by seed-basic-a).
  const basicA = await classRepo.findOneBy({ code: 'BASIC-A' });
  if (!basicA) {
    console.warn('⚠️ Class BASIC-A not found; levels will be visible to all students instead.');
  }

  // Maze course ("khóa học") grouping the levels.
  let course = await courseRepo.findOneBy({ code: 'MAZE-101' });
  if (!course) {
    course = new Course();
    course.code = 'MAZE-101';
    course.title = 'Lập trình kéo-thả: Mê cung';
    course.description = 'Khóa học làm quen với lập trình bằng cách kéo-thả khối lệnh điều khiển nhân vật đi trong mê cung.';
    course.credits = 1.0;
    course.durationWeeks = 4;
    course.subject = 'Computer Science';
    course.status = PublishStatus.PUBLISHED;
    course.totalPoints = 0;
    course = await courseRepo.save(course);
    console.log('✅ Course MAZE-101 created.');
  }
  course.assignmentCount = ALL_LEVELS.length;
  await courseRepo.save(course);

  // Link course to BASIC-A class if not already linked.
  if (basicA) {
    const existingLink = await classCourseRepo.findOneBy({ classId: basicA.id, courseId: course.id });
    if (!existingLink) {
      const link = new ClassCourse();
      link.classId = basicA.id;
      link.courseId = course.id;
      link.orderIndex = 99;
      link.isRequired = false;
      await classCourseRepo.save(link);
      console.log('✅ Linked MAZE-101 to BASIC-A.');
    }
  }

  // Clean up previously-seeded maze levels (cascades to submissions).
  const titles = ALL_LEVELS.map((l) => l.title);
  await levelRepo.createQueryBuilder().delete().where('title IN (:...titles)', { titles }).execute();

  // Insert levels.
  let order = 1;
  for (const lvl of ALL_LEVELS) {
    const entity = new MazeLevel();
    entity.title = lvl.title;
    entity.description = lvl.description;
    entity.gridConfig = lvl.grid;
    entity.allowedBlocks = lvl.allowedBlocks;
    entity.maxBlocks = lvl.maxBlocks;
    entity.difficulty = lvl.difficulty;
    entity.status = PublishStatus.PUBLISHED;
    entity.courseId = course.id;
    entity.order = order++;
    entity.classIds = lvl.assignToBasicA && basicA ? [basicA.id] : null;
    await levelRepo.save(entity);
  }

  console.log(`🎉 Seeded ${ALL_LEVELS.length} maze levels successfully!`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during maze seed:', err);
  process.exit(1);
});

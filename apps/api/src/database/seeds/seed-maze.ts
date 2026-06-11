import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { MazeLevel } from '../../modules/maze/maze-level.entity';
import { BlockType, Cell, countBlocks, CourseContentKind, Direction, GridConfig, PublishStatus, SensorType, simulate, Command, Expr } from '@cp/shared';
import { ADVANCED_GEN_LEVELS } from './maze-advanced-levels';

/**
 * Seeds maze levels (basic → advanced) under multiple MAZE courses attached to
 * BASIC-A. Idempotent: levels are matched by title and updated in place so
 * student submissions survive reseeds.
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
  /** Override the difficulty-tier block slack (used by twisty mazes to stay fair). */
  blockSlack?: number;
}

interface MazeCourseSpec {
  code: string;
  title: string;
  description: string;
  from: number;
  to: number;
}

const MAZE_COURSE_SPECS: MazeCourseSpec[] = [
  {
    code: 'MAZE-FOUNDATION',
    title: 'Mê cung 1: Nền tảng kéo-thả',
    description: 'Làm quen di chuyển, rẽ hướng, vòng lặp và các bản đồ mê cung nhỏ.',
    from: 1,
    to: 36,
  },
  {
    code: 'MAZE-LAB-01',
    title: 'Mê cung 2: Luyện đường mê cung I',
    description: 'Các mê cung sinh tự động kích thước vừa, tập trung vào quan sát đường đi và tối ưu khối lệnh.',
    from: 37,
    to: 61,
  },
  {
    code: 'MAZE-LAB-02',
    title: 'Mê cung 3: Luyện đường mê cung II',
    description: 'Tăng độ dài đường đi, thêm ngõ cụt và yêu cầu dùng lặp gọn hơn.',
    from: 62,
    to: 86,
  },
  {
    code: 'MAZE-LAB-03',
    title: 'Mê cung 4: Luyện đường mê cung III',
    description: 'Bài luyện nâng độ khó với bản đồ lớn hơn và giới hạn khối chặt hơn.',
    from: 87,
    to: 111,
  },
  {
    code: 'MAZE-LAB-04',
    title: 'Mê cung 5: Mê cung dài và kho báu',
    description: 'Hoàn thiện nhóm mê cung sinh tự động với đường dài, kho báu và nhiều ngõ cụt.',
    from: 112,
    to: 136,
  },
  {
    code: 'MAZE-HARVEST',
    title: 'Mê cung 6: Thu hoạch và vật phẩm',
    description: 'Dùng khối thu thập, cảm biến vật phẩm và chiến lược collect-all.',
    from: 137,
    to: 144,
  },
  {
    code: 'MAZE-MONSTERS',
    title: 'Mê cung 7: Quái vật và canh nhịp',
    description: 'Làm quen quái vật đứng yên, tuần tra, chờ nhịp và né chướng ngại.',
    from: 145,
    to: 168,
  },
  {
    code: 'MAZE-ADVANCED-01',
    title: 'Mê cung 8: Nâng cao I',
    description: 'Kết hợp vật phẩm nhiều loại, quái vật và hộp bí ẩn trong bản đồ nhỏ.',
    from: 169,
    to: 192,
  },
  {
    code: 'MAZE-ADVANCED-02',
    title: 'Mê cung 9: Nâng cao II',
    description: 'Mê cung tổng hợp dài hơn với nhiều mẫu quái vật và lựa chọn đường đi.',
    from: 193,
    to: 220,
  },
  {
    code: 'MAZE-ADVANCED-03',
    title: 'Mê cung 10: Thử thách tổng hợp',
    description: 'Nhóm thử thách cuối, gom các cơ chế khó nhất của lộ trình mê cung.',
    from: 221,
    to: Number.MAX_SAFE_INTEGER,
  },
];

function mazeCourseSpecForOrder(order: number): MazeCourseSpec {
  return MAZE_COURSE_SPECS.find((spec) => order >= spec.from && order <= spec.to) ?? MAZE_COURSE_SPECS[0];
}

const move: Command = { type: BlockType.MOVE_FORWARD };
const left: Command = { type: BlockType.TURN_LEFT };
const right: Command = { type: BlockType.TURN_RIGHT };
const repeat = (times: number, body: Command[]): Command => ({ type: BlockType.REPEAT, times, body });

// Harvest helpers (used by the "Vườn" / collect-all levels).
const pick: Command = { type: BlockType.PICK };
const wait: Command = { type: BlockType.WAIT };
const brk: Command = { type: BlockType.BREAK };
const sense = (s: SensorType): Expr => ({ kind: 'sensor', sensor: s });
const forever = (body: Command[]): Command => ({ type: BlockType.FOREVER, body });
const whileDo = (cond: Expr, body: Command[]): Command => ({ type: BlockType.WHILE, mode: 'while', cond, body });
const ifDo = (cond: Expr, body: Command[], elseBody?: Command[]): Command => ({
  type: BlockType.IF,
  branches: [{ cond, body }],
  ...(elseBody ? { elseBody } : {}),
});

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
  blockSlack?: number;
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
    blockSlack: spec.blockSlack,
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
    title: 'Mê cung 36 — Xoắn ốc vô địch',
    description: 'Thử thách cuối cùng: đi xoắn ốc từ ngoài vào tới ngôi sao ở giữa!',
    difficulty: 'HARD', startDir: E, allowedBlocks: A5,
    map: [
      'S......',
      '######.',
      '.....#.',
      '.#G#.#.',
      '.#...#.',
      '.#####.',
      '.......',
    ],
  }),
];

// ── Levels 37–136: procedurally generated, auto-solved & verified ────────────
// Every generator returns a rectangular, fully-connected ASCII map, so the BFS
// solver in mapLevel() always finds a path and the seed-time simulate() guard
// confirms it. Difficulty AND the allowed-block tier scale with map size, so the
// harder a maze is the more block types it unlocks ("nhiều khối hơn cho bài khó").

type Diff = 'EASY' | 'MEDIUM' | 'HARD';
interface Gen {
  name: string;
  desc: string;
  difficulty: Diff;
  startDir: Direction;
  map: string[];
  blocks: BlockType[];
  blockSlack?: number;
}

const setCh = (row: string, x: number, ch: string): string => row.slice(0, x) + ch + row.slice(x + 1);

// Horizontal boustrophedon ("rắn bò"): even rows are open corridors, odd rows are
// walls with a single gap that flips side each time — forcing a snake path.
// `height` must be odd so the bottom row is a corridor.
function snakeH(width: number, height: number): string[] {
  const rows: string[] = [];
  let connector = 0;
  let lastGapRight = true;
  for (let y = 0; y < height; y++) {
    if (y % 2 === 0) {
      rows.push('.'.repeat(width));
    } else {
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

// Descending staircase: each row opens two overlapping cells, so consecutive
// rows always connect. n rows × (n+1) columns.
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

// Chữ L: open top row + open right column, everything else wall.
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

// Chữ U: open left column + bottom row + right column; S and G sit on top.
function uShape(width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    if (y === height - 1) {
      rows.push('.'.repeat(width));
    } else {
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

// Lược răng: open top & bottom rows joined by the open side columns, with comb
// "teeth" (walls) hanging into the interior on odd columns.
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

// Concentric wall rings inset from an always-open border (a labyrinth you solve
// by hugging the outer wall). n must be odd.
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

// Bàn cờ: pillars on every (even,even) cell. Use an EVEN width so the goal cell
// (width-1,height-1) lands on an odd column and stays open & reachable.
function pillars(width: number, height: number): string[] {
  const g: string[][] = Array.from({ length: height }, () => Array(width).fill('.'));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (x % 2 === 0 && y % 2 === 0 && !(x === 0 && y === 0)) g[y][x] = '#';
  g[0][0] = 'S';
  g[height - 1][width - 1] = 'G';
  return g.map((r) => r.join(''));
}

// Sprinkle collectible gems ('*') onto open corridor cells of an existing map.
function withGems(map: string[], cells: Array<[number, number]>): string[] {
  const g = map.map((r) => r.split(''));
  for (const [x, y] of cells) if (g[y]?.[x] === '.') g[y][x] = '*';
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

// "Perfect maze" over cols×rows cells, rendered to a (2·cols+1)×(2·rows+1) ASCII
// grid. A perfect maze is a spanning tree: exactly ONE path from S to G, with
// every other corridor a dead-end decoy (nhiễu). We grow it with the Growing-Tree
// algorithm picking a RANDOM frontier cell (Prim-like) — that yields short, bushy
// corridors and LOTS of dead-ends, i.e. maximum distraction. `braid` (0..1)
// optionally knocks out dead-ends to add decoy LOOPS — extra distraction without
// ever making the maze unsolvable.
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
    const idx = Math.floor(rand() * active.length); // random frontier cell ⇒ bushy maze
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
    g[2 * cy + 1 + dy][2 * cx + 1 + dx] = '.'; // carve the wall between the two cells
    g[2 * ny + 1][2 * nx + 1] = '.';
    active.push([nx, ny]);
  }

  // Braid: with probability `braid`, open one extra wall out of each dead-end cell.
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

const gens: Gen[] = [];

// ── Phần 1: bài nền tảng (hình khối đơn giản, làm quen thao tác) ────────────

// Đường thẳng — luyện "đi tới" và "lặp lại".
for (const w of [5, 8, 11, 14]) {
  gens.push({
    name: `Đường thẳng ${w} ô`,
    desc: w <= 7 ? 'Đi thẳng một mạch tới ngôi sao.' : 'Quãng đường dài — dùng "lặp lại" cho gọn nhé.',
    difficulty: 'EASY',
    startDir: E,
    map: ['S' + '.'.repeat(w - 2) + 'G'],
    blocks: w <= 7 ? A1 : A2,
  });
}

// Chữ L — một khúc quanh.
for (const [w, h] of [[4, 4], [5, 5], [6, 5], [7, 6]] as Array<[number, number]>) {
  gens.push({
    name: `Chữ L ${w}×${h}`,
    desc: 'Đi hết hàng trên rồi rẽ xuống tới đích.',
    difficulty: 'EASY',
    startDir: E,
    map: lShape(w, h),
    blocks: A1,
  });
}

// Chữ U — đi vòng.
for (const [w, h] of [[4, 4], [5, 5], [6, 6], [7, 6]] as Array<[number, number]>) {
  const hard = h >= 5;
  gens.push({
    name: `Chữ U ${w}×${h}`,
    desc: 'Đi vòng chữ U: xuống, sang ngang rồi lên tới đích.',
    difficulty: hard ? 'MEDIUM' : 'EASY',
    startDir: S,
    map: uShape(w, h),
    blocks: hard ? A3 : A1,
  });
}

// Bậc thang — leo từng bậc.
for (const n of [3, 4, 5, 6]) {
  gens.push({
    name: `Bậc thang ${n}`,
    desc: 'Leo xuống từng bậc một, nhớ quay đúng hướng.',
    difficulty: n >= 6 ? 'MEDIUM' : 'EASY',
    startDir: E,
    map: staircase(n),
    blocks: A2,
  });
}

// ── Phần 2: vài biến thể khái niệm (rắn, lược, bàn cờ, viền) ─────────────────

// Rắn bò — giới thiệu khái niệm đường ngoằn ngoèo.
for (const [w, h] of [[5, 3], [6, 5], [8, 5], [6, 7]] as Array<[number, number]>) {
  const d: Diff = h <= 5 ? 'MEDIUM' : 'HARD';
  gens.push({
    name: `Rắn bò ${w}×${h}`,
    desc: 'Bò theo hình rắn — "lặp lại" giúp viết gọn hơn rất nhiều.',
    difficulty: d,
    startDir: E,
    map: snakeH(w, h),
    blocks: d === 'MEDIUM' ? A3 : A4,
  });
}

// Lược răng — lách qua các răng.
for (const [w, h] of [[6, 4], [8, 5], [7, 5]] as Array<[number, number]>) {
  gens.push({
    name: `Lược răng ${w}×${h}`,
    desc: 'Lách qua các răng lược để tới đích.',
    difficulty: 'MEDIUM',
    startDir: E,
    map: comb(w, h),
    blocks: A3,
  });
}

// Bàn cờ — rừng cột xen kẽ.
for (const [w, h] of [[6, 5], [8, 6], [8, 7]] as Array<[number, number]>) {
  const hard = w >= 8;
  gens.push({
    name: `Bàn cờ ${w}×${h}`,
    desc: 'Lách qua rừng cột xen kẽ như bàn cờ — nhiều ngả khiến em dễ lạc.',
    difficulty: hard ? 'HARD' : 'MEDIUM',
    startDir: E,
    map: pillars(w, h),
    blocks: hard ? A5 : A3,
  });
}

// Mê cung hộp — viền tường đồng tâm.
for (const n of [7, 9, 11, 13]) {
  const hard = n >= 9;
  gens.push({
    name: `Mê cung hộp ${n}×${n}`,
    desc: 'Men theo viền ngoài để vượt qua các lớp tường đồng tâm.',
    difficulty: hard ? 'HARD' : 'MEDIUM',
    startDir: E,
    map: ringBox(n),
    blocks: hard ? A4 : A3,
  });
}

// ── Phần 3: mê cung thật — nhiều ngõ cụt đánh lừa, mỗi bài một bố cục riêng ──
// Mỗi mê cung dùng một hạt giống khác nhau nên KHÔNG bài nào trùng nhau. Đây là
// phần chính tạo độ khó: "perfect maze" chỉ có ĐÚNG MỘT lối tới đích, phần còn
// lại toàn ngõ cụt để đánh lừa. Cỡ lớn về sau còn thêm vòng lặp ("braid") nhiễu.
const mazeSizes: Array<[number, number]> = [
  [3, 3], [4, 3], [4, 4], [5, 4], [5, 5], [6, 5], [6, 6],
  [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [10, 9],
];
const MAZE_TARGET = 100 - gens.length; // lấp phần còn lại cho đủ 100 bài
let mseed = 1;
let made = 0;
let variant = 0;
while (made < MAZE_TARGET) {
  for (const [c, r] of mazeSizes) {
    if (made >= MAZE_TARGET) break;
    const W = 2 * c + 1;
    const H = 2 * r + 1;
    const cells = c * r;
    const diff: Diff = cells <= 12 ? 'MEDIUM' : 'HARD';
    const braid = variant >= 3 && cells >= 36 ? 0.18 : 0; // chỉ vài bản lớn: thêm vòng lặp nhiễu
    let map = perfectMaze(c, r, mseed, braid);
    let name = `Mê lộ ${W}×${H}`;
    let desc = braid > 0
      ? 'Mê cung dày đặc ngõ cụt VÀ có cả vòng lặp đánh lừa — bám đúng một lối tới ngôi sao!'
      : 'Cẩn thận! Rất nhiều ngõ cụt đánh lừa, chỉ một lối đi đúng dẫn tới ngôi sao.';
    let blocks = diff === 'MEDIUM' ? A3 : A5;
    // Một số bài rải ngọc để đa dạng mục tiêu.
    if (variant === 1 && cells >= 16) {
      map = withGems(map, [[3, 1], [1, 3], [W - 2, H - 4], [W - 4, 1]]);
      name = `Kho báu mê lộ ${W}×${H}`;
      desc = 'Len qua mê cung nhiều ngõ cụt và nhặt những viên ngọc 💎 trên đường đúng.';
      blocks = A5;
    }
    gens.push({ name, desc, difficulty: diff, startDir: E, map, blocks, blockSlack: 3 });
    mseed++;
    made++;
  }
  variant++;
}

const GENERATED_LEVELS: LevelSeed[] = gens.slice(0, 100).map((g, i) =>
  mapLevel({
    title: `Mê cung ${37 + i} — ${g.name}`,
    description: g.desc,
    difficulty: g.difficulty,
    startDir: g.startDir,
    map: g.map,
    allowedBlocks: g.blocks,
    blockSlack: g.blockSlack,
  }),
);
if (GENERATED_LEVELS.length !== 100) {
  throw new Error(`Cần đúng 100 bài sinh thêm, nhưng chỉ tạo được ${GENERATED_LEVELS.length}.`);
}

// ── Levels 137–142: harvest gardens (collect-all, code.org "Harvesting") ─────
// These solve by THU HOẠCH (picking) every crop, not by reaching a goal cell.
// They introduce the `pick` block plus the crop sensors (ô này có cây / vườn
// còn cây / vườn đã sạch cây) and build up from manual picking → repeat →
// while → forever+if+break, mirroring the reference screenshots.
const ON = sense(SensorType.ON_ITEM);
const DONE = sense(SensorType.NO_ITEMS_LEFT);
const AHEAD = sense(SensorType.PATH_AHEAD);

const HARVEST_LEVELS: LevelSeed[] = [
  {
    title: 'Mê cung 137 — Vườn thẳng',
    description: 'Đi dọc luống và thu hoạch từng cây. Dùng khối "thu hoạch 🌾" ở mỗi ô có cây!',
    difficulty: 'EASY',
    grid: {
      width: 4, height: 1,
      walls: [],
      start: { x: 0, y: 0 }, startDir: E, goal: { x: 3, y: 0 },
      items: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
      collectAll: true,
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.PICK],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [pick, move, pick, move, pick, move, pick],
  },
  {
    title: 'Mê cung 138 — Vườn dùng vòng lặp',
    description: 'Luống dài hơn — dùng "lặp lại" để thu hoạch cho gọn thay vì lặp tay.',
    difficulty: 'EASY',
    grid: {
      width: 5, height: 1,
      walls: [],
      start: { x: 0, y: 0 }, startDir: E, goal: { x: 4, y: 0 },
      items: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      collectAll: true,
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.PICK, BlockType.REPEAT],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [pick, repeat(4, [move, pick])],
  },
  {
    title: 'Mê cung 139 — Thu hoạch khi còn đường',
    description: 'Dùng "trong khi có đường phía trước": cứ đi tới rồi thu hoạch đến hết luống.',
    difficulty: 'MEDIUM',
    grid: {
      width: 6, height: 1,
      walls: [],
      start: { x: 0, y: 0 }, startDir: E, goal: { x: 5, y: 0 },
      items: [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 })),
      collectAll: true,
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.PICK, BlockType.WHILE, BlockType.CONDITION],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [pick, whileDo(AHEAD, [move, pick])],
  },
  {
    title: 'Mê cung 140 — Vườn thông minh',
    description:
      'Lặp mãi mãi: nếu ô này có cây thì thu hoạch, nếu vườn đã sạch cây thì dừng, ngược lại đi tới.',
    difficulty: 'MEDIUM',
    grid: {
      width: 6, height: 1,
      walls: [],
      start: { x: 0, y: 0 }, startDir: E, goal: { x: 5, y: 0 },
      items: [0, 1, 2, 3, 4, 5].map((x) => ({ x, y: 0 })),
      collectAll: true,
    },
    allowedBlocks: [
      BlockType.MOVE_FORWARD, BlockType.PICK, BlockType.FOREVER,
      BlockType.IF, BlockType.BREAK, BlockType.CONDITION,
    ],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [forever([ifDo(ON, [pick]), ifDo(DONE, [brk]), move])],
  },
  {
    title: 'Mê cung 141 — Vườn chữ L',
    description:
      'Vườn gấp khúc! Lặp mãi mãi: thu hoạch nếu có cây, dừng khi sạch vườn, nếu có đường thì đi tới, không thì quay phải.',
    difficulty: 'HARD',
    grid: {
      width: 4, height: 3,
      walls: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
      ],
      start: { x: 0, y: 0 }, startDir: E, goal: { x: 3, y: 2 },
      items: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
        { x: 3, y: 1 }, { x: 3, y: 2 },
      ],
      collectAll: true,
    },
    allowedBlocks: [
      BlockType.MOVE_FORWARD, BlockType.TURN_RIGHT, BlockType.PICK,
      BlockType.FOREVER, BlockType.IF, BlockType.BREAK, BlockType.CONDITION,
    ],
    maxBlocks: null, assignToBasicA: false, blockSlack: 3,
    intendedSolution: [
      forever([
        ifDo(ON, [pick]),
        ifDo(DONE, [brk]),
        ifDo(AHEAD, [move], [right]),
      ]),
    ],
  },
  {
    title: 'Mê cung 142 — Vườn rắn',
    description:
      'Vườn uốn lượn hai khúc cua. Vẫn một thuật toán: thu hoạch, dừng khi sạch, đi tới khi có đường, quay phải khi gặp tường.',
    difficulty: 'HARD',
    grid: {
      width: 4, height: 3,
      walls: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      start: { x: 0, y: 0 }, startDir: E, goal: { x: 0, y: 2 },
      items: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 },
      ],
      collectAll: true,
    },
    allowedBlocks: [
      BlockType.MOVE_FORWARD, BlockType.TURN_RIGHT, BlockType.PICK,
      BlockType.FOREVER, BlockType.IF, BlockType.BREAK, BlockType.CONDITION,
    ],
    maxBlocks: null, assignToBasicA: false, blockSlack: 3,
    intendedSolution: [
      forever([
        ifDo(ON, [pick]),
        ifDo(DONE, [brk]),
        ifDo(AHEAD, [move], [right]),
      ]),
    ],
  },
];

// ── Levels 143–148: advanced — multi-star collect-all + monsters ─────────────
// New "khó nâng cao" mechanics:
//   • collectAll + itemTheme 'star': WIN by collecting every ⭐ (no goal cell).
//   • a cell listed N times holds N stars (must be picked N times) — see "×N".
//   • monsters: static traps and patrolling hazards; touching one fails the run
//     (failReason 'CAUGHT'). The `wait` block lets the character bide a tick so a
//     patrol passes. Every solution below is BFS-found and engine-verified.
const at = (x: number, y: number): Cell => ({ x, y });
const ADVANCED_LEVELS: LevelSeed[] = [
  {
    title: 'Mê cung 143 — Chùm sao',
    description:
      'Thu thập HẾT các ngôi sao ⭐ thì mới thắng. Một ô có thể chứa nhiều sao (xem ×N) — nhớ "thu thập" đủ số lần ở ô đó!',
    difficulty: 'MEDIUM',
    grid: {
      width: 6, height: 1, walls: [],
      start: at(0, 0), startDir: E, goal: at(5, 0),
      items: [at(0, 0), at(2, 0), at(2, 0), at(2, 0), at(4, 0)],
      collectAll: true, itemTheme: 'star',
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.PICK, BlockType.REPEAT],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [pick, move, move, repeat(3, [pick]), move, move, pick],
  },
  {
    title: 'Mê cung 144 — Hút sạch chùm sao',
    description:
      'Có những ô chứa cả chùm sao. Dùng "trong khi ô này còn sao thì thu thập" để hút sạch một ô trước khi đi tiếp, dừng khi đã thu hết.',
    difficulty: 'MEDIUM',
    grid: {
      width: 5, height: 1, walls: [],
      start: at(0, 0), startDir: E, goal: at(4, 0),
      items: [at(0, 0), at(0, 0), at(2, 0), at(2, 0), at(2, 0), at(4, 0)],
      collectAll: true, itemTheme: 'star',
    },
    allowedBlocks: [
      BlockType.MOVE_FORWARD, BlockType.PICK, BlockType.FOREVER,
      BlockType.WHILE, BlockType.IF, BlockType.BREAK, BlockType.CONDITION,
    ],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [forever([whileDo(ON, [pick]), ifDo(DONE, [brk]), move])],
  },
  {
    title: 'Mê cung 145 — Né quái đứng yên',
    description:
      'Có một con quái vật 👹 chặn giữa đường. Chạm vào nó là thua! Hãy đi vòng để tránh nó rồi tới ngôi sao ⭐.',
    difficulty: 'MEDIUM',
    grid: {
      width: 3, height: 3, walls: [],
      start: at(0, 0), startDir: E, goal: at(2, 2),
      monsters: [{ path: [at(1, 1)] }],
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.TURN_RIGHT],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [move, move, right, move, move],
  },
  {
    title: 'Mê cung 146 — Canh nhịp tuần tra',
    description:
      'Quái vật 👹 tuần tra lên-xuống chắn lối. Dùng khối "đứng yên ⏳" để chờ đúng nhịp cho nó đi qua, rồi mới băng tới đích.',
    difficulty: 'HARD',
    grid: {
      width: 3, height: 2, walls: [],
      start: at(0, 0), startDir: E, goal: at(2, 0),
      monsters: [{ path: [at(1, 1), at(1, 0)], mode: 'loop' }],
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.WAIT],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [wait, move, move],
  },
  {
    title: 'Mê cung 147 — Hai quái canh cửa',
    description:
      'Hai con quái 👹 tuần tra so le nhau. Canh đúng nhịp: đứng yên chờ một con đi qua rồi băng một mạch qua khe trống tới đích.',
    difficulty: 'HARD',
    grid: {
      width: 4, height: 2, walls: [],
      start: at(0, 0), startDir: E, goal: at(3, 0),
      monsters: [
        { path: [at(1, 1), at(1, 0)], mode: 'loop' },
        { path: [at(2, 0), at(2, 1)], mode: 'loop' },
      ],
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.WAIT],
    maxBlocks: null, assignToBasicA: false, blockSlack: 2,
    intendedSolution: [wait, move, move, move],
  },
  {
    title: 'Mê cung 148 — Kho sao có quái',
    description:
      'Thử thách tổng hợp: thu thập HẾT ngôi sao ⭐ (có ô chứa 2 sao) trong khi né hai con quái vật 👹 đứng canh. Lập kế hoạch đường đi thật cẩn thận!',
    difficulty: 'HARD',
    grid: {
      width: 5, height: 3, walls: [],
      start: at(0, 0), startDir: E, goal: at(4, 2),
      items: [at(4, 0), at(4, 0), at(0, 2), at(2, 2)],
      collectAll: true, itemTheme: 'star',
      monsters: [{ path: [at(2, 1)] }, { path: [at(1, 1)] }],
    },
    allowedBlocks: [
      BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT,
      BlockType.PICK, BlockType.REPEAT,
    ],
    maxBlocks: null, assignToBasicA: false, blockSlack: 3,
    intendedSolution: [
      right, move, move, left, pick, move, move, pick,
      move, move, left, move, move, pick, pick,
    ],
  },
];

// ── Levels 149–248: procedurally generated advanced levels ───────────────────
// Built offline by tmp-gen-maze.ts: mixed item types, every monster skill
// (patrol/static/chaser/guard/sleeper) and mystery boxes. Each intendedSolution
// was BFS-found and engine-verified at generation time, then re-checked here.
const ADVANCED_GENERATED_LEVELS: LevelSeed[] = ADVANCED_GEN_LEVELS.map((g) => ({
  title: g.title,
  description: g.description,
  difficulty: g.difficulty,
  grid: g.grid,
  allowedBlocks: g.allowedBlocks,
  maxBlocks: null,
  assignToBasicA: false,
  intendedSolution: g.intendedSolution,
  blockSlack: g.blockSlack,
}));

export const ALL_LEVELS: LevelSeed[] = [
  ...LEVELS,
  ...MAP_LEVELS,
  ...GENERATED_LEVELS,
  ...HARVEST_LEVELS,
  ...ADVANCED_LEVELS,
  ...ADVANCED_GENERATED_LEVELS,
];

// ── Difficulty: tighten the block budget on every level ─────────────────────
// A maxBlocks limit forces students toward loops instead of repeating moves by
// hand. We compute the budget from a COMPACT solution (run-length-encode straight
// runs into `repeat`), then add a little slack by tier so the level stays fair.

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
    // Compress only runs of ≥3 (a 2-run is the same cost as a repeat block).
    if (run >= 3 && PRIMITIVE.has(head.type)) {
      out.push(repeat(run, [head]));
    } else {
      for (let k = 0; k < run; k++) out.push(head);
    }
    i = j;
  }
  return out;
}

/** Replace each level's solution with its compact form and set a tight maxBlocks. */
function applyBlockLimits(levels: LevelSeed[]): void {
  for (const lvl of levels) {
    // Respect an explicitly hand-tuned tiny limit (e.g. the "must use loop" level 5).
    const allowRepeat = lvl.allowedBlocks.includes(BlockType.REPEAT);
    const compact = compress(lvl.intendedSolution, allowRepeat);
    const base = countBlocks(compact);
    const limit = base + (lvl.blockSlack ?? SLACK[lvl.difficulty]);
    // Never loosen an existing tighter limit.
    lvl.maxBlocks = lvl.maxBlocks != null ? Math.min(lvl.maxBlocks, limit) : limit;
    lvl.intendedSolution = compact;
    if (countBlocks(compact) > (lvl.maxBlocks ?? Infinity)) {
      throw new Error(`Level "${lvl.title}" không có lời giải vừa giới hạn ${lvl.maxBlocks} khối`);
    }
  }
}

applyBlockLimits(ALL_LEVELS);

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

  const legacyCourse = await courseRepo.findOneBy({ code: 'MAZE-101' });
  if (legacyCourse) {
    legacyCourse.status = PublishStatus.ARCHIVED;
    legacyCourse.assignmentCount = 0;
    legacyCourse.totalPoints = 0;
    legacyCourse.contentKind = CourseContentKind.MAZE;
    await courseRepo.save(legacyCourse);
    if (basicA) {
      await classCourseRepo.delete({ classId: basicA.id, courseId: legacyCourse.id });
    }
  }

  // Idempotent upsert keyed by title. We UPDATE existing rows in place so their
  // primary key (and therefore every student submission, which references it via
  // an ON DELETE CASCADE FK) is preserved across reseeds. Only levels that have
  // disappeared from the seed set are deleted. Titles are unique by construction
  // ("Mê cung N — …"), so they act as a stable natural key.
  //
  // ⚠️ Renaming a level's title still drops that one level's submissions (the old
  // title is treated as "removed"). Keep titles stable to keep progress.
  const existingLevels = await levelRepo
    .createQueryBuilder('l')
    .where("l.title LIKE 'Mê cung %'")
    .getMany();
  const existingByTitle = new Map(existingLevels.map((l) => [l.title, l]));

  let order = 1;
  const seededTitles = new Set<string>();
  const courseCounts = new Map<string, number>();
  let created = 0;
  let updated = 0;
  for (const lvl of ALL_LEVELS) {
    const levelOrder = order++;
    const courseSpec = mazeCourseSpecForOrder(levelOrder);
    const course = coursesByCode.get(courseSpec.code);
    if (!course) throw new Error(`Không tìm thấy course seed ${courseSpec.code}`);

    seededTitles.add(lvl.title);
    const existing = existingByTitle.get(lvl.title);
    const entity = existing ?? new MazeLevel();
    entity.title = lvl.title;
    entity.description = lvl.description;
    entity.gridConfig = lvl.grid;
    entity.allowedBlocks = lvl.allowedBlocks;
    entity.maxBlocks = lvl.maxBlocks;
    entity.difficulty = lvl.difficulty;
    entity.status = PublishStatus.PUBLISHED;
    entity.courseId = course.id;
    entity.order = levelOrder;
    entity.classIds = lvl.assignToBasicA && basicA ? [basicA.id] : null;
    await levelRepo.save(entity); // existing → UPDATE (same id), new → INSERT
    courseCounts.set(course.id, (courseCounts.get(course.id) ?? 0) + 1);
    if (existing) updated++;
    else created++;
  }

  for (const course of coursesByCode.values()) {
    course.assignmentCount = courseCounts.get(course.id) ?? 0;
    course.totalPoints = 0;
    await courseRepo.save(course);
  }

  // Remove only levels that no longer exist in the seed (cascades just THEIR
  // submissions, not everyone's).
  const obsolete = existingLevels.filter((l) => !seededTitles.has(l.title));
  if (obsolete.length) {
    await levelRepo.remove(obsolete);
  }

  console.log(
    `🎉 Maze levels synced: ${created} created, ${updated} updated, ${obsolete.length} removed ` +
      `(student progress preserved).`,
  );
  await AppDataSource.destroy();
}

if (require.main === module) {
  run().catch((err) => {
    console.error('❌ Error during maze seed:', err);
    process.exit(1);
  });
}

/**
 * Maze domain types — shared between the web client (animation) and the API
 * (authoritative grading). Pure TypeScript, ZERO runtime dependencies so both
 * `apps/api` (Node) and `apps/web` (browser) can import it.
 *
 * Blockly itself MUST NOT be imported here — the client parses Blockly blocks
 * into the typed `Command` / `Expr` AST below, and the engine interprets that
 * AST. No arbitrary JavaScript is ever evaluated.
 */

/** Cardinal direction the character is facing. Values are clockwise from north. */
export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

/** A grid coordinate. Origin (0,0) is the top-left cell; x grows right, y grows down. */
export interface Cell {
  x: number;
  y: number;
}

/**
 * How a monster traverses its `path`:
 * - `loop`:     …→ last → first → last … (teleports back to the start cell).
 * - `pingpong`: …→ last → … → first → … (walks back and forth). Default.
 * Ignored when a monster's `path` has a single cell (a static monster).
 */
export type MonsterMode = 'loop' | 'pingpong';

/**
 * Monster behaviour ("kĩ năng"):
 * - `static`:  never leaves `path[0]`.
 * - `patrol`:  cycles through `path` purely by tick (mode loop/pingpong).
 * - `chaser`:  steps toward the character (greedy, reducing Manhattan distance),
 *              moving once every `speed` ticks (default 2 = half speed) so it can
 *              be outrun/shaken with `wait` and detours. Starts at `path[0]`.
 * - `guard`:   sits at `path[0]` until the character enters its row/column with a
 *              clear line of sight, then dashes one cell toward them each tick.
 * - `sleeper`: alternates `sleep` harmless+frozen ticks and `awake` lethal ticks
 *              (defaults 2/2); while awake it patrols `path`. Harmless & passable
 *              while asleep — sensors and collisions ignore it then.
 * Defaults to `patrol` when `path.length > 1`, else `static`.
 */
export type MonsterKind = 'static' | 'patrol' | 'chaser' | 'guard' | 'sleeper';

/**
 * A roaming hazard. Touching a LETHAL monster (sharing its cell, or swapping
 * cells head-on with it) ends the run with `failReason === 'CAUGHT'`.
 *
 * `path` is: the single home cell (static/chaser/guard spawn) or the patrol route
 * (patrol/sleeper). One tick passes per visible character action.
 */
export interface Monster {
  path: Cell[];
  kind?: MonsterKind;
  /** Patrol traversal (patrol & awake sleeper). Defaults to `pingpong`. */
  mode?: MonsterMode;
  /** chaser/guard: move once every N ticks (default 2). Higher = slower. */
  speed?: number;
  /** sleeper: harmless+frozen ticks per cycle (default 2). */
  sleep?: number;
  /** sleeper: lethal+patrolling ticks per cycle (default 2). */
  awake?: number;
}

/** A per-frame snapshot of a monster, for rendering (carries skin + asleep state). */
export interface MonsterView {
  x: number;
  y: number;
  kind: MonsterKind;
  /** True when a sleeper is currently asleep (harmless — render differently). */
  asleep?: boolean;
}

/** A hidden "?" cell holding a fixed but concealed reward or hazard. */
export interface MysteryBox {
  x: number;
  y: number;
  /** `treasure` opens safely (counts toward collect-all); `monster` ends the run. */
  content: 'treasure' | 'monster';
}

/** Visual skin for collectible `items`. Defaults: `crop` in harvest mode, else `gem`. */
export type ItemTheme = 'star' | 'gem' | 'crop' | 'coin' | 'fruit' | 'key';

/** Static definition of a maze level's playfield. Stored as JSONB on MazeLevel. */
export interface GridConfig {
  width: number;
  height: number;
  /** Cells that block movement. */
  walls: Cell[];
  /** Character's starting cell. */
  start: Cell;
  /** Character's starting facing direction. */
  startDir: Direction;
  /** Cell the character must reach to solve the level. */
  goal: Cell;
  /**
   * Optional collectible / sensable item cells ("vật phẩm" / ngôi sao / cây).
   * A cell listed N times holds N items and must be picked N times — this is how
   * "một ô chứa nhiều ngôi sao" is encoded (duplicate coordinates = quantity).
   */
  items?: Cell[];
  /**
   * Collect-all mode: the level is solved when EVERY item has been picked (via
   * the `pick` block), regardless of the character's final cell. When
   * omitted/false the level is solved by reaching `goal` (classic maze). The
   * `goal` field is still required for typing but is ignored for the win check
   * in this mode.
   */
  collectAll?: boolean;
  /** Default visual skin for items (does not affect grading). */
  itemTheme?: ItemTheme;
  /**
   * Per-cell visual override, keyed by "x,y" → theme. Lets ONE level mix item
   * types (sao ⭐ / ngọc 💎 / vàng 🪙 …). Purely cosmetic — every item still
   * counts the same toward collect-all. Cells not listed fall back to itemTheme.
   */
  itemKindAt?: Record<string, ItemTheme>;
  /** Roaming hazards. Touching a lethal one ends the run (`failReason === 'CAUGHT'`). */
  monsters?: Monster[];
  /**
   * Hidden "?" cells. Stepping onto one opens it: a `treasure` box is collected
   * (counts toward collect-all), a `monster` box ends the run. The `box_ahead`
   * and `box_ahead_safe` sensors let the character decide before opening.
   */
  boxes?: MysteryBox[];
}

/**
 * Capability identifiers used in a level's `allowedBlocks`. Each maps to one or
 * more Blockly blocks in the toolbox. The first four are backward-compatible
 * with levels seeded before the language was expanded.
 */
export enum BlockType {
  MOVE_FORWARD = 'move_forward',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  PICK = 'pick', // thu hoạch: nhặt cây/vật phẩm/ngôi sao ở ô hiện tại
  WAIT = 'wait', // đứng yên một nhịp (để quái vật đi qua)
  REPEAT = 'repeat', // lặp lại N lần
  FOREVER = 'forever', // lặp mãi mãi
  WHILE = 'while', // trong khi / lặp cho đến khi
  IF = 'if', // nếu / nếu...ngược lại
  BREAK = 'break', // dừng vòng lặp
  CONDITION = 'condition', // cảm biến mê cung
  LOGIC = 'logic', // và / hoặc / không / so sánh
  MATH = 'math', // + - * / %
  VARIABLE = 'variable', // tạo/đặt/đổi/lấy biến
}

/** Maze sensors — boolean readings of the world relative to the character. */
export enum SensorType {
  PATH_AHEAD = 'path_ahead',
  PATH_LEFT = 'path_left',
  PATH_RIGHT = 'path_right',
  WALL_AHEAD = 'wall_ahead',
  WALL_LEFT = 'wall_left',
  WALL_RIGHT = 'wall_right',
  AT_GOAL = 'at_goal',
  NOT_AT_GOAL = 'not_at_goal',
  ON_ITEM = 'on_item', // ô hiện tại còn cây/vật phẩm/ngôi sao để thu hoạch
  ITEMS_LEFT = 'items_left', // vẫn còn vật phẩm ở đâu đó trên bản đồ
  NO_ITEMS_LEFT = 'no_items_left', // đã thu thập sạch mọi vật phẩm
  MONSTER_AHEAD = 'monster_ahead', // ô ngay phía trước đang có quái vật nguy hiểm
  MONSTER_LEFT = 'monster_left', // ô bên trái đang có quái vật nguy hiểm
  MONSTER_RIGHT = 'monster_right', // ô bên phải đang có quái vật nguy hiểm
  BOX_AHEAD = 'box_ahead', // ô ngay phía trước có hộp bí ẩn chưa mở
  BOX_AHEAD_SAFE = 'box_ahead_safe', // hộp bí ẩn phía trước là báu vật (an toàn để mở)
}

// ── Expression AST (evaluates to a number or boolean) ──────────────────────

export type ArithOp = 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'pow';
export type CompareOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';
export type LogicOp = 'and' | 'or';

export interface ExprMeta {
  /** Blockly block id, used by the student UI to highlight evaluated expressions. */
  blockId?: string;
}

export type Expr =
  | ({ kind: 'num'; value: number } & ExprMeta)
  | ({ kind: 'bool'; value: boolean } & ExprMeta)
  | ({ kind: 'var'; name: string } & ExprMeta)
  | ({ kind: 'sensor'; sensor: SensorType } & ExprMeta)
  | ({ kind: 'arith'; op: ArithOp; a: Expr; b: Expr } & ExprMeta)
  | ({ kind: 'compare'; op: CompareOp; a: Expr; b: Expr } & ExprMeta)
  | ({ kind: 'logic'; op: LogicOp; a: Expr; b: Expr } & ExprMeta)
  | ({ kind: 'not'; a: Expr } & ExprMeta);

// ── Statement AST ───────────────────────────────────────────────────────────

export interface CommandMeta {
  /** Blockly block id, used by the student UI to highlight the executing block. */
  blockId?: string;
}

export interface MoveForwardCmd extends CommandMeta {
  type: BlockType.MOVE_FORWARD;
}
export interface TurnLeftCmd extends CommandMeta {
  type: BlockType.TURN_LEFT;
}
export interface TurnRightCmd extends CommandMeta {
  type: BlockType.TURN_RIGHT;
}
export interface PickCmd extends CommandMeta {
  type: BlockType.PICK;
}
export interface WaitCmd extends CommandMeta {
  type: BlockType.WAIT;
}
export interface RepeatCmd extends CommandMeta {
  type: BlockType.REPEAT;
  /** Number of iterations. Number for back-compat; Expr when driven by a variable/math. */
  times: number | Expr;
  body: Command[];
}
export interface ForeverCmd extends CommandMeta {
  type: BlockType.FOREVER;
  body: Command[];
}
export interface WhileCmd extends CommandMeta {
  type: BlockType.WHILE;
  /** 'while' runs while cond is true; 'until' runs until cond becomes true. */
  mode: 'while' | 'until';
  cond: Expr;
  body: Command[];
}
export interface IfCmd extends CommandMeta {
  type: BlockType.IF;
  /** if / else-if chain, evaluated in order. */
  branches: { cond: Expr; body: Command[] }[];
  elseBody?: Command[];
}
export interface BreakCmd extends CommandMeta {
  type: BlockType.BREAK;
}
export interface VarSetCmd extends CommandMeta {
  type: 'var_set';
  name: string;
  value: Expr;
}
export interface VarChangeCmd extends CommandMeta {
  type: 'var_change';
  name: string;
  delta: Expr;
}

export type Command =
  | MoveForwardCmd
  | TurnLeftCmd
  | TurnRightCmd
  | PickCmd
  | WaitCmd
  | RepeatCmd
  | ForeverCmd
  | WhileCmd
  | IfCmd
  | BreakCmd
  | VarSetCmd
  | VarChangeCmd;

// ── Simulation output ───────────────────────────────────────────────────────

/** Why a simulation stopped before reaching the goal. `null` = ran to completion. */
export type SimFailReason =
  | 'OUT_OF_BOUNDS'
  | 'HIT_WALL'
  | 'CAUGHT' // ran into a monster
  | 'STEP_LIMIT'
  | 'RUNTIME_ERROR'
  | null;

/** One primitive action of a simulation, used to drive the step-by-step animation. */
export interface SimStep {
  index: number;
  /** Character position AFTER applying this step. */
  pos: Cell;
  /** Character facing direction AFTER applying this step. */
  dir: Direction;
  action: 'move' | 'turnLeft' | 'turnRight' | 'pick' | 'wait';
  /** Blockly block id that produced this visible step, when available. */
  blockId?: string;
  /** True when a `move` was blocked (wall / out of bounds) or a monster caught the character. */
  crashed?: boolean;
  /** Snapshot of variable values after this step, for the watcher panel. */
  vars?: Record<string, number>;
  /**
   * Items still on the board after this step. A cell is listed once per remaining
   * item, so duplicate coordinates encode the remaining quantity in that cell.
   */
  itemsLeft?: Cell[];
  /** Monster snapshots after this step, for the animation (skin + asleep state). */
  monsters?: MonsterView[];
  /** Unopened mystery-box positions after this step (content stays hidden). */
  boxes?: Cell[];
}

/** One UI execution frame, used to highlight executed Blockly blocks. */
export interface SimTraceEvent {
  index: number;
  /** Character position at this point in execution. */
  pos: Cell;
  /** Character facing direction at this point in execution. */
  dir: Direction;
  /** Blockly block id for the node currently being executed/evaluated. */
  blockId?: string;
  /** True when this frame represents a blocked move. */
  crashed?: boolean;
  /** Snapshot of variable values at this point. */
  vars?: Record<string, number>;
  /** Items still on the board at this point (one entry per remaining item). */
  itemsLeft?: Cell[];
  /** Monster snapshots at this point (skin + asleep state). */
  monsters?: MonsterView[];
  /** Unopened mystery-box positions at this point. */
  boxes?: Cell[];
}

export interface SimulationResult {
  reachedGoal: boolean;
  steps: SimStep[];
  /** UI execution trace; includes non-movement blocks and evaluated expressions. */
  trace: SimTraceEvent[];
  /** Total statement node count (loops count as 1 + their body, recursively). */
  blocksUsed: number;
  failReason: SimFailReason;
  finalPos: Cell;
  finalDir: Direction;
  /** Final variable values. */
  vars: Record<string, number>;
}

/** Result of validating a command tree against a level's constraints. */
export interface ValidationResult {
  ok: boolean;
  /** Vietnamese, student-friendly error messages. Empty when `ok`. */
  errors: string[];
}

/** Body of `POST /api/maze-levels/submit`. */
export interface ISubmitMazePayload {
  levelId: string;
  /** Blockly workspace serialized to XML, kept for replay/audit. */
  workspaceXml: string;
  /** The parsed command tree the server actually grades. */
  commandTree: Command[];
}

/** A maze level as returned by the API. */
export interface IMazeLevel {
  id: string;
  title: string;
  description: string;
  gridConfig: GridConfig;
  allowedBlocks: BlockType[];
  maxBlocks: number | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  courseId: string | null;
  courseCode?: string | null;
  courseTitle?: string | null;
  courseDescription?: string | null;
  order: number;
  classIds: string[] | null;
  createdAt: string;
  updatedAt: string;
  /** Student-facing progress fields, present on `/maze-levels/me/assigned`. */
  solved?: boolean;
  attempts?: number;
  bestBlocks?: number | null;
}

export interface IMazeCourseGroup {
  courseId: string | null;
  courseCode: string | null;
  courseTitle: string;
  courseDescription: string | null;
  order: number;
  totalCount: number;
  solvedCount: number;
  attemptedCount: number;
  nextLevel: IMazeLevel | null;
  levels: IMazeLevel[];
}

export interface IStudentMazePath {
  totalCount: number;
  solvedCount: number;
  attemptedCount: number;
  nextLevel: IMazeLevel | null;
  courses: IMazeCourseGroup[];
}

/** Body for creating/updating a level from the admin builder. */
export interface ICreateMazeLevelPayload {
  title: string;
  description?: string;
  gridConfig: GridConfig;
  allowedBlocks?: BlockType[];
  maxBlocks?: number | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status?: string;
  courseId?: string | null;
  order?: number;
  classIds?: string[];
}

/** Response of `POST /api/maze-levels/submit`. */
export interface IMazeSubmitResult {
  submission: {
    id: string;
    status: string;
    reachedGoal: boolean;
    blocksUsed: number;
    stepsCount: number;
    failReason: SimFailReason;
  };
  reachedGoal: boolean;
  failReason?: SimFailReason;
  errors: string[];
}

/** Row of the per-level progress table. */
export interface IMazeProgressRow {
  userId: string;
  studentName: string;
  solved: boolean;
  attempts: number;
  bestBlocks: number | null;
}

/** Row of the dashboard summary (one per level). */
export interface IMazeProgressSummaryRow {
  levelId: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  attemptedCount: number;
  solvedCount: number;
}

/** Records the most visible/visited variables produced during a run. */
export const MAZE_STEP_LIMIT = 1000;
/** Hard cap on total interpreter operations — protects forever/while from hanging. */
export const MAZE_OP_LIMIT = 200_000;
/** Max iterations allowed on a single `repeat N` block. */
export const MAZE_MAX_REPEAT = 1000;
/** Max nesting depth of control blocks. */
export const MAZE_MAX_DEPTH = 8;

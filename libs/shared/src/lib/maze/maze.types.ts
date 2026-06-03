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
  /** Optional collectible / sensable item cells ("vật phẩm"). */
  items?: Cell[];
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
  ON_ITEM = 'on_item',
}

// ── Expression AST (evaluates to a number or boolean) ──────────────────────

export type ArithOp = 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'pow';
export type CompareOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';
export type LogicOp = 'and' | 'or';

export type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'var'; name: string }
  | { kind: 'sensor'; sensor: SensorType }
  | { kind: 'arith'; op: ArithOp; a: Expr; b: Expr }
  | { kind: 'compare'; op: CompareOp; a: Expr; b: Expr }
  | { kind: 'logic'; op: LogicOp; a: Expr; b: Expr }
  | { kind: 'not'; a: Expr };

// ── Statement AST ───────────────────────────────────────────────────────────

export interface MoveForwardCmd {
  type: BlockType.MOVE_FORWARD;
}
export interface TurnLeftCmd {
  type: BlockType.TURN_LEFT;
}
export interface TurnRightCmd {
  type: BlockType.TURN_RIGHT;
}
export interface RepeatCmd {
  type: BlockType.REPEAT;
  /** Number of iterations. Number for back-compat; Expr when driven by a variable/math. */
  times: number | Expr;
  body: Command[];
}
export interface ForeverCmd {
  type: BlockType.FOREVER;
  body: Command[];
}
export interface WhileCmd {
  type: BlockType.WHILE;
  /** 'while' runs while cond is true; 'until' runs until cond becomes true. */
  mode: 'while' | 'until';
  cond: Expr;
  body: Command[];
}
export interface IfCmd {
  type: BlockType.IF;
  /** if / else-if chain, evaluated in order. */
  branches: { cond: Expr; body: Command[] }[];
  elseBody?: Command[];
}
export interface BreakCmd {
  type: BlockType.BREAK;
}
export interface VarSetCmd {
  type: 'var_set';
  name: string;
  value: Expr;
}
export interface VarChangeCmd {
  type: 'var_change';
  name: string;
  delta: Expr;
}

export type Command =
  | MoveForwardCmd
  | TurnLeftCmd
  | TurnRightCmd
  | RepeatCmd
  | ForeverCmd
  | WhileCmd
  | IfCmd
  | BreakCmd
  | VarSetCmd
  | VarChangeCmd;

// ── Simulation output ───────────────────────────────────────────────────────

/** Why a simulation stopped before reaching the goal. `null` = ran to completion. */
export type SimFailReason = 'OUT_OF_BOUNDS' | 'HIT_WALL' | 'STEP_LIMIT' | 'RUNTIME_ERROR' | null;

/** One primitive action of a simulation, used to drive the step-by-step animation. */
export interface SimStep {
  index: number;
  /** Character position AFTER applying this step. */
  pos: Cell;
  /** Character facing direction AFTER applying this step. */
  dir: Direction;
  action: 'move' | 'turnLeft' | 'turnRight';
  /** True when a `move` was blocked (wall / out of bounds); pos stays put. */
  crashed?: boolean;
  /** Snapshot of variable values after this step, for the watcher panel. */
  vars?: Record<string, number>;
  /** Items still on the board after this step. */
  itemsLeft?: Cell[];
}

export interface SimulationResult {
  reachedGoal: boolean;
  steps: SimStep[];
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
  order: number;
  classIds: string[] | null;
  createdAt: string;
  updatedAt: string;
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

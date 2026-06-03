/**
 * Maze domain types — shared between the web client (animation) and the API
 * (authoritative grading). This file is pure TypeScript with ZERO runtime
 * dependencies so both `apps/api` (Node) and `apps/web` (browser) can import it.
 *
 * Blockly itself MUST NOT be imported here — the client parses Blockly blocks
 * into the typed `Command` AST below, and the engine interprets that AST. No
 * arbitrary JavaScript is ever evaluated.
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
}

/** The four block kinds available in the MVP toolbox. */
export enum BlockType {
  MOVE_FORWARD = 'move_forward',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  REPEAT = 'repeat',
}

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
  /** How many times to run `body`. Bounded by the validator to [1, 100]. */
  times: number;
  body: Command[];
}

/** A node in the command tree parsed from the Blockly workspace. */
export type Command = MoveForwardCmd | TurnLeftCmd | TurnRightCmd | RepeatCmd;

/** Why a simulation stopped before reaching the goal. `null` = ran to completion. */
export type SimFailReason = 'OUT_OF_BOUNDS' | 'HIT_WALL' | 'STEP_LIMIT' | null;

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
}

/** Result of running a command tree against a grid. */
export interface SimulationResult {
  reachedGoal: boolean;
  steps: SimStep[];
  /** Total AST node count (repeat counts as 1 + its body, recursively). */
  blocksUsed: number;
  failReason: SimFailReason;
  finalPos: Cell;
  finalDir: Direction;
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

/** Hard cap on primitive actions so a `repeat` can never run forever. */
export const MAZE_STEP_LIMIT = 1000;
/** Max iterations allowed on a single `repeat` block. */
export const MAZE_MAX_REPEAT = 100;
/** Max nesting depth of `repeat` blocks. */
export const MAZE_MAX_DEPTH = 5;

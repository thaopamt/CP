/**
 * Pure maze interpreter. Walks a `Command` AST over a `GridConfig` and produces
 * a deterministic `SimulationResult`. No DOM, no Blockly, no `eval` — the same
 * function runs in the browser (to animate) and on the server (to grade), so
 * results are guaranteed identical for the same input.
 *
 * Supports actions (move/turn), counted/conditional/infinite loops, break,
 * if / else-if / else, maze sensors, logic + arithmetic expressions, and
 * variables. A global operation budget guarantees termination even for
 * `forever` / `while` loops.
 */

import {
  BlockType,
  Cell,
  Command,
  Direction,
  Expr,
  GridConfig,
  MAZE_OP_LIMIT,
  SensorType,
  SimStep,
  SimulationResult,
} from './maze.types';

/** Unit vector for moving one cell in the given direction (y grows downward). */
export function directionVector(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case Direction.NORTH:
      return { dx: 0, dy: -1 };
    case Direction.EAST:
      return { dx: 1, dy: 0 };
    case Direction.SOUTH:
      return { dx: 0, dy: 1 };
    case Direction.WEST:
      return { dx: -1, dy: 0 };
  }
}

/** Rotate a direction 90° left or right. */
export function rotate(dir: Direction, turn: 'left' | 'right'): Direction {
  const delta = turn === 'right' ? 1 : 3; // +3 ≡ -1 (mod 4)
  return ((dir + delta) % 4) as Direction;
}

/** Total statement-node count. A loop/if counts as 1 node plus its body, recursively. */
export function countBlocks(commands: Command[]): number {
  let total = 0;
  for (const cmd of commands) {
    total += 1;
    switch (cmd.type) {
      case BlockType.REPEAT:
      case BlockType.FOREVER:
      case BlockType.WHILE:
        total += countBlocks(cmd.body);
        break;
      case BlockType.IF:
        for (const br of cmd.branches) total += countBlocks(br.body);
        if (cmd.elseBody) total += countBlocks(cmd.elseBody);
        break;
      default:
        break;
    }
  }
  return total;
}

const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;
const key = (c: Cell) => `${c.x},${c.y}`;

/** Internal control-flow signal returned by statement execution. */
type Signal = 'ok' | 'abort' | 'break';

export function simulate(
  grid: GridConfig,
  commands: Command[],
  opts?: { opLimit?: number },
): SimulationResult {
  const opLimit = opts?.opLimit ?? MAZE_OP_LIMIT;
  const wallSet = new Set((grid.walls ?? []).map(key));
  const itemSet = new Set((grid.items ?? []).map(key));
  const steps: SimStep[] = [];
  const vars: Record<string, number> = {};

  let pos: Cell = { ...grid.start };
  let dir: Direction = grid.startDir;
  let ops = 0;
  let failReason: SimulationResult['failReason'] = null;

  const inBounds = (c: Cell): boolean =>
    c.x >= 0 && c.x < grid.width && c.y >= 0 && c.y < grid.height;

  const cellAhead = (facing: Direction): Cell => {
    const { dx, dy } = directionVector(facing);
    return { x: pos.x + dx, y: pos.y + dy };
  };

  const isOpen = (c: Cell): boolean => inBounds(c) && !wallSet.has(key(c));

  /** Charge one interpreter operation; returns false when the budget is spent. */
  const charge = (): boolean => {
    ops += 1;
    if (ops > opLimit) {
      failReason = 'STEP_LIMIT';
      return false;
    }
    return true;
  };

  const snapshotVars = (): Record<string, number> => ({ ...vars });
  const itemsLeft = (): Cell[] => Array.from(itemSet).map((k) => {
    const [x, y] = k.split(',').map(Number);
    return { x, y };
  });

  const pushStep = (action: SimStep['action'], crashed?: boolean) => {
    steps.push({
      index: steps.length,
      pos: { ...pos },
      dir,
      action,
      ...(crashed ? { crashed: true } : {}),
      vars: snapshotVars(),
      itemsLeft: itemsLeft(),
    });
  };

  // ── Expression evaluation ────────────────────────────────────────────────

  const sensor = (s: SensorType): boolean => {
    switch (s) {
      case SensorType.PATH_AHEAD:
        return isOpen(cellAhead(dir));
      case SensorType.PATH_LEFT:
        return isOpen(cellAhead(rotate(dir, 'left')));
      case SensorType.PATH_RIGHT:
        return isOpen(cellAhead(rotate(dir, 'right')));
      case SensorType.WALL_AHEAD:
        return !isOpen(cellAhead(dir));
      case SensorType.WALL_LEFT:
        return !isOpen(cellAhead(rotate(dir, 'left')));
      case SensorType.WALL_RIGHT:
        return !isOpen(cellAhead(rotate(dir, 'right')));
      case SensorType.AT_GOAL:
        return sameCell(pos, grid.goal);
      case SensorType.NOT_AT_GOAL:
        return !sameCell(pos, grid.goal);
      case SensorType.ON_ITEM:
        return itemSet.has(key(pos));
    }
  };

  const evalExpr = (e: Expr): number | boolean => {
    switch (e.kind) {
      case 'num':
        return e.value;
      case 'bool':
        return e.value;
      case 'var':
        return vars[e.name] ?? 0;
      case 'sensor':
        return sensor(e.sensor);
      case 'not':
        return !truthy(evalExpr(e.a));
      case 'logic': {
        // Short-circuit.
        const a = truthy(evalExpr(e.a));
        if (e.op === 'and') return a ? truthy(evalExpr(e.b)) : false;
        return a ? true : truthy(evalExpr(e.b));
      }
      case 'compare': {
        const a = num(evalExpr(e.a));
        const b = num(evalExpr(e.b));
        switch (e.op) {
          case 'eq':
            return a === b;
          case 'neq':
            return a !== b;
          case 'lt':
            return a < b;
          case 'lte':
            return a <= b;
          case 'gt':
            return a > b;
          case 'gte':
            return a >= b;
        }
        break;
      }
      case 'arith': {
        const a = num(evalExpr(e.a));
        const b = num(evalExpr(e.b));
        switch (e.op) {
          case 'add':
            return a + b;
          case 'sub':
            return a - b;
          case 'mul':
            return a * b;
          case 'div':
            return b === 0 ? 0 : a / b;
          case 'mod':
            return b === 0 ? 0 : a % b;
          case 'pow':
            return Math.pow(a, b);
        }
      }
    }
    return 0;
  };

  const evalBool = (e: Expr): boolean => truthy(evalExpr(e));
  const evalNum = (e: number | Expr): number =>
    typeof e === 'number' ? e : num(evalExpr(e));

  // ── Statement execution ────────────────────────────────────────────────────

  const run = (cmds: Command[]): Signal => {
    for (const cmd of cmds) {
      if (!charge()) return 'abort';
      switch (cmd.type) {
        case BlockType.TURN_LEFT:
          dir = rotate(dir, 'left');
          pushStep('turnLeft');
          break;
        case BlockType.TURN_RIGHT:
          dir = rotate(dir, 'right');
          pushStep('turnRight');
          break;
        case BlockType.MOVE_FORWARD: {
          const next = cellAhead(dir);
          if (!inBounds(next)) {
            failReason = 'OUT_OF_BOUNDS';
            pushStep('move', true);
            return 'abort';
          }
          if (wallSet.has(key(next))) {
            failReason = 'HIT_WALL';
            pushStep('move', true);
            return 'abort';
          }
          pos = next;
          pushStep('move');
          break;
        }
        case BlockType.REPEAT: {
          const n = Math.trunc(evalNum(cmd.times));
          for (let i = 0; i < n; i++) {
            if (!charge()) return 'abort';
            const sig = run(cmd.body);
            if (sig === 'abort') return 'abort';
            if (sig === 'break') break;
          }
          break;
        }
        case BlockType.FOREVER: {
          // Terminates only via break, goal logic in the program, or the op budget.
          // eslint-disable-next-line no-constant-condition
          while (true) {
            if (!charge()) return 'abort';
            const sig = run(cmd.body);
            if (sig === 'abort') return 'abort';
            if (sig === 'break') break;
          }
          break;
        }
        case BlockType.WHILE: {
          const wantTrue = cmd.mode === 'while';
          while (evalBool(cmd.cond) === wantTrue) {
            if (!charge()) return 'abort';
            const sig = run(cmd.body);
            if (sig === 'abort') return 'abort';
            if (sig === 'break') break;
          }
          break;
        }
        case BlockType.IF: {
          let taken = false;
          for (const br of cmd.branches) {
            if (evalBool(br.cond)) {
              const sig = run(br.body);
              if (sig !== 'ok') return sig;
              taken = true;
              break;
            }
          }
          if (!taken && cmd.elseBody) {
            const sig = run(cmd.elseBody);
            if (sig !== 'ok') return sig;
          }
          break;
        }
        case BlockType.BREAK:
          return 'break';
        case 'var_set':
          vars[cmd.name] = num(evalExpr(cmd.value));
          break;
        case 'var_change':
          vars[cmd.name] = (vars[cmd.name] ?? 0) + num(evalExpr(cmd.delta));
          break;
      }
    }
    return 'ok';
  };

  run(commands);

  return {
    reachedGoal: failReason === null && sameCell(pos, grid.goal),
    steps,
    blocksUsed: countBlocks(commands),
    failReason,
    finalPos: pos,
    finalDir: dir,
    vars,
  };
}

function truthy(v: number | boolean): boolean {
  return typeof v === 'boolean' ? v : v !== 0;
}
function num(v: number | boolean): number {
  return typeof v === 'number' ? v : v ? 1 : 0;
}

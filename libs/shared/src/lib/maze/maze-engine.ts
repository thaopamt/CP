/**
 * Pure maze interpreter. Walks a `Command` AST over a `GridConfig` and produces
 * a deterministic `SimulationResult`. No DOM, no Blockly, no `eval` — the same
 * function runs in the browser (to animate) and on the server (to grade), so
 * results are guaranteed identical for the same input.
 */

import {
  BlockType,
  Cell,
  Command,
  Direction,
  GridConfig,
  MAZE_STEP_LIMIT,
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

/** Total AST node count. A `repeat` counts as 1 node plus its body, recursively. */
export function countBlocks(commands: Command[]): number {
  let total = 0;
  for (const cmd of commands) {
    total += 1;
    if (cmd.type === BlockType.REPEAT) {
      total += countBlocks(cmd.body);
    }
  }
  return total;
}

const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

/**
 * Run `commands` against `grid`.
 *
 * Movement rules: a `move` into a cell outside the grid stops the run with
 * `OUT_OF_BOUNDS`; into a wall stops with `HIT_WALL`. A global step counter
 * caps total primitive actions at `stepLimit` (default `MAZE_STEP_LIMIT`) so a
 * `repeat` can never loop forever — exceeding it stops with `STEP_LIMIT`.
 */
export function simulate(
  grid: GridConfig,
  commands: Command[],
  opts?: { stepLimit?: number },
): SimulationResult {
  const stepLimit = opts?.stepLimit ?? MAZE_STEP_LIMIT;
  const wallSet = new Set(grid.walls.map((w) => `${w.x},${w.y}`));
  const steps: SimStep[] = [];

  let pos: Cell = { ...grid.start };
  let dir: Direction = grid.startDir;
  let stepCount = 0;
  let failReason: SimulationResult['failReason'] = null;

  const inBounds = (c: Cell): boolean =>
    c.x >= 0 && c.x < grid.width && c.y >= 0 && c.y < grid.height;

  // Returns false when the step budget is exhausted (caller must stop).
  const charge = (): boolean => {
    stepCount += 1;
    if (stepCount > stepLimit) {
      failReason = 'STEP_LIMIT';
      return false;
    }
    return true;
  };

  // Depth-first execution of the AST. Returns false to abort the whole run.
  const run = (cmds: Command[]): boolean => {
    for (const cmd of cmds) {
      switch (cmd.type) {
        case BlockType.TURN_LEFT: {
          if (!charge()) return false;
          dir = rotate(dir, 'left');
          steps.push({ index: steps.length, pos: { ...pos }, dir, action: 'turnLeft' });
          break;
        }
        case BlockType.TURN_RIGHT: {
          if (!charge()) return false;
          dir = rotate(dir, 'right');
          steps.push({ index: steps.length, pos: { ...pos }, dir, action: 'turnRight' });
          break;
        }
        case BlockType.MOVE_FORWARD: {
          if (!charge()) return false;
          const { dx, dy } = directionVector(dir);
          const next: Cell = { x: pos.x + dx, y: pos.y + dy };
          if (!inBounds(next)) {
            failReason = 'OUT_OF_BOUNDS';
            steps.push({ index: steps.length, pos: { ...pos }, dir, action: 'move', crashed: true });
            return false;
          }
          if (wallSet.has(`${next.x},${next.y}`)) {
            failReason = 'HIT_WALL';
            steps.push({ index: steps.length, pos: { ...pos }, dir, action: 'move', crashed: true });
            return false;
          }
          pos = next;
          steps.push({ index: steps.length, pos: { ...pos }, dir, action: 'move' });
          break;
        }
        case BlockType.REPEAT: {
          for (let i = 0; i < cmd.times; i++) {
            if (!run(cmd.body)) return false;
          }
          break;
        }
      }
    }
    return true;
  };

  run(commands);

  return {
    reachedGoal: failReason === null && sameCell(pos, grid.goal),
    steps,
    blocksUsed: countBlocks(commands),
    failReason,
    finalPos: pos,
    finalDir: dir,
  };
}

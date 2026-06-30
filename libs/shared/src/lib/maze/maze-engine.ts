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
  Monster,
  MonsterKind,
  MonsterView,
  MysteryBox,
  SensorType,
  SimStep,
  SimTraceEvent,
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

/**
 * Cell a monster occupies at tick `t` (t = number of character actions taken;
 * t = 0 at level start). A single-cell path is a static monster. Patrols cycle
 * through `path`: `loop` wraps around, `pingpong` bounces back and forth.
 */
export function monsterCellAt(monster: Monster, t: number): Cell {
  const path = monster.path ?? [];
  const len = path.length;
  if (len === 0) return { x: -1, y: -1 }; // off-board (defensive)
  if (len === 1) return path[0];
  const tt = Math.max(0, Math.trunc(t));
  if ((monster.mode ?? 'pingpong') === 'loop') return path[tt % len];
  const period = 2 * (len - 1); // …→ last → … → first → …
  const p = tt % period;
  return path[p < len ? p : period - p];
}

/** Resolve a monster's behaviour, defaulting to patrol (multi-cell) or static. */
export function monsterKindOf(m: Monster): MonsterKind {
  return m.kind ?? ((m.path?.length ?? 0) > 1 ? 'patrol' : 'static');
}

/** Sleeper schedule: asleep for the first `sleep` ticks of each cycle, then awake. */
function sleeperAwakeAt(m: Monster, t: number): boolean {
  const sleep = m.sleep ?? 2;
  const awake = m.awake ?? 2;
  const cycle = Math.max(1, sleep + awake);
  return ((Math.max(0, Math.trunc(t)) % cycle) >= sleep);
}

/**
 * Monster snapshots at tick `t` for RENDERING. Exact for tick-based kinds
 * (static/patrol/sleeper); chaser/guard report their spawn cell, which is all the
 * UI needs (the idle/start frame). Mid-run positions come from the stored frames.
 */
export function monsterViewsAt(grid: GridConfig, t: number): MonsterView[] {
  return (grid.monsters ?? []).map((m) => {
    const kind = monsterKindOf(m);
    if (kind === 'sleeper') {
      return { ...monsterCellAt(m, 0), kind, asleep: !sleeperAwakeAt(m, t) };
    }
    if (kind === 'chaser' || kind === 'guard') return { ...(m.path[0] ?? { x: -1, y: -1 }), kind };
    return { ...monsterCellAt(m, t), kind };
  });
}

/** Step one cell from `from` toward `target`, greedily reducing Manhattan distance. */
function stepToward(from: Cell, target: Cell, isOpen: (c: Cell) => boolean): Cell {
  const dx = Math.sign(target.x - from.x);
  const dy = Math.sign(target.y - from.y);
  const horiz: Cell = { x: from.x + dx, y: from.y };
  const vert: Cell = { x: from.x, y: from.y + dy };
  const preferHoriz = Math.abs(target.x - from.x) >= Math.abs(target.y - from.y);
  const order = preferHoriz ? [horiz, vert] : [vert, horiz];
  for (const c of order) if (!sameCell(c, from) && isOpen(c)) return c;
  return from;
}

/** True when `target` is on the same row/column as `from` with no wall between. */
function lineOfSight(from: Cell, target: Cell, isOpen: (c: Cell) => boolean): boolean {
  if (from.x === target.x && from.y !== target.y) {
    const lo = Math.min(from.y, target.y);
    const hi = Math.max(from.y, target.y);
    for (let y = lo + 1; y < hi; y++) if (!isOpen({ x: from.x, y })) return false;
    return true;
  }
  if (from.y === target.y && from.x !== target.x) {
    const lo = Math.min(from.x, target.x);
    const hi = Math.max(from.x, target.x);
    for (let x = lo + 1; x < hi; x++) if (!isOpen({ x, y: from.y })) return false;
    return true;
  }
  return false;
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
type ResolvedBoxContent = Exclude<MysteryBox['content'], 'random'>;

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function resolveBoxContent(box: MysteryBox, seed: number): ResolvedBoxContent {
  if (box.content !== 'random') return box.content;
  return hash32(`${seed}:${box.x},${box.y}`) % 2 === 0 ? 'treasure' : 'monster';
}

export function simulate(
  grid: GridConfig,
  commands: Command[],
  opts?: { opLimit?: number; randomSeed?: number },
): SimulationResult {
  const opLimit = opts?.opLimit ?? MAZE_OP_LIMIT;
  const randomSeed = Number.isFinite(opts?.randomSeed)
    ? Math.trunc(opts?.randomSeed ?? 0)
    : 0;
  const wallSet = new Set((grid.walls ?? []).map(key));
  // Items as a count per cell — a coordinate listed N times = N collectibles in
  // that cell (picked one at a time). `totalItems` tracks the remaining sum.
  const itemCount = new Map<string, number>();
  for (const c of grid.items ?? []) itemCount.set(key(c), (itemCount.get(key(c)) ?? 0) + 1);
  let totalItems = 0;
  for (const n of itemCount.values()) totalItems += n;

  // Mystery boxes: hidden '?' cells keyed by position → resolved content. Removed on open.
  const boxAt = new Map<string, ResolvedBoxContent>();
  for (const b of grid.boxes ?? []) boxAt.set(key(b), resolveBoxContent(b, randomSeed));
  const hasBoxes = boxAt.size > 0;
  let treasureBoxesLeft = 0;
  for (const c of boxAt.values()) if (c === 'treasure') treasureBoxesLeft += 1;
  const boxPositions = (): Cell[] =>
    Array.from(boxAt.keys()).map((k) => {
      const [x, y] = k.split(',').map(Number);
      return { x, y };
    });

  const monsters = grid.monsters ?? [];
  const monsterKinds = monsters.map(monsterKindOf);
  const hasMonsters = monsters.length > 0;
  // Current monster cells + per-sleeper patrol progress, advanced one tick at a
  // time (chaser/guard react to the character, so they cannot be a pure fn of tick).
  const monsterPos: Cell[] = monsters.map((m) => ({ ...(m.path[0] ?? { x: -1, y: -1 }) }));
  const sleeperStep: number[] = monsters.map(() => 0);
  const defeatedMonsters = new Set<number>();

  const steps: SimStep[] = [];
  const trace: SimTraceEvent[] = [];
  const vars: Record<string, number> = {};

  let pos: Cell = { ...grid.start };
  let dir: Direction = grid.startDir;
  let ops = 0;
  let tick = 0; // visible character actions taken so far (drives monster motion)
  let failReason: SimulationResult['failReason'] = null;

  const inBounds = (c: Cell): boolean =>
    c.x >= 0 && c.x < grid.width && c.y >= 0 && c.y < grid.height;

  const cellAhead = (facing: Direction): Cell => {
    const { dx, dy } = directionVector(facing);
    return { x: pos.x + dx, y: pos.y + dy };
  };

  const isOpen = (c: Cell): boolean => inBounds(c) && !wallSet.has(key(c));

  // ── Monster runtime ────────────────────────────────────────────────────────
  /** A sleeper is harmless while asleep; all other monsters are always lethal. */
  const monsterLethalNow = (i: number, t: number): boolean =>
    monsterKinds[i] !== 'sleeper' || sleeperAwakeAt(monsters[i], t);

  const monsterViews = (): MonsterView[] =>
    monsters
      .map((m, i) => {
        if (defeatedMonsters.has(i)) {
          return { x: -1, y: -1, kind: monsterKinds[i], defeated: true };
        }
        return {
          ...monsterPos[i],
          kind: monsterKinds[i],
          ...(monsterKinds[i] === 'sleeper' && !sleeperAwakeAt(m, tick) ? { asleep: true } : {}),
        };
      })
      .filter((v) => !(v as any).defeated);

  /** True when a LETHAL monster currently sits on cell `c` (drives the sensors). */
  const monsterDangerAt = (c: Cell): boolean =>
    monsters.some((_, i) => !defeatedMonsters.has(i) && monsterLethalNow(i, tick) && sameCell(monsterPos[i], c));

  /** Advance every monster to `newTick`, reacting to the character's cell `target`. */
  const advanceMonsters = (newTick: number, target: Cell): void => {
    for (let i = 0; i < monsters.length; i++) {
      if (defeatedMonsters.has(i)) {
        monsterPos[i] = { x: -1, y: -1 };
        continue;
      }
      const m = monsters[i];
      switch (monsterKinds[i]) {
        case 'static':
          monsterPos[i] = m.path[0];
          break;
        case 'patrol':
          monsterPos[i] = monsterCellAt(m, newTick);
          break;
        case 'sleeper':
          if (sleeperAwakeAt(m, newTick)) {
            monsterPos[i] = monsterCellAt(m, sleeperStep[i]); // advance only while awake
            sleeperStep[i] += 1;
          }
          break;
        case 'chaser': {
          const speed = Math.max(1, Math.trunc(m.speed ?? 2));
          if (newTick % speed === 0) monsterPos[i] = stepToward(monsterPos[i], target, isOpen);
          break;
        }
        case 'guard':
          if (lineOfSight(monsterPos[i], target, isOpen)) {
            const dx = Math.sign(target.x - monsterPos[i].x);
            const dy = Math.sign(target.y - monsterPos[i].y);
            const next = { x: monsterPos[i].x + dx, y: monsterPos[i].y + dy };
            if (isOpen(next)) monsterPos[i] = next;
          }
          break;
      }
    }
  };

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
  const itemsLeft = (): Cell[] => {
    const out: Cell[] = [];
    for (const [k, n] of itemCount) {
      if (n <= 0) continue;
      const [x, y] = k.split(',').map(Number);
      for (let i = 0; i < n; i++) out.push({ x, y });
    }
    return out;
  };

  const pushTraceFrame = (blockId?: string, crashed?: boolean) => {
    if (!blockId) return;
    trace.push({
      index: trace.length,
      pos: { ...pos },
      dir,
      blockId,
      ...(crashed ? { crashed: true } : {}),
      vars: snapshotVars(),
      itemsLeft: itemsLeft(),
      ...(hasMonsters ? { monsters: monsterViews() } : {}),
      ...(hasBoxes ? { boxes: boxPositions() } : {}),
    });
  };

  const pushTrace = (cmd: Command, crashed?: boolean) => {
    pushTraceFrame(cmd.blockId, crashed);
  };

  const pushExprTrace = (expr: Expr) => {
    pushTraceFrame(expr.blockId);
  };

  const pushStep = (action: SimStep['action'], cmd: Command, crashed?: boolean) => {
    steps.push({
      index: steps.length,
      pos: { ...pos },
      dir,
      action,
      ...(cmd?.blockId ? { blockId: cmd.blockId } : {}),
      ...(crashed ? { crashed: true } : {}),
      vars: snapshotVars(),
      itemsLeft: itemsLeft(),
      ...(hasMonsters ? { monsters: monsterViews() } : {}),
      ...(hasBoxes ? { boxes: boxPositions() } : {}),
    });
    pushTrace(cmd, crashed);
  };

  /**
   * Advance one tick (monsters move; chaser/guard react to the character's PRE-move
   * cell `from`) and test whether the character — having just moved from `from` to
   * `to` — collides with a lethal monster. A collision is sharing a cell after the
   * move, OR swapping cells head-on. On a catch it records the crashed step and
   * returns true so the caller aborts.
   */
  const advanceAndCheckCaught = (
    from: Cell,
    to: Cell,
    action: SimStep['action'],
    cmd: Command,
  ): boolean => {
    const before = monsterPos.map((c) => ({ ...c }));
    tick += 1;
    if (hasMonsters) {
      advanceMonsters(tick, from);
      for (let i = 0; i < monsters.length; i++) {
        if (!monsterLethalNow(i, tick)) continue;
        const swapped = sameCell(before[i], to) && sameCell(monsterPos[i], from);
        if (sameCell(monsterPos[i], to) || swapped) {
          failReason = 'CAUGHT';
          pushStep(action, cmd, true);
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Open a mystery box if the character just stepped onto one. A treasure box is
   * collected (counts toward collect-all); a monster box ends the run. Returns true
   * when the run should abort (monster box) — the caller records the crashed step.
   */
  const openBoxIfAny = (cmd: Command): boolean => {
    if (!hasBoxes) return false;
    const k = key(pos);
    const content = boxAt.get(k);
    if (!content) return false;
    boxAt.delete(k);
    if (content === 'monster') {
      failReason = 'CAUGHT';
      pushStep('move', cmd, true);
      return true;
    }
    treasureBoxesLeft -= 1; // treasure — opened safely
    return false;
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
        return (itemCount.get(key(pos)) ?? 0) > 0;
      case SensorType.ITEMS_LEFT:
        return totalItems > 0;
      case SensorType.NO_ITEMS_LEFT:
        return totalItems === 0;
      case SensorType.MONSTER_AHEAD:
        return monsterDangerAt(cellAhead(dir));
      case SensorType.MONSTER_LEFT:
        return monsterDangerAt(cellAhead(rotate(dir, 'left')));
      case SensorType.MONSTER_RIGHT:
        return monsterDangerAt(cellAhead(rotate(dir, 'right')));
      case SensorType.BOX_AHEAD:
        return boxAt.has(key(cellAhead(dir)));
      case SensorType.BOX_AHEAD_SAFE:
        return boxAt.get(key(cellAhead(dir))) === 'treasure';
      case SensorType.BOX_AHEAD_MONSTER:
        return boxAt.get(key(cellAhead(dir))) === 'monster';
    }
  };

  const evalExpr = (e: Expr): number | boolean => {
    pushExprTrace(e);
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
        case BlockType.TURN_LEFT: {
          const from = { ...pos };
          dir = rotate(dir, 'left');
          if (advanceAndCheckCaught(from, pos, 'turnLeft', cmd)) return 'abort';
          pushStep('turnLeft', cmd);
          break;
        }
        case BlockType.TURN_RIGHT: {
          const from = { ...pos };
          dir = rotate(dir, 'right');
          if (advanceAndCheckCaught(from, pos, 'turnRight', cmd)) return 'abort';
          pushStep('turnRight', cmd);
          break;
        }
        case BlockType.MOVE_FORWARD: {
          const from = { ...pos };
          const next = cellAhead(dir);
          if (!inBounds(next)) {
            failReason = 'OUT_OF_BOUNDS';
            pushStep('move', cmd, true);
            return 'abort';
          }
          if (wallSet.has(key(next))) {
            failReason = 'HIT_WALL';
            pushStep('move', cmd, true);
            return 'abort';
          }
          pos = next;
          if (advanceAndCheckCaught(from, pos, 'move', cmd)) return 'abort';
          if (openBoxIfAny(cmd)) return 'abort'; // stepped onto a monster box
          pushStep('move', cmd);
          break;
        }
        case BlockType.PICK: {
          // Pick one item from the current cell. Picking an empty cell is a
          // harmless no-op (still a visible step) so kid programs never crash.
          const k = key(pos);
          const n = itemCount.get(k) ?? 0;
          if (n > 0) {
            itemCount.set(k, n - 1);
            totalItems -= 1;
          }
          const from = { ...pos };
          if (advanceAndCheckCaught(from, pos, 'pick', cmd)) return 'abort';
          pushStep('pick', cmd);
          break;
        }
        case BlockType.WAIT: {
          // Stand still for one tick — lets a patrolling monster pass by.
          const from = { ...pos };
          if (advanceAndCheckCaught(from, pos, 'wait', cmd)) return 'abort';
          pushStep('wait', cmd);
          break;
        }
        case BlockType.ATTACK: {
          const targetCell = cellAhead(dir);
          const targetKey = key(targetCell);

          // 1. Destroy monster mystery box
          if (hasBoxes && boxAt.has(targetKey) && boxAt.get(targetKey) === 'monster') {
            boxAt.delete(targetKey);
          }

          // 2. Defeat roaming monsters
          if (hasMonsters) {
            for (let i = 0; i < monsters.length; i++) {
              if (!defeatedMonsters.has(i) && sameCell(monsterPos[i], targetCell)) {
                defeatedMonsters.add(i);
                monsterPos[i] = { x: -1, y: -1 };
              }
            }
          }

          const from = { ...pos };
          if (advanceAndCheckCaught(from, pos, 'attack', cmd)) return 'abort';
          pushStep('attack', cmd);
          break;
        }
        case BlockType.REPEAT: {
          pushTrace(cmd);
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
          pushTrace(cmd);
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
          pushTrace(cmd);
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
          pushTrace(cmd);
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
          pushTrace(cmd);
          return 'break';
        case 'var_set':
          vars[cmd.name] = num(evalExpr(cmd.value));
          pushTrace(cmd);
          break;
        case 'var_change':
          vars[cmd.name] = (vars[cmd.name] ?? 0) + num(evalExpr(cmd.delta));
          pushTrace(cmd);
          break;
      }
    }
    return 'ok';
  };

  // A lethal monster already sitting on the start cell catches the character
  // before any block runs (defensive — well-formed levels never start on one).
  if (hasMonsters && monsters.some((_, i) => monsterLethalNow(i, 0) && sameCell(monsterPos[i], pos))) {
    failReason = 'CAUGHT';
  } else {
    run(commands);
  }

  // Collect-all levels are solved by emptying the board of every collectible —
  // loose items AND treasure boxes. Classic levels are solved by reaching the goal.
  const solved = grid.collectAll
    ? totalItems === 0 && treasureBoxesLeft === 0
    : sameCell(pos, grid.goal);

  return {
    reachedGoal: failReason === null && solved,
    steps,
    trace,
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

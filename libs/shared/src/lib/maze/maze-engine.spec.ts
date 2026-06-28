import { BlockType, Command, Direction, GridConfig, Monster, SensorType } from './maze.types';
import { countBlocks, monsterCellAt, rotate, simulate } from './maze-engine';
import { validateCommands } from './maze-validator';

const move: Command = { type: BlockType.MOVE_FORWARD };
const left: Command = { type: BlockType.TURN_LEFT };
const right: Command = { type: BlockType.TURN_RIGHT };
const pick: Command = { type: BlockType.PICK };
const wait: Command = { type: BlockType.WAIT };

/** 3-wide row, start facing east at (0,0), goal at (2,0). */
const straight: GridConfig = {
  width: 3,
  height: 1,
  walls: [],
  start: { x: 0, y: 0 },
  startDir: Direction.EAST,
  goal: { x: 2, y: 0 },
};

describe('rotate', () => {
  it('turns right clockwise and left counter-clockwise', () => {
    expect(rotate(Direction.NORTH, 'right')).toBe(Direction.EAST);
    expect(rotate(Direction.NORTH, 'left')).toBe(Direction.WEST);
    expect(rotate(Direction.WEST, 'right')).toBe(Direction.NORTH);
  });
});

describe('simulate', () => {
  it('reaches the goal on a straight path', () => {
    const res = simulate(straight, [move, move]);
    expect(res.reachedGoal).toBe(true);
    expect(res.failReason).toBeNull();
    expect(res.steps).toHaveLength(2);
  });

  it('stops out of bounds', () => {
    const res = simulate(straight, [move, move, move]);
    expect(res.reachedGoal).toBe(false);
    expect(res.failReason).toBe('OUT_OF_BOUNDS');
  });

  it('stops when hitting a wall', () => {
    const grid: GridConfig = { ...straight, walls: [{ x: 1, y: 0 }] };
    const res = simulate(grid, [move]);
    expect(res.failReason).toBe('HIT_WALL');
    expect(res.finalPos).toEqual({ x: 0, y: 0 });
  });

  it('unrolls repeat blocks', () => {
    const repeat: Command = { type: BlockType.REPEAT, times: 2, body: [move] };
    const res = simulate(straight, [repeat]);
    expect(res.reachedGoal).toBe(true);
    expect(res.steps).toHaveLength(2);
  });

  it('caps runaway loops via the op limit', () => {
    const repeat: Command = { type: BlockType.REPEAT, times: 100, body: [left] };
    const res = simulate(straight, [repeat], { opLimit: 10 });
    expect(res.failReason).toBe('STEP_LIMIT');
    expect(res.steps.length).toBeLessThanOrEqual(10);
  });
});

describe('simulate — collect-all with quantities', () => {
  // Two stars stacked on (0,0), one on (1,0). Solved only when all 3 are picked.
  const grid: GridConfig = {
    width: 3,
    height: 1,
    walls: [],
    start: { x: 0, y: 0 },
    startDir: Direction.EAST,
    goal: { x: 2, y: 0 },
    items: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
    collectAll: true,
  };

  it('needs one pick per item in a multi-item cell', () => {
    const res = simulate(grid, [pick, pick, move, pick]);
    expect(res.reachedGoal).toBe(true);
  });

  it('is unsolved while any item remains', () => {
    const res = simulate(grid, [pick, move, pick]); // (0,0) still has 1 star
    expect(res.reachedGoal).toBe(false);
    expect(res.failReason).toBeNull();
  });
});

describe('monsterCellAt', () => {
  it('keeps a single-cell path static', () => {
    const m: Monster = { path: [{ x: 2, y: 2 }] };
    expect(monsterCellAt(m, 0)).toEqual({ x: 2, y: 2 });
    expect(monsterCellAt(m, 5)).toEqual({ x: 2, y: 2 });
  });

  it('bounces a pingpong patrol back and forth', () => {
    const m: Monster = { path: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] }; // pingpong
    const xs = [0, 1, 2, 3, 4, 5, 6].map((t) => monsterCellAt(m, t).x);
    expect(xs).toEqual([0, 1, 2, 1, 0, 1, 2]);
  });

  it('wraps a looping patrol', () => {
    const m: Monster = { path: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], mode: 'loop' };
    const xs = [0, 1, 2, 3, 4, 5].map((t) => monsterCellAt(m, t).x);
    expect(xs).toEqual([0, 1, 2, 0, 1, 2]);
  });
});

describe('simulate — monsters', () => {
  const corridor: GridConfig = {
    width: 3,
    height: 1,
    walls: [],
    start: { x: 0, y: 0 },
    startDir: Direction.EAST,
    goal: { x: 2, y: 0 },
  };

  it('is caught walking into a static monster', () => {
    const grid: GridConfig = { ...corridor, monsters: [{ path: [{ x: 1, y: 0 }] }] };
    const res = simulate(grid, [move]);
    expect(res.failReason).toBe('CAUGHT');
    expect(res.reachedGoal).toBe(false);
  });

  it('is caught swapping cells head-on with a patrol', () => {
    // Monster goes (1,0)->(0,0) while the player goes (0,0)->(1,0): they pass
    // through each other without ever sharing a sampled cell -> still caught.
    const grid: GridConfig = {
      ...corridor,
      monsters: [{ path: [{ x: 1, y: 0 }, { x: 0, y: 0 }], mode: 'loop' }],
    };
    const res = simulate(grid, [move]);
    expect(res.failReason).toBe('CAUGHT');
  });

  it('lets a well-timed wait dodge a vertical patrol', () => {
    // 3x2: monster bounces between (1,1) and (1,0); the straight dash is caught,
    // but waiting one tick lets it drop back down so the lane clears.
    const grid: GridConfig = {
      width: 3,
      height: 2,
      walls: [],
      start: { x: 0, y: 0 },
      startDir: Direction.EAST,
      goal: { x: 2, y: 0 },
      monsters: [{ path: [{ x: 1, y: 1 }, { x: 1, y: 0 }], mode: 'loop' }],
    };
    expect(simulate(grid, [move, move]).failReason).toBe('CAUGHT');
    const dodged = simulate(grid, [wait, move, move]);
    expect(dodged.failReason).toBeNull();
    expect(dodged.reachedGoal).toBe(true);
  });
});

describe('simulate — monster skills', () => {
  const row = (w: number): GridConfig => ({
    width: w, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: w - 1, y: 0 },
  });

  it('a chaser closes in head-on and catches', () => {
    const grid: GridConfig = { ...row(5), monsters: [{ kind: 'chaser', speed: 1, path: [{ x: 4, y: 0 }] }] };
    expect(simulate(grid, [move, move]).failReason).toBe('CAUGHT');
  });

  it('a chaser moves at half speed (speed 2)', () => {
    const grid: GridConfig = {
      width: 4, height: 2, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 3, y: 0 },
      monsters: [{ kind: 'chaser', speed: 2, path: [{ x: 3, y: 1 }] }],
    };
    const res = simulate(grid, [wait, wait]);
    expect(res.steps[0].monsters?.[0]).toMatchObject({ x: 3, y: 1 }); // tick 1: no move
    expect(res.steps[1].monsters?.[0]).toMatchObject({ x: 2, y: 1 }); // tick 2: one step toward
  });

  it('a guard dashes along its line of sight and catches', () => {
    const grid: GridConfig = { ...row(4), monsters: [{ kind: 'guard', path: [{ x: 3, y: 0 }] }] };
    expect(simulate(grid, [move, move]).failReason).toBe('CAUGHT');
  });

  it('a sleeper is harmless while asleep but lethal once awake', () => {
    const grid: GridConfig = {
      ...row(3),
      monsters: [{ kind: 'sleeper', sleep: 2, awake: 2, path: [{ x: 1, y: 0 }] }],
    };
    // ticks 1-2 are within the asleep window → walking through (1,0) is safe.
    expect(simulate(grid, [move, move]).reachedGoal).toBe(true);
    // dawdle until tick 3 (awake) then step onto it → caught.
    expect(simulate(grid, [wait, wait, move]).failReason).toBe('CAUGHT');
  });
});

describe('simulate — mystery boxes', () => {
  const row = (w: number): GridConfig => ({
    width: w, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: w - 1, y: 0 },
    collectAll: true, itemTheme: 'star',
  });

  it('opening a treasure box collects it (collect-all win)', () => {
    const grid: GridConfig = { ...row(3), boxes: [{ x: 1, y: 0, content: 'treasure' }] };
    expect(simulate(grid, [move]).reachedGoal).toBe(true);
  });

  it('opening a monster box ends the run', () => {
    const grid: GridConfig = { ...row(3), boxes: [{ x: 1, y: 0, content: 'monster' }] };
    expect(simulate(grid, [move]).failReason).toBe('CAUGHT');
  });

  it('resolves random boxes from a stable per-run seed', () => {
    const grid: GridConfig = {
      width: 2, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 1, y: 0 },
      boxes: [{ x: 1, y: 0, content: 'random' }],
    };
    const outcomes = Array.from({ length: 20 }, (_, randomSeed) =>
      simulate(grid, [move], { randomSeed }).failReason,
    );

    expect(simulate(grid, [move], { randomSeed: 7 }).failReason).toBe(
      simulate(grid, [move], { randomSeed: 7 }).failReason,
    );
    expect(outcomes).toContain(null);
    expect(outcomes).toContain('CAUGHT');
  });

  it('lets an if block branch on whether a random box is safe', () => {
    const grid: GridConfig = {
      width: 2, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 1, y: 0 },
      boxes: [{ x: 1, y: 0, content: 'random' }],
    };
    const ifSafeThenMove: Command = {
      type: BlockType.IF,
      branches: [{ cond: { kind: 'sensor', sensor: SensorType.BOX_AHEAD_SAFE }, body: [move] }],
      elseBody: [right],
    };
    const seedFor = (expectedFailReason: ReturnType<typeof simulate>['failReason']) => {
      for (let randomSeed = 0; randomSeed < 64; randomSeed++) {
        if (simulate(grid, [move], { randomSeed }).failReason === expectedFailReason) return randomSeed;
      }
      throw new Error(`Could not find seed for ${expectedFailReason}`);
    };

    expect(simulate(grid, [ifSafeThenMove], { randomSeed: seedFor(null) }).reachedGoal).toBe(true);
    const avoided = simulate(grid, [ifSafeThenMove], { randomSeed: seedFor('CAUGHT') });
    expect(avoided.failReason).toBeNull();
    expect(avoided.reachedGoal).toBe(false);
    expect(avoided.finalDir).toBe(Direction.SOUTH);
  });
});

describe('simulate — mixed item types', () => {
  it('collect-all ignores per-cell item kinds (cosmetic only)', () => {
    const grid: GridConfig = {
      width: 3, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 2, y: 0 },
      items: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
      itemKindAt: { '0,0': 'star', '1,0': 'gem', '2,0': 'coin' },
      collectAll: true,
    };
    expect(simulate(grid, [pick, move, pick, move, pick]).reachedGoal).toBe(true);
  });
});

describe('countBlocks', () => {
  it('counts a repeat as itself plus its body', () => {
    expect(countBlocks([move, { type: BlockType.REPEAT, times: 3, body: [move, right] }])).toBe(4);
  });
});

describe('validateCommands', () => {
  const allowed = [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT];

  it('rejects disallowed blocks', () => {
    const res = validateCommands([right], allowed, null);
    expect(res.ok).toBe(false);
  });

  it('rejects exceeding maxBlocks', () => {
    const res = validateCommands([move, move, move], [BlockType.MOVE_FORWARD], 2);
    expect(res.ok).toBe(false);
  });

  it('accepts a valid program', () => {
    const res = validateCommands([move, left, move], allowed, 5);
    expect(res.ok).toBe(true);
    expect(res.errors).toHaveLength(0);
  });
});

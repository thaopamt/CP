import { BlockType, Command, Direction, GridConfig } from './maze.types';
import { countBlocks, rotate, simulate } from './maze-engine';
import { validateCommands } from './maze-validator';

const move: Command = { type: BlockType.MOVE_FORWARD };
const left: Command = { type: BlockType.TURN_LEFT };
const right: Command = { type: BlockType.TURN_RIGHT };

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

  it('caps runaway loops via the step limit', () => {
    const repeat: Command = { type: BlockType.REPEAT, times: 100, body: [left] };
    const res = simulate(straight, [repeat], { stepLimit: 10 });
    expect(res.failReason).toBe('STEP_LIMIT');
    expect(res.steps.length).toBeLessThanOrEqual(10);
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

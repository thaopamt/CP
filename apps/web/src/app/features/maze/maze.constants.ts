import { BlockType, Direction } from '@cp/shared';

/** Blockly block name ↔ engine BlockType. */
export const BLOCK_NAME: Record<BlockType, string> = {
  [BlockType.MOVE_FORWARD]: 'maze_move_forward',
  [BlockType.TURN_LEFT]: 'maze_turn_left',
  [BlockType.TURN_RIGHT]: 'maze_turn_right',
  [BlockType.REPEAT]: 'maze_repeat',
};

export const NAME_BLOCK: Record<string, BlockType> = Object.fromEntries(
  Object.entries(BLOCK_NAME).map(([k, v]) => [v, k as BlockType]),
) as Record<string, BlockType>;

/** Pixel size of one grid cell when rendering the maze. */
export const CELL_SIZE = 56;

/** Milliseconds per animation step. */
export const ANIMATION_INTERVAL_MS = 360;

/** Character rotation (degrees, clockwise) for each facing direction. */
export const DIR_ROTATION: Record<Direction, number> = {
  [Direction.NORTH]: 0,
  [Direction.EAST]: 90,
  [Direction.SOUTH]: 180,
  [Direction.WEST]: 270,
};

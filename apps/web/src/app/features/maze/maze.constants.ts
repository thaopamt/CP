import { Direction } from '@cp/shared';

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

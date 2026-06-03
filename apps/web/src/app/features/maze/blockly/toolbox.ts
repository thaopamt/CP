import * as Blockly from 'blockly/core';
import { BlockType } from '@cp/shared';
import { BLOCK_NAME } from '../maze.constants';

/**
 * Build a Blockly toolbox JSON containing only the blocks this level permits.
 * Keeps the palette focused so students aren't shown blocks they can't use.
 */
export function buildToolbox(allowedBlocks: BlockType[]): Blockly.utils.toolbox.ToolboxDefinition {
  const order: BlockType[] = [
    BlockType.MOVE_FORWARD,
    BlockType.TURN_LEFT,
    BlockType.TURN_RIGHT,
    BlockType.REPEAT,
  ];
  const allowed = new Set(allowedBlocks);
  return {
    kind: 'flyoutToolbox',
    contents: order
      .filter((b) => allowed.has(b))
      .map((b) => ({ kind: 'block', type: BLOCK_NAME[b] })),
  };
}

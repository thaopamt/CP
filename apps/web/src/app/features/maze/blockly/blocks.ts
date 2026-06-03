import * as Blockly from 'blockly/core';
import { MAZE_MAX_REPEAT } from '@cp/shared';

/**
 * Custom Blockly blocks for the maze. NOTE: we deliberately do NOT register any
 * code generator (e.g. javascriptGenerator) — the workspace is parsed directly
 * into a typed command tree (see workspace-to-ast.ts) and interpreted by the
 * pure engine. No arbitrary JavaScript is ever produced or evaluated.
 */

const MOVE_COLOUR = '#4C97FF';
const TURN_COLOUR = '#FFAB19';
const LOOP_COLOUR = '#59C059';

let registered = false;

/** Idempotent — safe to call on every editor mount. */
export function registerMazeBlocks(): void {
  if (registered) return;
  registered = true;

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'maze_move_forward',
      message0: 'đi tới',
      previousStatement: null,
      nextStatement: null,
      colour: MOVE_COLOUR,
      tooltip: 'Đi tới một ô theo hướng đang quay',
    },
    {
      type: 'maze_turn_left',
      message0: 'quay trái ↺',
      previousStatement: null,
      nextStatement: null,
      colour: TURN_COLOUR,
      tooltip: 'Quay trái 90 độ',
    },
    {
      type: 'maze_turn_right',
      message0: 'quay phải ↻',
      previousStatement: null,
      nextStatement: null,
      colour: TURN_COLOUR,
      tooltip: 'Quay phải 90 độ',
    },
    {
      type: 'maze_repeat',
      message0: 'lặp lại %1 lần',
      args0: [
        {
          type: 'field_number',
          name: 'TIMES',
          value: 3,
          min: 1,
          max: MAZE_MAX_REPEAT,
          precision: 1,
        },
      ],
      message1: 'làm %1',
      args1: [{ type: 'input_statement', name: 'BODY' }],
      previousStatement: null,
      nextStatement: null,
      colour: LOOP_COLOUR,
      tooltip: 'Lặp lại các khối bên trong nhiều lần',
    },
  ]);
}

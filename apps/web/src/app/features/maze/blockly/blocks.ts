import * as Blockly from 'blockly/core';
import 'blockly/blocks'; // registers built-in blocks (if/repeat/while/logic/math/variables)
import { SensorType } from '@cp/shared';

/**
 * Custom Blockly blocks for the maze. We deliberately register NO code
 * generator — the workspace is parsed directly into a typed AST
 * (workspace-to-ast.ts) and interpreted by the pure engine. No arbitrary
 * JavaScript is ever produced or evaluated.
 *
 * Only the maze-specific blocks are custom (actions, sensors, "forever").
 * Everything else (if/else, repeat, while/until, break, logic, math,
 * variables) uses Blockly's built-in blocks, which already ship Vietnamese
 * labels via `blockly/msg/vi`.
 */

const MOVE_COLOUR = '#4C97FF';
const TURN_COLOUR = '#FFAB19';
const PICK_COLOUR = '#40BF6A';
const WAIT_COLOUR = '#9E5BBA';
const LOOP_COLOUR = '#59C059';
const SENSOR_COLOUR = '#5CB1D6';

/** Maze sensor options, in dropdown order. Labels are Vietnamese. */
export const SENSOR_OPTIONS: [string, SensorType][] = [
  ['có đường phía trước', SensorType.PATH_AHEAD],
  ['có đường bên trái', SensorType.PATH_LEFT],
  ['có đường bên phải', SensorType.PATH_RIGHT],
  ['có tường phía trước', SensorType.WALL_AHEAD],
  ['có tường bên trái', SensorType.WALL_LEFT],
  ['có tường bên phải', SensorType.WALL_RIGHT],
  ['có quái vật phía trước', SensorType.MONSTER_AHEAD],
  ['có quái vật bên trái', SensorType.MONSTER_LEFT],
  ['có quái vật bên phải', SensorType.MONSTER_RIGHT],
  ['có hộp bí ẩn phía trước', SensorType.BOX_AHEAD],
  ['hộp phía trước an toàn', SensorType.BOX_AHEAD_SAFE],
  ['đã tới đích', SensorType.AT_GOAL],
  ['chưa tới đích', SensorType.NOT_AT_GOAL],
  ['ô này có vật phẩm', SensorType.ON_ITEM],
  ['còn vật phẩm', SensorType.ITEMS_LEFT],
  ['đã thu thập hết', SensorType.NO_ITEMS_LEFT],
];

let registered = false;

/** Idempotent — safe to call on every editor mount. */
export function registerMazeBlocks(): void {
  if (registered) return;
  registered = true;

  Blockly.defineBlocksWithJsonArray([
    {
      // Fixed program root. Only blocks connected under it are executed.
      type: 'maze_start',
      message0: '▶ Khi bắt đầu',
      nextStatement: null,
      colour: '#9E5BBA',
      tooltip: 'Chương trình chạy từ đây. Hãy nối các khối lệnh vào bên dưới.',
    },
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
      type: 'maze_pick',
      message0: 'thu thập',
      previousStatement: null,
      nextStatement: null,
      colour: PICK_COLOUR,
      tooltip: 'Thu thập vật phẩm/ngôi sao ở ô em đang đứng',
    },
    {
      type: 'maze_wait',
      message0: 'đứng yên ⏳',
      previousStatement: null,
      nextStatement: null,
      colour: WAIT_COLOUR,
      tooltip: 'Đứng yên một nhịp để quái vật đi qua',
    },
    {
      // "Lặp mãi mãi" — Blockly has no standard forever block.
      type: 'maze_forever',
      message0: 'lặp mãi mãi',
      message1: 'làm %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: LOOP_COLOUR,
      tooltip: 'Lặp lại các khối bên trong mãi mãi (cho đến khi gặp "dừng vòng lặp")',
    },
    {
      // Maze sensor — a single boolean block with a dropdown of all conditions.
      type: 'maze_condition',
      message0: '%1',
      args0: [{ type: 'field_dropdown', name: 'COND', options: SENSOR_OPTIONS }],
      output: 'Boolean',
      colour: SENSOR_COLOUR,
      tooltip: 'Cảm biến: kiểm tra trạng thái xung quanh nhân vật',
    },
  ]);
}

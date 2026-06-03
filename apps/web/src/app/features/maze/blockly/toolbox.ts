import * as Blockly from 'blockly/core';
import { BlockType } from '@cp/shared';

type Entry = Record<string, unknown>;
interface Category {
  kind: 'category';
  name: string;
  colour: string;
  custom?: string;
  contents?: Entry[];
}

const numberShadow = (value: number) => ({
  shadow: { type: 'math_number', fields: { NUM: value } },
});

/**
 * Build a category toolbox containing only the blocks this level permits.
 * Maze actions + sensors are custom blocks; control flow, logic, math and
 * variables reuse Blockly's built-in blocks (Vietnamese-labelled via msg/vi).
 *
 * A category toolbox (rather than a flat flyout) is required so the Variables
 * category can render its built-in "Tạo biến…" button.
 */
export function buildToolbox(allowedBlocks: BlockType[]): Blockly.utils.toolbox.ToolboxDefinition {
  const allow = new Set(allowedBlocks);
  const categories: Category[] = [];

  // ── Di chuyển ─────────────────────────────────────────────────────────
  const moves: Entry[] = [];
  if (allow.has(BlockType.MOVE_FORWARD)) moves.push({ kind: 'block', type: 'maze_move_forward' });
  if (allow.has(BlockType.TURN_LEFT)) moves.push({ kind: 'block', type: 'maze_turn_left' });
  if (allow.has(BlockType.TURN_RIGHT)) moves.push({ kind: 'block', type: 'maze_turn_right' });
  if (moves.length) categories.push({ kind: 'category', name: 'Di chuyển', colour: '#4C97FF', contents: moves });

  // ── Vòng lặp ──────────────────────────────────────────────────────────
  const loops: Entry[] = [];
  if (allow.has(BlockType.REPEAT)) {
    loops.push({ kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: numberShadow(5) } });
  }
  if (allow.has(BlockType.FOREVER)) loops.push({ kind: 'block', type: 'maze_forever' });
  if (allow.has(BlockType.WHILE)) {
    loops.push({ kind: 'block', type: 'controls_whileUntil', fields: { MODE: 'WHILE' } });
    loops.push({ kind: 'block', type: 'controls_whileUntil', fields: { MODE: 'UNTIL' } });
  }
  if (allow.has(BlockType.BREAK)) loops.push({ kind: 'block', type: 'controls_flow_statements' });
  if (loops.length) categories.push({ kind: 'category', name: 'Vòng lặp', colour: '#59C059', contents: loops });

  // ── Điều kiện ─────────────────────────────────────────────────────────
  const logic: Entry[] = [];
  if (allow.has(BlockType.IF)) {
    logic.push({ kind: 'block', type: 'controls_if' });
    logic.push({ kind: 'block', type: 'controls_if', extraState: { hasElse: true } });
  }
  if (allow.has(BlockType.CONDITION)) logic.push({ kind: 'block', type: 'maze_condition' });
  if (allow.has(BlockType.LOGIC)) {
    logic.push({ kind: 'block', type: 'logic_compare' });
    logic.push({ kind: 'block', type: 'logic_operation' });
    logic.push({ kind: 'block', type: 'logic_negate' });
    logic.push({ kind: 'block', type: 'logic_boolean' });
  }
  if (logic.length) categories.push({ kind: 'category', name: 'Điều kiện', colour: '#5CB1D6', contents: logic });

  // ── Toán ──────────────────────────────────────────────────────────────
  if (allow.has(BlockType.MATH)) {
    categories.push({
      kind: 'category',
      name: 'Toán',
      colour: '#9966FF',
      contents: [
        { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
        {
          kind: 'block',
          type: 'math_arithmetic',
          inputs: { A: numberShadow(1), B: numberShadow(1) },
        },
        {
          kind: 'block',
          type: 'math_modulo',
          inputs: { DIVIDEND: numberShadow(10), DIVISOR: numberShadow(3) },
        },
      ],
    });
  }

  // ── Biến (built-in category provides Create + get/set/change) ───────────
  if (allow.has(BlockType.VARIABLE)) {
    categories.push({ kind: 'category', name: 'Biến', colour: '#FF8C1A', custom: 'VARIABLE' });
  }

  return { kind: 'categoryToolbox', contents: categories } as Blockly.utils.toolbox.ToolboxDefinition;
}

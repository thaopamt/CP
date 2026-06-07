import * as Blockly from 'blockly/core';
import {
  ArithOp,
  BlockType,
  Command,
  CompareOp,
  Expr,
  LogicOp,
  SensorType,
} from '@cp/shared';

/**
 * Parse a Blockly workspace into a typed command tree. This is the ONLY bridge
 * between Blockly and the engine — it walks the block model directly (never the
 * JS generator), so the output is a safe, constrained data structure. Anything
 * unrecognized is dropped (the validator rejects illegal programs).
 */
export function workspaceToAst(workspace: Blockly.Workspace): Command[] {
  // The program is exactly the chain connected under the "Khi bắt đầu" block.
  // Any stray blocks elsewhere on the canvas are intentionally ignored.
  const start = workspace.getBlocksByType('maze_start', false)[0];
  if (start) {
    return walkChain(start.getNextBlock(), workspace);
  }
  // Fallback (no start block, e.g. legacy workspaces): first statement stack.
  const topBlocks = workspace.getTopBlocks(true).filter((b) => b.isEnabled());
  const root = topBlocks.find((b) => b.previousConnection || b.nextConnection) ?? topBlocks[0];
  return root ? walkChain(root, workspace) : [];
}

function walkChain(first: Blockly.Block | null, ws: Blockly.Workspace): Command[] {
  const out: Command[] = [];
  let block: Blockly.Block | null = first;
  while (block) {
    if (block.isEnabled() && !block.isShadow()) {
      const cmd = blockToCommand(block, ws);
      if (cmd) out.push(cmd);
    }
    block = block.getNextBlock();
  }
  return out;
}

function varName(block: Blockly.Block, ws: Blockly.Workspace, field = 'VAR'): string {
  const id = block.getFieldValue(field);
  const v = ws.getVariableById?.(id);
  return v?.getName?.() ?? String(id ?? 'biến');
}

function withBlockId<T extends Command>(block: Blockly.Block, cmd: T): T {
  return { ...cmd, blockId: block.id };
}

function withExprBlockId<T extends Expr>(block: Blockly.Block, expr: T): T {
  return { ...expr, blockId: block.id };
}

function blockToCommand(block: Blockly.Block, ws: Blockly.Workspace): Command | null {
  switch (block.type) {
    case 'maze_move_forward':
      return withBlockId(block, { type: BlockType.MOVE_FORWARD });
    case 'maze_turn_left':
      return withBlockId(block, { type: BlockType.TURN_LEFT });
    case 'maze_turn_right':
      return withBlockId(block, { type: BlockType.TURN_RIGHT });
    case 'maze_pick':
      return withBlockId(block, { type: BlockType.PICK });
    case 'maze_wait':
      return withBlockId(block, { type: BlockType.WAIT });

    case 'controls_repeat_ext': {
      const timesExpr = parseExpr(block.getInputTargetBlock('TIMES'), ws);
      const times = timesExpr && timesExpr.kind === 'num' ? timesExpr.value : (timesExpr ?? 0);
      return withBlockId(block, {
        type: BlockType.REPEAT,
        times,
        body: walkChain(block.getInputTargetBlock('DO'), ws),
      });
    }
    case 'controls_repeat': {
      // Internal-field variant.
      const times = Number(block.getFieldValue('TIMES')) || 0;
      return withBlockId(block, {
        type: BlockType.REPEAT,
        times,
        body: walkChain(block.getInputTargetBlock('DO'), ws),
      });
    }
    case 'maze_forever':
      return withBlockId(block, {
        type: BlockType.FOREVER,
        body: walkChain(block.getInputTargetBlock('DO'), ws),
      });

    case 'controls_whileUntil': {
      const mode = block.getFieldValue('MODE') === 'UNTIL' ? 'until' : 'while';
      const cond = parseExpr(block.getInputTargetBlock('BOOL'), ws) ?? { kind: 'bool', value: false };
      return withBlockId(block, {
        type: BlockType.WHILE,
        mode,
        cond,
        body: walkChain(block.getInputTargetBlock('DO'), ws),
      });
    }

    case 'controls_if': {
      const branches: { cond: Expr; body: Command[] }[] = [];
      let i = 0;
      while (block.getInput('IF' + i)) {
        const cond = parseExpr(block.getInputTargetBlock('IF' + i), ws) ?? { kind: 'bool', value: false };
        branches.push({ cond, body: walkChain(block.getInputTargetBlock('DO' + i), ws) });
        i++;
      }
      const elseBody = block.getInput('ELSE') ? walkChain(block.getInputTargetBlock('ELSE'), ws) : undefined;
      return withBlockId(block, {
        type: BlockType.IF,
        branches,
        ...(elseBody ? { elseBody } : {}),
      });
    }

    case 'controls_flow_statements':
      // BREAK or CONTINUE — the maze only supports break.
      return withBlockId(block, { type: BlockType.BREAK });

    case 'variables_set':
      return withBlockId(block, {
        type: 'var_set',
        name: varName(block, ws),
        value: parseExpr(block.getInputTargetBlock('VALUE'), ws) ?? { kind: 'num', value: 0 },
      });
    case 'math_change':
      return withBlockId(block, {
        type: 'var_change',
        name: varName(block, ws),
        delta: parseExpr(block.getInputTargetBlock('DELTA'), ws) ?? { kind: 'num', value: 0 },
      });

    default:
      return null;
  }
}

const ARITH: Record<string, ArithOp> = {
  ADD: 'add',
  MINUS: 'sub',
  MULTIPLY: 'mul',
  DIVIDE: 'div',
  POWER: 'pow',
};
const COMPARE: Record<string, CompareOp> = {
  EQ: 'eq',
  NEQ: 'neq',
  LT: 'lt',
  LTE: 'lte',
  GT: 'gt',
  GTE: 'gte',
};

function parseExpr(block: Blockly.Block | null, ws: Blockly.Workspace): Expr | null {
  // Shadow blocks are valid here — they carry the default values shown in inputs.
  if (!block) return null;

  switch (block.type) {
    case 'math_number':
      return withExprBlockId(block, {
        kind: 'num',
        value: Number(block.getFieldValue('NUM')) || 0,
      });
    case 'logic_boolean':
      return withExprBlockId(block, {
        kind: 'bool',
        value: block.getFieldValue('BOOL') === 'TRUE',
      });
    case 'variables_get':
      return withExprBlockId(block, { kind: 'var', name: varName(block, ws) });
    case 'maze_condition':
      return withExprBlockId(block, {
        kind: 'sensor',
        sensor: block.getFieldValue('COND') as SensorType,
      });
    case 'logic_negate':
      return withExprBlockId(block, {
        kind: 'not',
        a: parseExpr(block.getInputTargetBlock('BOOL'), ws) ?? { kind: 'bool', value: false },
      });
    case 'logic_operation': {
      const op: LogicOp = block.getFieldValue('OP') === 'OR' ? 'or' : 'and';
      return withExprBlockId(block, {
        kind: 'logic',
        op,
        a: parseExpr(block.getInputTargetBlock('A'), ws) ?? { kind: 'bool', value: false },
        b: parseExpr(block.getInputTargetBlock('B'), ws) ?? { kind: 'bool', value: false },
      });
    }
    case 'logic_compare':
      return withExprBlockId(block, {
        kind: 'compare',
        op: COMPARE[block.getFieldValue('OP')] ?? 'eq',
        a: parseExpr(block.getInputTargetBlock('A'), ws) ?? { kind: 'num', value: 0 },
        b: parseExpr(block.getInputTargetBlock('B'), ws) ?? { kind: 'num', value: 0 },
      });
    case 'math_arithmetic':
      return withExprBlockId(block, {
        kind: 'arith',
        op: ARITH[block.getFieldValue('OP')] ?? 'add',
        a: parseExpr(block.getInputTargetBlock('A'), ws) ?? { kind: 'num', value: 0 },
        b: parseExpr(block.getInputTargetBlock('B'), ws) ?? { kind: 'num', value: 0 },
      });
    case 'math_modulo':
      return withExprBlockId(block, {
        kind: 'arith',
        op: 'mod',
        a: parseExpr(block.getInputTargetBlock('DIVIDEND'), ws) ?? { kind: 'num', value: 0 },
        b: parseExpr(block.getInputTargetBlock('DIVISOR'), ws) ?? { kind: 'num', value: 1 },
      });
    default:
      return null;
  }
}

/** Serialize the workspace to XML text for persistence / replay. */
export function getWorkspaceXml(workspace: Blockly.Workspace): string {
  const dom = Blockly.Xml.workspaceToDom(workspace);
  return Blockly.Xml.domToText(dom);
}

/** Restore a workspace from previously-saved XML text. */
export function loadWorkspaceXml(workspace: Blockly.Workspace, xml: string): void {
  if (!xml) return;
  const dom = Blockly.utils.xml.textToDom(xml);
  Blockly.Xml.domToWorkspace(dom, workspace);
}

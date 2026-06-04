import { BlockType, Command, Expr, SensorType } from '@cp/shared';

/**
 * Render a maze command tree as readable Vietnamese pseudocode — used to stream
 * a student's Blockly program into the live monitor (teachers see what the
 * student built, not raw XML).
 */

const SENSOR_LABEL: Record<SensorType, string> = {
  [SensorType.PATH_AHEAD]: 'có đường phía trước',
  [SensorType.PATH_LEFT]: 'có đường bên trái',
  [SensorType.PATH_RIGHT]: 'có đường bên phải',
  [SensorType.WALL_AHEAD]: 'có tường phía trước',
  [SensorType.WALL_LEFT]: 'có tường bên trái',
  [SensorType.WALL_RIGHT]: 'có tường bên phải',
  [SensorType.AT_GOAL]: 'đã tới đích',
  [SensorType.NOT_AT_GOAL]: 'chưa tới đích',
  [SensorType.ON_ITEM]: 'đang đứng trên vật phẩm',
};

const ARITH: Record<string, string> = { add: '+', sub: '−', mul: '×', div: '÷', mod: 'mod', pow: '^' };
const COMPARE: Record<string, string> = { eq: '=', neq: '≠', lt: '<', lte: '≤', gt: '>', gte: '≥' };

function exprText(e: Expr | number | undefined): string {
  if (e == null) return '';
  if (typeof e === 'number') return String(e);
  switch (e.kind) {
    case 'num':
      return String(e.value);
    case 'bool':
      return e.value ? 'đúng' : 'sai';
    case 'var':
      return e.name;
    case 'sensor':
      return SENSOR_LABEL[e.sensor] ?? e.sensor;
    case 'arith':
      return `${exprText(e.a)} ${ARITH[e.op] ?? '?'} ${exprText(e.b)}`;
    case 'compare':
      return `${exprText(e.a)} ${COMPARE[e.op] ?? '?'} ${exprText(e.b)}`;
    case 'logic':
      return `(${exprText(e.a)} ${e.op === 'or' ? 'hoặc' : 'và'} ${exprText(e.b)})`;
    case 'not':
      return `không (${exprText(e.a)})`;
  }
}

function lines(cmds: Command[], depth: number): string[] {
  const pad = '  '.repeat(depth);
  const out: string[] = [];
  for (const c of cmds) {
    switch (c.type) {
      case BlockType.MOVE_FORWARD:
        out.push(`${pad}đi tới`);
        break;
      case BlockType.TURN_LEFT:
        out.push(`${pad}quay trái`);
        break;
      case BlockType.TURN_RIGHT:
        out.push(`${pad}quay phải`);
        break;
      case BlockType.REPEAT:
        out.push(`${pad}lặp ${exprText(c.times)} lần:`);
        out.push(...lines(c.body, depth + 1));
        break;
      case BlockType.FOREVER:
        out.push(`${pad}lặp mãi mãi:`);
        out.push(...lines(c.body, depth + 1));
        break;
      case BlockType.WHILE:
        out.push(`${pad}${c.mode === 'while' ? 'trong khi' : 'cho đến khi'} ${exprText(c.cond)}:`);
        out.push(...lines(c.body, depth + 1));
        break;
      case BlockType.IF:
        c.branches.forEach((br, i) => {
          out.push(`${pad}${i === 0 ? 'nếu' : 'hoặc nếu'} ${exprText(br.cond)}:`);
          out.push(...lines(br.body, depth + 1));
        });
        if (c.elseBody) {
          out.push(`${pad}ngược lại:`);
          out.push(...lines(c.elseBody, depth + 1));
        }
        break;
      case BlockType.BREAK:
        out.push(`${pad}dừng vòng lặp`);
        break;
      case 'var_set':
        out.push(`${pad}đặt ${c.name} = ${exprText(c.value)}`);
        break;
      case 'var_change':
        out.push(`${pad}tăng ${c.name} thêm ${exprText(c.delta)}`);
        break;
    }
  }
  return out;
}

export function programToText(cmds: Command[]): string {
  if (!cmds.length) return '(chưa có khối lệnh nào)';
  return lines(cmds, 0).join('\n');
}

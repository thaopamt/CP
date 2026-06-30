/**
 * Validates a command tree against a level's constraints BEFORE grading. Run on
 * both client (to block "Chạy"/"Nộp" early with friendly messages) and server
 * (authoritative — never trust the client). Error strings are Vietnamese.
 *
 * `allowedBlocks` lists the capabilities a level permits; every statement and
 * expression node must map to an allowed capability.
 */

import { countBlocks } from './maze-engine';
import {
  BlockType,
  Command,
  Expr,
  MAZE_MAX_DEPTH,
  MAZE_MAX_REPEAT,
  SensorType,
  ValidationResult,
} from './maze.types';

export function validateCommands(
  commands: Command[],
  allowedBlocks: BlockType[],
  maxBlocks: number | null,
  allowedSensors?: SensorType[] | null,
): ValidationResult {
  const errors = new Set<string>();
  const allowed = new Set<BlockType>(allowedBlocks);
  const allowedSens = allowedSensors && allowedSensors.length > 0 ? new Set<SensorType>(allowedSensors) : null;

  const push = (msg: string) => errors.add(msg);
  const requireCap = (cap: BlockType) => {
    if (!allowed.has(cap)) push('Bài này không cho phép dùng một khối mà em đã đặt.');
  };
  const requireSensor = (sens: SensorType) => {
    if (allowedSens && !allowedSens.has(sens)) {
      push('Cảm biến này không được phép sử dụng ở bàn chơi này.');
    }
  };

  const walkExpr = (e: Expr | number | undefined): void => {
    if (e == null || typeof e === 'number') return;
    switch (e.kind) {
      case 'num':
      case 'bool':
        break;
      case 'var':
        requireCap(BlockType.VARIABLE);
        break;
      case 'sensor':
        requireCap(BlockType.CONDITION);
        requireSensor(e.sensor);
        break;
      case 'arith':
        requireCap(BlockType.MATH);
        walkExpr(e.a);
        walkExpr(e.b);
        break;
      case 'compare':
        requireCap(BlockType.LOGIC);
        walkExpr(e.a);
        walkExpr(e.b);
        break;
      case 'logic':
        requireCap(BlockType.LOGIC);
        walkExpr(e.a);
        walkExpr(e.b);
        break;
      case 'not':
        requireCap(BlockType.LOGIC);
        walkExpr(e.a);
        break;
    }
  };

  const walk = (cmds: Command[], depth: number): void => {
    if (depth > MAZE_MAX_DEPTH) {
      push(`Khối lồng nhau quá sâu (tối đa ${MAZE_MAX_DEPTH} tầng).`);
      return;
    }
    for (const cmd of cmds) {
      switch (cmd.type) {
        case BlockType.MOVE_FORWARD:
          requireCap(BlockType.MOVE_FORWARD);
          break;
        case BlockType.TURN_LEFT:
          requireCap(BlockType.TURN_LEFT);
          break;
        case BlockType.TURN_RIGHT:
          requireCap(BlockType.TURN_RIGHT);
          break;
        case BlockType.PICK:
          requireCap(BlockType.PICK);
          break;
        case BlockType.WAIT:
          requireCap(BlockType.WAIT);
          break;
        case BlockType.ATTACK:
          requireCap(BlockType.ATTACK);
          break;
        case BlockType.REPEAT: {
          requireCap(BlockType.REPEAT);
          if (typeof cmd.times === 'number') {
            if (!Number.isInteger(cmd.times) || cmd.times < 0 || cmd.times > MAZE_MAX_REPEAT) {
              push(`Số lần lặp phải là số nguyên từ 0 đến ${MAZE_MAX_REPEAT}.`);
            }
          } else {
            walkExpr(cmd.times);
          }
          walk(cmd.body, depth + 1);
          break;
        }
        case BlockType.FOREVER:
          requireCap(BlockType.FOREVER);
          walk(cmd.body, depth + 1);
          break;
        case BlockType.WHILE:
          requireCap(BlockType.WHILE);
          walkExpr(cmd.cond);
          walk(cmd.body, depth + 1);
          break;
        case BlockType.IF:
          requireCap(BlockType.IF);
          for (const br of cmd.branches) {
            walkExpr(br.cond);
            walk(br.body, depth + 1);
          }
          if (cmd.elseBody) walk(cmd.elseBody, depth + 1);
          break;
        case BlockType.BREAK:
          requireCap(BlockType.BREAK);
          break;
        case 'var_set':
          requireCap(BlockType.VARIABLE);
          walkExpr(cmd.value);
          break;
        case 'var_change':
          requireCap(BlockType.VARIABLE);
          walkExpr(cmd.delta);
          break;
      }
    }
  };

  walk(commands, 1);

  if (commands.length === 0) {
    push('Em hãy kéo ít nhất một khối lệnh vào khu vực làm bài nhé!');
  }

  if (maxBlocks != null && countBlocks(commands) > maxBlocks) {
    push(`Em chỉ được dùng tối đa ${maxBlocks} khối cho bài này.`);
  }

  return { ok: errors.size === 0, errors: Array.from(errors) };
}

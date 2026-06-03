/**
 * Validates a command tree against a level's constraints BEFORE grading. Run on
 * both client (to block "Chạy"/"Nộp" early with friendly messages) and server
 * (authoritative — never trust the client). Error strings are Vietnamese.
 */

import { countBlocks } from './maze-engine';
import {
  BlockType,
  Command,
  MAZE_MAX_DEPTH,
  MAZE_MAX_REPEAT,
  ValidationResult,
} from './maze.types';

const ALL_BLOCK_TYPES = new Set<string>(Object.values(BlockType));

export function validateCommands(
  commands: Command[],
  allowedBlocks: BlockType[],
  maxBlocks: number | null,
): ValidationResult {
  const errors: string[] = [];
  const allowed = new Set<string>(allowedBlocks);

  const walk = (cmds: Command[], depth: number): void => {
    if (depth > MAZE_MAX_DEPTH) {
      errors.push(`Khối lặp lồng nhau quá sâu (tối đa ${MAZE_MAX_DEPTH} tầng).`);
      return;
    }
    for (const cmd of cmds) {
      if (!ALL_BLOCK_TYPES.has(cmd.type)) {
        errors.push('Có khối không hợp lệ trong chương trình.');
        continue;
      }
      if (!allowed.has(cmd.type)) {
        errors.push('Bài này không cho phép dùng một khối mà em đã đặt.');
      }
      if (cmd.type === BlockType.REPEAT) {
        if (!Number.isInteger(cmd.times) || cmd.times < 1 || cmd.times > MAZE_MAX_REPEAT) {
          errors.push(`Số lần lặp phải là số nguyên từ 1 đến ${MAZE_MAX_REPEAT}.`);
        }
        walk(cmd.body, depth + 1);
      }
    }
  };

  walk(commands, 1);

  if (commands.length === 0) {
    errors.push('Em hãy kéo ít nhất một khối lệnh vào khu vực làm bài nhé!');
  }

  if (maxBlocks != null && countBlocks(commands) > maxBlocks) {
    errors.push(`Em chỉ được dùng tối đa ${maxBlocks} khối cho bài này.`);
  }

  // De-duplicate so the same message doesn't repeat for every offending block.
  const unique = Array.from(new Set(errors));
  return { ok: unique.length === 0, errors: unique };
}

import * as Blockly from 'blockly/core';
import { BlockType, Command } from '@cp/shared';
import { NAME_BLOCK } from '../maze.constants';

/**
 * Parse a Blockly workspace into a typed command tree. This is the ONLY bridge
 * between Blockly and the engine — it walks the block model directly (never the
 * JS generator), so the output is a safe, constrained data structure.
 */
export function workspaceToAst(workspace: Blockly.Workspace): Command[] {
  // The program is the first top-level block stack on the canvas.
  const topBlocks = workspace.getTopBlocks(true).filter((b) => b.isEnabled());
  const root = topBlocks[0];
  return root ? walkChain(root) : [];
}

/** Walk a connected chain of statement blocks (via getNextBlock). */
function walkChain(first: Blockly.Block | null): Command[] {
  const commands: Command[] = [];
  let block: Blockly.Block | null = first;
  while (block) {
    if (block.isEnabled() && !block.isShadow()) {
      const cmd = blockToCommand(block);
      if (cmd) commands.push(cmd);
    }
    block = block.getNextBlock();
  }
  return commands;
}

function blockToCommand(block: Blockly.Block): Command | null {
  const type = NAME_BLOCK[block.type];
  switch (type) {
    case BlockType.MOVE_FORWARD:
    case BlockType.TURN_LEFT:
    case BlockType.TURN_RIGHT:
      return { type } as Command;
    case BlockType.REPEAT: {
      const times = Math.trunc(Number(block.getFieldValue('TIMES')) || 0);
      const bodyTop = block.getInputTargetBlock('BODY');
      return { type: BlockType.REPEAT, times, body: walkChain(bodyTop) };
    }
    default:
      // Unknown block — ignore it; the validator will reject anything illegal.
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

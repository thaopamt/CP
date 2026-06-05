import * as Blockly from 'blockly/core';
import * as Vi from 'blockly/msg/vi';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { BlockType, Command, countBlocks } from '@cp/shared';

import { registerMazeBlocks } from './blockly/blocks';
import { buildToolbox } from './blockly/toolbox';
import { getWorkspaceXml, loadWorkspaceXml, workspaceToAst } from './blockly/workspace-to-ast';

// Blockly needs its locale messages loaded once.
Blockly.setLocale(Vi as unknown as Record<string, string>);

export interface MazeBlocklyEditorHandle {
  getAst(): Command[];
  getXml(): string;
  getBlockCount(): number;
  clear(): void;
}

interface Props {
  allowedBlocks: BlockType[];
  /** Blockly block id to highlight while the maze animation is executing. */
  activeBlockId?: string | null;
  /** Notified with the current block count whenever the workspace changes. */
  onBlockCountChange?: (count: number) => void;
  /** Notified with the parsed program + workspace XML on change. */
  onProgramChange?: (ast: Command[], xml: string) => void;
  initialXml?: string;
}

export const MazeBlocklyEditor = forwardRef<MazeBlocklyEditorHandle, Props>(
  ({ allowedBlocks, activeBlockId = null, onBlockCountChange, onProgramChange, initialXml }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    useImperativeHandle(ref, () => ({
      getAst: () => (workspaceRef.current ? workspaceToAst(workspaceRef.current) : []),
      getXml: () => (workspaceRef.current ? getWorkspaceXml(workspaceRef.current) : ''),
      getBlockCount: () =>
        workspaceRef.current ? countBlocks(workspaceToAst(workspaceRef.current)) : 0,
      clear: () => {
        workspaceRef.current?.highlightBlock(null);
        workspaceRef.current?.clear();
      },
    }));

    useEffect(() => {
      workspaceRef.current?.highlightBlock(activeBlockId);
    }, [activeBlockId]);

    useEffect(() => {
      if (!containerRef.current) return;
      registerMazeBlocks();

      const workspace = Blockly.inject(containerRef.current, {
        toolbox: buildToolbox(allowedBlocks),
        trashcan: true,
        scrollbars: true,
        horizontalLayout: false,
        renderer: 'zelos', // chunky, kid-friendly blocks
        zoom: { controls: true, wheel: true, startScale: 0.7, minScale: 0.4, maxScale: 1.5, scaleSpeed: 1.1 },
        move: { scrollbars: true, drag: true, wheel: false },
      });
      workspaceRef.current = workspace;
      
      const toolbox = workspace.getToolbox();
      if (toolbox) {
        const flyout = toolbox.getFlyout() as any;
        if (flyout) {
          flyout.autoClose = false;
        }
      }

      if (initialXml) {
        try {
          loadWorkspaceXml(workspace, initialXml);
        } catch {
          /* ignore malformed saved XML */
        }
      }

      // Ensure exactly one fixed, undeletable "Khi bắt đầu" root exists.
      let start = workspace.getBlocksByType('maze_start', false)[0];
      if (!start) {
        start = workspace.newBlock('maze_start');
        (start as Blockly.BlockSvg).initSvg();
        (start as Blockly.BlockSvg).render();
        start.moveBy(24, 24);
      }
      start.setDeletable(false);
      start.setMovable(true);

      const onChange = () => {
        const ast = workspaceToAst(workspace);
        onBlockCountChange?.(countBlocks(ast));
        onProgramChange?.(ast, getWorkspaceXml(workspace));
      };
      workspace.addChangeListener(onChange);
      onChange();

      // Keep the workspace sized to its (flexible) container.
      const ro = new ResizeObserver(() => Blockly.svgResize(workspace));
      ro.observe(containerRef.current);

      return () => {
        ro.disconnect();
        workspace.removeChangeListener(onChange);
        workspace.dispose();
        workspaceRef.current = null;
      };
      // Rebuild only when the toolbox set changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedBlocks.join(',')]);

    return <div ref={containerRef} className="h-full w-full" />;
  },
);

MazeBlocklyEditor.displayName = 'MazeBlocklyEditor';

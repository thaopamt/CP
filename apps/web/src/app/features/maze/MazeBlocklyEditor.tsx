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
  /** Notified with the current block count whenever the workspace changes. */
  onBlockCountChange?: (count: number) => void;
  initialXml?: string;
}

export const MazeBlocklyEditor = forwardRef<MazeBlocklyEditorHandle, Props>(
  ({ allowedBlocks, onBlockCountChange, initialXml }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    useImperativeHandle(ref, () => ({
      getAst: () => (workspaceRef.current ? workspaceToAst(workspaceRef.current) : []),
      getXml: () => (workspaceRef.current ? getWorkspaceXml(workspaceRef.current) : ''),
      getBlockCount: () =>
        workspaceRef.current ? countBlocks(workspaceToAst(workspaceRef.current)) : 0,
      clear: () => workspaceRef.current?.clear(),
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      registerMazeBlocks();

      const workspace = Blockly.inject(containerRef.current, {
        toolbox: buildToolbox(allowedBlocks),
        trashcan: true,
        scrollbars: true,
        horizontalLayout: false,
        renderer: 'zelos', // chunky, kid-friendly blocks
        zoom: { controls: true, wheel: false, startScale: 1.0 },
        move: { scrollbars: true, drag: true, wheel: false },
      });
      workspaceRef.current = workspace;

      if (initialXml) {
        try {
          loadWorkspaceXml(workspace, initialXml);
        } catch {
          /* ignore malformed saved XML */
        }
      }

      const onChange = () => {
        onBlockCountChange?.(countBlocks(workspaceToAst(workspace)));
      };
      workspace.addChangeListener(onChange);
      onChange();

      return () => {
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

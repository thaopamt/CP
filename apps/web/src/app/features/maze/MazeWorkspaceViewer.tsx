import * as Blockly from 'blockly/core';
import * as Vi from 'blockly/msg/vi';
import { useEffect, useRef } from 'react';

import { registerMazeBlocks } from './blockly/blocks';
import { loadWorkspaceXml } from './blockly/workspace-to-ast';

Blockly.setLocale(Vi as unknown as Record<string, string>);

interface Props {
  /** Blockly workspace XML to render (read-only). */
  xml: string;
  className?: string;
}

/**
 * Read-only Blockly viewer used by the live monitor to show a student's actual
 * blocks (not just text). Injects one read-only workspace and reloads it from
 * the XML whenever it changes — no editing, no toolbox.
 */
export function MazeWorkspaceViewer({ xml, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    registerMazeBlocks();

    const workspace = Blockly.inject(containerRef.current, {
      readOnly: true,
      renderer: 'zelos',
      scrollbars: true,
      // maxScale caps how far zoomToFit can zoom in → blocks stay compact.
      zoom: { controls: false, wheel: false, startScale: 0.55, minScale: 0.2, maxScale: 0.65 },
      move: { scrollbars: true, drag: true, wheel: false },
    });
    wsRef.current = workspace;

    const ro = new ResizeObserver(() => Blockly.svgResize(workspace));
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      workspace.dispose();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    ws.clear();
    try {
      if (xml) loadWorkspaceXml(ws, xml);
    } catch {
      /* malformed/partial XML mid-stream — ignore */
    }
    Blockly.svgResize(ws);
    // Fit all blocks into view.
    try {
      ws.zoomToFit();
    } catch {
      /* zoomToFit can throw on an empty workspace */
    }
  }, [xml]);

  return <div ref={containerRef} className={className ?? 'h-full w-full'} />;
}

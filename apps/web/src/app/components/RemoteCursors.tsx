import { useEffect, useRef, useState } from 'react';

export interface RemoteCursor {
  name: string;
  offset: number;
  color: string; // e.g. '#a78bfa' for violet, '#34d399' for emerald
}

interface RemoteCursorsProps {
  cursors: RemoteCursor[];
  code: string;
  /** The scrollable container that wraps the editor */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  lineHeight?: number;
  paddingTop?: number;
  paddingLeft?: number;
}

function offsetToLineCol(code: string, offset: number) {
  const clamped = Math.max(0, Math.min(offset, code.length));
  const before = code.slice(0, clamped);
  const lines = before.split('\n');
  return { line: lines.length - 1, col: lines[lines.length - 1].length };
}

/** Measure monospace character width once */
function measureCharWidth(): number {
  const span = document.createElement('span');
  span.style.fontFamily =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  span.style.fontSize = '13px';
  span.style.position = 'absolute';
  span.style.visibility = 'hidden';
  span.style.whiteSpace = 'pre';
  span.textContent = 'XXXXXXXXXXXXXXXXXXXX'; // 20 chars for accuracy
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width / 20;
  document.body.removeChild(span);
  return width;
}

let _cachedCharWidth: number | null = null;
function getCharWidth() {
  if (_cachedCharWidth === null) {
    _cachedCharWidth = measureCharWidth();
  }
  return _cachedCharWidth;
}

export default function RemoteCursors({
  cursors,
  code,
  scrollContainerRef,
  lineHeight = 20,
  paddingTop = 16,
  paddingLeft = 16,
}: RemoteCursorsProps) {
  const charWidth = getCharWidth();
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const rafRef = useRef(0);

  // Track scroll position of the container
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScroll({ top: el.scrollTop, left: el.scrollLeft });
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Seed initial
    setScroll({ top: el.scrollTop, left: el.scrollLeft });

    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollContainerRef]);

  if (cursors.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {cursors.map((cursor) => {
        const { line, col } = offsetToLineCol(code, cursor.offset);
        const top = line * lineHeight + paddingTop - scroll.top;
        const left = col * charWidth + paddingLeft - scroll.left;

        return (
          <div
            key={cursor.name}
            style={{
              position: 'absolute',
              top,
              left,
              transition: 'top 80ms ease-out, left 80ms ease-out',
            }}
          >
            {/* Cursor line */}
            <div
              style={{
                width: 2,
                height: lineHeight,
                backgroundColor: cursor.color,
                borderRadius: 1,
                animation: 'remoteCursorBlink 1.2s ease-in-out infinite',
              }}
            />
            {/* Name label */}
            <div
              style={{
                position: 'absolute',
                bottom: lineHeight,
                left: 0,
                backgroundColor: cursor.color,
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Inter, system-ui, sans-serif',
                padding: '1px 5px',
                borderRadius: '3px 3px 3px 0',
                whiteSpace: 'nowrap',
                lineHeight: '14px',
                opacity: 0.95,
              }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}

      {/* Blink animation */}
      <style>{`
        @keyframes remoteCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

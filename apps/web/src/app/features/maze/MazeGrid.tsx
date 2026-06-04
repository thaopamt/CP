import { Cell, Direction, GridConfig } from '@cp/shared';
import { CELL_SIZE, DIR_ROTATION } from './maze.constants';

interface Props {
  grid: GridConfig;
  charPos: Cell;
  charDir: Direction;
  /** Briefly flash the character red when it crashes into a wall / boundary. */
  crashed?: boolean;
  /** Items still on the board (overrides grid.items during animation). */
  items?: Cell[];
  /** Editable mode: clicking a cell calls onCellClick (used by the admin builder). */
  onCellClick?: (cell: Cell) => void;
}

const wallKey = (c: Cell) => `${c.x},${c.y}`;

/** Pure SVG renderer of the maze playfield + character. */
export function MazeGrid({ grid, charPos, charDir, crashed, items, onCellClick }: Props) {
  const w = grid.width * CELL_SIZE;
  const h = grid.height * CELL_SIZE;
  const walls = new Set(grid.walls.map(wallKey));
  const itemCells = items ?? grid.items ?? [];

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) cells.push({ x, y });
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full border border-outline-variant bg-emerald-50"
      style={{ maxWidth: w, maxHeight: '100%' }}
    >
      {cells.map((c) => {
        const isWall = walls.has(wallKey(c));
        return (
          <rect
            key={wallKey(c)}
            x={c.x * CELL_SIZE}
            y={c.y * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            className={isWall ? 'fill-slate-700' : 'fill-emerald-100'}
            stroke="#a7f3d0"
            strokeWidth={1}
            onClick={onCellClick ? () => onCellClick(c) : undefined}
            style={onCellClick ? { cursor: 'pointer' } : undefined}
          />
        );
      })}

      {/* Items */}
      {itemCells.map((it) => (
        <text
          key={`item-${wallKey(it)}`}
          x={it.x * CELL_SIZE + CELL_SIZE / 2}
          y={it.y * CELL_SIZE + CELL_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={CELL_SIZE * 0.5}
          style={{ pointerEvents: 'none' }}
        >
          💎
        </text>
      ))}

      {/* Goal */}
      <text
        x={grid.goal.x * CELL_SIZE + CELL_SIZE / 2}
        y={grid.goal.y * CELL_SIZE + CELL_SIZE / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={CELL_SIZE * 0.6}
        style={{ pointerEvents: 'none' }}
      >
        ⭐
      </text>

      {/* Character */}
      <g
        transform={`translate(${charPos.x * CELL_SIZE + CELL_SIZE / 2}, ${
          charPos.y * CELL_SIZE + CELL_SIZE / 2
        }) rotate(${DIR_ROTATION[charDir]})`}
        style={{ transition: 'all 0.25s ease', pointerEvents: 'none' }}
      >
        {/* Direction arrow (points "up" = north in local coords, rotates with the group). */}
        {!crashed && (
          <polygon
            points={`0,${-CELL_SIZE * 0.42} ${-CELL_SIZE * 0.12},${-CELL_SIZE * 0.26} ${
              CELL_SIZE * 0.12
            },${-CELL_SIZE * 0.26}`}
            className="fill-primary"
          />
        )}
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={CELL_SIZE * 0.62}
          opacity={crashed ? 0.45 : 1}
        >
          {crashed ? '💥' : '🤖'}
        </text>
      </g>
    </svg>
  );
}

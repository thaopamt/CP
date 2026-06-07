import { Cell, Direction, GridConfig, ItemTheme, MonsterKind, MonsterView, monsterViewsAt } from '@cp/shared';
import { CELL_SIZE, DIR_ROTATION } from './maze.constants';

interface Props {
  grid: GridConfig;
  charPos: Cell;
  charDir: Direction;
  /** Briefly flash the character red when it crashes into a wall / boundary / monster. */
  crashed?: boolean;
  /** Items still on the board (overrides grid.items during animation). Duplicate
   *  coordinates encode the remaining quantity in a cell. */
  items?: Cell[];
  /** Monster snapshots (overrides the grid's start positions during animation). */
  monsters?: MonsterView[];
  /** Unopened mystery-box positions (overrides grid.boxes during animation). */
  boxes?: Cell[];
  /** Editable mode: clicking a cell calls onCellClick (used by the admin builder). */
  onCellClick?: (cell: Cell) => void;
}

const wallKey = (c: Cell) => `${c.x},${c.y}`;

const ITEM_EMOJI: Record<ItemTheme, string> = {
  star: '⭐', gem: '💎', crop: '🌱', coin: '🪙', fruit: '🍎', key: '🔑',
};

const MONSTER_EMOJI: Record<MonsterKind, string> = {
  static: '👹', patrol: '👹', chaser: '👾', guard: '💂', sleeper: '👹',
};

/** Pure SVG renderer of the maze playfield + character + monsters + mystery boxes. */
export function MazeGrid({ grid, charPos, charDir, crashed, items, monsters, boxes, onCellClick }: Props) {
  const w = grid.width * CELL_SIZE;
  const h = grid.height * CELL_SIZE;
  const walls = new Set(grid.walls.map(wallKey));
  const itemCells = items ?? grid.items ?? [];
  // Collect-all levels win by emptying the board (no goal star to show).
  const collectAll = !!grid.collectAll;
  const defaultTheme: ItemTheme = grid.itemTheme ?? (collectAll ? 'crop' : 'gem');
  const itemEmojiAt = (c: Cell): string =>
    ITEM_EMOJI[grid.itemKindAt?.[wallKey(c)] ?? defaultTheme];
  const monsterViews = monsters ?? monsterViewsAt(grid, 0);
  const boxCells = boxes ?? (grid.boxes ?? []).map((b) => ({ x: b.x, y: b.y }));

  // Group items by cell so a stacked cell shows one icon + a "×N" badge.
  const itemGroups = new Map<string, { cell: Cell; n: number }>();
  for (const it of itemCells) {
    const k = wallKey(it);
    const entry = itemGroups.get(k);
    if (entry) entry.n += 1;
    else itemGroups.set(k, { cell: it, n: 1 });
  }

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

      {/* Items (with a ×N badge when a cell holds more than one). */}
      {Array.from(itemGroups.values()).map(({ cell, n }) => (
        <g key={`item-${wallKey(cell)}`} style={{ pointerEvents: 'none' }}>
          <text
            x={cell.x * CELL_SIZE + CELL_SIZE / 2}
            y={cell.y * CELL_SIZE + CELL_SIZE / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={CELL_SIZE * 0.5}
          >
            {itemEmojiAt(cell)}
          </text>
          {n > 1 && (
            <text
              x={cell.x * CELL_SIZE + CELL_SIZE * 0.78}
              y={cell.y * CELL_SIZE + CELL_SIZE * 0.26}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={CELL_SIZE * 0.3}
              fontWeight="bold"
              className="fill-amber-600"
            >
              ×{n}
            </text>
          )}
        </g>
      ))}

      {/* Mystery boxes — content stays hidden ("?"). */}
      {boxCells.map((b) => (
        <g key={`box-${wallKey(b)}`} style={{ pointerEvents: 'none' }}>
          <rect
            x={b.x * CELL_SIZE + CELL_SIZE * 0.2}
            y={b.y * CELL_SIZE + CELL_SIZE * 0.2}
            width={CELL_SIZE * 0.6}
            height={CELL_SIZE * 0.6}
            rx={CELL_SIZE * 0.1}
            className="fill-amber-400 stroke-amber-600"
            strokeWidth={2}
          />
          <text
            x={b.x * CELL_SIZE + CELL_SIZE / 2}
            y={b.y * CELL_SIZE + CELL_SIZE / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={CELL_SIZE * 0.4}
            fontWeight="bold"
            className="fill-white"
          >
            ?
          </text>
        </g>
      ))}

      {/* Goal (classic levels only — collect-all levels win by emptying the board) */}
      {!collectAll && (
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
      )}

      {/* Monsters (skin by skill; sleeping ones show as harmless). */}
      {monsterViews.map((m, i) => (
        <text
          key={`monster-${i}-${wallKey(m)}`}
          x={m.x * CELL_SIZE + CELL_SIZE / 2}
          y={m.y * CELL_SIZE + CELL_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={CELL_SIZE * 0.6}
          opacity={m.asleep ? 0.55 : 1}
          style={{ pointerEvents: 'none', transition: 'all 0.25s ease' }}
        >
          {m.asleep ? '😴' : MONSTER_EMOJI[m.kind]}
        </text>
      ))}

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

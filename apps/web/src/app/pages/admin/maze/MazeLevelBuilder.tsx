import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon } from '@cp/ui';
import {
  BlockType,
  Cell,
  Direction,
  GridConfig,
  ICreateMazeLevelPayload,
  PublishStatus,
} from '@cp/shared';

import { useClassesList } from '../../../api/class.queries';
import { useCoursesList } from '../../../api/curriculum.queries';
import { MazeGrid } from '../../../features/maze/MazeGrid';

export interface MazeLevelDraft {
  title: string;
  description: string;
  gridConfig: GridConfig;
  allowedBlocks: BlockType[];
  maxBlocks: number | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: PublishStatus;
  courseId: string | null;
  order: number;
  classIds: string[];
}

export const emptyDraft = (): MazeLevelDraft => ({
  title: '',
  description: '',
  gridConfig: {
    width: 5,
    height: 5,
    walls: [],
    start: { x: 0, y: 0 },
    startDir: Direction.EAST,
    goal: { x: 4, y: 4 },
    items: [],
  },
  allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT],
  maxBlocks: null,
  difficulty: 'EASY',
  status: PublishStatus.DRAFT,
  courseId: null,
  order: 0,
  classIds: [],
});

type PaintMode = 'wall' | 'start' | 'goal' | 'item';

const ALL_BLOCKS: BlockType[] = [
  BlockType.MOVE_FORWARD,
  BlockType.TURN_LEFT,
  BlockType.TURN_RIGHT,
  BlockType.REPEAT,
  BlockType.FOREVER,
  BlockType.WHILE,
  BlockType.IF,
  BlockType.BREAK,
  BlockType.CONDITION,
  BlockType.LOGIC,
  BlockType.MATH,
  BlockType.VARIABLE,
];

const DIRECTIONS: { dir: Direction; icon: string }[] = [
  { dir: Direction.NORTH, icon: 'north' },
  { dir: Direction.EAST, icon: 'east' },
  { dir: Direction.SOUTH, icon: 'south' },
  { dir: Direction.WEST, icon: 'west' },
];

interface Props {
  draft: MazeLevelDraft;
  onChange: (draft: MazeLevelDraft) => void;
  onSave: (payload: ICreateMazeLevelPayload) => void;
  saving?: boolean;
}

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

export function MazeLevelBuilder({ draft, onChange, onSave, saving }: Props) {
  const { t } = useTranslation();
  const [paintMode, setPaintMode] = useState<PaintMode>('wall');

  const { data: classesData } = useClassesList({ page: 1, limit: 100 });
  const classes = classesData?.items ?? [];
  const { data: coursesData } = useCoursesList({ page: 1, limit: 100 });
  const courses = coursesData?.items ?? [];

  const grid = draft.gridConfig;
  const set = (patch: Partial<MazeLevelDraft>) => onChange({ ...draft, ...patch });
  const setGrid = (patch: Partial<GridConfig>) => set({ gridConfig: { ...grid, ...patch } });

  const resizeWithin = (cell: Cell, w: number, h: number) =>
    cell.x < w && cell.y < h ? cell : { x: Math.min(cell.x, w - 1), y: Math.min(cell.y, h - 1) };

  const handleResize = (width: number, height: number) => {
    const w = Math.max(1, Math.min(12, width));
    const h = Math.max(1, Math.min(12, height));
    setGrid({
      width: w,
      height: h,
      walls: grid.walls.filter((c) => c.x < w && c.y < h),
      start: resizeWithin(grid.start, w, h),
      goal: resizeWithin(grid.goal, w, h),
    });
  };

  const items = grid.items ?? [];

  const handleCellClick = (cell: Cell) => {
    if (paintMode === 'start') {
      if (sameCell(cell, grid.goal)) return;
      setGrid({ start: cell, walls: grid.walls.filter((w) => !sameCell(w, cell)) });
      return;
    }
    if (paintMode === 'goal') {
      if (sameCell(cell, grid.start)) return;
      setGrid({ goal: cell, walls: grid.walls.filter((w) => !sameCell(w, cell)) });
      return;
    }
    if (paintMode === 'item') {
      if (sameCell(cell, grid.start) || sameCell(cell, grid.goal)) return;
      const exists = items.some((w) => sameCell(w, cell));
      setGrid({
        items: exists ? items.filter((w) => !sameCell(w, cell)) : [...items, cell],
        walls: grid.walls.filter((w) => !sameCell(w, cell)),
      });
      return;
    }
    // wall toggle — but never on start/goal/item
    if (sameCell(cell, grid.start) || sameCell(cell, grid.goal)) return;
    const exists = grid.walls.some((w) => sameCell(w, cell));
    setGrid({
      walls: exists ? grid.walls.filter((w) => !sameCell(w, cell)) : [...grid.walls, cell],
      items: items.filter((w) => !sameCell(w, cell)),
    });
  };

  const toggleBlock = (b: BlockType) => {
    const has = draft.allowedBlocks.includes(b);
    set({
      allowedBlocks: has
        ? draft.allowedBlocks.filter((x) => x !== b)
        : [...draft.allowedBlocks, b],
    });
  };

  // Quick solvability hint for the author (does the goal sit on a wall, etc.).
  const reachableHint = useMemo(() => {
    if (sameCell(grid.start, grid.goal)) return t('maze.builder.warnSameCell');
    if (grid.walls.some((w) => sameCell(w, grid.goal))) return t('maze.builder.warnGoalWall');
    return null;
  }, [grid, t]);

  const canSave = draft.title.trim().length > 0 && draft.allowedBlocks.length > 0 && !reachableHint;

  const handleSave = () => {
    onSave({
      title: draft.title.trim(),
      description: draft.description,
      gridConfig: grid,
      allowedBlocks: draft.allowedBlocks,
      maxBlocks: draft.maxBlocks,
      difficulty: draft.difficulty,
      status: draft.status,
      courseId: draft.courseId,
      order: draft.order,
      classIds: draft.classIds,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      {/* ── Left: form fields ─────────────────────────────────── */}
      <div className="flex flex-col gap-md">
        <Card className="p-5 flex flex-col gap-4">
          <Field label={t('maze.builder.titleLabel')}>
            <input
              className="w-full rounded-lg border border-outline-variant px-3 py-2"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={t('maze.builder.titlePlaceholder')}
            />
          </Field>
          <Field label={t('maze.builder.descriptionLabel')}>
            <textarea
              className="w-full rounded-lg border border-outline-variant px-3 py-2"
              rows={2}
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('maze.builder.difficulty')}>
              <select
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
                value={draft.difficulty}
                onChange={(e) => set({ difficulty: e.target.value as MazeLevelDraft['difficulty'] })}
              >
                <option value="EASY">{t('enums.difficultyLevel.EASY')}</option>
                <option value="MEDIUM">{t('enums.difficultyLevel.MEDIUM')}</option>
                <option value="HARD">{t('enums.difficultyLevel.HARD')}</option>
              </select>
            </Field>
            <Field label={t('maze.builder.status')}>
              <select
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
                value={draft.status}
                onChange={(e) => set({ status: e.target.value as PublishStatus })}
              >
                <option value={PublishStatus.DRAFT}>{t('maze.builder.draft')}</option>
                <option value={PublishStatus.PUBLISHED}>{t('maze.builder.published')}</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('maze.builder.width')}>
              <input
                type="number"
                min={1}
                max={12}
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
                value={grid.width}
                onChange={(e) => handleResize(Number(e.target.value), grid.height)}
              />
            </Field>
            <Field label={t('maze.builder.height')}>
              <input
                type="number"
                min={1}
                max={12}
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
                value={grid.height}
                onChange={(e) => handleResize(grid.width, Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label={t('maze.builder.startDir')}>
            <div className="flex gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.dir}
                  onClick={() => setGrid({ startDir: d.dir })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                    grid.startDir === d.dir
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  <Icon name={d.icon} />
                </button>
              ))}
            </div>
          </Field>

          <Field label={t('maze.builder.allowedBlocks')}>
            <div className="flex flex-wrap gap-2">
              {ALL_BLOCKS.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBlock(b)}
                  className={`rounded-full px-3 py-1.5 text-label-sm font-semibold border ${
                    draft.allowedBlocks.includes(b)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  {t(`maze.blocks.${b}`)}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('maze.builder.maxBlocks')}>
              <input
                type="number"
                min={1}
                placeholder={t('maze.builder.unlimited')}
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
                value={draft.maxBlocks ?? ''}
                onChange={(e) =>
                  set({ maxBlocks: e.target.value === '' ? null : Math.max(1, Number(e.target.value)) })
                }
              />
            </Field>
            <Field label={t('maze.builder.order')}>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
                value={draft.order}
                onChange={(e) => set({ order: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label={t('maze.builder.course')}>
            <select
              className="w-full rounded-lg border border-outline-variant px-3 py-2"
              value={draft.courseId ?? ''}
              onChange={(e) => set({ courseId: e.target.value || null })}
            >
              <option value="">{t('maze.builder.noCourse')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('maze.builder.classes')}>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {classes.map((c) => {
                const on = draft.classIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      set({
                        classIds: on
                          ? draft.classIds.filter((id) => id !== c.id)
                          : [...draft.classIds, c.id],
                      })
                    }
                    className={`rounded-full px-3 py-1.5 text-label-sm border ${
                      on
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-label-sm text-on-surface-variant">{t('maze.builder.classesHint')}</p>
          </Field>
        </Card>
      </div>

      {/* ── Right: interactive grid editor ────────────────────── */}
      <div className="flex flex-col gap-md">
        <Card className="p-5 flex flex-col items-center gap-4">
          <div className="flex gap-2 self-start">
            {(['wall', 'start', 'goal', 'item'] as PaintMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setPaintMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-label-sm font-semibold border ${
                  paintMode === mode
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant text-on-surface-variant'
                }`}
              >
                {t(`maze.builder.paint.${mode}`)}
              </button>
            ))}
          </div>

          <div className="grid place-items-center w-full overflow-auto">
            <MazeGrid
              grid={grid}
              charPos={grid.start}
              charDir={grid.startDir}
              onCellClick={handleCellClick}
            />
          </div>
          <p className="text-label-sm text-on-surface-variant text-center">
            {t(`maze.builder.paintHint.${paintMode}`)}
          </p>

          {reachableHint && (
            <div className="w-full rounded-lg bg-amber-100 text-amber-800 px-3 py-2 text-label-sm text-center">
              {reachableHint}
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button variant="admin" size="lg" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? t('maze.builder.saving') : t('maze.builder.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-semibold text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

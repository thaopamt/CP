import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, useConfirm, useToast } from '@cp/ui';
import { SimFailReason, simulate, validateCommands, BlockType } from '@cp/shared';

import { useStudentMazeLevel, useStudentMazeLevels, useSubmitMaze } from '../../../api/maze.queries';
import { useLiveCodingSync } from '../../../hooks/useLiveCodingSync';
import { MazeBlocklyEditor, MazeBlocklyEditorHandle } from '../../../features/maze/MazeBlocklyEditor';
import { MazeGrid } from '../../../features/maze/MazeGrid';
import { useMazeAnimation } from '../../../features/maze/useMazeAnimation';
import { CompletionRankingInfo } from '../../../components/CompletionRankingInfo';

type Outcome =
  | { kind: 'success' }
  | { kind: 'fail'; reason: SimFailReason }
  | null;

type MazeProgressStatus = 'accepted' | 'wrong' | 'idle';
type MazeProgressItem = {
  id: string;
  title: string;
  status: MazeProgressStatus;
};

const MAX_RANDOM_SEED = 0x7fffffff;
const createMazeRunSeed = () => Math.floor(Math.random() * (MAX_RANDOM_SEED + 1));

function MazeProgressDots({
  items,
  currentLevelId,
  onSelect,
}: {
  items: MazeProgressItem[];
  currentLevelId?: string;
  onSelect: (item: MazeProgressItem) => void;
}) {
  const [hoverInfo, setHoverInfo] = useState<{ title: string; index: number; x: number; y: number } | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <nav
        aria-label="Maze progress"
        className="mx-3 flex min-w-[96px] flex-1 justify-center overflow-hidden"
      >
        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-outline-variant bg-surface-container-low px-1.5 py-1 shadow-sm hide-scrollbar">
          {items.map((item, index) => {
            const isCurrent = item.id === currentLevelId;
            const statusClass = {
              accepted: 'border-emerald-500 bg-emerald-500 text-white',
              wrong: 'border-amber-500 bg-amber-500 text-white',
              idle: 'border-outline bg-surface-container-highest text-on-surface-variant',
            }[item.status];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoverInfo({
                    title: item.title,
                    index,
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 8,
                  });
                }}
                onMouseLeave={() => setHoverInfo(null)}
                aria-label={`Bàn ${index + 1}: ${item.title}${isCurrent ? ' đang làm' : ''}`}
                className={`flex items-center justify-center shrink-0 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/70 ${
                  isCurrent ? 'w-6 h-6 text-[11px] font-bold scale-110 ring-2 ring-primary/50 ring-offset-1' : 'w-3 h-3'
                } ${statusClass}`}
              >
                {isCurrent ? index + 1 : null}
              </button>
            );
          })}
        </div>
      </nav>

      {hoverInfo && (
        <div
          className="fixed z-[100] pointer-events-none -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <span className="text-emerald-400 mr-1.5">{hoverInfo.title}</span>
        </div>
      )}
    </>
  );
}

export default function MazeSolvePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const { data: level, isLoading, isError } = useStudentMazeLevel(levelId);
  const { data: assignedLevels = [] } = useStudentMazeLevels();
  const submitMutation = useSubmitMaze();

  const editorRef = useRef<MazeBlocklyEditorHandle>(null);
  const [blockCount, setBlockCount] = useState(0);
  const [workspaceXml, setWorkspaceXml] = useState('');
  const [outcome, setOutcome] = useState<Outcome>(null);

  // Stream the student's Blockly workspace XML into the live monitor so teachers
  // can see the actual blocks (rendered read-only on the monitor side).
  useLiveCodingSync(levelId, workspaceXml, 'maze', 0, {
    title: level?.title ? `🧩 ${level.title}` : undefined,
    description: level?.description,
  });

  const grid = level?.gridConfig;
  const animation = useMazeAnimation(grid, level?.id);
  const varEntries = Object.entries(animation.vars);
  const currentCourseLevels = useMemo(() => {
    if (!level) return [];
    return assignedLevels.filter((l) => l.courseId === level.courseId);
  }, [assignedLevels, level]);

  const nextLevel = useMemo(() => {
    const currentIndex = currentCourseLevels.findIndex((candidate) => candidate.id === levelId);
    return currentIndex >= 0 ? currentCourseLevels[currentIndex + 1] ?? null : null;
  }, [currentCourseLevels, levelId]);

  const mazeProgressItems = useMemo<MazeProgressItem[]>(() => {
    return currentCourseLevels.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.solved ? 'accepted' : (l.attempts ?? 0) > 0 ? 'wrong' : 'idle',
    }));
  }, [currentCourseLevels]);

  const overLimit = level?.maxBlocks != null && blockCount > level.maxBlocks;
  const [pendingNextPrompt, setPendingNextPrompt] = useState(false);

  const promptNextLevel = useCallback(async () => {
    const shouldMoveNext = await confirm({
      title: 'Hoàn thành mê cung!',
      message: (
        <div>
          {nextLevel ? (
            <span>
              Em đã giải đúng bàn này. Bàn tiếp theo là{' '}
              <span className="font-semibold text-on-surface">{nextLevel.title}</span>.
            </span>
          ) : (
            <span>Em đã giải đúng bàn này. Hiện chưa có bàn tiếp theo trong danh sách đang giao.</span>
          )}
          <CompletionRankingInfo />
        </div>
      ),
      confirmLabel: nextLevel ? 'Làm bàn tiếp theo' : 'Về danh sách mê cung',
      cancelLabel: 'Ở lại',
      intent: 'primary',
    });

    if (shouldMoveNext) {
      navigate(nextLevel ? `/student/maze/${nextLevel.id}` : '/student/maze');
    }
  }, [confirm, navigate, nextLevel]);

  useEffect(() => {
    if (!pendingNextPrompt || !animation.done) return;
    setPendingNextPrompt(false);
    void promptNextLevel();
  }, [animation.done, pendingNextPrompt, promptNextLevel]);

  useEffect(() => {
    editorRef.current?.clear();
    setBlockCount(0);
    setWorkspaceXml('');
    setOutcome(null);
    setPendingNextPrompt(false);
  }, [levelId]);

  const failMessage = (reason: SimFailReason): string => {
    switch (reason) {
      case 'HIT_WALL':
        return t('maze.result.hitWall');
      case 'OUT_OF_BOUNDS':
        return t('maze.result.outOfBounds');
      case 'CAUGHT':
        return t('maze.result.caught');
      case 'STEP_LIMIT':
        return t('maze.result.stepLimit');
      default:
        return t('maze.result.notReached');
    }
  };

  const handleRun = () => {
    if (!level || !grid || !editorRef.current) return;
    setOutcome(null);
    setPendingNextPrompt(false);

    const ast = editorRef.current.getAst();
    const validation = validateCommands(
      ast,
      (level.allowedBlocks ?? []) as BlockType[],
      level.maxBlocks ?? null,
      level.gridConfig?.allowedSensors ?? null,
    );
    if (!validation.ok) {
      toast.warning(validation.errors[0]);
      return;
    }

    // Local simulation drives the animation.
    const randomSeed = createMazeRunSeed();
    const result = simulate(grid, ast, { randomSeed });
    animation.play(result);

    // Server re-grades authoritatively; its verdict is final.
    submitMutation.mutate(
      { levelId: level.id, workspaceXml: editorRef.current.getXml(), commandTree: ast, randomSeed },
      {
        onSuccess: (res) => {
          if (res.reachedGoal) {
            setOutcome({ kind: 'success' });
            setPendingNextPrompt(true);
            toast.success(t('maze.result.success'));
          } else {
            setOutcome({ kind: 'fail', reason: res.failReason ?? null });
          }
        },
        onError: () => toast.error(t('maze.result.submitError')),
      },
    );
  };

  const handleReset = () => {
    animation.reset();
    setOutcome(null);
    setPendingNextPrompt(false);
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }
  if (isError || !level || !grid) {
    return <Card className="m-6 p-8 text-center text-on-surface-variant">{t('maze.notFound')}</Card>;
  }

  return (
    <div className="flex flex-col gap-md px-4 lg:px-8 pt-md h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-h-[2.5rem] w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/student/maze')}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary whitespace-nowrap shrink-0 text-sm"
          >
            <Icon name="arrow_back" size={18} /> <span className="hidden sm:inline">{t('maze.back')}</span>
          </button>
          <div className="w-px h-4 bg-outline-variant hidden sm:block shrink-0" />
          <h1 className="font-bold text-title-sm text-on-surface hidden sm:block leading-tight break-words">
            {level.courseTitle || level.title}
          </h1>
        </div>
        
        <div className="flex justify-center min-w-0">
          <MazeProgressDots
            items={mazeProgressItems}
            currentLevelId={levelId}
            onSelect={(item) => {
              if (item.id !== levelId) navigate(`/student/maze/${item.id}`);
            }}
          />
        </div>

        <div className="shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-md flex-1 min-h-0">
        {/* Left: Blockly workspace (60%, stretches to fill) */}
        <Card className="flex flex-col p-0 overflow-hidden min-h-[420px] lg:col-span-3">
          <div className="flex items-center justify-end px-4 py-2 border-b border-outline-variant bg-surface-container-low">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-sm font-bold ${
                overLimit
                  ? 'bg-error/15 text-error'
                  : 'bg-primary/10 text-primary'
              }`}
              title={t('maze.blocksHint')}
            >
              <Icon name="widgets" />
              {level.maxBlocks != null
                ? t('maze.blocksUsed', { used: blockCount, max: level.maxBlocks })
                : t('maze.blocksUsedNoLimit', { used: blockCount })}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <MazeBlocklyEditor
              key={level.id}
              ref={editorRef}
              allowedBlocks={(level.allowedBlocks ?? []) as BlockType[]}
              allowedSensors={level.gridConfig?.allowedSensors}
              activeBlockId={animation.activeBlockId}
              onBlockCountChange={setBlockCount}
              onProgramChange={(_ast, xml) => setWorkspaceXml(xml)}
            />
          </div>
        </Card>

        {/* Right column: top = problem + maze + controls, bottom = guide */}
        <div className="flex flex-col gap-md min-h-0 lg:col-span-2">
        <Card className="flex flex-col items-center gap-md p-5 overflow-y-auto flex-1">
          <p className="text-body-md text-on-surface-variant text-center">{level.description}</p>

          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0 flex items-center justify-center pb-2">
              <MazeGrid
                grid={grid}
                charPos={animation.charPos}
                charDir={animation.charDir}
                crashed={animation.crashed}
                items={animation.items}
                monsters={animation.monsters}
                boxes={animation.boxes}
              />
            </div>

            {/* Floating Outcome Banners */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full px-4 pointer-events-none z-10">
              {outcome?.kind === 'success' && (
                <div className="w-full max-w-sm rounded-2xl bg-emerald-100/95 text-emerald-800 px-4 py-3 text-center font-bold shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                  {t('maze.result.success')}
                </div>
              )}
              {outcome?.kind === 'fail' && (
                <div className="w-full max-w-sm rounded-lg bg-amber-100/95 px-4 py-2 text-center text-sm font-bold leading-tight text-amber-800 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                  {failMessage(outcome.reason)}
                </div>
              )}
              {overLimit && level.maxBlocks != null && !outcome && (
                <div className="w-full max-w-sm rounded-2xl bg-red-100/95 text-red-800 px-4 py-2 text-center text-sm font-bold shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                  {t('maze.overLimit', { max: level.maxBlocks })}
                </div>
              )}
            </div>
          </div>

          {/* Variable watcher */}
          {varEntries.length > 0 && (
            <div className="flex flex-wrap gap-2 w-full justify-center">
              {varEntries.map(([name, value]) => (
                <span
                  key={name}
                  className="rounded-full bg-surface-container-high px-3 py-1 text-label-sm font-semibold text-on-surface"
                >
                  {name} = {value}
                </span>
              ))}
            </div>
          )}

          <div className="w-full grid grid-cols-2 gap-4 mt-auto pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full !rounded-lg border-2 !border-outline-variant !bg-transparent hover:!bg-surface-container-low !text-on-surface-variant font-bold shadow-sm transition-colors"
              leadingIcon={<Icon name="restart_alt" />}
            >
              {t('maze.reset')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRun}
              disabled={animation.isPlaying || submitMutation.isPending || overLimit}
              className="w-full !rounded-lg border-2 !border-emerald-500 !bg-emerald-500 hover:!border-emerald-600 hover:!bg-emerald-600 !text-white font-bold shadow-md hover:shadow-lg transition-all"
              leadingIcon={<Icon name="play_arrow" />}
            >
              {t('maze.run')}
            </Button>
          </div>
        </Card>

        {/* Bottom: guide / hints */}
        <Card className="p-4 overflow-y-auto">
          <h3 className="flex items-center gap-1 font-bold text-on-surface mb-2">
            <Icon name="lightbulb" /> {t('maze.guide.title')}
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-body-md text-on-surface-variant">
            <li>{t('maze.guide.step1')}</li>
            <li>{t('maze.guide.step2')}</li>
            <li>{t('maze.guide.step3')}</li>
          </ol>
          <p className="mt-2 text-label-sm font-semibold text-primary">
            {level.maxBlocks != null
              ? t('maze.guide.limit', { max: level.maxBlocks })
              : t('maze.guide.noLimit')}
          </p>
        </Card>
        </div>
      </div>
    </div>
  );
}

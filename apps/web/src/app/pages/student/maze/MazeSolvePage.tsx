import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, useToast } from '@cp/ui';
import { SimFailReason, simulate, validateCommands, BlockType } from '@cp/shared';

import { useStudentMazeLevel, useSubmitMaze } from '../../../api/maze.queries';
import { useLiveCodingSync } from '../../../hooks/useLiveCodingSync';
import { MazeBlocklyEditor, MazeBlocklyEditorHandle } from '../../../features/maze/MazeBlocklyEditor';
import { MazeGrid } from '../../../features/maze/MazeGrid';
import { useMazeAnimation } from '../../../features/maze/useMazeAnimation';

type Outcome =
  | { kind: 'success' }
  | { kind: 'fail'; reason: SimFailReason }
  | null;

export default function MazeSolvePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: level, isLoading, isError } = useStudentMazeLevel(levelId);
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
  const animation = useMazeAnimation(grid);
  const varEntries = Object.entries(animation.vars);

  const overLimit = level?.maxBlocks != null && blockCount > level.maxBlocks;

  const failMessage = (reason: SimFailReason): string => {
    switch (reason) {
      case 'HIT_WALL':
        return t('maze.result.hitWall');
      case 'OUT_OF_BOUNDS':
        return t('maze.result.outOfBounds');
      case 'STEP_LIMIT':
        return t('maze.result.stepLimit');
      default:
        return t('maze.result.notReached');
    }
  };

  const handleRun = () => {
    if (!level || !grid || !editorRef.current) return;
    setOutcome(null);

    const ast = editorRef.current.getAst();
    const validation = validateCommands(
      ast,
      (level.allowedBlocks ?? []) as BlockType[],
      level.maxBlocks ?? null,
    );
    if (!validation.ok) {
      toast.warning(validation.errors[0]);
      return;
    }

    // Local simulation drives the animation.
    const result = simulate(grid, ast);
    animation.play(result);

    // Server re-grades authoritatively; its verdict is final.
    submitMutation.mutate(
      { levelId: level.id, workspaceXml: editorRef.current.getXml(), commandTree: ast },
      {
        onSuccess: (res) => {
          if (res.reachedGoal) {
            setOutcome({ kind: 'success' });
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
    <div className="flex flex-col gap-md pt-md h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/student/maze')}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary"
        >
          <Icon name="arrow_back" /> {t('maze.back')}
        </button>
        <h1 className="font-bold text-headline-md text-on-surface">{level.title}</h1>
        <div className="w-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-md flex-1 min-h-0">
        {/* Left: Blockly workspace (3/4, stretches to fill) */}
        <Card className="flex flex-col p-0 overflow-hidden min-h-[420px] lg:col-span-3">
          <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-low">
            <span className="text-label-sm font-semibold text-on-surface-variant">
              {t('maze.workspace')}
            </span>
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
              ref={editorRef}
              allowedBlocks={(level.allowedBlocks ?? []) as BlockType[]}
              onBlockCountChange={setBlockCount}
              onProgramChange={(_ast, xml) => setWorkspaceXml(xml)}
            />
          </div>
        </Card>

        {/* Right column: top = problem + maze + controls, bottom = guide */}
        <div className="flex flex-col gap-md min-h-0">
        <Card className="flex flex-col items-center gap-md p-5 overflow-y-auto flex-1 !rounded-none">
          <p className="text-body-md text-on-surface-variant text-center">{level.description}</p>

          <div className="flex-1 grid place-items-center w-full">
            <MazeGrid
              grid={grid}
              charPos={animation.charPos}
              charDir={animation.charDir}
              crashed={animation.crashed}
              items={animation.items}
            />
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

          {/* Outcome banner */}
          {outcome?.kind === 'success' && (
            <div className="w-full rounded-2xl bg-emerald-100 text-emerald-800 px-4 py-3 text-center font-bold">
              {t('maze.result.success')}
            </div>
          )}
          {outcome?.kind === 'fail' && (
            <div className="w-full rounded-2xl bg-amber-100 text-amber-800 px-4 py-3 text-center font-semibold">
              {failMessage(outcome.reason)}
            </div>
          )}

          {overLimit && level.maxBlocks != null && (
            <div className="w-full rounded-2xl bg-error/15 text-error px-4 py-2 text-center text-label-sm font-semibold">
              {t('maze.overLimit', { max: level.maxBlocks })}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={handleReset} leadingIcon={<Icon name="restart_alt" />}>
              {t('maze.reset')}
            </Button>
            <Button
              variant="student"
              size="lg"
              onClick={handleRun}
              disabled={animation.isPlaying || submitMutation.isPending || overLimit}
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

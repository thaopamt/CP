import { useCallback, useEffect, useRef, useState } from 'react';
import { Cell, Direction, GridConfig, MonsterView, monsterViewsAt, SimulationResult } from '@cp/shared';
import { ANIMATION_INTERVAL_MS } from './maze.constants';

interface AnimationState {
  charPos: Cell;
  charDir: Direction;
  crashed: boolean;
  isPlaying: boolean;
  /** Index of the last applied execution frame (-1 = at start). */
  currentStep: number;
  /** Blockly block id for the currently executing frame. */
  activeBlockId: string | null;
  /** True once the whole sequence has finished playing. */
  done: boolean;
  /** Live variable values at the current step. */
  vars: Record<string, number>;
  /** Items still on the board at the current step. */
  items: Cell[];
  /** Monster snapshots at the current step. */
  monsters: MonsterView[];
  /** Unopened mystery-box positions at the current step. */
  boxes: Cell[];
}

/**
 * Drives the step-by-step maze animation from a SimulationResult. The result is
 * produced by the shared engine; this hook only advances a timer and exposes the
 * character's current pose (plus live variables / items) for rendering.
 */
export function useMazeAnimation(grid: GridConfig | undefined, resetKey?: string) {
  const start = grid?.start ?? { x: 0, y: 0 };
  const startDir = grid?.startDir ?? Direction.EAST;
  const startItems = grid?.items ?? [];
  const startMonsters = grid ? monsterViewsAt(grid, 0) : [];
  const startBoxes = (grid?.boxes ?? []).map((b) => ({ x: b.x, y: b.y }));

  const idle = (): AnimationState => ({
    charPos: start,
    charDir: startDir,
    crashed: false,
    isPlaying: false,
    currentStep: -1,
    activeBlockId: null,
    done: false,
    vars: {},
    items: startItems,
    monsters: startMonsters,
    boxes: startBoxes,
  });

  const [state, setState] = useState<AnimationState>(idle);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<SimulationResult | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearTimer();
    resultRef.current = null;
    setState(idle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.x, start.y, startDir, JSON.stringify(startItems), JSON.stringify(startMonsters), JSON.stringify(startBoxes)]);

  const play = useCallback(
    (result: SimulationResult) => {
      clearTimer();
      resultRef.current = result;
      setState({ ...idle(), isPlaying: true });

      let i = 0;
      const tick = () => {
        const currentResult = resultRef.current;
        const frames = currentResult?.trace?.length
          ? currentResult.trace
          : currentResult?.steps ?? [];
        if (i >= frames.length) {
          setState((s) => ({
            ...s,
            isPlaying: false,
            activeBlockId: null,
            done: true,
            vars: result.vars ?? s.vars,
          }));
          return;
        }
        const frame = frames[i];
        setState((s) => ({
          ...s,
          charPos: frame.pos,
          charDir: frame.dir,
          crashed: !!frame.crashed,
          currentStep: i,
          activeBlockId: frame.blockId ?? null,
          vars: frame.vars ?? s.vars,
          items: frame.itemsLeft ?? s.items,
          monsters: frame.monsters ?? s.monsters,
          boxes: frame.boxes ?? s.boxes,
        }));
        i += 1;
        timerRef.current = setTimeout(tick, ANIMATION_INTERVAL_MS);
      };
      timerRef.current = setTimeout(tick, ANIMATION_INTERVAL_MS);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [start.x, start.y, startDir, JSON.stringify(startItems), JSON.stringify(startMonsters), JSON.stringify(startBoxes)],
  );

  // Re-sync the idle pose whenever the level changes. Some levels intentionally
  // share the same start pose, so the route-level key matters too.
  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  useEffect(() => clearTimer, []);

  return { ...state, play, reset };
}

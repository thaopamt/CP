import { useCallback, useEffect, useRef, useState } from 'react';
import { Cell, Direction, GridConfig, SimulationResult } from '@cp/shared';
import { ANIMATION_INTERVAL_MS } from './maze.constants';

interface AnimationState {
  charPos: Cell;
  charDir: Direction;
  crashed: boolean;
  isPlaying: boolean;
  /** Index of the last applied step (-1 = at start). */
  currentStep: number;
  /** True once the whole sequence has finished playing. */
  done: boolean;
  /** Live variable values at the current step. */
  vars: Record<string, number>;
  /** Items still on the board at the current step. */
  items: Cell[];
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

  const idle = (): AnimationState => ({
    charPos: start,
    charDir: startDir,
    crashed: false,
    isPlaying: false,
    currentStep: -1,
    done: false,
    vars: {},
    items: startItems,
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
  }, [start.x, start.y, startDir, JSON.stringify(startItems)]);

  const play = useCallback(
    (result: SimulationResult) => {
      clearTimer();
      resultRef.current = result;
      setState({ ...idle(), isPlaying: true });

      let i = 0;
      const tick = () => {
        const steps = resultRef.current?.steps ?? [];
        if (i >= steps.length) {
          setState((s) => ({ ...s, isPlaying: false, done: true, vars: result.vars ?? s.vars }));
          return;
        }
        const step = steps[i];
        setState((s) => ({
          ...s,
          charPos: step.pos,
          charDir: step.dir,
          crashed: !!step.crashed,
          currentStep: i,
          vars: step.vars ?? s.vars,
          items: step.itemsLeft ?? s.items,
        }));
        i += 1;
        timerRef.current = setTimeout(tick, ANIMATION_INTERVAL_MS);
      };
      timerRef.current = setTimeout(tick, ANIMATION_INTERVAL_MS);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [start.x, start.y, startDir, JSON.stringify(startItems)],
  );

  // Re-sync the idle pose whenever the level changes. Some levels intentionally
  // share the same start pose, so the route-level key matters too.
  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  useEffect(() => clearTimer, []);

  return { ...state, play, reset };
}

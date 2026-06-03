import { useCallback, useEffect, useRef, useState } from 'react';
import { Cell, Direction, SimulationResult } from '@cp/shared';
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
}

/**
 * Drives the step-by-step maze animation from a SimulationResult. The result is
 * produced by the shared engine; this hook only advances a timer and exposes the
 * character's current pose for <MazeGrid> to render.
 */
export function useMazeAnimation(start: Cell, startDir: Direction) {
  const initial: AnimationState = {
    charPos: start,
    charDir: startDir,
    crashed: false,
    isPlaying: false,
    currentStep: -1,
    done: false,
  };
  const [state, setState] = useState<AnimationState>(initial);
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
    setState({
      charPos: start,
      charDir: startDir,
      crashed: false,
      isPlaying: false,
      currentStep: -1,
      done: false,
    });
  }, [start.x, start.y, startDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(
    (result: SimulationResult) => {
      clearTimer();
      resultRef.current = result;
      setState({
        charPos: start,
        charDir: startDir,
        crashed: false,
        isPlaying: true,
        currentStep: -1,
        done: false,
      });

      let i = 0;
      const tick = () => {
        const steps = resultRef.current?.steps ?? [];
        if (i >= steps.length) {
          setState((s) => ({ ...s, isPlaying: false, done: true }));
          return;
        }
        const step = steps[i];
        setState((s) => ({
          ...s,
          charPos: step.pos,
          charDir: step.dir,
          crashed: !!step.crashed,
          currentStep: i,
        }));
        i += 1;
        timerRef.current = setTimeout(tick, ANIMATION_INTERVAL_MS);
      };
      timerRef.current = setTimeout(tick, ANIMATION_INTERVAL_MS);
    },
    [start.x, start.y, startDir], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => clearTimer, []);

  return { ...state, play, reset };
}

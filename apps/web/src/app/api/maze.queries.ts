import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateMazeLevelPayload, IMazeLevel, IStudentMazePath, ISubmitMazePayload } from '@cp/shared';
import { mazeApi } from './maze.api';
import { queryStaleTime } from './query-cache';

export const mazeQueryKeys = {
  all: ['maze-levels'] as const,
  detail: (id: string) => ['maze-levels', 'detail', id] as const,
  assigned: () => ['maze-levels', 'assigned'] as const,
  path: () => ['maze-levels', 'path'] as const,
  studentLevel: (id: string) => ['maze-levels', 'student', id] as const,
  progress: (id: string) => ['maze-levels', 'progress', id] as const,
  progressSummary: () => ['maze-levels', 'progress', 'summary'] as const,
  myResults: (id: string) => ['maze-levels', 'my-submissions', id] as const,
};

// --- Admin ---
export function useMazeLevels() {
  return useQuery({
    queryKey: mazeQueryKeys.all,
    queryFn: () => mazeApi.list().then((res) => res.data),
    staleTime: queryStaleTime.reference,
  });
}

export function useMazeLevel(id?: string) {
  return useQuery({
    queryKey: mazeQueryKeys.detail(id ?? ''),
    queryFn: () => mazeApi.get(id as string).then((res) => res.data),
    enabled: !!id,
    staleTime: queryStaleTime.reference,
  });
}

export function useCreateMazeLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateMazeLevelPayload) => mazeApi.create(payload).then((res) => res.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mazeQueryKeys.all }),
  });
}

export function useUpdateMazeLevel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ICreateMazeLevelPayload>) =>
      mazeApi.update(id, payload).then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.all });
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.detail(id) });
    },
  });
}

export function useDeleteMazeLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mazeApi.remove(id).then((res) => res.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: mazeQueryKeys.all }),
  });
}

export function useMazeProgress(levelId?: string) {
  return useQuery({
    queryKey: mazeQueryKeys.progress(levelId ?? ''),
    queryFn: () => mazeApi.progress(levelId as string).then((res) => res.data),
    enabled: !!levelId,
    staleTime: queryStaleTime.adminList,
  });
}

export function useMazeProgressSummary() {
  return useQuery({
    queryKey: mazeQueryKeys.progressSummary(),
    queryFn: () => mazeApi.progressSummary().then((res) => res.data),
    staleTime: queryStaleTime.adminList,
  });
}

// --- Student ---
export function useStudentMazeLevels() {
  return useQuery({
    queryKey: mazeQueryKeys.assigned(),
    queryFn: () => mazeApi.getAssigned().then((res) => res.data),
    staleTime: queryStaleTime.userScoped,
  });
}

export function useStudentMazePath() {
  return useQuery({
    queryKey: mazeQueryKeys.path(),
    queryFn: () => mazeApi.getPath().then((res) => res.data),
    staleTime: queryStaleTime.userScoped,
  });
}

export function useStudentMazeLevel(id?: string) {
  return useQuery({
    queryKey: mazeQueryKeys.studentLevel(id ?? ''),
    queryFn: () => mazeApi.getForStudent(id as string).then((res) => res.data),
    enabled: !!id,
    staleTime: queryStaleTime.userScoped,
  });
}

export function useSubmitMaze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ISubmitMazePayload) => mazeApi.submit(payload).then((res) => res.data),
    onSuccess: (data, vars) => {
      if (data.reachedGoal) {
        qc.setQueryData(mazeQueryKeys.assigned(), (old: IMazeLevel[] | undefined) => {
          if (!Array.isArray(old)) return old;
          return old.map((level) =>
            level.id === vars.levelId
              ? {
                  ...level,
                  solved: true,
                  attempts: (level.attempts ?? 0) + 1,
                  bestBlocks:
                    level.bestBlocks == null
                      ? data.submission.blocksUsed
                      : Math.min(level.bestBlocks, data.submission.blocksUsed),
                }
              : level,
          );
        });
        qc.setQueryData(mazeQueryKeys.path(), (old: IStudentMazePath | undefined) => {
          if (!old) return old;
          const updateLevel = (level: IMazeLevel): IMazeLevel =>
            level.id === vars.levelId
              ? {
                  ...level,
                  solved: true,
                  attempts: (level.attempts ?? 0) + 1,
                  bestBlocks:
                    level.bestBlocks == null
                      ? data.submission.blocksUsed
                      : Math.min(level.bestBlocks, data.submission.blocksUsed),
                }
              : level;

          const courses = old.courses.map((course) => {
            const levels = course.levels.map(updateLevel);
            return {
              ...course,
              levels,
              solvedCount: levels.filter((level) => level.solved).length,
              attemptedCount: levels.filter((level) => !level.solved && (level.attempts ?? 0) > 0).length,
              nextLevel: levels.find((level) => !level.solved) ?? null,
            };
          });
          const allLevels = courses.flatMap((course) => course.levels);

          return {
            ...old,
            courses,
            solvedCount: allLevels.filter((level) => level.solved).length,
            attemptedCount: allLevels.filter((level) => !level.solved && (level.attempts ?? 0) > 0).length,
            nextLevel: allLevels.find((level) => !level.solved) ?? null,
          };
        });
      }
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.assigned() });
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.path() });
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.myResults(vars.levelId) });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      void qc.invalidateQueries({ queryKey: ['student-quests'] });
      void qc.invalidateQueries({ queryKey: ['student-badges'] });
      void qc.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateMazeLevelPayload, ISubmitMazePayload } from '@cp/shared';
import { mazeApi } from './maze.api';

export const mazeQueryKeys = {
  all: ['maze-levels'] as const,
  detail: (id: string) => ['maze-levels', 'detail', id] as const,
  assigned: () => ['maze-levels', 'assigned'] as const,
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
  });
}

export function useMazeLevel(id?: string) {
  return useQuery({
    queryKey: mazeQueryKeys.detail(id ?? ''),
    queryFn: () => mazeApi.get(id as string).then((res) => res.data),
    enabled: !!id,
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
  });
}

export function useMazeProgressSummary() {
  return useQuery({
    queryKey: mazeQueryKeys.progressSummary(),
    queryFn: () => mazeApi.progressSummary().then((res) => res.data),
  });
}

// --- Student ---
export function useStudentMazeLevels() {
  return useQuery({
    queryKey: mazeQueryKeys.assigned(),
    queryFn: () => mazeApi.getAssigned().then((res) => res.data),
  });
}

export function useStudentMazeLevel(id?: string) {
  return useQuery({
    queryKey: mazeQueryKeys.studentLevel(id ?? ''),
    queryFn: () => mazeApi.getForStudent(id as string).then((res) => res.data),
    enabled: !!id,
  });
}

export function useSubmitMaze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ISubmitMazePayload) => mazeApi.submit(payload).then((res) => res.data),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.assigned() });
      void qc.invalidateQueries({ queryKey: mazeQueryKeys.myResults(vars.levelId) });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
    },
  });
}

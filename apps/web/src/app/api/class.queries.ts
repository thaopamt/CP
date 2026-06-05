/**
 * react-query hooks over `classes.api.ts`. Centralises cache keys so
 * mutations can invalidate the right slices.
 *
 * Cache keys:
 *   ['classes', 'list', params]      → list page
 *   ['classes', 'detail', id]        → detail page
 *   ['enrollments', 'byClass', cid]  → roster tab
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateClassPayload } from '@cp/shared';

import { ClassesListParams, classesApi, enrollmentsApi } from './classes.api';

export const classQueryKeys = {
  list: (params: ClassesListParams) => ['classes', 'list', params] as const,
  detail: (id: string) => ['classes', 'detail', id] as const,
  enrollmentsByClass: (classId: string) => ['enrollments', 'byClass', classId] as const,
  enrollmentsByStudent: (studentId: string) => ['enrollments', 'byStudent', studentId] as const,
};

export function useClassesList(params: ClassesListParams) {
  return useQuery({
    queryKey: classQueryKeys.list(params),
    queryFn: () => classesApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useClass(id: string | undefined) {
  return useQuery({
    queryKey: id ? classQueryKeys.detail(id) : ['classes', 'detail', 'noop'],
    queryFn: () => classesApi.get(id as string),
    enabled: !!id,
  });
}

export function useEnrollmentsByClass(classId: string | undefined) {
  return useQuery({
    queryKey: classId ? classQueryKeys.enrollmentsByClass(classId) : ['enrollments', 'noop'],
    queryFn: () => enrollmentsApi.listByClass(classId as string),
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateClassPayload) => classesApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useUpdateClass(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ICreateClassPayload>) => classesApi.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: classQueryKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ['classes', 'list'] });
    },
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { classId: string; studentId: string }) =>
      enrollmentsApi.enroll(vars.classId, vars.studentId),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: classQueryKeys.enrollmentsByClass(vars.classId) });
      void qc.invalidateQueries({ queryKey: classQueryKeys.enrollmentsByStudent(vars.studentId) });
      void qc.invalidateQueries({ queryKey: classQueryKeys.detail(vars.classId) });
      void qc.invalidateQueries({ queryKey: ['classes', 'list'] });
    },
  });
}

export function useDropEnrollment(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsApi.drop(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: classQueryKeys.enrollmentsByClass(classId) });
      void qc.invalidateQueries({ queryKey: ['enrollments'] });
      void qc.invalidateQueries({ queryKey: classQueryKeys.detail(classId) });
      void qc.invalidateQueries({ queryKey: ['classes', 'list'] });
    },
  });
}

export function useEnrollmentsByStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: studentId ? classQueryKeys.enrollmentsByStudent(studentId) : ['enrollments', 'noop'],
    queryFn: () => enrollmentsApi.listByStudent(studentId as string),
    enabled: !!studentId,
  });
}

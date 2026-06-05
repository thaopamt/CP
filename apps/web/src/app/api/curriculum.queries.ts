/**
 * react-query hooks over `curriculum.api.ts`.
 *
 * Cache slices:
 *   ['assignments', 'list', params]
 *   ['assignments', 'detail', id]
 *   ['courses', 'list', params]
 *   ['courses', 'detail', id]
 *   ['courses', 'assignments', courseId]   — sequenced assignments
 *   ['classes', 'courses', classId]        — sequenced courses for a class
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateAssignmentDefPayload, ICreateCoursePayload } from '@cp/shared';

import {
  AssignmentsListParams,
  CoursesListParams,
  assignmentsApi,
  classCoursesApi,
  coursesApi,
} from './curriculum.api';

export const curriculumKeys = {
  assignments: {
    list: (params: AssignmentsListParams) => ['assignments', 'list', params] as const,
    detail: (id: string) => ['assignments', 'detail', id] as const,
    implicitClasses: (id: string) => ['assignments', 'implicit-classes', id] as const,
    testcaseManifest: (id: string) => ['assignments', 'testcases', 'manifest', id] as const,
  },
  courses: {
    list: (params: CoursesListParams) => ['courses', 'list', params] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
    assignments: (courseId: string) => ['courses', 'assignments', courseId] as const,
  },
  classCourses: (classId: string) => ['classes', 'courses', classId] as const,
};

// ── Assignments ──────────────────────────────────────────────────────────

export function useAssignmentsList(params: AssignmentsListParams) {
  return useQuery({
    queryKey: curriculumKeys.assignments.list(params),
    queryFn: () => assignmentsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: id ? curriculumKeys.assignments.detail(id) : ['assignments', 'detail', 'noop'],
    queryFn: () => assignmentsApi.get(id as string),
    enabled: !!id,
  });
}

export function useImplicitClasses(id: string | undefined) {
  return useQuery({
    queryKey: id ? curriculumKeys.assignments.implicitClasses(id) : ['assignments', 'implicit-classes', 'noop'],
    queryFn: () => assignmentsApi.getImplicitClasses(id as string),
    enabled: !!id,
  });
}

export function useAssignmentTestcaseManifest(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: id ? curriculumKeys.assignments.testcaseManifest(id) : ['assignments', 'testcases', 'manifest', 'noop'],
    queryFn: () => assignmentsApi.getTestcaseManifest(id as string),
    enabled: !!id && enabled,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateAssignmentDefPayload) => assignmentsApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useUpdateAssignment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ICreateAssignmentDefPayload>) => assignmentsApi.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: curriculumKeys.assignments.detail(id) });
      void qc.invalidateQueries({ queryKey: curriculumKeys.assignments.testcaseManifest(id) });
      void qc.invalidateQueries({ queryKey: ['assignments', 'list'] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// ── Courses ──────────────────────────────────────────────────────────────

export function useCoursesList(params: CoursesListParams) {
  return useQuery({
    queryKey: curriculumKeys.courses.list(params),
    queryFn: () => coursesApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: id ? curriculumKeys.courses.detail(id) : ['courses', 'detail', 'noop'],
    queryFn: () => coursesApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateCoursePayload) => coursesApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// ── Course ↔ Assignment sequencing ────────────────────────────────────────

export function useCourseAssignments(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? curriculumKeys.courses.assignments(courseId) : ['courses', 'assignments', 'noop'],
    queryFn: () => coursesApi.listAssignments(courseId as string),
    enabled: !!courseId,
  });
}

export function useAttachAssignments(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentIds: string[]) => coursesApi.attachAssignments(courseId, assignmentIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: curriculumKeys.courses.assignments(courseId) });
      void qc.invalidateQueries({ queryKey: curriculumKeys.courses.detail(courseId) });
      void qc.invalidateQueries({ queryKey: ['courses', 'list'] });
    },
  });
}

export function useDetachAssignment(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (junctionId: string) => coursesApi.detachAssignment(courseId, junctionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: curriculumKeys.courses.assignments(courseId) });
      void qc.invalidateQueries({ queryKey: curriculumKeys.courses.detail(courseId) });
    },
  });
}

export function useReorderCourseAssignments(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => coursesApi.reorderAssignments(courseId, ids),
    onSuccess: (data) => {
      qc.setQueryData(curriculumKeys.courses.assignments(courseId), data);
    },
  });
}

// ── Class ↔ Course sequencing ────────────────────────────────────────────

export function useClassCourses(classId: string | undefined) {
  return useQuery({
    queryKey: classId ? curriculumKeys.classCourses(classId) : ['classes', 'courses', 'noop'],
    queryFn: () => classCoursesApi.listForClass(classId as string),
    enabled: !!classId,
  });
}

export function useAttachClassCourses(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseIds: string[]) => classCoursesApi.attach(classId, courseIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: curriculumKeys.classCourses(classId) });
    },
  });
}

export function useDetachClassCourse(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (junctionId: string) => classCoursesApi.detach(classId, junctionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: curriculumKeys.classCourses(classId) });
    },
  });
}

export function useReorderClassCourses(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => classCoursesApi.reorder(classId, ids),
    onSuccess: (data) => {
      qc.setQueryData(curriculumKeys.classCourses(classId), data);
    },
  });
}

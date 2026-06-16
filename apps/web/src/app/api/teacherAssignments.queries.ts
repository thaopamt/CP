/**
 * react-query hooks over `teacherAssignments.api.ts`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { teacherAssignmentsApi } from './teacherAssignments.api';
import { queryStaleTime } from './query-cache';

export const teacherAssignmentKeys = {
  studentTeachers: (studentId: string) => ['teacher-assignments', 'student', studentId] as const,
  teacherStudents: (teacherId: string) => ['teacher-assignments', 'teacher', teacherId] as const,
};

export function useStudentTeachers(studentId: string | undefined) {
  return useQuery({
    queryKey: studentId
      ? teacherAssignmentKeys.studentTeachers(studentId)
      : ['teacher-assignments', 'student', 'noop'],
    queryFn: () => teacherAssignmentsApi.getStudentTeachers(studentId as string),
    enabled: !!studentId,
    staleTime: queryStaleTime.adminList,
  });
}

export function useSetStudentTeachers(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teacherIds: string[]) =>
      teacherAssignmentsApi.setStudentTeachers(studentId, teacherIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teacherAssignmentKeys.studentTeachers(studentId) });
      void qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

export function useTeacherStudents(teacherId: string | undefined) {
  return useQuery({
    queryKey: teacherId
      ? teacherAssignmentKeys.teacherStudents(teacherId)
      : ['teacher-assignments', 'teacher', 'noop'],
    queryFn: () => teacherAssignmentsApi.getTeacherStudents(teacherId as string),
    enabled: !!teacherId,
    staleTime: queryStaleTime.adminList,
  });
}

export function useSetTeacherStudents(teacherId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentIds: string[]) =>
      teacherAssignmentsApi.setTeacherStudents(teacherId, studentIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teacherAssignmentKeys.teacherStudents(teacherId) });
      void qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

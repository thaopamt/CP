/**
 * Thin axios wrapper around the NestJS @dataui/crud endpoints for
 * `/api/classes` and `/api/enrollments`. Translates between:
 *   - the on-the-wire shape (TypeORM entities with eager `instructor` and
 *     enrollment metadata)
 *   - the `IClass` / `IClassEnrollment` shapes from `@cp/shared` (what
 *     the UI consumes)
 *
 * @dataui/crud filter syntax recap:
 *   ?s={"$and":[{"department":"MATHEMATICS"},{"$or":[…]}]}
 *   ?page=1&limit=10
 *   ?sort=createdAt,DESC
 */
import {
  ClassStatus,
  EnrollmentLifecycle,
  IClass,
  IClassEnrollment,
  IClassInstructor,
  ICreateClassPayload,
  PaymentStatus,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

// ── Wire types matching what the API actually returns ─────────────────────

interface CrudListResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  // The User entity has plenty more fields but this is all we read
}

interface ApiClassEntity {
  id: string;
  name: string;
  code: string;
  description: string | null;

  capacity: number;
  enrolledCount: number;
  status: ClassStatus;
  term: string;
  attendanceRate: number;
  instructorId: string | null;
  instructor: ApiUser | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiEnrollment {
  id: string;
  classId: string;
  class?: ApiClassEntity;
  studentId: string;
  student: ApiUser;
  status: EnrollmentLifecycle;
  attendancePercentage: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

// ── Adapters: TypeORM entity → wire shape ─────────────────────────────────

function toInstructor(u: ApiUser | null): IClassInstructor | null {
  if (!u) return null;
  return {
    id: u.id,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    avatarUrl: u.avatarUrl ?? null,
    title: null,
  };
}

function toClass(c: ApiClassEntity): IClass {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description,

    capacity: c.capacity,
    enrolledCount: c.enrolledCount,
    status: c.status,
    term: c.term,
    attendanceRate: c.attendanceRate ?? 0,
    instructor: toInstructor(c.instructor),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function toEnrollment(e: ApiEnrollment): IClassEnrollment {
  const u = e.student;
  return {
    id: e.id,
    classId: e.classId,
    className: e.class?.name,
    classCode: e.class?.code,
    studentId: e.studentId,
    studentName: `${u.firstName} ${u.lastName}`.trim(),
    studentEmail: u.email,
    studentExternalId: u.id.slice(0, 8).toUpperCase(),
    status: e.status,
    attendancePercentage: e.attendancePercentage,
    paymentStatus: e.paymentStatus,
    enrolledAt: e.createdAt,
  };
}

// ── Filter helper ──────────────────────────────────────────────────────────

export interface ClassesListParams {
  page?: number;
  limit?: number;
  status?: ClassStatus | 'all';
  search?: string;
}

function buildClassesQuery(p: ClassesListParams): Record<string, unknown> {
  const conditions: Array<Record<string, unknown>> = [];
  if (p.status && p.status !== 'all') conditions.push({ status: p.status });
  if (p.search?.trim()) {
    const q = p.search.trim();
    conditions.push({
      $or: [{ name: { $cont: q } }, { code: { $cont: q } }],
    });
  }

  const search = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : { $and: conditions };
  return {
    ...(search ? { s: JSON.stringify(search) } : {}),
    page: p.page ?? 1,
    limit: p.limit ?? 10,
    sort: 'createdAt,DESC',
  };
}

// ── Public API surface ─────────────────────────────────────────────────────

export const classesApi = {
  async list(params: ClassesListParams = {}): Promise<{
    items: IClass[];
    total: number;
    pageCount: number;
    page: number;
  }> {
    const { data } = await apiClient.get<CrudListResponse<ApiClassEntity>>('/classes', {
      params: buildClassesQuery(params),
    });
    return {
      items: data.data.map(toClass),
      total: data.total,
      pageCount: data.pageCount,
      page: data.page,
    };
  },

  async get(id: string): Promise<IClass> {
    const { data } = await apiClient.get<ApiClassEntity>(`/classes/${id}`);
    return toClass(data);
  },

  async create(payload: ICreateClassPayload): Promise<IClass> {
    const { data } = await apiClient.post<ApiClassEntity>('/classes', payload);
    return toClass(data);
  },

  async update(id: string, patch: Partial<ICreateClassPayload>): Promise<IClass> {
    const { data } = await apiClient.patch<ApiClassEntity>(`/classes/${id}`, patch);
    return toClass(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  },
};

export const enrollmentsApi = {
  async listByClass(classId: string): Promise<IClassEnrollment[]> {
    const { data } = await apiClient.get<CrudListResponse<ApiEnrollment>>('/enrollments', {
      params: {
        s: JSON.stringify({ classId }),
        limit: 100,
        sort: 'createdAt,DESC',
      },
    });
    return data.data.map(toEnrollment);
  },

  async listByStudent(studentId: string): Promise<IClassEnrollment[]> {
    const { data } = await apiClient.get<CrudListResponse<ApiEnrollment>>('/enrollments', {
      params: {
        s: JSON.stringify({ studentId }),
        join: 'class',
        limit: 100,
        sort: 'createdAt,DESC',
      },
    });
    return data.data.map(toEnrollment);
  },

  async enroll(classId: string, studentId: string): Promise<IClassEnrollment> {
    const { data } = await apiClient.post<ApiEnrollment>('/enrollments/enroll', {
      classId,
      studentId,
    });
    return toEnrollment(data);
  },

  async drop(id: string): Promise<void> {
    await apiClient.delete(`/enrollments/drop/${id}`);
  },
};

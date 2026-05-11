/**
 * Wraps `/api/assignments`, `/api/courses`, and `/api/classes/:id/courses`.
 * Exposes the `IAssignmentDef` / `ICourse` / `IClassCourseLink` /
 * `ICourseAssignment` shapes from `@cp/shared`.
 *
 * Adapter functions `toAssignment` / `toCourse` translate the on-the-wire
 * TypeORM-shaped JSON (which uses `orderIndex`, `assignmentCount`, etc.)
 * into the cleaner UI shapes (`order`, etc.).
 */
import {
  AssignmentType,
  IAssignmentDef,
  ICodingConfig,
  IClassCourseLink,
  ICourse,
  ICourseAssignment,
  ICreateAssignmentDefPayload,
  ICreateCoursePayload,
  IReorderPayload,
  PublishStatus,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

interface CrudListResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

// ── Wire shapes ──────────────────────────────────────────────────────────

interface ApiAssignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subject: string;
  points: number;
  estimatedMinutes: number | null;
  status: PublishStatus;
  slug?: string | null;
  tags?: string[];
  codingConfig?: ICodingConfig | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiCourse {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  durationWeeks: number;
  subject: string;
  coverUrl: string | null;
  status: PublishStatus;
  assignmentCount: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiCourseAssignment {
  id: string;
  courseId: string;
  assignmentId: string;
  assignment: ApiAssignment;
  orderIndex: number;
  prerequisiteAssignmentId: string | null;
}

interface ApiClassCourse {
  id: string;
  classId: string;
  courseId: string;
  course: ApiCourse;
  orderIndex: number;
  isRequired: boolean;
}

// ── Adapters ──────────────────────────────────────────────────────────────

function toAssignment(a: ApiAssignment): IAssignmentDef {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? '',
    type: a.type,
    difficulty: a.difficulty,
    subject: a.subject,
    points: a.points,
    estimatedMinutes: a.estimatedMinutes ?? undefined,
    status: a.status,
    slug: a.slug ?? undefined,
    tags: a.tags ?? [],
    codingConfig: a.codingConfig ?? undefined,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function toCourse(c: ApiCourse): ICourse {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    credits: c.credits,
    durationWeeks: c.durationWeeks,
    subject: c.subject,
    coverUrl: c.coverUrl,
    status: c.status,
    assignmentCount: c.assignmentCount,
    totalPoints: c.totalPoints,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function toCourseAssignment(ca: ApiCourseAssignment): ICourseAssignment {
  return {
    id: ca.id,
    courseId: ca.courseId,
    order: ca.orderIndex,
    prerequisiteAssignmentId: ca.prerequisiteAssignmentId,
    assignment: toAssignment(ca.assignment),
  };
}

function toClassCourseLink(cc: ApiClassCourse): IClassCourseLink {
  return {
    id: cc.id,
    classId: cc.classId,
    order: cc.orderIndex,
    isRequired: cc.isRequired,
    course: toCourse(cc.course),
  };
}

// ── Filter builder ────────────────────────────────────────────────────────

export interface AssignmentsListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: AssignmentType | 'all';
  subject?: string | 'all';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'all';
  status?: PublishStatus | 'all';
}

function buildAssignmentsQuery(p: AssignmentsListParams): Record<string, unknown> {
  const conditions: Array<Record<string, unknown>> = [];
  if (p.type && p.type !== 'all') conditions.push({ type: p.type });
  if (p.difficulty && p.difficulty !== 'all') conditions.push({ difficulty: p.difficulty });
  if (p.subject && p.subject !== 'all') conditions.push({ subject: p.subject });
  if (p.status && p.status !== 'all') conditions.push({ status: p.status });
  if (p.search?.trim()) {
    const q = p.search.trim();
    conditions.push({ $or: [{ title: { $cont: q } }, { description: { $cont: q } }] });
  }
  const search =
    conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : { $and: conditions };
  return {
    ...(search ? { s: JSON.stringify(search) } : {}),
    page: p.page ?? 1,
    limit: p.limit ?? 10,
    sort: 'createdAt,DESC',
  };
}

export interface CoursesListParams {
  page?: number;
  limit?: number;
  search?: string;
  subject?: string | 'all';
  status?: PublishStatus | 'all';
}

function buildCoursesQuery(p: CoursesListParams): Record<string, unknown> {
  const conditions: Array<Record<string, unknown>> = [];
  if (p.subject && p.subject !== 'all') conditions.push({ subject: p.subject });
  if (p.status && p.status !== 'all') conditions.push({ status: p.status });
  if (p.search?.trim()) {
    const q = p.search.trim();
    conditions.push({ $or: [{ title: { $cont: q } }, { code: { $cont: q } }] });
  }
  const search =
    conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : { $and: conditions };
  return {
    ...(search ? { s: JSON.stringify(search) } : {}),
    page: p.page ?? 1,
    limit: p.limit ?? 10,
    sort: 'createdAt,DESC',
  };
}

// ── Public API ────────────────────────────────────────────────────────────

export const assignmentsApi = {
  async list(params: AssignmentsListParams = {}) {
    const { data } = await apiClient.get<CrudListResponse<ApiAssignment>>('/assignments', {
      params: buildAssignmentsQuery(params),
    });
    return {
      items: data.data.map(toAssignment),
      total: data.total,
      pageCount: data.pageCount,
      page: data.page,
    };
  },

  async get(id: string): Promise<IAssignmentDef> {
    const { data } = await apiClient.get<ApiAssignment>(`/assignments/${id}`);
    return toAssignment(data);
  },

  async create(payload: ICreateAssignmentDefPayload): Promise<IAssignmentDef> {
    const { data } = await apiClient.post<ApiAssignment>('/assignments', payload);
    return toAssignment(data);
  },

  async update(id: string, patch: Partial<ICreateAssignmentDefPayload>): Promise<IAssignmentDef> {
    const { data } = await apiClient.patch<ApiAssignment>(`/assignments/${id}`, patch);
    return toAssignment(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/assignments/${id}`);
  },
};

export const coursesApi = {
  async list(params: CoursesListParams = {}) {
    const { data } = await apiClient.get<CrudListResponse<ApiCourse>>('/courses', {
      params: buildCoursesQuery(params),
    });
    return {
      items: data.data.map(toCourse),
      total: data.total,
      pageCount: data.pageCount,
      page: data.page,
    };
  },

  async get(id: string): Promise<ICourse> {
    const { data } = await apiClient.get<ApiCourse>(`/courses/${id}`);
    return toCourse(data);
  },

  async create(payload: ICreateCoursePayload): Promise<ICourse> {
    const { data } = await apiClient.post<ApiCourse>('/courses', payload);
    return toCourse(data);
  },

  async update(id: string, patch: Partial<ICreateCoursePayload>): Promise<ICourse> {
    const { data } = await apiClient.patch<ApiCourse>(`/courses/${id}`, patch);
    return toCourse(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },

  // Course ↔ Assignment ───────────────────────────────────────────────────
  async listAssignments(courseId: string): Promise<ICourseAssignment[]> {
    const { data } = await apiClient.get<ApiCourseAssignment[]>(`/courses/${courseId}/assignments`);
    return data.map(toCourseAssignment);
  },

  async attachAssignments(courseId: string, assignmentIds: string[]): Promise<ICourseAssignment[]> {
    const { data } = await apiClient.post<ApiCourseAssignment[]>(`/courses/${courseId}/assignments`, {
      assignmentIds,
    });
    return data.map(toCourseAssignment);
  },

  async detachAssignment(courseId: string, junctionId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}/assignments/${junctionId}`);
  },

  async reorderAssignments(courseId: string, ids: string[]): Promise<ICourseAssignment[]> {
    const payload: IReorderPayload = { ids };
    const { data } = await apiClient.patch<ApiCourseAssignment[]>(
      `/courses/${courseId}/assignments/reorder`,
      payload,
    );
    return data.map(toCourseAssignment);
  },
};

export const classCoursesApi = {
  async listForClass(classId: string): Promise<IClassCourseLink[]> {
    const { data } = await apiClient.get<ApiClassCourse[]>(`/classes/${classId}/courses`);
    return data.map(toClassCourseLink);
  },

  async attach(classId: string, courseIds: string[], isRequired = true): Promise<IClassCourseLink[]> {
    const { data } = await apiClient.post<ApiClassCourse[]>(`/classes/${classId}/courses`, {
      courseIds,
      isRequired,
    });
    return data.map(toClassCourseLink);
  },

  async detach(classId: string, junctionId: string): Promise<void> {
    await apiClient.delete(`/classes/${classId}/courses/${junctionId}`);
  },

  async reorder(classId: string, ids: string[]): Promise<IClassCourseLink[]> {
    const payload: IReorderPayload = { ids };
    const { data } = await apiClient.patch<ApiClassCourse[]>(
      `/classes/${classId}/courses/reorder`,
      payload,
    );
    return data.map(toClassCourseLink);
  },
};

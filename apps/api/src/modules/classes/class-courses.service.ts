import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Course } from '../courses/course.entity';
import { ClassEntity } from './class.entity';
import { ClassCourse } from './class-course.entity';

export interface ClassCourseProgressAssignment {
  courseAssignmentId: string;
  assignmentId: string;
  title: string;
  orderIndex: number;
  points: number;
}

export interface ClassCourseProgressStudentAssignment {
  assignmentId: string;
  completed: boolean;
  completedAt: string | null;
  lastStatus: string | null;
  lastSubmittedAt: string | null;
  attemptCount: number;
  passedCount: number;
  totalCount: number;
  bestSubmissionId: string | null;
  lastSubmissionId: string | null;
}

export interface ClassCourseProgressStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  completedAssignments: number;
  totalAssignments: number;
  percentage: number;
  assignments: ClassCourseProgressStudentAssignment[];
}

export interface ClassCourseProgress {
  classId: string;
  courseId: string;
  assignments: ClassCourseProgressAssignment[];
  students: ClassCourseProgressStudent[];
}

/**
 * Manages the m:n relationship between Class and Course with sequencing.
 * Kept separate from `ClassesService` so the two are easy to reason about.
 */
@Injectable()
export class ClassCoursesService {
  constructor(
    @InjectRepository(ClassCourse) private readonly junction: Repository<ClassCourse>,
    @InjectRepository(ClassEntity) private readonly classes: Repository<ClassEntity>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    private readonly ds: DataSource,
  ) {}

  async listForClass(classId: string): Promise<ClassCourse[]> {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);
    return this.junction.find({
      where: { classId },
      order: { orderIndex: 'ASC' },
    });
  }

  async attach(classId: string, courseIds: string[], isRequired = true): Promise<ClassCourse[]> {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);

    return this.ds.transaction(async (tx) => {
      const junctionRepo = tx.getRepository(ClassCourse);
      const courseRepo = tx.getRepository(Course);

      const found = await courseRepo.findBy({ id: In(courseIds) });
      if (found.length !== courseIds.length) {
        throw new ConflictException('One or more course IDs not found');
      }

      const existing = await junctionRepo.find({ where: { classId, courseId: In(courseIds) } });
      const existingIds = new Set(existing.map((e) => e.courseId));
      const toAttach = courseIds.filter((id) => !existingIds.has(id));
      if (toAttach.length === 0) return existing;

      const last = await junctionRepo
        .createQueryBuilder('cc')
        .where('cc.class_id = :classId', { classId })
        .orderBy('cc.order_index', 'DESC')
        .limit(1)
        .getOne();
      let nextIndex = (last?.orderIndex ?? 0) + 1;

      const created = toAttach.map((id) =>
        junctionRepo.create({
          classId,
          courseId: id,
          orderIndex: nextIndex++,
          isRequired,
        }),
      );
      const saved = await junctionRepo.save(created);
      return junctionRepo.find({
        where: { classId, courseId: In(courseIds) },
        relations: ['course']
      });
    });
  }

  async detach(classId: string, junctionId: string): Promise<void> {
    const row = await this.junction.findOne({ where: { id: junctionId, classId } });
    if (!row) throw new NotFoundException(`Junction ${junctionId} not found`);
    await this.junction.delete({ id: junctionId });
  }

  async reorder(classId: string, ids: string[]): Promise<ClassCourse[]> {
    return this.ds.transaction(async (tx) => {
      const junctionRepo = tx.getRepository(ClassCourse);
      const all = await junctionRepo.find({ where: { classId } });
      const byId = new Map(all.map((r) => [r.id, r]));

      let order = 1;
      for (const id of ids) {
        const row = byId.get(id);
        if (!row) continue;
        row.orderIndex = order++;
        byId.delete(id);
      }
      const leftover = Array.from(byId.values()).sort((a, b) => a.orderIndex - b.orderIndex);
      for (const row of leftover) row.orderIndex = order++;

      await junctionRepo.save(all);
      return junctionRepo.find({ where: { classId }, order: { orderIndex: 'ASC' } });
    });
  }

  async getCourseProgress(classId: string, courseId: string): Promise<ClassCourseProgress> {
    const link = await this.junction.findOne({ where: { classId, courseId } });
    if (!link) throw new NotFoundException(`Course ${courseId} is not attached to class ${classId}`);

    const assignments = await this.ds.query<ClassCourseProgressAssignment[]>(
      `
      SELECT
        ca.id AS "courseAssignmentId",
        ca.assignment_id AS "assignmentId",
        a.title AS "title",
        ca.order_index AS "orderIndex",
        a.points AS "points"
      FROM course_assignments ca
      JOIN assignments a ON a.id = ca.assignment_id
      WHERE ca.course_id = $1
        AND ca.deleted_at IS NULL
        AND a.deleted_at IS NULL
      ORDER BY ca.order_index ASC, a.title ASC
      `,
      [courseId],
    );

    const students = await this.ds.query<Array<{
      studentId: string;
      firstName: string;
      lastName: string;
      email: string;
    }>>(
      `
      SELECT
        e.student_id AS "studentId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email AS "email"
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      WHERE e.class_id = $1
        AND e.deleted_at IS NULL
        AND u.deleted_at IS NULL
      ORDER BY u.last_name ASC, u.first_name ASC, u.email ASC
      `,
      [classId],
    );

    if (assignments.length === 0 || students.length === 0) {
      return {
        classId,
        courseId,
        assignments,
        students: students.map((student) => ({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          studentEmail: student.email,
          completedAssignments: 0,
          totalAssignments: assignments.length,
          percentage: 0,
          assignments: [],
        })),
      };
    }

    const progressRows = await this.ds.query<Array<{
      studentId: string;
      assignmentId: string;
      completed: boolean;
      completedAt: Date | null;
      lastStatus: string | null;
      lastSubmittedAt: Date | null;
      attemptCount: number;
      passedCount: number;
      totalCount: number;
      bestSubmissionId: string | null;
      lastSubmissionId: string | null;
    }>>(
      `
      SELECT
        student_id AS "studentId",
        assignment_id AS "assignmentId",
        completed,
        completed_at AS "completedAt",
        last_status AS "lastStatus",
        last_submitted_at AS "lastSubmittedAt",
        attempt_count AS "attemptCount",
        passed_count AS "passedCount",
        total_count AS "totalCount",
        best_submission_id AS "bestSubmissionId",
        last_submission_id AS "lastSubmissionId"
      FROM student_assignment_progress
      WHERE student_id = ANY($1::uuid[])
        AND assignment_id = ANY($2::uuid[])
        AND deleted_at IS NULL
      `,
      [
        students.map((student) => student.studentId),
        assignments.map((assignment) => assignment.assignmentId),
      ],
    );

    const progressByStudentAssignment = new Map(
      progressRows.map((row) => [`${row.studentId}:${row.assignmentId}`, row]),
    );

    return {
      classId,
      courseId,
      assignments,
      students: students.map((student) => {
        const assignmentProgress = assignments.map<ClassCourseProgressStudentAssignment>((assignment) => {
          const row = progressByStudentAssignment.get(`${student.studentId}:${assignment.assignmentId}`);
          return {
            assignmentId: assignment.assignmentId,
            completed: row?.completed ?? false,
            completedAt: row?.completedAt?.toISOString?.() ?? null,
            lastStatus: row?.lastStatus ?? null,
            lastSubmittedAt: row?.lastSubmittedAt?.toISOString?.() ?? null,
            attemptCount: Number(row?.attemptCount ?? 0),
            passedCount: Number(row?.passedCount ?? 0),
            totalCount: Number(row?.totalCount ?? 0),
            bestSubmissionId: row?.bestSubmissionId ?? null,
            lastSubmissionId: row?.lastSubmissionId ?? null,
          };
        });
        const completedAssignments = assignmentProgress.filter((item) => item.completed).length;
        const totalAssignments = assignments.length;
        return {
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          studentEmail: student.email,
          completedAssignments,
          totalAssignments,
          percentage: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
          assignments: assignmentProgress,
        };
      }),
    };
  }
}

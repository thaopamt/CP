import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import { IClassLearningProgress } from '@cp/shared';

import { Enrollment } from './enrollment.entity';
import { ClassesService } from './classes.service';
import { ClassCourse } from './class-course.entity';
import { SystemCacheService } from '../../common/cache/system-cache.service';

type EnrollmentWithLearningProgress = Enrollment & {
  learningProgress: IClassLearningProgress;
};

@Injectable()
export class EnrollmentsService extends TypeOrmCrudService<Enrollment> {
  constructor(
    @InjectRepository(Enrollment) repo: Repository<Enrollment>,
    @InjectRepository(ClassCourse) private readonly classCourses: Repository<ClassCourse>,
    private readonly classes: ClassesService,
    private readonly cache: SystemCacheService,
  ) {
    super(repo);
  }

  async listByStudentWithLearningProgress(studentId: string): Promise<EnrollmentWithLearningProgress[]> {
    return this.cache.remember(
      {
        namespace: 'enrollments:student-learning-progress',
        parts: [studentId],
        ttlMs: 30_000,
        tags: [`student:${studentId}:classes`, 'classes:catalog', 'curriculum:catalog'],
      },
      () => this.computeStudentLearningProgress(studentId),
    );
  }

  private async computeStudentLearningProgress(studentId: string): Promise<EnrollmentWithLearningProgress[]> {
    const enrollments = await this.repo.find({
      where: { studentId },
      relations: ['class'],
      order: { createdAt: 'DESC' },
    });

    if (enrollments.length === 0) return [];

    const classIds = [...new Set(enrollments.map((enrollment) => enrollment.classId))];
    const progressByClass = await this.getLearningProgressByClass(studentId, classIds);

    return enrollments.map((enrollment) =>
      Object.assign(enrollment, {
        learningProgress:
          progressByClass.get(enrollment.classId) ?? this.emptyLearningProgress(enrollment.classId),
      }),
    );
  }

  /** Idempotent enroll — throws on duplicate, otherwise creates and bumps the count. */
  async enroll(classId: string, studentId: string): Promise<Enrollment> {
    const existing = await this.repo
      .createQueryBuilder('e')
      .withDeleted()
      .where('e.classId = :classId', { classId })
      .andWhere('e.studentId = :studentId', { studentId })
      .getOne();

    if (existing) {
      if (existing.deletedAt) {
        // Soft-deleted -> restore it
        await this.repo.restore(existing.id);
        await this.classes.recountEnrollment(classId);
        this.bumpEnrollmentTags(classId, studentId);
        const reloaded = await this.repo.findOne({ where: { id: existing.id } });
        return reloaded!;
      }
      throw new ConflictException('Student already enrolled in this class');
    }

    const row = this.repo.create({ classId, studentId });
    const saved = await this.repo.save(row);
    await this.classes.recountEnrollment(classId);
    this.bumpEnrollmentTags(classId, studentId);
    // Reload to ensure eager relations (like student) are populated for the response
    const reloaded = await this.repo.findOne({ where: { id: saved.id } });
    return reloaded!;
  }

  async drop(id: string): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return;
    await this.repo.softDelete({ id });
    await this.classes.recountEnrollment(row.classId);
    this.bumpEnrollmentTags(row.classId, row.studentId);
  }

  private bumpEnrollmentTags(classId: string, studentId: string): void {
    void this.cache.bumpTags([
      'classes:catalog',
      'curriculum:catalog',
      'attendance:schedule',
      'finance:monthly',
      `class:${classId}:meta`,
      `class:${classId}:leaderboard`,
      `student:${studentId}:classes`,
      `student:${studentId}:dashboard`,
      `student:${studentId}:schedule`,
    ]);
  }

  private async getLearningProgressByClass(
    studentId: string,
    classIds: string[],
  ): Promise<Map<string, IClassLearningProgress>> {
    const progressByClass = new Map<string, IClassLearningProgress>();
    for (const classId of classIds) {
      progressByClass.set(classId, this.emptyLearningProgress(classId));
    }

    const rows = await this.classCourses
      .createQueryBuilder('cc')
      .innerJoin('course_assignments', 'ca', 'ca.course_id = cc.course_id')
      .leftJoin(
        'student_assignment_progress',
        'sap',
        'sap.assignment_id = ca.assignment_id AND sap.student_id = :studentId AND sap.completed = true',
        { studentId },
      )
      .select('cc.class_id', 'classId')
      .addSelect('COUNT(ca.id)', 'totalAssignments')
      .addSelect('COUNT(DISTINCT CASE WHEN sap.id IS NOT NULL THEN ca.id END)', 'completedAssignments')
      .where('cc.class_id IN (:...classIds)', { classIds })
      .groupBy('cc.class_id')
      .getRawMany<{
        classId: string;
        totalAssignments: string;
        completedAssignments: string;
      }>();

    for (const row of rows) {
      const totalAssignments = Number(row.totalAssignments);
      const completedAssignments = Number(row.completedAssignments);
      progressByClass.set(row.classId, {
        classId: row.classId,
        totalAssignments,
        completedAssignments,
        percentage: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
      });
    }

    return progressByClass;
  }

  private emptyLearningProgress(classId: string): IClassLearningProgress {
    return {
      classId,
      totalAssignments: 0,
      completedAssignments: 0,
      percentage: 0,
    };
  }
}

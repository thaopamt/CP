import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Assignment } from '../assignments/assignment.entity';
import { Course } from './course.entity';
import { CourseAssignment } from './course-assignment.entity';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { SystemCacheService } from '../../common/cache/system-cache.service';

@Injectable()
export class CoursesService extends TypeOrmCrudService<Course> {
  constructor(
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(CourseAssignment) private readonly junction: Repository<CourseAssignment>,
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    private readonly ds: DataSource,
    private readonly cache: SystemCacheService,
  ) {
    super(courses);
  }

  /** Public create / update so the controller doesn't need protected `repo` access */
  async createCourse(dto: CreateCourseDto): Promise<Course> {
    const course = await this.courses.save(this.courses.create(dto));
    await this.bumpCourseCaches(course.id);
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.courses.update({ id }, dto);
    const out = await this.courses.findOne({ where: { id } });
    if (!out) throw new NotFoundException(`Course ${id} not found`);
    await this.bumpCourseCaches(id);
    return out;
  }

  /** Eager-load assignments ordered by `orderIndex` for a course */
  async listAssignments(courseId: string): Promise<CourseAssignment[]> {
    return this.cache.remember(
      {
        namespace: 'course-assignments',
        parts: [courseId],
        tags: ['curriculum:catalog', `course:${courseId}`],
        ttlMs: 60_000,
      },
      async () => {
        const course = await this.courses.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException(`Course ${courseId} not found`);
        return this.junction.find({
          where: { courseId },
          order: { orderIndex: 'ASC' },
        });
      },
    );
  }

  /**
   * Attach one or more assignments to a course. New rows append at the
   * end of the existing sequence; duplicates are ignored (no error).
   */
  async attachAssignments(courseId: string, assignmentIds: string[]): Promise<CourseAssignment[]> {
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);

    return this.ds.transaction(async (tx) => {
      const junctionRepo = tx.getRepository(CourseAssignment);
      const courseRepo = tx.getRepository(Course);
      const assignmentRepo = tx.getRepository(Assignment);

      // Validate each assignment exists
      const found = await assignmentRepo.findBy({ id: In(assignmentIds) });
      if (found.length !== assignmentIds.length) {
        throw new ConflictException('One or more assignment IDs not found');
      }

      // Skip already-attached
      const existing = await junctionRepo.find({
        where: { courseId, assignmentId: In(assignmentIds) },
      });
      const existingIds = new Set(existing.map((e) => e.assignmentId));
      const toAttach = assignmentIds.filter((id) => !existingIds.has(id));
      if (toAttach.length === 0) return existing;

      const last = await junctionRepo
        .createQueryBuilder('ca')
        .where('ca.course_id = :courseId', { courseId })
        .orderBy('ca.order_index', 'DESC')
        .limit(1)
        .getOne();
      let nextIndex = (last?.orderIndex ?? 0) + 1;

      const created = toAttach.map((id) =>
        junctionRepo.create({
          courseId,
          assignmentId: id,
          orderIndex: nextIndex++,
        }),
      );
      const saved = await junctionRepo.save(created);
      await this.recount(courseId, courseRepo, junctionRepo, assignmentRepo);
      await this.bumpCourseCaches(courseId);
      return junctionRepo.find({ 
        where: { courseId, assignmentId: In(assignmentIds) },
        relations: ['assignment']
      });
    });
  }

  async detachAssignment(courseId: string, junctionId: string): Promise<void> {
    return this.ds.transaction(async (tx) => {
      const junctionRepo = tx.getRepository(CourseAssignment);
      const courseRepo = tx.getRepository(Course);
      const assignmentRepo = tx.getRepository(Assignment);

      const row = await junctionRepo.findOne({ where: { id: junctionId, courseId } });
      if (!row) throw new NotFoundException(`Junction ${junctionId} not found`);
      await junctionRepo.delete({ id: junctionId });
      await this.recount(courseId, courseRepo, junctionRepo, assignmentRepo);
      await this.bumpCourseCaches(courseId);
    });
  }

  /**
   * Reorder a course's assignments. `ids` is the desired order; missing
   * rows keep their relative position appended at the end.
   */
  async reorderAssignments(courseId: string, ids: string[]): Promise<CourseAssignment[]> {
    return this.ds.transaction(async (tx) => {
      const junctionRepo = tx.getRepository(CourseAssignment);
      const all = await junctionRepo.find({ where: { courseId } });
      const byId = new Map(all.map((r) => [r.id, r]));

      let order = 1;
      for (const id of ids) {
        const row = byId.get(id);
        if (!row) continue;
        row.orderIndex = order++;
        byId.delete(id);
      }
      // Append leftovers preserving prior order
      const leftover = Array.from(byId.values()).sort((a, b) => a.orderIndex - b.orderIndex);
      for (const row of leftover) row.orderIndex = order++;

      await junctionRepo.save(all);
      await this.bumpCourseCaches(courseId);
      return junctionRepo.find({ where: { courseId }, order: { orderIndex: 'ASC' } });
    });
  }

  /** Refresh denormalized counters on the parent course */
  private async recount(
    courseId: string,
    courseRepo: Repository<Course>,
    junctionRepo: Repository<CourseAssignment>,
    assignmentRepo: Repository<Assignment>,
  ): Promise<void> {
    const rows = await junctionRepo.find({ where: { courseId } });
    const ids = rows.map((r) => r.assignmentId);
    let totalPoints = 0;
    if (ids.length) {
      const assignments = await assignmentRepo.findBy({ id: In(ids) });
      totalPoints = assignments.reduce((acc, a) => acc + a.points, 0);
    }
    await courseRepo.update({ id: courseId }, { assignmentCount: rows.length, totalPoints });
  }

  private async bumpCourseCaches(courseId: string): Promise<void> {
    await this.cache.bumpTags(['courses:catalog', 'curriculum:catalog', `course:${courseId}`]);
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Course } from '../courses/course.entity';
import { ClassEntity } from './class.entity';
import { ClassCourse } from './class-course.entity';

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
}

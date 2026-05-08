import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';

import { Enrollment } from './enrollment.entity';
import { ClassesService } from './classes.service';

@Injectable()
export class EnrollmentsService extends TypeOrmCrudService<Enrollment> {
  constructor(
    @InjectRepository(Enrollment) repo: Repository<Enrollment>,
    private readonly classes: ClassesService,
  ) {
    super(repo);
  }

  /** Idempotent enroll — throws on duplicate, otherwise creates and bumps the count. */
  async enroll(classId: string, studentId: string): Promise<Enrollment> {
    const existing = await this.repo.createQueryBuilder('e')
      .withDeleted()
      .where('e.classId = :classId', { classId })
      .andWhere('e.studentId = :studentId', { studentId })
      .getOne();
    
    if (existing) {
      if (existing.deletedAt) {
        // Soft-deleted -> restore it
        await this.repo.restore(existing.id);
        await this.classes.recountEnrollment(classId);
        const reloaded = await this.repo.findOne({ where: { id: existing.id } });
        return reloaded!;
      }
      throw new ConflictException('Student already enrolled in this class');
    }

    const row = this.repo.create({ classId, studentId });
    const saved = await this.repo.save(row);
    await this.classes.recountEnrollment(classId);
    // Reload to ensure eager relations (like student) are populated for the response
    const reloaded = await this.repo.findOne({ where: { id: saved.id } });
    return reloaded!;
  }

  async drop(id: string): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return;
    await this.repo.softDelete({ id });
    await this.classes.recountEnrollment(row.classId);
  }
}

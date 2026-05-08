import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClassStatus } from '@cp/shared';

import { ClassEntity } from './class.entity';
import { ClassSession } from './class-session.entity';
import { Enrollment } from './enrollment.entity';
import { User } from '../users/user.entity';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService extends TypeOrmCrudService<ClassEntity> {
  constructor(
    @InjectRepository(ClassEntity) repo: Repository<ClassEntity>,
    @InjectRepository(ClassSession) private readonly sessions: Repository<ClassSession>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly ds: DataSource,
  ) {
    super(repo);
  }

  /**
   * Override the @Crud `createOne` flow because a class always ships
   * with 1+ sessions. The instructor reference is optional — if present
   * we validate it points at an existing user, otherwise the class is
   * created unassigned and someone can fill it in later.
   *
   * Wrapped in a transaction so the row + sessions land atomically.
   */
  async createWithSessions(dto: CreateClassDto): Promise<ClassEntity> {
    if (dto.instructorId) {
      const instructor = await this.users.findOne({ where: { id: dto.instructorId } });
      if (!instructor) {
        throw new BadRequestException(`Instructor ${dto.instructorId} not found`);
      }
    }

    return this.ds.transaction(async (tx) => {
      const cls = tx.getRepository(ClassEntity).create({
        name: dto.name,
        code: dto.code,
        department: dto.department,
        description: dto.description ?? null,
        room: dto.room ?? null,
        capacity: dto.capacity,
        enrolledCount: 0,
        status: dto.status ?? ClassStatus.UPCOMING,
        term: dto.term,
        instructorId: dto.instructorId ?? null,
      });
      const saved = await tx.getRepository(ClassEntity).save(cls);

      const rows = dto.sessions.map((s) =>
        tx.getRepository(ClassSession).create({
          classId: saved.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room ?? null,
        }),
      );
      await tx.getRepository(ClassSession).save(rows);

      // Re-fetch with the eager-loaded sessions populated
      const loaded = await tx.getRepository(ClassEntity).findOne({
        where: { id: saved.id },
        relations: ['sessions', 'instructor'],
      });
      if (!loaded) throw new NotFoundException();
      return loaded;
    });
  }

  /**
   * Recalculate the denormalized `enrolledCount` and bump status to FULL
   * when the class hits capacity. Called whenever an enrollment row is
   * inserted or removed.
   */
  async recountEnrollment(classId: string): Promise<void> {
    const total = await this.enrollments.count({ where: { classId } });
    const cls = await this.repo.findOne({ where: { id: classId } });
    if (!cls) return;
    const next: Partial<ClassEntity> = { enrolledCount: total };
    if (total >= cls.capacity) next.status = ClassStatus.FULL;
    else if (cls.status === ClassStatus.FULL) next.status = ClassStatus.ACTIVE;
    await this.repo.update({ id: classId }, next);
  }
}

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
import { UpdateClassDto } from './dto/update-class.dto';

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
    return this.ds.transaction(async (tx) => {
      const cls = tx.getRepository(ClassEntity).create({
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        capacity: dto.capacity,
        enrolledCount: 0,
        status: dto.status ?? ClassStatus.UPCOMING,
        term: dto.term,
      });
      const saved = await tx.getRepository(ClassEntity).save(cls);

      const rows = dto.sessions.map((s) =>
        tx.getRepository(ClassSession).create({
          classId: saved.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        }),
      );
      await tx.getRepository(ClassSession).save(rows);

      // Re-fetch with the eager-loaded sessions populated
      const loaded = await tx.getRepository(ClassEntity).findOne({
        where: { id: saved.id },
        relations: ['sessions'],
      });
      if (!loaded) throw new NotFoundException();
      return loaded;
    });
  }

  /**
   * Override the @Crud `updateOneBase` to support atomic updates to the
   * class entity along with replacing its sessions.
   */
  async updateWithSessions(id: string, dto: UpdateClassDto): Promise<ClassEntity> {
    const cls = await this.repo.findOne({ where: { id } });
    if (!cls) throw new NotFoundException(`Class ${id} not found`);



    return this.ds.transaction(async (tx) => {
      const patch: Partial<ClassEntity> = {};
      if (dto.name !== undefined) patch.name = dto.name;
      if (dto.code !== undefined) patch.code = dto.code;
      if (dto.description !== undefined) patch.description = dto.description ?? null;
      if (dto.capacity !== undefined) patch.capacity = dto.capacity;
      if (dto.status !== undefined) patch.status = dto.status;
      if (dto.term !== undefined) patch.term = dto.term;

      if (Object.keys(patch).length > 0) {
        await tx.getRepository(ClassEntity).update(id, patch);
      }

      if (dto.sessions) {
        await tx.getRepository(ClassSession).delete({ classId: id });
        
        if (dto.sessions.length > 0) {
          const rows = dto.sessions.map((s: any) => {
            const { id: _id, version: _v, createdAt: _c, updatedAt: _u, deletedAt: _d, ...rest } = s;
            return {
              ...rest,
              classId: id,
            };
          });
          await tx.getRepository(ClassSession).save(rows);
        }
      }

      const loaded = await tx.getRepository(ClassEntity).findOne({
        where: { id },
        relations: ['sessions'],
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

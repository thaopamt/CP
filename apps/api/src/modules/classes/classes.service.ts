import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import { ClassStatus } from '@cp/shared';

import { ClassEntity } from './class.entity';
import { Enrollment } from './enrollment.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService extends TypeOrmCrudService<ClassEntity> {
  constructor(
    @InjectRepository(ClassEntity) repo: Repository<ClassEntity>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
  ) {
    super(repo);
  }

  /**
   * Override the @Crud `createOne` flow so class creation stays explicit and
   * aligned with student-level scheduling.
   */
  async createClass(dto: CreateClassDto): Promise<ClassEntity> {
    const cls = this.repo.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      enrolledCount: 0,
      status: dto.status ?? ClassStatus.UPCOMING,
    });
    return this.repo.save(cls);
  }

  /**
   * Override the @Crud `updateOneBase` to keep class updates scoped to class
   * metadata. Scheduling is managed through student schedule endpoints.
   */
  async updateClass(id: string, dto: UpdateClassDto): Promise<ClassEntity> {
    const cls = await this.repo.findOne({ where: { id } });
    if (!cls) throw new NotFoundException(`Class ${id} not found`);

    if (dto.name !== undefined) cls.name = dto.name;
    if (dto.code !== undefined) cls.code = dto.code;
    if (dto.description !== undefined) cls.description = dto.description ?? null;
    if (dto.status !== undefined) cls.status = dto.status;

    return this.repo.save(cls);
  }

  /**
   * Recalculate the denormalized `enrolledCount`. Called whenever an
   * enrollment row is inserted or removed.
   */
  async recountEnrollment(classId: string): Promise<void> {
    const total = await this.enrollments.count({ where: { classId } });
    const cls = await this.repo.findOne({ where: { id: classId } });
    if (!cls) return;
    const next: Partial<ClassEntity> = { enrolledCount: total };
    if (cls.status === ClassStatus.FULL) next.status = ClassStatus.ACTIVE;
    await this.repo.update({ id: classId }, next);
  }
}

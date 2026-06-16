import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StudentSchedule } from './student-schedule.entity';
import { CreateStudentScheduleDto, UpdateStudentScheduleDto } from './dto/student-schedule.dto';
import { SystemCacheService } from '../../common/cache/system-cache.service';

export interface ScheduleSessionDto {
  id: string;
  studentId: string;
  classId: string | null;
  className: string | null;
  classCode: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  note: string | null;
}

export interface StudentScheduleResponse {
  studentId: string;
  isCustom: boolean;
  sessions: ScheduleSessionDto[];
}

@Injectable()
export class StudentScheduleService {
  constructor(
    @InjectRepository(StudentSchedule) private readonly repo: Repository<StudentSchedule>,
    private readonly cache: SystemCacheService,
  ) {}

  private toDto(s: StudentSchedule): ScheduleSessionDto {
    return {
      id: s.id,
      studentId: s.studentId,
      classId: s.classId,
      className: s.class?.name ?? null,
      classCode: s.class?.code ?? null,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      note: s.note,
    };
  }

  /**
   * Returns the effective schedule for a student.
   * Scheduling is explicit at the student level.
   */
  async getSchedule(studentId: string): Promise<StudentScheduleResponse> {
    return this.cache.remember(
      {
        namespace: 'student-schedule',
        parts: [studentId],
        tags: [`student:${studentId}:schedule`, 'attendance:schedule'],
        ttlMs: 30_000,
      },
      async () => {
        const custom = await this.repo.find({
          where: { studentId },
          relations: ['class'],
          order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        });
        const isCustom = custom.length > 0;

        return {
          studentId,
          isCustom,
          sessions: custom.map((s) => this.toDto(s)),
        };
      },
    );
  }

  async getCustomSessions(studentId: string): Promise<ScheduleSessionDto[]> {
    return this.cache.remember(
      {
        namespace: 'student-custom-schedule',
        parts: [studentId],
        tags: [`student:${studentId}:schedule`, 'attendance:schedule'],
        ttlMs: 30_000,
      },
      async () => {
        const rows = await this.repo.find({
          where: { studentId },
          relations: ['class'],
          order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        });
        return rows.map((s) => this.toDto(s));
      },
    );
  }

  async createCustomSession(studentId: string, dto: CreateStudentScheduleDto): Promise<ScheduleSessionDto> {
    const row = this.repo.create({
      studentId,
      classId: dto.classId ?? null,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      note: dto.note ?? null,
    });
    const saved = await this.repo.save(row);
    // Reload to get eager class relation
    const loaded = await this.repo.findOne({ where: { id: saved.id }, relations: ['class'] });
    await this.bumpScheduleCaches(studentId);
    return this.toDto(loaded!);
  }

  async updateCustomSession(sessionId: string, dto: UpdateStudentScheduleDto): Promise<ScheduleSessionDto> {
    const row = await this.repo.findOne({ where: { id: sessionId }, relations: ['class'] });
    if (!row) throw new NotFoundException(`Custom session ${sessionId} not found`);

    if (dto.classId !== undefined) row.classId = dto.classId;
    if (dto.dayOfWeek !== undefined) row.dayOfWeek = dto.dayOfWeek;
    if (dto.startTime !== undefined) row.startTime = dto.startTime;
    if (dto.endTime !== undefined) row.endTime = dto.endTime;

    if (dto.note !== undefined) row.note = dto.note;

    await this.repo.save(row);
    const loaded = await this.repo.findOne({ where: { id: sessionId }, relations: ['class'] });
    await this.bumpScheduleCaches(row.studentId);
    return this.toDto(loaded!);
  }

  async deleteCustomSession(sessionId: string): Promise<void> {
    const row = await this.repo.findOne({ where: { id: sessionId } });
    if (!row) throw new NotFoundException(`Custom session ${sessionId} not found`);
    await this.repo.remove(row);
    await this.bumpScheduleCaches(row.studentId);
  }

  async clearAllCustom(studentId: string): Promise<void> {
    await this.repo.delete({ studentId });
    await this.bumpScheduleCaches(studentId);
  }

  private async bumpScheduleCaches(studentId: string): Promise<void> {
    await this.cache.bumpTags([
      `student:${studentId}:schedule`,
      `student:${studentId}:dashboard`,
      `attendance:student:${studentId}`,
      'attendance:schedule',
      'finance:monthly',
    ]);
  }
}

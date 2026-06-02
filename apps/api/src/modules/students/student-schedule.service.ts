import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StudentSchedule } from './student-schedule.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { ClassSession } from '../classes/class-session.entity';
import { ClassEntity } from '../classes/class.entity';
import { CreateStudentScheduleDto, UpdateStudentScheduleDto } from './dto/student-schedule.dto';

export interface ScheduleSessionDto {
  id: string;
  studentId: string;
  classId: string | null;
  className: string | null;
  classCode: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  note: string | null;
}

export interface StudentScheduleResponse {
  studentId: string;
  isCustom: boolean;
  sessions: ScheduleSessionDto[];
  classSessions: ScheduleSessionDto[];
}

@Injectable()
export class StudentScheduleService {
  constructor(
    @InjectRepository(StudentSchedule) private readonly repo: Repository<StudentSchedule>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(ClassSession) private readonly classSessions: Repository<ClassSession>,
    @InjectRepository(ClassEntity) private readonly classes: Repository<ClassEntity>,
  ) {}

  /**
   * Build the merged class-schedule for a student by collecting all sessions
   * from every class the student is actively enrolled in.
   */
  private async getClassSessions(studentId: string): Promise<ScheduleSessionDto[]> {
    const enrollments = await this.enrollments.find({ where: { studentId } });
    if (enrollments.length === 0) return [];

    const classIds = enrollments.map((e) => e.classId);
    const sessions: ScheduleSessionDto[] = [];

    for (const classId of classIds) {
      const cls = await this.classes.findOne({ where: { id: classId } });
      if (!cls) continue;
      const classSess = await this.classSessions.find({ where: { classId } });
      for (const s of classSess) {
        sessions.push({
          id: s.id,
          studentId,
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room ?? null,
          note: null,
        });
      }
    }

    return sessions;
  }

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
      room: s.room,
      note: s.note,
    };
  }

  /**
   * Returns the effective schedule for a student.
   * If custom sessions exist → isCustom=true and sessions = custom.
   * Otherwise → isCustom=false and sessions = merged from enrolled classes.
   * `classSessions` is always returned for admin reference.
   */
  async getSchedule(studentId: string): Promise<StudentScheduleResponse> {
    const custom = await this.repo.find({
      where: { studentId },
      relations: ['class'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    const classSessions = await this.getClassSessions(studentId);
    const isCustom = custom.length > 0;

    return {
      studentId,
      isCustom,
      sessions: isCustom ? custom.map((s) => this.toDto(s)) : classSessions,
      classSessions,
    };
  }

  async getCustomSessions(studentId: string): Promise<ScheduleSessionDto[]> {
    const rows = await this.repo.find({
      where: { studentId },
      relations: ['class'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    return rows.map((s) => this.toDto(s));
  }

  async getClassSchedule(studentId: string): Promise<ScheduleSessionDto[]> {
    return this.getClassSessions(studentId);
  }

  async createCustomSession(studentId: string, dto: CreateStudentScheduleDto): Promise<ScheduleSessionDto> {
    const row = this.repo.create({
      studentId,
      classId: dto.classId ?? null,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      room: dto.room ?? null,
      note: dto.note ?? null,
    });
    const saved = await this.repo.save(row);
    // Reload to get eager class relation
    const loaded = await this.repo.findOne({ where: { id: saved.id }, relations: ['class'] });
    return this.toDto(loaded!);
  }

  async updateCustomSession(sessionId: string, dto: UpdateStudentScheduleDto): Promise<ScheduleSessionDto> {
    const row = await this.repo.findOne({ where: { id: sessionId }, relations: ['class'] });
    if (!row) throw new NotFoundException(`Custom session ${sessionId} not found`);

    if (dto.classId !== undefined) row.classId = dto.classId;
    if (dto.dayOfWeek !== undefined) row.dayOfWeek = dto.dayOfWeek;
    if (dto.startTime !== undefined) row.startTime = dto.startTime;
    if (dto.endTime !== undefined) row.endTime = dto.endTime;
    if (dto.room !== undefined) row.room = dto.room;
    if (dto.note !== undefined) row.note = dto.note;

    await this.repo.save(row);
    const loaded = await this.repo.findOne({ where: { id: sessionId }, relations: ['class'] });
    return this.toDto(loaded!);
  }

  async deleteCustomSession(sessionId: string): Promise<void> {
    const row = await this.repo.findOne({ where: { id: sessionId } });
    if (!row) throw new NotFoundException(`Custom session ${sessionId} not found`);
    await this.repo.remove(row);
  }

  async clearAllCustom(studentId: string): Promise<void> {
    await this.repo.delete({ studentId });
  }
}

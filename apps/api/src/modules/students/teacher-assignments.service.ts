import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '@cp/shared';

import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';
import { TeacherStudent } from './teacher-student.entity';

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    @InjectRepository(TeacherStudent)
    private readonly links: Repository<TeacherStudent>,
    @InjectRepository(StudentProfile)
    private readonly students: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // ── Student → teachers ───────────────────────────────────────────────────

  async getTeachersForStudent(studentId: string): Promise<User[]> {
    await this.ensureStudent(studentId);
    const rows = await this.links.find({
      where: { studentId },
      relations: { teacher: true },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => r.teacher);
  }

  async setTeachersForStudent(studentId: string, teacherIds: string[]): Promise<User[]> {
    await this.ensureStudent(studentId);
    const ids = await this.validateTeacherIds(teacherIds);

    await this.links.delete({ studentId });
    if (ids.length) {
      await this.links.save(ids.map((teacherId) => this.links.create({ studentId, teacherId })));
    }
    return this.getTeachersForStudent(studentId);
  }

  // ── Teacher → students ─────────────────────────────────────────────────────

  async getStudentsForTeacher(teacherId: string): Promise<StudentProfile[]> {
    await this.ensureTeacher(teacherId);
    const rows = await this.links.find({
      where: { teacherId },
      relations: { student: { user: true } },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => r.student);
  }

  async setStudentsForTeacher(teacherId: string, studentIds: string[]): Promise<StudentProfile[]> {
    await this.ensureTeacher(teacherId);
    const ids = await this.validateStudentIds(studentIds);

    await this.links.delete({ teacherId });
    if (ids.length) {
      await this.links.save(ids.map((studentId) => this.links.create({ teacherId, studentId })));
    }
    return this.getStudentsForTeacher(teacherId);
  }

  /**
   * Student-profile ids that must be HIDDEN from `teacherId` in list views:
   * students assigned to at least one teacher but NOT to this one. Students
   * with no teacher assignment stay visible to every teacher.
   */
  async hiddenStudentProfileIds(teacherId: string): Promise<string[]> {
    const rows: Array<{ studentId: string }> = await this.links
      .createQueryBuilder('ts')
      .select('ts.studentId', 'studentId')
      .groupBy('ts.studentId')
      .having('BOOL_OR(ts.teacher_id = :teacherId) = false')
      .setParameter('teacherId', teacherId)
      .getRawMany();
    return rows.map((r) => r.studentId);
  }

  /**
   * Returns the set of User IDs for students visible to `teacherId`, or `null`
   * if all students are visible (no hidden students).
   *
   * Visible = assigned to this teacher OR not assigned to any teacher.
   */
  async visibleStudentUserIds(teacherId: string): Promise<string[] | null> {
    const hiddenProfileIds = await this.hiddenStudentProfileIds(teacherId);
    if (!hiddenProfileIds.length) return null; // all visible

    const hiddenSet = new Set(hiddenProfileIds);
    const allProfiles = await this.students.find({ select: { id: true, userId: true } });
    return allProfiles
      .filter((p) => !hiddenSet.has(p.id))
      .map((p) => p.userId);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async ensureStudent(studentId: string): Promise<void> {
    const exists = await this.students.exists({ where: { id: studentId } });
    if (!exists) throw new NotFoundException(`Student ${studentId} not found`);
  }

  private async ensureTeacher(teacherId: string): Promise<void> {
    const teacher = await this.users.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException(`Teacher ${teacherId} not found`);
    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException(`User ${teacherId} is not a teacher`);
    }
  }

  /** Returns the de-duplicated subset of ids that are real TEACHER users. */
  private async validateTeacherIds(teacherIds: string[]): Promise<string[]> {
    const unique = [...new Set(teacherIds)];
    if (!unique.length) return [];
    const found = await this.users.find({
      where: { id: In(unique), role: UserRole.TEACHER },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new BadRequestException('One or more teacher ids are invalid');
    }
    return found.map((u) => u.id);
  }

  private async validateStudentIds(studentIds: string[]): Promise<string[]> {
    const unique = [...new Set(studentIds)];
    if (!unique.length) return [];
    const found = await this.students.find({
      where: { id: In(unique) },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new BadRequestException('One or more student ids are invalid');
    }
    return found.map((s) => s.id);
  }
}

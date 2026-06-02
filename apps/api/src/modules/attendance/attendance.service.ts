import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { AttendanceStatus, DayOfWeek } from '@cp/shared';

import { AttendanceRecord } from './attendance.entity';
import { ClassSession } from '../classes/class-session.entity';
import { ClassEntity } from '../classes/class.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { AttendanceEntryDto } from './dto/attendance.dto';

/** Map JS Date.getDay() (0=Sun…6=Sat) → DayOfWeek enum */
const JS_DOW_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUN,
  1: DayOfWeek.MON,
  2: DayOfWeek.TUE,
  3: DayOfWeek.WED,
  4: DayOfWeek.THU,
  5: DayOfWeek.FRI,
  6: DayOfWeek.SAT,
};

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord) private readonly repo: Repository<AttendanceRecord>,
    @InjectRepository(ClassSession) private readonly sessions: Repository<ClassSession>,
    @InjectRepository(ClassEntity) private readonly classes: Repository<ClassEntity>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(StudentSchedule) private readonly studentSchedules: Repository<StudentSchedule>,
  ) {}

  /**
   * Given a class and a calendar date, return the class sessions that occur
   * on that day of the week.
   */
  async getSessionsForDate(classId: string, date: string) {
    const dow = JS_DOW_TO_ENUM[new Date(date).getUTCDay()];
    if (!dow) return [];
    const sessions = await this.sessions.find({
      where: { classId, dayOfWeek: dow },
      order: { startTime: 'ASC' },
    });
    return sessions;
  }

  /**
   * Build the full attendance payload for a class on a date:
   * sessions occurring that day + enrolled students + custom schedule students + existing records.
   */
  async getClassDateAttendance(classId: string, date: string) {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);

    const dow = JS_DOW_TO_ENUM[new Date(date).getUTCDay()];
    const sessions = await this.getSessionsForDate(classId, date);
    const enrollments = await this.enrollments.find({
      where: { classId, student: { isActive: true } },
      relations: ['student'],
    });

    const enrolledStudentIds = enrollments.map((e) => e.studentId);
    
    // Find all custom schedules for this class on this day
    const customSchedulesForClassDay = dow
      ? await this.studentSchedules.find({
          where: { classId, dayOfWeek: dow, student: { isActive: true } },
          relations: ['student'],
        })
      : [];
      
    // Combine to get all potential student IDs
    const allStudentIds = new Set<string>([
      ...enrolledStudentIds,
      ...customSchedulesForClassDay.map((s) => s.studentId),
    ]);
    
    // Identify which students are in "custom mode" (have ANY custom schedule)
    const customModeStudentIds = new Set<string>();
    if (allStudentIds.size > 0) {
      const qb = this.studentSchedules.createQueryBuilder('ss')
        .select('DISTINCT ss.student_id', 'studentId')
        .where('ss.student_id IN (:...ids)', { ids: Array.from(allStudentIds) });
      const rows = await qb.getRawMany();
      for (const row of rows) {
        customModeStudentIds.add(row.studentId);
      }
    }

    // Build a map of studentId -> { id, firstName, lastName } for easy access
    const studentInfoMap = new Map<string, { id: string; name: string }>();
    for (const e of enrollments) {
      studentInfoMap.set(e.studentId, { id: e.studentId, name: `${e.student.firstName} ${e.student.lastName}` });
    }
    for (const s of customSchedulesForClassDay) {
      if (!studentInfoMap.has(s.studentId)) {
        studentInfoMap.set(s.studentId, { id: s.studentId, name: `${s.student.firstName} ${s.student.lastName}` });
      }
    }

    // Fetch existing records for this class+date
    const existing = await this.repo.find({
      where: { classId, date },
    });

    // Build a lookup: `${studentId}:${sessionId}` → record. For custom records, pseudoId is 'custom-startTime-endTime'.
    const recordMap = new Map<string, AttendanceRecord>();
    for (const r of existing) {
      // In DB, custom sessions have sessionId = null.
      // Wait, how do we map existing DB records with sessionId=null to our pseudo-IDs?
      // Since we group custom sessions by time, and DB only has one null sessionId per student/class/date,
      // we can just map 'null' to the custom session pseudo-ID later.
      recordMap.set(`${r.studentId}:${r.sessionId ?? 'null'}`, r);
    }

    // Build the output sessions array
    const sessionAttendances: Array<{
      sessionId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;

      records: any[];
    }> = [];

    // Track which custom schedules exactly matched an official session
    const matchedCustomScheduleIds = new Set<string>();

    // 1. Official Sessions
    for (const s of sessions) {
      const records: any[] = [];
      for (const studentId of allStudentIds) {
        const isCustomMode = customModeStudentIds.has(studentId);
        
        // Should this student be in this official session?
        let shouldInclude = false;
        
        if (!isCustomMode && enrolledStudentIds.includes(studentId)) {
          // Normal enrolled student
          shouldInclude = true;
        } else if (isCustomMode) {
          // Check if they have a custom schedule that EXACTLY matches this official session
          const exactCustomMatch = customSchedulesForClassDay.find(
            (cs) => cs.studentId === studentId && cs.startTime === s.startTime && cs.endTime === s.endTime
          );
          if (exactCustomMatch) {
            shouldInclude = true;
            matchedCustomScheduleIds.add(exactCustomMatch.id);
          }
        }

        if (shouldInclude) {
          const rec = recordMap.get(`${studentId}:${s.id}`) || recordMap.get(`${studentId}:null`);
          records.push({
            id: rec?.id ?? undefined,
            studentId,
            studentName: studentInfoMap.get(studentId)?.name ?? 'Unknown',
            classId,
            sessionId: s.id,
            date,
            status: rec?.status ?? AttendanceStatus.UNMARKED,
            note: rec?.note ?? null,
          });
        }
      }
      
      // Only add session if it has students, OR if it's an official session (always show official sessions even if empty)
      sessionAttendances.push({
        sessionId: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,

        records,
      });
    }

    // 2. Custom Sessions (Unmatched)
    const unmatchedCustomSchedules = customSchedulesForClassDay.filter(cs => !matchedCustomScheduleIds.has(cs.id));
    
    // Group unmatched by startTime_endTime
    const customGroups = new Map<string, typeof unmatchedCustomSchedules>();
    for (const cs of unmatchedCustomSchedules) {
      const key = `${cs.startTime}_${cs.endTime}`;
      if (!customGroups.has(key)) customGroups.set(key, []);
      customGroups.get(key)!.push(cs);
    }

    for (const [key, schedules] of customGroups.entries()) {
      const sample = schedules[0];
      const pseudoSessionId = `custom-${sample.startTime}-${sample.endTime}`;
      const records = schedules.map(cs => {
        const rec = recordMap.get(`${cs.studentId}:null`);
        return {
          id: rec?.id ?? undefined,
          studentId: cs.studentId,
          studentName: studentInfoMap.get(cs.studentId)?.name ?? 'Unknown',
          classId,
          sessionId: pseudoSessionId,
          date,
          status: rec?.status ?? AttendanceStatus.UNMARKED,
          note: rec?.note ?? null,
        };
      });

      sessionAttendances.push({
        sessionId: pseudoSessionId,
        dayOfWeek: sample.dayOfWeek,
        startTime: sample.startTime,
        endTime: sample.endTime,

        records,
      });
    }

    // Sort all sessions by start time
    sessionAttendances.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      classId,
      className: cls.name,
      date,
      sessions: sessionAttendances,
    };
  }

  /**
   * Bulk upsert attendance for a class on a date.
   * Each entry in `records` is either created or updated.
   */
  async bulkUpsert(classId: string, date: string, records: AttendanceEntryDto[], markedBy: string) {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);

    const results: AttendanceRecord[] = [];

    for (const entry of records) {
      // If sessionId is a pseudo custom ID, map it to null in DB
      let sessionId = entry.sessionId ?? null;
      if (sessionId && sessionId.startsWith('custom-')) {
        sessionId = null;
      }

      let existing = await this.repo.findOne({
        where: { studentId: entry.studentId, classId, sessionId: sessionId as any, date },
      });

      if (existing) {
        existing.status = entry.status;
        existing.note = entry.note ?? existing.note;
        existing.markedBy = markedBy;
        results.push(await this.repo.save(existing));
      } else {
        const row = this.repo.create({
          studentId: entry.studentId,
          classId,
          sessionId,
          date,
          status: entry.status,
          note: entry.note ?? null,
          markedBy,
        });
        results.push(await this.repo.save(row));
      }
    }

    // Update enrollment attendance percentages
    await this.recalcEnrollmentAttendance(classId);

    return results;
  }

  /**
   * Student attendance history for a specific class (or all classes).
   */
  async getStudentHistory(
    studentId: string,
    classId?: string,
    from?: string,
    to?: string,
  ) {
    const qb = this.repo.createQueryBuilder('a')
      .where('a.student_id = :studentId', { studentId })
      .orderBy('a.date', 'DESC')
      .addOrderBy('a.start_time', 'ASC');

    if (classId) qb.andWhere('a.class_id = :classId', { classId });
    if (from) qb.andWhere('a.date >= :from', { from });
    if (to) qb.andWhere('a.date <= :to', { to });

    return qb.getMany();
  }

  /**
   * Summary stats for a class across all dates.
   */
  async getClassSummary(classId: string) {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);

    const records = await this.repo.find({ where: { classId } });

    let present = 0;
    let absent = 0;
    let late = 0;
    let total = 0;

    for (const r of records) {
      if (r.status === AttendanceStatus.UNMARKED) continue;
      total++;
      if (r.status === AttendanceStatus.PRESENT) present++;
      if (r.status === AttendanceStatus.ABSENT) absent++;
      if (r.status === AttendanceStatus.LATE) late++;
    }

    return {
      classId,
      className: cls.name,
      total,
      present,
      absent,
      late,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }

  /**
   * Recalculate enrollment.attendancePercentage for all students in a class.
   */
  private async recalcEnrollmentAttendance(classId: string) {
    const enrollments = await this.enrollments.find({ where: { classId } });

    for (const enrollment of enrollments) {
      const records = await this.repo.find({
        where: { studentId: enrollment.studentId, classId },
      });

      const marked = records.filter((r) => r.status !== AttendanceStatus.UNMARKED);
      if (marked.length === 0) continue;

      const present = marked.filter(
        (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE,
      ).length;

      enrollment.attendancePercentage = Math.round((present / marked.length) * 100);
      await this.enrollments.save(enrollment);
    }
  }

  /**
   * Get all custom schedules in the system for plotting on the calendar grid.
   * Only returns custom schedules that are linked to a class.
   */
  async getAllCustomSchedules() {
    return this.studentSchedules.find({
      relations: ['class'],
      where: { 
        classId: Not(IsNull()),
        student: { isActive: true },
      },
    });
  }
}

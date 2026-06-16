import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AttendanceStatus, DayOfWeek, IStudentAttendanceHistoryItem, JwtPayload, UserRole } from '@cp/shared';

import { AttendanceRecord } from './attendance.entity';
import { ClassEntity } from '../classes/class.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { AttendanceEntryDto } from './dto/attendance.dto';
import { ScheduleSlotAttendanceRecord } from './schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from './schedule-slot-cancellation.entity';
import { SystemCacheService } from '../../common/cache/system-cache.service';

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
    @InjectRepository(ClassEntity) private readonly classes: Repository<ClassEntity>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(StudentSchedule) private readonly studentSchedules: Repository<StudentSchedule>,
    @InjectRepository(ScheduleSlotAttendanceRecord)
    private readonly scheduleSlotAttendance: Repository<ScheduleSlotAttendanceRecord>,
    @InjectRepository(ScheduleSlotCancellation)
    private readonly scheduleSlotCancellations: Repository<ScheduleSlotCancellation>,
    @InjectRepository(StudentProfile)
    private readonly studentProfiles: Repository<StudentProfile>,
    private readonly cache: SystemCacheService,
  ) {}

  /**
   * Teacher-portal visibility rule for attendance rosters.
   *
   * Given a roster's student *user* ids, returns the subset that must be
   * HIDDEN from `viewer` when the viewer is a teacher: a student is hidden
   * iff they are assigned to at least one teacher but NOT to this viewer.
   * Students with no teacher assignment at all stay visible to everyone.
   *
   * Admins (or any non-teacher viewer) hide nothing.
   */
  private async hiddenStudentUserIds(
    viewer: JwtPayload | undefined,
    studentUserIds: string[],
  ): Promise<Set<string>> {
    if (!viewer || viewer.role !== UserRole.TEACHER || studentUserIds.length === 0) {
      return new Set();
    }
    const rows: Array<{ userId: string; mine: boolean | null; total: string }> =
      await this.studentProfiles
        .createQueryBuilder('sp')
        .leftJoin('teacher_students', 'ts', 'ts.student_id = sp.id')
        .select('sp.userId', 'userId')
        .addSelect('BOOL_OR(ts.teacher_id = :teacherId)', 'mine')
        .addSelect('COUNT(ts.id)', 'total')
        .where('sp.userId IN (:...ids)', { ids: studentUserIds })
        .setParameter('teacherId', viewer.sub)
        .groupBy('sp.userId')
        .getRawMany();

    const hidden = new Set<string>();
    for (const r of rows) {
      const assignedToAny = Number(r.total) > 0;
      const assignedToViewer = r.mine === true;
      if (assignedToAny && !assignedToViewer) hidden.add(r.userId);
    }
    return hidden;
  }

  /**
   * Class-owned weekly sessions have been removed. Keep this endpoint shape for
   * older callers while returning an empty list.
   */
  async getSessionsForDate(classId: string, _date: string) {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);
    return [];
  }

  /**
   * Build the attendance payload for student-level schedules linked to a class
   * on a date.
   */
  async getClassDateAttendance(classId: string, date: string, viewer?: JwtPayload) {
    return this.cache.remember(
      {
        namespace: 'attendance-class-date',
        parts: [classId, date, this.viewerCacheKey(viewer)],
        tags: [`attendance:class:${classId}`, `attendance:date:${date}`, 'attendance:schedule'],
        ttlMs: 15_000,
      },
      () => this.computeClassDateAttendance(classId, date, viewer),
    );
  }

  private async computeClassDateAttendance(classId: string, date: string, viewer?: JwtPayload) {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);

    const dow = JS_DOW_TO_ENUM[new Date(date).getUTCDay()];
    const allSchedulesForClassDay = dow
      ? await this.studentSchedules.find({
          where: { classId, dayOfWeek: dow, student: { isActive: true } },
          relations: ['student'],
        })
      : [];

    // Teacher portal: only their own students (or students with no teacher).
    const hidden = await this.hiddenStudentUserIds(
      viewer,
      allSchedulesForClassDay.map((s) => s.studentId),
    );
    const customSchedulesForClassDay = hidden.size
      ? allSchedulesForClassDay.filter((s) => !hidden.has(s.studentId))
      : allSchedulesForClassDay;

    const studentInfoMap = new Map<string, { id: string; name: string }>();
    for (const s of customSchedulesForClassDay) {
      if (!studentInfoMap.has(s.studentId)) {
        studentInfoMap.set(s.studentId, { id: s.studentId, name: `${s.student.firstName} ${s.student.lastName}` });
      }
    }

    // Fetch existing records for this class+date
    const existing = await this.repo.find({
      where: { classId, date },
    });

    const recordMap = new Map<string, AttendanceRecord>();
    for (const r of existing) {
      recordMap.set(`${r.studentId}:${r.sessionId ?? 'null'}`, r);
    }

    const sessionAttendances: Array<{
      sessionId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;

      records: any[];
    }> = [];

    const customGroups = new Map<string, typeof customSchedulesForClassDay>();
    for (const cs of customSchedulesForClassDay) {
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
    await this.bumpAttendanceCaches({ classId, date, studentIds: records.map((record) => record.studentId) });

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
    return this.cache.remember(
      {
        namespace: 'attendance-student-history',
        parts: [studentId, classId ?? null, from ?? null, to ?? null],
        tags: [`attendance:student:${studentId}`, ...(classId ? [`attendance:class:${classId}`] : [])],
        ttlMs: 15_000,
      },
      () => this.computeStudentHistory(studentId, classId, from, to),
    );
  }

  private async computeStudentHistory(
    studentId: string,
    classId?: string,
    from?: string,
    to?: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const rangeFrom = from || today.slice(0, 8) + '01';
    const rangeTo = to || this.endOfMonth(rangeFrom);
    const dates = this.eachDate(rangeFrom, rangeTo);
    const records: IStudentAttendanceHistoryItem[] = [];

    const schedules = await this.studentSchedules.find({
      where: {
        studentId,
        ...(classId ? { classId } : {}),
      },
      relations: ['class'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    const scheduleAttendanceRows = await this.scheduleSlotAttendance.find({
      where: { studentId, date: In(dates) },
    });
    const attendanceBySlot = new Map(
      scheduleAttendanceRows.map((row) => [
        this.slotKey(row.date, row.dayOfWeek, row.startTime, row.endTime),
        row,
      ]),
    );

    const cancellations = await this.scheduleSlotCancellations.find({
      where: { date: In(dates) },
    });
    const cancelledKeys = new Set(
      cancellations.map((row) => this.slotKey(row.date, row.dayOfWeek, row.startTime, row.endTime)),
    );

    for (const date of dates) {
      const dayOfWeek = JS_DOW_TO_ENUM[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
      for (const schedule of schedules) {
        if (schedule.dayOfWeek !== dayOfWeek) continue;
        const key = this.slotKey(date, schedule.dayOfWeek, schedule.startTime, schedule.endTime);
        const row = attendanceBySlot.get(key);
        records.push({
          id: row?.id,
          source: 'schedule-slot',
          date,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classId: schedule.classId,
          className: schedule.class?.name ?? null,
          status: row?.status ?? AttendanceStatus.UNMARKED,
          note: row?.note ?? schedule.note ?? null,
          cancelled: cancelledKeys.has(key),
        });
      }
    }

    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.class', 'class')
      .where('a.student_id = :studentId', { studentId })
      .andWhere('a.date >= :from', { from: rangeFrom })
      .andWhere('a.date <= :to', { to: rangeTo });

    if (classId) qb.andWhere('a.class_id = :classId', { classId });

    const classRecords = await qb.getMany();
    for (const row of classRecords) {
      const duplicateScheduleRecord = records.some(
        (record) =>
          record.source === 'schedule-slot' &&
          record.date === row.date &&
          record.classId === row.classId &&
          record.status === row.status,
      );
      if (duplicateScheduleRecord) continue;
      records.push({
        id: row.id,
        source: 'class',
        date: row.date,
        startTime: null,
        endTime: null,
        classId: row.classId,
        className: row.class?.name ?? null,
        status: row.status,
        note: row.note,
        cancelled: false,
      });
    }

    records.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (a.startTime ?? '').localeCompare(b.startTime ?? '');
    });

    const counted = records.filter((row) => !row.cancelled);
    const present = counted.filter((row) => row.status === AttendanceStatus.PRESENT).length;
    const late = counted.filter((row) => row.status === AttendanceStatus.LATE).length;
    const absent = counted.filter((row) => row.status === AttendanceStatus.ABSENT).length;
    const unmarked = counted.filter((row) => row.status === AttendanceStatus.UNMARKED).length;
    const marked = present + late + absent;
    const attended = present + late;

    return {
      studentId,
      from: rangeFrom,
      to: rangeTo,
      records,
      summary: {
        total: counted.length,
        present,
        late,
        absent,
        unmarked,
        cancelled: records.length - counted.length,
        attended,
        attendanceRate: marked > 0 ? Math.round((attended / marked) * 100) : 0,
      },
    };
  }

  /**
   * Summary stats for a class across all dates.
   */
  async getClassSummary(classId: string) {
    return this.cache.remember(
      {
        namespace: 'attendance-class-summary',
        parts: [classId],
        tags: [`attendance:class:${classId}`],
        ttlMs: 15_000,
      },
      () => this.computeClassSummary(classId),
    );
  }

  private async computeClassSummary(classId: string) {
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
   * Get all student-level schedules in the system for plotting on the master
   * calendar grid. Slots may or may not be linked to a class.
   */
  async getAllCustomSchedules() {
    return this.cache.remember(
      {
        namespace: 'attendance-all-custom-schedules',
        tags: ['attendance:schedule'],
        ttlMs: 30_000,
      },
      () => this.computeAllCustomSchedules(),
    );
  }

  private async computeAllCustomSchedules() {
    const rows = await this.studentSchedules.find({
      relations: ['class', 'student'],
      where: { student: { isActive: true } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    return rows.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: `${s.student.firstName} ${s.student.lastName}`.trim(),
      classId: s.classId,
      className: s.class?.name ?? null,
      classCode: s.class?.code ?? null,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      note: s.note,
    }));
  }

  async getScheduleSlotAttendance(
    date: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    viewer?: JwtPayload,
  ) {
    return this.cache.remember(
      {
        namespace: 'attendance-schedule-slot',
        parts: [date, dayOfWeek, startTime, endTime, this.viewerCacheKey(viewer)],
        tags: [
          'attendance:schedule',
          `attendance:date:${date}`,
          `attendance:slot:${this.slotKey(date, dayOfWeek, startTime, endTime)}`,
        ],
        ttlMs: 15_000,
      },
      () => this.computeScheduleSlotAttendance(date, dayOfWeek, startTime, endTime, viewer),
    );
  }

  private async computeScheduleSlotAttendance(
    date: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    viewer?: JwtPayload,
  ) {
    const allSchedules = await this.studentSchedules.find({
      where: { dayOfWeek, startTime, endTime, student: { isActive: true } },
      relations: ['student'],
      order: { student: { firstName: 'ASC', lastName: 'ASC' } },
    });

    // Teacher portal: only their own students (or students with no teacher).
    const hidden = await this.hiddenStudentUserIds(
      viewer,
      allSchedules.map((s) => s.studentId),
    );
    const schedules = hidden.size
      ? allSchedules.filter((s) => !hidden.has(s.studentId))
      : allSchedules;

    const studentIds = schedules.map((s) => s.studentId);
    const existing = studentIds.length
      ? await this.scheduleSlotAttendance.find({
          where: {
            date,
            dayOfWeek,
            startTime,
            endTime,
            studentId: In(studentIds),
          },
        })
      : [];
    const byStudentId = new Map(existing.map((r) => [r.studentId, r]));
    const cancellation = await this.scheduleSlotCancellations.findOne({
      where: { date, dayOfWeek, startTime, endTime },
    });

    return {
      date,
      dayOfWeek,
      startTime,
      endTime,
      cancelled: !!cancellation,
      students: schedules.map((s) => {
        const record = byStudentId.get(s.studentId);
        return {
          studentId: s.studentId,
          studentName: `${s.student.firstName} ${s.student.lastName}`.trim(),
          status: record?.status ?? AttendanceStatus.UNMARKED,
          note: record?.note ?? null,
        };
      }),
    };
  }

  async bulkUpsertScheduleSlotAttendance(
    date: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>,
    markedBy: string | null,
  ) {
    for (const r of records) {
      let row = await this.scheduleSlotAttendance.findOne({
        where: { studentId: r.studentId, date, dayOfWeek, startTime, endTime },
      });
      if (!row) {
        row = this.scheduleSlotAttendance.create({
          studentId: r.studentId,
          date,
          dayOfWeek,
          startTime,
          endTime,
        });
      }
      row.status = r.status;
      row.note = r.note ?? null;
      row.markedBy = markedBy;
      await this.scheduleSlotAttendance.save(row);
    }
    await this.bumpAttendanceCaches({
      date,
      studentIds: records.map((record) => record.studentId),
      slot: this.slotKey(date, dayOfWeek, startTime, endTime),
    });
  }

  async getScheduleSlotSummaries(from: string, to: string, viewer?: JwtPayload) {
    return this.cache.remember(
      {
        namespace: 'attendance-schedule-slot-summaries',
        parts: [from, to, this.viewerCacheKey(viewer)],
        tags: ['attendance:schedule'],
        ttlMs: 15_000,
      },
      () => this.computeScheduleSlotSummaries(from, to, viewer),
    );
  }

  private async computeScheduleSlotSummaries(from: string, to: string, viewer?: JwtPayload) {
    const dates = this.eachDate(from, to);
    if (dates.length === 0) return [];

    const allSchedules = await this.studentSchedules.find({
      where: { student: { isActive: true } },
      relations: ['student'],
    });

    // Teacher portal: drop other teachers' students so slots that end up with
    // no visible students disappear entirely from the calendar.
    const hidden = await this.hiddenStudentUserIds(
      viewer,
      allSchedules.map((s) => s.studentId),
    );
    const schedules = hidden.size
      ? allSchedules.filter((s) => !hidden.has(s.studentId))
      : allSchedules;

    const schedulesByDow = new Map<DayOfWeek, StudentSchedule[]>();
    for (const schedule of schedules) {
      const rows = schedulesByDow.get(schedule.dayOfWeek) ?? [];
      rows.push(schedule);
      schedulesByDow.set(schedule.dayOfWeek, rows);
    }

    const attendanceRows = await this.scheduleSlotAttendance.find({
      where: { date: In(dates) },
    });
    const attendanceBySlot = new Map<string, ScheduleSlotAttendanceRecord[]>();
    for (const row of attendanceRows) {
      const key = this.slotKey(row.date, row.dayOfWeek, row.startTime, row.endTime);
      const rows = attendanceBySlot.get(key) ?? [];
      rows.push(row);
      attendanceBySlot.set(key, rows);
    }

    const cancellations = await this.scheduleSlotCancellations.find({
      where: { date: In(dates) },
    });
    const cancelledKeys = new Set(
      cancellations.map((row) => this.slotKey(row.date, row.dayOfWeek, row.startTime, row.endTime)),
    );

    const summaries: Array<{
      date: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      presentCount: number;
      totalCount: number;
      cancelled: boolean;
    }> = [];

    for (const date of dates) {
      const dayOfWeek = JS_DOW_TO_ENUM[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
      const daySchedules = schedulesByDow.get(dayOfWeek) ?? [];
      const byTime = new Map<string, StudentSchedule[]>();
      for (const schedule of daySchedules) {
        const key = `${schedule.startTime}_${schedule.endTime}`;
        const rows = byTime.get(key) ?? [];
        rows.push(schedule);
        byTime.set(key, rows);
      }

      for (const [timeKey, rows] of byTime.entries()) {
        const [startTime, endTime] = timeKey.split('_');
        const key = this.slotKey(date, dayOfWeek, startTime, endTime);
        const studentIds = new Set(rows.map((row) => row.studentId));
        const presentCount = (attendanceBySlot.get(key) ?? []).filter(
          (row) =>
            studentIds.has(row.studentId) &&
            (row.status === AttendanceStatus.PRESENT || row.status === AttendanceStatus.LATE),
        ).length;

        summaries.push({
          date,
          dayOfWeek,
          startTime,
          endTime,
          presentCount,
          totalCount: rows.length,
          cancelled: cancelledKeys.has(key),
        });
      }
    }

    return summaries;
  }

  async setScheduleSlotCancellation(
    date: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    cancelled: boolean,
    cancelledBy: string | null,
    note?: string,
  ) {
    const existing = await this.scheduleSlotCancellations.findOne({
      where: { date, dayOfWeek, startTime, endTime },
    });

    if (!cancelled) {
      if (existing) await this.scheduleSlotCancellations.remove(existing);
      await this.bumpAttendanceCaches({ date, slot: this.slotKey(date, dayOfWeek, startTime, endTime) });
      return { cancelled: false };
    }

    const row =
      existing ??
      this.scheduleSlotCancellations.create({
        date,
        dayOfWeek,
        startTime,
        endTime,
      });
    row.cancelledBy = cancelledBy;
    row.note = note ?? null;
    await this.scheduleSlotCancellations.save(row);
    await this.bumpAttendanceCaches({ date, slot: this.slotKey(date, dayOfWeek, startTime, endTime) });
    return { cancelled: true };
  }

  private async bumpAttendanceCaches(opts: {
    classId?: string;
    date?: string;
    slot?: string;
    studentIds?: string[];
  }): Promise<void> {
    await this.cache.bumpTags([
      'attendance:schedule',
      'finance:monthly',
      ...(opts.classId ? [`attendance:class:${opts.classId}`] : []),
      ...(opts.date ? [`attendance:date:${opts.date}`] : []),
      ...(opts.slot ? [`attendance:slot:${opts.slot}`] : []),
      ...[...(opts.studentIds ?? [])].map((studentId) => `attendance:student:${studentId}`),
      ...[...(opts.studentIds ?? [])].map((studentId) => `student:${studentId}:dashboard`),
    ]);
  }

  private viewerCacheKey(viewer?: JwtPayload): string {
    if (!viewer) return 'anonymous';
    return `${viewer.role}:${viewer.sub}`;
  }

  private slotKey(date: string, dayOfWeek: DayOfWeek, startTime: string, endTime: string) {
    return `${date}_${dayOfWeek}_${startTime}_${endTime}`;
  }

  private eachDate(from: string, to: string): string[] {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
    const out: string[] = [];
    for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  private endOfMonth(date: string): string {
    const d = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return date;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  }
}

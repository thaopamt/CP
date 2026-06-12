import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  AttendanceStatus,
  DayOfWeek,
  FinanceBillingStatus,
  IFinanceMonthlyReport,
  IFinanceMonthlyReportParams,
  IFinanceMonthlyRow,
} from '@cp/shared';

import { AttendanceRecord } from '../attendance/attendance.entity';
import { ScheduleSlotAttendanceRecord } from '../attendance/schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from '../attendance/schedule-slot-cancellation.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentSchedule } from '../students/student-schedule.entity';

const BILLABLE_STATUSES = [AttendanceStatus.PRESENT, AttendanceStatus.LATE];
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const JS_DOW_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUN,
  1: DayOfWeek.MON,
  2: DayOfWeek.TUE,
  3: DayOfWeek.WED,
  4: DayOfWeek.THU,
  5: DayOfWeek.FRI,
  6: DayOfWeek.SAT,
};

type StudentBillingAccumulator = {
  scheduledSessions: number;
  billableSessions: number;
  classNames: Set<string>;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profiles: Repository<StudentProfile>,
    @InjectRepository(ScheduleSlotAttendanceRecord)
    private readonly scheduleSlotAttendance: Repository<ScheduleSlotAttendanceRecord>,
    @InjectRepository(ScheduleSlotCancellation)
    private readonly scheduleSlotCancellations: Repository<ScheduleSlotCancellation>,
    @InjectRepository(StudentSchedule)
    private readonly studentSchedules: Repository<StudentSchedule>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecords: Repository<AttendanceRecord>,
  ) {}

  async getMonthlyReport(params: IFinanceMonthlyReportParams = {}): Promise<IFinanceMonthlyReport> {
    const month = params.month || new Date().toISOString().slice(0, 7);
    if (!MONTH_RE.test(month)) {
      throw new BadRequestException('month must use YYYY-MM format');
    }

    const page = this.normalizePositiveInt(params.page, 1);
    const limit = Math.min(this.normalizePositiveInt(params.limit, 25), 100);
    const { from, to } = this.monthRange(month);

    const [profiles, slotRows, cancellations, legacyRows] = await Promise.all([
      this.profiles.find({ relations: ['user'], order: { createdAt: 'DESC' } }),
      this.scheduleSlotAttendance.find({
        where: { date: Between(from, to), status: In(BILLABLE_STATUSES) },
      }),
      this.scheduleSlotCancellations.find({ where: { date: Between(from, to) } }),
      this.attendanceRecords.find({
        where: { date: Between(from, to), status: In(BILLABLE_STATUSES) },
        relations: ['class'],
      }),
    ]);

    const profileByStudentId = new Map(profiles.map((profile) => [profile.userId, profile]));
    const accumulators = new Map<string, StudentBillingAccumulator>();
    const getAccumulator = (studentId: string) => {
      let acc = accumulators.get(studentId);
      if (!acc) {
        acc = { scheduledSessions: 0, billableSessions: 0, classNames: new Set<string>() };
        accumulators.set(studentId, acc);
      }
      return acc;
    };

    const studentIds = profiles.map((profile) => profile.userId);
    const schedules = studentIds.length
      ? await this.studentSchedules.find({
          where: { studentId: In(studentIds) },
          relations: ['class'],
        })
      : [];
    const scheduleBySlot = new Map(
      schedules.map((schedule) => [this.studentScheduleKey(schedule), schedule]),
    );
    const cancelledSlots = new Set(
      cancellations.map((row) => this.slotKey(row.date, row.dayOfWeek, row.startTime, row.endTime)),
    );
    const countedSlotClassKeys = new Set<string>();
    const scheduledClassKeys = new Set<string>();
    const dates = this.eachDate(from, to);

    for (const date of dates) {
      const dayOfWeek = JS_DOW_TO_ENUM[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
      for (const schedule of schedules) {
        if (schedule.dayOfWeek !== dayOfWeek) continue;
        if (cancelledSlots.has(this.slotKey(date, schedule.dayOfWeek, schedule.startTime, schedule.endTime))) continue;

        const acc = getAccumulator(schedule.studentId);
        acc.scheduledSessions += 1;
        if (schedule.class?.name) acc.classNames.add(schedule.class.name);
        scheduledClassKeys.add(this.studentDateClassKey(schedule.studentId, date, schedule.classId));
      }
    }

    for (const row of slotRows) {
      if (!BILLABLE_STATUSES.includes(row.status)) continue;
      if (!profileByStudentId.has(row.studentId)) continue;
      if (cancelledSlots.has(this.slotKey(row.date, row.dayOfWeek, row.startTime, row.endTime))) continue;

      const schedule = scheduleBySlot.get(this.attendanceSlotKey(row));
      const classId = schedule?.classId ?? null;
      const acc = getAccumulator(row.studentId);
      acc.billableSessions += 1;
      if (schedule?.class?.name) acc.classNames.add(schedule.class.name);
      countedSlotClassKeys.add(this.studentDateClassKey(row.studentId, row.date, classId));
    }

    for (const row of legacyRows) {
      if (!BILLABLE_STATUSES.includes(row.status)) continue;
      if (!profileByStudentId.has(row.studentId)) continue;
      const duplicateKey = this.studentDateClassKey(row.studentId, row.date, row.classId);
      if (countedSlotClassKeys.has(duplicateKey)) continue;

      const acc = getAccumulator(row.studentId);
      if (!scheduledClassKeys.has(duplicateKey)) acc.scheduledSessions += 1;
      acc.billableSessions += 1;
      if (row.class?.name) acc.classNames.add(row.class.name);
    }

    const search = params.search?.trim().toLowerCase();
    const allRows = profiles
      .filter((profile) => {
        if (!search) return true;
        const user = profile.user;
        const haystack = [
          user?.firstName,
          user?.lastName,
          user?.username,
          user?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      })
      .map<IFinanceMonthlyRow>((profile) => {
        const user = profile.user;
        const acc = accumulators.get(profile.userId) ?? {
          scheduledSessions: 0,
          billableSessions: 0,
          classNames: new Set<string>(),
        };
        const monthlyTuition = Math.max(0, profile.monthlyTuition ?? 0);
        const tuitionPerSession = acc.scheduledSessions > 0
          ? Math.round(monthlyTuition / acc.scheduledSessions)
          : 0;
        const amountDue = acc.scheduledSessions > 0
          ? Math.round((monthlyTuition * acc.billableSessions) / acc.scheduledSessions)
          : 0;
        const studentName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Unknown';
        const billingStatus = this.billingStatus({
          monthlyTuition,
          scheduledSessions: acc.scheduledSessions,
          billableSessions: acc.billableSessions,
        });
        return {
          profileId: profile.id,
          studentId: profile.userId,
          studentName,
          username: user?.username ?? null,
          avatarUrl: user?.avatarUrl ?? null,
          email: user?.email ?? '',
          grade: profile.grade,
          classNames: [...acc.classNames].sort((a, b) => a.localeCompare(b)),
          scheduledSessions: acc.scheduledSessions,
          billableSessions: acc.billableSessions,
          monthlyTuition,
          tuitionPerSession,
          amountDue,
          missingTuitionConfig: monthlyTuition <= 0,
          billingStatus,
        };
      });

    const summary = allRows.reduce(
      (acc, row) => {
        acc.scheduledSessions += row.scheduledSessions;
        acc.billableSessions += row.billableSessions;
        acc.totalPotentialAmount += row.monthlyTuition;
        acc.totalAmountDue += row.amountDue;
        if (row.missingTuitionConfig) acc.studentsMissingTuition += 1;
        return acc;
      },
      {
        month,
        from,
        to,
        totalStudents: allRows.length,
        scheduledSessions: 0,
        billableSessions: 0,
        totalPotentialAmount: 0,
        totalAmountDue: 0,
        studentsMissingTuition: 0,
      },
    );

    const total = allRows.length;
    const pageCount = Math.max(1, Math.ceil(total / limit));
    const start = (Math.min(page, pageCount) - 1) * limit;

    return {
      month,
      from,
      to,
      rows: allRows.slice(start, start + limit),
      summary,
      total,
      page: Math.min(page, pageCount),
      pageCount,
      limit,
    };
  }

  private normalizePositiveInt(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  }

  private monthRange(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const from = `${month}-01`;
    const to = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
    return { from, to };
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

  private studentScheduleKey(schedule: StudentSchedule) {
    return [
      schedule.studentId,
      schedule.dayOfWeek,
      this.timePart(schedule.startTime),
      this.timePart(schedule.endTime),
    ].join('_');
  }

  private attendanceSlotKey(row: ScheduleSlotAttendanceRecord) {
    return [
      row.studentId,
      row.dayOfWeek,
      this.timePart(row.startTime),
      this.timePart(row.endTime),
    ].join('_');
  }

  private slotKey(date: string, dayOfWeek: string, startTime: string, endTime: string) {
    return [date, dayOfWeek, this.timePart(startTime), this.timePart(endTime)].join('_');
  }

  private studentDateClassKey(studentId: string, date: string, classId: string | null) {
    return [studentId, date, classId ?? 'null'].join('_');
  }

  private timePart(value: string) {
    return value.slice(0, 5);
  }

  private billingStatus(row: {
    monthlyTuition: number;
    scheduledSessions: number;
    billableSessions: number;
  }): FinanceBillingStatus {
    if (row.monthlyTuition <= 0) return 'MISSING_TUITION';
    if (row.scheduledSessions <= 0) return 'NO_SCHEDULE';
    if (row.billableSessions <= 0) return 'NO_BILLABLE';
    return 'READY';
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  AttendanceStatus,
  DayOfWeek,
  EnrollmentStatus,
  FINANCE_COLLECTION_STATUSES,
  FINANCE_BILLING_STATUSES,
  FinanceBillingStatus,
  FinanceCollectionStatus,
  IFinanceMonthlyAmountDueOverride,
  IFinanceMonthlyAmountDuePayload,
  IFinanceMonthlyAmountDueResetResult,
  IFinanceMonthlyReport,
  IFinanceMonthlyReportParams,
  IFinanceMonthlyRow,
  IFinanceMonthlyStatusPayload,
  IFinanceMonthlyStatusUpdate,
} from '@cp/shared';

import { AttendanceRecord } from '../attendance/attendance.entity';
import { ScheduleSlotAttendanceRecord } from '../attendance/schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from '../attendance/schedule-slot-cancellation.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { TeacherStudent } from '../students/teacher-student.entity';
import { FinanceMonthlyAmountDue } from './finance-monthly-amount-due.entity';
import { FinanceMonthlyStatus } from './finance-monthly-status.entity';
import { SystemCacheService } from '../../common/cache/system-cache.service';

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
    @InjectRepository(FinanceMonthlyAmountDue)
    private readonly amountDueOverrides: Repository<FinanceMonthlyAmountDue>,
    @InjectRepository(FinanceMonthlyStatus)
    private readonly monthlyStatuses: Repository<FinanceMonthlyStatus>,
    @InjectRepository(TeacherStudent)
    private readonly teacherStudents: Repository<TeacherStudent>,
    private readonly cache: SystemCacheService,
  ) {}

  async getMonthlyTrend(monthStr?: string, monthsCount: number = 6, options?: { visibleStudentUserIds?: string[] }) {
    const endMonthDate = monthStr ? new Date(`${monthStr}-01T00:00:00Z`) : new Date();
    const result: Array<{ month: string; summary: any }> = [];
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(endMonthDate);
      d.setUTCMonth(d.getUTCMonth() - i);
      const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      
      const report = await this.getMonthlyReport({ month: mStr }, options);
      result.push({
        month: mStr,
        summary: report.summary,
      });
    }
    
    return result;
  }
  async getMonthlyReport(
    params: IFinanceMonthlyReportParams = {},
    options?: { visibleStudentUserIds?: string[] },
  ): Promise<IFinanceMonthlyReport> {
    const month = params.month || new Date().toISOString().slice(0, 7);
    if (!MONTH_RE.test(month)) {
      throw new BadRequestException('month must use YYYY-MM format');
    }

    const normalizedParams: IFinanceMonthlyReportParams = {
      month,
      search: params.search?.trim() || undefined,
      status: this.normalizeCollectionStatus(params.status, true) ?? undefined,
      billingStatus: this.normalizeBillingStatus(params.billingStatus, true) ?? undefined,
      studentGroup: params.studentGroup,
      page: this.normalizePositiveInt(params.page, 1),
      limit: Math.min(this.normalizePositiveInt(params.limit, 25), 100),
    };
    const visibleStudentUserIds = options?.visibleStudentUserIds
      ? [...options.visibleStudentUserIds].sort()
      : null;

    return this.cache.remember(
      {
        namespace: 'finance-monthly-report',
        parts: [normalizedParams, visibleStudentUserIds ?? 'admin'],
        tags: ['finance:monthly', `finance:month:${month}`, 'attendance:schedule', 'students:list'],
        ttlMs: 30_000,
      },
      () => this.computeMonthlyReport(normalizedParams, options),
    );
  }

  private async computeMonthlyReport(
    params: IFinanceMonthlyReportParams = {},
    options?: { visibleStudentUserIds?: string[] },
  ): Promise<IFinanceMonthlyReport> {
    const month = params.month || new Date().toISOString().slice(0, 7);
    if (!MONTH_RE.test(month)) {
      throw new BadRequestException('month must use YYYY-MM format');
    }

    const page = this.normalizePositiveInt(params.page, 1);
    const limit = Math.min(this.normalizePositiveInt(params.limit, 25), 100);
    const statusFilter = this.normalizeCollectionStatus(params.status, true);
    const billingStatusFilter = this.normalizeBillingStatus(params.billingStatus, true);
    const { from, to } = this.monthRange(month);

    const visibleSet = options?.visibleStudentUserIds
      ? new Set(options.visibleStudentUserIds)
      : null;

    const [
      allProfiles,
      slotRows,
      cancellations,
      legacyRows,
      amountDueOverrides,
      monthlyStatuses,
      teacherLinks,
    ] = await Promise.all([
        this.profiles.find({ relations: ['user'], order: { createdAt: 'DESC' } }),
        this.scheduleSlotAttendance.find({
          where: { date: Between(from, to), status: In(BILLABLE_STATUSES) },
        }),
        this.scheduleSlotCancellations.find({ where: { date: Between(from, to) } }),
        this.attendanceRecords.find({
          where: { date: Between(from, to), status: In(BILLABLE_STATUSES) },
          relations: ['class'],
        }),
        this.amountDueOverrides.find({ where: { month } }),
        this.monthlyStatuses.find({ where: { month } }),
        this.teacherStudents.find({ select: { studentId: true } }),
      ]);

    // Student profile ids that have at least one teacher assigned.
    const assignedProfileIds = new Set(teacherLinks.map((link) => link.studentId));

    // Only include students once their start month has arrived.
    const profiles = allProfiles.filter((profile) => {
      if (visibleSet && !visibleSet.has(profile.userId)) return false;
      if (!this.hasStartedByMonthEnd(profile, to)) return false;
      
      if (profile.status === EnrollmentStatus.INACTIVE || profile.status === EnrollmentStatus.GRADUATED) {
        if (profile.updatedAt) {
          const inactiveMonthStr = profile.updatedAt.toISOString().slice(0, 7);
          if (month > inactiveMonthStr) return false;
        }
      }
      return true;
    });

    const profileByStudentId = new Map(profiles.map((profile) => [profile.userId, profile]));
    const amountDueOverrideByStudentId = new Map(
      amountDueOverrides.map((override) => [override.studentId, override]),
    );
    const statusByStudentId = new Map(monthlyStatuses.map((status) => [status.studentId, status]));
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
        if (cancelledSlots.has(this.slotKey(date, schedule.dayOfWeek, schedule.startTime, schedule.endTime)))
          continue;

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
    const studentGroup = params.studentGroup;
    const allRows = profiles
      .filter((profile) => {
        if (studentGroup === 'center' && assignedProfileIds.has(profile.id)) return false;
        if (studentGroup === 'home' && !assignedProfileIds.has(profile.id)) return false;

        if (!search) return true;
        const user = profile.user;
        const haystack = [user?.firstName, user?.lastName, user?.username, user?.email]
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
        const defaultMonthlyTuition = this.coerceMoneyAmount(profile.monthlyTuition ?? 0);
        const monthlyTuition = defaultMonthlyTuition;
        const tuitionPerSession =
          acc.scheduledSessions > 0 ? Math.round(monthlyTuition / acc.scheduledSessions) : 0;
        const calculatedAmountDue =
          acc.scheduledSessions > 0
            ? Math.round((monthlyTuition * acc.billableSessions) / acc.scheduledSessions)
            : 0;
        const amountDueOverride = amountDueOverrideByStudentId.get(profile.userId);
        const amountDueOverrideAmount = amountDueOverride
          ? this.coerceMoneyAmount(amountDueOverride.amountDue)
          : null;
        const amountDue = amountDueOverrideAmount ?? calculatedAmountDue;
        const studentName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Unknown';
        const billingStatus = this.billingStatus({
          monthlyTuition,
          scheduledSessions: acc.scheduledSessions,
          billableSessions: acc.billableSessions,
          hasAmountDueOverride: amountDueOverrideAmount !== null,
        });
        const collectionStatus = this.coerceCollectionStatus(statusByStudentId.get(profile.userId)?.status);
        
        const primaryGuardian = profile.guardians?.find(g => g.isPrimary) || profile.guardians?.[0];
        const parentName = primaryGuardian?.fullName ?? null;
        const parentPhone = primaryGuardian?.phoneNumber ?? null;

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
          defaultMonthlyTuition,
          monthlyTuition,
          tuitionPerSession,
          calculatedAmountDue,
          amountDue,
          parentName,
          parentPhone,
          amountDueOverride: amountDueOverrideAmount,
          hasAmountDueOverride: amountDueOverrideAmount !== null,
          hasAssignedTeacher: assignedProfileIds.has(profile.id),
          missingTuitionConfig: monthlyTuition <= 0 && amountDueOverrideAmount === null,
          billingStatus,
          collectionStatus,
        };
      })
      .filter((row) => {
        if (!statusFilter) return true;
        if (statusFilter === 'UNPAID') return row.collectionStatus !== 'PAID';
        return row.collectionStatus === statusFilter;
      })
      .filter((row) => !billingStatusFilter || row.billingStatus === billingStatusFilter);

    const summary = allRows.reduce(
      (acc, row) => {
        acc.scheduledSessions += row.scheduledSessions;
        acc.billableSessions += row.billableSessions;
        acc.totalPotentialAmount += row.monthlyTuition;
        acc.totalAmountDue += row.amountDue;
        // Split by teacher assignment: "tại nhà" = has a teacher, "trung tâm" = none.
        if (row.hasAssignedTeacher) {
          acc.homePotentialAmount += row.monthlyTuition;
          acc.homeAmountDue += row.amountDue;
        } else {
          acc.centerPotentialAmount += row.monthlyTuition;
          acc.centerAmountDue += row.amountDue;
        }
        if (row.collectionStatus !== 'PAID') acc.totalOutstandingAmount += row.amountDue;
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
        centerPotentialAmount: 0,
        centerAmountDue: 0,
        homePotentialAmount: 0,
        homeAmountDue: 0,
        totalOutstandingAmount: 0,
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

  async setMonthlyAmountDue(
    studentId: string,
    payload: IFinanceMonthlyAmountDuePayload,
  ): Promise<IFinanceMonthlyAmountDueOverride> {
    const month = this.normalizeMonth(payload.month);
    const amountDue = this.normalizeMoneyAmount(payload.amountDue);
    const profile = await this.profiles.findOne({ where: { userId: studentId } });
    if (!profile) {
      throw new NotFoundException('student profile not found');
    }

    const existing = await this.amountDueOverrides.findOne({ where: { studentId, month } });
    const saved = await this.amountDueOverrides.save({
      ...(existing ?? {}),
      studentId,
      month,
      amountDue,
    });
    await this.bumpMonthlyFinanceCaches(month, studentId);

    return {
      studentId: saved.studentId,
      month: saved.month,
      amountDue: saved.amountDue,
    };
  }

  async resetMonthlyAmountDue(
    studentId: string,
    monthValue: string,
  ): Promise<IFinanceMonthlyAmountDueResetResult> {
    const month = this.normalizeMonth(monthValue);
    await this.amountDueOverrides.delete({ studentId, month });
    await this.bumpMonthlyFinanceCaches(month, studentId);
    return { studentId, month, reset: true };
  }

  async setMonthlyStatus(
    studentId: string,
    payload: IFinanceMonthlyStatusPayload,
  ): Promise<IFinanceMonthlyStatusUpdate> {
    const month = this.normalizeMonth(payload.month);
    const status = this.normalizeCollectionStatus(payload.status);
    if (!status || status === 'UNPAID') {
      throw new BadRequestException('status is invalid');
    }
    const profile = await this.profiles.findOne({ where: { userId: studentId } });
    if (!profile) {
      throw new NotFoundException('student profile not found');
    }

    const existing = await this.monthlyStatuses.findOne({ where: { studentId, month } });
    const saved = await this.monthlyStatuses.save({
      ...(existing ?? {}),
      studentId,
      month,
      status,
    });
    await this.bumpMonthlyFinanceCaches(month, studentId);

    return {
      studentId: saved.studentId,
      month: saved.month,
      status: saved.status,
    };
  }

  private normalizePositiveInt(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  }

  private async bumpMonthlyFinanceCaches(month: string, studentId: string): Promise<void> {
    await this.cache.bumpTags([
      'finance:monthly',
      `finance:month:${month}`,
      `student:${studentId}:dashboard`,
    ]);
  }

  private normalizeMonth(month: string | undefined): string {
    if (!month || !MONTH_RE.test(month)) {
      throw new BadRequestException('month must use YYYY-MM format');
    }
    return month;
  }

  private normalizeMoneyAmount(value: unknown): number {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('amountDue must be a non-negative number');
    }
    return Math.round(amount);
  }

  private normalizeCollectionStatus(value: unknown, allowAll = false): FinanceCollectionStatus | 'UNPAID' | undefined {
    if (allowAll && (value === undefined || value === null || value === '' || value === 'all')) {
      return undefined;
    }
    if (value === 'UNPAID') return 'UNPAID';
    if (FINANCE_COLLECTION_STATUSES.includes(value as FinanceCollectionStatus)) {
      return value as FinanceCollectionStatus;
    }
    throw new BadRequestException('status is invalid');
  }

  private normalizeBillingStatus(value: unknown, allowAll = false): FinanceBillingStatus | undefined {
    if (allowAll && (value === undefined || value === null || value === '' || value === 'all')) {
      return undefined;
    }
    if (FINANCE_BILLING_STATUSES.includes(value as FinanceBillingStatus)) {
      return value as FinanceBillingStatus;
    }
    throw new BadRequestException('billingStatus is invalid');
  }

  private coerceMoneyAmount(value: unknown): number {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 0;
    return Math.max(0, Math.round(amount));
  }

  private coerceCollectionStatus(value: unknown): FinanceCollectionStatus {
    return FINANCE_COLLECTION_STATUSES.includes(value as FinanceCollectionStatus)
      ? (value as FinanceCollectionStatus)
      : 'PENDING';
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

  private hasStartedByMonthEnd(profile: StudentProfile, monthEnd: string): boolean {
    const startDate = this.datePart(profile.startDate);
    return !startDate || startDate <= monthEnd;
  }

  private datePart(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 10) : null;
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
    return [row.studentId, row.dayOfWeek, this.timePart(row.startTime), this.timePart(row.endTime)].join('_');
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
    hasAmountDueOverride: boolean;
  }): FinanceBillingStatus {
    if (row.hasAmountDueOverride) return 'READY';
    if (row.monthlyTuition <= 0) return 'MISSING_TUITION';
    if (row.scheduledSessions <= 0) return 'NO_SCHEDULE';
    if (row.billableSessions <= 0) return 'NO_BILLABLE';
    return 'READY';
  }
}

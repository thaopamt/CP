import { ObjectLiteral, Repository } from 'typeorm';
import { AttendanceStatus, DayOfWeek, EnrollmentStatus, FinanceCollectionStatus } from '@cp/shared';

import { AttendanceRecord } from '../attendance/attendance.entity';
import { ScheduleSlotAttendanceRecord } from '../attendance/schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from '../attendance/schedule-slot-cancellation.entity';
import { ClassEntity } from '../classes/class.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { TeacherStudent } from '../students/teacher-student.entity';
import { User } from '../users/user.entity';
import { FinanceMonthlyAmountDue } from './finance-monthly-amount-due.entity';
import { FinanceMonthlyStatus } from './finance-monthly-status.entity';
import { FinanceService } from './finance.service';

function repo<T extends ObjectLiteral>(rows: T[]) {
  return {
    find: jest.fn().mockResolvedValue(rows),
    findOne: jest
      .fn()
      .mockImplementation(({ where }: { where?: Partial<T> } = {}) =>
        Promise.resolve(
          rows.find((row) =>
            Object.entries(where ?? {}).every(([key, value]) => row[key as keyof T] === value),
          ) ?? null,
        ),
      ),
    save: jest.fn().mockImplementation((row: T) => Promise.resolve(row)),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  } as unknown as Repository<T>;
}

function user(id: string, firstName: string, lastName: string): User {
  return {
    id,
    email: `${id}@cp.local`,
    username: id,
    avatarUrl: `/avatars/${id}.png`,
    firstName,
    lastName,
  } as User;
}

function profile(
  id: string,
  userId: string,
  monthlyTuition: number,
  startDate: string | null = null,
): StudentProfile {
  return {
    id,
    userId,
    user: user(userId, 'Student', userId.toUpperCase()),
    grade: 6,
    startDate,
    monthlyTuition,
  } as StudentProfile;
}

function classEntity(id: string, name: string): ClassEntity {
  return { id, name } as ClassEntity;
}

function slot(
  studentId: string,
  date: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  status: AttendanceStatus,
): ScheduleSlotAttendanceRecord {
  return { studentId, date, dayOfWeek, startTime, endTime, status } as ScheduleSlotAttendanceRecord;
}

function schedule(
  studentId: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  classId: string | null,
  className?: string,
): StudentSchedule {
  return {
    studentId,
    dayOfWeek,
    startTime,
    endTime,
    classId,
    class: classId && className ? classEntity(classId, className) : null,
  } as StudentSchedule;
}

function cancellation(
  date: string,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
): ScheduleSlotCancellation {
  return { date, dayOfWeek, startTime, endTime } as ScheduleSlotCancellation;
}

function legacy(
  studentId: string,
  classId: string,
  className: string,
  date: string,
  status: AttendanceStatus,
): AttendanceRecord {
  return {
    studentId,
    classId,
    class: classEntity(classId, className),
    date,
    status,
  } as AttendanceRecord;
}

function teacherLink(teacherId: string, studentProfileId: string): TeacherStudent {
  return { teacherId, studentId: studentProfileId } as TeacherStudent;
}

function amountDueOverride(studentId: string, month: string, amountDue: number): FinanceMonthlyAmountDue {
  return { studentId, month, amountDue } as FinanceMonthlyAmountDue;
}

function monthlyStatus(
  studentId: string,
  month: string,
  status: FinanceCollectionStatus,
): FinanceMonthlyStatus {
  return { studentId, month, status } as FinanceMonthlyStatus;
}

function serviceWith({
  profiles,
  slots = [],
  cancellations = [],
  schedules = [],
  legacyRows = [],
  amountDueOverrides = [],
  monthlyStatuses = [],
  teacherLinks = [],
}: {
  profiles: StudentProfile[];
  slots?: ScheduleSlotAttendanceRecord[];
  cancellations?: ScheduleSlotCancellation[];
  schedules?: StudentSchedule[];
  legacyRows?: AttendanceRecord[];
  amountDueOverrides?: FinanceMonthlyAmountDue[];
  monthlyStatuses?: FinanceMonthlyStatus[];
  teacherLinks?: TeacherStudent[];
}) {
  const cache = {
    remember: jest.fn((_opts, loader) => loader()),
    bumpTags: jest.fn(),
  };
  return new FinanceService(
    repo(profiles),
    repo(slots),
    repo(cancellations),
    repo(schedules),
    repo(legacyRows),
    repo(amountDueOverrides),
    repo(monthlyStatuses),
    repo(teacherLinks),
    cache as never,
  );
}

describe('FinanceService', () => {
  it('divides the effective monthly tuition across scheduled sessions and charges billable attendance', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 600_000), profile('p2', 's2', 0)],
      schedules: [
        schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', null),
        schedule('s2', DayOfWeek.SUN, '08:00:00', '09:30:00', null),
      ],
      slots: [
        slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
        slot('s1', '2026-06-09', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.LATE),
        slot('s1', '2026-06-16', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.ABSENT),
        slot('s1', '2026-06-23', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.UNMARKED),
        slot('s1', '2026-06-30', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
        slot('s2', '2026-06-07', DayOfWeek.SUN, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
      ],
      cancellations: [cancellation('2026-06-30', DayOfWeek.TUE, '08:00:00', '09:30:00')],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const s1 = report.rows.find((row) => row.studentId === 's1');
    const s2 = report.rows.find((row) => row.studentId === 's2');

    expect(s1?.scheduledSessions).toBe(4);
    expect(s1?.billableSessions).toBe(2);
    expect(s1?.defaultMonthlyTuition).toBe(600_000);
    expect(s1?.monthlyTuition).toBe(600_000);
    expect(s1?.tuitionPerSession).toBe(150_000);
    expect(s1?.calculatedAmountDue).toBe(300_000);
    expect(s1?.amountDue).toBe(300_000);
    expect(s1?.hasAmountDueOverride).toBe(false);
    expect(s1?.missingTuitionConfig).toBe(false);
    expect(s1?.billingStatus).toBe('READY');
    expect(s1?.collectionStatus).toBe('PENDING');
    expect(s1?.avatarUrl).toBe('/avatars/s1.png');
    expect(s2?.scheduledSessions).toBe(4);
    expect(s2?.billableSessions).toBe(1);
    expect(s2?.amountDue).toBe(0);
    expect(s2?.missingTuitionConfig).toBe(true);
    expect(s2?.billingStatus).toBe('MISSING_TUITION');
    expect(report.summary.scheduledSessions).toBe(8);
    expect(report.summary.billableSessions).toBe(3);
    expect(report.summary.totalPotentialAmount).toBe(600_000);
    expect(report.summary.totalAmountDue).toBe(300_000);
    expect(report.summary.totalOutstandingAmount).toBe(300_000);
  });

  it('does not double count legacy class attendance when a schedule-slot row covers the same student/date/class', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 600_000)],
      slots: [slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT)],
      schedules: [schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', 'c1', 'Algorithms')],
      legacyRows: [
        legacy('s1', 'c1', 'Algorithms', '2026-06-02', AttendanceStatus.PRESENT),
        legacy('s1', 'c1', 'Algorithms', '2026-06-03', AttendanceStatus.PRESENT),
      ],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const row = report.rows[0];

    expect(row.billableSessions).toBe(2);
    expect(row.scheduledSessions).toBe(6);
    expect(row.tuitionPerSession).toBe(100_000);
    expect(row.amountDue).toBe(200_000);
    expect(row.billingStatus).toBe('READY');
    expect(row.classNames).toEqual(['Algorithms']);
  });

  it('splits potential and collectable totals by teacher assignment (tại nhà vs trung tâm)', async () => {
    const service = serviceWith({
      // p1 (s1) has a teacher → "tại nhà"; p2 (s2) has none → "trung tâm".
      // Both scheduled all 5 Tuesdays, 1 billable each → amountDue 120k each.
      profiles: [profile('p1', 's1', 600_000), profile('p2', 's2', 600_000)],
      schedules: [
        schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', null),
        schedule('s2', DayOfWeek.TUE, '08:00:00', '09:30:00', null),
      ],
      slots: [
        slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
        slot('s2', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
      ],
      teacherLinks: [teacherLink('t1', 'p1')],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const s1 = report.rows.find((row) => row.studentId === 's1');
    const s2 = report.rows.find((row) => row.studentId === 's2');

    expect(s1?.hasAssignedTeacher).toBe(true);
    expect(s2?.hasAssignedTeacher).toBe(false);
    expect(s1?.amountDue).toBe(120_000);
    expect(s2?.amountDue).toBe(120_000);

    // Whole-cohort totals.
    expect(report.summary.totalPotentialAmount).toBe(1_200_000);
    expect(report.summary.totalAmountDue).toBe(240_000);
    // "Tại nhà" group = s1 only.
    expect(report.summary.homePotentialAmount).toBe(600_000);
    expect(report.summary.homeAmountDue).toBe(120_000);
    // "Trung tâm" group = s2 only.
    expect(report.summary.centerPotentialAmount).toBe(600_000);
    expect(report.summary.centerAmountDue).toBe(120_000);
  });

  it('marks configured students without schedule or billable attendance separately', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 600_000), profile('p2', 's2', 600_000)],
      schedules: [schedule('s2', DayOfWeek.MON, '08:00:00', '09:30:00', null)],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const s1 = report.rows.find((row) => row.studentId === 's1');
    const s2 = report.rows.find((row) => row.studentId === 's2');

    expect(s1?.billingStatus).toBe('NO_SCHEDULE');
    expect(s2?.scheduledSessions).toBe(5);
    expect(s2?.billableSessions).toBe(0);
    expect(s2?.amountDue).toBe(0);
    expect(s2?.billingStatus).toBe('NO_BILLABLE');
    expect(report.summary.totalPotentialAmount).toBe(1_200_000);
    expect(report.summary.totalAmountDue).toBe(0);
    expect(report.summary.totalOutstandingAmount).toBe(0);
  });

  it('uses a student amount due override for that report month', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 600_000)],
      amountDueOverrides: [amountDueOverride('s1', '2026-06', 850_000)],
      schedules: [schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', null)],
      slots: [slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT)],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const row = report.rows[0];

    expect(row.defaultMonthlyTuition).toBe(600_000);
    expect(row.monthlyTuition).toBe(600_000);
    expect(row.tuitionPerSession).toBe(120_000);
    expect(row.calculatedAmountDue).toBe(120_000);
    expect(row.amountDueOverride).toBe(850_000);
    expect(row.hasAmountDueOverride).toBe(true);
    expect(row.amountDue).toBe(850_000);
    expect(report.summary.totalPotentialAmount).toBe(600_000);
    expect(report.summary.totalAmountDue).toBe(850_000);
    expect(report.summary.totalOutstandingAmount).toBe(850_000);
  });

  it('filters monthly rows by collection status and excludes paid rows from outstanding amount', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 0), profile('p2', 's2', 0)],
      amountDueOverrides: [
        amountDueOverride('s1', '2026-06', 300_000),
        amountDueOverride('s2', '2026-06', 400_000),
      ],
      monthlyStatuses: [monthlyStatus('s1', '2026-06', 'PAID'), monthlyStatus('s2', '2026-06', 'SENT')],
    });

    const all = await service.getMonthlyReport({ month: '2026-06' });

    expect(all.summary.totalAmountDue).toBe(700_000);
    expect(all.summary.totalOutstandingAmount).toBe(400_000);

    const paid = await service.getMonthlyReport({ month: '2026-06', status: 'PAID' });

    expect(paid.total).toBe(1);
    expect(paid.rows[0].studentId).toBe('s1');
    expect(paid.rows[0].collectionStatus).toBe('PAID');
    expect(paid.summary.totalAmountDue).toBe(300_000);
    expect(paid.summary.totalOutstandingAmount).toBe(0);
  });

  it('excludes students from report months before their start date', async () => {
    const service = serviceWith({
      profiles: [
        profile('p1', 's1', 600_000, '2026-06-15'),
        profile('p2', 's2', 500_000),
      ],
    });

    const beforeStart = await service.getMonthlyReport({ month: '2026-05' });

    expect(beforeStart.rows.map((row) => row.studentId)).toEqual(['s2']);
    expect(beforeStart.summary.totalStudents).toBe(1);
    expect(beforeStart.summary.totalPotentialAmount).toBe(500_000);

    const startMonth = await service.getMonthlyReport({ month: '2026-06' });

    expect(startMonth.rows.map((row) => row.studentId)).toEqual(['s1', 's2']);
    expect(startMonth.summary.totalStudents).toBe(2);
    expect(startMonth.summary.totalPotentialAmount).toBe(1_100_000);
  });

  it('returns a monthly trend for the specified number of months', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 600_000)],
      schedules: [schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', null)],
      slots: [slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT)],
    });

    const trend = await service.getMonthlyTrend('2026-06', 3);
    
    expect(trend).toHaveLength(3);
    expect(trend[0].month).toBe('2026-04');
    expect(trend[1].month).toBe('2026-05');
    expect(trend[2].month).toBe('2026-06');
    expect(trend[2].summary.totalPotentialAmount).toBe(600_000);
    expect(trend[2].summary.totalAmountDue).toBe(120_000); // 1 session out of 5 scheduled in June 2026
  });

  it('excludes INACTIVE students starting from the month after their updatedAt timestamp', async () => {
    // Create an inactive profile that was updated (dropped out) in 2026-06
    const p1 = profile('p1', 's1', 600_000);
    p1.status = EnrollmentStatus.INACTIVE;
    p1.updatedAt = new Date('2026-06-15T00:00:00.000Z');

    const service = serviceWith({
      profiles: [p1],
      schedules: [schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', null)]
    });

    // They should appear in the month they dropped out (June 2026)
    const reportJune = await service.getMonthlyReport({ month: '2026-06' });
    expect(reportJune.rows.map(r => r.studentId)).toEqual(['s1']);

    // They should NOT appear in the next month (July 2026)
    const reportJuly = await service.getMonthlyReport({ month: '2026-07' });
    expect(reportJuly.rows.map(r => r.studentId)).toEqual([]);
  });
});

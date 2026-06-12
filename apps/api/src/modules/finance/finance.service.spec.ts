import { ObjectLiteral, Repository } from 'typeorm';
import { AttendanceStatus, DayOfWeek } from '@cp/shared';

import { AttendanceRecord } from '../attendance/attendance.entity';
import { ScheduleSlotAttendanceRecord } from '../attendance/schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from '../attendance/schedule-slot-cancellation.entity';
import { ClassEntity } from '../classes/class.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { User } from '../users/user.entity';
import { FinanceService } from './finance.service';

function repo<T extends ObjectLiteral>(rows: T[]) {
  return {
    find: jest.fn().mockResolvedValue(rows),
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

function profile(id: string, userId: string, monthlyTuition: number): StudentProfile {
  return {
    id,
    userId,
    user: user(userId, 'Student', userId.toUpperCase()),
    grade: 6,
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

function serviceWith({
  profiles,
  slots = [],
  cancellations = [],
  schedules = [],
  legacyRows = [],
}: {
  profiles: StudentProfile[];
  slots?: ScheduleSlotAttendanceRecord[];
  cancellations?: ScheduleSlotCancellation[];
  schedules?: StudentSchedule[];
  legacyRows?: AttendanceRecord[];
}) {
  return new FinanceService(
    repo(profiles),
    repo(slots),
    repo(cancellations),
    repo(schedules),
    repo(legacyRows),
  );
}

describe('FinanceService', () => {
  it('divides monthly tuition across scheduled sessions and only charges PRESENT/LATE non-cancelled attendance', async () => {
    const service = serviceWith({
      profiles: [
        profile('p1', 's1', 600_000),
        profile('p2', 's2', 0),
      ],
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
    expect(s1?.monthlyTuition).toBe(600_000);
    expect(s1?.tuitionPerSession).toBe(150_000);
    expect(s1?.amountDue).toBe(300_000);
    expect(s1?.missingTuitionConfig).toBe(false);
    expect(s1?.billingStatus).toBe('READY');
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
  });

  it('does not double count legacy class attendance when a schedule-slot row covers the same student/date/class', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 600_000)],
      slots: [
        slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
      ],
      schedules: [
        schedule('s1', DayOfWeek.TUE, '08:00:00', '09:30:00', 'c1', 'Algorithms'),
      ],
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

  it('marks configured students without schedule or billable attendance separately', async () => {
    const service = serviceWith({
      profiles: [
        profile('p1', 's1', 600_000),
        profile('p2', 's2', 600_000),
      ],
      schedules: [
        schedule('s2', DayOfWeek.MON, '08:00:00', '09:30:00', null),
      ],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const s1 = report.rows.find((row) => row.studentId === 's1');
    const s2 = report.rows.find((row) => row.studentId === 's2');

    expect(s1?.billingStatus).toBe('NO_SCHEDULE');
    expect(s2?.scheduledSessions).toBe(5);
    expect(s2?.billableSessions).toBe(0);
    expect(s2?.billingStatus).toBe('NO_BILLABLE');
    expect(report.summary.totalPotentialAmount).toBe(1_200_000);
  });
});

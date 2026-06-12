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
    firstName,
    lastName,
  } as User;
}

function profile(id: string, userId: string, tuitionPerSession: number): StudentProfile {
  return {
    id,
    userId,
    user: user(userId, 'Student', userId.toUpperCase()),
    grade: 6,
    tuitionPerSession,
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
  it('counts PRESENT and LATE sessions, excludes ABSENT, UNMARKED, and cancelled slots', async () => {
    const service = serviceWith({
      profiles: [
        profile('p1', 's1', 100_000),
        profile('p2', 's2', 0),
      ],
      slots: [
        slot('s1', '2026-06-02', DayOfWeek.TUE, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
        slot('s1', '2026-06-03', DayOfWeek.WED, '08:00:00', '09:30:00', AttendanceStatus.LATE),
        slot('s1', '2026-06-04', DayOfWeek.THU, '08:00:00', '09:30:00', AttendanceStatus.ABSENT),
        slot('s1', '2026-06-05', DayOfWeek.FRI, '08:00:00', '09:30:00', AttendanceStatus.UNMARKED),
        slot('s1', '2026-06-06', DayOfWeek.SAT, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
        slot('s2', '2026-06-07', DayOfWeek.SUN, '08:00:00', '09:30:00', AttendanceStatus.PRESENT),
      ],
      cancellations: [cancellation('2026-06-06', DayOfWeek.SAT, '08:00:00', '09:30:00')],
    });

    const report = await service.getMonthlyReport({ month: '2026-06' });
    const s1 = report.rows.find((row) => row.studentId === 's1');
    const s2 = report.rows.find((row) => row.studentId === 's2');

    expect(s1?.billableSessions).toBe(2);
    expect(s1?.amountDue).toBe(200_000);
    expect(s1?.missingTuitionConfig).toBe(false);
    expect(s2?.billableSessions).toBe(1);
    expect(s2?.amountDue).toBe(0);
    expect(s2?.missingTuitionConfig).toBe(true);
    expect(report.summary.billableSessions).toBe(3);
    expect(report.summary.totalAmountDue).toBe(200_000);
  });

  it('does not double count legacy class attendance when a schedule-slot row covers the same student/date/class', async () => {
    const service = serviceWith({
      profiles: [profile('p1', 's1', 50_000)],
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
    expect(row.amountDue).toBe(100_000);
    expect(row.classNames).toEqual(['Algorithms']);
  });
});

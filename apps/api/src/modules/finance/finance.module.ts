import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttendanceRecord } from '../attendance/attendance.entity';
import { ScheduleSlotAttendanceRecord } from '../attendance/schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from '../attendance/schedule-slot-cancellation.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { FinanceController } from './finance.controller';
import { FinanceMonthlyAmountDue } from './finance-monthly-amount-due.entity';
import { FinanceMonthlyStatus } from './finance-monthly-status.entity';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      ScheduleSlotAttendanceRecord,
      ScheduleSlotCancellation,
      StudentSchedule,
      AttendanceRecord,
      FinanceMonthlyAmountDue,
      FinanceMonthlyStatus,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}

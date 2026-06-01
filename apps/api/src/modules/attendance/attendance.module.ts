import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttendanceRecord } from './attendance.entity';
import { ClassEntity } from '../classes/class.entity';
import { ClassSession } from '../classes/class-session.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentSchedule } from '../students/student-schedule.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecord,
      ClassEntity,
      ClassSession,
      Enrollment,
      StudentSchedule,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

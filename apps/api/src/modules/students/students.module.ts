import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { ClassEntity } from '../classes/class.entity';
import { ClassSession } from '../classes/class-session.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentProfile } from './student-profile.entity';
import { Guardian } from './guardian.entity';
import { StudentSchedule } from './student-schedule.entity';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentScheduleController } from './student-schedule.controller';
import { StudentsService } from './students.service';
import { StudentScheduleService } from './student-schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      Guardian,
      User,
      StudentSchedule,
      ClassEntity,
      ClassSession,
      Enrollment,
    ]),
  ],
  controllers: [StudentsController, StudentDashboardController, StudentScheduleController],
  providers: [StudentsService, StudentScheduleService],
  exports: [StudentsService, StudentScheduleService],
})
export class StudentsModule {}

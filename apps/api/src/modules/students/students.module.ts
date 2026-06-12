import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { ClassEntity } from '../classes/class.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentProfile } from './student-profile.entity';
import { Guardian } from './guardian.entity';
import { StudentSchedule } from './student-schedule.entity';
import { TeacherStudent } from './teacher-student.entity';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentScheduleController } from './student-schedule.controller';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { StudentsService } from './students.service';
import { StudentScheduleService } from './student-schedule.service';
import { TeacherAssignmentsService } from './teacher-assignments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      Guardian,
      User,
      StudentSchedule,
      ClassEntity,
      Enrollment,
      TeacherStudent,
    ]),
  ],
  controllers: [
    StudentsController,
    StudentDashboardController,
    StudentScheduleController,
    TeacherAssignmentsController,
  ],
  providers: [StudentsService, StudentScheduleService, TeacherAssignmentsService],
  exports: [StudentsService, StudentScheduleService, TeacherAssignmentsService],
})
export class StudentsModule {}

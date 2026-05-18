import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';
import { Guardian } from './guardian.entity';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfile, Guardian, User])],
  controllers: [StudentsController, StudentDashboardController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}

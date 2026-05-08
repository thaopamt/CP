import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { ClassEntity } from './class.entity';
import { ClassSession } from './class-session.entity';
import { Enrollment } from './enrollment.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, ClassSession, Enrollment, User])],
  controllers: [ClassesController, EnrollmentsController],
  providers: [ClassesService, EnrollmentsService],
  exports: [ClassesService, EnrollmentsService],
})
export class ClassesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { ClassEntity } from './class.entity';
import { ClassSession } from './class-session.entity';
import { Enrollment } from './enrollment.entity';
import { ClassCourse } from './class-course.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { ClassCoursesController } from './class-courses.controller';
import { ClassCoursesService } from './class-courses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassEntity,
      ClassSession,
      Enrollment,
      ClassCourse,
      Course,
      User,
    ]),
  ],
  controllers: [ClassesController, EnrollmentsController, ClassCoursesController],
  providers: [ClassesService, EnrollmentsService, ClassCoursesService],
  exports: [ClassesService, EnrollmentsService, ClassCoursesService],
})
export class ClassesModule {}

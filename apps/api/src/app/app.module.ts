import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmConfig } from '../config/typeorm.config';
import { envValidationSchema } from '../config/env.validation';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { ClassesModule } from '../modules/classes/classes.module';
import { StudentsModule } from '../modules/students/students.module';
import { AssignmentsModule } from '../modules/assignments/assignments.module';
import { CoursesModule } from '../modules/courses/courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    AuthModule,
    UsersModule,
    AssignmentsModule,
    CoursesModule,
    ClassesModule,
    StudentsModule,
  ],
})
export class AppModule {}

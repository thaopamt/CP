import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmConfig } from '../config/typeorm.config';
import { envValidationSchema } from '../config/env.validation';
import { SystemCacheModule } from '../common/cache/system-cache.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { ClassesModule } from '../modules/classes/classes.module';
import { StudentsModule } from '../modules/students/students.module';
import { AssignmentsModule } from '../modules/assignments/assignments.module';
import { CoursesModule } from '../modules/courses/courses.module';
import { SubmissionsModule } from '../modules/submissions/submissions.module';
import { ExamsModule } from '../modules/exams/exams.module';
import { QuestsModule } from '../modules/quests/quests.module';
import { ShopModule } from '../modules/shop/shop.module';
import { LiveMonitorModule } from '../modules/live-monitor/live-monitor.module';

import { AttendanceModule } from '../modules/attendance/attendance.module';
import { MazeModule } from '../modules/maze/maze.module';
import { FinanceModule } from '../modules/finance/finance.module';
import { BlogModule } from '../modules/blog/blog.module';
import { ChatModule } from '../modules/chat/chat.module';

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
    SystemCacheModule,
    AuthModule,
    UsersModule,
    AssignmentsModule,
    CoursesModule,
    ClassesModule,
    StudentsModule,
    SubmissionsModule,
    ExamsModule,
    QuestsModule,
    ShopModule,
    LiveMonitorModule,

    AttendanceModule,
    FinanceModule,
    MazeModule,
    BlogModule,
    ChatModule,
  ],
})
export class AppModule {}

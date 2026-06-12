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
import { SubmissionsModule } from '../modules/submissions/submissions.module';
import { QuestsModule } from '../modules/quests/quests.module';
import { ShopModule } from '../modules/shop/shop.module';
import { LiveMonitorModule } from '../modules/live-monitor/live-monitor.module';
import { GlobalChatModule } from '../modules/global-chat/global-chat.module';
import { AttendanceModule } from '../modules/attendance/attendance.module';
import { MazeModule } from '../modules/maze/maze.module';
import { FinanceModule } from '../modules/finance/finance.module';

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
    SubmissionsModule,
    QuestsModule,
    ShopModule,
    LiveMonitorModule,
    GlobalChatModule,
    AttendanceModule,
    FinanceModule,
    MazeModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsController } from './submissions.controller';
import { ExecutionService } from './execution.service';
import { InteractiveExecGateway } from './interactive-exec.gateway';
import { SubmissionEventsGateway } from './submission-events.gateway';
import { Submission, SubmissionTestResult } from './submission.entity';
import { StudentAssignmentProgress } from './student-assignment-progress.entity';
import { StudentAssignmentProgressService } from './student-assignment-progress.service';
import { Assignment } from '../assignments/assignment.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { QuestsModule } from '../quests/quests.module';
import { TestcasesModule } from '../testcases/testcases.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, SubmissionTestResult, StudentAssignmentProgress, Assignment, StudentProfile]),
    UsersModule,
    QuestsModule,
    TestcasesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') ?? '1d' },
      }),
    }),
  ],
  controllers: [SubmissionsController],
  providers: [ExecutionService, InteractiveExecGateway, SubmissionEventsGateway, StudentAssignmentProgressService],
  exports: [ExecutionService, StudentAssignmentProgressService],
})
export class SubmissionsModule {}

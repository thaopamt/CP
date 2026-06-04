import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsController } from './submissions.controller';
import { ExecutionService } from './execution.service';
import { InteractiveExecGateway } from './interactive-exec.gateway';
import { SubmissionEventsGateway } from './submission-events.gateway';
import { Submission, SubmissionTestResult } from './submission.entity';
import { Assignment } from '../assignments/assignment.entity';
import { QuestsModule } from '../quests/quests.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, SubmissionTestResult, Assignment]),
    UsersModule,
    QuestsModule,
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
  providers: [ExecutionService, InteractiveExecGateway, SubmissionEventsGateway],
  exports: [ExecutionService],
})
export class SubmissionsModule {}

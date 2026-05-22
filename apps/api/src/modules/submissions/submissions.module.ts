import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsController } from './submissions.controller';
import { ExecutionService } from './execution.service';
import { InteractiveExecGateway } from './interactive-exec.gateway';
import { Submission, SubmissionTestResult } from './submission.entity';
import { Assignment } from '../assignments/assignment.entity';
import { QuestsModule } from '../quests/quests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, SubmissionTestResult, Assignment]),
    QuestsModule,
  ],
  controllers: [SubmissionsController],
  providers: [ExecutionService, InteractiveExecGateway],
  exports: [ExecutionService],
})
export class SubmissionsModule {}


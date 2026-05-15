import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsController } from './submissions.controller';
import { ExecutionService } from './execution.service';
import { Submission, SubmissionTestResult } from './submission.entity';
import { Assignment } from '../assignments/assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, SubmissionTestResult, Assignment]),
  ],
  controllers: [SubmissionsController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class SubmissionsModule {}

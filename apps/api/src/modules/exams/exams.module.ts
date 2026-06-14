import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Exam } from './exam.entity';
import { ExamProblem } from './exam-problem.entity';
import { ExamParticipant } from './exam-participant.entity';
import { ExamRankingSnapshot } from './exam-ranking-snapshot.entity';
import { ExamRewardRule } from './exam-reward-rule.entity';
import { ExamRewardGrant } from './exam-reward-grant.entity';
import { ExamAuditLog } from './exam-audit-log.entity';

import { Submission, SubmissionTestResult } from '../submissions/submission.entity';
import { Assignment } from '../assignments/assignment.entity';
import { User } from '../users/user.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { Badge } from '../quests/badge.entity';
import { StudentBadge } from '../quests/student-badge.entity';

import { ExamsService } from './exams.service';
import { ExamScoringService } from './exam-scoring.service';
import { ExamRankingService } from './exam-ranking.service';
import { ExamAuditService } from './exam-audit.service';
import { ExamSubmissionService } from './exam-submission.service';
import { ExamFinalizeService } from './exam-finalize.service';
import { ExamRewardService } from './exam-reward.service';
import { ExamRejudgeService } from './exam-rejudge.service';
import { ExamEventsGateway } from './exam-events.gateway';

import { ExamsController } from './exams.controller';
import { ExamProblemsController } from './exam-problems.controller';
import { ExamParticipantsController } from './exam-participants.controller';
import { ExamRewardsController } from './exam-rewards.controller';
import { StudentExamsController } from './student-exams.controller';

import { SubmissionsModule } from '../submissions/submissions.module';
import { QuestsModule } from '../quests/quests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      ExamProblem,
      ExamParticipant,
      ExamRankingSnapshot,
      ExamRewardRule,
      ExamRewardGrant,
      ExamAuditLog,
      Submission,
      SubmissionTestResult,
      Assignment,
      User,
      Enrollment,
      StudentProfile,
      Badge,
      StudentBadge,
    ]),
    SubmissionsModule, // ExecutionService
    QuestsModule, // GamificationGateway
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') ?? '1d' },
      }),
    }),
  ],
  controllers: [
    ExamsController,
    ExamProblemsController,
    ExamParticipantsController,
    ExamRewardsController,
    StudentExamsController,
  ],
  providers: [
    ExamsService,
    ExamScoringService,
    ExamRankingService,
    ExamAuditService,
    ExamSubmissionService,
    ExamFinalizeService,
    ExamRewardService,
    ExamRejudgeService,
    ExamEventsGateway,
  ],
  exports: [ExamsService, ExamScoringService, ExamRankingService],
})
export class ExamsModule {}

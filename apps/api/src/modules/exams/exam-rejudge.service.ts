import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAuditAction } from '@cp/shared';
import { Submission, SubmissionTestResult } from '../submissions/submission.entity';
import { ExecutionService } from '../submissions/execution.service';
import { Assignment } from '../assignments/assignment.entity';
import { ExamProblem } from './exam-problem.entity';
import { ExamScoringService } from './exam-scoring.service';
import { ExamRankingService } from './exam-ranking.service';
import { ExamAuditService } from './exam-audit.service';
import { ExamEventsGateway } from './exam-events.gateway';

@Injectable()
export class ExamRejudgeService {
  private readonly logger = new Logger(ExamRejudgeService.name);

  constructor(
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(SubmissionTestResult) private readonly testResults: Repository<SubmissionTestResult>,
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    @InjectRepository(ExamProblem) private readonly examProblems: Repository<ExamProblem>,
    private readonly execution: ExecutionService,
    private readonly scoring: ExamScoringService,
    private readonly ranking: ExamRankingService,
    private readonly audit: ExamAuditService,
    private readonly gateway: ExamEventsGateway,
  ) {}

  async rejudgeExam(examId: string, actorId: string | null): Promise<{ rejudged: number }> {
    const subs = await this.submissions.find({ where: { examId } });
    return this.runBatch(examId, subs, actorId);
  }

  async rejudgeProblem(examId: string, examProblemId: string, actorId: string | null): Promise<{ rejudged: number }> {
    const problem = await this.examProblems.findOne({ where: { id: examProblemId, examId } });
    if (!problem) throw new NotFoundException('Exam problem not found');
    const subs = await this.submissions.find({ where: { examId, assignmentId: problem.assignmentId } });
    return this.runBatch(examId, subs, actorId);
  }

  async rejudgeSubmission(examId: string, submissionId: string, actorId: string | null): Promise<{ rejudged: number }> {
    const sub = await this.submissions.findOne({ where: { id: submissionId, examId } });
    if (!sub) throw new NotFoundException('Submission not found');
    return this.runBatch(examId, [sub], actorId);
  }

  private async runBatch(examId: string, subs: Submission[], actorId: string | null): Promise<{ rejudged: number }> {
    await this.audit.log(examId, actorId, ExamAuditAction.REJUDGE_STARTED, { count: subs.length });

    // Cache assignments + exam problems to avoid refetching per submission.
    const assignmentCache = new Map<string, Assignment | null>();
    const problemCache = new Map<string, ExamProblem | null>();

    let rejudged = 0;
    for (const sub of subs) {
      try {
        await this.rejudgeOne(examId, sub, assignmentCache, problemCache);
        rejudged += 1;
      } catch (err) {
        this.logger.error(`Rejudge failed for submission ${sub.id}: ${err instanceof Error ? err.message : err}`);
      }
    }

    this.ranking.invalidate(examId);
    this.gateway.emitLeaderboardChanged(examId);
    await this.audit.log(examId, actorId, ExamAuditAction.REJUDGE_COMPLETED, { rejudged, total: subs.length });
    return { rejudged };
  }

  private async rejudgeOne(
    examId: string,
    sub: Submission,
    assignmentCache: Map<string, Assignment | null>,
    problemCache: Map<string, ExamProblem | null>,
  ): Promise<void> {
    let assignment = assignmentCache.get(sub.assignmentId);
    if (assignment === undefined) {
      assignment = await this.assignments.findOne({ where: { id: sub.assignmentId } });
      assignmentCache.set(sub.assignmentId, assignment);
    }
    if (!assignment) return;

    let problem = problemCache.get(sub.assignmentId);
    if (problem === undefined) {
      problem = await this.examProblems.findOne({ where: { examId, assignmentId: sub.assignmentId } });
      problemCache.set(sub.assignmentId, problem);
    }
    if (!problem) return;

    const grade = await this.execution.gradeSubmission(assignment, sub.language, sub.code, {});

    // Replace old testcase results.
    await this.testResults.delete({ submissionId: sub.id });

    sub.status = grade.status;
    sub.passedCount = grade.passedCount;
    sub.totalCount = grade.totalCount;
    sub.totalExecutionTimeMs = grade.totalTime;
    sub.maxMemoryBytes = grade.maxMemory;
    sub.testResults = grade.testResults.map((tr) => {
      const e = new SubmissionTestResult();
      e.testCaseIndex = tr.testCaseIndex;
      e.status = tr.status;
      e.input = tr.input ?? null;
      e.expectedOutput = tr.expectedOutput;
      e.actualOutput = tr.actualOutput;
      e.errorMessage = tr.errorMessage;
      e.executionTimeMs = tr.executionTimeMs;
      e.memoryBytes = tr.memoryBytes;
      return e;
    });
    sub.examScore = this.scoring.computeSubmissionScore(
      grade.testResults.map((tr) => ({ testCaseIndex: tr.testCaseIndex, status: tr.status })),
      {
        examProblemId: problem.id,
        assignmentId: problem.assignmentId,
        label: problem.label,
        points: problem.points,
        scoringMode: problem.scoringMode,
        subtaskConfig: problem.subtaskConfig,
      },
    );
    await this.submissions.save(sub);
  }
}

import { Controller, Post, Get, Body, UseGuards, Req, Param, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExecutionService } from './execution.service';
import { Submission, SubmissionTestResult } from './submission.entity';
import { SubmissionEventsGateway } from './submission-events.gateway';
import { Assignment } from '../assignments/assignment.entity';
import { QuestsService } from '../quests/quests.service';
import {
  ICodeExecutionRequest,
  IRealtimeSubmission,
  ISubmissionJudgeProgress,
  ISubmissionRealtimeTestResult,
  ISubmitCodePayload,
  SubmissionStatus,
} from '@cp/shared';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(
    private readonly executionService: ExecutionService,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(SubmissionTestResult)
    private readonly testResultRepo: Repository<SubmissionTestResult>,
    private readonly questsService: QuestsService,
    private readonly submissionEvents: SubmissionEventsGateway,
  ) {}

  @Post('run')
  async runCode(@Body() payload: ICodeExecutionRequest) {
    return this.executionService.runCode(payload.language, payload.code, payload.stdin);
  }

  /**
   * Student: own submissions across all assignments — paginated + filtered.
   */
  @Get('my')
  async getAllMySubmissions(
    @Req() req: any,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('language') language?: string,
  ) {
    return this.queryPaginated({
      userId: req.user.sub,
      page: this.toInt(pageStr, 1),
      limit: this.toInt(limitStr, 20),
      search,
      status,
      language,
    });
  }

  /**
   * Authenticated feed: all students' submissions — paginated + filtered.
   */
  @Get('all')
  async getAllSubmissions(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('language') language?: string,
  ) {
    return this.queryPaginated({
      page: this.toInt(pageStr, 1),
      limit: this.toInt(limitStr, 20),
      search,
      status,
      language,
    });
  }

  private toInt(v: string | undefined, fallback: number): number {
    const n = parseInt(v ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  /**
   * Shared paginated/filtered submission query. Joins assignment + user for the
   * page, loads testResults for the page rows separately (so one-to-many never
   * corrupts the LIMIT), and returns status stats over the filtered scope.
   */
  private async queryPaginated(opts: {
    userId?: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
    language?: string;
  }) {
    const limit = Math.min(opts.limit, 100);
    const search = opts.search?.trim();
    const status = opts.status && opts.status !== 'ALL' ? opts.status : undefined;
    const language = opts.language && opts.language !== 'ALL' ? opts.language : undefined;

    // Apply scope (user) + search + language to a query builder. Status is applied
    // only to the list, NOT to the stats, so the stat cards show the distribution.
    const applyScope = (qb: ReturnType<Repository<Submission>['createQueryBuilder']>) => {
      if (opts.userId) qb.andWhere('s.userId = :userId', { userId: opts.userId });
      if (language) qb.andWhere('s.language = :language', { language });
      if (search) {
        qb.andWhere(
          new Brackets((b) => {
            b.where('a.title ILIKE :q')
              .orWhere('u.firstName ILIKE :q')
              .orWhere('u.lastName ILIKE :q')
              .orWhere('u.username ILIKE :q');
          }),
          { q: `%${search}%` },
        );
      }
    };

    const listQb = this.submissionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.assignment', 'a')
      .leftJoinAndSelect('s.user', 'u')
      .orderBy('s.createdAt', 'DESC');
    applyScope(listQb);
    if (status) listQb.andWhere('s.status = :status', { status });

    const [rows, total] = await listQb
      .skip((opts.page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Attach testResults for the page rows.
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const trs = await this.testResultRepo.find({ where: { submissionId: In(ids) } });
      const byId = new Map<string, SubmissionTestResult[]>();
      for (const tr of trs) {
        const list = byId.get(tr.submissionId) ?? [];
        list.push(tr);
        byId.set(tr.submissionId, list);
      }
      for (const r of rows) (r as any).testResults = byId.get(r.id) ?? [];
    }

    // Status distribution over the filtered scope (ignores the status filter + paging).
    const statsQb = this.submissionRepo
      .createQueryBuilder('s')
      .leftJoin('s.assignment', 'a')
      .leftJoin('s.user', 'u')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status');
    applyScope(statsQb);
    const statRows = await statsQb.getRawMany<{ status: string; count: string }>();

    let statTotal = 0;
    let accepted = 0;
    let wrong = 0;
    for (const r of statRows) {
      const c = Number(r.count);
      statTotal += c;
      if (r.status === SubmissionStatus.ACCEPTED) accepted += c;
      else if (r.status === SubmissionStatus.WRONG_ANSWER) wrong += c;
    }

    return {
      data: rows,
      total,
      page: opts.page,
      pageCount: Math.max(1, Math.ceil(total / limit)),
      stats: { total: statTotal, accepted, wrong, other: statTotal - accepted - wrong },
    };
  }

  @Get('assignment/:assignmentId')
  async getMySubmissions(@Req() req: any, @Param('assignmentId') assignmentId: string) {
    const userId = req.user.sub;
    const submissions = await this.submissionRepo.find({
      where: { userId, assignmentId },
      order: { createdAt: 'DESC' },
      relations: ['testResults'],
    });
    return submissions;
  }

  @Post('submit')
  async submitCode(@Req() req: any, @Body() payload: ISubmitCodePayload) {
    const userId = req.user.sub;
    
    // Fetch assignment with codingConfig
    const assignment = await this.assignmentRepo.findOne({
      where: { id: payload.assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const totalCount = this.getAssignmentTotalCount(assignment);

    // Initial submission entry
    const submission = this.submissionRepo.create({
      userId,
      assignmentId: assignment.id,
      language: payload.language,
      code: payload.code,
      status: SubmissionStatus.PENDING,
      totalCount,
    });
    await this.submissionRepo.save(submission);

    const liveSubmission = await this.findSubmissionForRealtime(submission.id);
    const liveTestResults: ISubmissionRealtimeTestResult[] = [];

    this.emitRealtimeEvent('created', liveSubmission, {
      phase: 'queued',
      currentTestCaseIndex: null,
      completedCount: 0,
      passedCount: 0,
      totalCount,
      status: SubmissionStatus.PENDING,
      message: 'Submission queued',
      updatedAt: new Date().toISOString(),
    }, liveTestResults);

    try {
      // Grade the submission
      const gradeResult = await this.executionService.gradeSubmission(
        assignment,
        payload.language,
        payload.code,
        {
          onTestCaseStart: ({ testCaseIndex, totalCount }) => {
            this.emitRealtimeEvent('testcase_started', liveSubmission, {
              phase: 'running',
              currentTestCaseIndex: testCaseIndex,
              completedCount: liveTestResults.length,
              passedCount: liveTestResults.filter((tr) => tr.status === SubmissionStatus.ACCEPTED).length,
              totalCount,
              status: SubmissionStatus.PENDING,
              message: `Judging testcase #${testCaseIndex + 1}`,
              updatedAt: new Date().toISOString(),
            }, liveTestResults);
          },
          onTestCaseComplete: ({ testResult, completedCount, passedCount, totalCount, totalTime, maxMemory, status }) => {
            liveTestResults.push(testResult);
            liveSubmission.passedCount = passedCount;
            liveSubmission.totalCount = totalCount;
            liveSubmission.totalExecutionTimeMs = totalTime;
            liveSubmission.maxMemoryBytes = maxMemory;

            this.emitRealtimeEvent('testcase_finished', liveSubmission, {
              phase: completedCount === totalCount ? 'completed' : 'running',
              currentTestCaseIndex: null,
              completedCount,
              passedCount,
              totalCount,
              status,
              message: `Finished testcase #${testResult.testCaseIndex + 1}`,
              updatedAt: new Date().toISOString(),
            }, liveTestResults, testResult);
          },
        },
      );

      // Update submission with results
      submission.status = gradeResult.status;
      submission.passedCount = gradeResult.passedCount;
      submission.totalCount = gradeResult.totalCount;
      submission.totalExecutionTimeMs = gradeResult.totalTime;
      submission.maxMemoryBytes = gradeResult.maxMemory;
      submission.testResults = gradeResult.testResults.map(tr => {
        const trEntity = new SubmissionTestResult();
        trEntity.testCaseIndex = tr.testCaseIndex;
        trEntity.status = tr.status;
        trEntity.expectedOutput = tr.expectedOutput;
        trEntity.actualOutput = tr.actualOutput;
        trEntity.errorMessage = tr.errorMessage;
        trEntity.executionTimeMs = tr.executionTimeMs;
        trEntity.memoryBytes = tr.memoryBytes;
        return trEntity;
      });

      await this.submissionRepo.save(submission);
      const completedSubmission = await this.findSubmissionForRealtime(submission.id);

      this.emitRealtimeEvent('completed', completedSubmission, {
        phase: 'completed',
        currentTestCaseIndex: null,
        completedCount: gradeResult.testResults.length,
        passedCount: gradeResult.passedCount,
        totalCount: gradeResult.totalCount,
        status: gradeResult.status,
        message: 'Submission graded',
        updatedAt: new Date().toISOString(),
      });

      if (submission.status === SubmissionStatus.ACCEPTED) {
        // Trigger quest progress
        await this.questsService.handleSubmissionAccepted(userId).catch(e => {
          console.error('Failed to update quest progress:', e);
        });
      }

      return {
        submission,
        message: 'Submission graded successfully',
      };
    } catch (error: any) {
      submission.status = SubmissionStatus.INTERNAL_ERROR;
      await this.submissionRepo.save(submission);
      const failedSubmission = await this.findSubmissionForRealtime(submission.id);
      this.emitRealtimeEvent('failed', failedSubmission, {
        phase: 'failed',
        currentTestCaseIndex: null,
        completedCount: liveTestResults.length,
        passedCount: liveTestResults.filter((tr) => tr.status === SubmissionStatus.ACCEPTED).length,
        totalCount,
        status: SubmissionStatus.INTERNAL_ERROR,
        message: error?.message || 'Submission failed',
        updatedAt: new Date().toISOString(),
      }, liveTestResults);
      throw error;
    }
  }

  private async findSubmissionForRealtime(submissionId: string): Promise<Submission> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['testResults', 'assignment', 'user'],
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    submission.testResults = (submission.testResults ?? []).sort((a, b) => a.testCaseIndex - b.testCaseIndex);
    return submission;
  }

  private emitRealtimeEvent(
    event: 'created' | 'testcase_started' | 'testcase_finished' | 'completed' | 'failed',
    submission: Submission,
    progress: ISubmissionJudgeProgress,
    liveTestResults?: ISubmissionRealtimeTestResult[],
    testResult?: ISubmissionRealtimeTestResult,
  ) {
    this.submissionEvents.publishSubmissionEvent({
      event,
      submission: this.serializeRealtimeSubmission(submission, progress, liveTestResults),
      testResult,
      currentTestCaseIndex: progress.currentTestCaseIndex,
      timestamp: new Date().toISOString(),
    });
  }

  private serializeRealtimeSubmission(
    submission: Submission,
    progress?: ISubmissionJudgeProgress,
    liveTestResults?: ISubmissionRealtimeTestResult[],
  ): IRealtimeSubmission {
    return {
      id: submission.id,
      userId: submission.userId,
      assignmentId: submission.assignmentId,
      language: submission.language,
      code: submission.code,
      status: submission.status,
      totalExecutionTimeMs: submission.totalExecutionTimeMs ?? undefined,
      maxMemoryBytes: submission.maxMemoryBytes ?? undefined,
      passedCount: submission.passedCount ?? 0,
      totalCount: submission.totalCount ?? 0,
      testResults: (liveTestResults ?? submission.testResults ?? [])
        .map((tr) => this.serializeRealtimeTestResult(tr))
        .sort((a, b) => a.testCaseIndex - b.testCaseIndex),
      createdAt: this.toIso(submission.createdAt),
      updatedAt: this.toIso(submission.updatedAt),
      assignment: submission.assignment
        ? {
            id: submission.assignment.id,
            title: submission.assignment.title,
            codingConfig: submission.assignment.codingConfig,
          }
        : undefined,
      user: submission.user
        ? {
            id: submission.user.id,
            username: submission.user.username,
            firstName: submission.user.firstName,
            lastName: submission.user.lastName,
            role: submission.user.role,
            avatarUrl: submission.user.avatarUrl,
          }
        : undefined,
      judgeProgress: progress,
    };
  }

  private serializeRealtimeTestResult(tr: SubmissionTestResult | ISubmissionRealtimeTestResult): ISubmissionRealtimeTestResult {
    return {
      id: tr.id,
      submissionId: tr.submissionId,
      testCaseIndex: tr.testCaseIndex,
      status: tr.status,
      expectedOutput: tr.expectedOutput,
      actualOutput: tr.actualOutput,
      executionTimeMs: tr.executionTimeMs ?? null,
      memoryBytes: tr.memoryBytes ?? null,
      errorMessage: tr.errorMessage ?? null,
    };
  }

  private getAssignmentTotalCount(assignment: Assignment): number {
    const totalCount = assignment.codingConfig?.testCases?.length ?? 0;
    return totalCount > 0 ? totalCount : 1;
  }

  private toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }
}

import { Controller, Post, Get, Body, UseGuards, Req, Param, Query, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, LessThan, Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ExecutionService } from './execution.service';
import { Submission, SubmissionTestResult } from './submission.entity';
import { SubmissionEventsGateway } from './submission-events.gateway';
import { StudentAssignmentProgressService } from './student-assignment-progress.service';
import { Assignment } from '../assignments/assignment.entity';
import { QuestsService } from '../quests/quests.service';
import { TestcaseStorageService } from '../testcases/testcase-storage.service';
import {
  ICodeExecutionRequest,
  IRealtimeSubmission,
  ISubmissionJudgeProgress,
  ISubmissionRealtimeEvent,
  ISubmissionRealtimeTestResult,
  ISubmitCodePayload,
  SubmissionStatus,
  UserRole,
} from '@cp/shared';

/** Submissions stuck in PENDING longer than this are considered orphaned. */
const STALE_PENDING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController implements OnModuleInit {
  private readonly logger = new Logger(SubmissionsController.name);
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
    private readonly testcaseStorage: TestcaseStorageService,
    private readonly assignmentProgress: StudentAssignmentProgressService,
  ) {}

  /**
   * On server startup, mark any orphaned PENDING submissions as INTERNAL_ERROR.
   *
   * This handles the case where the server was restarted/crashed while a
   * submission was being graded — the in-flight grading is lost and the DB
   * record stays PENDING forever.  We detect these by looking for PENDING
   * submissions older than STALE_PENDING_THRESHOLD_MS.
   */
  async onModuleInit() {
    const cutoff = new Date(Date.now() - STALE_PENDING_THRESHOLD_MS);
    const staleSubmissions = await this.submissionRepo.find({
      where: {
        status: SubmissionStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
    });

    if (staleSubmissions.length === 0) return;

    this.logger.warn(
      `Found ${staleSubmissions.length} stale PENDING submission(s). Marking as INTERNAL_ERROR.`,
    );

    for (const sub of staleSubmissions) {
      sub.status = SubmissionStatus.INTERNAL_ERROR;
      await this.submissionRepo.save(sub);
      this.logger.warn(`  → Submission ${sub.id} (created ${sub.createdAt.toISOString()}) marked INTERNAL_ERROR`);
    }
  }

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
      viewerRole: req.user.role,
      page: this.toInt(pageStr, 1),
      limit: this.toInt(limitStr, 20),
      search,
      status,
      language,
    });
  }

  /**
   * All submissions across users. Students receive hidden testcase details
   * redacted unless the assignment explicitly allows viewing hidden tests.
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getAllSubmissions(
    @Req() req: any,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('language') language?: string,
  ) {
    return this.queryPaginated({
      viewerRole: req.user.role,
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
   * page, loads testResults for the page rows separately (so the one-to-many
   * never corrupts the LIMIT), and returns status stats over the filtered scope.
   */
  private async queryPaginated(opts: {
    userId?: string;
    viewerRole?: UserRole;
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

    // Scope (user) + search + language. Status is applied to the list only, not
    // to stats, so the stat cards still show the full distribution.
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
      await Promise.all(rows.map((row) => this.hydrateMissingTestInputs(row)));
      rows.forEach((row) => this.redactHiddenTestResultsForViewer(row, opts.viewerRole));
    }

    // Status distribution over the filtered scope (ignores status filter + paging).
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
      relations: ['testResults', 'assignment'],
    });
    await Promise.all(submissions.map((submission) => this.hydrateMissingTestInputs(submission)));
    submissions.forEach((submission) => this.redactHiddenTestResultsForViewer(submission, req.user.role));
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
        trEntity.input = tr.input ?? null;
        trEntity.expectedOutput = tr.expectedOutput;
        trEntity.actualOutput = tr.actualOutput;
        trEntity.errorMessage = tr.errorMessage;
        trEntity.executionTimeMs = tr.executionTimeMs;
        trEntity.memoryBytes = tr.memoryBytes;
        return trEntity;
      });

      await this.submissionRepo.save(submission);
      await this.assignmentProgress.recordSubmissionResult(submission);
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
        // Trigger quest + badge progress with full objective context.
        await this.questsService
          .handleCodingAccepted(userId, {
            assignmentId: submission.assignmentId,
            difficulty: assignment.difficulty,
            tags: assignment.tags ?? [],
            points: assignment.points,
          })
          .catch((e) => {
            console.error('Failed to update quest progress:', e);
          });
      }

      this.redactHiddenTestResultsForViewer(submission, req.user.role, assignment);
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
    await this.hydrateMissingTestInputs(submission);
    return submission;
  }

  private emitRealtimeEvent(
    event: 'created' | 'testcase_started' | 'testcase_finished' | 'completed' | 'failed',
    submission: Submission,
    progress: ISubmissionJudgeProgress,
    liveTestResults?: ISubmissionRealtimeTestResult[],
    testResult?: ISubmissionRealtimeTestResult,
  ) {
    const fullPayload: ISubmissionRealtimeEvent = {
      event,
      submission: this.serializeRealtimeSubmission(submission, progress, liveTestResults),
      testResult,
      currentTestCaseIndex: progress.currentTestCaseIndex,
      timestamp: new Date().toISOString(),
    };
    this.submissionEvents.publishSubmissionEvent(fullPayload);
    const redactedPayload = this.redactHiddenRealtimeEventForViewer(fullPayload, UserRole.STUDENT);
    this.submissionEvents.publishRedactedSubmissionEvent(redactedPayload);
    if (submission.user?.role !== UserRole.ADMIN && submission.user?.role !== UserRole.TEACHER) {
      this.submissionEvents.publishUserSubmissionEvent(
        submission.userId,
        redactedPayload,
      );
    }
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
      input: tr.input ?? null,
      expectedOutput: tr.expectedOutput,
      actualOutput: tr.actualOutput,
      executionTimeMs: tr.executionTimeMs ?? null,
      memoryBytes: tr.memoryBytes ?? null,
      errorMessage: tr.errorMessage ?? null,
    };
  }

  private getAssignmentTotalCount(assignment: Assignment): number {
    const totalCount =
      (assignment.codingConfig?.testCases?.length ?? 0) +
      (assignment.codingConfig?.hiddenTestCount ?? 0);
    return totalCount > 0 ? totalCount : 1;
  }

  private async hydrateMissingTestInputs(submission: Submission): Promise<void> {
    const testResults = submission.testResults ?? [];
    if (!testResults.some((tr) => tr.input == null)) return;

    let assignment: Assignment | undefined = submission.assignment;
    if (!assignment) {
      assignment = await this.assignmentRepo.findOne({ where: { id: submission.assignmentId } }) ?? undefined;
    }
    if (!assignment) return;

    const inlineCases = assignment.codingConfig?.testCases ?? [];
    await Promise.all(testResults.map(async (tr) => {
      if (tr.input != null) return;
      if (tr.testCaseIndex < inlineCases.length) {
        tr.input = inlineCases[tr.testCaseIndex]?.input ?? '';
        return;
      }

      const hiddenIndex = tr.testCaseIndex - inlineCases.length;
      if (hiddenIndex < 0) {
        tr.input = '';
        return;
      }

      try {
        const hidden = await this.testcaseStorage.readTestcase(assignment.id, hiddenIndex);
        tr.input = hidden.input;
      } catch {
        tr.input = '';
      }
    }));
  }

  private redactHiddenTestResultsForViewer(
    submission: Submission,
    viewerRole?: UserRole,
    assignment = submission.assignment,
  ): void {
    if (!assignment || this.canViewHiddenTestDetails(viewerRole, assignment)) return;

    const inlineCases = assignment.codingConfig?.testCases ?? [];
    for (const tr of submission.testResults ?? []) {
      if (!this.isHiddenTestResult(assignment, tr.testCaseIndex, inlineCases)) continue;
      tr.input = null;
      tr.expectedOutput = '';
      tr.actualOutput = '';
      tr.errorMessage = null;
    }
  }

  private redactHiddenRealtimeEventForViewer(
    payload: ISubmissionRealtimeEvent,
    viewerRole?: UserRole,
  ): ISubmissionRealtimeEvent {
    const assignment = {
      id: payload.submission.assignmentId,
      codingConfig: payload.submission.assignment?.codingConfig as Assignment['codingConfig'],
    } as Assignment;
    if (this.canViewHiddenTestDetails(viewerRole, assignment)) return payload;

    const inlineCases = assignment.codingConfig?.testCases ?? [];
    const redactTestResult = (tr: ISubmissionRealtimeTestResult): ISubmissionRealtimeTestResult => {
      if (!this.isHiddenTestResult(assignment, tr.testCaseIndex, inlineCases)) return tr;
      return {
        ...tr,
        input: null,
        expectedOutput: '',
        actualOutput: '',
        errorMessage: null,
      };
    };

    return {
      ...payload,
      submission: {
        ...payload.submission,
        testResults: payload.submission.testResults?.map(redactTestResult),
      },
      testResult: payload.testResult ? redactTestResult(payload.testResult) : undefined,
    };
  }

  private canViewHiddenTestDetails(viewerRole: UserRole | undefined, assignment: Assignment): boolean {
    return (
      viewerRole === UserRole.ADMIN ||
      viewerRole === UserRole.TEACHER ||
      !!assignment.codingConfig?.allowViewHiddenTestCases
    );
  }

  private isHiddenTestResult(
    assignment: Assignment,
    testCaseIndex: number,
    inlineCases = assignment.codingConfig?.testCases ?? [],
  ): boolean {
    return testCaseIndex >= inlineCases.length || !!inlineCases[testCaseIndex]?.isHidden;
  }

  private toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }
}

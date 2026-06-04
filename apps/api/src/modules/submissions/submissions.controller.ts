import { Controller, Post, Get, Body, UseGuards, Req, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private readonly questsService: QuestsService,
    private readonly submissionEvents: SubmissionEventsGateway,
  ) {}

  @Post('run')
  async runCode(@Body() payload: ICodeExecutionRequest) {
    return this.executionService.runCode(payload.language, payload.code, payload.stdin);
  }

  /**
   * Student: get all own submissions across all assignments.
   */
  @Get('my')
  async getAllMySubmissions(@Req() req: any) {
    const userId = req.user.sub;
    const submissions = await this.submissionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['testResults', 'assignment', 'user'],
      take: 200,
    });
    return submissions;
  }

  /**
   * Authenticated feed: get all submissions from all students.
   */
  @Get('all')
  async getAllSubmissions() {
    const submissions = await this.submissionRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['testResults', 'assignment', 'user'],
      take: 200,
    });
    return submissions;
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

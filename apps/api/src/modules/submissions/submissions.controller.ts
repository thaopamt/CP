import { Controller, Post, Get, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ExecutionService } from './execution.service';
import { Submission, SubmissionTestResult } from './submission.entity';
import { Assignment } from '../assignments/assignment.entity';
import { QuestsService } from '../quests/quests.service';
import { ICodeExecutionRequest, ISubmitCodePayload, SubmissionStatus, UserRole } from '@cp/shared';

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
      relations: ['testResults', 'assignment'],
      take: 200,
    });
    return submissions;
  }

  /**
   * Admin / Teacher: get all submissions from all students.
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
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
      throw new Error('Assignment not found');
    }

    // Initial submission entry
    const submission = this.submissionRepo.create({
      userId,
      assignmentId: assignment.id,
      language: payload.language,
      code: payload.code,
      status: SubmissionStatus.PENDING,
    });
    await this.submissionRepo.save(submission);

    try {
      // Grade the submission
      const gradeResult = await this.executionService.gradeSubmission(
        assignment,
        payload.language,
        payload.code,
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
      throw error;
    }
  }
}

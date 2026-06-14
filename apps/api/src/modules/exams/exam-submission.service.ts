import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamParticipantState, ExamStatus, IExamSubmitPayload, SubmissionStatus } from '@cp/shared';
import { Submission, SubmissionTestResult } from '../submissions/submission.entity';
import { ExecutionService } from '../submissions/execution.service';
import { Assignment } from '../assignments/assignment.entity';
import { Exam } from './exam.entity';
import { ExamProblem } from './exam-problem.entity';
import { ExamParticipant } from './exam-participant.entity';
import { ExamsService } from './exams.service';
import { ExamScoringService } from './exam-scoring.service';
import { ExamRankingService } from './exam-ranking.service';
import { ExamEventsGateway } from './exam-events.gateway';

/** Bounds concurrent grading so a submit burst can't exhaust the judge/event loop. */
class Semaphore {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private readonly max: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.max) await new Promise<void>((res) => this.queue.push(res));
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const MAX_CONCURRENT_GRADING = Number(process.env.EXAM_MAX_CONCURRENT_GRADING ?? 4);

@Injectable()
export class ExamSubmissionService {
  private readonly semaphore = new Semaphore(MAX_CONCURRENT_GRADING);

  constructor(
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    @InjectRepository(ExamProblem) private readonly examProblems: Repository<ExamProblem>,
    @InjectRepository(ExamParticipant) private readonly participants: Repository<ExamParticipant>,
    private readonly execution: ExecutionService,
    private readonly examsService: ExamsService,
    private readonly scoring: ExamScoringService,
    private readonly ranking: ExamRankingService,
    private readonly gateway: ExamEventsGateway,
  ) {}

  private totalCount(assignment: Assignment): number {
    const n =
      (assignment.codingConfig?.testCases?.length ?? 0) + (assignment.codingConfig?.hiddenTestCount ?? 0);
    return n > 0 ? n : 1;
  }

  /** Students only ever see sample-testcase details for exam submissions. */
  private redactForStudent(submission: Submission, assignment: Assignment): void {
    const inline = assignment.codingConfig?.testCases ?? [];
    for (const tr of submission.testResults ?? []) {
      const isSample = tr.testCaseIndex < inline.length && !inline[tr.testCaseIndex]?.isHidden;
      if (isSample) continue;
      tr.input = null;
      tr.expectedOutput = '';
      tr.actualOutput = '';
      tr.errorMessage = null;
    }
  }

  async submit(examId: string, userId: string, payload: IExamSubmitPayload): Promise<Submission> {
    const exam = await this.examsService.loadExamOrThrow(examId);
    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new ForbiddenException('Exam is not open for submissions');
    }

    const examProblem = await this.examProblems.findOne({ where: { id: payload.examProblemId, examId } });
    if (!examProblem) throw new NotFoundException('Problem is not part of this exam');

    const assignment = await this.assignments.findOne({ where: { id: examProblem.assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Participation + window (auto-join on first submit if eligible).
    let participant = await this.participants.findOne({ where: { examId, userId } });
    if (participant?.state === ExamParticipantState.BANNED) {
      throw new ForbiddenException('You are banned from this exam');
    }
    if (!participant || !participant.joinedAt) {
      participant = await this.examsService.join(examId, userId);
    }

    const now = Date.now();
    const startMs = exam.durationMinutes && participant.joinedAt
      ? new Date(participant.joinedAt).getTime()
      : new Date(exam.startAt).getTime();
    const endMs = this.examsService.participantEndsAt(exam, participant).getTime();
    if (now < new Date(exam.startAt).getTime()) throw new BadRequestException('Exam has not started yet');
    if (now < startMs) throw new BadRequestException('Your exam window has not started yet');
    if (now > endMs) throw new BadRequestException('Your exam window has ended');

    // Language gate.
    const allowed = exam.settings?.allowedLanguages ?? assignment.codingConfig?.allowedLanguages;
    if (allowed && allowed.length && !allowed.includes(payload.language)) {
      throw new BadRequestException(`Language ${payload.language} is not allowed in this exam`);
    }

    // Attempt cap.
    const cap = exam.settings?.maxAttemptsPerProblem;
    if (cap && cap > 0) {
      const used = await this.submissions.count({
        where: { examId, userId, assignmentId: assignment.id },
      });
      if (used >= cap) throw new BadRequestException('Maximum attempts reached for this problem');
    }

    const submission = this.submissions.create({
      userId,
      assignmentId: assignment.id,
      examId,
      language: payload.language,
      code: payload.code,
      status: SubmissionStatus.PENDING,
      totalCount: this.totalCount(assignment),
    });
    await this.submissions.save(submission);

    try {
      const grade = await this.semaphore.run(() =>
        this.execution.gradeSubmission(assignment, payload.language, payload.code, {}),
      );

      submission.status = grade.status;
      submission.passedCount = grade.passedCount;
      submission.totalCount = grade.totalCount;
      submission.totalExecutionTimeMs = grade.totalTime;
      submission.maxMemoryBytes = grade.maxMemory;
      submission.testResults = grade.testResults.map((tr) => {
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
      submission.examScore = this.scoring.computeSubmissionScore(
        grade.testResults.map((tr) => ({ testCaseIndex: tr.testCaseIndex, status: tr.status })),
        {
          examProblemId: examProblem.id,
          assignmentId: examProblem.assignmentId,
          label: examProblem.label,
          points: examProblem.points,
          scoringMode: examProblem.scoringMode,
          subtaskConfig: examProblem.subtaskConfig,
        },
      );
      await this.submissions.save(submission);
    } catch (err) {
      submission.status = SubmissionStatus.INTERNAL_ERROR;
      await this.submissions.save(submission);
      throw err;
    }

    this.ranking.invalidate(examId);
    this.gateway.emitLeaderboardChanged(examId);

    this.redactForStudent(submission, assignment);
    return submission;
  }

  /** A student's own submissions for an exam (redacted). */
  async listMine(examId: string, userId: string): Promise<Submission[]> {
    const subs = await this.submissions.find({
      where: { examId, userId },
      relations: ['testResults', 'assignment'],
      order: { createdAt: 'DESC' },
    });
    for (const s of subs) if (s.assignment) this.redactForStudent(s, s.assignment);
    return subs;
  }
}

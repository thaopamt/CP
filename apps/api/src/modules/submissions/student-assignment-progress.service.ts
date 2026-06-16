import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubmissionStatus } from '@cp/shared';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';

import { Submission } from './submission.entity';
import { StudentAssignmentProgress } from './student-assignment-progress.entity';
import { SystemCacheService } from '../../common/cache/system-cache.service';

@Injectable()
export class StudentAssignmentProgressService {
  constructor(
    @InjectRepository(StudentAssignmentProgress)
    private readonly progressRepo: Repository<StudentAssignmentProgress>,
    private readonly cache: SystemCacheService,
  ) {}

  async recordSubmissionResult(submission: Submission): Promise<void> {
    const isAccepted = submission.status === SubmissionStatus.ACCEPTED;

    await this.progressRepo.query(
      `
      INSERT INTO student_assignment_progress (
        id,
        student_id,
        assignment_id,
        completed,
        completed_at,
        best_submission_id,
        last_submission_id,
        last_submitted_at,
        attempt_count,
        passed_count,
        total_count,
        last_status,
        created_at,
        updated_at,
        version
      )
      VALUES (
        $9,
        $1,
        $2,
        $3,
        CASE WHEN $3 THEN $4::timestamptz ELSE NULL END,
        CASE WHEN $3 THEN $5::uuid ELSE NULL END,
        $5,
        $4,
        1,
        $6,
        $7,
        $8,
        NOW(),
        NOW(),
        1
      )
      ON CONFLICT (student_id, assignment_id)
      DO UPDATE SET
        completed = student_assignment_progress.completed OR EXCLUDED.completed,
        completed_at = CASE
          WHEN student_assignment_progress.completed_at IS NOT NULL THEN student_assignment_progress.completed_at
          WHEN EXCLUDED.completed THEN EXCLUDED.completed_at
          ELSE NULL
        END,
        best_submission_id = CASE
          WHEN student_assignment_progress.best_submission_id IS NOT NULL THEN student_assignment_progress.best_submission_id
          WHEN EXCLUDED.completed THEN EXCLUDED.best_submission_id
          ELSE NULL
        END,
        last_submission_id = EXCLUDED.last_submission_id,
        last_submitted_at = EXCLUDED.last_submitted_at,
        attempt_count = student_assignment_progress.attempt_count + 1,
        passed_count = EXCLUDED.passed_count,
        total_count = EXCLUDED.total_count,
        last_status = EXCLUDED.last_status,
        updated_at = NOW(),
        version = student_assignment_progress.version + 1
      `,
      [
        submission.userId,
        submission.assignmentId,
        isAccepted,
        submission.createdAt ?? new Date(),
        submission.id,
        submission.passedCount ?? 0,
        submission.totalCount ?? 0,
        submission.status,
        randomUUID(),
      ],
    );
    await this.cache.bumpTags([`student:${submission.userId}:dashboard`]);
  }
}

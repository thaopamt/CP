import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentAssignmentProgress1780666612392 implements MigrationInterface {
    name = 'AddStudentAssignmentProgress1780666612392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`CREATE TYPE "public"."student_assignment_progress_last_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'INTERNAL_ERROR')`);
        await queryRunner.query(`
          CREATE TABLE "student_assignment_progress" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "version" integer NOT NULL DEFAULT '1',
            "student_id" uuid NOT NULL,
            "assignment_id" uuid NOT NULL,
            "completed" boolean NOT NULL DEFAULT false,
            "completed_at" TIMESTAMP WITH TIME ZONE,
            "best_submission_id" uuid,
            "last_submission_id" uuid,
            "last_submitted_at" TIMESTAMP WITH TIME ZONE,
            "attempt_count" integer NOT NULL DEFAULT '0',
            "passed_count" integer NOT NULL DEFAULT '0',
            "total_count" integer NOT NULL DEFAULT '0',
            "last_status" "public"."student_assignment_progress_last_status_enum",
            CONSTRAINT "UQ_student_assignment_progress_student_assignment" UNIQUE ("student_id", "assignment_id"),
            CONSTRAINT "PK_student_assignment_progress" PRIMARY KEY ("id")
          )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_student_assignment_progress_student" ON "student_assignment_progress" ("student_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_student_assignment_progress_assignment" ON "student_assignment_progress" ("assignment_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_student_assignment_progress_completed" ON "student_assignment_progress" ("student_id", "assignment_id") WHERE "completed" = true`);
        await queryRunner.query(`CREATE INDEX "IDX_submissions_accepted_progress" ON "submissions" ("userId", "assignmentId") WHERE "status" = 'ACCEPTED'`);
        await queryRunner.query(`CREATE INDEX "IDX_submissions_student_assignment_status" ON "submissions" ("userId", "assignmentId", "status")`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" ADD CONSTRAINT "FK_student_assignment_progress_student" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" ADD CONSTRAINT "FK_student_assignment_progress_assignment" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" ADD CONSTRAINT "FK_student_assignment_progress_best_submission" FOREIGN KEY ("best_submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" ADD CONSTRAINT "FK_student_assignment_progress_last_submission" FOREIGN KEY ("last_submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`
          INSERT INTO "student_assignment_progress" (
            "student_id",
            "assignment_id",
            "completed",
            "completed_at",
            "best_submission_id",
            "last_submission_id",
            "last_submitted_at",
            "attempt_count",
            "passed_count",
            "total_count",
            "last_status"
          )
          SELECT
            grouped."userId",
            grouped."assignmentId",
            grouped."completed",
            grouped."completedAt",
            grouped."bestSubmissionId",
            grouped."lastSubmissionId",
            grouped."lastSubmittedAt",
            grouped."attemptCount",
            latest."passedCount",
            latest."totalCount",
            latest."status"::text::"public"."student_assignment_progress_last_status_enum"
          FROM (
            SELECT
              "userId",
              "assignmentId",
              BOOL_OR("status" = 'ACCEPTED') AS "completed",
              MIN("createdAt") FILTER (WHERE "status" = 'ACCEPTED') AS "completedAt",
              (ARRAY_AGG("id" ORDER BY "createdAt" ASC) FILTER (WHERE "status" = 'ACCEPTED'))[1] AS "bestSubmissionId",
              (ARRAY_AGG("id" ORDER BY "createdAt" DESC))[1] AS "lastSubmissionId",
              MAX("createdAt") AS "lastSubmittedAt",
              COUNT(*)::int AS "attemptCount"
            FROM "submissions"
            GROUP BY "userId", "assignmentId"
          ) grouped
          JOIN "submissions" latest ON latest."id" = grouped."lastSubmissionId"
          ON CONFLICT ("student_id", "assignment_id") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" DROP CONSTRAINT "FK_student_assignment_progress_last_submission"`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" DROP CONSTRAINT "FK_student_assignment_progress_best_submission"`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" DROP CONSTRAINT "FK_student_assignment_progress_assignment"`);
        await queryRunner.query(`ALTER TABLE "student_assignment_progress" DROP CONSTRAINT "FK_student_assignment_progress_student"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_submissions_student_assignment_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_submissions_accepted_progress"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_assignment_progress_completed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_assignment_progress_assignment"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_assignment_progress_student"`);
        await queryRunner.query(`DROP TABLE "student_assignment_progress"`);
        await queryRunner.query(`DROP TYPE "public"."student_assignment_progress_last_status_enum"`);
    }
}

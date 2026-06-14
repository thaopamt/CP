import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Exam / Contest feature schema.
 *
 * Written idempotently (IF NOT EXISTS + DO-block enum guards) because the app
 * runs with `synchronize: true`, which may have already created these tables
 * from the entities on boot. All changes are additive (new tables + two
 * nullable columns on `submissions`), so this is safe on the shared dev DB.
 */
export class CreateExamTables1789900000000 implements MigrationInterface {
  name = 'CreateExamTables1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ── Enums ────────────────────────────────────────────────────────────────
    const createType = async (typeName: string, values: string[]) => {
      const list = values.map((v) => `'${v}'`).join(', ');
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."${typeName}" AS ENUM(${list});
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `);
    };
    await createType('exams_status_enum', ['DRAFT', 'PUBLISHED', 'FINALIZING', 'FINALIZED', 'ARCHIVED']);
    await createType('exams_format_enum', ['ICPC', 'OI', 'IOI', 'SCORE_BASED', 'PRACTICE', 'CUSTOM']);
    await createType('exams_ranking_rule_enum', ['SCORE_ONLY', 'SCORE_THEN_TIME', 'ICPC', 'OI', 'CUSTOM']);
    await createType('exams_tie_mode_enum', ['DENSE', 'COMPETITION', 'UNIQUE']);
    await createType('exams_visibility_enum', ['PUBLIC', 'CLASS', 'INVITE']);
    await createType('exam_problems_scoring_mode_enum', ['BINARY', 'PARTIAL_TESTCASE', 'SUBTASK']);
    await createType('exam_participants_state_enum', ['INVITED', 'REGISTERED', 'JOINED', 'BANNED', 'DISQUALIFIED']);
    await createType('exam_reward_rules_type_enum', ['RANK', 'SCORE', 'COMPLETION', 'PARTICIPATION', 'FIRST_SOLVE', 'BADGE']);
    await createType('exam_reward_grants_status_enum', ['PENDING', 'GRANTED', 'REVOKED', 'FAILED']);
    await createType('exam_audit_logs_action_enum', [
      'CREATED', 'UPDATED', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'FROZEN', 'UNFROZEN', 'FINALIZED',
      'SNAPSHOT_CREATED', 'RANKING_RECALCULATED', 'REWARD_GRANTED', 'REWARD_REVOKED', 'REWARD_RETRIED',
      'REJUDGE_STARTED', 'REJUDGE_COMPLETED', 'PROBLEM_ADDED', 'PROBLEM_REMOVED', 'PARTICIPANT_ADDED',
      'PARTICIPANT_REMOVED', 'PARTICIPANT_BANNED', 'PARTICIPANT_UNBANNED',
    ]);

    const baseCols = `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "deleted_at" TIMESTAMP WITH TIME ZONE,
      "version" integer NOT NULL DEFAULT '1'`;

    // ── exams ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exams" (
        ${baseCols},
        "title" character varying(255) NOT NULL,
        "slug" character varying(255),
        "description" text NOT NULL DEFAULT '',
        "format" "public"."exams_format_enum" NOT NULL DEFAULT 'PRACTICE',
        "ranking_rule" "public"."exams_ranking_rule_enum" NOT NULL DEFAULT 'SCORE_THEN_TIME',
        "tie_mode" "public"."exams_tie_mode_enum" NOT NULL DEFAULT 'COMPETITION',
        "status" "public"."exams_status_enum" NOT NULL DEFAULT 'DRAFT',
        "start_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "duration_minutes" integer,
        "freeze_at" TIMESTAMP WITH TIME ZONE,
        "is_frozen" boolean NOT NULL DEFAULT false,
        "visibility" "public"."exams_visibility_enum" NOT NULL DEFAULT 'CLASS',
        "class_ids" uuid array,
        "created_by" uuid NOT NULL,
        "auto_finalize" boolean NOT NULL DEFAULT true,
        "auto_grant_reward" boolean NOT NULL DEFAULT false,
        "finalized_at" TIMESTAMP WITH TIME ZONE,
        "finalized_by" uuid,
        "snapshot_version" integer NOT NULL DEFAULT '0',
        "settings_json" jsonb,
        CONSTRAINT "PK_exams" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_exams_slug" ON "exams" ("slug") WHERE slug IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exams_format" ON "exams" ("format")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exams_status" ON "exams" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exams_start_at" ON "exams" ("start_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exams_end_at" ON "exams" ("end_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exams_visibility" ON "exams" ("visibility")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exams_created_by" ON "exams" ("created_by")`);

    // ── exam_problems ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_problems" (
        ${baseCols},
        "exam_id" uuid NOT NULL,
        "assignment_id" uuid NOT NULL,
        "order_index" integer NOT NULL DEFAULT '0',
        "label" character varying(8),
        "points" integer NOT NULL DEFAULT '100',
        "scoring_mode" "public"."exam_problems_scoring_mode_enum" NOT NULL DEFAULT 'PARTIAL_TESTCASE',
        "subtask_config" jsonb,
        CONSTRAINT "PK_exam_problems" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exam_problem" UNIQUE ("exam_id", "assignment_id"),
        CONSTRAINT "FK_exam_problems_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_problems_assignment" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_problems_exam" ON "exam_problems" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_problems_assignment" ON "exam_problems" ("assignment_id")`);

    // ── exam_participants ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_participants" (
        ${baseCols},
        "exam_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "state" "public"."exam_participants_state_enum" NOT NULL DEFAULT 'REGISTERED',
        "joined_at" TIMESTAMP WITH TIME ZONE,
        "invited_by" uuid,
        "ban_reason" text,
        CONSTRAINT "PK_exam_participants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exam_participant" UNIQUE ("exam_id", "user_id"),
        CONSTRAINT "FK_exam_participants_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_participants_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_participants_exam" ON "exam_participants" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_participants_user" ON "exam_participants" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_participants_state" ON "exam_participants" ("state")`);

    // ── exam_ranking_snapshots ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_ranking_snapshots" (
        ${baseCols},
        "exam_id" uuid NOT NULL,
        "version" integer NOT NULL,
        "user_id" uuid NOT NULL,
        "rank" integer NOT NULL,
        "display_rank" integer NOT NULL,
        "total_score" integer NOT NULL DEFAULT '0',
        "solved_count" integer NOT NULL DEFAULT '0',
        "penalty" integer NOT NULL DEFAULT '0',
        "last_solve_time_ms" bigint,
        "per_problem" jsonb NOT NULL,
        CONSTRAINT "PK_exam_ranking_snapshots" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exam_snapshot_row" UNIQUE ("exam_id", "version", "user_id"),
        CONSTRAINT "FK_exam_ranking_snapshots_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_snapshot_rank" ON "exam_ranking_snapshots" ("exam_id", "version", "rank")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_ranking_snapshots_exam" ON "exam_ranking_snapshots" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_ranking_snapshots_user" ON "exam_ranking_snapshots" ("user_id")`);

    // ── exam_reward_rules ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_reward_rules" (
        ${baseCols},
        "exam_id" uuid NOT NULL,
        "type" "public"."exam_reward_rules_type_enum" NOT NULL,
        "label" character varying(120),
        "condition_json" jsonb NOT NULL,
        "reward_json" jsonb NOT NULL,
        "priority" integer NOT NULL DEFAULT '0',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_exam_reward_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exam_reward_rules_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_reward_rules_exam" ON "exam_reward_rules" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_reward_rules_active" ON "exam_reward_rules" ("is_active")`);

    // ── exam_reward_grants ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_reward_grants" (
        ${baseCols},
        "exam_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "reward_rule_id" uuid NOT NULL,
        "status" "public"."exam_reward_grants_status_enum" NOT NULL DEFAULT 'PENDING',
        "granted_gems" integer NOT NULL DEFAULT '0',
        "granted_xp" integer NOT NULL DEFAULT '0',
        "granted_badge_id" uuid,
        "snapshot_version" integer NOT NULL DEFAULT '0',
        "error_message" text,
        CONSTRAINT "PK_exam_reward_grants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exam_reward_grant" UNIQUE ("exam_id", "user_id", "reward_rule_id"),
        CONSTRAINT "FK_exam_reward_grants_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_reward_grants_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_reward_grants_rule" FOREIGN KEY ("reward_rule_id") REFERENCES "exam_reward_rules"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_reward_grants_exam" ON "exam_reward_grants" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_reward_grants_user" ON "exam_reward_grants" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_reward_grants_status" ON "exam_reward_grants" ("status")`);

    // ── exam_audit_logs ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "exam_id" uuid NOT NULL,
        "actor_id" uuid,
        "action" "public"."exam_audit_logs_action_enum" NOT NULL,
        "meta_json" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_audit_logs" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_audit_logs_exam" ON "exam_audit_logs" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_exam_audit_logs_action" ON "exam_audit_logs" ("action")`);

    // ── submissions.exam_id / exam_score ─────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "exam_id" uuid`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "exam_score" integer`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "submissions" ADD CONSTRAINT "FK_submissions_exam"
          FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_submissions_exam" ON "submissions" ("exam_id") WHERE "exam_id" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_submissions_exam_user_assignment" ON "submissions" ("exam_id", "userId", "assignmentId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_submissions_exam_user_assignment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_submissions_exam"`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "submissions" DROP CONSTRAINT "FK_submissions_exam";
      EXCEPTION WHEN undefined_object THEN null; END $$;
    `);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "exam_score"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "exam_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "exam_audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_reward_grants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_reward_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_ranking_snapshots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_participants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_problems"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exams"`);

    for (const t of [
      'exam_audit_logs_action_enum', 'exam_reward_grants_status_enum', 'exam_reward_rules_type_enum',
      'exam_participants_state_enum', 'exam_problems_scoring_mode_enum', 'exams_visibility_enum',
      'exams_tie_mode_enum', 'exams_ranking_rule_enum', 'exams_format_enum', 'exams_status_enum',
    ]) {
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${t}"`);
    }
  }
}

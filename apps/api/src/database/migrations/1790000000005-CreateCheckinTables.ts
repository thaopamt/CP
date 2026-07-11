import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Daily check-in feature schema (design §3). Written idempotently
 * (CREATE ... IF NOT EXISTS) because the app runs with `synchronize: true`
 * and may have already created these tables from the entities on boot.
 * The full checkin_states schema — including the default-0 Phase-2 enrichment
 * columns — is created here for schema stability (design §3.2 tradeoff).
 */
export class CreateCheckinTables1790000000005 implements MigrationInterface {
  name = 'CreateCheckinTables1790000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    const baseCols = `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "deleted_at" TIMESTAMP WITH TIME ZONE,
      "version" integer NOT NULL DEFAULT '1'`;

    // ── daily_checkins ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_checkins" (
        ${baseCols},
        "user_id" uuid NOT NULL,
        "day_key" date NOT NULL,
        "month_key" character varying(7) NOT NULL,
        "source" character varying(16) NOT NULL DEFAULT 'checkin',
        CONSTRAINT "PK_daily_checkins" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_checkin_user_day" UNIQUE ("user_id", "day_key")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_checkin_user_month" ON "daily_checkins" ("user_id", "month_key")`,
    );

    // ── checkin_states ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkin_states" (
        ${baseCols},
        "user_id" uuid NOT NULL,
        "current_streak" integer NOT NULL DEFAULT '0',
        "longest_streak" integer NOT NULL DEFAULT '0',
        "last_checkin_date" date,
        "total_checkins" integer NOT NULL DEFAULT '0',
        "month_key" character varying(7),
        "monthly_checkins" integer NOT NULL DEFAULT '0',
        "freeze_tokens" integer NOT NULL DEFAULT '0',
        "pending_wheel_spins" integer NOT NULL DEFAULT '0',
        "makeup_used_this_month" integer NOT NULL DEFAULT '0',
        "highest_milestone_awarded" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_checkin_states" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_checkin_state_user" UNIQUE ("user_id")
      )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "checkin_states"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_daily_checkin_user_month"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_checkins"`);
  }
}

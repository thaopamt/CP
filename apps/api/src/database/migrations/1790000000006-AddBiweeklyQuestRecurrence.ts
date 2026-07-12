import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the two-week quest recurrence value. PostgreSQL enum values cannot be
 * safely removed in a down migration, so rollback maps rows back to NONE and
 * leaves the enum value in place.
 */
export class AddBiweeklyQuestRecurrence1790000000006 implements MigrationInterface {
  name = 'AddBiweeklyQuestRecurrence1790000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."quests_recurrence_enum" ADD VALUE IF NOT EXISTS 'BIWEEKLY'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "quests" SET "recurrence" = 'NONE' WHERE "recurrence"::text = 'BIWEEKLY'`);
  }
}

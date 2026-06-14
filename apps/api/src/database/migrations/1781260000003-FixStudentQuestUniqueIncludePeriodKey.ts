import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The student_quests uniqueness must be per recurrence window: one row per
 * (student, quest, periodKey). The live DB had a stale 2-column constraint
 * `UNIQUE (user_id, quest_id)` (period_key missing) that `synchronize` never
 * corrected. With it, the lazy-reset INSERT ... ON CONFLICT DO NOTHING silently
 * dropped every new daily/weekly row (it collided with the previous period's
 * row on the same user+quest), so recurring quests never reset.
 *
 * This drops the 2-column constraint and recreates it across all three columns.
 */
export class FixStudentQuestUniqueIncludePeriodKey1781260000003 implements MigrationInterface {
  name = 'FixStudentQuestUniqueIncludePeriodKey1781260000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student_quests" DROP CONSTRAINT IF EXISTS "UQ_student_quest"`);
    await queryRunner.query(
      `ALTER TABLE "student_quests" ADD CONSTRAINT "UQ_student_quest" UNIQUE ("user_id", "quest_id", "period_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student_quests" DROP CONSTRAINT IF EXISTS "UQ_student_quest"`);
    await queryRunner.query(
      `ALTER TABLE "student_quests" ADD CONSTRAINT "UQ_student_quest" UNIQUE ("user_id", "quest_id")`,
    );
  }
}

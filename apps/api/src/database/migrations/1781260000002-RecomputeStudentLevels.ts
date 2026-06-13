import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The level curve changed: level N now spans [N*1000, (N+1)*1000), so a student
 * levels up once their XP reaches (level+1)*1000 (was level*1000). The runtime
 * level-up loop only ever increments, so existing rows that sit one level too
 * high under the new curve must be recomputed here.
 *
 * New level = max(1, floor(xp / 1000)).
 */
export class RecomputeStudentLevels1781260000002 implements MigrationInterface {
  name = 'RecomputeStudentLevels1781260000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "student_profiles" SET "level" = GREATEST(1, FLOOR("xp" / 1000.0)::int)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Old curve: level N spanned [(N-1)*1000, N*1000) => level = floor(xp/1000) + 1.
    await queryRunner.query(
      `UPDATE "student_profiles" SET "level" = FLOOR("xp" / 1000.0)::int + 1`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCourseCreditsDurationSubject1780629485577 implements MigrationInterface {
  name = 'RemoveCourseCreditsDurationSubject1780629485577';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN IF EXISTS "credits"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN IF EXISTS "duration_weeks"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN IF EXISTS "subject"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" ADD "credits" double precision NOT NULL DEFAULT 1');
    await queryRunner.query('ALTER TABLE "courses" ADD "duration_weeks" integer NOT NULL DEFAULT 12');
    await queryRunner.query(
      'ALTER TABLE "courses" ADD "subject" character varying(100) NOT NULL DEFAULT \'General\'',
    );
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_courses_subject" ON "courses" ("subject")');
    await queryRunner.query('ALTER TABLE "courses" ALTER COLUMN "subject" DROP DEFAULT');
  }
}

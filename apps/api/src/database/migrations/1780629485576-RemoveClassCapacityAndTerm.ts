import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveClassCapacityAndTerm1780629485576 implements MigrationInterface {
  name = 'RemoveClassCapacityAndTerm1780629485576';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "classes" DROP COLUMN IF EXISTS "capacity"');
    await queryRunner.query('ALTER TABLE "classes" DROP COLUMN IF EXISTS "term"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "classes" ADD "capacity" integer NOT NULL DEFAULT 30');
    await queryRunner.query(
      'ALTER TABLE "classes" ADD "term" character varying(100) NOT NULL DEFAULT \'General\'',
    );
    await queryRunner.query('ALTER TABLE "classes" ALTER COLUMN "term" DROP DEFAULT');
  }
}

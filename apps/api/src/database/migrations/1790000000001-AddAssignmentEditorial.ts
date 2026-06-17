import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentEditorial1790000000001 implements MigrationInterface {
  name = 'AddAssignmentEditorial1790000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assignments" ADD "editorial" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assignments" DROP COLUMN "editorial"`);
  }
}

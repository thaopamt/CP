import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCourseContentKind1780666612393 implements MigrationInterface {
  name = 'AddCourseContentKind1780666612393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."courses_content_kind_enum" AS ENUM('ASSIGNMENTS', 'MAZE')`);
    await queryRunner.query(
      `ALTER TABLE "courses" ADD "content_kind" "public"."courses_content_kind_enum" NOT NULL DEFAULT 'ASSIGNMENTS'`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_courses_content_kind" ON "courses" ("content_kind")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_courses_content_kind"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "content_kind"`);
    await queryRunner.query(`DROP TYPE "public"."courses_content_kind_enum"`);
  }
}

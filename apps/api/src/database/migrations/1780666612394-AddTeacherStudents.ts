import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeacherStudents1780666612394 implements MigrationInterface {
    name = 'AddTeacherStudents1780666612394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`
          CREATE TABLE "teacher_students" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "version" integer NOT NULL DEFAULT '1',
            "teacher_id" uuid NOT NULL,
            "student_id" uuid NOT NULL,
            CONSTRAINT "UQ_teacher_student" UNIQUE ("teacher_id", "student_id"),
            CONSTRAINT "PK_teacher_students" PRIMARY KEY ("id")
          )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_teacher_students_teacher" ON "teacher_students" ("teacher_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_teacher_students_student" ON "teacher_students" ("student_id")`);
        await queryRunner.query(`ALTER TABLE "teacher_students" ADD CONSTRAINT "FK_teacher_students_teacher" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_students" ADD CONSTRAINT "FK_teacher_students_student" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teacher_students" DROP CONSTRAINT "FK_teacher_students_student"`);
        await queryRunner.query(`ALTER TABLE "teacher_students" DROP CONSTRAINT "FK_teacher_students_teacher"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_teacher_students_student"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_teacher_students_teacher"`);
        await queryRunner.query(`DROP TABLE "teacher_students"`);
    }
}

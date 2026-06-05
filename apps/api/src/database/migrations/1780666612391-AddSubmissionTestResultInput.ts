import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubmissionTestResultInput1780666612391 implements MigrationInterface {
    name = 'AddSubmissionTestResultInput1780666612391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submission_test_results" ADD "input" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submission_test_results" DROP COLUMN "input"`);
    }

}

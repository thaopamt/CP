import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinanceMonthlyStatuses1781260000001 implements MigrationInterface {
  name = 'AddFinanceMonthlyStatuses1781260000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "finance_monthly_statuses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT 1,
        "student_id" uuid NOT NULL,
        "month" character varying(7) NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'PENDING',
        CONSTRAINT "UQ_finance_monthly_status_student_month" UNIQUE ("student_id", "month"),
        CONSTRAINT "PK_finance_monthly_statuses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_finance_monthly_status_student_id" ON "finance_monthly_statuses" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_finance_monthly_status_month" ON "finance_monthly_statuses" ("month")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_finance_monthly_status_status" ON "finance_monthly_statuses" ("status")`,
    );
    await queryRunner.query(`
      ALTER TABLE "finance_monthly_statuses"
      ADD CONSTRAINT "FK_finance_monthly_status_student"
      FOREIGN KEY ("student_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "finance_monthly_statuses" DROP CONSTRAINT "FK_finance_monthly_status_student"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_finance_monthly_status_status"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_monthly_status_month"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_monthly_status_student_id"`);
    await queryRunner.query(`DROP TABLE "finance_monthly_statuses"`);
  }
}

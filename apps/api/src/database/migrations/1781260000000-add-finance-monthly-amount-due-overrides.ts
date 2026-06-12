import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinanceMonthlyAmountDueOverrides1781260000000 implements MigrationInterface {
  name = 'AddFinanceMonthlyAmountDueOverrides1781260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "finance_monthly_amount_due_overrides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT 1,
        "student_id" uuid NOT NULL,
        "month" character varying(7) NOT NULL,
        "amount_due" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_finance_monthly_amount_due_student_month" UNIQUE ("student_id", "month"),
        CONSTRAINT "PK_finance_monthly_amount_due_overrides" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_finance_monthly_amount_due_student_id" ON "finance_monthly_amount_due_overrides" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_finance_monthly_amount_due_month" ON "finance_monthly_amount_due_overrides" ("month")`);
    await queryRunner.query(`
      ALTER TABLE "finance_monthly_amount_due_overrides"
      ADD CONSTRAINT "FK_finance_monthly_amount_due_student"
      FOREIGN KEY ("student_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "finance_monthly_amount_due_overrides" DROP CONSTRAINT "FK_finance_monthly_amount_due_student"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_monthly_amount_due_month"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_monthly_amount_due_student_id"`);
    await queryRunner.query(`DROP TABLE "finance_monthly_amount_due_overrides"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWeeklyLeaderboardRewards1784055014493 implements MigrationInterface {
    name = 'CreateWeeklyLeaderboardRewards1784055014493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "leaderboard_finalized_weeks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "week_key" character varying(8) NOT NULL, "finalized_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "winners" jsonb NOT NULL, CONSTRAINT "PK_7f5decfc71da417e83ddacf766c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_733cc2d8ae489814444c1a05f1" ON "leaderboard_finalized_weeks" ("week_key") `);
        await queryRunner.query(`ALTER TABLE "student_profiles" ADD "last_seen_weekly_reward_week" character varying(8)`);
        await queryRunner.query(`ALTER TABLE "student_inventory" ADD "expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_7913f47cd30bf77d9ffe395659" ON "student_inventory" ("expires_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7913f47cd30bf77d9ffe395659"`);
        await queryRunner.query(`ALTER TABLE "student_inventory" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "student_profiles" DROP COLUMN "last_seen_weekly_reward_week"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_733cc2d8ae489814444c1a05f1"`);
        await queryRunner.query(`DROP TABLE "leaderboard_finalized_weeks"`);
    }

}

import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tracks which published blog posts each user has opened (unread counter). */
export class AddBlogPostReads1781260000006 implements MigrationInterface {
  name = 'AddBlogPostReads1781260000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_post_reads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "read_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blog_post_reads" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blog_post_reads_user_post" UNIQUE ("user_id", "post_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_blog_post_reads_user" ON "blog_post_reads" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_blog_post_reads_post" ON "blog_post_reads" ("post_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "blog_post_reads"
      ADD CONSTRAINT "FK_blog_post_reads_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "blog_post_reads"
      ADD CONSTRAINT "FK_blog_post_reads_post"
      FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_post_reads" DROP CONSTRAINT "FK_blog_post_reads_post"`);
    await queryRunner.query(`ALTER TABLE "blog_post_reads" DROP CONSTRAINT "FK_blog_post_reads_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blog_post_reads_post"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blog_post_reads_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_post_reads"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlogPosts1781260000004 implements MigrationInterface {
  name = 'AddBlogPosts1781260000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TYPE "public"."blog_posts_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
    await queryRunner.query(`
      CREATE TABLE "blog_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT 1,
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "excerpt" text NOT NULL DEFAULT '',
        "content" text NOT NULL DEFAULT '',
        "cover_url" text,
        "tags" jsonb NOT NULL DEFAULT '[]',
        "status" "public"."blog_posts_status_enum" NOT NULL DEFAULT 'DRAFT',
        "published_at" TIMESTAMP WITH TIME ZONE,
        "author_id" uuid NOT NULL,
        CONSTRAINT "PK_blog_posts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_blog_posts_slug_unique_active" ON "blog_posts" ("slug") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_blog_posts_status" ON "blog_posts" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_blog_posts_published_at" ON "blog_posts" ("published_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_blog_posts_author_id" ON "blog_posts" ("author_id")`);
    await queryRunner.query(`
      ALTER TABLE "blog_posts"
      ADD CONSTRAINT "FK_blog_posts_author"
      FOREIGN KEY ("author_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP CONSTRAINT "FK_blog_posts_author"`);
    await queryRunner.query(`DROP INDEX "IDX_blog_posts_author_id"`);
    await queryRunner.query(`DROP INDEX "IDX_blog_posts_published_at"`);
    await queryRunner.query(`DROP INDEX "IDX_blog_posts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_blog_posts_slug_unique_active"`);
    await queryRunner.query(`DROP TABLE "blog_posts"`);
    await queryRunner.query(`DROP TYPE "public"."blog_posts_status_enum"`);
  }
}

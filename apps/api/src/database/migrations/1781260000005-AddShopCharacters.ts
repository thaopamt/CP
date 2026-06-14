import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the CHARACTER shop category + an image column, and retires the old
 * uploaded-avatar feature. Avatars are now driven solely by the equipped
 * CHARACTER cosmetic, so existing locally-uploaded avatar URLs are cleared
 * (students fall back to initials until they equip a character).
 *
 * The enum value MUST be added here rather than via `synchronize: true`, which
 * does not alter Postgres enums safely (see schema-drift-synchronize-gotcha).
 */
export class AddShopCharacters1781260000005 implements MigrationInterface {
  name = 'AddShopCharacters1781260000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. New cosmetic category. IF NOT EXISTS keeps this idempotent / safe to
    //    re-run if `synchronize` already added the label on a previous boot.
    await queryRunner.query(
      `ALTER TYPE "public"."shop_items_category_enum" ADD VALUE IF NOT EXISTS 'CHARACTER'`,
    );

    // 2. Image column used by CHARACTER items as the avatar image.
    await queryRunner.query(
      `ALTER TABLE "shop_items" ADD COLUMN IF NOT EXISTS "image_url" text`,
    );

    // 3. Retire uploaded avatars — characters are now the only avatar source.
    await queryRunner.query(
      `UPDATE "users" SET "avatar_url" = NULL WHERE "avatar_url" LIKE '/api/uploads/avatars/%'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres cannot drop an enum value, and cleared avatars cannot be
    // restored, so we only reverse the additive column change.
    await queryRunner.query(`ALTER TABLE "shop_items" DROP COLUMN IF EXISTS "image_url"`);
  }
}

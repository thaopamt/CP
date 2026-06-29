import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddChatMessageImageUrl1790000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'chat_messages',
      new TableColumn({
        name: 'image_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chat_messages', 'image_url');
  }
}

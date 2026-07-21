import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddChatMessageContextFields1790000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('chat_messages', [
      new TableColumn({
        name: 'context_type',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'context_id',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'context_title',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'context_meta',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chat_messages', 'context_meta');
    await queryRunner.dropColumn('chat_messages', 'context_title');
    await queryRunner.dropColumn('chat_messages', 'context_id');
    await queryRunner.dropColumn('chat_messages', 'context_type');
  }
}

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddChatMessageType1790000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'chat_messages',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        length: '20',
        default: "'normal'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chat_messages', 'type');
  }
}

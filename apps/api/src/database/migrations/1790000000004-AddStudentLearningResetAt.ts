import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStudentLearningResetAt1790000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'student_profiles',
      new TableColumn({
        name: 'learning_reset_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('student_profiles', 'learning_reset_at');
  }
}

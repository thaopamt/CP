import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';

/**
 * Many-to-many assignment between teachers and students.
 *
 *   teacher_id  → users.id            (a User with role TEACHER)
 *   student_id  → student_profiles.id (the managed student record)
 *
 * A student may have several teachers and vice-versa. The pair is unique so
 * re-assigning is idempotent.
 */
@Entity({ name: 'teacher_students' })
@Unique('UQ_teacher_student', ['teacherId', 'studentId'])
export class TeacherStudent extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: User;

  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;
}

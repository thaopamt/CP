import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PublishStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { CourseAssignment } from './course-assignment.entity';

/**
 * A reusable course template — orthogonal to ClassEntity (which is a
 * scheduled offering) and to the older curriculum-builder "modules"
 * demo. A Course can be attached to multiple classes (via ClassCourse)
 * and contains many assignments (via CourseAssignment).
 */
@Entity({ name: 'courses' })
export class Course extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true, name: 'cover_url' })
  coverUrl!: string | null;

  @Index()
  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.DRAFT })
  status!: PublishStatus;

  /** Denormalized counters refreshed by CoursesService.recount */
  @Column({ type: 'int', default: 0, name: 'assignment_count' })
  assignmentCount!: number;

  @Column({ type: 'int', default: 0, name: 'total_points' })
  totalPoints!: number;

  @OneToMany(() => CourseAssignment, (ca) => ca.course, { cascade: ['soft-remove'] })
  courseAssignments!: CourseAssignment[];
}

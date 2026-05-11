import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Course } from './course.entity';

/**
 * Junction row attaching an Assignment to a Course with a sequencing
 * `order` column. Unique on (courseId, assignmentId) — an assignment
 * appears at most once per course.
 */
@Entity({ name: 'course_assignments' })
@Unique('UQ_course_assignment', ['courseId', 'assignmentId'])
export class CourseAssignment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'course_id' })
  courseId!: string;

  @ManyToOne(() => Course, (c) => c.courseAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Index()
  @Column({ type: 'uuid', name: 'assignment_id' })
  assignmentId!: string;

  @ManyToOne(() => Assignment, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment!: Assignment;

  /** 1-indexed position within the course; gaps allowed but kept compact by reorder */
  @Column({ type: 'int', name: 'order_index' })
  orderIndex!: number;

  @Column({ type: 'uuid', name: 'prerequisite_assignment_id', nullable: true })
  prerequisiteAssignmentId!: string | null;
}

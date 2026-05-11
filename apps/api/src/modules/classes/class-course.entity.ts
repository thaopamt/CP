import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { Course } from '../courses/course.entity';
import { ClassEntity } from './class.entity';

/**
 * Junction row attaching a Course to a Class with a sequencing
 * `orderIndex`. Unique on (classId, courseId).
 */
@Entity({ name: 'class_courses' })
@Unique('UQ_class_course', ['classId', 'courseId'])
export class ClassCourse extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @Index()
  @Column({ type: 'uuid', name: 'course_id' })
  courseId!: string;

  @ManyToOne(() => Course, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ type: 'int', name: 'order_index' })
  orderIndex!: number;

  @Column({ type: 'boolean', default: true, name: 'is_required' })
  isRequired!: boolean;
}

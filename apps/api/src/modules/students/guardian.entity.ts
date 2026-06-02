import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { GuardianRelationship } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { StudentProfile } from './student-profile.entity';

@Entity({ name: 'guardians' })
export class Guardian extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_profile_id' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfile, (sp) => sp.guardians, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'enum', enum: GuardianRelationship, default: GuardianRelationship.GUARDIAN })
  relationship!: GuardianRelationship;

  @Column({ type: 'varchar', length: 32, name: 'phone_number' })
  phoneNumber!: string;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary!: boolean;
}

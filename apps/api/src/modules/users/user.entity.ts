import { Column, Entity, Index } from 'typeorm';
import { IUser, UserRole } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'users' })
export class User
  extends BaseEntity
  implements Omit<IUser, 'createdAt' | 'updatedAt'>
{
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  // `select: false` — never returned by default queries.
  // The auth service explicitly addSelect()s this column to verify a login.
  @Column({ type: 'varchar', length: 255, name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 80, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 80, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;
}

import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

/**
 * Abstract base for every domain entity.
 *
 *   - id          : UUID primary key (matches the @Crud() params config in main.ts)
 *   - createdAt   : auto-set by TypeORM on INSERT (timestamptz)
 *   - updatedAt   : auto-bumped on UPDATE
 *   - deletedAt   : soft-delete column — `repo.softDelete()` populates this
 *                   instead of issuing a DELETE
 *   - version     : optimistic locking (incremented on each save)
 *
 * Subclasses simply add their own @Column() fields:
 *
 *     @Entity({ name: 'users' })
 *     export class User extends BaseEntity {
 *       @Column() email!: string;
 *     }
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @VersionColumn({ default: 1 })
  version!: number;
}

import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { ShopItem } from './shop-item.entity';

/**
 * A cosmetic shop item owned by a student. One row per (user, item). Consumables
 * are applied immediately on purchase and never produce an inventory row.
 */
@Entity({ name: 'student_inventory' })
@Unique('UQ_student_item', ['userId', 'itemId'])
export class StudentInventory extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => ShopItem, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'item_id' })
  item!: ShopItem;

  /** Whether this cosmetic is currently equipped in its slot. */
  @Column({ type: 'boolean', default: false })
  equipped!: boolean;

  @Column({ type: 'timestamptz', name: 'acquired_at', default: () => 'CURRENT_TIMESTAMP' })
  acquiredAt!: Date;
}

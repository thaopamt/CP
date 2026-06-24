import { Column, Entity, Index } from 'typeorm';
import {
  BadgeRarity,
  IShopItemPayload,
  ShopItemCategory,
  ShopItemKind,
} from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';

/** A purchasable item in the gem shop. Seeded; managed by admins. */
@Entity({ name: 'shop_items' })
export class ShopItem extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar', length: 50, default: 'redeem' })
  icon!: string;

  /** Uploaded image URL. CHARACTER items use this as the avatar image. */
  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ShopItemKind, default: ShopItemKind.COSMETIC })
  kind!: ShopItemKind;

  @Index()
  @Column({ type: 'enum', enum: ShopItemCategory, default: ShopItemCategory.CHARACTER })
  category!: ShopItemCategory;

  @Column({ type: 'enum', enum: BadgeRarity, default: BadgeRarity.COMMON })
  rarity!: BadgeRarity;

  /** Price in gems. */
  @Column({ type: 'int', default: 100 })
  price!: number;

  /** Minimum student level required to purchase (0 = no requirement). */
  @Column({ type: 'int', default: 0, name: 'min_level' })
  minLevel!: number;

  @Column({ type: 'jsonb', nullable: true })
  payload!: IShopItemPayload | null;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @Index()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;
}

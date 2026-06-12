import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  IEquipResult,
  IPurchaseResult,
  IShopCatalogEntry,
  IShopCatalogResponse,
  IShopItem,
  ShopItemCategory,
  ShopItemKind,
} from '@cp/shared';

import { StudentProfile } from '../students/student-profile.entity';
import { BadgesService } from '../quests/badges.service';
import { applyXpGain } from '../quests/period-keys';
import { ShopItem } from './shop-item.entity';
import { StudentInventory } from './student-inventory.entity';

const XP_PER_LEVEL = 1000;

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopItem) private readonly items: Repository<ShopItem>,
    @InjectRepository(StudentInventory) private readonly inventory: Repository<StudentInventory>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    private readonly badges: BadgesService,
    private readonly ds: DataSource,
  ) {}

  private toDto(i: ShopItem): IShopItem {
    return {
      id: i.id,
      code: i.code,
      name: i.name,
      description: i.description,
      icon: i.icon,
      kind: i.kind,
      category: i.category,
      rarity: i.rarity,
      price: i.price,
      payload: i.payload ?? null,
      sortOrder: i.sortOrder,
      isActive: i.isActive,
    };
  }

  /** The shop catalog as seen by one student: owned/equipped/affordable flags. */
  async getCatalog(userId: string): Promise<IShopCatalogResponse> {
    const [items, owned, profile] = await Promise.all([
      this.items.find({ where: { isActive: true }, order: { sortOrder: 'ASC', price: 'ASC' } }),
      this.inventory.find({ where: { userId } }),
      this.profiles.findOne({ where: { userId } }),
    ]);
    const gems = profile?.gems ?? 0;
    const ownedById = new Map(owned.map((o) => [o.itemId, o]));

    const entries: IShopCatalogEntry[] = items.map((item) => {
      const inv = ownedById.get(item.id);
      return {
        item: this.toDto(item),
        owned: !!inv,
        equipped: !!inv?.equipped,
        affordable: gems >= item.price,
      };
    });

    return { gems, entries };
  }

  /** List a student's owned cosmetics. */
  async getInventory(userId: string): Promise<IShopCatalogEntry[]> {
    const rows = await this.inventory.find({ where: { userId }, order: { acquiredAt: 'DESC' } });
    return rows.map((inv) => ({
      item: this.toDto(inv.item),
      owned: true,
      equipped: inv.equipped,
      affordable: true,
    }));
  }

  /**
   * Spend gems on an item. Cosmetics are added to inventory; consumables apply
   * their effect (XP / random gems) immediately and leave no inventory row.
   * Runs in a transaction so the gem debit and the grant can't diverge.
   */
  async purchase(userId: string, itemId: string): Promise<IPurchaseResult> {
    const result = await this.ds.transaction(async (tx) => {
      const itemRepo = tx.getRepository(ShopItem);
      const invRepo = tx.getRepository(StudentInventory);
      const profRepo = tx.getRepository(StudentProfile);

      const item = await itemRepo.findOne({ where: { id: itemId, isActive: true } });
      if (!item) throw new NotFoundException('Shop item not found');

      const profile = await profRepo.findOne({ where: { userId } });
      if (!profile) throw new NotFoundException('Student profile not found');

      if (profile.gems < item.price) {
        throw new BadRequestException('Không đủ đá quý để mua vật phẩm này.');
      }

      let awardedXp = 0;
      let awardedGems = 0;
      let equipped = false;
      let message = '';

      if (item.kind === ShopItemKind.COSMETIC) {
        const existing = await invRepo.findOne({ where: { userId, itemId: item.id } });
        if (existing) throw new BadRequestException('Bạn đã sở hữu vật phẩm này.');
        profile.gems -= item.price;
        await invRepo.save(invRepo.create({ userId, itemId: item.id, equipped: false }));
        message = `Đã mua "${item.name}". Vào kho đồ để trang bị!`;
      } else {
        // CONSUMABLE — apply effect now.
        profile.gems -= item.price;
        const now = new Date();
        const p = item.payload ?? {};
        if (p.xp && p.xp > 0) {
          const prevLevel = profile.level;
          applyXpGain(profile, p.xp, now);
          while (profile.xp >= profile.level * XP_PER_LEVEL) profile.level += 1;
          awardedXp = p.xp;
          message =
            profile.level > prevLevel
              ? `+${p.xp} XP — bạn đã lên cấp ${profile.level}!`
              : `+${p.xp} XP từ "${item.name}".`;
        }
        if (typeof p.gemsMin === 'number' && typeof p.gemsMax === 'number') {
          const lo = Math.min(p.gemsMin, p.gemsMax);
          const hi = Math.max(p.gemsMin, p.gemsMax);
          const roll = lo + Math.floor(Math.random() * (hi - lo + 1));
          profile.gems += roll;
          awardedGems = roll;
          message = `Hộp quà mở ra ${roll} đá quý!`;
        }
        if (!message) message = `Đã sử dụng "${item.name}".`;
      }

      await profRepo.save(profile);
      return { gems: profile.gems, awardedXp, awardedGems, equipped, message, code: item.code };
    });

    // XP from a consumable may cross a badge threshold — evaluate outside the tx.
    if (result.awardedXp > 0) {
      await this.badges.evaluateAndAward(userId);
    }

    return {
      itemCode: result.code,
      gems: result.gems,
      awardedXp: result.awardedXp,
      awardedGems: result.awardedGems,
      equipped: result.equipped,
      message: result.message,
    };
  }

  /** Equip an owned cosmetic, unequipping any other item in the same slot. */
  async equip(userId: string, itemId: string): Promise<IEquipResult> {
    return this.ds.transaction(async (tx) => {
      const invRepo = tx.getRepository(StudentInventory);
      const profRepo = tx.getRepository(StudentProfile);

      const inv = await invRepo.findOne({ where: { userId, itemId }, relations: ['item'] });
      if (!inv) throw new NotFoundException('Bạn chưa sở hữu vật phẩm này.');
      const item = inv.item;
      if (item.kind !== ShopItemKind.COSMETIC) {
        throw new BadRequestException('Vật phẩm này không thể trang bị.');
      }
      const profile = await profRepo.findOne({ where: { userId } });
      if (!profile) throw new NotFoundException('Student profile not found');

      // Unequip every other owned item in the same category (one slot each).
      const sameCategory = await invRepo
        .createQueryBuilder('inv')
        .innerJoinAndSelect('inv.item', 'it')
        .where('inv.user_id = :userId', { userId })
        .andWhere('it.category = :cat', { cat: item.category })
        .getMany();
      for (const row of sameCategory) {
        if (row.equipped) {
          row.equipped = false;
          await invRepo.save(row);
        }
      }

      inv.equipped = true;
      await invRepo.save(inv);
      this.applyCosmeticToProfile(profile, item);
      await profRepo.save(profile);

      return this.equipResult(item.code, true, profile);
    });
  }

  /** Remove an equipped cosmetic from its slot. */
  async unequip(userId: string, itemId: string): Promise<IEquipResult> {
    return this.ds.transaction(async (tx) => {
      const invRepo = tx.getRepository(StudentInventory);
      const profRepo = tx.getRepository(StudentProfile);

      const inv = await invRepo.findOne({ where: { userId, itemId }, relations: ['item'] });
      if (!inv) throw new NotFoundException('Bạn chưa sở hữu vật phẩm này.');
      const profile = await profRepo.findOne({ where: { userId } });
      if (!profile) throw new NotFoundException('Student profile not found');

      inv.equipped = false;
      await invRepo.save(inv);
      this.clearCosmeticFromProfile(profile, inv.item.category);
      await profRepo.save(profile);

      return this.equipResult(inv.item.code, false, profile);
    });
  }

  private applyCosmeticToProfile(profile: StudentProfile, item: ShopItem): void {
    const p = item.payload ?? {};
    switch (item.category) {
      case ShopItemCategory.AVATAR_FRAME:
        profile.equippedFrame = p.frameKey ?? item.code;
        break;
      case ShopItemCategory.PROFILE_THEME:
        profile.equippedTheme = p.themeKey ?? item.code;
        break;
      case ShopItemCategory.NAME_COLOR:
        profile.nameColor = p.color ?? null;
        break;
      case ShopItemCategory.TITLE:
        profile.equippedTitle = p.title ?? item.name;
        break;
      default:
        break;
    }
  }

  private clearCosmeticFromProfile(profile: StudentProfile, category: ShopItemCategory): void {
    switch (category) {
      case ShopItemCategory.AVATAR_FRAME:
        profile.equippedFrame = null;
        break;
      case ShopItemCategory.PROFILE_THEME:
        profile.equippedTheme = null;
        break;
      case ShopItemCategory.NAME_COLOR:
        profile.nameColor = null;
        break;
      case ShopItemCategory.TITLE:
        profile.equippedTitle = null;
        break;
      default:
        break;
    }
  }

  private equipResult(itemCode: string, equipped: boolean, profile: StudentProfile): IEquipResult {
    return {
      itemCode,
      equipped,
      equippedFrame: profile.equippedFrame ?? null,
      equippedTheme: profile.equippedTheme ?? null,
      nameColor: profile.nameColor ?? null,
      equippedTitle: profile.equippedTitle ?? null,
    };
  }
}

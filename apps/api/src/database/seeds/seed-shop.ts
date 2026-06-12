import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { ShopItem } from '../../modules/shop/shop-item.entity';
import {
  BadgeRarity,
  IShopItemPayload,
  ShopItemCategory,
  ShopItemKind,
} from '@cp/shared';

// ── Gem-shop catalog (idempotent by `code`) ───────────────────────────────────
interface ShopSeed {
  code: string;
  name: string;
  description: string;
  icon: string;
  kind: ShopItemKind;
  category: ShopItemCategory;
  rarity: BadgeRarity;
  price: number;
  payload?: IShopItemPayload | null;
  sortOrder: number;
}

const ITEMS: ShopSeed[] = [
  // ── Name colors ─────────────────────────────────────────────────────────────
  { code: 'COLOR_EMBER', name: 'Tên màu Lửa', description: 'Tên hiển thị màu cam rực.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.COMMON, price: 80, payload: { color: '#f97316' }, sortOrder: 1 },
  { code: 'COLOR_OCEAN', name: 'Tên màu Đại dương', description: 'Tên hiển thị màu xanh biển.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.COMMON, price: 80, payload: { color: '#0ea5e9' }, sortOrder: 2 },
  { code: 'COLOR_MINT', name: 'Tên màu Bạc hà', description: 'Tên hiển thị màu xanh ngọc.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.COMMON, price: 80, payload: { color: '#10b981' }, sortOrder: 3 },
  { code: 'COLOR_ROYAL', name: 'Tên màu Hoàng gia', description: 'Tên hiển thị màu tím sang trọng.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.RARE, price: 200, payload: { color: '#8b5cf6' }, sortOrder: 4 },
  { code: 'COLOR_GOLD', name: 'Tên màu Vàng kim', description: 'Tên hiển thị màu vàng kim lấp lánh.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.EPIC, price: 500, payload: { color: '#fbbf24' }, sortOrder: 5 },

  // ── Avatar frames ─────────────────────────────────────────────────────────────
  { code: 'FRAME_BRONZE', name: 'Khung Đồng', description: 'Viền đồng quanh ảnh đại diện.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.COMMON, price: 120, payload: { frameKey: 'bronze' }, sortOrder: 10 },
  { code: 'FRAME_SILVER', name: 'Khung Bạc', description: 'Viền bạc sáng quanh ảnh đại diện.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.RARE, price: 300, payload: { frameKey: 'silver' }, sortOrder: 11 },
  { code: 'FRAME_GOLD', name: 'Khung Vàng', description: 'Viền vàng phát sáng cho cao thủ.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.EPIC, price: 600, payload: { frameKey: 'gold' }, sortOrder: 12 },
  { code: 'FRAME_NEON', name: 'Khung Neon', description: 'Viền neon rực rỡ chuyển sắc.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.LEGENDARY, price: 1200, payload: { frameKey: 'neon' }, sortOrder: 13 },

  // ── Profile themes ────────────────────────────────────────────────────────────
  { code: 'THEME_SUNSET', name: 'Theme Hoàng hôn', description: 'Nền hồ sơ gradient hoàng hôn.', icon: 'gradient', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PROFILE_THEME, rarity: BadgeRarity.RARE, price: 250, payload: { themeKey: 'sunset' }, sortOrder: 20 },
  { code: 'THEME_AURORA', name: 'Theme Cực quang', description: 'Nền hồ sơ gradient cực quang.', icon: 'gradient', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PROFILE_THEME, rarity: BadgeRarity.EPIC, price: 550, payload: { themeKey: 'aurora' }, sortOrder: 21 },
  { code: 'THEME_GALAXY', name: 'Theme Thiên hà', description: 'Nền hồ sơ thiên hà huyền ảo.', icon: 'gradient', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PROFILE_THEME, rarity: BadgeRarity.LEGENDARY, price: 1000, payload: { themeKey: 'galaxy' }, sortOrder: 22 },

  // ── Titles ────────────────────────────────────────────────────────────────────
  { code: 'TITLE_RISING', name: 'Danh hiệu "Tân binh triển vọng"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.COMMON, price: 150, payload: { title: 'Tân binh triển vọng' }, sortOrder: 30 },
  { code: 'TITLE_CODER', name: 'Danh hiệu "Lập trình viên"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.RARE, price: 350, payload: { title: 'Lập trình viên' }, sortOrder: 31 },
  { code: 'TITLE_LEGEND', name: 'Danh hiệu "Huyền thoại"', description: 'Danh hiệu dành cho bậc thầy.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.LEGENDARY, price: 900, payload: { title: 'Huyền thoại' }, sortOrder: 32 },

  // ── Consumables ────────────────────────────────────────────────────────────────
  { code: 'XP_PACK_S', name: 'Gói XP nhỏ', description: 'Nhận ngay +100 XP.', icon: 'bolt', kind: ShopItemKind.CONSUMABLE, category: ShopItemCategory.CONSUMABLE, rarity: BadgeRarity.COMMON, price: 60, payload: { xp: 100 }, sortOrder: 40 },
  { code: 'XP_PACK_L', name: 'Gói XP lớn', description: 'Nhận ngay +500 XP.', icon: 'electric_bolt', kind: ShopItemKind.CONSUMABLE, category: ShopItemCategory.CONSUMABLE, rarity: BadgeRarity.RARE, price: 260, payload: { xp: 500 }, sortOrder: 41 },
  { code: 'GEM_BOX', name: 'Hộp quà đá quý', description: 'Mở ra ngẫu nhiên 20–200 đá quý. Cầu may!', icon: 'card_giftcard', kind: ShopItemKind.CONSUMABLE, category: ShopItemCategory.CONSUMABLE, rarity: BadgeRarity.EPIC, price: 100, payload: { gemsMin: 20, gemsMax: 200 }, sortOrder: 42 },
];

async function run() {
  console.log('🛒 Seeding gem-shop items…');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const repo = AppDataSource.getRepository(ShopItem);
  let created = 0;
  for (const it of ITEMS) {
    const existing = await repo.findOne({ where: { code: it.code } });
    if (existing) {
      // Keep catalog metadata fresh on re-runs (price/desc tweaks) but never
      // touch ownership rows.
      await repo.update(
        { id: existing.id },
        {
          name: it.name,
          description: it.description,
          icon: it.icon,
          kind: it.kind,
          category: it.category,
          rarity: it.rarity,
          price: it.price,
          payload: it.payload ?? null,
          sortOrder: it.sortOrder,
          isActive: true,
        },
      );
      continue;
    }
    await repo.save(
      repo.create({
        code: it.code,
        name: it.name,
        description: it.description,
        icon: it.icon,
        kind: it.kind,
        category: it.category,
        rarity: it.rarity,
        price: it.price,
        payload: it.payload ?? null,
        sortOrder: it.sortOrder,
        isActive: true,
      }),
    );
    created += 1;
    console.log(`  🛍️  Shop item created: ${it.code}`);
  }

  console.log(`✅ Seeded ${ITEMS.length} shop items (${created} new).`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during shop seed:', err);
  process.exit(1);
});

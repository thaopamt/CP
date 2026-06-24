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
  imageUrl?: string | null;
  kind: ShopItemKind;
  category: ShopItemCategory;
  rarity: BadgeRarity;
  price: number;
  minLevel?: number;
  payload?: IShopItemPayload | null;
  sortOrder: number;
}

// ── Characters ────────────────────────────────────────────────────────────────
// Avatar characters. Images are static SVGs served by the web app from
// apps/web/public/character/<gender>/<stem>.svg. Equipping one replaces the
// student's avatar everywhere. 15 tiers × 2 genders.
// Tier i (0-based) unlocks at level i*5: Tân thủ Lv0, Đồng Lv5, Sắt Lv10, … Thần thánh Lv70.
const CHARACTER_TIERS: { stem: string; label: string; rarity: BadgeRarity; price: number }[] = [
  { stem: '1-new-biew', label: 'Tân thủ', rarity: BadgeRarity.COMMON, price: 100 },
  { stem: '2-brown', label: 'Đồng', rarity: BadgeRarity.COMMON, price: 150 },
  { stem: '3-iron', label: 'Sắt', rarity: BadgeRarity.COMMON, price: 200 },
  { stem: '4-silver', label: 'Bạc', rarity: BadgeRarity.RARE, price: 300 },
  { stem: '5-gold', label: 'Vàng', rarity: BadgeRarity.RARE, price: 400 },
  { stem: '6-platinum', label: 'Bạch kim', rarity: BadgeRarity.RARE, price: 500 },
  { stem: '7-diamond', label: 'Kim cương', rarity: BadgeRarity.EPIC, price: 700 },
  { stem: '8-emerald', label: 'Ngọc lục bảo', rarity: BadgeRarity.EPIC, price: 800 },
  { stem: '9-ruby', label: 'Hồng ngọc', rarity: BadgeRarity.EPIC, price: 900 },
  { stem: '10-turquoise', label: 'Lam ngọc', rarity: BadgeRarity.EPIC, price: 1000 },
  { stem: '11-amethyst', label: 'Thạch anh tím', rarity: BadgeRarity.EPIC, price: 1100 },
  { stem: '12-royal', label: 'Hoàng gia', rarity: BadgeRarity.LEGENDARY, price: 1400 },
  { stem: '13-legend', label: 'Huyền thoại', rarity: BadgeRarity.LEGENDARY, price: 1700 },
  { stem: '14-myth', label: 'Thần thoại', rarity: BadgeRarity.LEGENDARY, price: 2000 },
  { stem: '15-divine', label: 'Thần thánh', rarity: BadgeRarity.LEGENDARY, price: 2500 },
];

const GENDERS: { key: 'male' | 'female'; code: string; label: string }[] = [
  { key: 'male', code: 'M', label: 'Nam' },
  { key: 'female', code: 'F', label: 'Nữ' },
];

const CHARACTER_ITEMS: ShopSeed[] = GENDERS.flatMap((g, gi) =>
  CHARACTER_TIERS.map((tier, ti) => {
    const suffix = tier.stem.replace(/^\d+-/, '').replace(/-/g, '_').toUpperCase();
    const minLevel = ti * 5;
    return {
      code: `CHAR_${g.code}_${suffix}`,
      name: `Nhân vật ${tier.label} (${g.label})`,
      description:
        minLevel > 0
          ? `Nhân vật cấp ${tier.label} — mở khoá ở Level ${minLevel}. Thay ảnh đại diện của bạn.`
          : `Nhân vật cấp ${tier.label} — thay ảnh đại diện của bạn ở mọi nơi.`,
      icon: 'person',
      imageUrl: `/character/${g.key}/${tier.stem}.svg`,
      kind: ShopItemKind.COSMETIC,
      category: ShopItemCategory.CHARACTER,
      rarity: tier.rarity,
      price: tier.price,
      minLevel,
      payload: null,
      sortOrder: 100 + gi * 100 + ti,
    };
  }),
);

const ITEMS: ShopSeed[] = [
  // ── Name colors ─────────────────────────────────────────────────────────────
  { code: 'COLOR_EMBER', name: 'Tên màu Lửa', description: 'Tên hiển thị màu cam rực.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.COMMON, price: 80, payload: { color: '#f97316' }, sortOrder: 1 },
  { code: 'COLOR_OCEAN', name: 'Tên màu Đại dương', description: 'Tên hiển thị màu xanh biển.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.COMMON, price: 80, payload: { color: '#0ea5e9' }, sortOrder: 2 },
  { code: 'COLOR_MINT', name: 'Tên màu Bạc hà', description: 'Tên hiển thị màu xanh ngọc.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.COMMON, price: 80, payload: { color: '#10b981' }, sortOrder: 3 },
  { code: 'COLOR_ROYAL', name: 'Tên màu Hoàng gia', description: 'Tên hiển thị màu tím sang trọng.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.RARE, price: 200, payload: { color: '#8b5cf6' }, sortOrder: 4 },
  { code: 'COLOR_GOLD', name: 'Tên màu Vàng kim', description: 'Tên hiển thị màu vàng kim lấp lánh.', icon: 'palette', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.NAME_COLOR, rarity: BadgeRarity.EPIC, price: 500, payload: { color: '#fbbf24' }, sortOrder: 5 },


  // ── Profile themes ────────────────────────────────────────────────────────────
  { code: 'THEME_SUNSET', name: 'Theme Hoàng hôn', description: 'Nền hồ sơ gradient hoàng hôn.', icon: 'gradient', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PROFILE_THEME, rarity: BadgeRarity.RARE, price: 250, payload: { themeKey: 'sunset' }, sortOrder: 20 },
  { code: 'THEME_AURORA', name: 'Theme Cực quang', description: 'Nền hồ sơ gradient cực quang.', icon: 'gradient', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PROFILE_THEME, rarity: BadgeRarity.EPIC, price: 550, payload: { themeKey: 'aurora' }, sortOrder: 21 },
  { code: 'THEME_GALAXY', name: 'Theme Thiên hà', description: 'Nền hồ sơ thiên hà huyền ảo.', icon: 'gradient', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PROFILE_THEME, rarity: BadgeRarity.LEGENDARY, price: 1000, payload: { themeKey: 'galaxy' }, sortOrder: 22 },

  // ── Titles ────────────────────────────────────────────────────────────────────
  { code: 'TITLE_RISING', name: 'Danh hiệu "Tân binh triển vọng"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.COMMON, price: 150, payload: { title: 'Tân binh triển vọng' }, sortOrder: 30 },
  { code: 'TITLE_CODER', name: 'Danh hiệu "Lập trình viên"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.RARE, price: 350, payload: { title: 'Lập trình viên' }, sortOrder: 31 },
  { code: 'TITLE_LEGEND', name: 'Danh hiệu "Huyền thoại"', description: 'Danh hiệu dành cho bậc thầy.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.LEGENDARY, price: 900, payload: { title: 'Huyền thoại' }, sortOrder: 32 },
  { code: 'TITLE_NEWBIE', name: 'Danh hiệu "Tân thủ"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.COMMON, price: 100, payload: { title: 'Tân thủ' }, sortOrder: 33 },
  { code: 'TITLE_DILIGENT', name: 'Danh hiệu "Học viên chăm chỉ"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.COMMON, price: 150, payload: { title: 'Học viên chăm chỉ' }, sortOrder: 34 },
  { code: 'TITLE_BUGHUNTER', name: 'Danh hiệu "Thợ săn Bug"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.RARE, price: 300, payload: { title: 'Thợ săn Bug' }, sortOrder: 35 },
  { code: 'TITLE_SPEED', name: 'Danh hiệu "Vua Tốc Độ"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.RARE, price: 350, payload: { title: 'Vua Tốc Độ' }, sortOrder: 36 },
  { code: 'TITLE_ALGO', name: 'Danh hiệu "Bậc thầy Giải thuật"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.EPIC, price: 600, payload: { title: 'Bậc thầy Giải thuật' }, sortOrder: 37 },
  { code: 'TITLE_WARRIOR', name: 'Danh hiệu "Chiến Thần"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.EPIC, price: 650, payload: { title: 'Chiến Thần' }, sortOrder: 38 },
  { code: 'TITLE_GENIUS', name: 'Danh hiệu "Thiên Tài"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.EPIC, price: 700, payload: { title: 'Thiên Tài' }, sortOrder: 39 },
  { code: 'TITLE_DESTROYER', name: 'Danh hiệu "Kẻ Huỷ Diệt"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.EPIC, price: 720, payload: { title: 'Kẻ Huỷ Diệt' }, sortOrder: 40 },
  { code: 'TITLE_GRANDMASTER', name: 'Danh hiệu "Đại Cao Thủ"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.LEGENDARY, price: 1100, payload: { title: 'Đại Cao Thủ' }, sortOrder: 41 },
  { code: 'TITLE_CHAMPION', name: 'Danh hiệu "Nhà Vô Địch"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.LEGENDARY, price: 1200, payload: { title: 'Nhà Vô Địch' }, sortOrder: 42 },
  { code: 'TITLE_EMPEROR', name: 'Danh hiệu "Hoàng Đế Code"', description: 'Hiển thị danh hiệu cạnh tên.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.LEGENDARY, price: 1400, payload: { title: 'Hoàng Đế Code' }, sortOrder: 43 },
  { code: 'TITLE_MYTHIC', name: 'Danh hiệu "Truyền Kỳ"', description: 'Danh hiệu hiếm nhất hệ thống.', icon: 'badge', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.TITLE, rarity: BadgeRarity.LEGENDARY, price: 1800, payload: { title: 'Truyền Kỳ' }, sortOrder: 44 },

  // ── Consumables ────────────────────────────────────────────────────────────────
  { code: 'XP_PACK_S', name: 'Gói XP nhỏ', description: 'Nhận ngay +100 XP.', icon: 'bolt', kind: ShopItemKind.CONSUMABLE, category: ShopItemCategory.CONSUMABLE, rarity: BadgeRarity.COMMON, price: 60, payload: { xp: 100 }, sortOrder: 40 },
  { code: 'XP_PACK_L', name: 'Gói XP lớn', description: 'Nhận ngay +500 XP.', icon: 'electric_bolt', kind: ShopItemKind.CONSUMABLE, category: ShopItemCategory.CONSUMABLE, rarity: BadgeRarity.RARE, price: 260, payload: { xp: 500 }, sortOrder: 41 },
  { code: 'GEM_BOX', name: 'Hộp quà đá quý', description: 'Mở ra ngẫu nhiên 20–200 đá quý. Cầu may!', icon: 'card_giftcard', kind: ShopItemKind.CONSUMABLE, category: ShopItemCategory.CONSUMABLE, rarity: BadgeRarity.EPIC, price: 100, payload: { gemsMin: 20, gemsMax: 200 }, sortOrder: 42 },

  // ── Characters (avatars) ───────────────────────────────────────────────────────
  ...CHARACTER_ITEMS,
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
          imageUrl: it.imageUrl ?? null,
          kind: it.kind,
          category: it.category,
          rarity: it.rarity,
          price: it.price,
          minLevel: it.minLevel ?? 0,
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
        imageUrl: it.imageUrl ?? null,
        kind: it.kind,
        category: it.category,
        rarity: it.rarity,
        price: it.price,
        minLevel: it.minLevel ?? 0,
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

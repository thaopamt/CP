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
  { code: 'FRAME_ROSE', name: 'Khung Hoa Hồng', description: 'Viền hồng pastel dịu dàng.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.COMMON, price: 180, payload: { frameKey: 'rose' }, sortOrder: 14 },
  { code: 'FRAME_EMERALD', name: 'Khung Lục Bảo', description: 'Viền lục bảo xanh ngọc.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.RARE, price: 300, payload: { frameKey: 'emerald' }, sortOrder: 15 },
  { code: 'FRAME_SAPPHIRE', name: 'Khung Lam Ngọc', description: 'Viền lam ngọc xanh biển.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.RARE, price: 320, payload: { frameKey: 'sapphire' }, sortOrder: 16 },
  { code: 'FRAME_EMBER', name: 'Khung Than Hồng', description: 'Viền lửa cam đỏ ấm áp.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.RARE, price: 350, payload: { frameKey: 'ember' }, sortOrder: 17 },
  { code: 'FRAME_FROST', name: 'Khung Băng Giá', description: 'Viền băng xanh lạnh.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.RARE, price: 360, payload: { frameKey: 'frost' }, sortOrder: 18 },
  { code: 'FRAME_RUBY', name: 'Khung Hồng Ngọc', description: 'Viền hồng ngọc đỏ rực.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.EPIC, price: 600, payload: { frameKey: 'ruby' }, sortOrder: 19 },
  { code: 'FRAME_AMETHYST', name: 'Khung Tử Thạch', description: 'Viền tím thạch anh huyền bí.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.EPIC, price: 620, payload: { frameKey: 'amethyst' }, sortOrder: 20 },
  { code: 'FRAME_TOXIC', name: 'Khung Độc Tố', description: 'Viền xanh nõn phát sáng.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.EPIC, price: 640, payload: { frameKey: 'toxic' }, sortOrder: 21 },
  { code: 'FRAME_OBSIDIAN', name: 'Khung Hắc Diện', description: 'Viền hắc thạch sang trọng.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.EPIC, price: 700, payload: { frameKey: 'obsidian' }, sortOrder: 22 },
  { code: 'FRAME_ROYAL', name: 'Khung Hoàng Tộc', description: 'Viền tím vàng quý tộc.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.LEGENDARY, price: 1100, payload: { frameKey: 'royal' }, sortOrder: 23 },
  { code: 'FRAME_DIAMOND', name: 'Khung Kim Cương', description: 'Viền kim cương lấp lánh.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.LEGENDARY, price: 1300, payload: { frameKey: 'diamond' }, sortOrder: 24 },
  { code: 'FRAME_RAINBOW', name: 'Khung Cầu Vồng', description: 'Viền cầu vồng bảy sắc.', icon: 'crop_square', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.AVATAR_FRAME, rarity: BadgeRarity.LEGENDARY, price: 1500, payload: { frameKey: 'rainbow' }, sortOrder: 25 },

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

  // ── Character: Hats (Mũ) ────────────────────────────────────────────────────────
  { code: 'HAT_CAP', name: 'Mũ Lưỡi Trai', description: 'Mũ lưỡi trai năng động.', icon: 'sports_baseball', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.COMMON, price: 80, payload: { emoji: '🧢' }, sortOrder: 50 },
  { code: 'HAT_STRAW', name: 'Mũ Cói', description: 'Mũ cói mùa hè.', icon: 'beach_access', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.COMMON, price: 90, payload: { emoji: '👒' }, sortOrder: 51 },
  { code: 'HAT_HELMET', name: 'Mũ Bảo Hộ', description: 'Mũ bảo hộ công trường.', icon: 'construction', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.COMMON, price: 100, payload: { emoji: '⛑️' }, sortOrder: 52 },
  { code: 'HAT_TOP', name: 'Mũ Quý Tộc', description: 'Mũ chóp cao lịch lãm.', icon: 'workspace_premium', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.RARE, price: 250, payload: { emoji: '🎩' }, sortOrder: 53 },
  { code: 'HAT_MILITARY', name: 'Mũ Quân Đội', description: 'Mũ chiến binh oai phong.', icon: 'military_tech', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.RARE, price: 260, payload: { emoji: '🪖' }, sortOrder: 54 },
  { code: 'HAT_GRAD', name: 'Mũ Tốt Nghiệp', description: 'Mũ cử nhân tri thức.', icon: 'school', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.RARE, price: 280, payload: { emoji: '🎓' }, sortOrder: 55 },
  { code: 'HAT_CROWN', name: 'Vương Miện', description: 'Vương miện cho nhà vô địch.', icon: 'crown', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.HAT, rarity: BadgeRarity.LEGENDARY, price: 1200, payload: { emoji: '👑', imageUrl: '/characters/hat/hat_crown.svg' }, sortOrder: 56 },

  // ── Character: Outfits (Trang phục — emoji thân nhân vật) ────────────────────────
  { code: 'OUTFIT_STUDENT', name: 'Đồng Phục Học Sinh', description: 'Trang phục học sinh chăm ngoan.', icon: 'face', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.COMMON, price: 100, payload: { emoji: '🧑‍🎓' }, sortOrder: 60 },
  { code: 'OUTFIT_FARMER', name: 'Nông Dân', description: 'Trang phục nhà nông.', icon: 'agriculture', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.COMMON, price: 120, payload: { emoji: '🧑‍🌾' }, sortOrder: 61 },
  { code: 'OUTFIT_MAGE', name: 'Pháp Sư', description: 'Áo choàng phép thuật.', icon: 'auto_fix_high', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.RARE, price: 350, payload: { emoji: '🧙', imageUrl: '/characters/outfit/outfit_mage.svg' }, sortOrder: 62 },
  { code: 'OUTFIT_ROBOT', name: 'Người Máy', description: 'Bộ giáp người máy.', icon: 'smart_toy', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.RARE, price: 380, payload: { emoji: '🤖' }, sortOrder: 63 },
  { code: 'OUTFIT_HERO', name: 'Siêu Anh Hùng', description: 'Trang phục siêu anh hùng.', icon: 'bolt', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.EPIC, price: 600, payload: { emoji: '🦸' }, sortOrder: 64 },
  { code: 'OUTFIT_NINJA', name: 'Ninja', description: 'Trang phục ninja bí ẩn.', icon: 'dark_mode', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.EPIC, price: 650, payload: { emoji: '🥷' }, sortOrder: 65 },
  { code: 'OUTFIT_ASTRO', name: 'Phi Hành Gia', description: 'Bộ đồ du hành vũ trụ.', icon: 'rocket_launch', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.EPIC, price: 680, payload: { emoji: '🧑‍🚀' }, sortOrder: 66 },
  { code: 'OUTFIT_PRINCE', name: 'Hoàng Tử', description: 'Trang phục hoàng gia.', icon: 'workspace_premium', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.OUTFIT, rarity: BadgeRarity.LEGENDARY, price: 1000, payload: { emoji: '🤴' }, sortOrder: 67 },

  // ── Character: Weapons (Vũ khí) ──────────────────────────────────────────────────
  { code: 'WEAPON_SHIELD', name: 'Khiên Gỗ', description: 'Khiên phòng thủ.', icon: 'shield', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.COMMON, price: 150, payload: { emoji: '🛡️' }, sortOrder: 70 },
  { code: 'WEAPON_HAMMER', name: 'Búa Thần', description: 'Búa sấm sét.', icon: 'gavel', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.RARE, price: 280, payload: { emoji: '🔨' }, sortOrder: 71 },
  { code: 'WEAPON_SWORD', name: 'Bảo Kiếm', description: 'Thanh kiếm sắc bén.', icon: 'swords', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.RARE, price: 300, payload: { emoji: '⚔️', imageUrl: '/characters/weapon/weapon_sword.svg' }, sortOrder: 72 },
  { code: 'WEAPON_AXE', name: 'Rìu Chiến', description: 'Rìu chiến uy lực.', icon: 'hardware', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.RARE, price: 300, payload: { emoji: '🪓' }, sortOrder: 73 },
  { code: 'WEAPON_BOW', name: 'Cung Tên', description: 'Cung tên thiện xạ.', icon: 'sports', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.RARE, price: 320, payload: { emoji: '🏹' }, sortOrder: 74 },
  { code: 'WEAPON_WAND', name: 'Đũa Phép', description: 'Đũa phép thần kỳ.', icon: 'auto_fix_high', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.EPIC, price: 600, payload: { emoji: '🪄' }, sortOrder: 75 },
  { code: 'WEAPON_GUN', name: 'Súng Nước', description: 'Súng phun nước vui nhộn.', icon: 'water_drop', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WEAPON, rarity: BadgeRarity.EPIC, price: 620, payload: { emoji: '🔫' }, sortOrder: 76 },

  // ── Character: Pets (Thú cưng) ───────────────────────────────────────────────────
  { code: 'PET_CAT', name: 'Mèo Con', description: 'Mèo con đáng yêu.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.COMMON, price: 150, payload: { emoji: '🐱', imageUrl: '/characters/pet/pet_cat.svg' }, sortOrder: 80 },
  { code: 'PET_DOG', name: 'Cún Cưng', description: 'Cún cưng trung thành.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.COMMON, price: 150, payload: { emoji: '🐶' }, sortOrder: 81 },
  { code: 'PET_PENGUIN', name: 'Chim Cánh Cụt', description: 'Cánh cụt tinh nghịch.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.COMMON, price: 160, payload: { emoji: '🐧' }, sortOrder: 82 },
  { code: 'PET_FOX', name: 'Cáo Lửa', description: 'Cáo lửa lanh lợi.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.RARE, price: 350, payload: { emoji: '🦊' }, sortOrder: 83 },
  { code: 'PET_OWL', name: 'Cú Thông Thái', description: 'Cú mèo thông thái.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.RARE, price: 360, payload: { emoji: '🦉' }, sortOrder: 84 },
  { code: 'PET_PANDA', name: 'Gấu Trúc', description: 'Gấu trúc mũm mĩm.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.RARE, price: 380, payload: { emoji: '🐼' }, sortOrder: 85 },
  { code: 'PET_UNICORN', name: 'Kỳ Lân', description: 'Kỳ lân huyền ảo.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.EPIC, price: 700, payload: { emoji: '🦄' }, sortOrder: 86 },
  { code: 'PET_DRAGON', name: 'Rồng Con', description: 'Rồng con huyền thoại.', icon: 'pets', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.PET, rarity: BadgeRarity.LEGENDARY, price: 1200, payload: { emoji: '🐉' }, sortOrder: 87 },

  // ── Character: Wings (Cánh) ──────────────────────────────────────────────────────
  { code: 'WINGS_BAT', name: 'Cánh Dơi', description: 'Đôi cánh dơi bí ẩn.', icon: 'flight', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WINGS, rarity: BadgeRarity.RARE, price: 350, payload: { emoji: '🦇' }, sortOrder: 90 },
  { code: 'WINGS_BUTTERFLY', name: 'Cánh Bướm', description: 'Đôi cánh bướm rực rỡ.', icon: 'flutter_dash', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WINGS, rarity: BadgeRarity.RARE, price: 380, payload: { emoji: '🦋' }, sortOrder: 91 },
  { code: 'WINGS_ANGEL', name: 'Cánh Thiên Thần', description: 'Đôi cánh thiên thần thuần khiết.', icon: 'flight', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WINGS, rarity: BadgeRarity.EPIC, price: 650, payload: { emoji: '🪽', imageUrl: '/characters/wings/wings_angel.svg' }, sortOrder: 92 },
  { code: 'WINGS_PHOENIX', name: 'Cánh Phượng Hoàng', description: 'Đôi cánh lửa phượng hoàng.', icon: 'local_fire_department', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.WINGS, rarity: BadgeRarity.LEGENDARY, price: 1100, payload: { emoji: '🔥' }, sortOrder: 93 },

  // ── Character: Backgrounds (Nền) ─────────────────────────────────────────────────
  { code: 'BG_SKY', name: 'Nền Mây Trời', description: 'Phông nền mây trời trong xanh.', icon: 'cloud', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.COMMON, price: 150, payload: { emoji: '☁️', color: '#e0f2fe', imageUrl: '/characters/bg/bg_sky.svg' }, sortOrder: 100 },
  { code: 'BG_FOREST', name: 'Nền Rừng Xanh', description: 'Phông nền rừng cây xanh mát.', icon: 'forest', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.COMMON, price: 180, payload: { emoji: '🌲', color: '#dcfce7' }, sortOrder: 101 },
  { code: 'BG_SUNSET', name: 'Nền Hoàng Hôn', description: 'Phông nền hoàng hôn rực rỡ.', icon: 'wb_twilight', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.RARE, price: 300, payload: { emoji: '🌅', color: '#ffedd5' }, sortOrder: 102 },
  { code: 'BG_OCEAN', name: 'Nền Đại Dương', description: 'Phông nền biển cả bao la.', icon: 'water', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.RARE, price: 320, payload: { emoji: '🌊', color: '#cffafe' }, sortOrder: 103 },
  { code: 'BG_CITY', name: 'Nền Thành Phố', description: 'Phông nền thành phố về đêm.', icon: 'location_city', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.RARE, price: 340, payload: { emoji: '🌃', color: '#e2e8f0' }, sortOrder: 104 },
  { code: 'BG_GALAXY', name: 'Nền Thiên Hà', description: 'Phông nền dải ngân hà huyền ảo.', icon: 'auto_awesome', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.EPIC, price: 600, payload: { emoji: '🌌', color: '#ede9fe' }, sortOrder: 105 },
  { code: 'BG_VOLCANO', name: 'Nền Núi Lửa', description: 'Phông nền núi lửa hùng vĩ.', icon: 'volcano', kind: ShopItemKind.COSMETIC, category: ShopItemCategory.BACKGROUND, rarity: BadgeRarity.EPIC, price: 650, payload: { emoji: '🌋', color: '#fee2e2' }, sortOrder: 106 },

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

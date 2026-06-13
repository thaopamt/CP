// ───────────────────────────────────────────────────────────────────────────
// Gem shop — students spend the gems they earn from quests/badges on cosmetics
// (avatar frames, profile themes, name colors, titles) and one-shot consumables
// (instant XP, random gem boxes). Cosmetics are owned + equippable; consumables
// apply their effect immediately on purchase and are not stored.
// ───────────────────────────────────────────────────────────────────────────

import { BadgeRarity } from './gamification.types';

/** Broad behaviour of an item. */
export enum ShopItemKind {
  COSMETIC = 'COSMETIC',
  CONSUMABLE = 'CONSUMABLE',
}

/**
 * Slot/category. Cosmetic categories are mutually exclusive per slot (equipping
 * a new frame unequips the old one). CONSUMABLE is its own catch-all category.
 */
export enum ShopItemCategory {
  AVATAR_FRAME = 'AVATAR_FRAME',
  PROFILE_THEME = 'PROFILE_THEME',
  NAME_COLOR = 'NAME_COLOR',
  TITLE = 'TITLE',
  CONSUMABLE = 'CONSUMABLE',
  // ── Character equipment slots (paper-doll, Gunny-style) ──────────────────────
  HAT = 'HAT',
  OUTFIT = 'OUTFIT',
  WEAPON = 'WEAPON',
  PET = 'PET',
  WINGS = 'WINGS',
  BACKGROUND = 'BACKGROUND',
}

/** The character equipment slots, in back-to-front render order. */
export const CHARACTER_SLOTS = [
  ShopItemCategory.BACKGROUND,
  ShopItemCategory.WINGS,
  ShopItemCategory.OUTFIT,
  ShopItemCategory.PET,
  ShopItemCategory.HAT,
  ShopItemCategory.WEAPON,
] as const;

export function isCharacterSlot(category: ShopItemCategory): boolean {
  return (CHARACTER_SLOTS as readonly ShopItemCategory[]).includes(category);
}

/**
 * Where/how a character sprite sits on the 768×768 canvas. When present the
 * renderer positions the layer by this transform; when absent the layer fills
 * the whole canvas (art pre-positioned by the artist). Admin-editable.
 */
export interface ICharacterTransform {
  /** Center X as % of canvas (0–100). */
  x: number;
  /** Center Y as % of canvas (0–100). */
  y: number;
  /** Box size as a fraction of the canvas (e.g. 0.3 = 30%). */
  scale: number;
  /** Rotation in degrees. */
  rotation: number;
}

/** Effect payload — fields are interpreted by category. */
export interface IShopItemPayload {
  /** NAME_COLOR / BACKGROUND: hex color or tint. */
  color?: string;
  /** PROFILE_THEME: theme key the frontend maps to a gradient/skin. */
  themeKey?: string;
  /** AVATAR_FRAME: frame key the frontend maps to a ring style. */
  frameKey?: string;
  /** TITLE: the cosmetic title text shown next to the name. */
  title?: string;
  /** Character slots: emoji placeholder shown until real art is supplied. */
  emoji?: string;
  /** Character slots: image URL for real sprite art (overrides emoji). */
  imageUrl?: string;
  /** Character slots: admin-set placement on the character canvas. */
  transform?: ICharacterTransform;
  /** CONSUMABLE: flat XP granted on purchase. */
  xp?: number;
  /** CONSUMABLE (gem box): random gems granted in [gemsMin, gemsMax]. */
  gemsMin?: number;
  gemsMax?: number;
}

/** A single equipped character item, denormalised for rendering anywhere. */
export interface ICharacterSlotItem {
  code: string;
  emoji?: string | null;
  imageUrl?: string | null;
  color?: string | null;
  transform?: ICharacterTransform | null;
}

/** Chosen base-body gender; drives the always-present body layer. */
export type CharacterGender = 'male' | 'female';

/** A student's equipped character — slot key (lowercased category) → item. */
export interface ICharacterEquip {
  /** Base-body gender (the layer items are dressed onto). */
  gender?: CharacterGender | null;
  background?: ICharacterSlotItem | null;
  wings?: ICharacterSlotItem | null;
  outfit?: ICharacterSlotItem | null;
  pet?: ICharacterSlotItem | null;
  hat?: ICharacterSlotItem | null;
  weapon?: ICharacterSlotItem | null;
}

export interface IShopItem {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  kind: ShopItemKind;
  category: ShopItemCategory;
  rarity: BadgeRarity;
  price: number;
  payload: IShopItemPayload | null;
  sortOrder: number;
  isActive: boolean;
}

/** Catalog row as seen by a specific student. */
export interface IShopCatalogEntry {
  item: IShopItem;
  /** Cosmetics only: does the student own it. */
  owned: boolean;
  /** Cosmetics only: is it currently equipped. */
  equipped: boolean;
  /** Can the student currently afford it. */
  affordable: boolean;
}

export interface IShopCatalogResponse {
  /** The caller's current gem balance. */
  gems: number;
  entries: IShopCatalogEntry[];
}

export interface IPurchaseResult {
  itemCode: string;
  /** Gem balance after the purchase. */
  gems: number;
  /** XP gained (consumables), 0 for cosmetics. */
  awardedXp: number;
  /** Gems gained back from a gem-box consumable, 0 otherwise. */
  awardedGems: number;
  /** Cosmetics: auto-equipped on first purchase. */
  equipped: boolean;
  /** Human-readable summary for the toast/popup. */
  message: string;
}

export interface IEquipResult {
  itemCode: string;
  equipped: boolean;
  equippedFrame: string | null;
  equippedTheme: string | null;
  nameColor: string | null;
  equippedTitle: string | null;
  /** Full character equip map after the change (for live re-render). */
  character: ICharacterEquip;
}

export interface ICreateShopItemPayload {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  kind: ShopItemKind;
  category: ShopItemCategory;
  rarity?: BadgeRarity;
  price: number;
  payload?: IShopItemPayload | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type IUpdateShopItemPayload = Partial<ICreateShopItemPayload>;

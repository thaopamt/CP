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
  // Cosmetic categories already present in the database (seeded shop data).
  // They must stay in sync with the DB enum or `synchronize: true` fails to
  // boot the API (it would try to drop these labels while rows still use them).
  HAT = 'HAT',
  OUTFIT = 'OUTFIT',
  WEAPON = 'WEAPON',
  PET = 'PET',
  WINGS = 'WINGS',
  BACKGROUND = 'BACKGROUND',
}

/** Effect payload — fields are interpreted by category. */
export interface IShopItemPayload {
  /** NAME_COLOR: hex color applied to the display name. */
  color?: string;
  /** PROFILE_THEME: theme key the frontend maps to a gradient/skin. */
  themeKey?: string;
  /** AVATAR_FRAME: frame key the frontend maps to a ring style. */
  frameKey?: string;
  /** TITLE: the cosmetic title text shown next to the name. */
  title?: string;
  /** CONSUMABLE: flat XP granted on purchase. */
  xp?: number;
  /** CONSUMABLE (gem box): random gems granted in [gemsMin, gemsMax]. */
  gemsMin?: number;
  gemsMax?: number;
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

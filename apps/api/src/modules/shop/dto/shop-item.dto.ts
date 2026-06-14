import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BadgeRarity,
  ICreateShopItemPayload,
  IShopItemPayload,
  IUpdateShopItemPayload,
  ShopItemCategory,
  ShopItemKind,
} from '@cp/shared';

/** Category-specific effect fields (interpreted by category). */
export class ShopItemPayloadDto implements IShopItemPayload {
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  themeKey?: string;

  @IsOptional()
  @IsString()
  frameKey?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  xp?: number;

  @IsOptional()
  @IsInt()
  gemsMin?: number;

  @IsOptional()
  @IsInt()
  gemsMax?: number;
}

export class CreateShopItemDto implements ICreateShopItemPayload {
  @IsString()
  @Length(1, 80)
  code!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  icon?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsEnum(ShopItemKind)
  kind!: ShopItemKind;

  @IsEnum(ShopItemCategory)
  category!: ShopItemCategory;

  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShopItemPayloadDto)
  payload?: IShopItemPayload | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateShopItemDto implements IUpdateShopItemPayload {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  icon?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(ShopItemKind)
  kind?: ShopItemKind;

  @IsOptional()
  @IsEnum(ShopItemCategory)
  category?: ShopItemCategory;

  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ShopItemPayloadDto)
  payload?: IShopItemPayload | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

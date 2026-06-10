import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Length, Min } from 'class-validator';
import { BadgeRarity, IBadgeCriteria, ICreateBadgePayload } from '@cp/shared';

export class CreateBadgeDto implements ICreateBadgePayload {
  @IsString()
  @Length(1, 80)
  code!: string;

  @IsString()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @IsObject()
  criteria!: IBadgeCriteria;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardGems?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBadgeDto implements Partial<ICreateBadgePayload> {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @IsOptional()
  @IsObject()
  criteria?: IBadgeCriteria;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardGems?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

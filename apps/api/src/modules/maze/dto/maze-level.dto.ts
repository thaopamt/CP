import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { BlockType, GridConfig, PublishStatus } from '@cp/shared';

export class CreateMazeLevelDto {
  @IsString() @Length(1, 255)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsObject()
  gridConfig!: GridConfig;

  @IsOptional() @IsArray() @IsEnum(BlockType, { each: true })
  allowedBlocks?: BlockType[];

  @IsOptional() @IsInt() @Min(1)
  maxBlocks?: number | null;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;

  @IsOptional() @IsUUID('4')
  courseId?: string | null;

  @IsOptional() @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  classIds?: string[];
}

export class UpdateMazeLevelDto {
  @IsOptional() @IsString() @Length(1, 255)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsObject()
  gridConfig?: GridConfig;

  @IsOptional() @IsArray() @IsEnum(BlockType, { each: true })
  allowedBlocks?: BlockType[];

  @IsOptional() @IsInt() @Min(1)
  maxBlocks?: number | null;

  @IsOptional() @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;

  @IsOptional() @IsUUID('4')
  courseId?: string | null;

  @IsOptional() @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  classIds?: string[];
}

import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  IsUUID,
} from 'class-validator';
import { IAssignmentEditorial, ICodingConfig, ICreateAssignmentDefPayload, PublishStatus } from '@cp/shared';

export class CreateAssignmentDto implements ICreateAssignmentDefPayload {
  @IsString()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @IsInt()
  @Min(0)
  points!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  codingConfig?: ICodingConfig;

  @IsOptional()
  @IsObject()
  editorial?: IAssignmentEditorial | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classIds?: string[];

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateAssignmentDto implements Partial<ICreateAssignmentDefPayload> {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  codingConfig?: ICodingConfig;

  @IsOptional()
  @IsObject()
  editorial?: IAssignmentEditorial | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classIds?: string[];

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

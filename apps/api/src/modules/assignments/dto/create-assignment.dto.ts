import { IsArray, IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, Length, Min, IsUUID } from 'class-validator';
import { AssignmentType, ICodingConfig, ICreateAssignmentDefPayload, PublishStatus } from '@cp/shared';

export class CreateAssignmentDto implements ICreateAssignmentDefPayload {
  @IsString() @Length(1, 255)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsEnum(AssignmentType)
  type!: AssignmentType;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @IsString() @Length(1, 100)
  subject!: string;

  @IsInt() @Min(0)
  points!: number;

  @IsOptional() @IsInt() @Min(0)
  estimatedMinutes?: number;

  @IsOptional() @IsString() @Length(1, 255)
  slug?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsObject()
  codingConfig?: ICodingConfig;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  classIds?: string[];

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateAssignmentDto implements Partial<ICreateAssignmentDefPayload> {
  @IsOptional() @IsString() @Length(1, 255)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(AssignmentType)
  type?: AssignmentType;

  @IsOptional() @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsOptional() @IsString() @Length(1, 100)
  subject?: string;

  @IsOptional() @IsInt() @Min(0)
  points?: number;

  @IsOptional() @IsInt() @Min(0)
  estimatedMinutes?: number;

  @IsOptional() @IsString() @Length(1, 255)
  slug?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsObject()
  codingConfig?: ICodingConfig;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  classIds?: string[];

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;
}

import { IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { AssignmentType, ICreateAssignmentDefPayload, PublishStatus } from '@cp/shared';

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

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;
}

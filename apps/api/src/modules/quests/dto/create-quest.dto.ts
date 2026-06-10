import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ICreateQuestPayload,
  IQuestObjectiveConfig,
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
} from '@cp/shared';

export class CreateQuestDto implements ICreateQuestPayload {
  @IsString()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(QuestType)
  type!: QuestType;

  @IsOptional()
  @IsEnum(QuestStatus)
  status?: QuestStatus;

  @IsEnum(QuestObjectiveType)
  objectiveType!: QuestObjectiveType;

  @IsOptional()
  @IsObject()
  objectiveConfig?: IQuestObjectiveConfig | null;

  @IsInt()
  @Min(1)
  targetCount!: number;

  @IsInt()
  @Min(0)
  rewardXp!: number;

  @IsInt()
  @Min(0)
  rewardGems!: number;

  @IsOptional()
  @ValidateIf((o) => o.rewardBadgeId != null)
  @IsUUID('4')
  rewardBadgeId?: string | null;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @ValidateIf((o) => o.category != null)
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(QuestRecurrence)
  recurrence?: QuestRecurrence;

  @IsOptional()
  @ValidateIf((o) => o.startsAt != null)
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.endsAt != null)
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.prerequisiteQuestId != null)
  @IsUUID('4')
  prerequisiteQuestId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.classIds != null)
  @IsArray()
  @IsUUID('4', { each: true })
  classIds?: string[] | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateQuestDto implements Partial<ICreateQuestPayload> {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(QuestType)
  type?: QuestType;

  @IsOptional()
  @IsEnum(QuestStatus)
  status?: QuestStatus;

  @IsOptional()
  @IsEnum(QuestObjectiveType)
  objectiveType?: QuestObjectiveType;

  @IsOptional()
  @IsObject()
  objectiveConfig?: IQuestObjectiveConfig | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardGems?: number;

  @IsOptional()
  @ValidateIf((o) => o.rewardBadgeId != null)
  @IsUUID('4')
  rewardBadgeId?: string | null;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @ValidateIf((o) => o.category != null)
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(QuestRecurrence)
  recurrence?: QuestRecurrence;

  @IsOptional()
  @ValidateIf((o) => o.startsAt != null)
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.endsAt != null)
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.prerequisiteQuestId != null)
  @IsUUID('4')
  prerequisiteQuestId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.classIds != null)
  @IsArray()
  @IsUUID('4', { each: true })
  classIds?: string[] | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  ContestFormat,
  ExamRankingRule,
  ExamScoringMode,
  ExamRewardType,
  ExamTieMode,
  ExamVisibility,
  IExamReward,
  IExamRewardCondition,
  IExamSettings,
  ISubtaskConfig,
} from '@cp/shared';

export class CreateExamDto {
  @IsString()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ContestFormat)
  format?: ContestFormat;

  @IsOptional()
  @IsEnum(ExamRankingRule)
  rankingRule?: ExamRankingRule;

  @IsOptional()
  @IsEnum(ExamTieMode)
  tieMode?: ExamTieMode;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601()
  freezeAt?: string | null;

  @IsOptional()
  @IsEnum(ExamVisibility)
  visibility?: ExamVisibility;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsArray()
  @IsUUID('4', { each: true })
  classIds?: string[] | null;

  @IsOptional()
  @IsBoolean()
  autoFinalize?: boolean;

  @IsOptional()
  @IsBoolean()
  autoGrantReward?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsObject()
  settings?: IExamSettings | null;
}

export class UpdateExamDto {
  @IsOptional() @IsString() @Length(1, 255) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ContestFormat) format?: ContestFormat;
  @IsOptional() @IsEnum(ExamRankingRule) rankingRule?: ExamRankingRule;
  @IsOptional() @IsEnum(ExamTieMode) tieMode?: ExamTieMode;
  @IsOptional() @IsISO8601() startAt?: string;
  @IsOptional() @IsISO8601() endAt?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) durationMinutes?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsISO8601() freezeAt?: string | null;
  @IsOptional() @IsEnum(ExamVisibility) visibility?: ExamVisibility;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsArray() @IsUUID('4', { each: true }) classIds?: string[] | null;
  @IsOptional() @IsBoolean() autoFinalize?: boolean;
  @IsOptional() @IsBoolean() autoGrantReward?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsObject() settings?: IExamSettings | null;
}

export class AddExamProblemDto {
  @IsUUID('4')
  assignmentId!: string;

  @IsOptional() @IsInt() @Min(0) orderIndex?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @Length(0, 8) label?: string | null;
  @IsOptional() @IsInt() @Min(0) points?: number;
  @IsOptional() @IsEnum(ExamScoringMode) scoringMode?: ExamScoringMode;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsArray() subtaskConfig?: ISubtaskConfig[] | null;
}

export class UpdateExamProblemDto {
  @IsOptional() @IsInt() @Min(0) orderIndex?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @Length(0, 8) label?: string | null;
  @IsOptional() @IsInt() @Min(0) points?: number;
  @IsOptional() @IsEnum(ExamScoringMode) scoringMode?: ExamScoringMode;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsArray() subtaskConfig?: ISubtaskConfig[] | null;
}

export class InviteParticipantsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];
}

export class BanParticipantDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateRewardRuleDto {
  @IsEnum(ExamRewardType)
  type!: ExamRewardType;

  @IsOptional() @IsString() @Length(0, 120) label?: string | null;
  @IsObject() condition!: IExamRewardCondition;
  @IsObject() reward!: IExamReward;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateRewardRuleDto {
  @IsOptional() @IsEnum(ExamRewardType) type?: ExamRewardType;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @Length(0, 120) label?: string | null;
  @IsOptional() @IsObject() condition?: IExamRewardCondition;
  @IsOptional() @IsObject() reward?: IExamReward;
  @IsOptional() @IsInt() priority?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ExamSubmitDto {
  @IsUUID('4')
  examProblemId!: string;

  @IsString()
  language!: string;

  @IsString()
  code!: string;
}

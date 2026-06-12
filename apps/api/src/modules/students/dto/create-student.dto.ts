import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EnrollmentStatus,
  GuardianRelationship,
  ICreateStudentPayload,
} from '@cp/shared';

export class GuardianDto {
  @IsString()
  @Length(1, 255)
  fullName!: string;

  @IsEnum(GuardianRelationship)
  relationship!: GuardianRelationship;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateStudentDto implements ICreateStudentPayload {
  @IsString() @Length(1, 160)
  fullName!: string;

  @IsOptional() @IsString() @Length(3, 80)
  username?: string;

  @IsString() @Length(6, 128)
  password!: string;

  @IsOptional() @IsString()
  homeAddress?: string;

  @IsInt() @Min(1) @Max(13)
  grade!: number;

  @IsOptional() @IsInt() @Min(2000) @Max(2100)
  cohortYear?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional() @IsInt() @Min(0)
  monthlyTuition?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}

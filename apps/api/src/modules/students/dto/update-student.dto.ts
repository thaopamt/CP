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
} from '@cp/shared';

import { GuardianDto } from './create-student.dto';

/**
 * Body for `PATCH /api/students/:id`. All fields optional. Passing
 * `guardians` replaces the full guardian array (cleanest mutation
 * semantics for a small list).
 */
export class UpdateStudentDto {
  @IsOptional() @IsString() @Length(1, 160)
  fullName?: string;

  @IsOptional() @IsString() @Length(3, 80)
  username?: string;

  @IsOptional() @IsString()
  homeAddress?: string;

  @IsOptional() @IsInt() @Min(1) @Max(13)
  grade?: number;

  @IsOptional() @IsInt() @Min(2000) @Max(2100)
  cohortYear?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  leaveDate?: string;

  @IsOptional() @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional() @IsInt() @Min(0)
  monthlyTuition?: number;

  @IsOptional() @IsBoolean()
  honorRoll?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}

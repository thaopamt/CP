import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
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
  Gender,
} from '@cp/shared';

import { GuardianDto } from './create-student.dto';

/**
 * Body for `PATCH /api/students/:id`. All fields optional. Passing
 * `guardians` replaces the full guardian array (cleanest mutation
 * semantics for a small list).
 */
export class UpdateStudentDto {
  @IsOptional() @IsString() @Length(1, 80)
  firstName?: string;

  @IsOptional() @IsString() @Length(1, 80)
  lastName?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @Length(1, 32)
  studentId?: string;

  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @IsOptional() @IsString()
  homeAddress?: string;

  @IsOptional() @IsInt() @Min(1) @Max(13)
  grade?: number;

  @IsOptional() @IsInt() @Min(2000) @Max(2100)
  cohortYear?: number;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional() @IsBoolean()
  honorRoll?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}

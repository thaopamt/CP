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
  GuardianRelationship,
  ICreateStudentPayload,
} from '@cp/shared';

export class GuardianDto {
  @IsString()
  @Length(1, 255)
  fullName!: string;

  @IsEnum(GuardianRelationship)
  relationship!: GuardianRelationship;

  @IsString()
  @Length(1, 32)
  phoneNumber!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateStudentDto implements ICreateStudentPayload {
  @IsString() @Length(1, 80)
  firstName!: string;

  @IsString() @Length(1, 80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString() @Length(6, 128)
  password!: string;

  /** Auto-generated server-side if omitted (e.g. "STU-2024-8901") */
  @IsOptional() @IsString() @Length(1, 32)
  studentId?: string;

  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}

import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Gender } from '@cp/shared';

export class UpdateMyStudentDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 80)
  username?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @IsOptional()
  @IsString()
  homeAddress?: string | null;
}

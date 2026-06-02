import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';


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
  @IsString()
  homeAddress?: string | null;
}

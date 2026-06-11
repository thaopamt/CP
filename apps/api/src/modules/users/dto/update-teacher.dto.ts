import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { IUpdateUserPayload } from '@cp/shared';

export class UpdateTeacherDto implements IUpdateUserPayload {
  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @Length(1, 80)
  firstName?: string;

  @IsOptional() @IsString() @Length(1, 80)
  lastName?: string;

  @IsOptional() @IsString() @Length(3, 80)
  username?: string | null;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

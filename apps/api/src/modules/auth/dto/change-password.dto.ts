import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @Length(6, 128)
  currentPassword!: string;

  @IsString()
  @Length(6, 128)
  newPassword!: string;
}

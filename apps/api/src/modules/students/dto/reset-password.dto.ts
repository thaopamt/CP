import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(6, 128)
  newPassword!: string;
}

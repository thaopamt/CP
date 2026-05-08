import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginRequest } from '@cp/shared';

export class LoginDto implements LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

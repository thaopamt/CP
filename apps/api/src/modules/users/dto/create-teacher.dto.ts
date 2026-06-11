import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { ICreateUserPayload } from '@cp/shared';

export class CreateTeacherDto
  implements Omit<ICreateUserPayload, 'role'>
{
  @IsEmail()
  email!: string;

  @IsString() @Length(1, 80)
  firstName!: string;

  @IsString() @Length(1, 80)
  lastName!: string;

  @IsString() @Length(6, 128)
  password!: string;

  @IsOptional() @IsString() @Length(3, 80)
  username?: string;
}

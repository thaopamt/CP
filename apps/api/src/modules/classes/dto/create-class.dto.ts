import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  ClassStatus,
  ICreateClassPayload,
} from '@cp/shared';

export class CreateClassDto implements ICreateClassPayload {
  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  @Length(1, 50)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

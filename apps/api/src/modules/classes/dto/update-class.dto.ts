import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  ClassStatus,
} from '@cp/shared';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

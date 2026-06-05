import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
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
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  term?: string;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

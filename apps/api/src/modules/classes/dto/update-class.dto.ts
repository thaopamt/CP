import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ClassDepartment,
  ClassStatus,
} from '@cp/shared';
import { ClassSessionDto } from './create-class.dto';

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
  @IsEnum(ClassDepartment)
  department?: ClassDepartment;

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
  @IsString()
  @Length(1, 100)
  room?: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClassSessionDto)
  sessions?: ClassSessionDto[];

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

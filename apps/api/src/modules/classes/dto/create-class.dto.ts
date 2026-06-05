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

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  @Length(1, 100)
  term!: string;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

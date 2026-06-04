import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ClassStatus,
  DayOfWeek,
  ICreateClassPayload,
} from '@cp/shared';

export class ClassSessionDto {
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  /** "HH:MM" 24h */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:MM' })
  endTime!: string;

}

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassSessionDto)
  sessions?: ClassSessionDto[];

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { DayOfWeek } from '@cp/shared';

export class CreateStudentScheduleDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:MM' })
  endTime!: string;


  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}

export class UpdateStudentScheduleDto {
  @IsOptional()
  @IsUUID()
  classId?: string | null;

  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:MM' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:MM' })
  endTime?: string;


  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string | null;
}

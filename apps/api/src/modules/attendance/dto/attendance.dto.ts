import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, DayOfWeek } from '@cp/shared';

export class AttendanceEntryDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string | null;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class BulkUpsertAttendanceDto {
  @IsDateString()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  records!: AttendanceEntryDto[];
}

export class ScheduleSlotAttendanceEntryDto {
  @IsUUID()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class BulkUpsertScheduleSlotAttendanceDto {
  @IsDateString()
  date!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotAttendanceEntryDto)
  records!: ScheduleSlotAttendanceEntryDto[];
}

export class SetScheduleSlotCancellationDto {
  @IsDateString()
  date!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsBoolean()
  cancelled!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

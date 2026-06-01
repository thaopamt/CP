import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@cp/shared';

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

import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ICreateCoursePayload, IReorderPayload, PublishStatus } from '@cp/shared';

export class CreateCourseDto implements ICreateCoursePayload {
  @IsString() @Length(1, 50)
  code!: string;

  @IsString() @Length(1, 255)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNumber() @Min(0)
  credits!: number;

  @IsInt() @Min(1)
  durationWeeks!: number;

  @IsString() @Length(1, 100)
  subject!: string;

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateCourseDto implements Partial<ICreateCoursePayload> {
  @IsOptional() @IsString() @Length(1, 50)
  code?: string;

  @IsOptional() @IsString() @Length(1, 255)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber() @Min(0)
  credits?: number;

  @IsOptional() @IsInt() @Min(1)
  durationWeeks?: number;

  @IsOptional() @IsString() @Length(1, 100)
  subject?: string;

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;
}

/** POST /api/courses/:courseId/assignments */
export class AttachAssignmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  assignmentIds!: string[];
}

/** PATCH /api/courses/:courseId/assignments/reorder */
export class ReorderDto implements IReorderPayload {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids!: string[];
}

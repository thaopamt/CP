import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ICreateCoursePayload, IReorderPayload, PublishStatus } from '@cp/shared';

export class CreateCourseDto implements ICreateCoursePayload {
  @IsString() @Length(1, 50)
  code!: string;

  @IsString() @Length(1, 255)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

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

import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { IReorderPayload } from '@cp/shared';

export class AttachCoursesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  courseIds!: string[];

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class ReorderClassCoursesDto implements IReorderPayload {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids!: string[];
}

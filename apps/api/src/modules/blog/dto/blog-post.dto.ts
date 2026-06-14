import { IsArray, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ICreateBlogPostPayload, IUpdateBlogPostPayload, PublishStatus } from '@cp/shared';

export class CreateBlogPostDto implements ICreateBlogPostPayload {
  @IsString()
  @Length(1, 255)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  @Length(1)
  content!: string;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateBlogPostDto implements IUpdateBlogPostPayload {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  @Length(1)
  content?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

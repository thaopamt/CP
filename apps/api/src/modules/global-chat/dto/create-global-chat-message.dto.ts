import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGlobalChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientMessageId?: string;
}

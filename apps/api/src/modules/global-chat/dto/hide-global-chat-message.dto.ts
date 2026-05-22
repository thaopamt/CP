import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HideGlobalChatMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

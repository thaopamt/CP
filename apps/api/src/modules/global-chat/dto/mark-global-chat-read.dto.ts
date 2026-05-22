import { IsUUID } from 'class-validator';

export class MarkGlobalChatReadDto {
  @IsUUID()
  lastReadMessageId!: string;
}

import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChatMessageType } from '@cp/shared';

/** Body for POST /chat/conversations */
export class StartConversationDto {
  /**
   * For teachers/admins: the student's user ID to open a thread for.
   * For students: optional (ignored — they auto-create their own thread).
   */
  @IsOptional()
  @IsUUID()
  studentUserId?: string;
}

/** Body for POST /chat/conversations/:id/messages */
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsIn(['normal', 'warning'])
  type?: ChatMessageType;
}

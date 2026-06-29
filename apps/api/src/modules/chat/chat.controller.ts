import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '@cp/shared';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ChatService } from './chat.service';
import { SendMessageDto, StartConversationDto } from './dto/chat.dto';

const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    return ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user;
  },
);

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /** List conversations visible to the caller. */
  @Get('conversations')
  getConversations(@CurrentUser() user: JwtPayload) {
    return this.chat.getConversations(user.sub, user.role);
  }

  /**
   * Get or create a conversation for a student.
   * - Students call this with no body → auto-creates their own thread.
   * - Teachers/admins call this with { studentUserId } → create thread for a student.
   */
  @Post('conversations')
  createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartConversationDto,
  ) {
    // Students always get their own thread
    const studentId =
      user.role === 'STUDENT' ? user.sub : dto.studentUserId;
    if (!studentId) {
      throw new Error('studentUserId is required for staff');
    }
    return this.chat.getOrCreateConversation(studentId);
  }

  /** Paginated message history. */
  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
  ) {
    return this.chat.getMessages(id, user.sub, user.role, Number(page) || 1);
  }

  /** Send a message. */
  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(id, user.sub, user.role, dto.content, dto.type);
  }

  /** Mark messages as read. */
  @Post('conversations/:id/read')
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chat.markAsRead(id, user.sub, user.role);
  }

  /** Total unread count (for badge). */
  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.chat.getTotalUnread(user.sub, user.role);
  }
}

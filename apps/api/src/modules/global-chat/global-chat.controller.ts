import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtPayload, UserRole } from '@cp/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGlobalChatMessageDto } from './dto/create-global-chat-message.dto';
import { HideGlobalChatMessageDto } from './dto/hide-global-chat-message.dto';
import { ListGlobalChatMessagesDto } from './dto/list-global-chat-messages.dto';
import { MarkGlobalChatReadDto } from './dto/mark-global-chat-read.dto';
import { GlobalChatGateway } from './global-chat.gateway';
import { GlobalChatService } from './global-chat.service';

@Controller('global-chat')
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
export class GlobalChatController {
  constructor(
    private readonly chat: GlobalChatService,
    private readonly gateway: GlobalChatGateway,
  ) {}

  @Get('messages')
  listMessages(@CurrentUser() user: JwtPayload, @Query() query: ListGlobalChatMessagesDto) {
    return this.chat.listMessages(user, query.limit, query.before);
  }

  @Post('messages')
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateGlobalChatMessageDto,
    @Req() req: Request,
  ) {
    const message = await this.chat.sendMessage(user, body.content, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    this.gateway.broadcastNewMessage(message, body.clientMessageId, user.sub);
    return message;
  }

  @Patch('messages/:id/hide')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async hideMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: HideGlobalChatMessageDto,
    @Req() req: Request,
  ) {
    const message = await this.chat.hideMessage(user, id, body.reason, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    this.gateway.broadcastDeleted({
      id: message.id,
      hiddenAt: message.hiddenAt ?? new Date().toISOString(),
      hiddenById: user.sub,
    });
    return message;
  }

  @Post('read')
  async markRead(@CurrentUser() user: JwtPayload, @Body() body: MarkGlobalChatReadDto) {
    const result = await this.chat.markRead(user, body.lastReadMessageId);
    await this.gateway.emitUnreadCount(user.sub);
    return result;
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.chat.getUnreadCount(user);
  }
}

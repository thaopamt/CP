import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { AuditLogEntity } from './entities/audit-log.entity';
import { GlobalChatMessageEntity } from './entities/global-chat-message.entity';
import { GlobalChatMessageReadEntity } from './entities/global-chat-message-read.entity';
import { NotificationEntity } from './entities/global-chat-notification.entity';
import { GlobalChatController } from './global-chat.controller';
import { GlobalChatGateway } from './global-chat.gateway';
import { GlobalChatService } from './global-chat.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      User,
      GlobalChatMessageEntity,
      GlobalChatMessageReadEntity,
      NotificationEntity,
      AuditLogEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') ?? '1d' },
      }),
    }),
  ],
  controllers: [GlobalChatController],
  providers: [GlobalChatService, GlobalChatGateway, ActiveUserGuard],
  exports: [GlobalChatService],
})
export class GlobalChatModule {}

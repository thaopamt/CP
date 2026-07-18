import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './quest.entity';
import { StudentQuest } from './student-quest.entity';
import { Badge } from './badge.entity';
import { StudentBadge } from './student-badge.entity';
import { QuestsService } from './quests.service';
import { BadgesService } from './badges.service';
import { LeaderboardService } from './leaderboard.service';
import { QuestAnalyticsService } from './quest-analytics.service';
import { GamificationGateway } from './gamification.gateway';
import { QuestsController } from './quests.controller';
import { StudentQuestsController } from './student-quests.controller';
import { BadgesController } from './badges.controller';
import { StudentBadgesController } from './student-badges.controller';
import { LeaderboardController } from './leaderboard.controller';
import { QuestAnalyticsController } from './quest-analytics.controller';
import { StudentProfile } from '../students/student-profile.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { LeaderboardFinalizedWeek } from './leaderboard-finalized-week.entity';
import { StudentInventory } from '../shop/student-inventory.entity';
import { ShopItem } from '../shop/shop-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quest,
      StudentQuest,
      Badge,
      StudentBadge,
      StudentProfile,
      Enrollment,
      LeaderboardFinalizedWeek,
      StudentInventory,
      ShopItem,
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
  controllers: [
    QuestsController,
    StudentQuestsController,
    BadgesController,
    StudentBadgesController,
    LeaderboardController,
    QuestAnalyticsController,
  ],
  providers: [
    QuestsService,
    BadgesService,
    LeaderboardService,
    QuestAnalyticsService,
    GamificationGateway,
  ],
  exports: [QuestsService, BadgesService, GamificationGateway, LeaderboardService],
})
export class QuestsModule {}

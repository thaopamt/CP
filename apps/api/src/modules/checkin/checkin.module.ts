import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentProfile } from '../students/student-profile.entity';
import { QuestsModule } from '../quests/quests.module';
import { DailyCheckin } from './daily-checkin.entity';
import { CheckinState } from './checkin-state.entity';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyCheckin, CheckinState, StudentProfile]),
    QuestsModule, // for GamificationGateway (level-up publish)
  ],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}

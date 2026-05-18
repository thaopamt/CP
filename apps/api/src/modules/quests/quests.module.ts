import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './quest.entity';
import { StudentQuest } from './student-quest.entity';
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';
import { StudentQuestsController } from './student-quests.controller';
import { StudentProfile } from '../students/student-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quest, StudentQuest, StudentProfile])],
  controllers: [QuestsController, StudentQuestsController],
  providers: [QuestsService],
  exports: [QuestsService],
})
export class QuestsModule {}

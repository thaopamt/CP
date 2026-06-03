import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestsModule } from '../quests/quests.module';
import { MazeLevel } from './maze-level.entity';
import { MazeSubmission } from './maze-submission.entity';
import { MazeController } from './maze.controller';
import { MazeService } from './maze.service';

@Module({
  imports: [TypeOrmModule.forFeature([MazeLevel, MazeSubmission]), QuestsModule],
  controllers: [MazeController],
  providers: [MazeService],
  exports: [MazeService],
})
export class MazeModule {}

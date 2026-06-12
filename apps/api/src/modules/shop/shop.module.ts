import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentProfile } from '../students/student-profile.entity';
import { QuestsModule } from '../quests/quests.module';
import { ShopItem } from './shop-item.entity';
import { StudentInventory } from './student-inventory.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopItem, StudentInventory, StudentProfile]),
    QuestsModule, // for BadgesService (re-evaluate XP badges after consumables)
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentProfile } from '../students/student-profile.entity';
import { User } from '../users/user.entity';
import { QuestsModule } from '../quests/quests.module';
import { ShopItem } from './shop-item.entity';
import { StudentInventory } from './student-inventory.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { ShopAdminController } from './shop-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopItem, StudentInventory, StudentProfile, User]),
    QuestsModule, // for BadgesService (re-evaluate XP badges after consumables)
  ],
  controllers: [ShopController, ShopAdminController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}

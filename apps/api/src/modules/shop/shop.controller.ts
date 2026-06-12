import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ShopService } from './shop.service';

@Controller('shop')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class ShopController {
  constructor(private readonly service: ShopService) {}

  @Get('catalog')
  async catalog(@CurrentUser() user: JwtPayload) {
    return this.service.getCatalog(user.sub);
  }

  @Get('inventory')
  async inventory(@CurrentUser() user: JwtPayload) {
    return this.service.getInventory(user.sub);
  }

  @Post('purchase/:itemId')
  async purchase(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    return this.service.purchase(user.sub, itemId);
  }

  @Post('equip/:itemId')
  async equip(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    return this.service.equip(user.sub, itemId);
  }

  @Post('unequip/:itemId')
  async unequip(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    return this.service.unequip(user.sub, itemId);
  }
}

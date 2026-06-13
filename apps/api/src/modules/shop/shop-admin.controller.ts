import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ICreateShopItemPayload, IUpdateShopItemPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShopService } from './shop.service';

/** Admin/teacher catalog management for the gem shop (incl. character positions). */
@Controller('shop-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ShopAdminController {
  constructor(private readonly service: ShopService) {}

  @Get('items')
  async list() {
    return this.service.adminList();
  }

  @Post('items')
  async create(@Body() payload: ICreateShopItemPayload) {
    return this.service.adminCreate(payload);
  }

  @Patch('items/:id')
  async update(@Param('id') id: string, @Body() patch: IUpdateShopItemPayload) {
    return this.service.adminUpdate(id, patch);
  }

  @Delete('items/:id')
  async remove(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }
}

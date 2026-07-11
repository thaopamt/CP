import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CheckinService } from './checkin.service';

@Controller('checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class CheckinController {
  constructor(private readonly service: CheckinService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.service.getMe(user.sub);
  }

  @Post()
  checkIn(@CurrentUser() user: JwtPayload) {
    return this.service.checkIn(user.sub);
  }
}

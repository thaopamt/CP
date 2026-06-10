import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BadgesService } from './badges.service';

@Controller('student-badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentBadgesController {
  constructor(private readonly service: BadgesService) {}

  /** Earned badges only (for compact widgets). */
  @Get('me')
  async getMyBadges(@CurrentUser() user: JwtPayload) {
    return this.service.getMyBadges(user.sub);
  }

  /** Full catalog with earned flags + progress (badge wall). */
  @Get('catalog')
  async getCatalog(@CurrentUser() user: JwtPayload) {
    return this.service.getCatalogWithProgress(user.sub);
  }
}

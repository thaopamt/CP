import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QuestAnalyticsService } from './quest-analytics.service';

@Controller('quest-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QuestAnalyticsController {
  constructor(private readonly service: QuestAnalyticsService) {}

  @Get('summary')
  async getSummary() {
    return this.service.getSummary();
  }
}

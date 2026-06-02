import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuestsService } from './quests.service';

@Controller('student-quests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentQuestsController {
  constructor(private readonly service: QuestsService) {}

  @Get('me')
  async getMyQuests(@CurrentUser() user: JwtPayload) {
    return this.service.getMyQuests(user.sub);
  }

  @Post('me/:studentQuestId/claim')
  async claimQuestReward(
    @CurrentUser() user: JwtPayload,
    @Param('studentQuestId') studentQuestId: string,
  ) {
    return this.service.claimReward(user.sub, studentQuestId);
  }
}

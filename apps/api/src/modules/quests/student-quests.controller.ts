import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@cp/shared';
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
  async getMyQuests(@CurrentUser() user: { id: string }) {
    return this.service.getMyQuests(user.id);
  }

  @Post('me/:studentQuestId/claim')
  async claimQuestReward(
    @CurrentUser() user: { id: string },
    @Param('studentQuestId') studentQuestId: string,
  ) {
    return this.service.claimReward(user.id, studentQuestId);
  }
}

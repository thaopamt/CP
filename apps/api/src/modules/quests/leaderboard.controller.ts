import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtPayload, LeaderboardScope, LeaderboardWindow, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  // Available to any authenticated user (students see their own rank highlighted).
  @Get()
  async getLeaderboard(
    @CurrentUser() user: JwtPayload,
    @Query('scope') scope?: LeaderboardScope,
    @Query('window') window?: LeaderboardWindow,
    @Query('classId') classId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getLeaderboard(
      { scope, window, classId, limit: limit ? parseInt(limit, 10) : undefined },
      user.sub,
    );
  }

  @Get('finalized')
  async getFinalizedWeeks() {
    return this.service.getFinalizedWeeks();
  }

  @Get('pending-reward')
  async getPendingReward(@CurrentUser() user: JwtPayload) {
    return this.service.getPendingReward(user.sub);
  }

  @Post('claim-reward')
  @Roles(UserRole.STUDENT)
  async claimReward(@CurrentUser() user: JwtPayload) {
    return this.service.claimReward(user.sub);
  }
}


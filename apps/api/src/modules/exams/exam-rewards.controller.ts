import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { ExamRewardService } from './exam-reward.service';
import { CreateRewardRuleDto, UpdateRewardRuleDto } from './dto/exam.dto';

@Controller('exams/:examId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ExamRewardsController {
  constructor(
    private readonly exams: ExamsService,
    private readonly rewards: ExamRewardService,
  ) {}

  // ── Reward rules ─────────────────────────────────────────────────────────────

  @Get('reward-rules')
  listRules(@CurrentUser() user: JwtPayload, @Param('examId') examId: string) {
    return this.exams.listRewardRules(examId, user);
  }

  @Post('reward-rules')
  createRule(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Body() dto: CreateRewardRuleDto) {
    return this.exams.createRewardRule(examId, dto, user);
  }

  @Patch('reward-rules/:ruleId')
  updateRule(
    @CurrentUser() user: JwtPayload,
    @Param('examId') examId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateRewardRuleDto,
  ) {
    return this.exams.updateRewardRule(examId, ruleId, dto, user);
  }

  @Delete('reward-rules/:ruleId')
  deleteRule(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Param('ruleId') ruleId: string) {
    return this.exams.deleteRewardRule(examId, ruleId, user).then(() => ({ ok: true }));
  }

  // ── Reward grants ────────────────────────────────────────────────────────────

  @Get('reward-grants')
  async listGrants(@CurrentUser() user: JwtPayload, @Param('examId') examId: string) {
    const exam = await this.exams.loadExamOrThrow(examId);
    this.exams.assertManager(exam, user);
    return this.rewards.listGrants(examId);
  }

  @Post('rewards/grant')
  async grant(@CurrentUser() user: JwtPayload, @Param('examId') examId: string) {
    const exam = await this.exams.loadExamOrThrow(examId);
    this.exams.assertManager(exam, user);
    return this.rewards.grantAll(examId, exam.snapshotVersion, user.sub);
  }

  @Post('reward-grants/retry')
  async retry(@CurrentUser() user: JwtPayload, @Param('examId') examId: string) {
    const exam = await this.exams.loadExamOrThrow(examId);
    this.exams.assertManager(exam, user);
    return this.rewards.retryFailed(examId, user.sub);
  }

  @Post('reward-grants/:grantId/revoke')
  async revoke(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Param('grantId') grantId: string) {
    const exam = await this.exams.loadExamOrThrow(examId);
    this.exams.assertManager(exam, user);
    return this.rewards.revokeGrant(examId, grantId, user.sub).then(() => ({ ok: true }));
  }
}

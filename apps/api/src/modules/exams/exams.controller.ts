import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExamAuditAction, ExamStatus, JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { ExamFinalizeService } from './exam-finalize.service';
import { ExamRejudgeService } from './exam-rejudge.service';
import { ExamAuditService } from './exam-audit.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ExamsController {
  constructor(
    private readonly exams: ExamsService,
    private readonly finalize: ExamFinalizeService,
    private readonly rejudge: ExamRejudgeService,
    private readonly audit: ExamAuditService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('format') format?: string,
  ) {
    return this.exams.list(
      { page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined, search, status, format },
      user,
    );
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.getOneForStaff(id, user);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExamDto) {
    return this.exams.create(dto, user);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.exams.update(id, dto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.remove(id, user).then(() => ({ ok: true }));
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  @Post(':id/publish')
  publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.publish(id, user);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.setStatus(id, ExamStatus.ARCHIVED, ExamAuditAction.ARCHIVED, user);
  }

  @Post(':id/close')
  close(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    // Manual close == force finalize (admin/owner).
    return this.finalize.finalize(id, user.sub, { force: true });
  }

  @Post(':id/freeze')
  freeze(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.setFreeze(id, true, user);
  }

  @Post(':id/unfreeze')
  unfreeze(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.setFreeze(id, false, user);
  }

  @Post(':id/finalize')
  async finalizeExam(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    const exam = await this.exams.loadExamOrThrow(id);
    this.exams.assertManager(exam, user);
    return this.finalize.finalize(id, user.sub, { force: force === 'true' });
  }

  @Post(':id/recalculate-ranking')
  async recalculate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const exam = await this.exams.loadExamOrThrow(id);
    this.exams.assertManager(exam, user);
    return this.finalize.recalculate(id, user.sub);
  }

  // ── Rejudge (post-finalize requires admin + force) ───────────────────────────

  @Post(':id/rejudge')
  async rejudgeExam(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Query('force') force?: string) {
    await this.assertRejudgeAllowed(id, user, force === 'true');
    return this.rejudge.rejudgeExam(id, user.sub);
  }

  @Post(':id/problems/:examProblemId/rejudge')
  async rejudgeProblem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('examProblemId') examProblemId: string,
    @Query('force') force?: string,
  ) {
    await this.assertRejudgeAllowed(id, user, force === 'true');
    return this.rejudge.rejudgeProblem(id, examProblemId, user.sub);
  }

  @Post(':id/submissions/:submissionId/rejudge')
  async rejudgeSubmission(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Query('force') force?: string,
  ) {
    await this.assertRejudgeAllowed(id, user, force === 'true');
    return this.rejudge.rejudgeSubmission(id, submissionId, user.sub);
  }

  private async assertRejudgeAllowed(examId: string, user: JwtPayload, force: boolean): Promise<void> {
    const exam = await this.exams.loadExamOrThrow(examId);
    this.exams.assertManager(exam, user);
    if (exam.status === ExamStatus.FINALIZED) {
      if (user.role !== UserRole.ADMIN || !force) {
        throw new ForbiddenException(
          'Rejudging a finalized exam requires admin + force=true; recalculate ranking afterwards',
        );
      }
    }
  }

  // ── Leaderboard / audit (staff: live view) ───────────────────────────────────

  @Get(':id/leaderboard')
  async leaderboard(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const exam = await this.exams.loadExamOrThrow(id);
    this.exams.assertManager(exam, user);
    return this.exams.getLeaderboard(id, user, { asStaff: true });
  }

  @Get(':id/audit')
  async auditLog(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const exam = await this.exams.loadExamOrThrow(id);
    this.exams.assertManager(exam, user);
    return this.audit.list(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { AddExamProblemDto, UpdateExamProblemDto } from './dto/exam.dto';

@Controller('exams/:examId/problems')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ExamProblemsController {
  constructor(private readonly exams: ExamsService) {}

  @Get()
  list(@Param('examId') examId: string) {
    return this.exams.listProblems(examId);
  }

  @Post()
  add(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Body() dto: AddExamProblemDto) {
    return this.exams.addProblem(examId, dto, user);
  }

  @Patch(':examProblemId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('examId') examId: string,
    @Param('examProblemId') examProblemId: string,
    @Body() dto: UpdateExamProblemDto,
  ) {
    return this.exams.updateProblem(examId, examProblemId, dto, user);
  }

  @Delete(':examProblemId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('examId') examId: string,
    @Param('examProblemId') examProblemId: string,
  ) {
    return this.exams.removeProblem(examId, examProblemId, user).then(() => ({ ok: true }));
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { ExamSubmissionService } from './exam-submission.service';
import { ExamSubmitDto } from './dto/exam.dto';

@Controller('my-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentExamsController {
  constructor(
    private readonly exams: ExamsService,
    private readonly examSubmissions: ExamSubmissionService,
  ) {}

  @Get()
  myExams(@CurrentUser() user: JwtPayload) {
    return this.exams.listMyExams(user.sub);
  }

  @Get(':id')
  takePayload(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.getStudentTakePayload(id, user.sub);
  }

  @Post(':id/join')
  join(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.join(id, user.sub);
  }

  @Get(':id/problems/:examProblemId')
  problem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('examProblemId') examProblemId: string,
  ) {
    return this.exams.getStudentProblem(id, examProblemId, user.sub);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: ExamSubmitDto) {
    return this.examSubmissions.submit(id, user.sub, dto);
  }

  @Get(':id/submissions')
  mySubmissions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.examSubmissions.listMine(id, user.sub);
  }

  @Get(':id/leaderboard')
  leaderboard(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.getLeaderboard(id, user, { asStaff: false });
  }

  @Get(':id/result')
  result(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.exams.getMyResult(id, user.sub);
  }
}

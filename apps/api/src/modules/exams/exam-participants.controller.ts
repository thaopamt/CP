import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { BanParticipantDto, InviteParticipantsDto } from './dto/exam.dto';

@Controller('exams/:examId/participants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ExamParticipantsController {
  constructor(private readonly exams: ExamsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Param('examId') examId: string) {
    return this.exams.listParticipants(examId, user);
  }

  @Post()
  invite(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Body() dto: InviteParticipantsDto) {
    return this.exams.inviteParticipants(examId, dto.userIds, user);
  }

  @Delete(':userId')
  remove(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Param('userId') userId: string) {
    return this.exams.removeParticipant(examId, userId, user).then(() => ({ ok: true }));
  }

  @Post(':userId/ban')
  ban(
    @CurrentUser() user: JwtPayload,
    @Param('examId') examId: string,
    @Param('userId') userId: string,
    @Body() dto: BanParticipantDto,
  ) {
    return this.exams.setBan(examId, userId, true, dto.reason ?? null, user).then(() => ({ ok: true }));
  }

  @Post(':userId/unban')
  unban(@CurrentUser() user: JwtPayload, @Param('examId') examId: string, @Param('userId') userId: string) {
    return this.exams.setBan(examId, userId, false, null, user).then(() => ({ ok: true }));
  }
}

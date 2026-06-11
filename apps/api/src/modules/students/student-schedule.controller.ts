import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StudentScheduleService, StudentScheduleResponse, ScheduleSessionDto } from './student-schedule.service';
import { CreateStudentScheduleDto, UpdateStudentScheduleDto } from './dto/student-schedule.dto';

/**
 * Admin-only endpoints for viewing and managing a student's schedule.
 *
 *   GET    /api/students/:id/schedule           — student-level schedule
 *   GET    /api/students/:id/schedule/custom     — custom sessions only
 *   POST   /api/students/:id/schedule/custom     — add a custom session
 *   PATCH  /api/students/:id/schedule/custom/:sessionId — update a custom session
 *   DELETE /api/students/:id/schedule/custom/:sessionId — remove one custom session
 *   DELETE /api/students/:id/schedule/custom     — clear all custom sessions (revert)
 */
@Controller('students/:id/schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class StudentScheduleController {
  constructor(private readonly service: StudentScheduleService) {}

  @Get()
  async getSchedule(
    @Param('id', ParseUUIDPipe) studentId: string,
  ): Promise<StudentScheduleResponse> {
    return this.service.getSchedule(studentId);
  }

  @Get('custom')
  async getCustomSessions(
    @Param('id', ParseUUIDPipe) studentId: string,
  ): Promise<ScheduleSessionDto[]> {
    return this.service.getCustomSessions(studentId);
  }

  @Post('custom')
  async createCustomSession(
    @Param('id', ParseUUIDPipe) studentId: string,
    @Body() dto: CreateStudentScheduleDto,
  ): Promise<ScheduleSessionDto> {
    return this.service.createCustomSession(studentId, dto);
  }

  @Patch('custom/:sessionId')
  async updateCustomSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateStudentScheduleDto,
  ): Promise<ScheduleSessionDto> {
    return this.service.updateCustomSession(sessionId, dto);
  }

  @Delete('custom/:sessionId')
  async deleteCustomSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<{ ok: true }> {
    await this.service.deleteCustomSession(sessionId);
    return { ok: true };
  }

  @Delete('custom')
  async clearAllCustom(
    @Param('id', ParseUUIDPipe) studentId: string,
  ): Promise<{ ok: true }> {
    await this.service.clearAllCustom(studentId);
    return { ok: true };
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DayOfWeek, UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import {
  BulkUpsertAttendanceDto,
  BulkUpsertScheduleSlotAttendanceDto,
  SetScheduleSlotCancellationDto,
} from './dto/attendance.dto';

/**
 * Admin-only attendance endpoints.
 *
 *   GET  /api/attendance/classes/:classId/sessions?date=  — legacy class sessions (empty)
 *   GET  /api/attendance/classes/:classId?date=           — full attendance data
 *   POST /api/attendance/classes/:classId                 — bulk upsert
 *   GET  /api/attendance/classes/:classId/summary         — stats summary
 *   GET  /api/attendance/students/:studentId              — student history
 */
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('classes/:classId/sessions')
  async getSessionsForDate(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('date') date: string,
  ) {
    const d = date || new Date().toISOString().slice(0, 10);
    return this.service.getSessionsForDate(classId, d);
  }

  @Get('custom-schedules')
  async getAllCustomSchedules() {
    return this.service.getAllCustomSchedules();
  }

  @Get('schedule-slots')
  async getScheduleSlotAttendance(
    @Query('date') date: string,
    @Query('dayOfWeek') dayOfWeek: DayOfWeek,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    const d = date || new Date().toISOString().slice(0, 10);
    return this.service.getScheduleSlotAttendance(d, dayOfWeek, startTime, endTime);
  }

  @Get('schedule-slots/summaries')
  async getScheduleSlotSummaries(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    return this.service.getScheduleSlotSummaries(from || today, to || from || today);
  }

  @Post('schedule-slots')
  async bulkUpsertScheduleSlotAttendance(
    @Body() dto: BulkUpsertScheduleSlotAttendanceDto,
    @Req() req: any,
  ) {
    const markedBy = req.user?.id ?? req.user?.sub ?? null;
    return this.service.bulkUpsertScheduleSlotAttendance(
      dto.date,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.records,
      markedBy,
    );
  }

  @Post('schedule-slots/cancel')
  async setScheduleSlotCancellation(
    @Body() dto: SetScheduleSlotCancellationDto,
    @Req() req: any,
  ) {
    const cancelledBy = req.user?.id ?? req.user?.sub ?? null;
    return this.service.setScheduleSlotCancellation(
      dto.date,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.cancelled,
      cancelledBy,
      dto.note,
    );
  }

  @Get('classes/:classId')
  async getClassDateAttendance(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('date') date: string,
  ) {
    const d = date || new Date().toISOString().slice(0, 10);
    return this.service.getClassDateAttendance(classId, d);
  }

  @Post('classes/:classId')
  async bulkUpsert(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: BulkUpsertAttendanceDto,
    @Req() req: any,
  ) {
    const markedBy = req.user?.id ?? req.user?.sub ?? null;
    return this.service.bulkUpsert(classId, dto.date, dto.records, markedBy);
  }

  @Get('classes/:classId/summary')
  async getClassSummary(
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.service.getClassSummary(classId);
  }

  @Get('students/:studentId')
  async getStudentHistory(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('classId') classId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getStudentHistory(studentId, classId, from, to);
  }
}

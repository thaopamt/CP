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
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { BulkUpsertAttendanceDto } from './dto/attendance.dto';

/**
 * Admin-only attendance endpoints.
 *
 *   GET  /api/attendance/classes/:classId/sessions?date=  — sessions on that date
 *   GET  /api/attendance/classes/:classId?date=           — full attendance data
 *   POST /api/attendance/classes/:classId                 — bulk upsert
 *   GET  /api/attendance/classes/:classId/summary         — stats summary
 *   GET  /api/attendance/students/:studentId              — student history
 */
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
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

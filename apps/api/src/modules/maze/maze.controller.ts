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
import { JwtPayload, UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MazeService } from './maze.service';
import { CreateMazeLevelDto, UpdateMazeLevelDto } from './dto/maze-level.dto';
import { SubmitMazeDto } from './dto/submit-maze.dto';

@Controller('maze-levels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MazeController {
  constructor(private readonly service: MazeService) {}

  // ── Student-facing (static paths first so they win over `:id`) ────────────

  @Get('me/assigned')
  getAssigned(@CurrentUser() user: JwtPayload) {
    return this.service.getLevelsForStudent(user.sub);
  }

  @Get('me/:id')
  getForStudent(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getLevelForStudent(user.sub, id);
  }

  @Post('submit')
  submit(@CurrentUser() user: JwtPayload, @Body() dto: SubmitMazeDto) {
    return this.service.submit(user.sub, dto);
  }

  @Get('progress/summary')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  progressSummary() {
    return this.service.getProgressSummary();
  }

  // ── Admin / shared reads ──────────────────────────────────────────────────

  @Get()
  list() {
    return this.service.listLevels();
  }

  @Get(':id/progress')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  progress(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getProgress(id);
  }

  @Get(':id/my-submissions')
  mySubmissions(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getMySubmissions(user.sub, id);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getLevel(id);
  }

  // ── Admin mutations ───────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateMazeLevelDto) {
    return this.service.createLevel(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMazeLevelDto) {
    return this.service.updateLevel(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteLevel(id);
  }
}

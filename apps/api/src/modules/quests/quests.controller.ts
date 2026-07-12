import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Quest } from './quest.entity';
import { QuestsService } from './quests.service';
import { CreateQuestDto, UpdateQuestDto } from './dto/create-quest.dto';

@Crud({
  model: { type: Quest },
  dto: { create: CreateQuestDto, update: UpdateQuestDto, replace: CreateQuestDto },
  routes: {
    only: ['getManyBase', 'getOneBase', 'createOneBase', 'deleteOneBase'],
  },
  query: {
    sort: [
      { field: 'sortOrder', order: 'ASC' },
      { field: 'createdAt', order: 'DESC' },
    ],
  },
})
@Controller('quests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class QuestsController implements CrudController<Quest> {
  constructor(public service: QuestsService) {}

  @Override('createOneBase')
  @Post()
  async createOne(@Body() dto: CreateQuestDto): Promise<Quest> {
    return this.service.createQuest(dto);
  }

  @Patch(':id')
  async updateOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateQuestDto,
  ): Promise<Quest> {
    return this.service.updateQuest(id, dto);
  }

  /** Aggregate KPI stats for the admin quest list page. */
  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  /** Lightweight option list for prerequisite/badge pickers in the admin form. */
  @Get('options/all')
  async listOptions() {
    return this.service.listOptions();
  }
}

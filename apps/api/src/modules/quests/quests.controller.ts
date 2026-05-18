import { Controller, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Quest } from './quest.entity';
import { QuestsService } from './quests.service';

@Crud({
  model: { type: Quest },
  routes: {
    only: ['getManyBase', 'getOneBase', 'createOneBase', 'updateOneBase', 'deleteOneBase'],
  },
  query: {
    sort: [{ field: 'createdAt', order: 'DESC' }],
  },
})
@Controller('quests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QuestsController implements CrudController<Quest> {
  constructor(public service: QuestsService) {}
}

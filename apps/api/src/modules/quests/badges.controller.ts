import { Controller, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Badge } from './badge.entity';
import { BadgesService } from './badges.service';
import { CreateBadgeDto, UpdateBadgeDto } from './dto/create-badge.dto';

@Crud({
  model: { type: Badge },
  dto: { create: CreateBadgeDto, update: UpdateBadgeDto, replace: CreateBadgeDto },
  routes: {
    only: ['getManyBase', 'getOneBase', 'createOneBase', 'updateOneBase', 'deleteOneBase'],
  },
  query: {
    sort: [
      { field: 'rarity', order: 'ASC' },
      { field: 'createdAt', order: 'DESC' },
    ],
  },
})
@Controller('badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class BadgesController implements CrudController<Badge> {
  constructor(public service: BadgesService) {}
}

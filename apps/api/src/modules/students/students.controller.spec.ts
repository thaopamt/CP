import 'reflect-metadata';
import { UserRole } from '@cp/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { StudentsController } from './students.controller';

describe('StudentsController.resetLearningData', () => {
  it('is admin-only and delegates to StudentsService', async () => {
    const result = {
      studentId: 'profile-1',
      userId: 'user-1',
      submissionsDeleted: 3,
      assignmentProgressDeleted: 2,
      questsDeleted: 4,
      badgesDeleted: 5,
      shopItemsDeleted: 6,
      mazeSubmissionsDeleted: 7,
      learningResetAt: '2026-07-05T03:04:05.000Z',
    };
    const service = {
      resetLearningData: jest.fn().mockResolvedValue(result),
    };
    const controller = new StudentsController(service as never, {} as never);

    await expect(controller.resetLearningData('profile-1')).resolves.toEqual(result);
    expect(service.resetLearningData).toHaveBeenCalledWith('profile-1');
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.resetLearningData)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});

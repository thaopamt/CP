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
    const controller = new StudentsController(service as never, {} as never, {} as never);

    await expect(controller.resetLearningData('profile-1')).resolves.toEqual(result);
    expect(service.resetLearningData).toHaveBeenCalledWith('profile-1');
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.resetLearningData)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});

describe('StudentsController.blockStudent', () => {
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
      learningResetAt: '2026-07-12T03:04:05.000Z',
      blockedAt: '2026-07-12T03:04:05.000Z',
      isActive: false,
      alreadyBlocked: false,
    };
    const service = {
      resetLearningData: jest.fn(),
      blockStudent: jest.fn().mockResolvedValue(result),
      unblockStudent: jest.fn(),
    };
    const controller = new StudentsController(service as never, {} as never, {} as never);

    await expect(controller.blockStudent('profile-1')).resolves.toEqual(result);
    expect(service.blockStudent).toHaveBeenCalledWith('profile-1', undefined);
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.blockStudent)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});

describe('StudentsController.unblockStudent', () => {
  it('is admin-only and delegates to StudentsService', async () => {
    const result = {
      studentId: 'profile-1',
      userId: 'user-1',
      unblockedAt: '2026-07-12T03:04:05.000Z',
      isActive: true,
    };
    const service = {
      resetLearningData: jest.fn(),
      blockStudent: jest.fn(),
      unblockStudent: jest.fn().mockResolvedValue(result),
    };
    const controller = new StudentsController(service as never, {} as never, {} as never);

    await expect(controller.unblockStudent('profile-1')).resolves.toEqual(result);
    expect(service.unblockStudent).toHaveBeenCalledWith('profile-1');
    expect(Reflect.getMetadata(ROLES_KEY, StudentsController.prototype.unblockStudent)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});

describe('StudentsController.impersonate', () => {
  it('resolves the profile then mints an impersonation token for its user', async () => {
    const service = {
      getProfileById: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }),
    } as any;
    const auth = {
      generateImpersonationToken: jest.fn().mockResolvedValue({ accessToken: 'tok', user: { id: 'u1' } }),
    } as any;
    const controller = new StudentsController(service, {} as any, auth);

    const result = await controller.impersonate('p1', { sub: 'admin-1' } as any);

    expect(service.getProfileById).toHaveBeenCalledWith('p1');
    expect(auth.generateImpersonationToken).toHaveBeenCalledWith('u1', 'admin-1');
    expect(result).toEqual({ accessToken: 'tok', user: { id: 'u1' } });
  });
});

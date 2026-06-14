import 'reflect-metadata';
import { PublishStatus, UserRole } from '@cp/shared';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { BlogController } from './blog.controller';

describe('BlogController', () => {
  it('locks manage and mutation endpoints to admins and teachers', () => {
    const expected = [UserRole.ADMIN, UserRole.TEACHER];

    expect(Reflect.getMetadata(ROLES_KEY, BlogController.prototype.listManage)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, BlogController.prototype.getManageById)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, BlogController.prototype.createPost)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, BlogController.prototype.updatePost)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, BlogController.prototype.deletePost)).toEqual(expected);
    expect(Reflect.getMetadata(ROLES_KEY, BlogController.prototype.listPublished)).toBeUndefined();
  });

  it('passes the JWT subject as the author when creating a post', async () => {
    const service = {
      createPost: jest.fn().mockResolvedValue({ id: 'post-1' }),
    };
    const controller = new BlogController(service as never);

    await controller.createPost(
      { sub: 'teacher-1', email: 'teacher@example.com', role: UserRole.TEACHER },
      { title: 'News', content: 'Body', status: PublishStatus.DRAFT },
    );

    expect(service.createPost).toHaveBeenCalledWith('teacher-1', {
      title: 'News',
      content: 'Body',
      status: PublishStatus.DRAFT,
    });
  });
});

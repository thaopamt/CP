import { StudentsController } from './students.controller';

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

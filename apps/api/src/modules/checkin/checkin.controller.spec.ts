import { CheckinController } from './checkin.controller';

describe('CheckinController', () => {
  const status = { today: '2026-07-11', currentStreak: 1 } as never;
  const result = { reward: { gems: 5, xp: 20 } } as never;
  const user = { sub: 'u1', role: 'STUDENT' } as never;

  function make() {
    const service = {
      getMe: jest.fn().mockResolvedValue(status),
      checkIn: jest.fn().mockResolvedValue(result),
    };
    return { controller: new CheckinController(service as never), service };
  }

  it('GET /checkin/me delegates to service.getMe with the caller id', async () => {
    const { controller, service } = make();
    await expect(controller.me(user)).resolves.toBe(status);
    expect(service.getMe).toHaveBeenCalledWith('u1');
  });

  it('POST /checkin delegates to service.checkIn with the caller id', async () => {
    const { controller, service } = make();
    await expect(controller.checkIn(user)).resolves.toBe(result);
    expect(service.checkIn).toHaveBeenCalledWith('u1');
  });
});

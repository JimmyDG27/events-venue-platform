import { Test, TestingModule } from '@nestjs/testing';
import { ViewingStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { ViewingsController } from './viewings.controller';
import { ViewingsService } from './viewings.service';

const mockUser: AuthenticatedUser = {
  id: 'user-1111-1111-1111-111111111111',
  name: 'Alice',
  email: 'alice@test.com',
  emailVerified: true,
};
const VENUE_ID = '22222222-2222-2222-2222-222222222222';
const VIEWING_ID = '33333333-3333-3333-3333-333333333333';
const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

describe('ViewingsController', () => {
  let controller: ViewingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewingsController],
      providers: [{ provide: ViewingsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ViewingsController>(ViewingsController);
    jest.clearAllMocks();
  });

  it('create delegates to service with user.id and dto', async () => {
    const dto = { venueId: VENUE_ID, scheduledAt: FUTURE_DATE };
    mockService.create.mockResolvedValue({ id: VIEWING_ID, status: ViewingStatus.Scheduled });
    await controller.create(mockUser, dto);
    expect(mockService.create).toHaveBeenCalledWith(mockUser.id, dto);
  });

  it('findAll delegates to service with user.id and query', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    await controller.findAll(mockUser, { filter: 'all' });
    expect(mockService.findAll).toHaveBeenCalledWith(mockUser.id, { filter: 'all' });
  });

  it('update delegates to service with user.id, id, and dto', async () => {
    const dto = { status: ViewingStatus.Cancelled };
    mockService.update.mockResolvedValue({ id: VIEWING_ID, status: ViewingStatus.Cancelled });
    await controller.update(mockUser, VIEWING_ID, dto);
    expect(mockService.update).toHaveBeenCalledWith(mockUser.id, VIEWING_ID, dto);
  });
});

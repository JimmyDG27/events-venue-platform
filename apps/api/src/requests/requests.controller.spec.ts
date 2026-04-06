import { Test, TestingModule } from '@nestjs/testing';
import { RequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

const mockUser: AuthenticatedUser = {
  id: 'user-uuid-1111',
  name: 'Alice',
  email: 'alice@test.com',
  emailVerified: true,
};

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
};

describe('RequestsController', () => {
  let controller: RequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RequestsController>(RequestsController);
    jest.clearAllMocks();
  });

  it('create delegates to service with user.id', async () => {
    mockService.create.mockResolvedValue({ id: 'req-1' });
    const dto = {
      venueId: '11111111-1111-1111-1111-111111111111',
      dateFrom: new Date('2026-06-01'),
      dateTo: new Date('2026-06-02'),
      guests: 50,
      eventType: 'wedding',
    };
    await controller.create(mockUser, dto);
    expect(mockService.create).toHaveBeenCalledWith(mockUser.id, dto);
  });

  it('findAll delegates to service with user.id and query', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: {} });
    const query = { page: 1, limit: 20 };
    await controller.findAll(mockUser, query);
    expect(mockService.findAll).toHaveBeenCalledWith(mockUser.id, query);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 'req-1' });
    await controller.findOne(mockUser, 'req-1');
    expect(mockService.findOne).toHaveBeenCalledWith(mockUser.id, 'req-1');
  });

  it('updateStatus delegates to service', async () => {
    mockService.updateStatus.mockResolvedValue({ status: RequestStatus.Cancelled });
    await controller.updateStatus(mockUser, 'req-1', { status: RequestStatus.Cancelled });
    expect(mockService.updateStatus).toHaveBeenCalledWith(mockUser.id, 'req-1', {
      status: RequestStatus.Cancelled,
    });
  });
});

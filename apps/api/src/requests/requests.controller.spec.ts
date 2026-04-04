import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestStatus } from '@prisma/client';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

const USER_ID = 'user-uuid-1111';
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
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
    jest.clearAllMocks();
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue({ id: 'req-1' });
    const dto = {
      venueId: '11111111-1111-1111-1111-111111111111',
      dateFrom: new Date('2026-06-01'),
      dateTo: new Date('2026-06-02'),
      guests: 50,
      eventType: 'wedding',
    };
    await controller.create(USER_ID, dto);
    expect(mockService.create).toHaveBeenCalledWith(USER_ID, dto);
  });

  it('create throws UnauthorizedException with no user id', () => {
    expect(() => controller.create(undefined, {} as any)).toThrow(
      UnauthorizedException,
    );
  });

  it('findAll delegates to service with userId and query', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: {} });
    const query = { page: 1, limit: 20 };
    await controller.findAll(USER_ID, query);
    expect(mockService.findAll).toHaveBeenCalledWith(USER_ID, query);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue({ id: 'req-1' });
    await controller.findOne(USER_ID, 'req-1');
    expect(mockService.findOne).toHaveBeenCalledWith(USER_ID, 'req-1');
  });

  it('updateStatus delegates to service', async () => {
    mockService.updateStatus.mockResolvedValue({ status: RequestStatus.Cancelled });
    await controller.updateStatus(USER_ID, 'req-1', { status: RequestStatus.Cancelled });
    expect(mockService.updateStatus).toHaveBeenCalledWith(USER_ID, 'req-1', {
      status: RequestStatus.Cancelled,
    });
  });

  it('updateStatus throws UnauthorizedException with no user id', () => {
    expect(() =>
      controller.updateStatus(undefined, 'req-1', { status: RequestStatus.Cancelled }),
    ).toThrow(UnauthorizedException);
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ViewingStatus } from '@prisma/client';
import { ViewingsController } from './viewings.controller';
import { ViewingsService } from './viewings.service';

const USER_ID = 'user-1111-1111-1111-111111111111';
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
    }).compile();

    controller = module.get<ViewingsController>(ViewingsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { venueId: VENUE_ID, scheduledAt: FUTURE_DATE };

    it('delegates to service with userId and dto', async () => {
      mockService.create.mockResolvedValue({ id: VIEWING_ID, status: ViewingStatus.Scheduled });
      await controller.create(USER_ID, dto);
      expect(mockService.create).toHaveBeenCalledWith(USER_ID, dto);
    });

    it('throws UnauthorizedException when x-user-id header is missing', () => {
      expect(() => controller.create(undefined, dto)).toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('delegates to service with userId and query', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
      await controller.findAll(USER_ID, { filter: 'all' });
      expect(mockService.findAll).toHaveBeenCalledWith(USER_ID, { filter: 'all' });
    });

    it('throws UnauthorizedException when x-user-id header is missing', () => {
      expect(() => controller.findAll(undefined, { filter: 'all' })).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    const dto = { status: ViewingStatus.Cancelled };

    it('delegates to service with userId, id, and dto', async () => {
      mockService.update.mockResolvedValue({ id: VIEWING_ID, status: ViewingStatus.Cancelled });
      await controller.update(USER_ID, VIEWING_ID, dto);
      expect(mockService.update).toHaveBeenCalledWith(USER_ID, VIEWING_ID, dto);
    });

    it('throws UnauthorizedException when x-user-id header is missing', () => {
      expect(() => controller.update(undefined, VIEWING_ID, dto)).toThrow(UnauthorizedException);
    });
  });
});

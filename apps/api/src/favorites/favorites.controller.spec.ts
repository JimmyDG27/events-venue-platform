import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

const USER_ID = 'user-1111-1111-1111-111111111111';
const VENUE_ID = '22222222-2222-2222-2222-222222222222';

const mockService = {
  add: jest.fn(),
  remove: jest.fn(),
  findAll: jest.fn(),
};

describe('FavoritesController', () => {
  let controller: FavoritesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: mockService }],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('delegates to service with userId and venueId', async () => {
      mockService.add.mockResolvedValue({ id: 'fav-1', venueId: VENUE_ID });
      await controller.add(USER_ID, VENUE_ID);
      expect(mockService.add).toHaveBeenCalledWith(USER_ID, VENUE_ID);
    });

    it('throws UnauthorizedException when x-user-id header is missing', () => {
      expect(() => controller.add(undefined, VENUE_ID)).toThrow(UnauthorizedException);
    });
  });

  describe('remove', () => {
    it('delegates to service with userId and venueId', async () => {
      mockService.remove.mockResolvedValue(undefined);
      await controller.remove(USER_ID, VENUE_ID);
      expect(mockService.remove).toHaveBeenCalledWith(USER_ID, VENUE_ID);
    });

    it('throws UnauthorizedException when x-user-id header is missing', () => {
      expect(() => controller.remove(undefined, VENUE_ID)).toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('delegates to service with userId', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
      await controller.findAll(USER_ID);
      expect(mockService.findAll).toHaveBeenCalledWith(USER_ID);
    });

    it('throws UnauthorizedException when x-user-id header is missing', () => {
      expect(() => controller.findAll(undefined)).toThrow(UnauthorizedException);
    });
  });
});

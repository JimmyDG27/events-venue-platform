import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { FavoritesService } from './favorites.service';

const USER_ID = 'user-1111-1111-1111-111111111111';
const VENUE_ID = 'venue-2222-2222-2222-222222222222';
const mockVenue = { id: VENUE_ID, name: 'The Loft' };
const mockFavorite = { id: 'fav-1', userId: USER_ID, venueId: VENUE_ID, createdAt: new Date(), venue: mockVenue };

const mockPrisma = {
  venue: { findUnique: jest.fn() },
  favorite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('creates a favourite when venue exists', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await service.add(USER_ID, VENUE_ID);
      expect(result.venueId).toBe(VENUE_ID);
      expect(mockPrisma.favorite.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: USER_ID, venueId: VENUE_ID } }),
      );
    });

    it('throws NotFoundException when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);
      await expect(service.add(USER_ID, VENUE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a favourite when it exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      mockPrisma.favorite.delete.mockResolvedValue(mockFavorite);

      await service.remove(USER_ID, VENUE_ID);
      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
        where: { userId_venueId: { userId: USER_ID, venueId: VENUE_ID } },
      });
    });

    it('throws NotFoundException when favourite does not exist', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      await expect(service.remove(USER_ID, VENUE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all favourites for the user', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([mockFavorite]);
      const result = await service.findAll(USER_ID);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });
  });
});

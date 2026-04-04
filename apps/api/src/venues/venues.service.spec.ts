import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VenuesService } from './venues.service';
import { PrismaService } from '@/prisma/prisma.service';

const venue = (overrides = {}) => ({
  id: '11111111-1111-1111-1111-111111111111',
  name: 'The Loft',
  description: 'An industrial loft space',
  location: 'Shoreditch, London',
  capacity: 150,
  styles: ['industrial', 'rooftop'],
  pricing: { currency: 'GBP', pricePerDay: 2000, pricePerHour: 300 },
  photos: [],
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

const mockPrisma = {
  venue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

describe('VenuesService', () => {
  let service: VenuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const defaultQuery = {
      sort: 'newest' as const,
      page: 1,
      limit: 20,
    };

    it('returns paginated results', async () => {
      mockPrisma.venue.findMany.mockResolvedValue([venue()]);
      mockPrisma.venue.count.mockResolvedValue(1);

      const result = await service.findAll(defaultQuery);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, pages: 1 });
    });

    it('applies capacity filter', async () => {
      mockPrisma.venue.findMany.mockResolvedValue([]);
      mockPrisma.venue.count.mockResolvedValue(0);

      await service.findAll({ ...defaultQuery, capacity: 100 });

      expect(mockPrisma.venue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ capacity: { gte: 100 } }),
        }),
      );
    });

    it('applies location filter (case-insensitive)', async () => {
      mockPrisma.venue.findMany.mockResolvedValue([]);
      mockPrisma.venue.count.mockResolvedValue(0);

      await service.findAll({ ...defaultQuery, location: 'shoreditch' });

      expect(mockPrisma.venue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: { contains: 'shoreditch', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('filters by budget range in memory', async () => {
      const cheap = venue({ pricing: { currency: 'GBP', pricePerDay: 500 } });
      const expensive = venue({
        id: '22222222-2222-2222-2222-222222222222',
        pricing: { currency: 'GBP', pricePerDay: 5000 },
      });
      mockPrisma.venue.findMany.mockResolvedValue([cheap, expensive]);
      mockPrisma.venue.count.mockResolvedValue(2);

      const result = await service.findAll({
        ...defaultQuery,
        budgetMax: 1000,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(cheap.id);
    });

    it('sorts by price ascending in memory', async () => {
      const v1 = venue({ id: 'aaaa-1', pricing: { currency: 'GBP', pricePerDay: 3000 } });
      const v2 = venue({ id: 'aaaa-2', pricing: { currency: 'GBP', pricePerDay: 1000 } });
      mockPrisma.venue.findMany.mockResolvedValue([v1, v2]);
      mockPrisma.venue.count.mockResolvedValue(2);

      const result = await service.findAll({ ...defaultQuery, sort: 'price_asc' });

      expect(result.data[0].id).toBe(v2.id);
      expect(result.data[1].id).toBe(v1.id);
    });
  });

  describe('findOne', () => {
    it('returns a venue by id', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(venue());
      const result = await service.findOne('11111111-1111-1111-1111-111111111111');
      expect(result.name).toBe('The Loft');
    });

    it('throws NotFoundException when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPhoto', () => {
    it('appends the photo URL to the venue photos array', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(venue({ photos: ['existing.jpg'] }));
      mockPrisma.venue.update.mockResolvedValue(
        venue({ photos: ['existing.jpg', 'new.jpg'] }),
      );

      const result = await service.addPhoto(
        '11111111-1111-1111-1111-111111111111',
        'new.jpg',
      );
      expect(result.photos).toContain('new.jpg');
      expect(mockPrisma.venue.update).toHaveBeenCalledWith({
        where: { id: '11111111-1111-1111-1111-111111111111' },
        data: { photos: ['existing.jpg', 'new.jpg'] },
      });
    });
  });
});

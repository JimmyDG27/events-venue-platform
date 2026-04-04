import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ViewingStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ViewingsService } from './viewings.service';

const USER_ID = 'user-1111-1111-1111-111111111111';
const VENUE_ID = 'venue-2222-2222-2222-222222222222';
const VIEWING_ID = 'view-3333-3333-3333-333333333333';
const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

const mockVenue = { id: VENUE_ID, name: 'The Loft' };
const mockViewing = (overrides = {}) => ({
  id: VIEWING_ID,
  userId: USER_ID,
  venueId: VENUE_ID,
  scheduledAt: FUTURE_DATE,
  status: ViewingStatus.Scheduled,
  createdAt: new Date(),
  venue: mockVenue,
  ...overrides,
});

const mockPrisma = {
  venue: { findUnique: jest.fn() },
  viewing: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('ViewingsService', () => {
  let service: ViewingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ViewingsService>(ViewingsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { venueId: VENUE_ID, scheduledAt: FUTURE_DATE };

    it('creates a viewing with Scheduled status', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrisma.viewing.create.mockResolvedValue(mockViewing());

      const result = await service.create(USER_ID, dto);
      expect(result.status).toBe(ViewingStatus.Scheduled);
      expect(mockPrisma.viewing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ViewingStatus.Scheduled, userId: USER_ID }),
        }),
      );
    });

    it('throws NotFoundException when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);
      await expect(service.create(USER_ID, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all viewings when filter is "all"', async () => {
      mockPrisma.viewing.findMany.mockResolvedValue([mockViewing()]);
      const result = await service.findAll(USER_ID, { filter: 'all' });
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.viewing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });

    it('filters upcoming viewings by future date and Scheduled status', async () => {
      mockPrisma.viewing.findMany.mockResolvedValue([mockViewing()]);
      await service.findAll(USER_ID, { filter: 'upcoming' });
      expect(mockPrisma.viewing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ViewingStatus.Scheduled,
            scheduledAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates scheduledAt on an owned viewing', async () => {
      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      mockPrisma.viewing.findFirst.mockResolvedValue(mockViewing());
      mockPrisma.viewing.update.mockResolvedValue(mockViewing({ scheduledAt: newDate }));

      const result = await service.update(USER_ID, VIEWING_ID, { scheduledAt: newDate });
      expect(result.scheduledAt).toEqual(newDate);
    });

    it('cancels a viewing', async () => {
      mockPrisma.viewing.findFirst.mockResolvedValue(mockViewing());
      mockPrisma.viewing.update.mockResolvedValue(
        mockViewing({ status: ViewingStatus.Cancelled }),
      );

      const result = await service.update(USER_ID, VIEWING_ID, {
        status: ViewingStatus.Cancelled,
      });
      expect(result.status).toBe(ViewingStatus.Cancelled);
    });

    it('throws NotFoundException when viewing not found or not owned', async () => {
      mockPrisma.viewing.findFirst.mockResolvedValue(null);
      await expect(
        service.update(USER_ID, VIEWING_ID, { status: ViewingStatus.Cancelled }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when trying to update a cancelled viewing', async () => {
      mockPrisma.viewing.findFirst.mockResolvedValue(
        mockViewing({ status: ViewingStatus.Cancelled }),
      );
      await expect(
        service.update(USER_ID, VIEWING_ID, { scheduledAt: FUTURE_DATE }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RequestsService } from './requests.service';

const USER_ID = 'user-uuid-1111-1111-1111-111111111111';
const VENUE_ID = 'venue-uuid-2222-2222-2222-222222222222';
const REQ_ID = 'req-uuid-3333-3333-3333-333333333333';

const mockVenue = { id: VENUE_ID, name: 'The Loft', capacity: 150 };
const mockRequest = (overrides = {}) => ({
  id: REQ_ID,
  userId: USER_ID,
  venueId: VENUE_ID,
  dateFrom: new Date('2026-06-01'),
  dateTo: new Date('2026-06-02'),
  guests: 100,
  eventType: 'corporate',
  message: null,
  status: RequestStatus.Active,
  createdAt: new Date('2026-04-01'),
  venue: mockVenue,
  ...overrides,
});

const dto = {
  venueId: VENUE_ID,
  dateFrom: new Date('2026-06-01'),
  dateTo: new Date('2026-06-02'),
  guests: 100,
  eventType: 'corporate',
};

const mockPrisma = {
  venue: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  availabilityRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

const mockEvents = { emit: jest.fn() };

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a request when guests ≤ capacity', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Alice', email: 'alice@test.com' });
      mockPrisma.availabilityRequest.create.mockResolvedValue(mockRequest());

      const result = await service.create(USER_ID, dto);
      expect(result.status).toBe(RequestStatus.Active);
      expect(mockPrisma.availabilityRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: USER_ID, status: RequestStatus.Active }),
        }),
      );
    });

    it('throws BadRequestException when guests exceed capacity', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue({ ...mockVenue, capacity: 50 });
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Alice', email: 'alice@test.com' });

      await expect(service.create(USER_ID, { ...dto, guests: 100 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Alice', email: 'alice@test.com' });
      await expect(service.create(USER_ID, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const query = { page: 1, limit: 20 };

    it('returns paginated results filtered by userId', async () => {
      mockPrisma.availabilityRequest.findMany.mockResolvedValue([mockRequest()]);
      mockPrisma.availabilityRequest.count.mockResolvedValue(1);

      const result = await service.findAll(USER_ID, query);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, pages: 1 });
      expect(mockPrisma.availabilityRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });

    it('applies status filter when provided', async () => {
      mockPrisma.availabilityRequest.findMany.mockResolvedValue([]);
      mockPrisma.availabilityRequest.count.mockResolvedValue(0);

      await service.findAll(USER_ID, { ...query, status: RequestStatus.Cancelled });

      expect(mockPrisma.availabilityRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, status: RequestStatus.Cancelled },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the request when owned by user', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(mockRequest());
      const result = await service.findOne(USER_ID, REQ_ID);
      expect(result.id).toBe(REQ_ID);
    });

    it('throws NotFoundException when not found or not owned', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(null);
      await expect(service.findOne(USER_ID, REQ_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates the status of an owned request', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(mockRequest());
      mockPrisma.availabilityRequest.update.mockResolvedValue(
        mockRequest({ status: RequestStatus.Cancelled }),
      );
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'Alice', email: 'alice@test.com' });

      const result = await service.updateStatus(USER_ID, REQ_ID, {
        status: RequestStatus.Cancelled,
      });
      expect(result.status).toBe(RequestStatus.Cancelled);
    });

    it('throws NotFoundException when request does not belong to user', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(null);
      await expect(
        service.updateStatus(USER_ID, REQ_ID, { status: RequestStatus.Cancelled }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

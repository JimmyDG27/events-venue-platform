import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '@/storage/storage.service';
import { VenuesController } from '@/venues/venues.controller';
import { VenuesService } from '@/venues/venues.service';

const VENUE_ID = '11111111-1111-1111-1111-111111111111';

const mockVenue = {
  id: VENUE_ID,
  name: 'The Loft',
  description: 'A modern event space.',
  location: 'Shoreditch, London',
  capacity: 200,
  styles: ['industrial', 'modern'],
  pricing: { currency: 'GBP', pricePerDay: 3000 },
  photos: [],
  createdAt: new Date(),
};

const mockPrisma = {
  venue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
};

const mockStorage = { upload: jest.fn() };

describe('Venues (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [
        VenuesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('') } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /venues', () => {
    it('returns a paginated list of venues', async () => {
      mockPrisma.venue.findMany.mockResolvedValue([mockVenue]);
      mockPrisma.venue.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get('/venues').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('accepts valid query parameters', async () => {
      mockPrisma.venue.findMany.mockResolvedValue([mockVenue]);
      mockPrisma.venue.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get('/venues?capacity=100&page=1&limit=10')
        .expect(200);

      expect(mockPrisma.venue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ capacity: { gte: 100 } }),
        }),
      );
    });

    it('returns 400 on invalid query param', async () => {
      await request(app.getHttpServer())
        .get('/venues?capacity=notanumber')
        .expect(400);
    });
  });

  describe('GET /venues/:id', () => {
    it('returns 200 with venue detail', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      const res = await request(app.getHttpServer()).get(`/venues/${VENUE_ID}`).expect(200);
      expect(res.body.id).toBe(VENUE_ID);
    });

    it('returns 404 when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);
      await request(app.getHttpServer()).get(`/venues/${VENUE_ID}`).expect(404);
    });

    it('returns 400 for non-UUID id', async () => {
      await request(app.getHttpServer()).get('/venues/not-a-uuid').expect(400);
    });
  });
});

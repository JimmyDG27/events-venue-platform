import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as request from 'supertest';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { PrismaService } from '@/prisma/prisma.service';
import { FavoritesController } from '@/favorites/favorites.controller';
import { FavoritesService } from '@/favorites/favorites.service';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const VENUE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const mockVenue = { id: VENUE_ID, name: 'The Loft', location: 'Shoreditch' };
const mockFavorite = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  userId: USER_ID,
  venueId: VENUE_ID,
  createdAt: new Date(),
  venue: mockVenue,
};

const mockPrisma = {
  venue: { findUnique: jest.fn() },
  favorite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('Favorites (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
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

  describe('POST /favorites/:venueId', () => {
    it('creates a favorite and returns 201', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrisma.favorite.create.mockResolvedValue(mockFavorite);

      const res = await request(app.getHttpServer())
        .post(`/favorites/${VENUE_ID}`)
        .set('x-user-id', USER_ID)
        .expect(201);

      expect(res.body.venueId).toBe(VENUE_ID);
    });

    it('returns 409 on duplicate favorite (P2002)', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['userId', 'venueId'] },
      });
      mockPrisma.favorite.create.mockRejectedValue(prismaError);

      await request(app.getHttpServer())
        .post(`/favorites/${VENUE_ID}`)
        .set('x-user-id', USER_ID)
        .expect(409);
    });

    it('returns 404 when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(`/favorites/${VENUE_ID}`)
        .set('x-user-id', USER_ID)
        .expect(404);
    });

    it('returns 401 when x-user-id header is missing', async () => {
      await request(app.getHttpServer()).post(`/favorites/${VENUE_ID}`).expect(401);
    });

    it('returns 400 for non-UUID venueId', async () => {
      await request(app.getHttpServer())
        .post('/favorites/not-a-uuid')
        .set('x-user-id', USER_ID)
        .expect(400);
    });
  });

  describe('DELETE /favorites/:venueId', () => {
    it('returns 204 on successful removal', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      mockPrisma.favorite.delete.mockResolvedValue(mockFavorite);

      await request(app.getHttpServer())
        .delete(`/favorites/${VENUE_ID}`)
        .set('x-user-id', USER_ID)
        .expect(204);
    });

    it('returns 404 when favorite does not exist', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/favorites/${VENUE_ID}`)
        .set('x-user-id', USER_ID)
        .expect(404);
    });

    it('returns 401 when x-user-id header is missing', async () => {
      await request(app.getHttpServer()).delete(`/favorites/${VENUE_ID}`).expect(401);
    });
  });

  describe('GET /favorites', () => {
    it('returns list of user favorites', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([mockFavorite]);

      const res = await request(app.getHttpServer())
        .get('/favorites')
        .set('x-user-id', USER_ID)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('returns empty list when user has no favorites', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/favorites')
        .set('x-user-id', USER_ID)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('returns 401 when x-user-id is missing', async () => {
      await request(app.getHttpServer()).get('/favorites').expect(401);
    });
  });
});

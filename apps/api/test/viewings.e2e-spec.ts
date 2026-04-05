import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ViewingStatus } from '@prisma/client';
import * as request from 'supertest';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ViewingsController } from '@/viewings/viewings.controller';
import { ViewingsService } from '@/viewings/viewings.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn().mockResolvedValue({}) } })),
}));

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const VENUE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const VIEWING_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const FUTURE_ISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const mockVenue = { id: VENUE_ID, name: 'The Loft', location: 'Shoreditch' };
const mockUser = { id: USER_ID, name: 'Alice', email: 'alice@test.com' };
const mockViewing = (overrides = {}) => ({
  id: VIEWING_ID,
  userId: USER_ID,
  venueId: VENUE_ID,
  scheduledAt: new Date(FUTURE_ISO),
  status: ViewingStatus.Scheduled,
  createdAt: new Date(),
  venue: mockVenue,
  ...overrides,
});

const mockPrisma = {
  venue: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  viewing: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('Viewings (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      controllers: [ViewingsController],
      providers: [
        ViewingsService,
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
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
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('POST /viewings', () => {
    it('creates a viewing and returns 201', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrisma.viewing.create.mockResolvedValue(mockViewing());

      const res = await request(app.getHttpServer())
        .post('/viewings')
        .set('x-user-id', USER_ID)
        .send({ venueId: VENUE_ID, scheduledAt: FUTURE_ISO })
        .expect(201);

      expect(res.body.status).toBe(ViewingStatus.Scheduled);
    });

    it('returns 404 when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/viewings')
        .set('x-user-id', USER_ID)
        .send({ venueId: VENUE_ID, scheduledAt: FUTURE_ISO })
        .expect(404);
    });

    it('returns 400 when scheduledAt is in the past', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      await request(app.getHttpServer())
        .post('/viewings')
        .set('x-user-id', USER_ID)
        .send({ venueId: VENUE_ID, scheduledAt: pastDate })
        .expect(400);
    });

    it('returns 401 when x-user-id header is missing', async () => {
      await request(app.getHttpServer())
        .post('/viewings')
        .send({ venueId: VENUE_ID, scheduledAt: FUTURE_ISO })
        .expect(401);
    });

    it('returns 400 when venueId is not a UUID', async () => {
      await request(app.getHttpServer())
        .post('/viewings')
        .set('x-user-id', USER_ID)
        .send({ venueId: 'not-a-uuid', scheduledAt: FUTURE_ISO })
        .expect(400);
    });
  });

  describe('GET /viewings', () => {
    it('returns viewings for the user', async () => {
      mockPrisma.viewing.findMany.mockResolvedValue([mockViewing()]);

      const res = await request(app.getHttpServer())
        .get('/viewings')
        .set('x-user-id', USER_ID)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('accepts filter=upcoming query param', async () => {
      mockPrisma.viewing.findMany.mockResolvedValue([mockViewing()]);

      await request(app.getHttpServer())
        .get('/viewings?filter=upcoming')
        .set('x-user-id', USER_ID)
        .expect(200);

      expect(mockPrisma.viewing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ViewingStatus.Scheduled }),
        }),
      );
    });

    it('returns 400 for invalid filter value', async () => {
      await request(app.getHttpServer())
        .get('/viewings?filter=invalid')
        .set('x-user-id', USER_ID)
        .expect(400);
    });

    it('returns 401 when x-user-id is missing', async () => {
      await request(app.getHttpServer()).get('/viewings').expect(401);
    });
  });

  describe('PATCH /viewings/:id', () => {
    it('cancels a viewing', async () => {
      mockPrisma.viewing.findFirst.mockResolvedValue(mockViewing());
      mockPrisma.viewing.update.mockResolvedValue(
        mockViewing({ status: ViewingStatus.Cancelled }),
      );

      const res = await request(app.getHttpServer())
        .patch(`/viewings/${VIEWING_ID}`)
        .set('x-user-id', USER_ID)
        .send({ status: ViewingStatus.Cancelled })
        .expect(200);

      expect(res.body.status).toBe(ViewingStatus.Cancelled);
    });

    it('returns 404 when viewing not found or not owned', async () => {
      mockPrisma.viewing.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/viewings/${VIEWING_ID}`)
        .set('x-user-id', USER_ID)
        .send({ status: ViewingStatus.Cancelled })
        .expect(404);
    });

    it('returns 400 when trying to update a cancelled viewing', async () => {
      mockPrisma.viewing.findFirst.mockResolvedValue(
        mockViewing({ status: ViewingStatus.Cancelled }),
      );

      await request(app.getHttpServer())
        .patch(`/viewings/${VIEWING_ID}`)
        .set('x-user-id', USER_ID)
        .send({ status: ViewingStatus.Completed })
        .expect(400);
    });

    it('returns 400 when no fields are provided', async () => {
      await request(app.getHttpServer())
        .patch(`/viewings/${VIEWING_ID}`)
        .set('x-user-id', USER_ID)
        .send({})
        .expect(400);
    });

    it('returns 400 for non-UUID viewing id', async () => {
      await request(app.getHttpServer())
        .patch('/viewings/not-a-uuid')
        .set('x-user-id', USER_ID)
        .send({ status: ViewingStatus.Cancelled })
        .expect(400);
    });

    it('returns 401 when x-user-id is missing', async () => {
      await request(app.getHttpServer())
        .patch(`/viewings/${VIEWING_ID}`)
        .send({ status: ViewingStatus.Cancelled })
        .expect(401);
    });
  });
});

import { INestApplication } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RequestStatus } from '@prisma/client';
import * as request from 'supertest';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { PrismaService } from '@/prisma/prisma.service';
import { RequestsController } from '@/requests/requests.controller';
import { RequestsService } from '@/requests/requests.service';
import { NotificationsService } from '@/notifications/notifications.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn().mockResolvedValue({}) } })),
}));

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const VENUE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const REQ_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const mockVenue = { id: VENUE_ID, name: 'The Loft', location: 'Shoreditch', capacity: 150 };
const mockUser = { id: USER_ID, name: 'Alice', email: 'alice@test.com' };
const mockRequest = (overrides = {}) => ({
  id: REQ_ID,
  userId: USER_ID,
  venueId: VENUE_ID,
  dateFrom: new Date('2026-07-01'),
  dateTo: new Date('2026-07-02'),
  guests: 80,
  eventType: 'Corporate',
  message: null,
  status: RequestStatus.Active,
  createdAt: new Date(),
  venue: mockVenue,
  ...overrides,
});

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

describe('Requests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      controllers: [RequestsController],
      providers: [
        RequestsService,
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

  const validBody = {
    venueId: VENUE_ID,
    dateFrom: '2026-07-01',
    dateTo: '2026-07-02',
    guests: 80,
    eventType: 'Corporate',
  };

  describe('POST /requests', () => {
    it('creates a request and returns 201', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrisma.availabilityRequest.create.mockResolvedValue(mockRequest());

      const res = await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', USER_ID)
        .send(validBody)
        .expect(201);

      expect(res.body.status).toBe(RequestStatus.Active);
    });

    it('returns 400 when guests exceed venue capacity', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue({ ...mockVenue, capacity: 10 });

      await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', USER_ID)
        .send({ ...validBody, guests: 100 })
        .expect(400);
    });

    it('returns 404 when venue does not exist', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', USER_ID)
        .send(validBody)
        .expect(404);
    });

    it('returns 401 when x-user-id header is missing', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .send(validBody)
        .expect(401);
    });

    it('returns 400 when dateTo is before dateFrom', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', USER_ID)
        .send({ ...validBody, dateTo: '2026-06-01' })
        .expect(400);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', USER_ID)
        .send({ venueId: VENUE_ID })
        .expect(400);
    });
  });

  describe('GET /requests', () => {
    it('returns paginated requests for the user', async () => {
      mockPrisma.availabilityRequest.findMany.mockResolvedValue([mockRequest()]);
      mockPrisma.availabilityRequest.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/requests')
        .set('x-user-id', USER_ID)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('accepts status filter', async () => {
      mockPrisma.availabilityRequest.findMany.mockResolvedValue([]);
      mockPrisma.availabilityRequest.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/requests?status=Cancelled')
        .set('x-user-id', USER_ID)
        .expect(200);

      expect(mockPrisma.availabilityRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RequestStatus.Cancelled }),
        }),
      );
    });

    it('returns 401 when x-user-id is missing', async () => {
      await request(app.getHttpServer()).get('/requests').expect(401);
    });
  });

  describe('GET /requests/:id', () => {
    it('returns 200 with request detail', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(mockRequest());
      const res = await request(app.getHttpServer())
        .get(`/requests/${REQ_ID}`)
        .set('x-user-id', USER_ID)
        .expect(200);
      expect(res.body.id).toBe(REQ_ID);
    });

    it('returns 404 when not found or not owned', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(null);
      await request(app.getHttpServer())
        .get(`/requests/${REQ_ID}`)
        .set('x-user-id', USER_ID)
        .expect(404);
    });

    it('returns 400 for non-UUID id', async () => {
      await request(app.getHttpServer())
        .get('/requests/not-a-uuid')
        .set('x-user-id', USER_ID)
        .expect(400);
    });
  });

  describe('PATCH /requests/:id/status', () => {
    it('returns 200 with updated status', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(mockRequest());
      mockPrisma.availabilityRequest.update.mockResolvedValue(
        mockRequest({ status: RequestStatus.Cancelled }),
      );

      const res = await request(app.getHttpServer())
        .patch(`/requests/${REQ_ID}/status`)
        .set('x-user-id', USER_ID)
        .send({ status: RequestStatus.Cancelled })
        .expect(200);

      expect(res.body.status).toBe(RequestStatus.Cancelled);
    });

    it('returns 404 when request not owned', async () => {
      mockPrisma.availabilityRequest.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/requests/${REQ_ID}/status`)
        .set('x-user-id', USER_ID)
        .send({ status: RequestStatus.Cancelled })
        .expect(404);
    });

    it('returns 400 for invalid status value', async () => {
      await request(app.getHttpServer())
        .patch(`/requests/${REQ_ID}/status`)
        .set('x-user-id', USER_ID)
        .send({ status: 'InvalidStatus' })
        .expect(400);
    });
  });
});

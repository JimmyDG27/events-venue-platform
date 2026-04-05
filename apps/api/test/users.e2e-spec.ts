import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersController } from '@/users/users.controller';
import { UsersService } from '@/users/users.service';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockUserRow = {
  id: USER_ID,
  name: 'Alice',
  email: 'alice@test.com',
  phone: null,
  emailVerified: true,
  notificationPreferences: {
    bookingUpdates: true,
    viewingReminders: true,
    marketingEmails: false,
  },
  createdAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest<{ user: unknown }>();
          req.user = { id: USER_ID, name: 'Alice', email: 'alice@test.com', emailVerified: true };
          return true;
        },
      })
      .compile();

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

  describe('GET /users/me', () => {
    it('returns the current user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);

      const res = await request(app.getHttpServer()).get('/users/me').expect(200);

      expect(res.body.id).toBe(USER_ID);
      expect(res.body.email).toBe('alice@test.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('returns 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/users/me').expect(404);
    });
  });

  describe('PATCH /users/me', () => {
    it('updates profile and returns 200', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // no email conflict
      mockPrisma.user.update.mockResolvedValue({ ...mockUserRow, name: 'Bob' });

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'Bob' })
        .expect(200);

      expect(res.body.name).toBe('Bob');
    });

    it('returns 409 when email is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'other-user-id' });

      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ email: 'taken@test.com' })
        .expect(409);
    });

    it('returns 400 when body is empty', async () => {
      await request(app.getHttpServer()).patch('/users/me').send({}).expect(400);
    });

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('PATCH /users/me/notifications', () => {
    it('updates notification preferences and returns 200', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUserRow,
        notificationPreferences: {
          bookingUpdates: true,
          viewingReminders: false,
          marketingEmails: true,
        },
      });

      const res = await request(app.getHttpServer())
        .patch('/users/me/notifications')
        .send({ viewingReminders: false, marketingEmails: true })
        .expect(200);

      expect(res.body.notificationPreferences.viewingReminders).toBe(false);
      expect(res.body.notificationPreferences.marketingEmails).toBe(true);
    });

    it('returns 400 for invalid preference value', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/notifications')
        .send({ bookingUpdates: 'yes' })
        .expect(400);
    });
  });
});

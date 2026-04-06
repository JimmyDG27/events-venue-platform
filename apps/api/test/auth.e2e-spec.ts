import { ExecutionContext, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn().mockResolvedValue({}) } })),
}));

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockUserRow = {
  id: USER_ID,
  name: 'Alice',
  email: 'alice@test.com',
  phone: null,
  passwordHash: '$2b$12$hashed',
  emailVerified: false,
  emailVerificationToken: 'tok_abc',
  notificationPreferences: { bookingUpdates: true, viewingReminders: true, marketingEmails: false },
  createdAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('jwt.token.here') },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest<{ user: unknown }>();
          req.user = { id: USER_ID, name: 'Alice', email: 'alice@test.com', emailVerified: false };
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
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('POST /auth/register', () => {
    const validBody = { name: 'Alice', email: 'alice@test.com', password: 'password123' };

    it('creates a user and returns 201 with accessToken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: USER_ID,
        name: 'Alice',
        email: 'alice@test.com',
        phone: null,
        emailVerified: false,
        createdAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validBody)
        .expect(201);

      expect(res.body.accessToken).toBe('jwt.token.here');
      expect(res.body.user.email).toBe('alice@test.com');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('returns 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validBody)
        .expect(409);
    });

    it('returns 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, password: 'short' })
        .expect(400);
    });

    it('returns 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Alice' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const validBody = { email: 'alice@test.com', password: 'password123' };

    it('returns 200 with accessToken on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(200);

      expect(res.body.accessToken).toBe('jwt.token.here');
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('emailVerificationToken');
    });

    it('returns 401 for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(401);
    });

    it('returns 401 for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...validBody, password: 'wrongpass' })
        .expect(401);
    });

    it('returns 400 when body is empty', async () => {
      await request(app.getHttpServer()).post('/auth/login').send({}).expect(400);
    });
  });

  describe('GET /auth/verify', () => {
    it('returns 200 when token is valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);
      mockPrisma.user.update.mockResolvedValue({ ...mockUserRow, emailVerified: true });

      const res = await request(app.getHttpServer())
        .get('/auth/verify?token=tok_abc')
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('returns 404 for an invalid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/auth/verify?token=bad_token')
        .expect(404);
    });

    it('returns 400 when token query param is missing', async () => {
      await request(app.getHttpServer()).get('/auth/verify').expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 200 with success message', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(res.body.message).toBeDefined();
    });
  });
});

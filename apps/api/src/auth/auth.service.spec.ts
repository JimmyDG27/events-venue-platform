import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const USER_ID = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockUser = {
  id: USER_ID,
  name: 'Alice',
  email: 'alice@test.com',
  phone: null,
  passwordHash: '$2b$12$hashedpassword',
  emailVerified: false,
  emailVerificationToken: 'tok_abc123',
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

const mockJwt = { sign: jest.fn().mockReturnValue('jwt.token.here') };
const mockNotifications = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    const dto = { name: 'Alice', email: 'alice@test.com', password: 'password123' };

    it('creates user, returns token and safe user object', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const safeUser = { id: USER_ID, name: 'Alice', email: 'alice@test.com', phone: null, emailVerified: false, createdAt: new Date() };
      mockPrisma.user.create.mockResolvedValue(safeUser);

      const result = await service.register(dto);

      expect(result.accessToken).toBe('jwt.token.here');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('emailVerificationToken');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('sends verification email after registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: USER_ID, name: 'Alice', email: 'alice@test.com', phone: null, emailVerified: false, createdAt: new Date() });

      await service.register(dto);

      expect(mockNotifications.sendVerificationEmail).toHaveBeenCalledWith(
        'alice@test.com',
        'Alice',
        expect.any(String),
      );
    });

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'alice@test.com', password: 'password123' };

    it('returns token and user without sensitive fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('jwt.token.here');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('emailVerificationToken');
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('returns same error for unknown email and wrong password (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const err1 = await service.login(dto).catch((e: Error) => e.message);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const err2 = await service.login({ ...dto, password: 'wrong' }).catch((e: Error) => e.message);

      expect(err1).toBe(err2);
    });
  });

  describe('verifyEmail', () => {
    it('marks email as verified and clears the token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: false });
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, emailVerified: true });

      const result = await service.verifyEmail('tok_abc123');
      expect(result.message).toContain('verified');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { emailVerified: true, emailVerificationToken: null },
        }),
      );
    });

    it('returns already-verified message without updating when already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: true });
      const result = await service.verifyEmail('tok_abc123');
      expect(result.message).toContain('already verified');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for invalid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail('bad_token')).rejects.toThrow(NotFoundException);
    });
  });
});

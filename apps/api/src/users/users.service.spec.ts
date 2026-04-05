import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from './users.service';

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

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns the user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);
      const result = await service.getProfile(USER_ID);
      expect(result.id).toBe(USER_ID);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates name and returns updated profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // email check — no conflict
      mockPrisma.user.update.mockResolvedValue({ ...mockUserRow, name: 'Bob' });

      const result = await service.updateProfile(USER_ID, { name: 'Bob' });
      expect(result.name).toBe('Bob');
    });

    it('throws ConflictException when email is taken by another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'other-user-id' });

      await expect(
        service.updateProfile(USER_ID, { email: 'taken@test.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not throw conflict when the email belongs to the same user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: USER_ID });
      mockPrisma.user.update.mockResolvedValue({ ...mockUserRow });

      await expect(
        service.updateProfile(USER_ID, { email: 'alice@test.com' }),
      ).resolves.toBeDefined();
    });
  });

  describe('updateNotifications', () => {
    it('merges partial preferences with existing ones', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserRow);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUserRow,
        notificationPreferences: {
          bookingUpdates: true,
          viewingReminders: false,
          marketingEmails: false,
        },
      });

      const result = await service.updateNotifications(USER_ID, { viewingReminders: false });
      const prefs = result.notificationPreferences as {
        bookingUpdates: boolean;
        viewingReminders: boolean;
        marketingEmails: boolean;
      };
      expect(prefs.viewingReminders).toBe(false);
      expect(prefs.bookingUpdates).toBe(true);
    });

    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateNotifications(USER_ID, { marketingEmails: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

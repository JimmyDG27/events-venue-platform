import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import {
  NotificationEvent,
  RequestCreatedPayload,
  RequestStatusUpdatedPayload,
  ViewingCreatedPayload,
} from './notification-events';

// Resend SDK mock
const mockEmailSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

const USER_ID = 'user-1111-1111-1111-111111111111';

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM_EMAIL: 'noreply@test.com',
    };
    return values[key];
  }),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
    mockEmailSend.mockResolvedValue({ id: 'email-123' });
  });

  function mockUserPrefs(overrides: Partial<{ bookingUpdates: boolean; viewingReminders: boolean; marketingEmails: boolean }> = {}) {
    mockPrisma.user.findUnique.mockResolvedValue({
      notificationPreferences: {
        bookingUpdates: true,
        viewingReminders: true,
        marketingEmails: false,
        ...overrides,
      },
    });
  }

  describe('onRequestCreated', () => {
    const payload: RequestCreatedPayload = {
      userId: USER_ID,
      userName: 'Alice',
      userEmail: 'alice@test.com',
      venueName: 'The Loft',
      venueLocation: 'Shoreditch, London',
      dateFrom: new Date('2026-06-01'),
      dateTo: new Date('2026-06-02'),
      guests: 50,
      eventType: 'Corporate',
    };

    it(`sends email when ${NotificationEvent.REQUEST_CREATED} fires and bookingUpdates is enabled`, async () => {
      mockUserPrefs();
      await service.onRequestCreated(payload);

      expect(mockEmailSend).toHaveBeenCalledTimes(1);
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@test.com',
          subject: expect.stringContaining('The Loft'),
        }),
      );
    });

    it('skips email when bookingUpdates preference is disabled', async () => {
      mockUserPrefs({ bookingUpdates: false });
      await service.onRequestCreated(payload);
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe('onRequestStatusUpdated', () => {
    const payload: RequestStatusUpdatedPayload = {
      userId: USER_ID,
      userName: 'Alice',
      userEmail: 'alice@test.com',
      venueName: 'The Loft',
      newStatus: RequestStatus.Completed,
      eventType: 'Corporate',
    };

    it(`sends email when ${NotificationEvent.REQUEST_STATUS_UPDATED} fires and bookingUpdates is enabled`, async () => {
      mockUserPrefs();
      await service.onRequestStatusUpdated(payload);

      expect(mockEmailSend).toHaveBeenCalledTimes(1);
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@test.com',
          subject: expect.stringContaining('The Loft'),
        }),
      );
    });

    it('skips email when bookingUpdates preference is disabled', async () => {
      mockUserPrefs({ bookingUpdates: false });
      await service.onRequestStatusUpdated(payload);
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe('onViewingCreated', () => {
    const payload: ViewingCreatedPayload = {
      userId: USER_ID,
      userName: 'Alice',
      userEmail: 'alice@test.com',
      venueName: 'The Loft',
      venueLocation: 'Shoreditch, London',
      scheduledAt: new Date('2026-06-15T14:00:00Z'),
    };

    it(`sends email when ${NotificationEvent.VIEWING_CREATED} fires and viewingReminders is enabled`, async () => {
      mockUserPrefs();
      await service.onViewingCreated(payload);

      expect(mockEmailSend).toHaveBeenCalledTimes(1);
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@test.com',
          subject: expect.stringContaining('The Loft'),
        }),
      );
    });

    it('skips email when viewingReminders preference is disabled', async () => {
      mockUserPrefs({ viewingReminders: false });
      await service.onViewingCreated(payload);
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe('send error handling', () => {
    it('does not throw when Resend API call fails', async () => {
      mockUserPrefs();
      mockEmailSend.mockRejectedValue(new Error('Resend API unavailable'));

      const payload: RequestCreatedPayload = {
        userId: USER_ID,
        userName: 'Alice',
        userEmail: 'alice@test.com',
        venueName: 'The Loft',
        venueLocation: 'Shoreditch, London',
        dateFrom: new Date('2026-06-01'),
        dateTo: new Date('2026-06-02'),
        guests: 50,
        eventType: 'Corporate',
      };

      // Must not throw — email failures are logged and swallowed
      await expect(service.onRequestCreated(payload)).resolves.toBeUndefined();
    });
  });
});

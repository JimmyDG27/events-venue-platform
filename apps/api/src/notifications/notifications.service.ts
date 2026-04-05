import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Resend } from 'resend';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotificationEvent,
  RequestCreatedPayload,
  RequestStatusUpdatedPayload,
  ViewingCreatedPayload,
} from './notification-events';
import {
  emailVerificationHtml,
  requestSubmittedHtml,
  requestStatusUpdatedHtml,
  viewingScheduledHtml,
} from './email-templates';

interface NotificationPreferences {
  bookingUpdates: boolean;
  viewingReminders: boolean;
  marketingEmails: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.config.get<string>('RESEND_FROM_EMAIL') ?? 'noreply@bookingplatform.com';
  }

  private async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    const prefs = (user?.notificationPreferences ?? {}) as Partial<NotificationPreferences>;
    return {
      bookingUpdates: prefs.bookingUpdates ?? true,
      viewingReminders: prefs.viewingReminders ?? true,
      marketingEmails: prefs.marketingEmails ?? false,
    };
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({ from: this.fromEmail, to, subject, html });
      this.logger.log(`Email sent: "${subject}" → ${to}`);
    } catch (error) {
      // Log but do not throw — email failures must never break the API response
      this.logger.error(`Failed to send email to ${to}: ${String(error)}`);
    }
  }

  async sendVerificationEmail(
    to: string,
    userName: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const verificationUrl = `${appUrl}/auth/verify?token=${token}`;
    await this.send(
      to,
      'Verify your email address',
      emailVerificationHtml({ userName, verificationUrl }),
    );
  }

  @OnEvent(NotificationEvent.REQUEST_CREATED)
  async onRequestCreated(payload: RequestCreatedPayload): Promise<void> {
    const prefs = await this.getPreferences(payload.userId);
    if (!prefs.bookingUpdates) return;

    await this.send(
      payload.userEmail,
      `Availability request submitted — ${payload.venueName}`,
      requestSubmittedHtml({
        userName: payload.userName,
        venueName: payload.venueName,
        venueLocation: payload.venueLocation,
        dateFrom: payload.dateFrom,
        dateTo: payload.dateTo,
        guests: payload.guests,
        eventType: payload.eventType,
      }),
    );
  }

  @OnEvent(NotificationEvent.REQUEST_STATUS_UPDATED)
  async onRequestStatusUpdated(payload: RequestStatusUpdatedPayload): Promise<void> {
    const prefs = await this.getPreferences(payload.userId);
    if (!prefs.bookingUpdates) return;

    await this.send(
      payload.userEmail,
      `Your request for ${payload.venueName} has been ${payload.newStatus.toLowerCase()}`,
      requestStatusUpdatedHtml({
        userName: payload.userName,
        venueName: payload.venueName,
        newStatus: payload.newStatus,
        eventType: payload.eventType,
      }),
    );
  }

  @OnEvent(NotificationEvent.VIEWING_CREATED)
  async onViewingCreated(payload: ViewingCreatedPayload): Promise<void> {
    const prefs = await this.getPreferences(payload.userId);
    if (!prefs.viewingReminders) return;

    await this.send(
      payload.userEmail,
      `Viewing confirmed — ${payload.venueName}`,
      viewingScheduledHtml({
        userName: payload.userName,
        venueName: payload.venueName,
        venueLocation: payload.venueLocation,
        scheduledAt: payload.scheduledAt,
      }),
    );
  }
}

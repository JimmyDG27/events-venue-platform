import { RequestStatus } from '@prisma/client';

export const NotificationEvent = {
  REQUEST_CREATED: 'request.created',
  REQUEST_STATUS_UPDATED: 'request.status_updated',
  VIEWING_CREATED: 'viewing.created',
} as const;

export interface RequestCreatedPayload {
  userId: string;
  userName: string;
  userEmail: string;
  venueName: string;
  venueLocation: string;
  dateFrom: Date;
  dateTo: Date;
  guests: number;
  eventType: string;
}

export interface RequestStatusUpdatedPayload {
  userId: string;
  userName: string;
  userEmail: string;
  venueName: string;
  newStatus: RequestStatus;
  eventType: string;
}

export interface ViewingCreatedPayload {
  userId: string;
  userName: string;
  userEmail: string;
  venueName: string;
  venueLocation: string;
  scheduledAt: Date;
}

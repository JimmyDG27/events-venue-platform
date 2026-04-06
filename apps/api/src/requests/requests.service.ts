import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotificationEvent,
  RequestCreatedPayload,
  RequestStatusUpdatedPayload,
} from '@/notifications/notification-events';
import {
  CreateRequestDto,
  ListRequestsQuery,
  UpdateRequestStatusDto,
} from './requests.schema';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateRequestDto) {
    const [venue, user] = await Promise.all([
      this.prisma.venue.findUnique({ where: { id: dto.venueId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    ]);

    if (!venue) {
      throw new NotFoundException(`Venue ${dto.venueId} not found`);
    }

    if (dto.guests > venue.capacity) {
      throw new BadRequestException(
        `Guest count (${dto.guests}) exceeds venue capacity (${venue.capacity})`,
      );
    }

    const request = await this.prisma.availabilityRequest.create({
      data: {
        userId,
        venueId: dto.venueId,
        dateFrom: dto.dateFrom,
        dateTo: dto.dateTo,
        guests: dto.guests,
        eventType: dto.eventType,
        message: dto.message,
        status: RequestStatus.Active,
      },
      include: { venue: true },
    });

    if (user) {
      const payload: RequestCreatedPayload = {
        userId,
        userName: user.name,
        userEmail: user.email,
        venueName: venue.name,
        venueLocation: venue.location,
        dateFrom: dto.dateFrom,
        dateTo: dto.dateTo,
        guests: dto.guests,
        eventType: dto.eventType,
      };
      this.events.emit(NotificationEvent.REQUEST_CREATED, payload);
    }

    return request;
  }

  async findAll(userId: string, query: ListRequestsQuery) {
    const { status, page, limit } = query;

    const where: Prisma.AvailabilityRequestWhereInput = { userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.availabilityRequest.findMany({
        where,
        include: { venue: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.availabilityRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string) {
    const request = await this.prisma.availabilityRequest.findFirst({
      where: { id, userId },
      include: { venue: true },
    });

    if (!request) {
      throw new NotFoundException(`Request ${id} not found`);
    }

    return request;
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateRequestStatusDto,
  ) {
    // Verify ownership — throws 404 if not found or not owned by this user
    await this.findOne(userId, id);

    // Users may only cancel their own requests.
    // Completed / Rejected / Active transitions are reserved for venue owners (post-MVP admin role).
    if (dto.status !== RequestStatus.Cancelled) {
      throw new ForbiddenException(
        'You may only cancel your own requests. Status changes to Completed, Rejected, or Active require venue-owner permissions.',
      );
    }

    const [updated, user] = await Promise.all([
      this.prisma.availabilityRequest.update({
        where: { id },
        data: { status: dto.status },
        include: { venue: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    ]);

    if (user) {
      const payload: RequestStatusUpdatedPayload = {
        userId,
        userName: user.name,
        userEmail: user.email,
        venueName: updated.venue.name,
        newStatus: dto.status,
        eventType: updated.eventType,
      };
      this.events.emit(NotificationEvent.REQUEST_STATUS_UPDATED, payload);
    }

    return updated;
  }
}

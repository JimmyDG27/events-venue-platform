import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ViewingStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotificationEvent,
  ViewingCreatedPayload,
} from '@/notifications/notification-events';
import {
  CreateViewingDto,
  ListViewingsQuery,
  UpdateViewingDto,
} from './viewings.schema';

@Injectable()
export class ViewingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateViewingDto) {
    const [venue, user] = await Promise.all([
      this.prisma.venue.findUnique({ where: { id: dto.venueId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    ]);
    if (!venue) throw new NotFoundException(`Venue ${dto.venueId} not found`);

    // Prevent scheduling a duplicate viewing for the same venue at the same time
    const duplicate = await this.prisma.viewing.findFirst({
      where: {
        userId,
        venueId: dto.venueId,
        scheduledAt: dto.scheduledAt,
        status: ViewingStatus.Scheduled,
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        'You already have a viewing scheduled for this venue at that date and time.',
      );
    }

    const viewing = await this.prisma.viewing.create({
      data: {
        userId,
        venueId: dto.venueId,
        scheduledAt: dto.scheduledAt,
        status: ViewingStatus.Scheduled,
      },
      include: { venue: true },
    });

    if (user) {
      const payload: ViewingCreatedPayload = {
        userId,
        userName: user.name,
        userEmail: user.email,
        venueName: venue.name,
        venueLocation: venue.location,
        scheduledAt: dto.scheduledAt,
      };
      this.events.emit(NotificationEvent.VIEWING_CREATED, payload);
    }

    return viewing;
  }

  async findAll(userId: string, query: ListViewingsQuery) {
    const now = new Date();
    const where: Prisma.ViewingWhereInput = { userId };

    if (query.filter === 'upcoming') {
      where.scheduledAt = { gte: now };
      where.status = ViewingStatus.Scheduled;
    } else if (query.filter === 'past') {
      where.OR = [
        { scheduledAt: { lt: now } },
        { status: { in: [ViewingStatus.Completed, ViewingStatus.Cancelled] } },
      ];
    }

    const viewings = await this.prisma.viewing.findMany({
      where,
      include: { venue: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return { data: viewings, meta: { total: viewings.length } };
  }

  async update(userId: string, id: string, dto: UpdateViewingDto) {
    const viewing = await this.prisma.viewing.findFirst({
      where: { id, userId },
    });

    if (!viewing) throw new NotFoundException(`Viewing ${id} not found`);

    if (viewing.status === ViewingStatus.Cancelled) {
      throw new BadRequestException('Cannot update a cancelled viewing');
    }

    return this.prisma.viewing.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: dto.scheduledAt }),
        ...(dto.status && { status: dto.status }),
      },
      include: { venue: true },
    });
  }
}

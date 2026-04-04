import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ViewingStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateViewingDto,
  ListViewingsQuery,
  UpdateViewingDto,
} from './viewings.schema';

@Injectable()
export class ViewingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateViewingDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });
    if (!venue) throw new NotFoundException(`Venue ${dto.venueId} not found`);

    return this.prisma.viewing.create({
      data: {
        userId,
        venueId: dto.venueId,
        scheduledAt: dto.scheduledAt,
        status: ViewingStatus.Scheduled,
      },
      include: { venue: true },
    });
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

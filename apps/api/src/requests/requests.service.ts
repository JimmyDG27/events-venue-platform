import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateRequestDto,
  ListRequestsQuery,
  UpdateRequestStatusDto,
} from './requests.schema';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRequestDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue ${dto.venueId} not found`);
    }

    if (dto.guests > venue.capacity) {
      throw new BadRequestException(
        `Guest count (${dto.guests}) exceeds venue capacity (${venue.capacity})`,
      );
    }

    return this.prisma.availabilityRequest.create({
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

    return this.prisma.availabilityRequest.update({
      where: { id },
      data: { status: dto.status },
      include: { venue: true },
    });
  }
}

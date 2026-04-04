import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, venueId: string) {
    // Verify venue exists before adding
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException(`Venue ${venueId} not found`);

    // Duplicate is handled by PrismaExceptionFilter (P2002 → 409 Conflict)
    return this.prisma.favorite.create({
      data: { userId, venueId },
      include: { venue: true },
    });
  }

  async remove(userId: string, venueId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_venueId: { userId, venueId } },
    });

    if (!favorite) throw new NotFoundException('Favourite not found');

    await this.prisma.favorite.delete({
      where: { userId_venueId: { userId, venueId } },
    });
  }

  async findAll(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { venue: true },
      orderBy: { createdAt: 'desc' },
    });

    return { data: favorites, meta: { total: favorites.length } };
  }
}

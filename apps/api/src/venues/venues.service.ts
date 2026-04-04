import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Venue } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ListVenuesQuery, PricingJson } from './venues.schema';

type VenueListResult = {
  data: Venue[];
  meta: { total: number; page: number; limit: number; pages: number };
};

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListVenuesQuery): Promise<VenueListResult> {
    const {
      capacity,
      style,
      location,
      eventType,
      budgetMin,
      budgetMax,
      sort,
      page,
      limit,
    } = query;

    const where: Prisma.VenueWhereInput = {};

    if (capacity) where.capacity = { gte: capacity };
    if (style) where.styles = { has: style };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    // eventType matched against styles (venues tag the kinds of events they host)
    if (eventType) where.styles = { has: eventType };

    const needsBudgetFilter = budgetMin !== undefined || budgetMax !== undefined;
    const needsPriceSort = sort === 'price_asc' || sort === 'price_desc';

    // Fetch more rows when budget/price sorting requires in-memory processing
    const fetchLimit = needsBudgetFilter || needsPriceSort ? undefined : limit;
    const fetchSkip = needsBudgetFilter || needsPriceSort ? undefined : (page - 1) * limit;

    const orderBy = this.buildOrderBy(sort);

    let [venues, total] = await Promise.all([
      this.prisma.venue.findMany({ where, orderBy, take: fetchLimit, skip: fetchSkip }),
      this.prisma.venue.count({ where }),
    ]);

    // In-memory budget filtering (pricing is JSONB — no DB-level range index)
    if (needsBudgetFilter) {
      venues = venues.filter((v) => {
        const p = v.pricing as PricingJson;
        const price = p.pricePerDay ?? p.pricePerHour;
        if (price === undefined) return true;
        if (budgetMin !== undefined && price < budgetMin) return false;
        if (budgetMax !== undefined && price > budgetMax) return false;
        return true;
      });
      total = venues.length;
    }

    // In-memory price sorting (Prisma cannot ORDER BY JSON field values)
    if (needsPriceSort) {
      venues.sort((a, b) => {
        const priceA = this.extractPrice(a.pricing as PricingJson);
        const priceB = this.extractPrice(b.pricing as PricingJson);
        return sort === 'price_asc' ? priceA - priceB : priceB - priceA;
      });
      // Manual pagination after sort
      venues = venues.slice((page - 1) * limit, page * limit);
    }

    return {
      data: venues,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Venue> {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) throw new NotFoundException(`Venue ${id} not found`);
    return venue;
  }

  async addPhoto(id: string, photoUrl: string): Promise<Venue> {
    const venue = await this.findOne(id);
    return this.prisma.venue.update({
      where: { id },
      data: { photos: [...venue.photos, photoUrl] },
    });
  }

  private buildOrderBy(
    sort: ListVenuesQuery['sort'],
  ): Prisma.VenueOrderByWithRelationInput {
    switch (sort) {
      case 'capacity_asc':
        return { capacity: 'asc' };
      case 'capacity_desc':
        return { capacity: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  private extractPrice(pricing: PricingJson): number {
    return pricing.pricePerDay ?? pricing.pricePerHour ?? 0;
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateNotificationsDto, UpdateProfileDto } from './users.schema';

// Shape stored in the notificationPreferences JSON column
interface NotificationPreferences {
  bookingUpdates: boolean;
  viewingReminders: boolean;
  marketingEmails: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        notificationPreferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        notificationPreferences: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const current = user.notificationPreferences as unknown as NotificationPreferences;
    const merged: Prisma.JsonObject = {
      bookingUpdates: dto.bookingUpdates ?? current.bookingUpdates,
      viewingReminders: dto.viewingReminders ?? current.viewingReminders,
      marketingEmails: dto.marketingEmails ?? current.marketingEmails,
    };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        notificationPreferences: true,
        createdAt: true,
      },
    });

    return updated;
  }
}

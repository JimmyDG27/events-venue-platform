import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { RegisterDto, LoginDto } from './auth.schema';

const BCRYPT_ROUNDS = 12;

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerificationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        emailVerificationToken,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email — failure must not block registration
    void this.notifications.sendVerificationEmail(
      dto.email,
      dto.name,
      emailVerificationToken,
    );

    const accessToken = this.signToken(user.id, user.email);
    return { user, accessToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, emailVerificationToken: _tok, ...safeUser } = user;
    const accessToken = this.signToken(user.id, user.email);
    return { user: safeUser, accessToken };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  logout() {
    // JWT is stateless — the client discards the token on logout.
    // A token blocklist (Redis) can be added post-MVP if needed.
    return { message: 'Logged out successfully' };
  }

  private signToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwt.sign(payload);
  }
}

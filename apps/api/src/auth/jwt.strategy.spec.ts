import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

const USER_ID = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const mockConfig = {
  get: jest.fn().mockReturnValue('test-secret'),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  it('returns AuthenticatedUser when token payload is valid', async () => {
    const dbUser = { id: USER_ID, name: 'Alice', email: 'alice@test.com', emailVerified: true };
    mockPrisma.user.findUnique.mockResolvedValue(dbUser);

    const result = await strategy.validate({ sub: USER_ID, email: 'alice@test.com' });

    expect(result).toEqual(dbUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
  });

  it('throws UnauthorizedException when user is not found in DB', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'deleted-user-id', email: 'ghost@test.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

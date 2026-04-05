import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser: AuthenticatedUser = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'Alice',
  email: 'alice@test.com',
  emailVerified: true,
};

const mockProfile = {
  id: mockUser.id,
  name: mockUser.name,
  email: mockUser.email,
  phone: null,
  emailVerified: true,
  notificationPreferences: { bookingUpdates: true, viewingReminders: true, marketingEmails: false },
  createdAt: new Date(),
};

const mockService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  updateNotifications: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('getMe delegates to service with user.id', async () => {
    mockService.getProfile.mockResolvedValue(mockProfile);
    await controller.getMe(mockUser);
    expect(mockService.getProfile).toHaveBeenCalledWith(mockUser.id);
  });

  it('updateMe delegates to service with user.id and dto', async () => {
    const dto = { name: 'Bob' };
    mockService.updateProfile.mockResolvedValue({ ...mockProfile, name: 'Bob' });
    await controller.updateMe(mockUser, dto);
    expect(mockService.updateProfile).toHaveBeenCalledWith(mockUser.id, dto);
  });

  it('updateNotifications delegates to service with user.id and dto', async () => {
    const dto = { marketingEmails: true };
    mockService.updateNotifications.mockResolvedValue(mockProfile);
    await controller.updateNotifications(mockUser, dto);
    expect(mockService.updateNotifications).toHaveBeenCalledWith(mockUser.id, dto);
  });
});

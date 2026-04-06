import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

const mockUser: AuthenticatedUser = {
  id: 'user-1111-1111-1111-111111111111',
  name: 'Alice',
  email: 'alice@test.com',
  emailVerified: true,
};
const VENUE_ID = '22222222-2222-2222-2222-222222222222';

const mockService = {
  add: jest.fn(),
  remove: jest.fn(),
  findAll: jest.fn(),
};

describe('FavoritesController', () => {
  let controller: FavoritesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FavoritesController>(FavoritesController);
    jest.clearAllMocks();
  });

  it('add delegates to service with user.id and venueId', async () => {
    mockService.add.mockResolvedValue({ id: 'fav-1', venueId: VENUE_ID });
    await controller.add(mockUser, VENUE_ID);
    expect(mockService.add).toHaveBeenCalledWith(mockUser.id, VENUE_ID);
  });

  it('remove delegates to service with user.id and venueId', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove(mockUser, VENUE_ID);
    expect(mockService.remove).toHaveBeenCalledWith(mockUser.id, VENUE_ID);
  });

  it('findAll delegates to service with user.id', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    await controller.findAll(mockUser);
    expect(mockService.findAll).toHaveBeenCalledWith(mockUser.id);
  });
});

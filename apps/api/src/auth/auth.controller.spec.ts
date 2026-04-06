import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  logout: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('register delegates to service and returns result', async () => {
    const dto = { name: 'Alice', email: 'alice@test.com', password: 'password123' };
    const expected = { accessToken: 'tok', user: { id: '1', email: dto.email } };
    mockService.register.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(mockService.register).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('login delegates to service and returns result', async () => {
    const dto = { email: 'alice@test.com', password: 'password123' };
    const expected = { accessToken: 'tok', user: { id: '1', email: dto.email } };
    mockService.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(mockService.login).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('verifyEmail delegates to service with token from query', async () => {
    const expected = { message: 'Email verified' };
    mockService.verifyEmail.mockResolvedValue(expected);

    const result = await controller.verifyEmail({ token: 'my_token' });

    expect(mockService.verifyEmail).toHaveBeenCalledWith('my_token');
    expect(result).toBe(expected);
  });

  it('logout delegates to service', () => {
    const expected = { message: 'Logged out' };
    mockService.logout.mockReturnValue(expected);

    const result = controller.logout();

    expect(mockService.logout).toHaveBeenCalled();
    expect(result).toBe(expected);
  });
});

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ZodValidationPipe } from '@/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginSchema,
  RegisterDto,
  RegisterSchema,
  VerifyEmailQuery,
  VerifyEmailQuerySchema,
} from './auth.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Register a new user account' })
  register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login and receive a JWT access token' })
  login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify email address via token link' })
  verifyEmail(
    @Query(new ZodValidationPipe(VerifyEmailQuerySchema)) query: VerifyEmailQuery,
  ) {
    return this.authService.verifyEmail(query.token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (client must discard the JWT)' })
  logout() {
    return this.authService.logout();
  }
}

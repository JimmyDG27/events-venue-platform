import { Body, Controller, Get, HttpCode, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';
import {
  UpdateNotificationsDto,
  UpdateNotificationsSchema,
  UpdateProfileDto,
  UpdateProfileSchema,
} from './users.schema';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(UpdateProfileSchema))
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/notifications')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(UpdateNotificationsSchema))
  updateNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationsDto,
  ) {
    return this.usersService.updateNotifications(user.id, dto);
  }
}

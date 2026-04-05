import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { ZodValidationPipe } from '@/common';
import { VenueIdParamSchema } from '@/venues/venues.schema';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':venueId')
  @ApiOperation({ summary: 'Save a venue to favourites' })
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('venueId', new ZodValidationPipe(VenueIdParamSchema)) venueId: string,
  ) {
    return this.favoritesService.add(user.id, venueId);
  }

  @Delete(':venueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a venue from favourites' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('venueId', new ZodValidationPipe(VenueIdParamSchema)) venueId: string,
  ) {
    return this.favoritesService.remove(user.id, venueId);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's favourite venues" })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.findAll(user.id);
  }
}

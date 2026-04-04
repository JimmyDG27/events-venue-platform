import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common';
import { VenueIdParamSchema } from '@/venues/venues.schema';
import { FavoritesService } from './favorites.service';

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedException('x-user-id header is required');
  return userId;
}

@ApiTags('favorites')
@ApiHeader({ name: 'x-user-id', description: 'Temporary auth — replaced by JWT in Phase 2', required: true })
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':venueId')
  @ApiOperation({ summary: 'Save a venue to favourites' })
  add(
    @Headers('x-user-id') userId: string | undefined,
    @Param('venueId', new ZodValidationPipe(VenueIdParamSchema)) venueId: string,
  ) {
    return this.favoritesService.add(requireUserId(userId), venueId);
  }

  @Delete(':venueId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a venue from favourites' })
  remove(
    @Headers('x-user-id') userId: string | undefined,
    @Param('venueId', new ZodValidationPipe(VenueIdParamSchema)) venueId: string,
  ) {
    return this.favoritesService.remove(requireUserId(userId), venueId);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's favourite venues" })
  findAll(@Headers('x-user-id') userId: string | undefined) {
    return this.favoritesService.findAll(requireUserId(userId));
  }
}

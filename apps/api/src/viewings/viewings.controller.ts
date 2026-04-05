import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { ZodValidationPipe } from '@/common';
import { ViewingsService } from './viewings.service';
import {
  CreateViewingSchema,
  ListViewingsQuerySchema,
  UpdateViewingSchema,
  ViewingIdParamSchema,
} from './viewings.schema';

@ApiTags('viewings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('viewings')
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a venue viewing' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateViewingSchema))
    dto: ReturnType<typeof CreateViewingSchema.parse>,
  ) {
    return this.viewingsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's viewings" })
  @ApiQuery({ name: 'filter', required: false, enum: ['upcoming', 'past', 'all'] })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ListViewingsQuerySchema))
    query: ReturnType<typeof ListViewingsQuerySchema.parse>,
  ) {
    return this.viewingsService.findAll(user.id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or cancel a viewing' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ZodValidationPipe(ViewingIdParamSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateViewingSchema))
    dto: ReturnType<typeof UpdateViewingSchema.parse>,
  ) {
    return this.viewingsService.update(user.id, id, dto);
  }
}

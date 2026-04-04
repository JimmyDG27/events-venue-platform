import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common';
import { ViewingsService } from './viewings.service';
import {
  CreateViewingSchema,
  ListViewingsQuerySchema,
  UpdateViewingSchema,
  ViewingIdParamSchema,
} from './viewings.schema';

function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedException('x-user-id header is required');
  return userId;
}

@ApiTags('viewings')
@ApiHeader({ name: 'x-user-id', description: 'Temporary auth — replaced by JWT in Phase 2', required: true })
@Controller('viewings')
export class ViewingsController {
  constructor(private readonly viewingsService: ViewingsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a venue viewing' })
  create(
    @Headers('x-user-id') userId: string | undefined,
    @Body(new ZodValidationPipe(CreateViewingSchema))
    dto: ReturnType<typeof CreateViewingSchema.parse>,
  ) {
    return this.viewingsService.create(requireUserId(userId), dto);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's viewings" })
  @ApiQuery({ name: 'filter', required: false, enum: ['upcoming', 'past', 'all'] })
  findAll(
    @Headers('x-user-id') userId: string | undefined,
    @Query(new ZodValidationPipe(ListViewingsQuerySchema))
    query: ReturnType<typeof ListViewingsQuerySchema.parse>,
  ) {
    return this.viewingsService.findAll(requireUserId(userId), query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or cancel a viewing' })
  update(
    @Headers('x-user-id') userId: string | undefined,
    @Param('id', new ZodValidationPipe(ViewingIdParamSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateViewingSchema))
    dto: ReturnType<typeof UpdateViewingSchema.parse>,
  ) {
    return this.viewingsService.update(requireUserId(userId), id, dto);
  }
}

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
import { RequestStatus } from '@prisma/client';
import { ZodValidationPipe } from '@/common';
import { RequestsService } from './requests.service';
import {
  CreateRequestSchema,
  ListRequestsQuerySchema,
  RequestIdParamSchema,
  UpdateRequestStatusSchema,
} from './requests.schema';

/**
 * Temporary auth: userId is read from x-user-id header.
 * In Phase 2 this will be replaced by @UseGuards(JwtAuthGuard) + @CurrentUser().
 */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw new UnauthorizedException('x-user-id header is required');
  return userId;
}

@ApiTags('requests')
@ApiHeader({ name: 'x-user-id', description: 'Temporary auth — replaced by JWT in Phase 2', required: true })
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an availability request for a venue' })
  create(
    @Headers('x-user-id') userId: string | undefined,
    @Body(new ZodValidationPipe(CreateRequestSchema))
    dto: ReturnType<typeof CreateRequestSchema.parse>,
  ) {
    return this.requestsService.create(requireUserId(userId), dto);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's requests" })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Headers('x-user-id') userId: string | undefined,
    @Query(new ZodValidationPipe(ListRequestsQuerySchema))
    query: ReturnType<typeof ListRequestsQuerySchema.parse>,
  ) {
    return this.requestsService.findAll(requireUserId(userId), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single request by ID' })
  findOne(
    @Headers('x-user-id') userId: string | undefined,
    @Param('id', new ZodValidationPipe(RequestIdParamSchema)) id: string,
  ) {
    return this.requestsService.findOne(requireUserId(userId), id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a request' })
  updateStatus(
    @Headers('x-user-id') userId: string | undefined,
    @Param('id', new ZodValidationPipe(RequestIdParamSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateRequestStatusSchema))
    dto: ReturnType<typeof UpdateRequestStatusSchema.parse>,
  ) {
    return this.requestsService.updateStatus(requireUserId(userId), id, dto);
  }
}

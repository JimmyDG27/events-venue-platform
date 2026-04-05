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
import { RequestStatus } from '@prisma/client';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedUser } from '@/auth/jwt.strategy';
import { ZodValidationPipe } from '@/common';
import { RequestsService } from './requests.service';
import {
  CreateRequestSchema,
  ListRequestsQuerySchema,
  RequestIdParamSchema,
  UpdateRequestStatusSchema,
} from './requests.schema';

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an availability request for a venue' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateRequestSchema))
    dto: ReturnType<typeof CreateRequestSchema.parse>,
  ) {
    return this.requestsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List the authenticated user's requests" })
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(ListRequestsQuerySchema))
    query: ReturnType<typeof ListRequestsQuerySchema.parse>,
  ) {
    return this.requestsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single request by ID' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ZodValidationPipe(RequestIdParamSchema)) id: string,
  ) {
    return this.requestsService.findOne(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a request' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ZodValidationPipe(RequestIdParamSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateRequestStatusSchema))
    dto: ReturnType<typeof UpdateRequestStatusSchema.parse>,
  ) {
    return this.requestsService.updateStatus(user.id, id, dto);
  }
}

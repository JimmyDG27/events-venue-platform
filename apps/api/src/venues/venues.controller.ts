import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ZodValidationPipe } from '@/common';
import { StorageService } from '@/storage/storage.service';
import { VenuesService } from './venues.service';
import {
  ListVenuesQuerySchema,
  VenueIdParamSchema,
} from './venues.schema';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(
    private readonly venuesService: VenuesService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List venues with optional filters and sorting' })
  @ApiQuery({ name: 'capacity', required: false, type: Number })
  @ApiQuery({ name: 'style', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'budgetMin', required: false, type: Number })
  @ApiQuery({ name: 'budgetMax', required: false, type: Number })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'capacity_asc', 'capacity_desc', 'price_asc', 'price_desc'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query(new ZodValidationPipe(ListVenuesQuerySchema)) query: ReturnType<typeof ListVenuesQuerySchema.parse>,
  ) {
    return this.venuesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue detail by ID' })
  findOne(
    @Param('id', new ZodValidationPipe(VenueIdParamSchema)) id: string,
  ) {
    return this.venuesService.findOne(id);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a photo for a venue' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // use memory storage (buffer)
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async uploadPhoto(
    @Param('id', new ZodValidationPipe(VenueIdParamSchema)) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const url = await this.storageService.upload(file, 'venues');
    const venue = await this.venuesService.addPhoto(id, url);
    return { url, photos: venue.photos };
  }
}

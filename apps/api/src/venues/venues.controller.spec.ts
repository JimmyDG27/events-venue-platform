import { Test, TestingModule } from '@nestjs/testing';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { StorageService } from '@/storage/storage.service';

const mockVenuesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  addPhoto: jest.fn(),
};

const mockStorageService = {
  upload: jest.fn(),
};

describe('VenuesController', () => {
  let controller: VenuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [
        { provide: VenuesService, useValue: mockVenuesService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    controller = module.get<VenuesController>(VenuesController);
    jest.clearAllMocks();
  });

  it('findAll delegates to VenuesService', async () => {
    const expected = { data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } };
    mockVenuesService.findAll.mockResolvedValue(expected);

    const query = { sort: 'newest' as const, page: 1, limit: 20 };
    const result = await controller.findAll(query);

    expect(mockVenuesService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('findOne delegates to VenuesService', async () => {
    const mockVenue = { id: 'some-uuid', name: 'Test Venue' };
    mockVenuesService.findOne.mockResolvedValue(mockVenue);

    const result = await controller.findOne('some-uuid');
    expect(result).toEqual(mockVenue);
  });

  it('uploadPhoto returns url and updated photos', async () => {
    // JPEG magic bytes: FF D8 FF (padded to 12 bytes for the magic-byte check)
    const jpegMagic = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const file = { originalname: 'photo.jpg', mimetype: 'image/jpeg', buffer: jpegMagic, size: jpegMagic.length } as Express.Multer.File;
    mockStorageService.upload.mockResolvedValue('https://r2.dev/venues/photo.jpg');
    mockVenuesService.findOne.mockResolvedValue({ id: 'some-uuid', photos: [] });
    mockVenuesService.addPhoto.mockResolvedValue({ photos: ['https://r2.dev/venues/photo.jpg'] });

    const result = await controller.uploadPhoto('some-uuid', file);
    expect(result.url).toBe('https://r2.dev/venues/photo.jpg');
    expect(result.photos).toHaveLength(1);
  });
});

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = this.config.getOrThrow<string>('R2_PUBLIC_URL');
  }

  /**
   * Uploads a file buffer to Cloudflare R2 and returns the public URL.
   * The key is auto-generated as `{folder}/{uuid}{ext}`.
   */
  async upload(
    file: Express.Multer.File,
    folder = 'venues',
  ): Promise<string> {
    const ext = extname(file.originalname).toLowerCase();
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const url = `${this.publicUrl}/${key}`;
    this.logger.log(`Uploaded ${key} (${file.size} bytes)`);
    return url;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

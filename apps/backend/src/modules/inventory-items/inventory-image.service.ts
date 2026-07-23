import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export const INVENTORY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const INVENTORY_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export interface InventoryImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class InventoryImageService {
  validate(file?: InventoryImageFile) {
    if (!file) throw new BadRequestException('Выберите файл изображения');
    if (
      !INVENTORY_IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof INVENTORY_IMAGE_MIME_TYPES)[number],
      )
    )
      throw new BadRequestException('Допустимы только JPEG, PNG и WebP');
    if (file.size > INVENTORY_IMAGE_MAX_BYTES)
      throw new BadRequestException('Размер изображения не должен превышать 5 МБ');
  }

  async upload(file: InventoryImageFile) {
    this.validate(file);
    this.configure();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'autostock/inventory',
          public_id: `inventory-${randomUUID()}`,
          overwrite: false,
          resource_type: 'image',
          transformation: [
            {
              width: 1600,
              height: 1600,
              crop: 'limit',
              quality: 'auto:good',
              fetch_format: 'auto',
            },
          ],
        },
        (error, uploaded) => {
          if (error || !uploaded)
            reject(error ?? new Error('Cloudinary upload returned no result'));
          else resolve(uploaded);
        },
      );
      stream.end(file.buffer);
    });
    return { imageUrl: result.secure_url, imagePublicId: result.public_id };
  }

  async remove(publicId: string) {
    this.configure();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
  }

  private configure() {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud_name || !api_key || !api_secret)
      throw new ServiceUnavailableException(
        'Хранилище изображений не настроено',
      );
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  }
}

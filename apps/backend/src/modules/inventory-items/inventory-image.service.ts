import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

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
  constructor(private readonly cloudinary: CloudinaryService) {}

  validate(file?: InventoryImageFile) {
    if (!file) throw new BadRequestException('Выберите файл изображения');
    if (
      !INVENTORY_IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof INVENTORY_IMAGE_MIME_TYPES)[number],
      )
    )
      throw new BadRequestException('Допустимы только JPEG, PNG и WebP');
    if (file.size > INVENTORY_IMAGE_MAX_BYTES)
      throw new BadRequestException(
        'Размер изображения не должен превышать 5 МБ',
      );
  }

  async upload(file: InventoryImageFile) {
    this.validate(file);
    const uploaded = await this.cloudinary.uploadImage(file, {
      folder: 'autostock/inventory',
      publicId: `inventory-${randomUUID()}`,
      transformation: {
        width: 1600,
        height: 1600,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    });
    return { imageUrl: uploaded.url, imagePublicId: uploaded.publicId };
  }

  async remove(publicId: string) {
    await this.cloudinary.deleteImage(publicId);
  }
}

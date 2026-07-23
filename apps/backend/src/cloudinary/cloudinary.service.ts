import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  TransformationOptions,
  UploadApiOptions,
  v2 as cloudinary,
} from 'cloudinary';

export interface CloudinaryImageUploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: TransformationOptions | TransformationOptions[];
}

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadImage(
    file: { buffer: Buffer },
    options: CloudinaryImageUploadOptions = {},
  ) {
    if (!file) {
      throw new InternalServerErrorException('Файл изображения не передан');
    }

    return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder ?? 'autoparts',
          ...(options.publicId && { public_id: options.publicId }),
          ...(options.transformation && {
            transformation: options.transformation,
          }),
          overwrite: false,
          resource_type: 'image',
        } satisfies UploadApiOptions,
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                error?.message || 'Не удалось загрузить изображение',
              ),
            );
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string) {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
  }
}

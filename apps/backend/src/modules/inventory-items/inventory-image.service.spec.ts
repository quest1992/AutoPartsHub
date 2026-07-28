import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  INVENTORY_IMAGE_MAX_BYTES,
  InventoryImageService,
} from './inventory-image.service';
import { InventoryItemsService } from './inventory-items.service';

const file = {
  buffer: Buffer.from('image'),
  mimetype: 'image/png',
  size: 5,
};
const actor = { id: 'user', role: UserRole.SHOP_ADMIN, shopId: 'shop-1' };
const includedItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'item-1',
  shopId: 'shop-1',
  quantity: 1,
  minQuantity: 0,
  imageUrl: null,
  imagePublicId: null,
  ...overrides,
});

describe('InventoryImageService validation', () => {
  const cloudinary = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };
  const service = new InventoryImageService(cloudinary);
  it('rejects unsupported files', () => {
    expect(() => service.validate({ ...file, mimetype: 'image/gif' })).toThrow(
      BadRequestException,
    );
  });
  it('rejects files larger than 5 MB', () => {
    expect(() =>
      service.validate({ ...file, size: INVENTORY_IMAGE_MAX_BYTES + 1 }),
    ).toThrow(BadRequestException);
  });

  it('delegates upload and deletion to the shared Cloudinary service', async () => {
    cloudinary.uploadImage.mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/demo/image/upload/item.webp',
      publicId: 'autostock/inventory/item',
    });
    await expect(service.upload(file)).resolves.toEqual({
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/item.webp',
      imagePublicId: 'autostock/inventory/item',
    });
    expect(cloudinary.uploadImage).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ folder: 'autostock/inventory' }),
    );

    await service.remove('autostock/inventory/item');
    expect(cloudinary.deleteImage).toHaveBeenCalledWith(
      'autostock/inventory/item',
    );
  });
});

describe('InventoryItemsService image ownership and persistence', () => {
  function setup(existing = includedItem()) {
    const prisma = {
      shopInventoryItem: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve(includedItem({ ...existing, ...data })),
          ),
      },
    };
    const images = {
      upload: jest.fn().mockResolvedValue({
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/new.webp',
        imagePublicId: 'autostock/inventory/new',
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    return {
      prisma,
      images,
      service: new InventoryItemsService(prisma as never, images as never),
    };
  }

  it('saves uploaded URL and public id', async () => {
    const { service, prisma } = setup();
    const result = await service.uploadImage('item-1', file, actor);
    expect(prisma.shopInventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          imageUrl: expect.stringContaining('cloudinary.com'),
          imagePublicId: 'autostock/inventory/new',
        },
      }),
    );
    expect(result.imageUrl).toContain('cloudinary.com');
  });

  it('deletes the old cloud image only after replacement is saved', async () => {
    const { service, images } = setup(
      includedItem({ imagePublicId: 'autostock/inventory/old' }),
    );
    await service.uploadImage('item-1', file, actor);
    expect(images.remove).toHaveBeenCalledWith('autostock/inventory/old');
  });

  it('clears image fields on delete', async () => {
    const { service, prisma, images } = setup(
      includedItem({ imageUrl: 'old', imagePublicId: 'old-id' }),
    );
    await service.deleteImage('item-1', actor);
    expect(images.remove).toHaveBeenCalledWith('old-id');
    expect(prisma.shopInventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { imageUrl: null, imagePublicId: null },
      }),
    );
  });

  it('hides another shop item as not found', async () => {
    const { service } = setup(includedItem({ shopId: 'shop-2' }));
    await expect(service.uploadImage('item-1', file, actor)).rejects.toThrow(
      NotFoundException,
    );
  });
});

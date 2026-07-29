import { ConflictException } from '@nestjs/common';
import { PartPosition, PartSide } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartCatalogService } from './part-catalog.service';

describe('PartCatalogService normalization', () => {
  function createService(overrides: Record<string, unknown> = {}) {
    const prisma = {
      partCategory: {
        findUnique: jest.fn().mockResolvedValue({ isActive: true }),
        count: jest.fn().mockResolvedValue(0),
      },
      partCatalogItem: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
      ...overrides,
    } as unknown as PrismaService;
    return { prisma, service: new PartCatalogService(prisma) };
  }

  it('stores normalizedName and searchTokens during create', async () => {
    const { prisma, service } = createService();
    const transactionClient = {
      appSequence: { upsert: jest.fn().mockResolvedValue({ value: 7 }) },
      partCatalogItem: {
        create: jest.fn().mockResolvedValue({ id: 'part-id' }),
      },
    };
    jest
      .spyOn(prisma, '$transaction')
      .mockImplementation(async (callback: never) =>
        callback(transactionClient),
      );

    await service.create({
      name: 'Колодки — тормозные',
      slug: 'brake-pads',
      categoryId: 'category-id',
    });

    expect(transactionClient.partCatalogItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          normalizedName: 'колодки тормозные',
          searchTokens: 'колодки тормозные',
          internalCode: 'AUT-000007',
        }),
      }),
    );
  });

  it('rejects an exact normalized duplicate in the same attributes', async () => {
    const { prisma, service } = createService({
      partCatalogItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing-id' }),
      },
    });

    await expect(
      service.create({
        name: 'Колодки   тормозные',
        slug: 'other-brake-pads',
        categoryId: 'category-id',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.partCatalogItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 'category-id',
          side: PartSide.NONE,
          position: PartPosition.NONE,
          OR: expect.arrayContaining([{ normalizedName: 'колодки тормозные' }]),
        }),
      }),
    );
  });
});

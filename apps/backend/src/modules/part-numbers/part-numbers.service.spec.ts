import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NumberNormalizationService } from './number-normalization.service';
import { PartNumbersService } from './part-numbers.service';

describe('PartNumbersService', () => {
  const prisma = {
    partCatalogItem: { findUnique: jest.fn() },
    partNumberManufacturer: { findUnique: jest.fn() },
    partNumber: { create: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new PartNumbersService(
    prisma as never,
    new NumberNormalizationService(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.partCatalogItem.findUnique.mockResolvedValue({ id: 'catalog' });
    prisma.partNumberManufacturer.findUnique.mockResolvedValue({
      id: 'manufacturer',
      isActive: true,
    });
  });

  it('stores the normalized number on create', async () => {
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    prisma.partNumber.create.mockResolvedValue({
      id: 'number',
      partCatalogItemId: 'catalog',
      rawNumber: '90915-YZZE1',
      normalizedNumber: '90915YZZE1',
      type: 'OEM',
      isPrimary: false,
      manufacturer: { id: 'manufacturer', name: 'Toyota', isActive: true },
      partCatalogItem: { id: 'catalog', name: 'Filter', internalCode: 'AUT-1' },
    });

    await service.create({
      catalogItemId: 'catalog',
      manufacturerId: 'manufacturer',
      number: '90915-YZZE1',
      type: 'OEM',
    });

    expect(prisma.partNumber.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ normalizedNumber: '90915YZZE1' }),
      }),
    );
  });

  it('converts database uniqueness violations to HTTP 409', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expect(
      service.create({
        catalogItemId: 'catalog',
        manufacturerId: 'manufacturer',
        number: '90915 YZZE1',
        type: 'CROSS',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

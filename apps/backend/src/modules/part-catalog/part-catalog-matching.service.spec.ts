import { PrismaService } from '../../prisma/prisma.service';
import { PartCatalogMatchingService } from './part-catalog-matching.service';

describe('PartCatalogMatchingService', () => {
  function createService() {
    const findPartNumber = jest.fn().mockResolvedValue([]);
    const findPartAlias = jest.fn().mockResolvedValue([]);
    const findPartCatalogItem = jest.fn().mockResolvedValue([]);
    const prisma = {
      partNumber: { findMany: findPartNumber },
      partAlias: { findMany: findPartAlias },
      partCatalogItem: { findMany: findPartCatalogItem },
    } as unknown as PrismaService;

    return {
      prisma,
      service: new PartCatalogMatchingService(prisma),
      findPartAlias,
    };
  }

  it('uses an unambiguous normalized part number before a name', async () => {
    const { prisma, service, findPartAlias } = createService();
    jest
      .spyOn(prisma.partNumber, 'findMany')
      .mockResolvedValue([{ partCatalogItemId: 'part-oem' }]);

    await expect(
      service.match({ partNumber: '04465-0k240', name: 'Колодки тормозные' }),
    ).resolves.toEqual({
      matched: true,
      partCatalogItemId: 'part-oem',
      method: 'OEM_EXACT',
      confidence: 1,
      requiresReview: false,
    });
    expect(findPartAlias).not.toHaveBeenCalled();
  });

  it('allows import matching through CROSS and AFTERMARKET numbers', async () => {
    const { prisma, service } = createService();
    const findMany = jest
      .spyOn(prisma.partNumber, 'findMany')
      .mockResolvedValue([{ partCatalogItemId: 'part-cross' }]);

    await expect(service.match({ partNumber: '90915-YZZE1' })).resolves.toEqual(
      expect.objectContaining({
        matched: true,
        partCatalogItemId: 'part-cross',
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ type: expect.anything() }),
      }),
    );
  });

  it('uses an approved alias when the part number has no match', async () => {
    const { prisma, service } = createService();
    jest
      .spyOn(prisma.partAlias, 'findMany')
      .mockResolvedValue([{ partCatalogItemId: 'part-alias' }]);

    await expect(service.match({ name: 'Колодки тормозные' })).resolves.toEqual(
      expect.objectContaining({
        matched: true,
        partCatalogItemId: 'part-alias',
        method: 'ALIAS_EXACT',
        confidence: 0.9,
      }),
    );
  });

  it('requires review instead of picking an ambiguous match', async () => {
    const { prisma, service } = createService();
    jest
      .spyOn(prisma.partNumber, 'findMany')
      .mockResolvedValue([
        { partCatalogItemId: 'part-one' },
        { partCatalogItemId: 'part-two' },
      ]);

    await expect(service.match({ partNumber: '123-45' })).resolves.toEqual({
      matched: false,
      partCatalogItemId: null,
      method: 'NOT_FOUND',
      confidence: 0,
      requiresReview: true,
    });
  });
});

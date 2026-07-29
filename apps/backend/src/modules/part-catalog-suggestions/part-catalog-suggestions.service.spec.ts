import { ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogSuggestionStatus, UserRole } from '@prisma/client';
import {
  PartCatalogSuggestionsService,
  SuggestionActor,
} from './part-catalog-suggestions.service';

describe('PartCatalogSuggestionsService', () => {
  const seller: SuggestionActor = {
    id: 'seller-1',
    role: UserRole.SELLER,
    shopId: 'shop-1',
  };
  const otherSeller: SuggestionActor = {
    id: 'seller-2',
    role: UserRole.SELLER,
    shopId: 'shop-2',
  };
  const admin: SuggestionActor = {
    id: 'admin-1',
    role: UserRole.SUPER_ADMIN,
    shopId: null,
  };
  let prisma: any;
  let service: PartCatalogSuggestionsService;
  let catalogSearch: { findMatches: jest.Mock };

  beforeEach(() => {
    prisma = {
      partCatalogSuggestion: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      partCategory: { findUnique: jest.fn(), count: jest.fn() },
      partCatalogItem: { findUnique: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => unknown)(prisma)
          : Promise.all(arg as Promise<unknown>[]),
      ),
    };
    catalogSearch = { findMatches: jest.fn().mockResolvedValue([]) };
    service = new PartCatalogSuggestionsService(prisma, catalogSearch as never);
  });

  it('creates a pending suggestion for the JWT shop and user', async () => {
    prisma.partCatalogSuggestion.findFirst.mockResolvedValue(null);
    prisma.partCatalogSuggestion.create.mockImplementation(
      ({ data }: any) => data,
    );
    const result = await service.create(seller, {
      name: '  Колодки тормозные  ',
    });
    expect(result).toEqual(
      expect.objectContaining({
        shopId: 'shop-1',
        createdById: 'seller-1',
        name: 'Колодки тормозные',
        normalizedName: 'колодки тормозные',
      }),
    );
  });

  it('rejects a duplicate pending suggestion from the same shop', async () => {
    prisma.partCatalogSuggestion.findFirst.mockResolvedValue({
      id: 'existing',
    });
    await expect(
      service.create(seller, { name: 'Колодки' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('forces a shop user list to their JWT shop', async () => {
    prisma.partCatalogSuggestion.findMany.mockResolvedValue([]);
    prisma.partCatalogSuggestion.count.mockResolvedValue(0);
    await service.findAll(otherSeller, { shopId: 'shop-1' });
    expect(prisma.partCatalogSuggestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shopId: 'shop-2' }),
      }),
    );
  });

  it('hides another shop suggestion as not found', async () => {
    prisma.partCatalogSuggestion.findUnique.mockResolvedValue({
      id: 'suggestion',
      shopId: 'shop-1',
    });
    await expect(
      service.findOne(otherSeller, 'suggestion'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows super admin to see a suggestion from any shop', async () => {
    prisma.partCatalogSuggestion.findUnique.mockResolvedValue({
      id: 'suggestion',
      shopId: 'shop-1',
    });
    await expect(service.findOne(admin, 'suggestion')).resolves.toEqual({
      id: 'suggestion',
      shopId: 'shop-1',
    });
  });

  it.each([
    CatalogSuggestionStatus.APPROVED,
    CatalogSuggestionStatus.MERGED,
    CatalogSuggestionStatus.REJECTED,
  ])('does not process an already resolved %s suggestion', async (status) => {
    prisma.partCatalogSuggestion.findUnique.mockResolvedValue({
      id: 'suggestion',
      status,
    });
    await expect(
      service.reject(admin, 'suggestion', 'Причина'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('merges a pending suggestion with an existing catalog item', async () => {
    prisma.partCatalogSuggestion.findUnique.mockResolvedValue({
      id: 'suggestion',
      status: CatalogSuggestionStatus.PENDING,
    });
    prisma.partCatalogItem.findUnique.mockResolvedValue({ id: 'part-1' });
    prisma.partCatalogSuggestion.update.mockResolvedValue({
      id: 'suggestion',
      status: CatalogSuggestionStatus.MERGED,
    });
    await expect(service.merge(admin, 'suggestion', 'part-1')).resolves.toEqual(
      expect.objectContaining({ status: CatalogSuggestionStatus.MERGED }),
    );
  });

  it('rejects a pending suggestion with the admin identity', async () => {
    prisma.partCatalogSuggestion.findUnique.mockResolvedValue({
      id: 'suggestion',
      status: CatalogSuggestionStatus.PENDING,
    });
    prisma.partCatalogSuggestion.update.mockImplementation(
      ({ data }: any) => data,
    );
    const result = await service.reject(admin, 'suggestion', 'Дубликат');
    expect(result).toEqual(
      expect.objectContaining({
        status: CatalogSuggestionStatus.REJECTED,
        rejectionReason: 'Дубликат',
        resolvedBy: { connect: { id: 'admin-1' } },
      }),
    );
  });
});

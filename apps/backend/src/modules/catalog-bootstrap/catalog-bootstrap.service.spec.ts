import { ConflictException } from '@nestjs/common';
import { PartPosition, PartSide } from '@prisma/client';
import { CatalogBootstrapService } from './catalog-bootstrap.service';

describe('CatalogBootstrapService', () => {
  const category = {
    id: 'category-1',
    name: 'Передние тормозные колодки',
    slug: 'perednie-tormoznye-kolodki',
    needsReview: true,
    parent: {
      id: 'parent-1',
      name: 'Передние тормоза',
      parent: { id: 'root-1', name: 'Тормозная система' },
    },
  };

  function setup() {
    const prisma = {
      partCategory: {
        findMany: jest.fn().mockResolvedValue([category]),
      },
      partCatalogItem: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const partCatalogService = { create: jest.fn() };
    return {
      prisma,
      partCatalogService,
      service: new CatalogBootstrapService(
        prisma as never,
        partCatalogService as never,
      ),
    };
  }

  it('returns every leaf with a canonical editable suggestion', async () => {
    const { service } = setup();
    const response = await service.findAll();
    expect(response.summary).toEqual({
      categoriesFound: 1,
      alreadyExisted: 0,
      newCandidates: 1,
      warnings: 1,
    });
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        categoryId: 'category-1',
        path: 'Тормозная система > Передние тормоза > Передние тормозные колодки',
        suggestedName: 'Тормозные колодки',
        suggestedPosition: PartPosition.FRONT,
        suggestedSide: PartSide.NONE,
        existsInCatalog: false,
      }),
    );
  });

  it('marks an exact category/name/side/position match as existing', async () => {
    const { prisma, service } = setup();
    prisma.partCatalogItem.findMany.mockResolvedValue([
      {
        id: 'part-1',
        categoryId: 'category-1',
        normalizedName: 'тормозные колодки',
        slug: 'other-slug',
        side: PartSide.NONE,
        position: PartPosition.FRONT,
      },
    ]);
    const response = await service.findAll();
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        existsInCatalog: true,
        existingCatalogItemId: 'part-1',
      }),
    );
  });

  it('creates only explicitly selected rows through PartCatalogService', async () => {
    const { partCatalogService, service } = setup();
    partCatalogService.create.mockResolvedValue({ id: 'created-1' });
    const response = await service.createSelected({
      items: [
        {
          categoryId: 'category-1',
          name: 'Тормозные колодки',
          side: PartSide.NONE,
          position: PartPosition.FRONT,
        },
      ],
    });
    expect(partCatalogService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'category-1',
        name: 'Тормозные колодки',
        slug: 'perednie-tormoznye-kolodki',
        position: PartPosition.FRONT,
      }),
    );
    expect(response.summary).toEqual({
      requested: 1,
      created: 1,
      alreadyExisted: 0,
      skipped: 0,
    });
  });

  it('returns already existing instead of creating a duplicate', async () => {
    const { prisma, partCatalogService, service } = setup();
    prisma.partCatalogItem.findFirst.mockResolvedValue({ id: 'part-1' });
    const response = await service.createSelected({
      items: [
        {
          categoryId: 'category-1',
          name: 'Тормозные колодки',
          side: PartSide.NONE,
          position: PartPosition.FRONT,
        },
      ],
    });
    expect(partCatalogService.create).not.toHaveBeenCalled();
    expect(response.summary.alreadyExisted).toBe(1);
  });

  it('does not abort the batch when the catalog service reports a duplicate', async () => {
    const { partCatalogService, service } = setup();
    partCatalogService.create.mockRejectedValue(
      new ConflictException('duplicate'),
    );
    const response = await service.createSelected({
      items: [
        {
          categoryId: 'category-1',
          name: 'Тормозные колодки',
          side: PartSide.NONE,
          position: PartPosition.FRONT,
        },
      ],
    });
    expect(response.results[0].status).toBe('EXISTING');
  });

  it('blocks unsafe mass creation until an approved taxonomy mapping exists', async () => {
    const { partCatalogService, service } = setup();

    await expect(service.autoCreateSafe()).rejects.toThrow(
      'Массовое создание отключено',
    );
    expect(partCatalogService.create).not.toHaveBeenCalled();
  });
});

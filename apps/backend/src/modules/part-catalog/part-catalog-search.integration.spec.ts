import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogSearchService } from './catalog-search.service';
import { PartCatalogController } from './part-catalog.controller';
import { PartCatalogService } from './part-catalog.service';

describe('Part catalog search integration', () => {
  it('wires the controller to alias-aware catalog search', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      controllers: [PartCatalogController],
      providers: [
        PartCatalogService,
        CatalogSearchService,
        {
          provide: PrismaService,
          useValue: {
            partCatalogItem: {
              findMany,
              count: jest.fn().mockResolvedValue(0),
            },
          },
        },
      ],
    }).compile();

    const controller = moduleRef.get(PartCatalogController);
    await controller.search({ search: 'Brake Pad', page: 1, limit: 20 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              aliases: {
                some: {
                  isApproved: true,
                  normalizedAlias: { contains: 'brake pad' },
                },
              },
            },
          ]),
        }),
      }),
    );
  });
});

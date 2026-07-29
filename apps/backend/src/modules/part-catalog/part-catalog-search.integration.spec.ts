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
            partCategory: { findMany: jest.fn().mockResolvedValue([]) },
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
              AND: expect.arrayContaining([
                expect.objectContaining({
                  OR: expect.arrayContaining([
                    {
                      aliases: {
                        some: {
                          isApproved: true,
                          normalizedAlias: {
                            contains: 'brake',
                            mode: 'insensitive',
                          },
                        },
                      },
                    },
                  ]),
                }),
              ]),
            },
          ]),
        }),
      }),
    );
  });

  it.each([
    'Главные платы BMS',
    'Главные платы',
    'платы',
    'BMS',
    'главные платы bms',
    '  Главные    платы   BMS  ',
    'Блоки управления батареей BMS',
    'Система управления батареей',
  ])('uses the same tokenized query for "%s"', async (search) => {
    const record = {
      id: 'part-bms',
      name: 'Главные платы BMS',
      normalizedName: 'главные платы bms',
      searchTokens: 'bms главные платы',
    };
    const prisma = {
      partCatalogItem: {
        findMany: jest.fn().mockResolvedValue([record]),
        count: jest.fn().mockResolvedValue(1),
      },
      partCategory: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new CatalogSearchService(prisma as never);

    const result = await service.search({ search, isActive: true, limit: 10 });

    expect(result.data).toEqual([record]);
    expect(prisma.partCatalogItem.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.partCatalogItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });
});

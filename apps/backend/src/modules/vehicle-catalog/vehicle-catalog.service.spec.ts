import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { VehicleCatalogController } from './vehicle-catalog.controller';
import { VehicleCatalogService } from './vehicle-catalog.service';

describe('VehicleCatalogService', () => {
  const prisma: any = {
    $transaction: jest.fn(async (queries: unknown[]) => Promise.all(queries)),
    manufacturer: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    vehicleModel: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    vehicleModelAlias: { findMany: jest.fn() },
    vehicleSpecification: { count: jest.fn(), findFirst: jest.fn() },
    partCategory: { findMany: jest.fn(), findFirst: jest.fn() },
    partCatalogItem: { count: jest.fn(), findMany: jest.fn() },
  };
  const service = new VehicleCatalogService(prisma);
  const query = { page: 1, limit: 20, search: '' };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.vehicleModelAlias.findMany.mockResolvedValue([]);
  });

  it('searches manufacturers case-insensitively with pagination', async () => {
    prisma.manufacturer.findMany.mockResolvedValue([
      { id: 'byd', name: 'BYD', englishName: null },
      { id: 'bmw', name: 'BMW', englishName: null },
    ]);
    const result = await service.manufacturers({ ...query, search: 'by' });
    expect(result.meta.total).toBe(1);
    expect(prisma.manufacturer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      }),
    );
  });

  it('puts configured EV manufacturers first without hardcoded ids', async () => {
    prisma.manufacturer.findMany.mockResolvedValue([
      { id: 'other', name: 'Abarth', englishName: null },
      { id: 'li', name: 'LiXiang', englishName: null },
      { id: 'byd', name: 'BYD', englishName: null },
      { id: 'vw', name: 'Volkswagen AG', englishName: null },
    ]);
    const result = await service.manufacturers({ ...query, limit: 100 });
    expect(result.data.map((item) => item.id)).toEqual([
      'byd',
      'vw',
      'li',
      'other',
    ]);
    expect(result.data[0]).toMatchObject({
      priorityGroup: 'POPULAR_EV',
      priorityRank: 0,
    });
    expect(result.data[3]).toMatchObject({
      priorityGroup: 'OTHER',
      priorityRank: null,
    });
  });

  it.each([
    ['LiXiang', 'li'],
    ['XPENG', 'xpeng'],
    ['Mercedes Benz', 'mercedes'],
    ['VW', 'vw'],
    ['BAIC Group', 'baic'],
  ])('finds manufacturer alias %s', async (search, expectedId) => {
    prisma.manufacturer.findMany.mockResolvedValue([
      { id: 'li', name: 'Li Auto', englishName: null },
      { id: 'xpeng', name: 'XPeng', englishName: null },
      { id: 'mercedes', name: 'Mercedes-Benz', englishName: null },
      { id: 'vw', name: 'Volkswagen', englishName: null },
      { id: 'baic', name: 'BAIC', englishName: null },
    ]);

    const result = await service.manufacturers({ ...query, search });

    expect(result.data.map((item) => item.id)).toEqual([expectedId]);
  });

  it('normalizes spaces, hyphens and letter case for manufacturer search', async () => {
    prisma.manufacturer.findMany.mockResolvedValue([
      { id: 'mercedes', name: 'Mercedes-Benz', englishName: null },
    ]);

    const result = await service.manufacturers({
      ...query,
      search: '  MERCEDES   BENZ ',
    });

    expect(result.data.map((item) => item.id)).toEqual(['mercedes']);
  });
  it('returns global active vehicle catalog statistics', async () => {
    prisma.manufacturer.count.mockResolvedValue(155);
    prisma.vehicleModel.count.mockResolvedValue(1119);
    prisma.vehicleSpecification.count.mockResolvedValue(382);

    await expect(service.stats()).resolves.toEqual({
      manufacturers: 155,
      models: 1119,
      specifications: 382,
    });
    expect(prisma.vehicleModel.count).toHaveBeenCalledWith({
      where: { isActive: true, manufacturer: { isActive: true } },
    });
    expect(prisma.vehicleSpecification.count).toHaveBeenCalledWith({
      where: {
        isActive: true,
        vehicleModel: {
          isActive: true,
          manufacturer: { isActive: true },
        },
      },
    });
  });
  it('returns models for an active manufacturer', async () => {
    prisma.manufacturer.findFirst.mockResolvedValue({ id: 'maker' });
    prisma.vehicleModel.count.mockResolvedValue(1);
    prisma.vehicleModel.findMany.mockResolvedValue([{ id: 'e2', name: 'E2' }]);
    const result = await service.models('maker', query);
    expect(result.data).toHaveLength(1);
    expect(prisma.vehicleModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { manufacturerId: 'maker', isActive: true },
      }),
    );
  });

  it('rejects models request for an inactive manufacturer', async () => {
    prisma.manufacturer.findFirst.mockResolvedValue(null);
    await expect(service.models('missing', query)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns generation and specification choices in one model query', async () => {
    prisma.vehicleModel.findFirst.mockResolvedValue({
      id: 'e2',
      generations: [{ id: 'g1' }],
      specifications: [{ id: 's1' }, { id: 's2' }],
    });
    const result = await service.model('e2');
    expect(result.generations).toHaveLength(1);
    expect(result.specifications).toHaveLength(2);
    expect(prisma.vehicleModel.findFirst).toHaveBeenCalledTimes(1);
  });

  it('returns a confirmed vehicle specification', async () => {
    prisma.vehicleSpecification.findFirst.mockResolvedValue({
      id: 's1',
      powertrainType: 'BEV',
      vehicleModel: { id: 'e2' },
    });
    expect((await service.specification('s1')).powertrainType).toBe('BEV');
  });

  it('returns only active root categories', async () => {
    prisma.vehicleSpecification.findFirst.mockResolvedValue({
      id: 's1',
      vehicleModel: { id: 'e2' },
    });
    prisma.partCategory.findMany.mockResolvedValue([{ id: 'brakes' }]);
    expect(await service.categories('s1')).toEqual([{ id: 'brakes' }]);
    expect(prisma.partCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parentId: null, isActive: true } }),
    );
  });

  it('returns an empty paginated parts result without N+1 queries', async () => {
    prisma.vehicleSpecification.findFirst.mockResolvedValue({
      id: 's1',
      vehicleModel: { id: 'e2' },
    });
    prisma.partCategory.findFirst.mockResolvedValue({
      id: 'cat',
      children: [],
    });
    prisma.partCatalogItem.count.mockResolvedValue(0);
    prisma.partCatalogItem.findMany.mockResolvedValue([]);
    const result = await service.items('s1', 'cat', {
      ...query,
      sort: 'price',
    });
    expect(result.data).toEqual([]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.partCatalogItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it('does not query the database for an empty global search', async () => {
    const result = await service.search(query);
    expect(result.data).toEqual([]);
    expect(prisma.vehicleModel.findMany).not.toHaveBeenCalled();
  });

  it('searches vehicle models by normalized aliases', async () => {
    prisma.vehicleModel.count.mockResolvedValue(1);
    prisma.vehicleModel.findMany.mockResolvedValue([
      {
        id: 'yuan-plus',
        name: 'Yuan Plus',
        exportName: null,
        startYear: 2022,
        endYear: null,
        powertrainType: 'BEV',
        manufacturer: { id: 'byd', name: 'BYD', logo: null },
        aliases: [],
        generations: [],
        specifications: [],
      },
    ]);
    await service.search({ ...query, search: 'BYD Atto 3' });
    expect(prisma.vehicleModel.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  aliases: {
                    some: { normalizedName: { contains: 'atto' } },
                  },
                }),
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it('allows every authenticated project role to browse the catalog', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, VehicleCatalogController);
    expect(roles).toEqual(
      expect.arrayContaining([
        UserRole.SUPER_ADMIN,
        UserRole.SHOP_ADMIN,
        UserRole.MANAGER,
        UserRole.SELLER,
        UserRole.VIEWER,
      ]),
    );
  });
});

import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { VehicleFitmentSort } from './dto/vehicle-fitment-query.dto';
import { VehicleFitmentController } from './vehicle-fitment.controller';
import { VehicleFitmentService } from './vehicle-fitment.service';

describe('VehicleFitmentService', () => {
  const vehicle = {
    id: 'spec',
    year: 2021,
    trim: null,
    variant: null,
    powertrainType: 'BEV',
    vehicleModel: {
      id: 'model',
      name: 'E2',
      manufacturer: { id: 'make', name: 'BYD' },
    },
    generation: { id: 'generation', name: '2021' },
  };
  const oem = {
    id: 'oem',
    number: '04465-47070',
    normalizedNumber: '0446547070',
    displayNumber: '04465-47070',
    description: 'Brake pads',
    manufacturer: { id: 'make', name: 'Toyota' },
    aliases: [],
    categories: [
      {
        isPrimary: true,
        catalogItem: {
          id: 'item',
          name: 'Brake pads',
          description: null,
          category: { id: 'brakes', name: 'Brakes' },
        },
      },
    ],
    brands: [],
    outgoingCrossReferences: [
      {
        id: 'cross',
        relationType: 'AFTERMARKET_ANALOG',
        confidence: 95,
        externalPartNumber: 'BP-1',
        normalizedExternalPartNumber: 'BP1',
        toOemPart: null,
        partBrand: { id: 'brand', officialName: 'Bosch' },
      },
    ],
  };
  const prisma: any = {
    vehicleSpecification: { findFirst: jest.fn() },
    oemPartFitment: { findMany: jest.fn() },
    partCategory: { findFirst: jest.fn() },
    oemPart: { findMany: jest.fn(), findUnique: jest.fn() },
    shopInventoryItem: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.vehicleSpecification.findFirst.mockResolvedValue(vehicle);
    prisma.partCategory.findFirst.mockResolvedValue({
      id: 'brakes',
      name: 'Brakes',
      description: null,
    });
    prisma.oemPart.findMany.mockResolvedValue([oem]);
    prisma.oemPart.findUnique.mockResolvedValue(oem);
    prisma.shopInventoryItem.findMany.mockResolvedValue([]);
  });

  it('returns only categories backed by confirmed OEM fitments', async () => {
    prisma.oemPartFitment.findMany.mockResolvedValue([
      {
        oemPartId: 'oem',
        oemPart: {
          categories: [
            {
              catalogItem: {
                category: {
                  id: 'pads',
                  name: 'Pads',
                  parent: {
                    id: 'brakes',
                    name: 'Brakes',
                    parent: null,
                  },
                },
              },
            },
          ],
        },
      },
    ]);
    const service = new VehicleFitmentService(prisma);
    const result = await service.specification('spec');
    expect(result.categories).toEqual([
      { id: 'brakes', name: 'Brakes', itemsCount: 1 },
    ]);
    expect(result.hasConfirmedFitments).toBe(true);
  });

  it('returns a clear empty state when no fitment exists', async () => {
    prisma.oemPartFitment.findMany.mockResolvedValue([]);
    const service = new VehicleFitmentService(prisma);
    const result = await service.specification('spec');
    expect(result.categories).toEqual([]);
    expect(result.message).toContain('нет подтверждённых данных');
  });

  it('returns OEM and cross-reference counts without N+1 queries', async () => {
    const service = new VehicleFitmentService(prisma);
    const result = await service.category('spec', 'brakes', {
      page: 1,
      limit: 20,
      sort: VehicleFitmentSort.PRICE,
    });
    expect(result.parts[0]).toMatchObject({
      displayNumber: '04465-47070',
      analogsCount: 1,
      offersCount: 0,
    });
    expect(prisma.oemPart.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.shopInventoryItem.findMany).toHaveBeenCalledTimes(1);
  });

  it('collects compatible original and analog shop offers', async () => {
    prisma.shopInventoryItem.findMany.mockResolvedValue([
      {
        id: 'original',
        price: 100,
        currency: 'TJS',
        quantity: 3,
        reservedQuantity: 1,
        sku: null,
        oemNumber: null,
        externalPartNumber: null,
        normalizedExternalPartNumber: null,
        oemPartId: 'oem',
        shop: { name: 'Shop A' },
        partBrand: null,
      },
      {
        id: 'analog',
        price: 80,
        currency: 'TJS',
        quantity: 5,
        reservedQuantity: 0,
        sku: 'BP-1',
        oemNumber: null,
        externalPartNumber: 'BP-1',
        normalizedExternalPartNumber: 'BP1',
        oemPartId: null,
        shop: { name: 'Shop B' },
        partBrand: { id: 'brand', officialName: 'Bosch' },
      },
    ]);
    const service = new VehicleFitmentService(prisma);
    const result = await service.category('spec', 'brakes', {
      page: 1,
      limit: 20,
      sort: VehicleFitmentSort.PRICE,
    });
    expect(result.parts[0]).toMatchObject({
      shopsCount: 2,
      offersCount: 2,
      minimumPrice: '80',
    });
  });

  it('applies analog and availability filters in the database query', async () => {
    const service = new VehicleFitmentService(prisma);
    await service.category('spec', 'brakes', {
      analogOnly: true,
      inStock: true,
      minPrice: 10,
      maxPrice: 100,
      page: 1,
      limit: 20,
      sort: VehicleFitmentSort.PRICE,
    });
    expect(prisma.shopInventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quantity: { gt: 0 },
          price: { gte: 10, lte: 100 },
        }),
      }),
    );
  });

  it('sorts by availability', async () => {
    prisma.oemPart.findMany.mockResolvedValue([
      oem,
      { ...oem, id: 'oem-2', number: '2', displayNumber: '2' },
    ]);
    prisma.shopInventoryItem.findMany.mockResolvedValue([
      {
        id: 'offer',
        price: 100,
        currency: 'TJS',
        quantity: 8,
        reservedQuantity: 0,
        sku: null,
        oemNumber: null,
        externalPartNumber: null,
        normalizedExternalPartNumber: null,
        oemPartId: 'oem-2',
        shop: { name: 'Shop' },
        partBrand: null,
      },
    ]);
    const service = new VehicleFitmentService(prisma);
    const result = await service.category('spec', 'brakes', {
      page: 1,
      limit: 20,
      sort: VehicleFitmentSort.AVAILABILITY,
    });
    expect(result.parts[0].id).toBe('oem-2');
  });

  it('returns part detail with empty analogs and offers when absent', async () => {
    prisma.oemPart.findUnique.mockResolvedValue({
      ...oem,
      outgoingCrossReferences: [],
    });
    const service = new VehicleFitmentService(prisma);
    const result = await service.part('oem', {
      page: 1,
      limit: 20,
      sort: VehicleFitmentSort.PRICE,
    });
    expect(result.crossReferences).toEqual([]);
    expect(result.offers).toEqual([]);
  });

  it('rejects contradictory filters', async () => {
    const service = new VehicleFitmentService(prisma);
    await expect(
      service.category('spec', 'brakes', {
        originalOnly: true,
        analogOnly: true,
        page: 1,
        limit: 20,
        sort: VehicleFitmentSort.PRICE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('caches repeated specification overviews', async () => {
    prisma.oemPartFitment.findMany.mockResolvedValue([]);
    const service = new VehicleFitmentService(prisma);
    await service.specification('spec');
    await service.specification('spec');
    expect(prisma.vehicleSpecification.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.oemPartFitment.findMany).toHaveBeenCalledTimes(1);
  });

  it('allows all authenticated platform roles', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, VehicleFitmentController);
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

import { UserRole } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { VinService } from '../vin/vin.service';
import { MarketplaceSearchService } from './marketplace-search.service';

describe('MarketplaceSearchService', () => {
  const offer = {
    id: 'inventory',
    partCatalogItemId: 'catalog',
    imageUrl: null,
    brand: 'Toyota',
    quantity: 2,
    price: { toFixed: () => '350.00' },
    currency: 'TJS',
    location: 'A-12',
    condition: 'NEW',
    shop: { id: 'shop', name: 'Авто Мир', city: 'Душанбе', address: null },
    partCatalogItem: {
      name: 'Масляный фильтр',
      internalCode: 'AS-1',
      category: { id: 'category', name: 'Фильтры' },
      partNumbers: [
        { type: 'OEM', rawNumber: '90915-YZZD2', normalizedNumber: '90915YZZD2', isPrimary: true, manufacturer: { id: 'm', name: 'Toyota' } },
        { type: 'CROSS', rawNumber: 'OC 534', normalizedNumber: 'OC534', isPrimary: false, manufacturer: null },
      ],
      vehicleFitments: [],
      compatibilities: [],
    },
  };
  const prisma = {
    shopInventoryItem: {
      findMany: jest.fn().mockResolvedValue([offer]),
      count: jest.fn().mockResolvedValue(1),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };
  const vin = {
    decode: jest.fn().mockResolvedValue({
      catalogItems: [{ id: 'catalog' }],
      matchStatus: 'FOUND',
    }),
  };
  let service: MarketplaceSearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MarketplaceSearchService,
        { provide: PrismaService, useValue: prisma },
        { provide: VinService, useValue: vin },
      ],
    }).compile();
    service = module.get(MarketplaceSearchService);
  });

  it('detects VIN and reuses decoded CatalogItems in one paginated inventory query', async () => {
    const result = await service.search(
      { q: '4T1G11AK0MU001001', inStockOnly: true, originalOnly: false, analogOnly: false, page: 1, limit: 12 },
      { role: UserRole.SUPER_ADMIN, shopId: null },
    );
    expect(vin.decode).toHaveBeenCalledTimes(1);
    expect(result.queryType).toBe('VIN');
    expect(result.items[0]).toMatchObject({
      name: 'Масляный фильтр',
      oemNumbers: ['90915-YZZD2'],
      crossNumbers: ['OC 534'],
      warehouse: 'A-12',
    });
  });

  it('detects an OEM number without calling VIN Decoder', async () => {
    const result = await service.search(
      { q: '90915-YZZD2', inStockOnly: true, originalOnly: false, analogOnly: false, page: 1, limit: 12 },
      { role: UserRole.SUPER_ADMIN, shopId: null },
    );
    expect(vin.decode).not.toHaveBeenCalled();
    expect(result.queryType).toBe('OEM');
  });
});

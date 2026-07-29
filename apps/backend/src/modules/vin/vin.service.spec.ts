import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MockVinProvider } from './providers/mock-vin-provider';
import { VinService } from './vin.service';
import { VIN_PROVIDER } from './vin.types';

describe('VinService (integration)', () => {
  const cache = new Map<string, any>();
  const prisma = {
    vinDecodeCache: {
      findUnique: jest.fn(({ where }) => cache.get(where.vin) ?? null),
      create: jest.fn(({ data }) => {
        const value = {
          id: 'cache-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        cache.set(data.vin, value);
        return value;
      }),
    },
    manufacturer: {
      findFirst: jest.fn().mockResolvedValue({ id: 'brand-id' }),
    },
    vehicleModel: {
      findFirst: jest.fn().mockResolvedValue({ id: 'model-id' }),
    },
    vehicleGeneration: {
      findFirst: jest.fn().mockResolvedValue({ id: 'generation-id' }),
    },
    engine: { findFirst: jest.fn().mockResolvedValue({ id: 'engine-id' }) },
    vehicleFitment: {
      findMany: jest.fn().mockResolvedValue([
        {
          catalogItem: { id: 'part-id', internalCode: 'P-1', name: 'Filter' },
        },
      ]),
    },
  };
  let service: VinService;
  let provider: MockVinProvider;

  beforeEach(async () => {
    cache.clear();
    jest.clearAllMocks();
    provider = new MockVinProvider();
    const module = await Test.createTestingModule({
      providers: [
        VinService,
        { provide: PrismaService, useValue: prisma },
        { provide: VIN_PROVIDER, useValue: provider },
      ],
    }).compile();
    service = module.get(VinService);
  });

  it('uses provider on cache miss and returns automatic match with parts', async () => {
    const decodeSpy = jest.spyOn(provider, 'decode');
    const result = await service.decode('4T1G11AK0MU001001');
    expect(decodeSpy).toHaveBeenCalledTimes(1);
    expect(result.cacheHit).toBe(false);
    expect(result.matchStatus).toBe('FOUND');
    expect(result.matchedIds.engineId).toBe('engine-id');
    expect(result.catalogItems).toHaveLength(1);
  });

  it('does not call provider on cache hit', async () => {
    await service.decode('4T1G11AK0MU001001');
    const decodeSpy = jest.spyOn(provider, 'decode');
    const result = await service.decode('4T1G11AK0MU001001');
    expect(decodeSpy).not.toHaveBeenCalled();
    expect(result.cacheHit).toBe(true);
  });

  it('returns PARTIAL when only part of the hierarchy matches', async () => {
    prisma.engine.findFirst.mockResolvedValueOnce(null);
    const result = await service.decode('4T1G11AK0MU001001');
    expect(result.matchStatus).toBe('PARTIAL');
    expect(result.catalogItems).toEqual([]);
  });
});

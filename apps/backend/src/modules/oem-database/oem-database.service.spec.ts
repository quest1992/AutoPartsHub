import { BadRequestException } from '@nestjs/common';
import { OemDatabaseService } from './oem-database.service';

describe('OemDatabaseService', () => {
  const prisma = {
    oemPart: { findMany: jest.fn(), findUnique: jest.fn() },
    oemSource: { findFirst: jest.fn() },
    partBrand: { findFirst: jest.fn() },
  };
  const service = new OemDatabaseService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.oemPart.findMany.mockResolvedValue([]);
    prisma.oemPart.findUnique.mockResolvedValue({ id: 'oem-id' });
    prisma.oemSource.findFirst.mockResolvedValue({ id: 'source-id' });
    prisma.partBrand.findFirst.mockResolvedValue({ id: 'brand-id' });
  });

  it.each(['43512-0D080', '435120D080', '43512 0d080', '43512.0D080'])(
    'normalizes %s consistently',
    (value) => expect(service.normalizeOemNumber(value)).toBe('435120D080'),
  );

  it('rejects a query without Latin letters or digits', async () => {
    await expect(
      service.search({ search: '---', page: 1, limit: 25 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an external number when its part brand is inactive or missing', async () => {
    prisma.partBrand.findFirst.mockResolvedValue(null);

    await expect(
      service.addCrossReference(
        'oem-id',
        {
          partBrandId: 'brand-id',
          externalPartNumber: '0986AB1234',
          relationType: 'AFTERMARKET_ANALOG',
          confidence: 80,
          sourceId: 'source-id',
        } as never,
        { id: 'user-id', role: 'SUPER_ADMIN', shopId: null } as never,
      ),
    ).rejects.toThrow('Выбранный производитель детали не найден или отключён');
  });
  it('builds canonical, alias and aftermarket search branches', async () => {
    await service.search({ search: '43512-0D080', page: 1, limit: 25 });
    const where = prisma.oemPart.findMany.mock.calls[0][0].where;
    expect(where.OR[0].normalizedNumber.startsWith).toBe('435120D080');
    expect(where.OR[1].aliases.some.normalizedAlias.startsWith).toBe(
      '435120D080',
    );
    expect(
      where.OR[2].outgoingCrossReferences.some.normalizedExternalPartNumber
        .startsWith,
    ).toBe('435120D080');
  });
});

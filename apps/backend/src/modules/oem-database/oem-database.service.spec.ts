import { BadRequestException } from '@nestjs/common';
import { OemDatabaseService } from './oem-database.service';

describe('OemDatabaseService', () => {
  const prisma = {
    oemPart: { findMany: jest.fn() },
  };
  const service = new OemDatabaseService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.oemPart.findMany.mockResolvedValue([]);
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

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PartCategoryQueryDto } from './dto/part-category-query.dto';
import { PartCategoriesService } from './part-categories.service';

describe('PartCategoriesService search', () => {
  const findMany = jest.fn();
  const count = jest.fn();
  const transaction = jest.fn(async (queries: Array<Promise<unknown>>) =>
    Promise.all(queries),
  );
  const prisma = {
    partCategory: { findMany, count },
    $transaction: transaction,
  };
  const service = new PartCategoriesService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
  });

  it('keeps parent categories when leafOnly is omitted', async () => {
    await service.findAll({
      search: 'фильтр',
      isActive: true,
      page: 1,
      limit: 20,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          OR: [
            { name: { contains: 'фильтр', mode: 'insensitive' } },
            { slug: { contains: 'фильтр', mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });

  it('returns only terminal categories when leafOnly is true', async () => {
    await service.findAll({
      search: 'фильтр',
      leafOnly: true,
      isActive: true,
      page: 1,
      limit: 20,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          children: { none: {} },
        }),
      }),
    );
  });

  it('does not treat leafOnly false as true', async () => {
    await service.findAll({
      search: 'фильтр',
      leafOnly: false,
      isActive: true,
      page: 1,
      limit: 20,
    });

    expect(findMany.mock.calls[0]?.[0].where.children).toBeUndefined();
  });

  it('transforms leafOnly=false from the query string to boolean false', async () => {
    const query = plainToInstance(PartCategoryQueryDto, {
      leafOnly: 'false',
    });

    expect(await validate(query)).toEqual([]);
    expect(query.leafOnly).toBe(false);
  });
});

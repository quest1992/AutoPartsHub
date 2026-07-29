import { CatalogSearchService } from './catalog-search.service';

describe('CatalogSearchService', () => {
  it('builds the only database query with filters and pagination', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const service = new CatalogSearchService({
      partCatalogItem: { findMany, count },
      partCategory: { findMany: jest.fn().mockResolvedValue([]) },
    } as never);

    await expect(
      service.search({
        search: 'brake pad',
        rootCategoryId: undefined,
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({
      data: [],
      categoryMatches: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

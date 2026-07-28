import { CatalogSearchService } from './catalog-search.service';
import { PartCatalogService } from './part-catalog.service';

describe('CatalogSearchService', () => {
  it('delegates filters and pagination to the central catalog query', async () => {
    const findAll = jest.fn().mockResolvedValue({
      data: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });
    const service = new CatalogSearchService({
      findAll,
    } as unknown as PartCatalogService);

    const query = {
      search: 'brake pad',
      rootCategoryId: '44444444-4444-4444-8444-444444444444',
      page: 2,
      limit: 10,
    };

    await expect(service.search(query)).resolves.toEqual(
      expect.objectContaining({ data: [] }),
    );
    expect(findAll).toHaveBeenCalledWith(query);
  });
});

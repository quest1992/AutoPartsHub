import { PartPosition, PartSide } from '@prisma/client';
import { InventoryImportMatcherService } from './inventory-import-matcher.service';

const part = {
  id: 'part-1',
  name: 'Радиатор охлаждения',
  normalizedName: 'радиатор охлаждения',
  side: PartSide.NONE,
  position: PartPosition.NONE,
};

function setup(items: unknown[] = []) {
  const catalogSearch = {
    search: jest.fn().mockResolvedValue({ data: items, categoryMatches: [] }),
  };
  return {
    service: new InventoryImportMatcherService(catalogSearch as never),
    catalogSearch,
  };
}

describe('InventoryImportMatcherService', () => {
  it('returns EXACT for one normalized match from CatalogSearchService', async () => {
    const { service } = setup([part]);
    await expect(
      service.match(part.name, PartSide.NONE, PartPosition.NONE),
    ).resolves.toMatchObject({ status: 'EXACT', catalogItemId: 'part-1' });
  });

  it('returns FUZZY for one partial match', async () => {
    const { service } = setup([part]);
    await expect(
      service.match('радиатор', PartSide.NONE, PartPosition.NONE),
    ).resolves.toMatchObject({ status: 'FUZZY' });
  });

  it('returns MULTIPLE for several exact matches', async () => {
    const { service } = setup([part, { ...part, id: 'part-2' }]);
    await expect(
      service.match(part.name, PartSide.NONE, PartPosition.NONE),
    ).resolves.toMatchObject({ status: 'MULTIPLE' });
  });

  it('returns NOT_FOUND when unified search has no result', async () => {
    const { service, catalogSearch } = setup();
    await expect(
      service.match('несуществующаядеталь', PartSide.NONE, PartPosition.NONE),
    ).resolves.toEqual({ status: 'NOT_FOUND' });
    expect(catalogSearch.search).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'несуществующаядеталь',
        isActive: true,
      }),
    );
  });
});

import { InventoryItemsService } from './inventory-items.service';

describe('InventoryItemsService location normalization', () => {
  const service = new InventoryItemsService({} as never, {} as never);
  const normalize = (location: string) =>
    (
      service as unknown as {
        normalize(dto: { location: string }): { location: string | null };
      }
    ).normalize({ location });

  it('trims a location used during create or update', () => {
    expect(normalize('  Стеллаж A / Полка 2  ')).toEqual({
      location: 'Стеллаж A / Полка 2',
    });
  });

  it('clears location with an empty string', () => {
    expect(normalize('   ')).toEqual({ location: null });
  });
});

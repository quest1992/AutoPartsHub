import { InventoryItemsService } from './inventory-items.service';

describe('InventoryItemsService compatibility normalization', () => {
  const service = new InventoryItemsService({} as never, {} as never);
  const normalize = (
    value: string | undefined,
  ): { compatibility?: string | null } =>
    (
      service as unknown as {
        normalize(dto: { compatibility?: string }): {
          compatibility?: string | null;
        };
      }
    ).normalize({ compatibility: value });

  it('trims compatibility on create or update', () => {
    expect(normalize('  Toyota Corolla E150  ')).toEqual({
      compatibility: 'Toyota Corolla E150',
    });
  });

  it('clears compatibility with an empty string', () => {
    expect(normalize('   ')).toEqual({ compatibility: null });
  });

  it('does not add compatibility when omitted', () => {
    expect(normalize(undefined)).toEqual({ compatibility: undefined });
  });
});

import { buildInventoryKey } from './inventory-key';
describe('buildInventoryKey', () => {
  const base = {
    shopId: 'shop',
    warehouseId: 'warehouse-a',
    partCatalogItemId: 'part',
  };
  it('normalizes article, OEM and manufacturer', () =>
    expect(
      buildInventoryKey({
        ...base,
        sku: ' AB-12 ',
        oemNumber: '00 77',
        brand: '  DENSO  ',
      }),
    ).toBe(
      buildInventoryKey({
        ...base,
        sku: 'ab12',
        oemNumber: '0077',
        brand: 'denso',
      }),
    ));
  it('allows the same catalog item on two warehouses', () =>
    expect(buildInventoryKey(base)).not.toBe(
      buildInventoryKey({ ...base, warehouseId: 'warehouse-b' }),
    ));
});

import {
  normalizeImportRow,
  resolveColumnMapping,
  suggestColumnMapping,
} from './inventory-import.parser';

const columns = [
  'Category',
  'Product Name',
  'Compatibility',
  'Price',
  'Quantity',
];

describe('inventory import compatibility', () => {
  it('recognizes the compatibility header', () => {
    expect(suggestColumnMapping(columns).compatibility).toBe('Compatibility');
    expect(
      suggestColumnMapping(['Совместимость с автомобилем']).compatibility,
    ).toBe('Совместимость с автомобилем');
  });

  it('trims compatibility while preserving Unicode and case', () => {
    const { mapping } = resolveColumnMapping(columns);
    const { normalized, errors } = normalizeImportRow(
      {
        Category: 'Filters',
        'Product Name': 'Oil filter',
        Compatibility: '  Toyota Camry XV50 2012–2017, двигатель 2.5  ',
        Price: '100',
        Quantity: '2',
      },
      mapping,
    );

    expect(errors).toEqual([]);
    expect(normalized.compatibility).toBe(
      'Toyota Camry XV50 2012–2017, двигатель 2.5',
    );
  });

  it('normalizes empty compatibility to null', () => {
    const { mapping } = resolveColumnMapping(columns);
    const { normalized } = normalizeImportRow(
      {
        Category: 'Filters',
        'Product Name': 'Oil filter',
        Compatibility: '   ',
        Price: '100',
        Quantity: '2',
      },
      mapping,
    );

    expect(normalized.compatibility).toBeNull();
  });
});

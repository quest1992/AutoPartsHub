import {
  normalizeImportRow,
  resolveColumnMapping,
  suggestColumnMapping,
} from './inventory-import.parser';

const columns = [
  'Category',
  'Product Name',
  'Место хранения',
  'Price',
  'Quantity',
];

describe('inventory import storage location', () => {
  it('recognizes the Russian storage location header', () => {
    expect(suggestColumnMapping(columns).storageLocation).toBe(
      'Место хранения',
    );
  });

  it('trims storage location while preserving Unicode', () => {
    const { mapping } = resolveColumnMapping(columns);
    const { normalized, errors } = normalizeImportRow(
      {
        Category: 'Filters',
        'Product Name': 'Oil filter',
        'Место хранения': '  Стеллаж А / Полка 2 / Ячейка 15  ',
        Price: '100',
        Quantity: '2',
      },
      mapping,
    );

    expect(errors).toEqual([]);
    expect(normalized.storageLocation).toBe('Стеллаж А / Полка 2 / Ячейка 15');
  });

  it('normalizes an empty storage location to null', () => {
    const { mapping } = resolveColumnMapping(columns);
    const { normalized } = normalizeImportRow(
      {
        Category: 'Filters',
        'Product Name': 'Oil filter',
        'Место хранения': '   ',
        Price: '100',
        Quantity: '2',
      },
      mapping,
    );

    expect(normalized.storageLocation).toBeNull();
  });
});

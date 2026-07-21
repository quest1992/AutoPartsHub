import * as XLSX from 'xlsx';
import {
  normalizeHeader,
  normalizeImportRow,
  normalizePriceValue,
  normalizeQuantityValue,
  parseExcelFile,
  resolveColumnMapping,
  suggestColumnMapping,
} from './inventory-import.parser';

function buildWorkbook(
  headers: string[],
  rows: string[][],
  sheetName = 'Лист1',
): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('inventory import parser', () => {
  it('detects Russian headers', () => {
    const mapping = suggestColumnMapping([
      'Артикул',
      'Наименование',
      'Цена',
      'Остаток',
    ]);
    expect(mapping).toEqual({
      partNumber: 'Артикул',
      name: 'Наименование',
      price: 'Цена',
      quantity: 'Остаток',
    });
  });

  it('detects English headers', () => {
    const mapping = suggestColumnMapping([
      'SKU',
      'Product Name',
      'Price',
      'Qty',
    ]);
    expect(mapping.partNumber).toBe('SKU');
    expect(mapping.name).toBe('Product Name');
    expect(mapping.price).toBe('Price');
    expect(mapping.quantity).toBe('Qty');
  });

  it('ignores completely empty rows', () => {
    const buffer = buildWorkbook(
      ['Артикул', 'Наименование', 'Цена', 'Остаток'],
      [
        ['04465-YZZR7', 'Колодки', '420', '8'],
        ['', '', '', ''],
        ['123', 'Фильтр', '100', '2'],
      ],
    );
    const parsed = parseExcelFile({
      buffer,
      originalname: 'stock.xlsx',
    });
    expect(parsed.rows).toHaveLength(2);
  });

  it('normalizes price "1 250,50 сом" to 1250.5', () => {
    expect(normalizePriceValue('1 250,50 сом')).toEqual({ price: 1250.5 });
  });

  it('rejects negative quantity', () => {
    expect(normalizeQuantityValue('-3')).toEqual({
      quantity: 0,
      error: 'Количество не может быть отрицательным',
    });
  });

  it('normalizes part number and name in row', () => {
    const { mapping } = resolveColumnMapping(
      ['Артикул', 'Наименование', 'Цена', 'Остаток'],
      {},
    );
    const { normalized, errors } = normalizeImportRow(
      {
        Артикул: '04465-YZZR7',
        Наименование: 'Колодки тормозные Toyota',
        Цена: '420',
        Остаток: '8',
      },
      mapping,
    );
    expect(errors).toEqual([]);
    expect(normalized.partNumber).toBe('04465YZZR7');
    expect(normalized.rawName).toBe('Колодки тормозные Toyota');
    expect(normalized.price).toBe(420);
    expect(normalized.quantity).toBe(8);
  });

  it('normalizes header aliases', () => {
    expect(normalizeHeader(' Part-Number ')).toBe('partnumber');
    expect(normalizeHeader('Розничная цена')).toBe('розничнаяцена');
  });
});

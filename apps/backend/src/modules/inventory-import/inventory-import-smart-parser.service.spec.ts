import { BadRequestException } from '@nestjs/common';
import { PartPosition, PartSide } from '@prisma/client';
import * as XLSX from 'xlsx';
import { InventoryImportSmartParserService } from './inventory-import-smart-parser.service';

function workbook(rows: unknown[][]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'Товары');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
describe('InventoryImportSmartParserService', () => {
  const parser = new InventoryImportSmartParserService();
  it('reads XLSX and detects side/position', () => {
    const buffer = workbook([
      ['Наименование', 'Количество', 'Цена продажи'],
      ['Передняя левая фара', 2, 120],
    ]);
    const [row] = parser.parse({ buffer, originalname: 'items.xlsx' });
    expect(row.normalized.position).toBe(PartPosition.FRONT);
    expect(row.normalized.side).toBe(PartSide.LEFT);
  });
  it('rejects a missing required column', () => {
    const buffer = workbook([
      ['Наименование', 'Количество'],
      ['Фара', 2],
    ]);
    expect(() => parser.parse({ buffer, originalname: 'items.xlsx' })).toThrow(
      BadRequestException,
    );
  });
  it('rejects an empty workbook', () => {
    const buffer = workbook([['Наименование', 'Количество', 'Цена продажи']]);
    expect(() => parser.parse({ buffer, originalname: 'items.xlsx' })).toThrow(
      BadRequestException,
    );
  });
  it('reports conflicting explicit position', () => {
    const buffer = workbook([
      ['Наименование', 'Количество', 'Цена продажи', 'Позиция'],
      ['Передняя фара', 1, 50, 'REAR'],
    ]);
    const [row] = parser.parse({ buffer, originalname: 'items.xlsx' });
    expect(row.warnings.join(' ')).toContain('FRONT');
  });
  it('validates negative quantity and price', () => {
    const buffer = workbook([
      ['Наименование', 'Количество', 'Цена продажи'],
      ['Фара', -1, -5],
    ]);
    const [row] = parser.parse({ buffer, originalname: 'items.xlsx' });
    expect(row.errors).toHaveLength(2);
  });
  it('creates a template with an instruction sheet', () => {
    const book = XLSX.read(parser.createTemplate(), { type: 'buffer' });
    expect(book.SheetNames).toEqual(['Товары', 'Инструкция']);
  });
});

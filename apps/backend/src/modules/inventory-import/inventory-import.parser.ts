import * as XLSX from 'xlsx';
import { normalizePartName } from '../../common/utils/part-name-normalizer';
import { normalizePartNumber } from '../../common/utils/part-number-normalizer';

export type ImportField = 'partNumber' | 'name' | 'price' | 'quantity';

export interface ColumnMappingInput {
  partNumberColumn?: string | null;
  nameColumn?: string | null;
  priceColumn?: string | null;
  quantityColumn?: string | null;
}

export interface ResolvedColumnMapping {
  partNumberColumn: string | null;
  nameColumn: string;
  priceColumn: string;
  quantityColumn: string;
}

export interface ParsedWorksheet {
  fileName: string;
  worksheetName: string;
  columns: string[];
  rows: Array<{ rowNumber: number; source: Record<string, string> }>;
}

export interface NormalizedImportRow {
  partNumber: string | null;
  rawPartNumber: string | null;
  name: string | null;
  rawName: string | null;
  price: number | null;
  quantity: number;
}

export type PreviewRowStatus = 'valid' | 'invalid' | 'requires_review';

const COLUMN_ALIASES: Record<ImportField, string[]> = {
  partNumber: [
    'oem',
    'артикул',
    'код',
    'коддетали',
    'номердетали',
    'partnumber',
    'sku',
    'article',
    'catalognumber',
    'номенклатурныйкод',
  ],
  name: [
    'наименование',
    'название',
    'товар',
    'деталь',
    'description',
    'product',
    'productname',
    'name',
    'item',
  ],
  price: [
    'цена',
    'стоимость',
    'розничнаяцена',
    'продажнаяцена',
    'price',
    'cost',
    'saleprice',
  ],
  quantity: [
    'остаток',
    'количество',
    'колво',
    'наличие',
    'склад',
    'quantity',
    'qty',
    'stock',
    'balance',
  ],
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 10_000;

function cellText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return value.toISOString();
  return '';
}

export function normalizeHeader(value: unknown): string {
  return cellText(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/ё/g, 'е');
}

export function suggestColumnMapping(
  columns: string[],
): Partial<Record<ImportField, string>> {
  const mapping: Partial<Record<ImportField, string>> = {};
  const used = new Set<string>();

  for (const field of [
    'partNumber',
    'name',
    'price',
    'quantity',
  ] as ImportField[]) {
    for (const column of columns) {
      if (used.has(column)) continue;
      const key = normalizeHeader(column);
      if (COLUMN_ALIASES[field].includes(key)) {
        mapping[field] = column;
        used.add(column);
        break;
      }
    }
  }

  return mapping;
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'import.xlsx';
  return base.replace(/[^\w.\-()\s\u0400-\u04FF]+/g, '_').slice(0, 200);
}

export function assertImportFile(
  file: { buffer: Buffer; originalname: string } | undefined,
): asserts file is { buffer: Buffer; originalname: string } {
  if (!file?.buffer?.length) {
    throw new Error('FILE_MISSING');
  }
  if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }
  if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
    throw new Error('FILE_TYPE_INVALID');
  }
}

export function parseExcelFile(file: {
  buffer: Buffer;
  originalname: string;
}): ParsedWorksheet {
  assertImportFile(file);

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      cellFormula: false,
      cellDates: true,
      codepage: 65001,
    });
  } catch {
    throw new Error('FILE_READ_FAILED');
  }

  const worksheetName = workbook.SheetNames[0];
  if (!worksheetName) throw new Error('WORKBOOK_EMPTY');

  const sheet = workbook.Sheets[worksheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (matrix.length < 2) throw new Error('NO_DATA_ROWS');

  const headerRowIndex = detectHeaderRowIndex(matrix);
  const headerRow = matrix[headerRowIndex] ?? [];
  const columns = headerRow
    .map((cell, index) => {
      const label = cellText(cell).trim();
      return label || `column_${index + 1}`;
    })
    .filter((column, index, all) => {
      const hasHeader = cellText(headerRow[index]).trim().length > 0;
      const hasData = matrix
        .slice(headerRowIndex + 1)
        .some((row) => cellText(row[index]).trim().length > 0);
      return hasHeader || hasData;
    });

  const rows: ParsedWorksheet['rows'] = [];
  for (let index = headerRowIndex + 1; index < matrix.length; index += 1) {
    const rawRow = matrix[index] ?? [];
    if (rawRow.every((cell) => !cellText(cell).trim())) continue;
    if (rows.length >= MAX_ROWS) break;

    const source: Record<string, string> = {};
    columns.forEach((column, columnIndex) => {
      source[column] = cellText(rawRow[columnIndex]).trim();
    });
    rows.push({ rowNumber: index + 1, source });
  }

  if (rows.length === 0) throw new Error('NO_USABLE_ROWS');

  return {
    fileName: sanitizeFileName(file.originalname),
    worksheetName,
    columns,
    rows,
  };
}

function detectHeaderRowIndex(matrix: unknown[][]): number {
  for (let index = 0; index < Math.min(matrix.length, 5); index += 1) {
    const row = matrix[index] ?? [];
    const filled = row.filter((cell) => cellText(cell).trim()).length;
    if (filled >= 2) return index;
  }
  return 0;
}

export function resolveColumnMapping(
  columns: string[],
  input?: ColumnMappingInput,
): { mapping: ResolvedColumnMapping; errors: string[] } {
  const suggested = suggestColumnMapping(columns);
  const mapping: ResolvedColumnMapping = {
    partNumberColumn:
      input?.partNumberColumn?.trim() ||
      suggested.partNumber ||
      null,
    nameColumn:
      input?.nameColumn?.trim() || suggested.name || '',
    priceColumn:
      input?.priceColumn?.trim() || suggested.price || '',
    quantityColumn:
      input?.quantityColumn?.trim() || suggested.quantity || '',
  };

  const errors: string[] = [];
  if (!mapping.nameColumn) {
    errors.push('Не выбрана колонка с наименованием');
  }
  if (!mapping.priceColumn) {
    errors.push('Не выбрана колонка с ценой');
  }
  if (!mapping.quantityColumn) {
    errors.push('Не выбрана колонка с количеством');
  }
  if (!mapping.partNumberColumn && !mapping.nameColumn) {
    errors.push('Укажите колонку с артикулом или наименованием');
  }

  for (const [field, column] of Object.entries(mapping)) {
    if (!column) continue;
    if (!columns.includes(column)) {
      errors.push(`Колонка «${column}» не найдена в файле (${field})`);
    }
  }

  return { mapping, errors };
}

export function normalizePriceValue(value: unknown): {
  price: number | null;
  error?: string;
} {
  if (value === undefined || value === null || cellText(value) === '') {
    return { price: null, error: 'Не указана цена' };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 0) {
      return { price: null, error: 'Цена должна быть не меньше 0' };
    }
    return { price: roundMoney(value) };
  }

  let text = cellText(value).toLowerCase();
  text = text.replace(/\s*(сом|tjs|руб|rub)\b/gi, '').trim();
  text = text.replace(/\s+/g, '');
  if (text.includes(',') && text.includes('.')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else {
    text = text.replace(',', '.');
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { price: null, error: 'Некорректная цена' };
  }
  return { price: roundMoney(parsed) };
}

export function normalizeQuantityValue(value: unknown): {
  quantity: number;
  error?: string;
} {
  if (value === undefined || value === null || cellText(value) === '') {
    return { quantity: 0 };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.trunc(value);
    if (rounded < 0) {
      return { quantity: 0, error: 'Количество не может быть отрицательным' };
    }
    return { quantity: rounded };
  }

  const text = cellText(value).replace(/\s+/g, '').replace(',', '.');
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    return { quantity: 0, error: 'Некорректное количество' };
  }
  const rounded = Math.trunc(parsed);
  if (rounded < 0) {
    return { quantity: 0, error: 'Количество не может быть отрицательным' };
  }
  return { quantity: rounded };
}

export function normalizeImportRow(
  source: Record<string, string>,
  mapping: ResolvedColumnMapping,
): { normalized: NormalizedImportRow; errors: string[] } {
  const rawPartNumber = mapping.partNumberColumn
    ? source[mapping.partNumberColumn]?.trim() || null
    : null;
  const rawName = mapping.nameColumn
    ? source[mapping.nameColumn]?.trim() || null
    : null;
  const rawPrice = mapping.priceColumn
    ? source[mapping.priceColumn]
    : undefined;
  const rawQuantity = mapping.quantityColumn
    ? source[mapping.quantityColumn]
    : undefined;

  const errors: string[] = [];
  const partNumber = rawPartNumber
    ? normalizePartNumber(rawPartNumber) || null
    : null;
  const name = rawName ? normalizePartName(rawName) || null : null;

  if (!partNumber && !name) {
    errors.push('Укажите артикул или наименование');
  }
  if (!rawName?.trim()) {
    errors.push('Не указано наименование');
  }

  const priceResult = normalizePriceValue(rawPrice);
  if (priceResult.error) errors.push(priceResult.error);

  const quantityResult = normalizeQuantityValue(rawQuantity);
  if (quantityResult.error) errors.push(quantityResult.error);

  return {
    normalized: {
      partNumber,
      rawPartNumber,
      name,
      rawName,
      price: priceResult.price,
      quantity: quantityResult.quantity,
    },
    errors,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

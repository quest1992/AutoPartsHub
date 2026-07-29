import { BadRequestException, Injectable } from '@nestjs/common';
import { PartPosition, PartSide } from '@prisma/client';
import * as XLSX from 'xlsx';
import { normalizePartName } from '../../common/utils/part-name-normalizer';
import {
  ImportSourceRow,
  InventoryImportPreviewRow,
} from './types/inventory-import.types';

export const MAX_IMPORT_ROWS = 10_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const REQUIRED = ['Наименование', 'Количество', 'Цена продажи'];
const HEADERS = [
  'Наименование',
  'Артикул',
  'OEM',
  'Категория',
  'Марка автомобиля',
  'Модель автомобиля',
  'Год от',
  'Год до',
  'Сторона',
  'Позиция',
  'Количество',
  'Цена продажи',
  'Цена закупки',
  'Производитель',
  'Склад',
  'Примечание',
];

@Injectable()
export class InventoryImportSmartParserService {
  parse(file?: { buffer: Buffer; originalname: string }): Array<{
    rowNumber: number;
    source: ImportSourceRow;
    normalized: InventoryImportPreviewRow['normalized'];
    errors: string[];
    warnings: string[];
  }> {
    if (!file?.buffer?.length)
      throw new BadRequestException('Файл не передан или пуст');
    if (file.buffer.length > MAX_FILE_SIZE)
      throw new BadRequestException('Файл превышает 10 МБ');
    if (!/\.xlsx$/i.test(file.originalname))
      throw new BadRequestException('Поддерживается только формат .xlsx');
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, {
        type: 'buffer',
        cellDates: true,
        cellFormula: false,
      });
    } catch {
      throw new BadRequestException('Не удалось прочитать XLSX-файл');
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new BadRequestException('Excel-файл не содержит листов');
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });
    const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
    const headers = Array.from({ length: range.e.c + 1 }, (_, column) =>
      String(
        sheet[XLSX.utils.encode_cell({ r: range.s.r, c: column })]?.v ?? '',
      ).trim(),
    );
    const normalizedHeaders = headers.map((header) =>
      header.replace(/\*+$/, '').trim(),
    );
    const missing = REQUIRED.filter(
      (required) => !normalizedHeaders.includes(required),
    );
    if (missing.length)
      throw new BadRequestException(
        `Отсутствуют обязательные колонки: ${missing.join(', ')}`,
      );
    if (!rows.length)
      throw new BadRequestException('Excel-файл не содержит строк с товарами');
    if (rows.length > MAX_IMPORT_ROWS)
      throw new BadRequestException(`Максимум ${MAX_IMPORT_ROWS} строк`);
    return rows.map((raw, index) => this.normalize(raw, index + 2));
  }

  createTemplate(): Buffer {
    const example = [
      'Радиатор охлаждения',
      'RAD-001',
      '16400-0V240',
      'Система охлаждения',
      'Toyota',
      'Camry',
      2018,
      2022,
      'NONE',
      'FRONT',
      5,
      850,
      600,
      'Denso',
      'Основной склад',
      'Оригинал',
    ];
    const data = XLSX.utils.aoa_to_sheet([
      HEADERS.map((h, i) => (i === 0 || i === 10 || i === 11 ? `${h}*` : h)),
      example,
    ]);
    data['!cols'] = HEADERS.map((header) => ({
      wch: Math.max(14, header.length + 3),
    }));
    const instruction = XLSX.utils.aoa_to_sheet([
      ['Инструкция по импорту остатков'],
      ['Обязательные колонки', 'Наименование, Количество, Цена продажи'],
      ['Сторона', 'NONE, LEFT, RIGHT'],
      ['Позиция', 'NONE, FRONT, REAR'],
      [
        'Числа',
        'Количество — целое неотрицательное; цены — неотрицательные числа',
      ],
      [
        'Неизвестные позиции',
        'Не создаются автоматически. Выберите позицию центрального каталога вручную.',
      ],
      ['Максимум строк', String(MAX_IMPORT_ROWS)],
      ['Максимальный файл', '10 МБ, только .xlsx'],
    ]);
    instruction['!cols'] = [{ wch: 24 }, { wch: 90 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, data, 'Товары');
    XLSX.utils.book_append_sheet(workbook, instruction, 'Инструкция');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private normalize(raw: Record<string, unknown>, rowNumber: number) {
    const text = (key: string) => String(raw[key] ?? '').trim();
    const number = (key: string, required = false) => {
      const value = raw[key];
      if ((value == null || value === '') && !required) return undefined;
      const parsed =
        typeof value === 'number'
          ? value
          : Number(String(value).replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    };
    const errors: string[] = [];
    const warnings: string[] = [];
    const name = text('Наименование') || text('Наименование*');
    const quantity = number('Количество', true) ?? number('Количество*', true)!;
    const salePrice =
      number('Цена продажи', true) ?? number('Цена продажи*', true)!;
    const purchasePrice = number('Цена закупки');
    const yearFrom = number('Год от');
    const yearTo = number('Год до');
    if (!name) errors.push('Не указано наименование');
    if (!Number.isInteger(quantity) || quantity < 0)
      errors.push('Количество должно быть целым неотрицательным числом');
    if (!Number.isFinite(salePrice) || salePrice < 0)
      errors.push('Цена продажи должна быть неотрицательным числом');
    if (
      purchasePrice !== undefined &&
      (!Number.isFinite(purchasePrice) || purchasePrice < 0)
    )
      errors.push('Неверная цена закупки');
    if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo)
      errors.push('Год от больше года до');
    const nameSide = this.detectSide(name);
    const namePosition = this.detectPosition(name);
    const columnSide = this.enumValue(
      text('Сторона'),
      PartSide,
      'стороны',
      errors,
    );
    const columnPosition = this.enumValue(
      text('Позиция'),
      PartPosition,
      'позиции',
      errors,
    );
    if (columnSide && nameSide !== PartSide.NONE && columnSide !== nameSide)
      warnings.push(
        `В названии указано ${nameSide}, но в колонке указано ${columnSide}`,
      );
    if (
      columnPosition &&
      namePosition !== PartPosition.NONE &&
      columnPosition !== namePosition
    )
      warnings.push(
        `В названии указано ${namePosition}, но в колонке указано ${columnPosition}`,
      );
    if (!columnSide && nameSide !== PartSide.NONE)
      warnings.push('Сторона определена автоматически');
    if (!columnPosition && namePosition !== PartPosition.NONE)
      warnings.push('Позиция определена автоматически');
    if (!text('Склад')) warnings.push('Склад не указан');
    if (
      purchasePrice !== undefined &&
      Number.isFinite(purchasePrice) &&
      purchasePrice > salePrice
    )
      warnings.push('Закупочная цена выше продажной');
    const source: ImportSourceRow = {
      name,
      quantity,
      salePrice,
      ...(text('Артикул') && { article: text('Артикул') }),
      ...(text('OEM') && { oem: text('OEM') }),
      ...(text('Категория') && { category: text('Категория') }),
      ...(text('Марка автомобиля') && {
        vehicleMake: text('Марка автомобиля'),
      }),
      ...(text('Модель автомобиля') && {
        vehicleModel: text('Модель автомобиля'),
      }),
      ...(yearFrom !== undefined && { yearFrom }),
      ...(yearTo !== undefined && { yearTo }),
      ...(text('Сторона') && { side: text('Сторона') }),
      ...(text('Позиция') && { position: text('Позиция') }),
      ...(purchasePrice !== undefined && { purchasePrice }),
      ...(text('Производитель') && { manufacturer: text('Производитель') }),
      ...(text('Склад') && { warehouse: text('Склад') }),
      ...(text('Примечание') && { note: text('Примечание') }),
    };
    return {
      rowNumber,
      source,
      normalized: {
        name,
        normalizedName: normalizePartName(name),
        side: columnSide ?? nameSide,
        position: columnPosition ?? namePosition,
      },
      errors,
      warnings,
    };
  }

  private enumValue<T extends Record<string, string>>(
    value: string,
    values: T,
    label: string,
    errors: string[],
  ): T[keyof T] | undefined {
    if (!value) return undefined;
    const upper = value.toUpperCase();
    if (!Object.values(values).includes(upper)) {
      errors.push(`Неверное значение ${label}: ${value}`);
      return undefined;
    }
    return upper as T[keyof T];
  }

  private detectSide(name: string): PartSide {
    if (/(^|\s)(лев(ый|ая|ое|ые|ого|ой)|left)(\s|$)/iu.test(name))
      return PartSide.LEFT;
    if (/(^|\s)(прав(ый|ая|ое|ые|ого|ой)|right)(\s|$)/iu.test(name))
      return PartSide.RIGHT;
    return PartSide.NONE;
  }

  private detectPosition(name: string): PartPosition {
    if (/(^|\s)(передн(ий|яя|ее|ие|его|ей)|front)(\s|$)/iu.test(name))
      return PartPosition.FRONT;
    if (/(^|\s)(задн(ий|яя|ее|ие|его|ей)|rear)(\s|$)/iu.test(name))
      return PartPosition.REAR;
    return PartPosition.NONE;
  }
}

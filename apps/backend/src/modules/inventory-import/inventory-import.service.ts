import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../../common/utils/part-name-normalizer';

import {
  InventoryImportJobStatus,
  InventoryMovementType,
  PartCondition,
  PartPosition,
  PartSide,
  Prisma,
  UserRole,
} from '@prisma/client';


import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { PartCatalogMatchingService } from '../part-catalog/part-catalog-matching.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';

import {
  ColumnMappingInput,
  NormalizedImportRow,
  parseExcelFile,
  PreviewRowStatus,
  resolveColumnMapping,
  suggestColumnMapping,
  normalizeImportRow,
} from './inventory-import.parser';

const PREVIEW_LIMIT = 20;
const BATCH_SIZE = 300;
const MAX_ERRORS = 100;

export interface ImportPreviewRow {
  rowNumber: number;
  source: Record<string, string>;
  normalized: NormalizedImportRow & {
    displayName: string | null;
    displayPrice: number | null;
  };
  status: PreviewRowStatus;
  errors: string[];
  catalogItemId: string | null;
}

@Injectable()
export class InventoryImportService {
constructor(
  private readonly prisma: PrismaService,
  private readonly matchingService: PartCatalogMatchingService,
) {}

  async preview(
    file: { buffer: Buffer; originalname: string },
    actor: InventoryActor,
    shopId?: string,
    mappingInput?: ColumnMappingInput,
  ) {
    this.resolveShop(actor, shopId);
    const parsed = this.readWorksheet(file);
    const suggestedMapping = suggestColumnMapping(parsed.columns);
    const { mapping, errors: mappingErrors } = resolveColumnMapping(
      parsed.columns,
      mappingInput ?? {
        categoryColumn: suggestedMapping.category,
        subcategoryColumn: suggestedMapping.subcategory,
        partNumberColumn: suggestedMapping.partNumber,
        nameColumn: suggestedMapping.name,
        priceColumn: suggestedMapping.price,
        quantityColumn: suggestedMapping.quantity,
      },
    );

    const evaluated = await this.evaluateRows(parsed.rows, mapping);
    const validRows = evaluated.filter((row) => row.status === 'valid').length;
    const invalidRows = evaluated.filter((row) => row.status === 'invalid').length;

    return {
      fileName: parsed.fileName,
      worksheetName: parsed.worksheetName,
      totalRows: evaluated.length,
      columns: parsed.columns,
      suggestedMapping: {
        category: suggestedMapping.category ?? null,
        subcategory: suggestedMapping.subcategory ?? null,
        partNumber: suggestedMapping.partNumber ?? null,
        name: suggestedMapping.name ?? null,
        price: suggestedMapping.price ?? null,
        quantity: suggestedMapping.quantity ?? null,
      },
      appliedMapping: {
        categoryColumn: mapping.categoryColumn,
        subcategoryColumn: mapping.subcategoryColumn,
        partNumberColumn: mapping.partNumberColumn,
        nameColumn: mapping.nameColumn,
        priceColumn: mapping.priceColumn,
        quantityColumn: mapping.quantityColumn,
      },
      mappingErrors,
      previewRows: evaluated.slice(0, PREVIEW_LIMIT).map((row) => ({
        rowNumber: row.rowNumber,
        source: row.source,
        normalized: {
          category: row.normalized.categoryName,
          subcategory: row.normalized.subcategoryName,
          partNumber: row.normalized.partNumber,
          name: row.normalized.displayName,
          price: row.normalized.displayPrice,
          quantity: row.normalized.quantity,
        },
        status: row.status,
        errors: row.errors,
      })),
      summary: {
        validRows,
        invalidRows,
        requiresReviewRows: evaluated.filter(
          (row) => row.status === 'requires_review',
        ).length,
      },
    };
  }

  async confirm(
    file: { buffer: Buffer; originalname: string },
    actor: InventoryActor,
    shopId: string | undefined,
    mappingInput: ColumnMappingInput,
  ) {
    const resolvedShopId = this.resolveShop(actor, shopId);
    const parsed = this.readWorksheet(file);
    const { mapping, errors: mappingErrors } = resolveColumnMapping(
      parsed.columns,
      mappingInput,
    );
    if (mappingErrors.length) {
      throw new BadRequestException(mappingErrors.join('; '));
    }

    const job = await this.prisma.inventoryImportJob.create({
      data: {
        shopId: resolvedShopId,
        fileName: parsed.fileName,
        status: InventoryImportJobStatus.PROCESSING,
        totalRows: parsed.rows.length,
        createdByUserId: actor.id,
      },
    });

    const evaluated = await this.evaluateRows(parsed.rows, mapping);
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      requiresReview: 0,
      failed: 0,
    };
    const errors: Array<{ rowNumber: number; message: string }> = [];

    try {
      for (let start = 0; start < evaluated.length; start += BATCH_SIZE) {
        const batch = evaluated.slice(start, start + BATCH_SIZE);
        await this.prisma.$transaction(async (tx) => {
          for (const row of batch) {
            const outcome = await this.processImportRow(
              tx,
              row,
              resolvedShopId,
              actor,
            );
            stats[outcome.kind] += 1;
            if (outcome.error && errors.length < MAX_ERRORS) {
              errors.push({
                rowNumber: row.rowNumber,
                message: outcome.error,
              });
            }
          }
        });
      }

      const status =
        stats.failed > 0
          ? InventoryImportJobStatus.COMPLETED_WITH_ERRORS
          : InventoryImportJobStatus.COMPLETED;

      await this.prisma.inventoryImportJob.update({
        where: { id: job.id },
        data: {
          status,
          importedRows: stats.imported,
          updatedRows: stats.updated,
          skippedRows: stats.skipped,
          failedRows: stats.failed,
          requiresReviewRows: stats.requiresReview,
          completedAt: new Date(),
        },
      });

      return {
        jobId: job.id,
        totalRows: evaluated.length,
        imported: stats.imported,
        updated: stats.updated,
        skipped: stats.skipped,
        requiresReview: stats.requiresReview,
        failed: stats.failed,
        errors,
      };
    } catch (error) {
      await this.prisma.inventoryImportJob.update({
        where: { id: job.id },
        data: {
          status: InventoryImportJobStatus.FAILED,
          failedRows: evaluated.length,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private readWorksheet(file: { buffer: Buffer; originalname: string }) {
    try {
      return parseExcelFile(file);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      switch (code) {
        case 'FILE_MISSING':
          throw new BadRequestException('Файл не передан');
        case 'FILE_TOO_LARGE':
          throw new BadRequestException('Файл слишком большой');
        case 'FILE_TYPE_INVALID':
          throw new BadRequestException(
            'Поддерживаются только файлы .xlsx и .xls',
          );
        case 'FILE_READ_FAILED':
          throw new BadRequestException('Не удалось прочитать Excel-файл');
        case 'WORKBOOK_EMPTY':
        case 'NO_DATA_ROWS':
        case 'NO_USABLE_ROWS':
          throw new BadRequestException('В файле не найдены товары');
        default:
          throw new BadRequestException('Не удалось обработать Excel-файл');
      }
    }
  }

  private async evaluateRows(
    rows: Array<{ rowNumber: number; source: Record<string, string> }>,
    mapping: ReturnType<typeof resolveColumnMapping>['mapping'],
  ): Promise<ImportPreviewRow[]> {
    const result: ImportPreviewRow[] = [];
    for (const row of rows) {
      const { normalized, errors } = normalizeImportRow(row.source, mapping);
      let status: PreviewRowStatus = 'valid';
      let catalogItemId: string | null = null;

      if (errors.length) {
        status = 'invalid';
      } else {
        const match = await this.matchCatalog(normalized);
        catalogItemId = match.partCatalogItemId;
        if (!match.matched || match.requiresReview) {
          status = 'requires_review';
        }
      }

      result.push({
        rowNumber: row.rowNumber,
        source: row.source,
        normalized: {
          ...normalized,
          displayName: normalized.rawName,
          displayPrice: normalized.price,
        },
        status,
        errors,
        catalogItemId,
      });
    }
    return result;
  }

  private async matchCatalog(normalized: NormalizedImportRow) {
    return this.matchingService.match({
      partNumber: normalized.partNumber,
      name: normalized.name,
    });
  }

  private async processImportRow(
    tx: Prisma.TransactionClient,
    row: ImportPreviewRow,
    shopId: string,
    actor: InventoryActor,
  ): Promise<{
    kind: 'imported' | 'updated' | 'skipped' | 'requiresReview' | 'failed';
    error?: string;
  }> {
    if (row.status === 'invalid') {
      return {
        kind: 'skipped',
        error: row.errors.join('; ') || 'Строка содержит ошибки',
      };
    }

    const normalized = row.normalized;

    try {
      const match = await this.matchCatalog(normalized);
      const existing = await this.findExistingInventory(
        tx,
        shopId,
        match.partCatalogItemId ?? row.catalogItemId,
        normalized.partNumber,
        normalized.name,
      );

 let partCatalogItemId = match.partCatalogItemId;

if (!match.matched || !partCatalogItemId) {
  const category = await this.resolveImportedCategory(tx, normalized);

  const sequence = await tx.appSequence.upsert({
    where: { key: 'PART_CATALOG' },
    create: { key: 'PART_CATALOG', value: 1 },
    update: { value: { increment: 1 } },
  });

const name =
  normalized.rawName?.trim() ||
  normalized.name?.trim() ||
  'Без названия';

  const created = await tx.partCatalogItem.create({
    data: {
      internalCode: `PRT-${String(sequence.value).padStart(6, '0')}`,
      name,
      normalizedName: normalizePartName(name),
      searchTokens: getPartNameSearchTokens(name),
      slug: `import-${sequence.value}`,
      categoryId: category.id,
      side: PartSide.NONE,
      position: PartPosition.NONE,
      isUniversal: false,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  partCatalogItemId = created.id;
}

await this.createInventoryItem(
  tx,
  shopId,
  partCatalogItemId,
  normalized,
  actor,
);
      return { kind: 'imported' };
    } catch (error) {
      return {
        kind: 'failed',
        error: this.publicErrorMessage(error),
      };
    }
  }

  private async resolveImportedCategory(
    tx: Prisma.TransactionClient,
    normalized: NormalizedImportRow,
  ): Promise<{ id: string }> {
    const categoryName = normalized.categoryName?.trim();

    if (!categoryName) {
      throw new BadRequestException('Не указана категория товара');
    }

    const parentCategory = await tx.partCategory.findFirst({
      where: {
        parentId: null,
        isActive: true,
        name: {
          equals: categoryName,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!parentCategory) {
      throw new NotFoundException(
        `Категория «${categoryName}» не найдена`,
      );
    }

    const subcategoryName = normalized.subcategoryName?.trim();

    if (!subcategoryName) {
      return { id: parentCategory.id };
    }

    const subcategory = await tx.partCategory.findFirst({
      where: {
        parentId: parentCategory.id,
        isActive: true,
        name: {
          equals: subcategoryName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (!subcategory) {
      throw new NotFoundException(
        `Подкатегория «${subcategoryName}» не найдена в категории «${categoryName}»`,
      );
    }

    return subcategory;
  }

  private async createInventoryItem(
    tx: Prisma.TransactionClient,
    shopId: string,
    partCatalogItemId: string,
    normalized: NormalizedImportRow,
    actor: InventoryActor,
  ) {
    const part = await tx.partCatalogItem.findUnique({
      where: { id: partCatalogItemId },
      select: { isActive: true, category: { select: { isActive: true } } },
    });
    if (!part) throw new NotFoundException('Деталь каталога не найдена');
    if (!part.isActive) {
      throw new BadRequestException('Нельзя добавить неактивную деталь каталога');
    }
    if (!part.category.isActive) {
      throw new BadRequestException('Категория детали отключена');
    }

    const item = await tx.shopInventoryItem.create({
      data: {
        shopId,
        partCatalogItemId,
        price: new Decimal(normalized.price ?? 0),
        quantity: normalized.quantity,
        oemNumber: normalized.rawPartNumber,
        sku: normalized.rawPartNumber,
        condition: PartCondition.NEW,
        currency: 'TJS',
      },
    });

    if (item.quantity > 0) {
      await tx.inventoryMovement.create({
        data: {
          shopId,
          inventoryItemId: item.id,
          userId: actor.id,
          type: InventoryMovementType.INITIAL_BALANCE,
          change: item.quantity,
          quantityBefore: 0,
          quantityAfter: item.quantity,
          notes: 'Начальный остаток (импорт Excel)',
        },
      });
    }
  }

  private async findExistingInventory(
    tx: Prisma.TransactionClient,
    shopId: string,
    catalogItemId: string | null | undefined,
    normalizedPartNumber: string | null,
    normalizedName: string | null,
  ) {
    if (catalogItemId) {
      const byCatalog = await tx.shopInventoryItem.findFirst({
        where: { shopId, partCatalogItemId: catalogItemId, isActive: true },
      });
      if (byCatalog) return byCatalog;
    }

    if (normalizedPartNumber) {
      const byPartNumber = await tx.shopInventoryItem.findMany({
        where: {
          shopId,
          isActive: true,
          OR: [{ oemNumber: { not: null } }, { sku: { not: null } }],
        },
        take: 500,
      });
      const matched = byPartNumber.find((item) => {
        const oem = item.oemNumber?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const sku = item.sku?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return (
          oem === normalizedPartNumber || sku === normalizedPartNumber
        );
      });
      if (matched) return matched;
    }

    if (normalizedName) {
      return tx.shopInventoryItem.findFirst({
        where: {
          shopId,
          isActive: true,
          partCatalogItem: { normalizedName },
        },
      });
    }

    return null;
  }

  private async updateInventoryItem(
    tx: Prisma.TransactionClient,
    existing: { id: string; shopId: string; quantity: number },
    normalized: NormalizedImportRow,
    actor: InventoryActor,
  ) {
    const nextQuantity = normalized.quantity;
    const nextPrice = new Decimal(normalized.price ?? 0);
    const quantityChanged = existing.quantity !== nextQuantity;

    await tx.shopInventoryItem.update({
      where: { id: existing.id },
      data: {
        price: nextPrice,
        quantity: nextQuantity,
        ...(normalized.rawPartNumber
          ? { oemNumber: normalized.rawPartNumber, sku: normalized.rawPartNumber }
          : {}),
        updatedAt: new Date(),
      },
    });

    if (quantityChanged) {
      await tx.inventoryMovement.create({
        data: {
          shopId: existing.shopId,
          inventoryItemId: existing.id,
          userId: actor.id,
          type: InventoryMovementType.ADJUSTMENT,
          change: nextQuantity - existing.quantity,
          quantityBefore: existing.quantity,
          quantityAfter: nextQuantity,
          notes: 'Обновление при импорте Excel',
        },
      });
    }
  }

  private resolveShop(actor: InventoryActor, requestedShopId?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (!requestedShopId) {
        throw new BadRequestException(
          'Для SUPER_ADMIN необходимо указать магазин',
        );
      }
      return requestedShopId;
    }
    if (!actor.shopId) {
      throw new ForbiddenException('Пользователь не привязан к магазину');
    }
    if (requestedShopId && requestedShopId !== actor.shopId) {
      throw new ForbiddenException('Нельзя импортировать в чужой магазин');
    }
    return actor.shopId;
  }

  private publicErrorMessage(error: unknown) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      return error.message;
    }
    return error instanceof Error && error.message
      ? error.message
      : 'Не удалось обработать строку';
  }
}
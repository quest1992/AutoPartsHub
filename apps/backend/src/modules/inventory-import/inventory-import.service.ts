import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryImportStatus,
  InventoryMovementType,
  PartCondition,
  Prisma,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { buildInventoryKey } from '../../common/utils/inventory-key';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { ShopWarehousesService } from '../shop-warehouses/shop-warehouses.service';
import { ConfirmInventoryImportDto } from './dto/confirm-inventory-import.dto';
import { InventoryImportMatcherService } from './inventory-import-matcher.service';
import { InventoryImportSmartParserService } from './inventory-import-smart-parser.service';
import {
  InventoryImportPreviewRow,
  ValidationStatus,
} from './types/inventory-import.types';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 200;

@Injectable()
export class InventoryImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: InventoryImportSmartParserService,
    private readonly matcher: InventoryImportMatcherService,
    private readonly warehouses: ShopWarehousesService,
  ) {}

  template() {
    return this.parser.createTemplate();
  }

  async preview(
    file: { buffer: Buffer; originalname: string },
    actor: InventoryActor,
    requestedShopId?: string,
  ) {
    const shopId = this.resolveShop(actor, requestedShopId);
    const parsed = this.parser.parse(file);
    const warehouseList = await this.prisma.shopWarehouse.findMany({
      where: { shopId, isActive: true },
    });
    const defaultWarehouse = warehouseList.find(
      (warehouse) => warehouse.isDefault,
    );
    const rows: InventoryImportPreviewRow[] = [];
    for (const row of parsed) {
      const requested = row.source.warehouse?.trim().toLowerCase();
      const warehouse = requested
        ? warehouseList.find(
            (candidate) =>
              candidate.name.trim().toLowerCase() === requested ||
              candidate.code?.trim().toLowerCase() === requested,
          )
        : defaultWarehouse;
      if (!warehouse)
        row.errors.push(
          requested ? 'Склад не найден' : 'Основной склад не настроен',
        );
      else
        row.normalized = {
          ...row.normalized,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
        };
      const match = row.errors.length
        ? { status: 'NOT_FOUND' as const }
        : await this.matcher.match(
            row.normalized.name,
            row.normalized.side,
            row.normalized.position,
          );
      const warnings = [...row.warnings];
      if (match.status === 'NOT_FOUND')
        warnings.push('Позиция центрального каталога не найдена');
      if (match.status === 'CATEGORY_MATCH')
        warnings.push(
          match.categoryMatch?.message ??
            'Найдена категория, но не выбрана конкретная позиция каталога',
        );
      if (match.status === 'MULTIPLE')
        warnings.push('Найдено несколько совпадений');
      if (match.status === 'FUZZY' && (match.score ?? 0) < 0.75)
        warnings.push('Слабое совпадение');
      rows.push({
        ...row,
        match,
        validation: {
          status: row.errors.length
            ? 'ERROR'
            : match.status === 'NOT_FOUND' ||
                match.status === 'MULTIPLE' ||
                (match.status === 'CATEGORY_MATCH' && !match.catalogItemId) ||
                warnings.some((item) => item.includes('но в колонке'))
              ? 'NEEDS_REVIEW'
              : 'VALID',
          errors: row.errors,
          warnings,
        },
      });
    }
    this.markDuplicates(rows);
    const session = await this.prisma.inventoryImportSession.create({
      data: {
        shopId,
        userId: actor.id,
        status: InventoryImportStatus.PREVIEW,
        fileName: file.originalname.slice(0, 200),
        totalRows: rows.length,
        previewData: rows as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
      select: { id: true },
    });
    const count = (status: ValidationStatus) =>
      rows.filter((row) => row.validation.status === status).length;
    return {
      importSessionId: session.id,
      totalRows: rows.length,
      validRows: count('VALID'),
      matchedRows: rows.filter((row) =>
        ['EXACT', 'ALIAS', 'FUZZY'].includes(row.match.status),
      ).length,
      reviewRows: count('NEEDS_REVIEW'),
      errorRows: count('ERROR'),
      duplicateRows: count('DUPLICATE'),
      rows,
    };
  }

  async confirm(
    sessionId: string,
    dto: ConfirmInventoryImportDto,
    actor: InventoryActor,
  ) {
    const session = await this.prisma.inventoryImportSession.findUnique({
      where: { id: sessionId },
    });
    if (
      !session ||
      (actor.role !== UserRole.SUPER_ADMIN && session.userId !== actor.id)
    )
      throw new NotFoundException('Сессия импорта не найдена');
    if (actor.role !== UserRole.SUPER_ADMIN && session.shopId !== actor.shopId)
      throw new ForbiddenException(
        'Нельзя подтвердить сессию другого магазина',
      );
    if (session.status !== InventoryImportStatus.PREVIEW)
      throw new BadRequestException(
        'Эта сессия уже подтверждена или недоступна',
      );
    if (session.expiresAt <= new Date()) {
      await this.prisma.inventoryImportSession.update({
        where: { id: session.id },
        data: { status: InventoryImportStatus.EXPIRED },
      });
      throw new BadRequestException('Сессия импорта истекла');
    }
    const previewRows =
      session.previewData as unknown as InventoryImportPreviewRow[];
    const previewByNumber = new Map(
      previewRows.map((row) => [row.rowNumber, row]),
    );
    const selected = dto.rows.filter((row) => row.include);
    await this.prisma.inventoryImportSession.update({
      where: { id: session.id },
      data: { status: InventoryImportStatus.PROCESSING },
    });
    const results: Array<{
      rowNumber: number;
      status: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
      inventoryItemId?: string;
      message: string;
    }> = [];
    let mergedDuplicates = 0;
    const processedDuplicateKeys = new Map<string, number>();

    for (let start = 0; start < selected.length; start += BATCH_SIZE) {
      const batch = selected.slice(start, start + BATCH_SIZE);
      try {
        const batchResults = await this.prisma.$transaction(async (tx) => {
          const current: Array<{
            rowNumber: number;
            status: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
            inventoryItemId?: string;
            message: string;
          }> = [];
          for (const input of batch) {
            const preview = previewByNumber.get(input.rowNumber);
            if (!preview) {
              current.push(
                this.skipped(input.rowNumber, 'Строка отсутствует в preview'),
              );
              continue;
            }
            if (preview.validation.status === 'ERROR') {
              current.push(
                this.skipped(
                  input.rowNumber,
                  'Строка содержит ошибки валидации',
                ),
              );
              continue;
            }
            if (!input.catalogItemId) {
              current.push(
                this.skipped(
                  input.rowNumber,
                  'Не выбрана позиция центрального каталога',
                ),
              );
              continue;
            }
            const duplicateKey = this.duplicateKey(
              preview,
              input.catalogItemId,
              input.warehouseId,
            );
            const firstRow = processedDuplicateKeys.get(duplicateKey);
            if (firstRow && input.duplicateAction === 'KEEP_FIRST') {
              current.push(
                this.skipped(
                  input.rowNumber,
                  `Оставлена первая строка ${firstRow}`,
                ),
              );
              continue;
            }
            if (
              firstRow &&
              (input.duplicateAction ?? 'MERGE_QUANTITY') === 'MERGE_QUANTITY'
            )
              mergedDuplicates += 1;
            else processedDuplicateKeys.set(duplicateKey, input.rowNumber);
            current.push(
              await this.upsertInventory(
                tx,
                session.shopId,
                actor.id,
                input,
                dto.mode,
              ),
            );
          }
          return current;
        });
        results.push(...batchResults);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ошибка пакета';
        results.push(
          ...batch.map((row) => ({
            rowNumber: row.rowNumber,
            status: 'FAILED' as const,
            message,
          })),
        );
      }
    }
    for (const row of dto.rows.filter((row) => !row.include))
      results.push(this.skipped(row.rowNumber, 'Исключено пользователем'));
    const summary = {
      total: dto.rows.length,
      imported: results.filter((row) => row.status === 'CREATED').length,
      updated: results.filter((row) => row.status === 'UPDATED').length,
      skipped: results.filter((row) => row.status === 'SKIPPED').length,
      failed: results.filter((row) => row.status === 'FAILED').length,
      mergedDuplicates,
    };
    const response = {
      sessionId,
      status: 'COMPLETED' as const,
      summary,
      rows: results.sort((a, b) => a.rowNumber - b.rowNumber),
    };
    await this.prisma.inventoryImportSession.update({
      where: { id: session.id },
      data: {
        status: InventoryImportStatus.COMPLETED,
        resultData: response,
      },
    });
    return response;
  }

  private async upsertInventory(
    tx: Prisma.TransactionClient,
    shopId: string,
    userId: string,
    input: ConfirmInventoryImportDto['rows'][number],
    mode: ConfirmInventoryImportDto['mode'],
  ) {
    const part = await tx.partCatalogItem.findFirst({
      where: {
        id: input.catalogItemId,
        isActive: true,
        category: { isActive: true },
      },
      select: { id: true, name: true },
    });
    if (!part)
      throw new BadRequestException(
        'Выбранная позиция каталога неактивна или не найдена',
      );
    const article = input.article?.trim() || null;
    const oem = input.oem?.trim() || null;
    const warehouse = await this.warehouses.resolve(
      tx,
      shopId,
      input.warehouseId,
    );
    const inventoryKey = buildInventoryKey({
      shopId,
      warehouseId: warehouse.id,
      partCatalogItemId: part.id,
      sku: article,
      oemNumber: oem,
      brand: input.manufacturer,
      condition: PartCondition.NEW,
    });
    const existing = await tx.shopInventoryItem.findFirst({
      where: { inventoryKey },
      select: { id: true, quantity: true, shopId: true },
    });
    if (!existing) {
      const created = await tx.shopInventoryItem.create({
        data: {
          shopId,
          warehouseId: warehouse.id,
          inventoryKey,
          partCatalogItemId: part.id,
          brand: input.manufacturer?.trim() || null,
          sku: article,
          oemNumber: oem,
          condition: PartCondition.NEW,
          price: new Decimal(input.salePrice),
          quantity: input.quantity,
          minQuantity: 0,
          currency: 'TJS',
          notes: input.note?.trim() || null,
        },
        select: { id: true },
      });
      if (input.quantity > 0)
        await tx.inventoryMovement.create({
          data: {
            shopId,
            inventoryItemId: created.id,
            userId,
            warehouseId: warehouse.id,
            warehouseNameSnapshot: warehouse.name,
            partCatalogItemId: part.id,
            partCatalogItemNameSnapshot: part.name,
            documentType: 'IMPORT',
            type: InventoryMovementType.INITIAL_BALANCE,
            change: input.quantity,
            quantityBefore: 0,
            quantityAfter: input.quantity,
            notes: 'Импорт из Excel',
          },
        });
      return {
        rowNumber: input.rowNumber,
        status: 'CREATED' as const,
        inventoryItemId: created.id,
        message: 'Остаток создан',
      };
    }
    const quantity =
      mode === 'ADD_QUANTITY'
        ? existing.quantity + input.quantity
        : input.quantity;
    await tx.shopInventoryItem.update({
      where: { id: existing.id },
      data: {
        quantity,
        price: new Decimal(input.salePrice),
        brand: input.manufacturer?.trim() || null,
        sku: article,
        oemNumber: oem,
        notes: input.note?.trim() || null,
        isActive: true,
      },
    });
    if (quantity !== existing.quantity)
      await tx.inventoryMovement.create({
        data: {
          shopId,
          inventoryItemId: existing.id,
          userId,
          warehouseId: warehouse.id,
          warehouseNameSnapshot: warehouse.name,
          partCatalogItemId: part.id,
          partCatalogItemNameSnapshot: part.name,
          documentType: 'IMPORT',
          type: InventoryMovementType.ADJUSTMENT,
          change: quantity - existing.quantity,
          quantityBefore: existing.quantity,
          quantityAfter: quantity,
          notes: `Импорт из Excel (${mode})`,
        },
      });
    return {
      rowNumber: input.rowNumber,
      status: 'UPDATED' as const,
      inventoryItemId: existing.id,
      message:
        mode === 'ADD_QUANTITY'
          ? 'Количество добавлено'
          : 'Количество заменено',
    };
  }

  private markDuplicates(rows: InventoryImportPreviewRow[]) {
    const seen = new Map<string, number>();
    for (const row of rows) {
      if (row.validation.status === 'ERROR') continue;
      const key = [
        row.normalized.normalizedName,
        row.source.article?.toUpperCase() ?? '',
        row.source.oem?.toUpperCase() ?? '',
        row.normalized.side,
        row.normalized.position,
        row.source.warehouse?.toLowerCase() ?? '',
      ].join('|');
      const first = seen.get(key);
      if (first) {
        row.validation.status = 'DUPLICATE';
        row.validation.warnings.push(`Возможный дубль строки ${first}`);
      } else seen.set(key, row.rowNumber);
    }
  }

  private duplicateKey(
    row: InventoryImportPreviewRow,
    catalogItemId: string,
    warehouse?: string,
  ) {
    return [
      catalogItemId,
      row.source.article?.toUpperCase() ?? '',
      row.source.oem?.toUpperCase() ?? '',
      warehouse?.toLowerCase() ?? row.source.warehouse?.toLowerCase() ?? '',
    ].join('|');
  }

  private skipped(rowNumber: number, message: string) {
    return { rowNumber, status: 'SKIPPED' as const, message };
  }

  private resolveShop(actor: InventoryActor, requested?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (!requested)
        throw new BadRequestException(
          'Для SUPER_ADMIN необходимо указать магазин',
        );
      return requested;
    }
    if (!actor.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (requested && requested !== actor.shopId)
      throw new ForbiddenException('Нельзя импортировать в чужой магазин');
    return actor.shopId;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  Prisma,
  StocktakeStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  CreateStocktakeDto,
  UpdateStocktakeItemsDto,
} from './dto/stocktake.dto';
@Injectable()
export class StocktakesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateStocktakeDto, actor: InventoryActor) {
    const shopId = this.shop(actor, dto.shopId);
    return this.prisma.$transaction(async (tx) => {
      const warehouse = await tx.shopWarehouse.findFirst({
        where: { id: dto.warehouseId, shopId, isActive: true },
      });
      if (!warehouse) throw new BadRequestException('Склад не найден');
      const items = await tx.shopInventoryItem.findMany({
        where: { shopId, warehouseId: warehouse.id, isActive: true },
        select: { id: true, quantity: true },
      });
      const sequence = await tx.appSequence.upsert({
        where: { key: 'STOCKTAKE' },
        create: { key: 'STOCKTAKE', value: 1 },
        update: { value: { increment: 1 } },
      });
      return tx.stocktake.create({
        data: {
          shopId,
          warehouseId: warehouse.id,
          number: `STK-${String(sequence.value).padStart(6, '0')}`,
          note: dto.note?.trim() || null,
          createdById: actor.id,
          items: {
            create: items.map((item) => ({
              inventoryItemId: item.id,
              expectedQuantity: item.quantity,
            })),
          },
        },
        include: this.include(),
      });
    });
  }
  async list(actor: InventoryActor, shopId?: string) {
    return this.prisma.stocktake.findMany({
      where: { shopId: this.shop(actor, shopId) },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }
  async one(
    id: string,
    actor: InventoryActor,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const stocktake = await tx.stocktake.findUnique({
      where: { id },
      include: this.include(),
    });
    if (
      !stocktake ||
      (actor.role !== UserRole.SUPER_ADMIN && stocktake.shopId !== actor.shopId)
    )
      throw new NotFoundException('Инвентаризация не найдена');
    return stocktake;
  }
  async updateItems(
    id: string,
    dto: UpdateStocktakeItemsDto,
    actor: InventoryActor,
  ) {
    const stocktake = await this.one(id, actor);
    if (stocktake.status !== StocktakeStatus.DRAFT)
      throw new ConflictException('Изменять можно только черновик');
    const allowed = new Set(
      stocktake.items.map((item) => item.inventoryItemId),
    );
    if (dto.items.some((item) => !allowed.has(item.inventoryItemId)))
      throw new BadRequestException('Позиция не относится к инвентаризации');
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items)
        await tx.stocktakeItem.update({
          where: {
            stocktakeId_inventoryItemId: {
              stocktakeId: id,
              inventoryItemId: item.inventoryItemId,
            },
          },
          data: {
            actualQuantity: item.actualQuantity,
            difference:
              item.actualQuantity -
              stocktake.items.find(
                (row) => row.inventoryItemId === item.inventoryItemId,
              )!.expectedQuantity,
          },
        });
      return this.one(id, actor, tx);
    });
  }
  async complete(id: string, actor: InventoryActor) {
    return this.serializable(async (tx) => {
      const stocktake = await this.one(id, actor, tx);
      if (stocktake.status !== StocktakeStatus.DRAFT)
        throw new ConflictException(
          'Инвентаризация уже завершена или отменена',
        );
      if (stocktake.items.some((item) => item.actualQuantity === null))
        throw new BadRequestException(
          'Укажите фактическое количество для всех позиций',
        );
      for (const line of stocktake.items) {
        const item = await tx.shopInventoryItem.findUnique({
          where: { id: line.inventoryItemId },
          include: { warehouse: true, partCatalogItem: true },
        });
        if (
          !item ||
          item.shopId !== stocktake.shopId ||
          item.warehouseId !== stocktake.warehouseId
        )
          throw new ConflictException(
            'Складская позиция изменила принадлежность',
          );
        const after = line.actualQuantity!;
        if (after < item.reservedQuantity)
          throw new ConflictException(
            'Фактический остаток не может быть меньше активного резерва',
          );
        const change = after - item.quantity;
        if (change !== 0) {
          await tx.shopInventoryItem.update({
            where: { id: item.id },
            data: { quantity: after },
          });
          await tx.inventoryMovement.create({
            data: {
              shopId: item.shopId,
              inventoryItemId: item.id,
              userId: actor.id,
              warehouseId: item.warehouseId,
              warehouseNameSnapshot: item.warehouse?.name,
              partCatalogItemId: item.partCatalogItemId,
              partCatalogItemNameSnapshot: item.partCatalogItem.name,
              type:
                change > 0
                  ? InventoryMovementType.ADJUSTMENT_IN
                  : InventoryMovementType.ADJUSTMENT_OUT,
              change,
              quantityBefore: item.quantity,
              quantityAfter: after,
              documentType: 'STOCKTAKE',
              documentId: stocktake.id,
              documentNumber: stocktake.number,
              reference: stocktake.number,
              notes: `Инвентаризация ${stocktake.number}`,
            },
          });
        }
      }
      return tx.stocktake.update({
        where: { id },
        data: { status: StocktakeStatus.COMPLETED, completedAt: new Date() },
        include: this.include(),
      });
    });
  }
  async cancel(id: string, actor: InventoryActor) {
    const stocktake = await this.one(id, actor);
    if (stocktake.status !== StocktakeStatus.DRAFT)
      throw new ConflictException('Отменить можно только черновик');
    return this.prisma.stocktake.update({
      where: { id },
      data: { status: StocktakeStatus.CANCELLED, cancelledAt: new Date() },
      include: this.include(),
    });
  }
  private include() {
    return {
      warehouse: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: { inventoryItem: { include: { partCatalogItem: true } } },
      },
    } as const;
  }
  private async serializable<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    for (let attempt = 0; attempt < 3; attempt++)
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2034' || attempt === 2)
          throw error;
      }
    throw new ConflictException('Не удалось завершить инвентаризацию');
  }
  private shop(actor: InventoryActor, requested?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (!requested)
        throw new BadRequestException('Для SUPER_ADMIN укажите shopId');
      return requested;
    }
    if (!actor.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (requested && requested !== actor.shopId)
      throw new ForbiddenException('Нет доступа к другому магазину');
    return actor.shopId;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryTransferStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { buildInventoryKey } from '../../common/utils/inventory-key';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CreateInventoryTransferDto } from './dto/inventory-transfer.dto';
@Injectable()
export class InventoryTransfersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateInventoryTransferDto, actor: InventoryActor) {
    const shopId = this.shop(actor, dto.shopId);
    if (dto.fromWarehouseId === dto.toWarehouseId)
      throw new BadRequestException(
        'Исходный и принимающий склады должны отличаться',
      );
    return this.prisma.$transaction(async (tx) => {
      const warehouses = await tx.shopWarehouse.findMany({
        where: {
          id: { in: [dto.fromWarehouseId, dto.toWarehouseId] },
          shopId,
          isActive: true,
        },
      });
      if (warehouses.length !== 2)
        throw new BadRequestException(
          'Один из складов не найден, неактивен или принадлежит другому магазину',
        );
      const sourceIds = dto.items.map((item) => item.sourceInventoryItemId);
      if (new Set(sourceIds).size !== sourceIds.length)
        throw new BadRequestException('Один остаток указан несколько раз');
      const inventory = await tx.shopInventoryItem.findMany({
        where: {
          id: { in: sourceIds },
          shopId,
          warehouseId: dto.fromWarehouseId,
          isActive: true,
        },
        include: { partCatalogItem: true },
      });
      if (inventory.length !== dto.items.length)
        throw new NotFoundException(
          'Один из исходных остатков не найден на выбранном складе',
        );
      const sequence = await tx.appSequence.upsert({
        where: { key: 'INVENTORY_TRANSFER' },
        create: { key: 'INVENTORY_TRANSFER', value: 1 },
        update: { value: { increment: 1 } },
      });
      return tx.inventoryTransfer.create({
        data: {
          shopId,
          number: `TRF-${String(sequence.value).padStart(6, '0')}`,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          note: dto.note?.trim() || null,
          createdById: actor.id,
          items: {
            create: dto.items.map((line) => {
              const item = inventory.find(
                (candidate) => candidate.id === line.sourceInventoryItemId,
              )!;
              return {
                sourceInventoryItemId: item.id,
                catalogItemId: item.partCatalogItemId,
                catalogItemName: item.partCatalogItem.name,
                article: item.sku,
                oem: item.oemNumber,
                manufacturer: item.brand,
                condition: item.condition,
                quantity: line.quantity,
              };
            }),
          },
        },
        include: this.include(),
      });
    });
  }
  async list(actor: InventoryActor, shopId?: string) {
    return this.prisma.inventoryTransfer.findMany({
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
    const transfer = await tx.inventoryTransfer.findUnique({
      where: { id },
      include: this.include(),
    });
    if (
      !transfer ||
      (actor.role !== UserRole.SUPER_ADMIN && transfer.shopId !== actor.shopId)
    )
      throw new NotFoundException('Перемещение не найдено');
    return transfer;
  }
  async complete(id: string, actor: InventoryActor) {
    return this.serializable(async (tx) => {
      const transfer = await this.one(id, actor, tx);
      if (transfer.status !== InventoryTransferStatus.DRAFT)
        throw new ConflictException(
          'Можно завершить только черновик перемещения',
        );
      for (const line of transfer.items) {
        const source = await tx.shopInventoryItem.findFirst({
          where: {
            id: line.sourceInventoryItemId!,
            shopId: transfer.shopId,
            warehouseId: transfer.fromWarehouseId,
            isActive: true,
          },
          include: { warehouse: true },
        });
        if (!source)
          throw new NotFoundException(
            `Исходный остаток «${line.catalogItemName}» не найден`,
          );
        const reduced = await tx.shopInventoryItem.updateMany({
          where: {
            id: source.id,
            quantity: { gte: source.reservedQuantity + line.quantity },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        if (!reduced.count)
          throw new ConflictException(
            `Недостаточно «${line.catalogItemName}» на исходном складе`,
          );
        const destinationKey = buildInventoryKey({
          shopId: transfer.shopId,
          warehouseId: transfer.toWarehouseId,
          partCatalogItemId: source.partCatalogItemId,
          sku: source.sku,
          oemNumber: source.oemNumber,
          brand: source.brand,
          condition: source.condition,
        });
        const destination = await tx.shopInventoryItem.upsert({
          where: { inventoryKey: destinationKey },
          create: {
            shopId: transfer.shopId,
            warehouseId: transfer.toWarehouseId,
            inventoryKey: destinationKey,
            partCatalogItemId: source.partCatalogItemId,
            brand: source.brand,
            sku: source.sku,
            oemNumber: source.oemNumber,
            condition: source.condition,
            price: source.price,
            currency: source.currency,
            quantity: line.quantity,
            minQuantity: source.minQuantity,
            notes: source.notes,
            compatibility: source.compatibility,
            isActive: true,
          },
          update: { quantity: { increment: line.quantity }, isActive: true },
          include: { warehouse: true },
        });
        const snapshot = {
          partCatalogItemId: line.catalogItemId,
          partCatalogItemNameSnapshot: line.catalogItemName,
          documentType: 'TRANSFER',
          documentId: transfer.id,
          documentNumber: transfer.number,
          reference: transfer.number,
          notes: transfer.note,
        };
        await tx.inventoryMovement.createMany({
          data: [
            {
              shopId: transfer.shopId,
              inventoryItemId: source.id,
              userId: actor.id,
              warehouseId: transfer.fromWarehouseId,
              warehouseNameSnapshot: source.warehouse?.name,
              type: InventoryMovementType.TRANSFER_OUT,
              change: -line.quantity,
              quantityBefore: source.quantity,
              quantityAfter: source.quantity - line.quantity,
              ...snapshot,
            },
            {
              shopId: transfer.shopId,
              inventoryItemId: destination.id,
              userId: actor.id,
              warehouseId: transfer.toWarehouseId,
              warehouseNameSnapshot: destination.warehouse?.name,
              type: InventoryMovementType.TRANSFER_IN,
              change: line.quantity,
              quantityBefore: destination.quantity - line.quantity,
              quantityAfter: destination.quantity,
              ...snapshot,
            },
          ],
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: {
          status: InventoryTransferStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: this.include(),
      });
    });
  }
  async cancel(id: string, actor: InventoryActor) {
    const transfer = await this.one(id, actor);
    if (transfer.status !== InventoryTransferStatus.DRAFT)
      throw new ConflictException('Отменить можно только черновик');
    return this.prisma.inventoryTransfer.update({
      where: { id },
      data: {
        status: InventoryTransferStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: this.include(),
    });
  }
  private include() {
    return {
      fromWarehouse: true,
      toWarehouse: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      items: true,
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
    throw new ConflictException('Не удалось завершить перемещение');
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

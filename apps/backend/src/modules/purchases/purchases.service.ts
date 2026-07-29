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
  PurchaseStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildInventoryKey } from '../../common/utils/inventory-key';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { ShopWarehousesService } from '../shop-warehouses/shop-warehouses.service';
import { CancelPurchaseDto } from './dto/cancel-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
@Injectable()
export class PurchasesService {
  constructor(
    private p: PrismaService,
    private warehouses: ShopWarehousesService,
  ) {}
  private shop(a: InventoryActor, id?: string) {
    if (a.role === UserRole.SUPER_ADMIN) {
      if (!id) throw new BadRequestException('Необходимо указать shopId');
      return id;
    }
    if (!a.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (id && id !== a.shopId)
      throw new ForbiddenException('Нельзя работать с другим магазином');
    return a.shopId;
  }
  private async serializable<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.p.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2034' || attempt >= 3)
          throw error;
      }
    }
  }
  private detail(id: string, a: InventoryActor, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.p;
    return db.purchase
      .findUnique({
        where: { id },
        include: {
          shop: true,
          user: {
            select: { id: true, phone: true, firstName: true, lastName: true },
          },
          cancelledBy: {
            select: { id: true, phone: true, firstName: true, lastName: true },
          },
          items: {
            include: {
              inventoryItem: true,
              partCatalogItem: { include: { category: true } },
            },
          },
        },
      })
      .then((x) => {
        if (
          !x ||
          (a.role !== UserRole.SUPER_ADMIN && x.shopId !== this.shop(a))
        )
          throw new NotFoundException('Закупка не найдена');
        return x;
      });
  }
  async create(d: CreatePurchaseDto, a: InventoryActor) {
    const shopId = this.shop(a, d.shopId);
    for (const line of d.items) {
      if (Boolean(line.inventoryItemId) === Boolean(line.catalogItemId))
        throw new BadRequestException(
          'Для каждой строки укажите либо inventoryItemId, либо catalogItemId',
        );
    }
    return this.serializable(async (tx) => {
      const shop = await tx.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Магазин не найден');
      if (!shop.isActive) throw new BadRequestException('Магазин отключён');
      const requestedCurrency = d.currency?.trim().toUpperCase() || 'TJS';
      const resolved: Array<{
        line: CreatePurchaseDto['items'][number];
        item: Prisma.ShopInventoryItemGetPayload<{
          include: { partCatalogItem: true; warehouse: true };
        }>;
      }> = [];
      for (const line of d.items) {
        let item: Prisma.ShopInventoryItemGetPayload<{
          include: { partCatalogItem: true; warehouse: true };
        }>;
        if (line.inventoryItemId) {
          const existingItem = await tx.shopInventoryItem.findUnique({
            where: { id: line.inventoryItemId },
            include: { partCatalogItem: true, warehouse: true },
          });
          if (!existingItem)
            throw new NotFoundException('Складская позиция не найдена');
          item = existingItem;
          if (item.shopId !== shopId)
            throw new ForbiddenException(
              'Складская позиция принадлежит другому магазину',
            );
          if (!item.isActive)
            throw new BadRequestException(
              'Нельзя принять неактивную складскую позицию',
            );
        } else {
          const catalogItem = await tx.partCatalogItem.findUnique({
            where: { id: line.catalogItemId! },
          });
          if (!catalogItem)
            throw new NotFoundException('Товар каталога не найден');
          if (!catalogItem.isActive)
            throw new BadRequestException('Товар каталога отключён');
          const salePrice = new Prisma.Decimal(
            line.salePrice ?? line.purchasePrice,
          );
          const warehouse = await this.warehouses.resolve(
            tx,
            shopId,
            line.warehouseId,
          );
          const inventoryKey = buildInventoryKey({
            shopId,
            warehouseId: warehouse.id,
            partCatalogItemId: catalogItem.id,
          });
          item = await tx.shopInventoryItem.upsert({
            where: { inventoryKey },
            create: {
              shopId,
              warehouseId: warehouse.id,
              inventoryKey,
              partCatalogItemId: catalogItem.id,
              quantity: 0,
              price: salePrice,
              currency: requestedCurrency,
              isActive: true,
            },
            update: { isActive: true },
            include: { partCatalogItem: true, warehouse: true },
          });
        }
        resolved.push({ line, item });
      }
      if (new Set(resolved.map(({ item }) => item.id)).size !== resolved.length)
        throw new BadRequestException('Складская позиция указана дважды');
      const items = resolved.map(({ item }) => item);
      if (new Set(items.map((i) => i.currency)).size !== 1)
        throw new BadRequestException(
          'Все позиции закупки должны иметь одинаковую валюту',
        );
      let subtotal = new Prisma.Decimal(0);
      for (const line of d.items)
        subtotal = subtotal.plus(
          new Prisma.Decimal(line.purchasePrice).mul(line.quantity),
        );
      const discount = new Prisma.Decimal(d.discount ?? 0);
      if (discount.gt(subtotal))
        throw new BadRequestException(
          'Скидка не может превышать сумму закупки',
        );
      const seq = await tx.appSequence.upsert({
        where: { key: 'PURCHASE' },
        create: { key: 'PURCHASE', value: 1 },
        update: { value: { increment: 1 } },
      });
      const number = `PUR-${String(seq.value).padStart(6, '0')}`;
      const purchase = await tx.purchase.create({
        data: {
          number,
          shopId,
          userId: a.id,
          invoiceNumber: d.invoiceNumber?.trim() || null,
          supplierName: d.supplierName?.trim() || null,
          supplierPhone: d.supplierPhone?.trim() || null,
          notes: d.notes?.trim() || null,
          currency: items[0].currency,
          subtotal,
          discount,
          totalAmount: subtotal.minus(discount),
          purchasedAt: d.purchasedAt ? new Date(d.purchasedAt) : new Date(),
        },
      });
      for (const { line, item: i } of resolved) {
        const price = new Prisma.Decimal(line.purchasePrice);
        const salePrice =
          line.salePrice === undefined
            ? undefined
            : new Prisma.Decimal(line.salePrice);
        const updated = await tx.shopInventoryItem.updateMany({
          where: { id: i.id, shopId, isActive: true },
          data: {
            quantity: { increment: line.quantity },
            ...(salePrice && { price: salePrice }),
          },
        });
        if (!updated.count)
          throw new ConflictException('Складская позиция недоступна');
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            inventoryItemId: i.id,
            partCatalogItemId: i.partCatalogItemId,
            itemName: i.partCatalogItem.name,
            sku: i.sku,
            oemNumber: i.oemNumber,
            brand: i.brand,
            quantity: line.quantity,
            purchasePrice: price,
            salePrice,
            lineTotal: price.mul(line.quantity),
            warehouseId: i.warehouseId,
            warehouseName: i.warehouse?.name ?? null,
          },
        });
        await tx.inventoryMovement.create({
          data: {
            shopId,
            inventoryItemId: i.id,
            warehouseId: i.warehouseId,
            warehouseNameSnapshot: i.warehouse?.name ?? null,
            partCatalogItemId: i.partCatalogItemId,
            partCatalogItemNameSnapshot: i.partCatalogItem.name,
            documentType: 'PURCHASE',
            documentId: purchase.id,
            documentNumber: number,
            userId: a.id,
            type: InventoryMovementType.PURCHASE,
            change: line.quantity,
            quantityBefore: i.quantity,
            quantityAfter: i.quantity + line.quantity,
            reference: number,
            notes: `Закупка ${number}`,
          },
        });
      }
      return purchase;
    });
  }
  async all(a: InventoryActor, q: QueryPurchasesDto) {
    if (q.dateFrom && q.dateTo && new Date(q.dateFrom) > new Date(q.dateTo))
      throw new BadRequestException('dateFrom не может быть позже dateTo');
    if (
      a.role !== UserRole.SUPER_ADMIN &&
      q.shopId &&
      q.shopId !== this.shop(a)
    )
      throw new ForbiddenException(
        'Нельзя просматривать закупки другого магазина',
      );
    const search = q.search?.trim();
    const where: Prisma.PurchaseWhereInput = {
      ...(a.role === UserRole.SUPER_ADMIN
        ? q.shopId
          ? { shopId: q.shopId }
          : {}
        : { shopId: this.shop(a) }),
      ...(q.status && { status: q.status }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { supplierName: { contains: search, mode: 'insensitive' } },
          { supplierPhone: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((q.dateFrom || q.dateTo) && {
        purchasedAt: {
          ...(q.dateFrom && { gte: new Date(q.dateFrom) }),
          ...(q.dateTo && { lte: new Date(`${q.dateTo}T23:59:59.999Z`) }),
        },
      }),
    };
    const page = q.page ?? 1,
      limit = q.limit ?? 20;
    const [data, total] = await Promise.all([
      this.p.purchase.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true } },
          user: {
            select: { id: true, phone: true, firstName: true, lastName: true },
          },
          cancelledBy: {
            select: { id: true, phone: true, firstName: true, lastName: true },
          },
          _count: { select: { items: true } },
        },
        orderBy: { purchasedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.p.purchase.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async one(id: string, a: InventoryActor) {
    return this.detail(id, a);
  }
  async cancel(id: string, d: CancelPurchaseDto, a: InventoryActor) {
    if (a.role === UserRole.SELLER)
      throw new ForbiddenException(
        'Отменять закупку может только администратор или менеджер магазина',
      );
    return this.serializable(async (tx) => {
      const purchase = await this.detail(id, a, tx);
      if (purchase.status === PurchaseStatus.CANCELLED)
        throw new ConflictException('Закупка уже отменена');
      for (const x of purchase.items) {
        const result = await tx.shopInventoryItem.updateMany({
          where: {
            id: x.inventoryItemId,
            shopId: purchase.shopId,
            quantity: { gte: x.quantity },
          },
          data: { quantity: { decrement: x.quantity } },
        });
        if (!result.count)
          throw new ConflictException(
            'Нельзя отменить закупку: недостаточно товара на складе',
          );
        await tx.inventoryMovement.create({
          data: {
            shopId: purchase.shopId,
            inventoryItemId: x.inventoryItemId,
            warehouseId: x.warehouseId,
            warehouseNameSnapshot: x.warehouseName,
            partCatalogItemId: x.partCatalogItemId,
            partCatalogItemNameSnapshot: x.itemName,
            documentType: 'PURCHASE',
            documentId: purchase.id,
            documentNumber: purchase.number,
            userId: a.id,
            type: InventoryMovementType.PURCHASE_CANCEL,
            change: -x.quantity,
            quantityBefore: x.inventoryItem.quantity,
            quantityAfter: x.inventoryItem.quantity - x.quantity,
            reference: purchase.number,
            notes: `Отмена закупки ${purchase.number}: ${d.reason.trim()}`,
          },
        });
      }
      return tx.purchase.update({
        where: { id },
        data: {
          status: PurchaseStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: a.id,
          cancelReason: d.reason.trim(),
        },
      });
    });
  }
}

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
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CancelPurchaseDto } from './dto/cancel-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
@Injectable()
export class PurchasesService {
  constructor(private p: PrismaService) {}
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
    if (new Set(d.items.map((x) => x.inventoryItemId)).size !== d.items.length)
      throw new BadRequestException('Складская позиция указана дважды');
    return this.serializable(async (tx) => {
      const shop = await tx.shop.findUnique({ where: { id: shopId } });
      if (!shop) throw new NotFoundException('Магазин не найден');
      if (!shop.isActive) throw new BadRequestException('Магазин отключён');
      const items = await tx.shopInventoryItem.findMany({
        where: { id: { in: d.items.map((x) => x.inventoryItemId) } },
        include: { partCatalogItem: true },
      });
      if (items.length !== d.items.length)
        throw new NotFoundException('Складская позиция не найдена');
      if (items.some((i) => i.shopId !== shopId))
        throw new ForbiddenException(
          'Складская позиция принадлежит другому магазину',
        );
      if (items.some((i) => !i.isActive))
        throw new BadRequestException(
          'Нельзя принять неактивную складскую позицию',
        );
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
      for (const line of d.items) {
        const i = items.find((x) => x.id === line.inventoryItemId)!;
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
          },
        });
        await tx.inventoryMovement.create({
          data: {
            shopId,
            inventoryItemId: i.id,
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

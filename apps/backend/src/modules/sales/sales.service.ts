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
  SaleStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
@Injectable()
export class SalesService {
  constructor(private p: PrismaService) {}
  private async serializable<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.p.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2034' || attempt >= 5)
          throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 10));
      }
    }
  }
  private shop(a: InventoryActor, id?: string) {
    if (a.role === UserRole.SUPER_ADMIN) {
      if (!id) throw new BadRequestException('Необходимо указать shopId');
      return id;
    }
    if (!a.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (id && id !== a.shopId)
      throw new ForbiddenException('Нельзя создать продажу другого магазина');
    return a.shopId;
  }
  async create(d: CreateSaleDto, a: InventoryActor) {
    const shopId = this.shop(a, d.shopId);
    if (new Set(d.items.map((x) => x.inventoryItemId)).size !== d.items.length)
      throw new BadRequestException('Складская позиция указана дважды');
    return this.serializable(async (tx) => {
      const seq = await tx.appSequence.upsert({
        where: { key: 'SALE' },
        create: { key: 'SALE', value: 1 },
        update: { value: { increment: 1 } },
      });
      const items = await tx.shopInventoryItem.findMany({
        where: { id: { in: d.items.map((x) => x.inventoryItemId) } },
        include: { partCatalogItem: true, warehouse: true },
      });
      if (items.length !== d.items.length)
        throw new NotFoundException('Складская позиция не найдена');
      if (items.some((i) => i.shopId !== shopId))
        throw new ForbiddenException(
          'Складская позиция принадлежит другому магазину',
        );
      if (items.some((i) => !i.isActive))
        throw new BadRequestException(
          'Нельзя продать неактивную складскую позицию',
        );
      if (new Set(items.map((i) => i.currency)).size !== 1)
        throw new BadRequestException(
          'Все позиции продажи должны иметь одинаковую валюту',
        );
      let subtotal = new Prisma.Decimal(0);
      for (const l of d.items) {
        const i = items.find((x) => x.id === l.inventoryItemId)!;
        subtotal = subtotal.plus(i.price.mul(l.quantity));
      }
      const discount = new Prisma.Decimal(d.discount ?? 0);
      if (discount.gt(subtotal))
        throw new BadRequestException(
          'Скидка не может превышать сумму продажи',
        );
      const number = `SAL-${String(seq.value).padStart(6, '0')}`;
      const sale = await tx.sale.create({
        data: {
          number,
          shopId,
          userId: a.id,
          customerName: d.customerName?.trim() || null,
          customerPhone: d.customerPhone?.trim() || null,
          notes: d.notes?.trim() || null,
          createdAt: d.soldAt ? new Date(d.soldAt) : new Date(),
          currency: items[0].currency,
          subtotal,
          discount,
          totalAmount: subtotal.minus(discount),
        },
      });
      for (const l of d.items) {
        const i = items.find((x) => x.id === l.inventoryItemId)!;
        const updated = await tx.shopInventoryItem.updateMany({
          where: {
            id: i.id,
            shopId,
            quantity: { gte: i.reservedQuantity + l.quantity },
            isActive: true,
          },
          data: { quantity: { decrement: l.quantity } },
        });
        if (!updated.count) {
          const current = await tx.shopInventoryItem.findUnique({
            where: { id: i.id },
            select: { quantity: true },
          });
          throw new ConflictException(
            `Недостаточно доступного товара “${i.partCatalogItem.name}”. Запрошено: ${l.quantity}`,
          );
        }
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            inventoryItemId: i.id,
            partCatalogItemId: i.partCatalogItemId,
            itemName: i.partCatalogItem.name,
            brand: i.brand,
            sku: i.sku,
            oemNumber: i.oemNumber,
            quantity: l.quantity,
            unitPrice: i.price,
            lineTotal: i.price.mul(l.quantity),
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
            documentType: 'SALE',
            documentId: sale.id,
            documentNumber: number,
            userId: a.id,
            type: InventoryMovementType.SALE,
            change: -l.quantity,
            quantityBefore: i.quantity,
            quantityAfter: i.quantity - l.quantity,
            reference: number,
            notes: `Продажа ${number}`,
          },
        });
      }
      return sale;
    });
  }
  async all(a: InventoryActor, query: QuerySalesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    if (
      query.dateFrom &&
      query.dateTo &&
      new Date(query.dateFrom) > new Date(query.dateTo)
    )
      throw new BadRequestException('dateFrom не может быть позже dateTo');
    const minTotal =
      query.minTotal === undefined
        ? undefined
        : new Prisma.Decimal(query.minTotal);
    const maxTotal =
      query.maxTotal === undefined
        ? undefined
        : new Prisma.Decimal(query.maxTotal);
    if (minTotal?.gt(maxTotal ?? minTotal))
      throw new BadRequestException('minTotal не может быть больше maxTotal');
    if (
      a.role !== UserRole.SUPER_ADMIN &&
      query.shopId &&
      query.shopId !== this.shop(a)
    )
      throw new ForbiddenException(
        'Нельзя просматривать продажи другого магазина',
      );
    const search = query.search?.trim();
    const where: Prisma.SaleWhereInput = {
      ...(a.role === UserRole.SUPER_ADMIN
        ? query.shopId
          ? { shopId: query.shopId }
          : {}
        : { shopId: this.shop(a) }),
      ...(query.status && { status: query.status }),
      ...(query.userId && { userId: query.userId }),
      ...(query.customerPhone && {
        customerPhone: { contains: query.customerPhone, mode: 'insensitive' },
      }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && {
            lte: new Date(`${query.dateTo}T23:59:59.999Z`),
          }),
        },
      }),
      ...((minTotal || maxTotal) && {
        totalAmount: {
          ...(minTotal && { gte: minTotal }),
          ...(maxTotal && { lte: maxTotal }),
        },
      }),
    };
    const allowed = [
      'createdAt',
      'number',
      'subtotal',
      'discount',
      'totalAmount',
    ] as const;
    const sortBy = allowed.includes(query.sortBy as (typeof allowed)[number])
      ? query.sortBy!
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const [data, total] = await Promise.all([
      this.p.sale.findMany({
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
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.p.sale.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async one(id: string, a: InventoryActor) {
    const s = await this.p.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: true,
            partCatalogItem: { include: { category: true } },
          },
        },
        shop: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!s || (a.role !== UserRole.SUPER_ADMIN && s.shopId !== this.shop(a)))
      throw new NotFoundException('Продажа не найдена');
    return s;
  }
  async cancel(id: string, d: CancelSaleDto, a: InventoryActor) {
    if (a.role === UserRole.SELLER)
      throw new ForbiddenException(
        'Отменять продажу может только администратор или менеджер магазина',
      );
    return this.serializable(async (tx) => {
      const s = await tx.sale.findUnique({
        where: { id },
        include: { items: true, payable: true },
      });
      if (!s || (a.role !== UserRole.SUPER_ADMIN && s.shopId !== this.shop(a)))
        throw new NotFoundException('Продажа не найдена');
      if (s.status === SaleStatus.CANCELLED)
        throw new ConflictException('Продажа уже отменена');
      if (s.payable?.paidAmount.gt(0))
        throw new ConflictException(
          'По этой продаже уже была выплата магазину. Сначала оформите финансовый возврат',
        );
      for (const x of s.items) {
        const i = await tx.shopInventoryItem.findUniqueOrThrow({
          where: { id: x.inventoryItemId },
        });
        await tx.shopInventoryItem.update({
          where: { id: i.id },
          data: { quantity: { increment: x.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            shopId: s.shopId,
            inventoryItemId: i.id,
            warehouseId: x.warehouseId,
            warehouseNameSnapshot: x.warehouseName,
            partCatalogItemId: x.partCatalogItemId,
            partCatalogItemNameSnapshot: x.itemName,
            documentType: 'SALE',
            documentId: s.id,
            documentNumber: s.number,
            userId: a.id,
            type: InventoryMovementType.SALE_CANCEL,
            change: x.quantity,
            quantityBefore: i.quantity,
            quantityAfter: i.quantity + x.quantity,
            reference: s.number,
            notes: `Отмена продажи ${s.number}: ${d.reason}`,
          },
        });
      }
      if (s.payable)
        await tx.shopPayable.update({
          where: { id: s.payable.id },
          data: { status: 'CANCELLED' },
        });
      return tx.sale.update({
        where: { id },
        data: {
          status: SaleStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: a.id,
          cancelReason: d.reason,
        },
      });
    });
  }
}

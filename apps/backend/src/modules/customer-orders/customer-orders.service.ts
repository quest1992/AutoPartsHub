import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerOrderStatus,
  InventoryMovementType,
  OrderItemReservationStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { normalizePhone } from '../../common/utils/phone-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  CancelCustomerOrderDto,
  CreateCustomerOrderDto,
  CustomerOrderQueryDto,
  ExtendReservationDto,
  OrderInventorySearchDto,
  ReserveOrderDto,
  UpdateCustomerOrderDto,
} from './dto/customer-order.dto';
import { OrderPricingService } from './order-pricing.service';
import {
  addMoney,
  money,
  roundMoney,
  subtractMoney,
} from '../../common/utils/money';

const orderInclude = {
  customer: true,
  items: { orderBy: { createdAt: 'asc' as const } },
  sales: {
    include: { shop: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  statusHistory: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.CustomerOrderInclude;

@Injectable()
export class CustomerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: OrderPricingService,
  ) {}

  private async serializable<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2034' || attempt === 2)
          throw error;
      }
    }
    throw new ConflictException(
      'Конкурентное изменение заказа. Повторите операцию',
    );
  }

  async create(dto: CreateCustomerOrderDto, actor: InventoryActor) {
    if (
      new Set(dto.items.map((item) => item.inventoryItemId)).size !==
      dto.items.length
    )
      throw new BadRequestException(
        'Складская позиция указана в заказе дважды',
      );
    return this.serializable(async (tx) => {
      const inventory = await tx.shopInventoryItem.findMany({
        where: {
          id: { in: dto.items.map((item) => item.inventoryItemId) },
          partCatalogItem: {
            isActive: true,
            category: { isActive: true },
          },
        },
        include: {
          shop: true,
          warehouse: true,
          partCatalogItem: { include: { category: true } },
        },
      });
      if (inventory.length !== dto.items.length)
        throw new NotFoundException(
          'Одна или несколько складских позиций не найдены',
        );
      if (
        inventory.some(
          (item) =>
            !item.isActive || !item.shop.isActive || !item.warehouse?.isActive,
        )
      )
        throw new BadRequestException(
          'Заказ содержит неактивную позицию, магазин или склад',
        );
      if (inventory.some((item) => !item.warehouseId || !item.warehouse))
        throw new BadRequestException('Для позиции заказа не указан склад');
      const priced: Array<{
        line: (typeof dto.items)[number];
        item: (typeof inventory)[number];
        values: ReturnType<OrderPricingService['calculate']>;
      }> = [];
      for (const line of dto.items) {
        const item = inventory.find(
          (candidate) => candidate.id === line.inventoryItemId,
        )!;
        const setting = await this.pricing.setting(item.shopId, tx);
        const commissionType = line.commissionType ?? setting.commissionType;
        const commissionValue = money(
          line.commissionValue ?? setting.commissionValue,
        );
        priced.push({
          line,
          item,
          values: this.pricing.calculate({
            shopUnitPrice: item.price,
            quantity: line.quantity,
            commissionType: commissionType,
            commissionValue,
            manualClientUnitPrice: money(
              line.clientUnitPrice ?? line.unitPrice,
            ),
            allowBelowCost: actor.role === UserRole.SUPER_ADMIN,
          }),
        });
      }
      const subtotal = addMoney(
        ...priced.map((entry) => entry.values.grossAmount),
      );
      const discount = roundMoney(dto.discount ?? 0);
      const deliveryFee = roundMoney(dto.deliveryFee ?? 0);
      if (discount.gt(subtotal))
        throw new BadRequestException(
          'Скидка не может превышать сумму товаров',
        );
      let allocatedDiscount = money(0);
      const financialLines = priced.map((entry, index) => {
        const discountAmount =
          index === priced.length - 1
            ? subtractMoney(discount, allocatedDiscount)
            : roundMoney(
                discount
                  .mul(entry.values.grossAmount)
                  .div(subtotal.isZero() ? 1 : subtotal),
              );
        allocatedDiscount = addMoney(allocatedDiscount, discountAmount);
        const clientAmount = subtractMoney(
          entry.values.grossAmount,
          discountAmount,
        );
        const platformRevenue = subtractMoney(
          clientAmount,
          entry.values.shopAmount,
        );
        if (platformRevenue.isNegative() && actor.role !== UserRole.SUPER_ADMIN)
          throw new ConflictException(
            'Скидка создаёт отрицательный доход платформы',
          );
        return { ...entry, discountAmount, clientAmount, platformRevenue };
      });
      const platformProductRevenue = addMoney(
        ...financialLines.map((entry) => entry.platformRevenue),
      );
      let customerId = dto.customerId;
      let customer = customerId
        ? await tx.customer.findUnique({ where: { id: customerId } })
        : null;
      if (customerId && !customer)
        throw new NotFoundException('Клиент не найден');
      const phoneNormalized = normalizePhone(dto.customer.phone);
      if (!customer && phoneNormalized)
        customer = await tx.customer.findFirst({ where: { phoneNormalized } });
      if (!customer)
        customer = await tx.customer.create({
          data: {
            fullName: dto.customer.fullName.trim(),
            phone: dto.customer.phone?.trim() || '',
            phoneNormalized,
            createdById: actor.id,
            shopId: actor.role === UserRole.SUPER_ADMIN ? null : actor.shopId,
          },
        });
      customerId = customer.id;
      const sequence = await tx.appSequence.upsert({
        where: { key: 'CUSTOMER_ORDER' },
        create: { key: 'CUSTOMER_ORDER', value: 1 },
        update: { value: { increment: 1 } },
      });
      const order = await tx.customerOrder.create({
        data: {
          number: `ORD-${String(sequence.value).padStart(6, '0')}`,
          customerId,
          customerNameSnapshot: dto.customer.fullName.trim(),
          customerPhoneSnapshot: dto.customer.phone?.trim() || null,
          deliveryType: dto.deliveryType,
          deliveryAddress: dto.deliveryAddress?.trim() || null,
          subtotal,
          discount,
          deliveryFee,
          total: subtotal.minus(discount).plus(deliveryFee),
          platformProductRevenue,
          platformDeliveryRevenue: deliveryFee,
          note: dto.note?.trim() || null,
          createdById: actor.id,
          items: {
            create: financialLines.map(
              ({
                line,
                item,
                values,
                discountAmount,
                clientAmount,
                platformRevenue,
              }) => {
                return {
                  inventoryItemId: item.id,
                  shopId: item.shopId,
                  warehouseId: item.warehouseId!,
                  catalogItemId: item.partCatalogItemId,
                  quantity: line.quantity,
                  unitPrice: values.clientUnitPrice,
                  total: clientAmount,
                  shopUnitPrice: values.shopUnitPrice,
                  clientUnitPrice: values.clientUnitPrice,
                  grossAmount: values.grossAmount,
                  discountAmount,
                  clientAmount,
                  shopAmount: values.shopAmount,
                  platformRevenue,
                  commissionType: values.commissionType,
                  commissionValue: values.commissionValue,
                  catalogItemName: item.partCatalogItem.name,
                  shopName: item.shop.name,
                  warehouseName: item.warehouse!.name,
                  article: item.sku,
                  oem: item.oemNumber,
                  brand: item.brand,
                };
              },
            ),
          },
          statusHistory: {
            create: { status: CustomerOrderStatus.DRAFT, userId: actor.id },
          },
        },
        include: orderInclude,
      });
      return order;
    });
  }

  async all(query: CustomerOrderQueryDto, actor: InventoryActor) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20,
      search = query.search?.trim();
    const where: Prisma.CustomerOrderWhereInput = {
      ...(query.status && { status: query.status as CustomerOrderStatus }),
      ...(query.paymentStatus && {
        paymentStatus: query.paymentStatus as never,
      }),
      ...(query.shopId && { items: { some: { shopId: query.shopId } } }),
      ...(actor.role !== UserRole.SUPER_ADMIN && {
        items: { some: { shopId: actor.shopId ?? '__none__' } },
      }),
      ...(query.expired && {
        status: CustomerOrderStatus.RESERVED,
        reservationExpiresAt: { lte: new Date() },
      }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customerNameSnapshot: { contains: search, mode: 'insensitive' } },
          { customerPhoneSnapshot: { contains: search, mode: 'insensitive' } },
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
    };
    const [data, total] = await Promise.all([
      this.prisma.customerOrder.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customerOrder.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async one(id: string, actor: InventoryActor) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (
      !order ||
      (actor.role !== UserRole.SUPER_ADMIN &&
        !order.items.some((item) => item.shopId === actor.shopId))
    )
      throw new NotFoundException('Заказ не найден');
    if (actor.role !== UserRole.SUPER_ADMIN)
      return {
        ...order,
        platformProductRevenue: undefined,
        platformDeliveryRevenue: undefined,
        payments: undefined,
        items: order.items
          .filter((item) => item.shopId === actor.shopId)
          .map(
            ({
              platformRevenue,
              commissionType,
              commissionValue,
              clientAmount,
              clientUnitPrice,
              grossAmount,
              discountAmount,
              ...safe
            }) => safe,
          ),
        sales: order.sales.filter((sale) => sale.shopId === actor.shopId),
      };
    return order;
  }

  async finance(id: string, actor: InventoryActor) {
    if (actor.role !== UserRole.SUPER_ADMIN)
      throw new ForbiddenException(
        'Финансовый отчёт заказа доступен только платформе',
      );
    const order = await this.prisma.customerOrder.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { receivedAt: 'desc' } },
        payables: { include: { shop: true, sale: true } },
      },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    const dueAmount = subtractMoney(order.total, order.paidAmount);
    const shops = order.payables.map((payable) => ({
      shopId: payable.shopId,
      shopName: payable.shop.name,
      salesTotal: payable.sale.totalAmount,
      payableAmount: payable.payableAmount,
      paidToShop: payable.paidAmount,
      outstandingToShop: subtractMoney(
        payable.payableAmount,
        payable.paidAmount,
      ),
      payableId: payable.id,
      saleId: payable.saleId,
    }));
    return {
      order: {
        number: order.number,
        total: order.total,
        paidAmount: order.paidAmount,
        dueAmount,
        paymentStatus: order.paymentStatus,
      },
      platform: {
        productRevenue: order.platformProductRevenue,
        deliveryRevenue: order.platformDeliveryRevenue,
        totalRevenue: addMoney(
          order.platformProductRevenue,
          order.platformDeliveryRevenue,
        ),
      },
      shops,
      payments: order.payments,
    };
  }

  async update(id: string, dto: UpdateCustomerOrderDto, actor: InventoryActor) {
    const order = await this.one(id, actor);
    if (order.status !== CustomerOrderStatus.DRAFT)
      throw new ConflictException('Редактировать можно только черновик');
    const subtotal = new Prisma.Decimal(order.subtotal);
    const discount =
      dto.discount === undefined
        ? new Prisma.Decimal(order.discount)
        : new Prisma.Decimal(dto.discount);
    const deliveryFee =
      dto.deliveryFee === undefined
        ? new Prisma.Decimal(order.deliveryFee)
        : new Prisma.Decimal(dto.deliveryFee);
    if (discount.gt(subtotal))
      throw new BadRequestException('Скидка не может превышать сумму товаров');
    return this.prisma.customerOrder.update({
      where: { id },
      data: {
        ...dto,
        deliveryAddress: dto.deliveryAddress?.trim(),
        note: dto.note?.trim(),
        discount,
        deliveryFee,
        total: subtotal.minus(discount).plus(deliveryFee),
      },
      include: orderInclude,
    });
  }

  async reserve(id: string, dto: ReserveOrderDto, actor: InventoryActor) {
    return this.serializable(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      this.assertOrder(order, CustomerOrderStatus.DRAFT, actor);
      const inventory = await tx.shopInventoryItem.findMany({
        where: { id: { in: order.items.map((item) => item.inventoryItemId) } },
      });
      const problems = order.items.flatMap((line) => {
        const item = inventory.find(
          (candidate) => candidate.id === line.inventoryItemId,
        );
        const available = item ? item.quantity - item.reservedQuantity : 0;
        return available < line.quantity
          ? [
              {
                inventoryItemId: line.inventoryItemId,
                requested: line.quantity,
                available,
              },
            ]
          : [];
      });
      if (problems.length)
        throw new ConflictException({
          message: 'Недостаточно доступного товара на выбранном складе',
          items: problems,
        });
      for (const line of order.items) {
        const updated = await tx.shopInventoryItem.updateMany({
          where: {
            id: line.inventoryItemId,
            reservedQuantity: {
              lte:
                inventory.find((item) => item.id === line.inventoryItemId)!
                  .quantity - line.quantity,
            },
          },
          data: { reservedQuantity: { increment: line.quantity } },
        });
        if (!updated.count)
          throw new ConflictException(
            'Недостаточно доступного товара на выбранном складе',
          );
      }
      const expiresAt = new Date(
        Date.now() + (dto.expiresInMinutes ?? 120) * 60_000,
      );
      await tx.customerOrderItem.updateMany({
        where: { orderId: id },
        data: { reservationStatus: OrderItemReservationStatus.RESERVED },
      });
      await tx.customerOrderStatusHistory.create({
        data: {
          orderId: id,
          status: CustomerOrderStatus.RESERVED,
          userId: actor.id,
        },
      });
      return tx.customerOrder.update({
        where: { id },
        data: {
          status: CustomerOrderStatus.RESERVED,
          reservationExpiresAt: expiresAt,
        },
        include: orderInclude,
      });
    });
  }

  async extend(id: string, dto: ExtendReservationDto, actor: InventoryActor) {
    const order = await this.one(id, actor);
    if (order.status !== CustomerOrderStatus.RESERVED)
      throw new ConflictException('Продлить можно только активный резерв');
    return this.prisma.customerOrder.update({
      where: { id },
      data: {
        reservationExpiresAt: new Date(
          Date.now() + dto.expiresInMinutes * 60_000,
        ),
      },
      include: orderInclude,
    });
  }

  async confirm(id: string, actor: InventoryActor) {
    return this.serializable(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id },
        include: { items: true, sales: true },
      });
      this.assertOrder(order, CustomerOrderStatus.RESERVED, actor);
      if (
        order.reservationExpiresAt &&
        order.reservationExpiresAt <= new Date()
      )
        throw new ConflictException('Срок резерва истёк');
      if (order.sales.length)
        throw new ConflictException('Продажи для заказа уже созданы');
      const inventory = await tx.shopInventoryItem.findMany({
        where: { id: { in: order.items.map((item) => item.inventoryItemId) } },
        include: { warehouse: true, partCatalogItem: true },
      });
      const groups = new Map<string, typeof order.items>();
      for (const item of order.items)
        groups.set(item.shopId, [...(groups.get(item.shopId) ?? []), item]);
      const sales: Array<{ id: string; number: string }> = [];
      for (const [shopId, lines] of groups) {
        const seq = await tx.appSequence.upsert({
          where: { key: 'SALE' },
          create: { key: 'SALE', value: 1 },
          update: { value: { increment: 1 } },
        });
        const number = `SAL-${String(seq.value).padStart(6, '0')}`;
        const subtotal = addMoney(...lines.map((line) => line.shopAmount));
        const sale = await tx.sale.create({
          data: {
            number,
            shopId,
            userId: actor.id,
            customerOrderId: id,
            customerName: order.customerNameSnapshot,
            customerPhone: order.customerPhoneSnapshot,
            notes: `Заказ ${order.number}`,
            subtotal,
            totalAmount: subtotal,
            currency: 'TJS',
          },
        });
        for (const line of lines) {
          const item = inventory.find(
            (candidate) => candidate.id === line.inventoryItemId,
          )!;
          const updated = await tx.shopInventoryItem.updateMany({
            where: {
              id: item.id,
              quantity: { gte: line.quantity },
              reservedQuantity: { gte: line.quantity },
            },
            data: {
              quantity: { decrement: line.quantity },
              reservedQuantity: { decrement: line.quantity },
            },
          });
          if (!updated.count)
            throw new ConflictException(
              'Зарезервированный товар больше недоступен',
            );
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              inventoryItemId: item.id,
              partCatalogItemId: item.partCatalogItemId,
              itemName: line.catalogItemName,
              brand: line.brand,
              sku: line.article,
              oemNumber: line.oem,
              quantity: line.quantity,
              unitPrice: line.shopUnitPrice,
              lineTotal: line.shopAmount,
              warehouseId: line.warehouseId,
              warehouseName: line.warehouseName,
            },
          });
          await tx.inventoryMovement.create({
            data: {
              shopId,
              inventoryItemId: item.id,
              warehouseId: line.warehouseId,
              warehouseNameSnapshot: line.warehouseName,
              partCatalogItemId: line.catalogItemId,
              partCatalogItemNameSnapshot: line.catalogItemName,
              documentType: 'SALE',
              documentId: sale.id,
              documentNumber: number,
              userId: actor.id,
              type: InventoryMovementType.SALE,
              change: -line.quantity,
              quantityBefore: item.quantity,
              quantityAfter: item.quantity - line.quantity,
              reference: number,
              notes: `Продажа по заказу ${order.number}`,
            },
          });
        }
        await tx.shopPayable.create({
          data: {
            shopId,
            customerOrderId: id,
            saleId: sale.id,
            grossShopAmount: subtotal,
            payableAmount: subtotal,
          },
        });
        sales.push({ id: sale.id, number: sale.number });
      }
      await tx.customerOrderItem.updateMany({
        where: { orderId: id },
        data: {
          reservationStatus: OrderItemReservationStatus.CONVERTED_TO_SALE,
        },
      });
      await tx.customerOrderStatusHistory.create({
        data: {
          orderId: id,
          status: CustomerOrderStatus.CONFIRMED,
          userId: actor.id,
        },
      });
      await tx.customerOrder.update({
        where: { id },
        data: {
          status: CustomerOrderStatus.CONFIRMED,
          confirmedById: actor.id,
          confirmedAt: new Date(),
          reservationExpiresAt: null,
        },
      });
      return {
        ...(await tx.customerOrder.findUniqueOrThrow({
          where: { id },
          include: orderInclude,
        })),
        sales,
      };
    });
  }

  async cancel(id: string, dto: CancelCustomerOrderDto, actor: InventoryActor) {
    return this.serializable(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { id },
        include: { items: true, sales: true },
      });
      if (!order) throw new NotFoundException('Заказ не найден');
      if (
        actor.role !== UserRole.SUPER_ADMIN &&
        !order.items.some((item) => item.shopId === actor.shopId)
      )
        throw new NotFoundException('Заказ не найден');
      if (order.sales.some((sale) => sale.status !== 'CANCELLED'))
        throw new ConflictException(
          'Заказ уже подтверждён. Сначала отмените связанные продажи',
        );
      if (
        order.status === CustomerOrderStatus.CANCELLED ||
        order.status === CustomerOrderStatus.COMPLETED
      )
        throw new ConflictException('Заказ уже закрыт');
      if (order.status === CustomerOrderStatus.RESERVED)
        await this.releaseInside(tx, order.id, order.items);
      await tx.customerOrderStatusHistory.create({
        data: {
          orderId: id,
          status: CustomerOrderStatus.CANCELLED,
          userId: actor.id,
          note: dto.reason.trim(),
        },
      });
      return tx.customerOrder.update({
        where: { id },
        data: {
          status: CustomerOrderStatus.CANCELLED,
          cancelReason: dto.reason.trim(),
          cancelledById: actor.id,
          cancelledAt: new Date(),
          reservationExpiresAt: null,
        },
        include: orderInclude,
      });
    });
  }

  async transition(
    id: string,
    from: CustomerOrderStatus,
    to: CustomerOrderStatus,
    actor: InventoryActor,
  ) {
    const order = await this.one(id, actor);
    if (order.status !== from)
      throw new ConflictException(`Ожидаемый статус заказа: ${from}`);
    if (to === CustomerOrderStatus.COMPLETED && order.paymentStatus !== 'PAID')
      throw new ConflictException('Заказ не оплачен полностью');
    return this.prisma.$transaction(async (tx) => {
      await tx.customerOrderStatusHistory.create({
        data: { orderId: id, status: to, userId: actor.id },
      });
      return tx.customerOrder.update({
        where: { id },
        data: {
          status: to,
          ...(to === CustomerOrderStatus.COMPLETED && {
            completedAt: new Date(),
          }),
        },
        include: orderInclude,
      });
    });
  }

  async releaseExpired() {
    const ids = await this.prisma.customerOrder.findMany({
      where: {
        status: CustomerOrderStatus.RESERVED,
        reservationExpiresAt: { lte: new Date() },
      },
      select: { id: true },
    });
    let released = 0;
    for (const { id } of ids) {
      const changed = await this.serializable(async (tx) => {
        const order = await tx.customerOrder.findUnique({
          where: { id },
          include: { items: true },
        });
        if (
          !order ||
          order.status !== CustomerOrderStatus.RESERVED ||
          !order.reservationExpiresAt ||
          order.reservationExpiresAt > new Date()
        )
          return false;
        await this.releaseInside(tx, id, order.items);
        await tx.customerOrderStatusHistory.create({
          data: {
            orderId: id,
            status: CustomerOrderStatus.EXPIRED,
            note: 'Срок резерва истёк',
          },
        });
        await tx.customerOrder.update({
          where: { id },
          data: {
            status: CustomerOrderStatus.EXPIRED,
            reservationExpiresAt: null,
          },
        });
        return true;
      });
      if (changed) released++;
    }
    return { found: ids.length, released };
  }

  private async releaseInside(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: Array<{
      inventoryItemId: string;
      quantity: number;
      reservationStatus: OrderItemReservationStatus;
    }>,
  ) {
    for (const line of items.filter(
      (item) => item.reservationStatus === OrderItemReservationStatus.RESERVED,
    ))
      await tx.shopInventoryItem.updateMany({
        where: {
          id: line.inventoryItemId,
          reservedQuantity: { gte: line.quantity },
        },
        data: { reservedQuantity: { decrement: line.quantity } },
      });
    await tx.customerOrderItem.updateMany({
      where: {
        orderId,
        reservationStatus: OrderItemReservationStatus.RESERVED,
      },
      data: { reservationStatus: OrderItemReservationStatus.RELEASED },
    });
  }

  async inventorySearch(query: OrderInventorySearchDto, actor: InventoryActor) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20,
      term = query.query?.trim();
    const where: Prisma.ShopInventoryItemWhereInput = {
      isActive: true,
      shop: { isActive: true },
      warehouse: { isActive: true },
      partCatalogItem: {
        isActive: true,
        category: { isActive: true },
      },
      ...(query.shopId && { shopId: query.shopId }),
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.catalogItemId && { partCatalogItemId: query.catalogItemId }),
      ...(actor.role !== UserRole.SUPER_ADMIN && {
        shopId: actor.shopId ?? '__none__',
      }),
      ...(term && {
        OR: [
          { sku: { contains: term, mode: 'insensitive' } },
          { oemNumber: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          {
            partCatalogItem: { name: { contains: term, mode: 'insensitive' } },
          },
        ],
      }),
    };
    const all = await this.prisma.shopInventoryItem.findMany({
      where,
      include: { shop: true, warehouse: true, partCatalogItem: true },
      orderBy: { updatedAt: 'desc' },
    });
    const filtered =
      (query.onlyAvailable ?? true)
        ? all.filter((item) => item.quantity - item.reservedQuantity > 0)
        : all;
    return {
      data: filtered.slice((page - 1) * limit, page * limit).map((item) => ({
        inventoryItemId: item.id,
        catalogItemId: item.partCatalogItemId,
        catalogItemName: item.partCatalogItem.name,
        shopId: item.shopId,
        shopName: item.shop.name,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name,
        article: item.sku,
        oem: item.oemNumber,
        brand: item.brand,
        quantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        availableQuantity: item.quantity - item.reservedQuantity,
        salePrice: item.price.toString(),
      })),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  private assertOrder(
    order: {
      status: CustomerOrderStatus;
      items: Array<{ shopId: string }>;
    } | null,
    status: CustomerOrderStatus,
    actor: InventoryActor,
  ): asserts order {
    if (
      !order ||
      (actor.role !== UserRole.SUPER_ADMIN &&
        !order.items.some((item) => item.shopId === actor.shopId))
    )
      throw new NotFoundException('Заказ не найден');
    if (order.status !== status)
      throw new ConflictException(`Ожидаемый статус заказа: ${status}`);
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, PurchaseStatus, SaleStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: DashboardSummaryQueryDto, actor: InventoryActor) {
    const shopId = this.resolveShop(actor, query.shopId);
    const { dateFrom, dateTo } = this.resolvePeriod(
      query.dateFrom,
      query.dateTo,
    );
    const lowStockThreshold = query.lowStockThreshold ?? 5;
    const saleWhere: Prisma.SaleWhereInput = {
      status: SaleStatus.COMPLETED,
      ...(shopId && { shopId }),
      createdAt: { gte: dateFrom, lte: dateTo },
    };
    const purchaseWhere: Prisma.PurchaseWhereInput = {
      status: PurchaseStatus.COMPLETED,
      ...(shopId && { shopId }),
      purchasedAt: { gte: dateFrom, lte: dateTo },
    };
    const inventoryWhere: Prisma.ShopInventoryItemWhereInput = {
      isActive: true,
      ...(shopId && { shopId }),
    };
    const [
      sales,
      salesItems,
      purchases,
      purchaseItems,
      inventory,
      lowStockItems,
      outOfStockItems,
      recentSales,
      recentPurchases,
      grouped,
      warehouseInventory,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: saleWhere,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.saleItem.aggregate({
        where: { sale: saleWhere },
        _sum: { quantity: true },
      }),
      this.prisma.purchase.aggregate({
        where: purchaseWhere,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.purchaseItem.aggregate({
        where: { purchase: purchaseWhere },
        _sum: { quantity: true },
      }),
      this.prisma.shopInventoryItem.aggregate({
        where: inventoryWhere,
        _count: { id: true },
        _sum: { quantity: true },
      }),
      this.prisma.shopInventoryItem.count({
        where: {
          ...inventoryWhere,
          quantity: { gt: 0, lte: lowStockThreshold },
        },
      }),
      this.prisma.shopInventoryItem.count({
        where: { ...inventoryWhere, quantity: 0 },
      }),
      this.prisma.sale.findMany({
        where: saleWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          createdAt: true,
          totalAmount: true,
          currency: true,
          shop: { select: { id: true, name: true } },
        },
      }),
      this.prisma.purchase.findMany({
        where: purchaseWhere,
        take: 5,
        orderBy: { purchasedAt: 'desc' },
        select: {
          id: true,
          number: true,
          purchasedAt: true,
          supplierName: true,
          totalAmount: true,
          currency: true,
          shop: { select: { id: true, name: true } },
        },
      }),
      this.prisma.saleItem.groupBy({
        by: ['inventoryItemId', 'partCatalogItemId'],
        where: { sale: saleWhere },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      this.prisma.shopInventoryItem.findMany({
        where: inventoryWhere,
        select: {
          quantity: true,
          price: true,
          warehouseId: true,
          warehouse: { select: { name: true } },
        },
      }),
    ]);
    const warehouseMap = new Map<
      string,
      {
        warehouseId: string | null;
        name: string;
        quantity: number;
        value: Prisma.Decimal;
      }
    >();
    for (const item of warehouseInventory) {
      const key = item.warehouseId ?? 'legacy';
      const current = warehouseMap.get(key) ?? {
        warehouseId: item.warehouseId,
        name: item.warehouse?.name ?? 'Без склада',
        quantity: 0,
        value: new Prisma.Decimal(0),
      };
      current.quantity += item.quantity;
      current.value = current.value.plus(item.price.mul(item.quantity));
      warehouseMap.set(key, current);
    }
    const inventoryIds = grouped.map((item) => item.inventoryItemId);
    const items = inventoryIds.length
      ? await this.prisma.shopInventoryItem.findMany({
          where: { id: { in: inventoryIds } },
          select: {
            id: true,
            partCatalogItem: { select: { name: true, internalCode: true } },
            oemNumber: true,
          },
        })
      : [];
    const itemById = new Map(items.map((item) => [item.id, item]));
    const orderWhere: Prisma.CustomerOrderWhereInput = {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(shopId && { items: { some: { shopId } } }),
    };
    const [ordersByStatus, orderMoney, reservedInventory] = await Promise.all([
      this.prisma.customerOrder.groupBy({
        by: ['status'],
        where: orderWhere,
        _count: { id: true },
      }),
      this.prisma.customerOrder.aggregate({
        where: {
          ...orderWhere,
          status: { in: ['CONFIRMED', 'READY', 'COMPLETED'] },
        },
        _count: { id: true },
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.shopInventoryItem.aggregate({
        where: inventoryWhere,
        _sum: { reservedQuantity: true },
      }),
    ]);
    const orderCount = (status: string) =>
      ordersByStatus.find((row) => row.status === status)?._count.id ?? 0;
    const [
      paymentCompleted,
      paymentRefunded,
      payableTotals,
      payoutTotals,
      platformOrders,
    ] = await Promise.all([
      this.prisma.customerOrderPayment.aggregate({
        where: { status: 'COMPLETED', order: orderWhere },
        _sum: { amount: true },
      }),
      this.prisma.customerOrderPayment.aggregate({
        where: { status: 'REFUNDED', order: orderWhere },
        _sum: { amount: true },
      }),
      this.prisma.shopPayable.aggregate({
        where: { ...(shopId && { shopId }), status: { not: 'CANCELLED' } },
        _sum: { payableAmount: true, paidAmount: true },
      }),
      this.prisma.shopPayout.aggregate({
        where: { ...(shopId && { shopId }), status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.customerOrder.aggregate({
        where: orderWhere,
        _sum: {
          total: true,
          paidAmount: true,
          platformProductRevenue: true,
          platformDeliveryRevenue: true,
        },
      }),
    ]);
    return {
      period: {
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
      sales: {
        count: sales._count.id,
        revenue: sales._sum.totalAmount?.toString() ?? '0',
        itemsSold: salesItems._sum.quantity ?? 0,
      },
      purchases: {
        count: purchases._count.id,
        total: purchases._sum.totalAmount?.toString() ?? '0',
        itemsPurchased: purchaseItems._sum.quantity ?? 0,
      },
      inventory: {
        activeItems: inventory._count.id,
        totalQuantity: inventory._sum.quantity ?? 0,
        lowStockItems,
        outOfStockItems,
        byWarehouse: [...warehouseMap.values()].map((item) => ({
          ...item,
          value: item.value.toString(),
        })),
      },
      recentSales: recentSales.map((sale) => ({
        ...sale,
        totalAmount: sale.totalAmount.toString(),
      })),
      recentPurchases: recentPurchases.map((purchase) => ({
        ...purchase,
        totalAmount: purchase.totalAmount.toString(),
      })),
      topSellingItems: grouped.map((group) => {
        const item = itemById.get(group.inventoryItemId);
        return {
          inventoryItemId: group.inventoryItemId,
          partCatalogItemId: group.partCatalogItemId,
          name: item?.partCatalogItem.name ?? 'Удалённая позиция',
          internalCode: item?.partCatalogItem.internalCode ?? null,
          oemNumber: item?.oemNumber ?? null,
          quantity: group._sum.quantity ?? 0,
          total: group._sum.lineTotal?.toString() ?? '0',
        };
      }),
      orders: {
        draft: orderCount('DRAFT'),
        reserved: orderCount('RESERVED'),
        expired: orderCount('EXPIRED'),
        confirmed: orderCount('CONFIRMED'),
        completed: orderCount('COMPLETED'),
        cancelled: orderCount('CANCELLED'),
        revenueOrderCount: orderMoney._count.id,
        total: orderMoney._sum.total?.toString() ?? '0',
        average: orderMoney._avg.total?.toString() ?? '0',
        reservedItems: reservedInventory._sum.reservedQuantity ?? 0,
      },
      finance: {
        customerPayments: paymentCompleted._sum.amount?.toString() ?? '0',
        customerRefunds: paymentRefunded._sum.amount?.toString() ?? '0',
        accruedToShops: payableTotals._sum.payableAmount?.toString() ?? '0',
        paidToShops:
          payoutTotals._sum.amount?.toString() ??
          payableTotals._sum.paidAmount?.toString() ??
          '0',
        shopOutstanding: (
          payableTotals._sum.payableAmount?.minus(
            payableTotals._sum.paidAmount ?? 0,
          ) ?? new Prisma.Decimal(0)
        ).toString(),
        customerReceivables: (
          platformOrders._sum.total?.minus(
            platformOrders._sum.paidAmount ?? 0,
          ) ?? new Prisma.Decimal(0)
        ).toString(),
        ...(actor.role === UserRole.SUPER_ADMIN && {
          platformProductRevenue:
            platformOrders._sum.platformProductRevenue?.toString() ?? '0',
          platformDeliveryRevenue:
            platformOrders._sum.platformDeliveryRevenue?.toString() ?? '0',
          platformRevenue:
            platformOrders._sum.platformProductRevenue
              ?.plus(platformOrders._sum.platformDeliveryRevenue ?? 0)
              .toString() ?? '0',
        }),
      },
    };
  }

  private resolveShop(actor: InventoryActor, requestedShopId?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) return requestedShopId;
    if (!actor.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (requestedShopId && requestedShopId !== actor.shopId)
      throw new ForbiddenException(
        'Нельзя просматривать аналитику другого магазина',
      );
    return actor.shopId;
  }

  private resolvePeriod(from?: string, to?: string) {
    const now = new Date();
    const dateFrom = from
      ? new Date(from)
      : new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
    const dateTo = to ? new Date(to) : now;
    if (
      Number.isNaN(dateFrom.getTime()) ||
      Number.isNaN(dateTo.getTime()) ||
      dateFrom > dateTo
    )
      throw new BadRequestException('Некорректный период аналитики');
    return { dateFrom, dateTo };
  }
}

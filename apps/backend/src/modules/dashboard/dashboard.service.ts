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
    ]);
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

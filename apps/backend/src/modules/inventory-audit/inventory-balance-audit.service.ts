import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryAuditQueryDto } from './dto/inventory-audit-query.dto';
@Injectable()
export class InventoryBalanceAuditService {
  constructor(private readonly prisma: PrismaService) {}
  async audit(query: InventoryAuditQueryDto) {
    const where: Prisma.ShopInventoryItemWhereInput = {
      ...(query.shopId && { shopId: query.shopId }),
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.inventoryItemId && { id: query.inventoryItemId }),
    };
    const items = await this.prisma.shopInventoryItem.findMany({
      where,
      select: {
        id: true,
        shopId: true,
        warehouseId: true,
        quantity: true,
        reservedQuantity: true,
        partCatalogItem: { select: { name: true } },
        warehouse: { select: { name: true } },
        movements: { select: { change: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const reserved = await this.prisma.customerOrderItem.groupBy({
      by: ['inventoryItemId'],
      where: { reservationStatus: 'RESERVED', order: { status: 'RESERVED' } },
      _sum: { quantity: true },
    });
    const reservedByItem = new Map(
      reserved.map((row) => [row.inventoryItemId, row._sum.quantity ?? 0]),
    );
    const rows = items.map((item) => {
      const calculatedQuantity = item.movements.reduce(
        (sum, movement) => sum + movement.change,
        0,
      );
      const difference = item.quantity - calculatedQuantity;
      const activeReservationQuantity = reservedByItem.get(item.id) ?? 0;
      return {
        inventoryItemId: item.id,
        shopId: item.shopId,
        warehouseId: item.warehouseId,
        catalogItemName: item.partCatalogItem.name,
        warehouseName: item.warehouse?.name ?? null,
        currentQuantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        availableQuantity: item.quantity - item.reservedQuantity,
        activeReservationQuantity,
        reservationDifference:
          item.reservedQuantity - activeReservationQuantity,
        calculatedQuantity,
        difference,
        movementCount: item.movements.length,
        status: difference === 0 ? ('OK' as const) : ('MISMATCH' as const),
      };
    });
    const filtered = query.onlyMismatches
      ? rows.filter((row) => row.status === 'MISMATCH')
      : rows;
    const [
      orphanMovements,
      movementsWithoutWarehouse,
      negativeInventory,
      expiredReservationsNotReleased,
    ] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ count: bigint }>
      >`SELECT COUNT(*)::bigint AS count FROM "InventoryMovement" movement LEFT JOIN "ShopInventoryItem" item ON item."id"=movement."inventoryItemId" WHERE item."id" IS NULL`,
      this.prisma.inventoryMovement.count({ where: { warehouseId: null } }),
      this.prisma.shopInventoryItem.count({
        where: { ...where, quantity: { lt: 0 } },
      }),
      this.prisma.customerOrder.count({
        where: {
          status: 'RESERVED',
          reservationExpiresAt: { lte: new Date() },
        },
      }),
    ]);
    const page = query.page ?? 1,
      limit = query.limit ?? 20;
    return {
      summary: {
        inventoryItems: rows.length,
        matched: rows.filter((row) => row.status === 'OK').length,
        mismatched: rows.filter((row) => row.status === 'MISMATCH').length,
        orphanMovements: Number(orphanMovements[0]?.count ?? 0),
        movementsWithoutWarehouse,
        negativeInventory,
      },
      reservationSummary: {
        inventoryItemsWithReservations: items.filter(
          (item) => item.reservedQuantity > 0,
        ).length,
        reservationMismatches: rows.filter(
          (row) => row.reservationDifference !== 0,
        ).length,
        reservedGreaterThanQuantity: items.filter(
          (item) => item.reservedQuantity > item.quantity,
        ).length,
        expiredReservationsNotReleased,
      },
      rows: filtered.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';
const include = {
  shop: { select: { id: true, name: true } },
  user: { select: { id: true, phone: true, firstName: true, lastName: true } },
  inventoryItem: {
    include: {
      partCatalogItem: {
        select: {
          id: true,
          internalCode: true,
          name: true,
          side: true,
          position: true,
          category: { include: { parent: true } },
        },
      },
    },
  },
} satisfies Prisma.InventoryMovementInclude;
@Injectable()
export class InventoryMovementsService {
  constructor(private prisma: PrismaService) {}
  private admin(a: InventoryActor) {
    return a.role === UserRole.SUPER_ADMIN;
  }
  private shop(a: InventoryActor) {
    if (!a.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    return a.shopId;
  }
  async findAll(q: InventoryMovementQueryDto, a: InventoryActor) {
    const page = q.page ?? 1,
      limit = q.limit ?? 20,
      shopId = this.admin(a) ? q.shopId : this.shop(a);
    const where: Prisma.InventoryMovementWhereInput = {
      ...(shopId && { shopId }),
      ...(q.inventoryItemId && { inventoryItemId: q.inventoryItemId }),
      ...(q.partCatalogItemId && {
        inventoryItem: { partCatalogItemId: q.partCatalogItemId },
      }),
      ...(q.userId && { userId: q.userId }),
      ...(q.type && { type: q.type }),
      ...(q.reference && {
        reference: { contains: q.reference, mode: 'insensitive' },
      }),
      ...((q.dateFrom || q.dateTo) && {
        createdAt: {
          ...(q.dateFrom && { gte: new Date(q.dateFrom) }),
          ...(q.dateTo && { lte: new Date(`${q.dateTo}T23:59:59.999Z`) }),
        },
      }),
      ...(q.search && {
        OR: [
          { reference: { contains: q.search, mode: 'insensitive' } },
          { notes: { contains: q.search, mode: 'insensitive' } },
          {
            inventoryItem: { sku: { contains: q.search, mode: 'insensitive' } },
          },
          {
            inventoryItem: {
              partCatalogItem: {
                name: { contains: q.search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async findOne(id: string, a: InventoryActor) {
    const m = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include,
    });
    if (!m || (!this.admin(a) && m.shopId !== this.shop(a)))
      throw new NotFoundException('Движение склада не найдено');
    return m;
  }
  async byItem(id: string, a: InventoryActor) {
    return this.findAll({ inventoryItemId: id }, a);
  }
}

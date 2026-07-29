import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  InventorySearchQueryDto,
  InventorySearchSortBy,
  SortOrder,
} from './dto/inventory-search-query.dto';
@Injectable()
export class InventorySearchService {
  constructor(private readonly prisma: PrismaService) {}
  async search(q: InventorySearchQueryDto, actor: InventoryActor) {
    const page = q.page ?? 1,
      limit = q.limit ?? 20;
    if (
      q.minPrice !== undefined &&
      q.maxPrice !== undefined &&
      q.minPrice > q.maxPrice
    )
      throw new BadRequestException('minPrice не может быть больше maxPrice');
    const shopId = this.shop(actor, q.shopId);
    const text = q.q?.trim();
    const compatibility = {
      ...(q.manufacturerId && {
        vehicleGeneration: {
          vehicleModel: { manufacturerId: q.manufacturerId },
        },
      }),
      ...(q.vehicleModelId && {
        vehicleGeneration: { vehicleModelId: q.vehicleModelId },
      }),
      ...(q.vehicleGenerationId && {
        vehicleGenerationId: q.vehicleGenerationId,
      }),
    };
    const partCatalogItem: Prisma.PartCatalogItemWhereInput = {
      isActive: true,
      category: { isActive: true },
      ...(q.categoryId && { categoryId: q.categoryId }),
      ...(Object.keys(compatibility).length && {
        compatibilities: { some: compatibility },
      }),
    };
    const where: Prisma.ShopInventoryItemWhereInput = {
      isActive: true,
      shop: { isActive: true },
      ...(shopId && { shopId }),
      partCatalogItem,
      ...(q.inStockOnly !== false && { quantity: { gt: 0 } }),
      ...((q.minPrice !== undefined || q.maxPrice !== undefined) && {
        price: {
          ...(q.minPrice !== undefined && {
            gte: new Prisma.Decimal(q.minPrice),
          }),
          ...(q.maxPrice !== undefined && {
            lte: new Prisma.Decimal(q.maxPrice),
          }),
        },
      }),
      ...(text && {
        OR: [
          { oemNumber: { contains: text, mode: 'insensitive' } },
          {
            partCatalogItem: { name: { contains: text, mode: 'insensitive' } },
          },
          {
            partCatalogItem: {
              internalCode: { contains: text, mode: 'insensitive' },
            },
          },
          {
            partCatalogItem: { slug: { contains: text, mode: 'insensitive' } },
          },
          {
            partCatalogItem: {
              category: { name: { contains: text, mode: 'insensitive' } },
            },
          },
          {
            partCatalogItem: {
              compatibilities: {
                some: {
                  vehicleGeneration: {
                    vehicleModel: {
                      OR: [
                        { name: { contains: text, mode: 'insensitive' } },
                        {
                          manufacturer: {
                            name: { contains: text, mode: 'insensitive' },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],
      }),
    };
    const order = q.sortOrder === SortOrder.desc ? 'desc' : 'asc';
    const orderBy: Prisma.ShopInventoryItemOrderByWithRelationInput =
      q.sortBy === InventorySearchSortBy.price
        ? { price: order }
        : q.sortBy === InventorySearchSortBy.quantity
          ? { quantity: order }
          : q.sortBy === InventorySearchSortBy.name
            ? { partCatalogItem: { name: order } }
            : { partCatalogItem: { name: 'asc' } };
    const [data, total] = await Promise.all([
      this.prisma.shopInventoryItem.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true } },
          partCatalogItem: {
            include: {
              category: { select: { id: true, name: true } },
              compatibilities: {
                include: {
                  vehicleGeneration: {
                    include: {
                      vehicleModel: { include: { manufacturer: true } },
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shopInventoryItem.count({ where }),
    ]);
    return {
      items: data.map((i) => {
        const c = i.partCatalogItem.compatibilities[0];
        const m = c?.vehicleGeneration.vehicleModel.manufacturer;
        return {
          inventoryItemId: i.id,
          partCatalogItemId: i.partCatalogItemId,
          internalCode: i.partCatalogItem.internalCode,
          name: i.partCatalogItem.name,
          slug: i.partCatalogItem.slug,
          oemNumber: i.oemNumber,
          category: i.partCatalogItem.category,
          manufacturer: m ? { id: m.id, name: m.name } : null,
          shop: i.shop,
          price: i.price.toFixed(2),
          quantity: i.quantity,
          availableQuantity: i.quantity,
          isActive: i.isActive,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  private shop(a: InventoryActor, requested?: string) {
    if (a.role === UserRole.SUPER_ADMIN) return requested;
    if (!a.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (requested && requested !== a.shopId)
      throw new ForbiddenException(
        'Нельзя просматривать остатки другого магазина',
      );
    return a.shopId;
  }
}

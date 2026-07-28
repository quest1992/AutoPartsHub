import { ForbiddenException, Injectable } from '@nestjs/common';
import { PartNumberType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { VinService } from '../vin/vin.service';
import { MarketplaceSearchQueryDto } from './dto/marketplace-search-query.dto';

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;

@Injectable()
export class MarketplaceSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vinService: VinService,
  ) {}

  async search(query: MarketplaceSearchQueryDto, actor: InventoryActor) {
    const text = query.q?.trim() ?? '';
    const isVin = vinPattern.test(text);
    const vehicle = isVin ? await this.vinService.decode(text) : null;
    const vinCatalogIds = vehicle?.catalogItems.map((item) => item.id) ?? [];
    const normalizedNumber = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shopId = this.resolveShop(actor, query.shopId);

    const numberTypes = this.numberTypes(query);
    const catalogAnd: Prisma.PartCatalogItemWhereInput[] = [];
    if (query.manufacturerId) {
      catalogAnd.push({
        partNumbers: { some: { manufacturerId: query.manufacturerId } },
      });
    }
    if (numberTypes) {
      catalogAnd.push({
        partNumbers: { some: { type: { in: numberTypes } } },
      });
    }
    const catalogWhere: Prisma.PartCatalogItemWhereInput = {
      isActive: true,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(catalogAnd.length && { AND: catalogAnd }),
      ...(isVin
        ? { id: { in: vinCatalogIds } }
        : text
          ? {
              OR: [
                { name: { contains: text, mode: 'insensitive' } },
                { normalizedName: { contains: text.toLowerCase() } },
                { searchTokens: { contains: text.toLowerCase() } },
                { internalCode: { contains: text, mode: 'insensitive' } },
                {
                  aliases: {
                    some: {
                      normalizedAlias: {
                        contains: text.toLowerCase(),
                      },
                    },
                  },
                },
                ...(normalizedNumber
                  ? [{
                      partNumbers: {
                        some: {
                          normalizedNumber: {
                            contains: normalizedNumber,
                            mode: 'insensitive' as const,
                          },
                        },
                      },
                    }]
                  : []),
              ],
            }
          : {}),
    };

    const minimum = Math.max(query.minQuantity ?? 0, query.inStockOnly ? 1 : 0);
    const where: Prisma.ShopInventoryItemWhereInput = {
      isActive: true,
      shop: { isActive: true },
      partCatalogItem: catalogWhere,
      ...(shopId && { shopId }),
      ...(minimum > 0 && { quantity: { gte: minimum } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shopInventoryItem.findMany({
        where,
        include: {
          shop: {
            select: { id: true, name: true, city: true, address: true },
          },
          partCatalogItem: {
            include: {
              category: { select: { id: true, name: true } },
              partNumbers: {
                include: {
                  manufacturer: { select: { id: true, name: true } },
                },
                orderBy: [{ isPrimary: 'desc' }, { rawNumber: 'asc' }],
              },
              vehicleFitments: {
                take: 3,
                include: {
                  engine: {
                    include: {
                      generation: {
                        include: {
                          vehicleModel: {
                            include: { manufacturer: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
              compatibilities: {
                take: 3,
                include: {
                  vehicleGeneration: {
                    include: {
                      vehicleModel: { include: { manufacturer: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ price: 'asc' }, { quantity: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.shopInventoryItem.count({ where }),
    ]);

    return {
      queryType: isVin ? 'VIN' : this.detectTextType(items, normalizedNumber),
      vehicle,
      items: items.map((item) => this.present(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private numberTypes(query: MarketplaceSearchQueryDto) {
    if (query.originalOnly && !query.analogOnly) return [PartNumberType.OEM];
    if (query.analogOnly && !query.originalOnly) {
      return [
        PartNumberType.AFTERMARKET,
        PartNumberType.CROSS,
        PartNumberType.INTERNAL,
      ];
    }
    return null;
  }

  private detectTextType(items: any[], normalizedNumber: string) {
    if (!normalizedNumber) return 'NAME';
    const match = items
      .flatMap((item) => item.partCatalogItem.partNumbers)
      .find((number) => number.normalizedNumber.includes(normalizedNumber));
    if (!match) return 'NAME';
    return match.type === PartNumberType.OEM ? 'OEM' : 'CROSS';
  }

  private present(item: any) {
    const numbers = item.partCatalogItem.partNumbers;
    const compatibility = [
      ...item.partCatalogItem.vehicleFitments.map((fitment) => {
        const generation = fitment.engine.generation;
        const model = generation.vehicleModel;
        return `${model.manufacturer.name} ${model.name} ${generation.name} ${fitment.engine.code}`;
      }),
      ...item.partCatalogItem.compatibilities.map((entry) => {
        const generation = entry.vehicleGeneration;
        return `${generation.vehicleModel.manufacturer.name} ${generation.vehicleModel.name} ${generation.name}`;
      }),
    ].filter((value, index, values) => values.indexOf(value) === index);
    const primaryManufacturer = numbers.find((number) => number.isPrimary)?.manufacturer
      ?? numbers.find((number) => number.manufacturer)?.manufacturer;

    return {
      inventoryItemId: item.id,
      catalogItemId: item.partCatalogItemId,
      name: item.partCatalogItem.name,
      internalCode: item.partCatalogItem.internalCode,
      imageUrl: item.imageUrl,
      oemNumbers: numbers
        .filter((number) => number.type === PartNumberType.OEM)
        .map((number) => number.rawNumber),
      crossNumbers: numbers
        .filter((number) => number.type !== PartNumberType.OEM)
        .map((number) => number.rawNumber),
      shop: item.shop,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      currency: item.currency,
      warehouse: item.location,
      manufacturer: item.brand
        ? { id: null, name: item.brand }
        : primaryManufacturer,
      category: item.partCatalogItem.category,
      compatibility,
      condition: item.condition,
    };
  }

  private resolveShop(actor: InventoryActor, requested?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) return requested;
    if (!actor.shopId) {
      throw new ForbiddenException('Пользователь не привязан к магазину');
    }
    if (requested && requested !== actor.shopId) {
      throw new ForbiddenException('Нельзя искать остатки другого магазина');
    }
    return actor.shopId;
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { PartNumberType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CatalogSearchService } from '../part-catalog/catalog-search.service';
import { VinService } from '../vin/vin.service';
import { MarketplaceSearchQueryDto } from './dto/marketplace-search-query.dto';

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;

@Injectable()
export class MarketplaceSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vinService: VinService,
    private readonly catalogSearch: CatalogSearchService,
  ) {}

  async search(query: MarketplaceSearchQueryDto, actor: InventoryActor) {
    const text = query.q?.trim() ?? '';
    const isVin = vinPattern.test(text);
    const vehicle = isVin ? await this.vinService.decode(text) : null;
    const vinCatalogIds = vehicle?.catalogItems.map((item) => item.id) ?? [];
    const normalizedNumber = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const catalogNameIds =
      text && !isVin
        ? (
            await this.catalogSearch.findMatches({
              search: text,
              isActive: true,
              limit: 100,
            })
          ).map((item) => item.id)
        : [];
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
      category: { isActive: true },
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(catalogAnd.length && { AND: catalogAnd }),
      ...(isVin
        ? { id: { in: vinCatalogIds } }
        : text
          ? {
              OR: [
                { id: { in: catalogNameIds } },
                ...(normalizedNumber
                  ? [
                      {
                        partNumbers: {
                          some: {
                            normalizedNumber: {
                              contains: normalizedNumber,
                              mode: 'insensitive' as const,
                            },
                          },
                        },
                      },
                    ]
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

    if (text && !isVin && normalizedNumber) {
      where.OR = [
        { oemNumber: { contains: text, mode: 'insensitive' } },
        { partCatalogItem: catalogWhere },
      ];
      where.partCatalogItem = {
        isActive: true,
        category: { isActive: true },
        ...(query.categoryId && { categoryId: query.categoryId }),
        ...(catalogAnd.length && { AND: catalogAnd }),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shopInventoryItem.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
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
    const inventoryOemMatch = items.some(
      (item) =>
        item.oemNumber &&
        item.oemNumber
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .includes(normalizedNumber),
    );
    if (inventoryOemMatch) return 'OEM';
    const match = items
      .flatMap((item) => item.partCatalogItem.partNumbers)
      .find((number) => number.normalizedNumber.includes(normalizedNumber));
    if (!match) return 'NAME';
    return match.type === PartNumberType.OEM ? 'OEM' : 'CROSS';
  }

  private present(item: any) {
    const numbers = item.partCatalogItem.partNumbers;
    const sellerCompatibility = (item.compatibility ?? '')
      .split(/[\n,;]+/)
      .map((value: string) => value.trim())
      .filter(Boolean);
    const compatibility = [
      ...sellerCompatibility,
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
    const primaryManufacturer =
      numbers.find((number) => number.isPrimary)?.manufacturer ??
      numbers.find((number) => number.manufacturer)?.manufacturer;

    return {
      inventoryItemId: item.id,
      catalogItemId: item.partCatalogItemId,
      name: item.partCatalogItem.name,
      internalCode: item.partCatalogItem.internalCode,
      imageUrl: item.imageUrl,
      oemNumbers: [
        ...(item.oemNumber ? [item.oemNumber] : []),
        ...numbers
          .filter((number) => number.type === PartNumberType.OEM)
          .map((number) => number.rawNumber),
      ].filter((value, index, values) => values.indexOf(value) === index),
      crossNumbers: numbers
        .filter((number) => number.type !== PartNumberType.OEM)
        .map((number) => number.rawNumber),
      shop: item.shop,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      currency: item.currency,
      warehouse: item.warehouse?.name ?? item.location,
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
      throw new ForbiddenException(
        'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РїСЂРёРІСЏР·Р°РЅ Рє РјР°РіР°Р·РёРЅСѓ',
      );
    }
    if (requested && requested !== actor.shopId) {
      throw new ForbiddenException(
        'РќРµР»СЊР·СЏ РёСЃРєР°С‚СЊ РѕСЃС‚Р°С‚РєРё РґСЂСѓРіРѕРіРѕ РјР°РіР°Р·РёРЅР°',
      );
    }
    return actor.shopId;
  }
}

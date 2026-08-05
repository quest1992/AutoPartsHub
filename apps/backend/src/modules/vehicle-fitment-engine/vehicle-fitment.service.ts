import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VehicleFitmentQueryDto,
  VehicleFitmentSort,
} from './dto/vehicle-fitment-query.dto';

type VehicleContext = {
  id: string;
  year: number;
  vehicleModel: {
    id: string;
    name: string;
    manufacturer: { id: string; name: string };
  };
  generation: { id: string; name: string } | null;
  powertrainType: string;
  trim: string | null;
  variant: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class VehicleFitmentService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: unknown }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async specification(id: string) {
    return this.cached(`specification:${id}`, async () => {
      const vehicle = await this.vehicle(id);
      const fitments = await this.prisma.oemPartFitment.findMany({
        where: {
          ...this.fitmentWhere(vehicle),
          isActive: true,
          oemPart: { isActive: true },
        },
        select: {
          oemPartId: true,
          oemPart: {
            select: {
              categories: {
                where: { catalogItem: { isActive: true } },
                select: {
                  catalogItem: {
                    select: {
                      category: {
                        select: {
                          id: true,
                          name: true,
                          parent: {
                            select: {
                              id: true,
                              name: true,
                              parent: { select: { id: true, name: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      const categories = new Map<
        string,
        { id: string; name: string; oemIds: Set<string> }
      >();
      for (const fitment of fitments) {
        for (const mapping of fitment.oemPart.categories) {
          const category = mapping.catalogItem.category;
          const root = category.parent?.parent ?? category.parent ?? category;
          const entry = categories.get(root.id) ?? {
            id: root.id,
            name: root.name,
            oemIds: new Set<string>(),
          };
          entry.oemIds.add(fitment.oemPartId);
          categories.set(root.id, entry);
        }
      }
      return {
        vehicle,
        categories: [...categories.values()]
          .map(({ oemIds, ...category }) => ({
            ...category,
            itemsCount: oemIds.size,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        hasConfirmedFitments: fitments.length > 0,
        message:
          fitments.length === 0
            ? 'Для этой модификации пока нет подтверждённых данных о совместимости.'
            : null,
      };
    });
  }

  async category(
    specificationId: string,
    categoryId: string,
    query: VehicleFitmentQueryDto,
  ) {
    this.validateFilters(query);
    const vehicle = await this.vehicle(specificationId);
    const category = await this.prisma.partCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true, name: true, description: true },
    });
    if (!category) throw new NotFoundException('Part category not found');

    const oemParts = await this.prisma.oemPart.findMany({
      where: {
        isActive: true,
        manufacturerId: query.manufacturerId,
        fitments: {
          some: { ...this.fitmentWhere(vehicle), isActive: true },
        },
        categories: {
          some: {
            catalogItem: {
              isActive: true,
              category: {
                OR: [
                  { id: categoryId },
                  { parentId: categoryId },
                  { parent: { parentId: categoryId } },
                ],
              },
            },
          },
        },
      },
      select: this.oemSelect(),
    });
    const enriched = await this.enrich(oemParts, query);
    const sorted = this.sortParts(enriched, query.sort);
    const start = (query.page - 1) * query.limit;
    return {
      category,
      parts: sorted.slice(start, start + query.limit),
      meta: {
        total: sorted.length,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(sorted.length / query.limit),
      },
      message:
        sorted.length === 0
          ? 'Для этой модификации пока нет подтверждённых данных о совместимости.'
          : null,
    };
  }

  async part(oemId: string, query: VehicleFitmentQueryDto) {
    this.validateFilters(query);
    const oem = await this.prisma.oemPart.findUnique({
      where: { id: oemId, isActive: true },
      select: this.oemSelect(),
    });
    if (!oem) throw new NotFoundException('OEM part not found');
    const [part] = await this.enrich([oem], query);
    return {
      original: part
        ? {
            id: part.id,
            number: part.number,
            displayNumber: part.displayNumber,
            description: part.description,
            manufacturer: part.manufacturer,
            categories: part.categories,
          }
        : {
            id: oem.id,
            number: oem.number,
            displayNumber: oem.displayNumber,
            description: oem.description,
            manufacturer: oem.manufacturer,
            categories: oem.categories,
          },
      crossReferences: oem.outgoingCrossReferences,
      brands: [
        ...new Map(
          [
            ...oem.brands.map((item) => item.partBrand),
            ...oem.outgoingCrossReferences
              .map((item) => item.partBrand)
              .filter((item): item is NonNullable<typeof item> => !!item),
          ].map((brand) => [brand.id, brand]),
        ).values(),
      ],
      offers: part?.offers ?? [],
    };
  }

  private oemSelect() {
    return {
      id: true,
      number: true,
      normalizedNumber: true,
      displayNumber: true,
      description: true,
      manufacturer: { select: { id: true, name: true } },
      aliases: { select: { alias: true } },
      categories: {
        select: {
          isPrimary: true,
          catalogItem: {
            select: {
              id: true,
              name: true,
              description: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
      brands: {
        select: {
          relationType: true,
          partBrand: { select: { id: true, officialName: true } },
        },
      },
      outgoingCrossReferences: {
        where: { isActive: true },
        select: {
          id: true,
          relationType: true,
          confidence: true,
          externalPartNumber: true,
          normalizedExternalPartNumber: true,
          toOemPart: {
            select: {
              id: true,
              displayNumber: true,
              manufacturer: { select: { id: true, name: true } },
            },
          },
          partBrand: { select: { id: true, officialName: true } },
        },
      },
    } satisfies Prisma.OemPartSelect;
  }

  private async enrich(
    oemParts: Array<any>,
    query: VehicleFitmentQueryDto,
  ): Promise<Array<any>> {
    if (oemParts.length === 0) return [];
    const oemIds = oemParts.map((item) => item.id);
    const originalNumbers = oemParts.flatMap((item) => [
      item.number,
      item.displayNumber,
      ...item.aliases.map((alias: { alias: string }) => alias.alias),
    ]);
    const analogPairs = oemParts.flatMap((item) =>
      item.outgoingCrossReferences
        .filter(
          (reference: any) =>
            reference.partBrand?.id && reference.normalizedExternalPartNumber,
        )
        .map((reference: any) => ({
          partBrandId: reference.partBrand.id as string,
          normalizedExternalPartNumber:
            reference.normalizedExternalPartNumber as string,
        })),
    );
    const priceWhere: Prisma.DecimalFilter = {
      gte: query.minPrice,
      lte: query.maxPrice,
    };
    const inventory = await this.prisma.shopInventoryItem.findMany({
      where: {
        isActive: true,
        ...(query.inStock && { quantity: { gt: 0 } }),
        ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
          price: priceWhere,
        }),
        ...(query.brandId && { partBrandId: query.brandId }),
        OR: [
          ...(!query.analogOnly ? [{ oemPartId: { in: oemIds } }] : []),
          ...(!query.analogOnly
            ? [
                {
                  oemNumber: {
                    in: originalNumbers,
                    mode: 'insensitive' as const,
                  },
                },
              ]
            : []),
          ...(!query.originalOnly
            ? analogPairs.map((pair) => ({
                partBrandId: pair.partBrandId,
                normalizedExternalPartNumber: pair.normalizedExternalPartNumber,
              }))
            : []),
        ],
      },
      select: {
        id: true,
        price: true,
        currency: true,
        quantity: true,
        reservedQuantity: true,
        sku: true,
        oemNumber: true,
        externalPartNumber: true,
        normalizedExternalPartNumber: true,
        oemPartId: true,
        shop: { select: { name: true } },
        partBrand: { select: { id: true, officialName: true } },
      },
    });

    return oemParts
      .map((oem) => {
        const oemNumbers = [
          oem.number,
          oem.displayNumber,
          ...oem.aliases.map((alias: { alias: string }) => alias.alias),
        ];
        const analogKeys = new Set(
          oem.outgoingCrossReferences.map(
            (reference: any) =>
              `${reference.partBrand?.id ?? ''}|${reference.normalizedExternalPartNumber ?? ''}`,
          ),
        );
        const offers = inventory
          .filter(
            (item) =>
              item.oemPartId === oem.id ||
              oemNumbers.includes(item.oemNumber) ||
              analogKeys.has(
                `${item.partBrand?.id ?? ''}|${item.normalizedExternalPartNumber ?? ''}`,
              ),
          )
          .map(({ oemPartId, ...item }) => ({
            ...item,
            availableQuantity: Math.max(
              0,
              item.quantity - item.reservedQuantity,
            ),
            kind: oemPartId === oem.id ? 'ORIGINAL' : 'ANALOG',
          }))
          .filter((item) => !query.inStock || item.availableQuantity > 0)
          .sort((a, b) => Number(a.price) - Number(b.price));
        return {
          ...oem,
          analogsCount: oem.outgoingCrossReferences.length,
          shopsCount: new Set(offers.map((offer) => offer.shop.name)).size,
          offersCount: offers.length,
          minimumPrice: offers.length ? String(offers[0].price) : null,
          availableQuantity: offers.reduce(
            (sum, offer) => sum + offer.availableQuantity,
            0,
          ),
          offers,
        };
      })
      .filter((item) => {
        if (
          query.originalOnly &&
          item.offers.every((x: any) => x.kind !== 'ORIGINAL')
        )
          return false;
        if (
          query.analogOnly &&
          item.offers.every((x: any) => x.kind !== 'ANALOG')
        )
          return false;
        if (
          (query.inStock ||
            query.minPrice !== undefined ||
            query.maxPrice !== undefined ||
            query.brandId) &&
          item.offers.length === 0
        )
          return false;
        return true;
      });
  }

  private sortParts(items: any[], sort: VehicleFitmentSort) {
    return [...items].sort((a, b) => {
      if (sort === VehicleFitmentSort.AVAILABILITY)
        return b.availableQuantity - a.availableQuantity;
      if (sort === VehicleFitmentSort.SHOPS) return b.shopsCount - a.shopsCount;
      if (sort === VehicleFitmentSort.BRAND)
        return a.manufacturer.name.localeCompare(b.manufacturer.name);
      return (
        (a.minimumPrice === null ? Number.MAX_VALUE : Number(a.minimumPrice)) -
        (b.minimumPrice === null ? Number.MAX_VALUE : Number(b.minimumPrice))
      );
    });
  }

  private fitmentWhere(
    vehicle: VehicleContext,
  ): Prisma.OemPartFitmentWhereInput {
    const yearMatch: Prisma.OemPartFitmentWhereInput = {
      AND: [
        { OR: [{ yearFrom: null }, { yearFrom: { lte: vehicle.year } }] },
        { OR: [{ yearTo: null }, { yearTo: { gte: vehicle.year } }] },
      ],
    };
    return {
      OR: [
        { vehicleSpecificationId: vehicle.id },
        ...(vehicle.generation
          ? [
              {
                vehicleSpecificationId: null,
                vehicleGenerationId: vehicle.generation.id,
                ...yearMatch,
              },
            ]
          : []),
        {
          vehicleSpecificationId: null,
          vehicleGenerationId: null,
          vehicleModelId: vehicle.vehicleModel.id,
          ...yearMatch,
        },
        {
          vehicleSpecificationId: null,
          vehicleGenerationId: null,
          vehicleModelId: null,
          manufacturerId: vehicle.vehicleModel.manufacturer.id,
          ...yearMatch,
        },
      ],
    };
  }

  private async vehicle(id: string): Promise<VehicleContext> {
    const vehicle = await this.prisma.vehicleSpecification.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        year: true,
        trim: true,
        variant: true,
        powertrainType: true,
        vehicleModel: {
          select: {
            id: true,
            name: true,
            manufacturer: { select: { id: true, name: true } },
          },
        },
        generation: { select: { id: true, name: true } },
      },
    });
    if (!vehicle)
      throw new NotFoundException('Vehicle specification not found');
    return vehicle;
  }

  private validateFilters(query: VehicleFitmentQueryDto) {
    if (query.originalOnly && query.analogOnly)
      throw new BadRequestException(
        'originalOnly and analogOnly cannot be enabled together',
      );
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    )
      throw new BadRequestException('minPrice cannot exceed maxPrice');
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    const value = await load();
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    if (this.cache.size > 500) {
      const first = this.cache.keys().next().value as string | undefined;
      if (first) this.cache.delete(first);
    }
    return value;
  }
}

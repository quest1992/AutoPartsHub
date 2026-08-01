import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getEvManufacturerPriorityRank,
  matchesManufacturerSearch,
} from '../../config/ev-manufacturer-priority';
import {
  VehicleCatalogItemsQueryDto,
  VehicleCatalogQueryDto,
} from './dto/vehicle-catalog-query.dto';

const pageMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

@Injectable()
export class VehicleCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: VehicleCatalogQueryDto) {
    const text = query.search?.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!text) return { data: [], meta: pageMeta(0, query.page, query.limit) };
    if (text.length < 2)
      return { data: [], meta: pageMeta(0, query.page, query.limit) };
    const words = text.split(/\s+/).filter(Boolean);
    const normalizedText = text.toLocaleLowerCase();
    const aliasRows = await this.prisma.vehicleModelAlias.findMany({
      where: {
        OR: words
          .filter((word) => word.length >= 2)
          .map((word) => ({
            normalizedName: { contains: word.toLocaleLowerCase() },
          })),
      },
      select: {
        name: true,
        vehicleModelId: true,
        vehicleModel: { select: { mergedIntoId: true } },
      },
      take: query.limit * 2,
    });
    const aliasModelIds = [
      ...new Set(
        aliasRows.map(
          (alias) => alias.vehicleModel.mergedIntoId ?? alias.vehicleModelId,
        ),
      ),
    ];
    const where: Prisma.VehicleModelWhereInput = {
      isActive: true,
      manufacturer: { isActive: true },
      AND: words.map((word) => ({
        OR: [
          { name: { contains: word, mode: 'insensitive' } },
          { exportName: { contains: word, mode: 'insensitive' } },
          {
            aliases: {
              some: { normalizedName: { contains: word.toLowerCase() } },
            },
          },
          { manufacturer: { name: { contains: word, mode: 'insensitive' } } },
          {
            manufacturer: {
              englishName: { contains: word, mode: 'insensitive' },
            },
          },
          ...(aliasModelIds.length ? [{ id: { in: aliasModelIds } }] : []),
        ],
      })),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.vehicleModel.count({ where }),
      this.prisma.vehicleModel.findMany({
        where,
        select: {
          id: true,
          name: true,
          exportName: true,
          startYear: true,
          endYear: true,
          powertrainType: true,
          manufacturer: { select: { id: true, name: true, logo: true } },
          aliases: { select: { name: true, normalizedName: true } },
          generations: {
            where: { isActive: true },
            select: { id: true, name: true, startYear: true, endYear: true },
            orderBy: { startYear: 'desc' },
          },
          specifications: {
            where: { isActive: true },
            select: {
              id: true,
              generationId: true,
              year: true,
              trim: true,
              variant: true,
              powertrainType: true,
            },
            orderBy: { year: 'desc' },
          },
        },
        orderBy: [{ manufacturer: { name: 'asc' } }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    const data = rows
      .map((row) => {
        const mergedAliases = aliasRows.filter(
          (alias) =>
            (alias.vehicleModel.mergedIntoId ?? alias.vehicleModelId) ===
            row.id,
        );
        const matchedAlias =
          [
            ...(row.aliases ?? []),
            ...mergedAliases.map((alias) => ({
              name: alias.name,
              normalizedName: alias.name.toLocaleLowerCase(),
            })),
          ].find(
            (alias) =>
              normalizedText.includes(alias.normalizedName) ||
              alias.normalizedName.includes(normalizedText),
          )?.name ?? null;
        const specifications = row.specifications ?? [];
        const generations = row.generations ?? [];
        const onlySpec = specifications.length === 1 ? specifications[0] : null;
        const generation = onlySpec?.generationId
          ? (generations.find((item) => item.id === onlySpec.generationId) ??
            null)
          : generations.length === 1
            ? generations[0]
            : null;
        return {
          type: onlySpec ? 'SPECIFICATION' : 'MODEL',
          manufacturerId: row.manufacturer.id,
          manufacturerName: row.manufacturer.name,
          modelId: row.id,
          modelName: row.name,
          matchedAlias:
            matchedAlias ??
            (row.exportName &&
            normalizedText.includes(row.exportName.toLocaleLowerCase())
              ? row.exportName
              : null),
          generationId: generation?.id ?? null,
          generationName: generation?.name ?? null,
          specificationId: onlySpec?.id ?? null,
          yearFrom: generation?.startYear ?? row.startYear,
          yearTo: generation?.endYear ?? row.endYear,
          powertrain: onlySpec?.powertrainType ?? row.powertrainType,
          specificationCount: specifications.length,
        };
      })
      .sort(
        (a, b) =>
          this.searchRank(a, normalizedText) -
          this.searchRank(b, normalizedText),
      );
    return { data, meta: pageMeta(total, query.page, query.limit) };
  }

  private searchRank(
    item: {
      manufacturerName: string;
      modelName: string;
      matchedAlias: string | null;
    },
    query: string,
  ) {
    const full =
      `${item.manufacturerName} ${item.modelName}`.toLocaleLowerCase();
    const model = item.modelName.toLocaleLowerCase();
    if (full === query) return 0;
    if (model === query) return 1;
    if (item.matchedAlias?.toLocaleLowerCase() === query) return 2;
    if (full.startsWith(query) || model.startsWith(query)) return 3;
    return 4;
  }

  async manufacturers(query: VehicleCatalogQueryDto) {
    const rows = await this.prisma.manufacturer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        englishName: true,
        country: true,
        logo: true,
        _count: { select: { vehicleModels: true } },
      },
    });
    const search = query.search?.trim();
    const ranked = rows
      .filter(
        (row) =>
          !search ||
          matchesManufacturerSearch([row.name, row.englishName], search),
      )
      .map((row) => {
        const priorityRank = getEvManufacturerPriorityRank(
          row.name,
          row.englishName,
        );
        return {
          ...row,
          priorityGroup:
            priorityRank === null
              ? ('OTHER' as const)
              : ('POPULAR_EV' as const),
          priorityRank,
        };
      })
      .sort((a, b) => {
        if (a.priorityRank !== null && b.priorityRank !== null)
          return a.priorityRank - b.priorityRank;
        if (a.priorityRank !== null) return -1;
        if (b.priorityRank !== null) return 1;
        return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
      });
    const total = ranked.length;
    const data = ranked.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit,
    );
    return { data, meta: pageMeta(total, query.page, query.limit) };
  }
  async models(manufacturerId: string, query: VehicleCatalogQueryDto) {
    await this.ensureManufacturer(manufacturerId);
    const where: Prisma.VehicleModelWhereInput = {
      manufacturerId,
      isActive: true,
      ...(query.search?.trim() && {
        OR: [
          { name: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            exportName: { contains: query.search.trim(), mode: 'insensitive' },
          },
          {
            aliases: {
              some: {
                normalizedName: {
                  contains: query.search.trim().toLowerCase(),
                },
              },
            },
          },
        ],
      }),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.vehicleModel.count({ where }),
      this.prisma.vehicleModel.findMany({
        where,
        select: {
          id: true,
          name: true,
          exportName: true,
          aliases: { select: { name: true }, orderBy: { name: 'asc' } },
          startYear: true,
          endYear: true,
          powertrainType: true,
          generations: {
            where: { isActive: true },
            select: { id: true, name: true, startYear: true, endYear: true },
            orderBy: { startYear: 'asc' },
          },
          specifications: {
            where: { isActive: true },
            select: {
              id: true,
              generationId: true,
              year: true,
              trim: true,
              variant: true,
              powertrainType: true,
              driveType: true,
              batteryGrossKwh: true,
              motorPowerKw: true,
            },
            orderBy: { year: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { data, meta: pageMeta(total, query.page, query.limit) };
  }

  async model(id: string) {
    const model = await this.prisma.vehicleModel.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        exportName: true,
        aliases: { select: { name: true }, orderBy: { name: 'asc' } },
        startYear: true,
        endYear: true,
        powertrainType: true,
        manufacturer: { select: { id: true, name: true, logo: true } },
        generations: {
          where: { isActive: true },
          select: { id: true, name: true, startYear: true, endYear: true },
          orderBy: { startYear: 'asc' },
        },
        specifications: {
          where: { isActive: true },
          select: {
            id: true,
            generationId: true,
            year: true,
            trim: true,
            variant: true,
            powertrainType: true,
            driveType: true,
            batteryGrossKwh: true,
            motorPowerKw: true,
            engineDisplacementCc: true,
          },
          orderBy: { year: 'desc' },
        },
      },
    });
    if (!model) throw new NotFoundException('Vehicle model not found');
    return model;
  }

  async specification(id: string) {
    const spec = await this.prisma.vehicleSpecification.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        year: true,
        trim: true,
        variant: true,
        powertrainType: true,
        driveType: true,
        transmissionType: true,
        engineDisplacementCc: true,
        enginePowerKw: true,
        motorPowerKw: true,
        batteryGrossKwh: true,
        batteryUsableKwh: true,
        platform: true,
        vehicleModel: {
          select: {
            id: true,
            name: true,
            manufacturer: { select: { id: true, name: true, logo: true } },
          },
        },
        generation: {
          select: { id: true, name: true, startYear: true, endYear: true },
        },
      },
    });
    if (!spec) throw new NotFoundException('Vehicle specification not found');
    return spec;
  }

  async categories(specificationId: string) {
    await this.specification(specificationId);
    return this.prisma.partCategory.findMany({
      where: { parentId: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { children: true, partCatalogItems: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async category(specificationId: string, categoryId: string) {
    await this.specification(specificationId);
    const category = await this.prisma.partCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parent: { select: { id: true, name: true } },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            _count: { select: { partCatalogItems: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!category) throw new NotFoundException('Part category not found');
    return category;
  }

  async items(
    specificationId: string,
    categoryId: string,
    query: VehicleCatalogItemsQueryDto,
  ) {
    const spec = await this.specification(specificationId);
    const categoryIds = await this.descendantCategoryIds(categoryId);
    const where: Prisma.PartCatalogItemWhereInput = {
      categoryId: { in: categoryIds },
      isActive: true,
      OR: [
        { shopInventoryItems: { some: { isActive: true } } },
        {
          oemPartCategories: {
            some: {
              oemPart: {
                fitments: {
                  some: {
                    OR: [
                      { vehicleSpecificationId: specificationId },
                      {
                        vehicleModelId: spec.vehicleModel.id,
                        vehicleSpecificationId: null,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.partCatalogItem.count({ where }),
      this.prisma.partCatalogItem.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: { select: { id: true, name: true } },
          oemPartCategories: {
            where: {
              oemPart: {
                fitments: {
                  some: {
                    OR: [
                      { vehicleSpecificationId: specificationId },
                      { vehicleModelId: spec.vehicleModel.id },
                    ],
                  },
                },
              },
            },
            select: {
              oemPart: {
                select: {
                  id: true,
                  displayNumber: true,
                  description: true,
                  outgoingCrossReferences: {
                    select: {
                      id: true,
                      externalPartNumber: true,
                      partBrand: { select: { id: true, officialName: true } },
                    },
                  },
                },
              },
            },
          },
          shopInventoryItems: {
            where: { isActive: true },
            select: {
              id: true,
              price: true,
              currency: true,
              quantity: true,
              reservedQuantity: true,
              brand: true,
              sku: true,
              oemNumber: true,
              externalPartNumber: true,
              shop: { select: { id: true, name: true } },
              partBrand: { select: { id: true, officialName: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    const data = rows.map((row) => ({
      ...row,
      offers: [...row.shopInventoryItems].sort((a, b) => {
        if (query.sort === 'availability')
          return (
            b.quantity - b.reservedQuantity - (a.quantity - a.reservedQuantity)
          );
        if (query.sort === 'name')
          return a.shop.name.localeCompare(b.shop.name);
        return Number(a.price) - Number(b.price);
      }),
      shopInventoryItems: undefined,
    }));
    return { data, meta: pageMeta(total, query.page, query.limit) };
  }

  private async ensureManufacturer(id: string) {
    if (
      !(await this.prisma.manufacturer.findFirst({
        where: { id, isActive: true },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Manufacturer not found');
  }

  private async descendantCategoryIds(id: string) {
    const root = await this.prisma.partCategory.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            children: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
    });
    if (!root) throw new NotFoundException('Part category not found');
    return [
      root.id,
      ...root.children.flatMap((child) => [
        child.id,
        ...child.children.map((item) => item.id),
      ]),
    ];
  }
}

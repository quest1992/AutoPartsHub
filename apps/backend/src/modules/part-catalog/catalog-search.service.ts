import { Injectable } from '@nestjs/common';
import { PartPosition, PartSide, Prisma } from '@prisma/client';
import {
  getPartNameTokenSearchVariants,
  getPartNameTokens,
  normalizePartName,
} from '../../common/utils/part-name-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { PartCatalogItemQueryDto } from './dto/part-catalog-item-query.dto';

export type CatalogSearchOptions = PartCatalogItemQueryDto & {
  search: string;
  side?: PartSide;
  position?: PartPosition;
};

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  parent: { select: { id: true, name: true, slug: true, isActive: true } },
} satisfies Prisma.PartCategorySelect;

const vehicleGenerationSelect = {
  id: true,
  name: true,
  slug: true,
  startYear: true,
  endYear: true,
  isActive: true,
  vehicleModel: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      manufacturer: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
  },
} satisfies Prisma.VehicleGenerationSelect;

const categorySearchSelect = {
  id: true,
  name: true,
  isActive: true,
  parent: {
    select: {
      name: true,
      parent: { select: { name: true } },
    },
  },
  _count: { select: { partCatalogItems: true } },
  catalogItemMappings: {
    where: { classification: 'CATALOG_ITEM' as const },
    select: {
      targetCatalogItem: {
        select: { id: true, name: true },
      },
    },
  },
} satisfies Prisma.PartCategorySelect;
type CategorySearchRow = Prisma.PartCategoryGetPayload<{
  select: typeof categorySearchSelect;
}>;

/**
 * Единственная бизнес-реализация текстового поиска центрального каталога.
 * Контроллеры, импорт и модерация должны делегировать поиск только сюда.
 */
@Injectable()
export class CatalogSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: PartCatalogItemQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const categoryIds = query.rootCategoryId
      ? await this.getCategorySubtreeIds(query.rootCategoryId)
      : undefined;
    const rawSearch = query.search ?? query.q;
    const normalizedSearch = rawSearch ? normalizePartName(rawSearch) : '';
    const tokenGroups = normalizedSearch
      ? getPartNameTokens(normalizedSearch).map((token) => ({
          OR: getPartNameTokenSearchVariants(token).flatMap((variant) => [
            { name: { contains: variant, mode: 'insensitive' as const } },
            {
              normalizedName: {
                contains: variant,
                mode: 'insensitive' as const,
              },
            },
            {
              searchTokens: {
                contains: variant,
                mode: 'insensitive' as const,
              },
            },
            {
              aliases: {
                some: {
                  isApproved: true,
                  normalizedAlias: {
                    contains: variant,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
          ]),
        }))
      : [];

    const where: Prisma.PartCatalogItemWhereInput = {
      isActive: true,
      category: { isActive: true },
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(query.side && { side: query.side }),
      ...(query.position && { position: query.position }),
      ...(query.isUniversal !== undefined && {
        isUniversal: query.isUniversal,
      }),
      ...(query.internalCode && {
        internalCode: { equals: query.internalCode, mode: 'insensitive' },
      }),
      ...(normalizedSearch && {
        OR: [
          { AND: tokenGroups },
          { slug: { contains: normalizedSearch, mode: 'insensitive' } },
          { internalCode: { contains: normalizedSearch, mode: 'insensitive' } },
        ],
      }),
    };

    const compatibilityFilter: Prisma.PartCompatibilityWhereInput = {
      ...(query.vehicleGenerationId && {
        vehicleGenerationId: query.vehicleGenerationId,
      }),
      ...(query.vehicleModelId && {
        vehicleGeneration: { vehicleModelId: query.vehicleModelId },
      }),
      ...(query.manufacturerId && {
        vehicleGeneration: {
          vehicleModel: { manufacturerId: query.manufacturerId },
        },
      }),
    };
    if (Object.keys(compatibilityFilter).length)
      where.compatibilities = { some: compatibilityFilter };

    const [foundData, total, categoryRows] = await Promise.all([
      this.prisma.partCatalogItem.findMany({
        where,
        include: {
          category: { select: categorySelect },
          compatibilities: {
            include: { vehicleGeneration: { select: vehicleGenerationSelect } },
            take: 1,
          },
          _count: { select: { compatibilities: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.partCatalogItem.count({ where }),
      normalizedSearch
        ? this.prisma.partCategory.findMany({
            where: {
              isActive: true,
              AND: getPartNameTokens(normalizedSearch).map((token) => ({
                name: { contains: token, mode: 'insensitive' as const },
              })),
              catalogItemMappings: {
                none: { classification: 'INVALID' },
              },
            },
            select: categorySearchSelect,
            take: 10,
          })
        : Promise.resolve([] as CategorySearchRow[]),
    ]);
    const mappedIds = categoryRows
      .flatMap((category) => category.catalogItemMappings)
      .map((mapping) => mapping.targetCatalogItem?.id)
      .filter((id): id is string => Boolean(id));
    const missingMappedIds = mappedIds.filter(
      (id) => !foundData.some((item) => item.id === id),
    );
    const mappedData = missingMappedIds.length
      ? await this.prisma.partCatalogItem.findMany({
          where: {
            id: { in: missingMappedIds },
            isActive: true,
            category: { isActive: true },
          },
          include: {
            category: { select: categorySelect },
            compatibilities: {
              include: {
                vehicleGeneration: { select: vehicleGenerationSelect },
              },
              take: 1,
            },
            _count: { select: { compatibilities: true } },
          },
        })
      : [];
    const data = [...foundData, ...mappedData].slice(0, limit);
    const categoryItemCounts = await Promise.all(
      categoryRows.map(async (category) => {
        if (category.catalogItemMappings[0]?.targetCatalogItem) return 1;
        const subtreeIds = await this.getCategorySubtreeIds(category.id);
        return this.prisma.partCatalogItem.count({
          where: {
            categoryId: { in: subtreeIds },
            isActive: true,
            category: { isActive: true },
          },
        });
      }),
    );
    const categoryMatches = categoryRows.map((category, index) => {
      const mapped = category.catalogItemMappings[0]?.targetCatalogItem ?? null;
      return {
        categoryId: category.id,
        name: category.name,
        path: [
          category.parent?.parent?.name,
          category.parent?.name,
          category.name,
        ]
          .filter(Boolean)
          .join(' → '),
        catalogItemCount: categoryItemCounts[index],
        isLegacyCatalogItemCategory: Boolean(mapped),
        mappedCatalogItemId: mapped?.id ?? null,
        mappedCatalogItemName: mapped?.name ?? null,
      };
    });
    return {
      data,
      categoryMatches,
      meta: {
        page,
        limit,
        total: total + mappedData.length,
        totalPages: Math.ceil((total + mappedData.length) / limit),
      },
    };
  }

  async findMatches(options: CatalogSearchOptions) {
    return (await this.search(options)).data;
  }

  private async getCategorySubtreeIds(rootCategoryId: string) {
    const categories = await this.prisma.partCategory.findMany({
      where: { isActive: true },
      select: { id: true, parentId: true },
    });
    const children = new Map<string, string[]>();
    for (const category of categories)
      if (category.parentId)
        children.set(category.parentId, [
          ...(children.get(category.parentId) ?? []),
          category.id,
        ]);
    const result: string[] = [];
    const visit = (id: string) => {
      result.push(id);
      for (const childId of children.get(id) ?? []) visit(childId);
    };
    visit(rootCategoryId);
    return result;
  }
}
